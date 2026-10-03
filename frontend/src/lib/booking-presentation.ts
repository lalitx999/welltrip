/**
 * lib/booking-presentation.ts - display helpers shared by cart / checkout /
 * my-bookings pages: status labels+colours and per-item-type thumbnail kinds.
 *
 * WHY centralised: the same 5 booking statuses, 4 item types and slip statuses
 * are shown on several pages; inline ternaries everywhere would drift. Tailwind
 * classes are written FULLY in the map so the JIT compiler keeps them.
 */
import type { MessageKey } from "@/i18n/messages";
import type { PlaceholderKind } from "@/lib/images";
import type {
  BookingStatus,
  CartItemType,
  PaymentSlipStatus,
} from "@/types/booking";

/** Category heading + bottom-nav wording per cart line type. */
export const CART_GROUP_LABELS: Record<CartItemType, MessageKey> = {
  ROOM_RESERVATION: "catalog.groupHotels",
  FOOD_ORDER: "catalog.groupFoods",
  WELLNESS_SESSION: "catalog.groupWellness",
  OTOP_GOODS: "catalog.groupOtop",
};

/** Which Unsplash fallback kind fits a cart line type (for thumbnails). */
export function placeholderKindForCartType(type: CartItemType): PlaceholderKind {
  switch (type) {
    case "ROOM_RESERVATION":
      return "room";
    case "FOOD_ORDER":
      return "food";
    case "WELLNESS_SESSION":
      return "wellness";
    case "OTOP_GOODS":
      return "otop";
  }
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, MessageKey> = {
  AWAITING_PAYMENT: "order.awaitingPayment",
  CONFIRMED: "order.confirmed",
  COMPLETED: "order.completed",
  CANCELLED: "order.cancelled",
  PAYMENT_EXPIRED: "order.paymentExpired",
};

/** Badge colours per booking status (static classes - do not template). */
export const BOOKING_STATUS_STYLES: Record<BookingStatus, string> = {
  AWAITING_PAYMENT: "bg-amber-100 text-amber-900",
  CONFIRMED: "bg-sky-100 text-sky-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-700",
  PAYMENT_EXPIRED: "bg-red-100 text-red-700",
};

export const SLIP_STATUS_LABELS: Record<PaymentSlipStatus, MessageKey> = {
  PENDING_CHECK: "payment.slipPending",
  VERIFIED: "payment.slipVerified",
  REJECTED: "payment.slipRejected",
};
