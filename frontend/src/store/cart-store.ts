/**
 * store/cart-store.ts - global cart (Zustand + persist/localStorage).
 *
 * WHY Zustand for the cart (spec): the cart is read by many surfaces - the
 * catalog "add to cart" buttons, the bottom-nav badge, /cart, /checkout -
 * so it is app-global client state. TanStack Query is deliberately NOT used:
 * the cart is local UI state, not a server cache.
 *
 * WHY persist: a tourist picks hotels/food/wellness/OTOP across several pages;
 * losing the cart on a refresh would be unacceptable UX.
 *
 * Design decisions (review carefully - R1):
 *  1. Single source of truth is `items`. totalPrice / itemCount are ALWAYS
 *     recomputed from items after each mutation (never stored independently),
 *     and the persisted payload keeps ONLY items - so a schema change in the
 *     totals can never leave stale data behind.
 *  2. Dedupe key = item_type + entity_id + (room) date range. Adding the same
 *     line again INCREMENTS quantity instead of creating a duplicate row.
 *  3. removeItem/updateQuantity take (entityId, itemType) per the agreed
 *     Module-2 interface. Caveat: if two room lines for the SAME room+type
 *     with DIFFERENT dates existed, both would be matched. Phase-1 flows keep
 *     one stay per room per cart, so this is documented, not fixed.
 *  4. entity_id is never coerced here: number stays number (WELLNESS_SESSION),
 *     UUID stays string - toCheckoutPayload() preserves exactly what the
 *     backend expects (C3 §3.2).
 *  5. Grouping (Q3 decision): public serializers do not expose vendor/owner
 *     info yet, so groupedByCategory() groups by item_type. When the backend
 *     adds vendor fields, extend this store (and the page) to group by
 *     vendor_id without touching the persisted shape.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CartItem, CartItemPayload, CartItemType } from "@/types/booking";

/** One display group: all lines of the same category (see file header #5). */
export interface CartGroup {
  itemType: CartItemType;
  items: CartItem[];
}

export interface CartStoreState {
  items: CartItem[];
  /** Derived - sum(quantity * unit_price) rounded to 2dp (display estimate). */
  totalPrice: number;
  /** Derived - sum of all quantities (badge count). */
  itemCount: number;

  addItem: (item: CartItem) => void;
  removeItem: (
    entityId: string | number,
    itemType: CartItemType,
    checkinDate?: string,
    checkoutDate?: string,
  ) => void;
  updateQuantity: (
    entityId: string | number,
    itemType: CartItemType,
    quantity: number,
    checkinDate?: string,
    checkoutDate?: string,
  ) => void;
  clearCart: () => void;

  groupedByCategory: () => CartGroup[];
  toCheckoutPayload: () => CartItemPayload[];
}


/* ------------------------------------------------------------------ */
/* Pure helpers (kept outside the store for unit-testability)          */
/* ------------------------------------------------------------------ */

/** 2-dp rounding for money math done in JS floats. */
function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Identity of one cart line. Rooms are distinguished by their date range
 * (a room on different nights is a different reservation); non-room lines
 * never carry dates so the two trailing parts are both "-".
 */
function lineKey(
  item: Pick<CartItem, "item_type" | "entity_id" | "checkin_date" | "checkout_date">,
): string {
  return [
    item.item_type,
    String(item.entity_id),
    item.checkin_date ?? "-",
    item.checkout_date ?? "-",
  ].join("::");
}

function calcTotalPrice(items: CartItem[]): number {
  return roundMoney(
    items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0),
  );
}

function calcItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Recompute the derived totals whenever `items` changes. */
function withTotals(items: CartItem[]) {
  return { items, totalPrice: calcTotalPrice(items), itemCount: calcItemCount(items) };
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set, get) => ({
      items: [],
      totalPrice: 0,
      itemCount: 0,

      /**
       * Add one line. Merges into an existing identical line (same key) by
       * increasing its quantity; otherwise appends. Invalid items (bad
       * quantity / price) are ignored - the store never accepts garbage.
       */
      addItem: (item) => {
        if (
          !item ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          !Number.isFinite(item.unit_price) ||
          item.unit_price < 0
        ) {
          return;
        }
        set((state) => {
          const key = lineKey(item);
          const index = state.items.findIndex(
            (existing) => lineKey(existing) === key,
          );
          const items = state.items.slice();
          if (index >= 0) {
            items[index] = {
              ...items[index],
              quantity: items[index].quantity + item.quantity,
            };
          } else {
            items.push(item);
          }
          return withTotals(items);
        });
      },

      /** Remove matching lines (supports date range differentiation for rooms). */
      removeItem: (entityId, itemType, checkinDate, checkoutDate) => {
        set((state) => {
          const items = state.items.filter((item) => {
            const matchBasic =
              item.item_type === itemType &&
              String(item.entity_id) === String(entityId);
            if (!matchBasic) {
              return true;
            }
            if (checkinDate && checkoutDate) {
              return !(
                item.checkin_date === checkinDate &&
                item.checkout_date === checkoutDate
              );
            }
            return false;
          });
          if (items.length === state.items.length) {
            return {};
          }
          return withTotals(items);
        });
      },

      /**
       * Set the quantity of matching lines. Quantities below 1 are rejected -
       * removing is done via removeItem instead.
       */
      updateQuantity: (entityId, itemType, quantity, checkinDate, checkoutDate) => {
        if (!Number.isInteger(quantity) || quantity < 1) {
          return;
        }
        set((state) => {
          const items = state.items.map((item) => {
            const matchBasic =
              item.item_type === itemType &&
              String(item.entity_id) === String(entityId);
            const matchDate =
              checkinDate && checkoutDate
                ? item.checkin_date === checkinDate &&
                  item.checkout_date === checkoutDate
                : true;
            return matchBasic && matchDate ? { ...item, quantity } : item;
          });
          const changed = items.some((item, index) => item !== state.items[index]);
          if (!changed) {
            return {};
          }
          return withTotals(items);
        });
      },

      /** Empty the cart (e.g. after a successful checkout). */
      clearCart: () => set({ items: [], totalPrice: 0, itemCount: 0 }),

      /**
       * Cart lines grouped by category for display. Order follows insertion
       * order of the first item of each type (stable enough for Phase 1).
       */
      groupedByCategory: () => {
        const groups: CartGroup[] = [];
        for (const item of get().items) {
          let group = groups.find((g) => g.itemType === item.item_type);
          if (!group) {
            group = { itemType: item.item_type, items: [] };
            groups.push(group);
          }
          group.items.push(item);
        }
        return groups;
      },

      /**
       * The exact payload POST /bookings/checkout/ accepts. Every stored line
       * becomes one payload entry; entity_id keeps its original type and date
       * keys are only included when present (rooms).
       */
      toCheckoutPayload: () =>
        get().items.map(
          ({ item_type, entity_id, quantity, checkin_date, checkout_date }) => {
            const payload: CartItemPayload = { item_type, entity_id, quantity };
            if (checkin_date) {
              payload.checkin_date = checkin_date;
            }
            if (checkout_date) {
              payload.checkout_date = checkout_date;
            }
            return payload;
          },
        ),
    }),
    {
      name: "wt_cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Persist ONLY the items; totals are recomputed on rehydrate via merge.
      partialize: (state) => ({ items: state.items }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as { items?: CartItem[] } | undefined;
        const items = Array.isArray(persisted?.items) ? persisted.items : [];
        return { ...currentState, ...withTotals(items) };
      },
    },
  ),
);
