"use client";

/**
 * (mobile-tourist)/cart/page.tsx - shopping cart with Eco-Premium styling.
 */
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";

import { BookingSteps } from "@/components/travel/BookingSteps";
import { Button } from "@/components/ui/button";
import {
  CART_GROUP_LABELS,
  placeholderKindForCartType,
} from "@/lib/booking-presentation";
import { formatPriceText, formatDateText } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { useI18n } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";

export default function CartPage() {
  const { t, locale } = useI18n();
  const groups = useCartStore((s) => s.groupedByCategory());
  const totalPrice = useCartStore((s) => s.totalPrice);
  const itemCount = useCartStore((s) => s.itemCount);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  if (itemCount === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-5 px-6 pt-24 pb-16 text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-forest-900/10 text-forest-800">
          <ShoppingBag className="h-9 w-9" aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-foreground">
            {t("cart.empty")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("cart.emptyHint")}
          </p>
        </div>
        <Link
          href="/hotels"
          className="inline-flex items-center gap-2 rounded-xl bg-forest-900 px-6 py-3 text-sm font-semibold text-cream-100 shadow-md transition-all hover:bg-forest-950"
        >
          <span>{t("cart.browse")}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16 pt-6 sm:px-6">
      <BookingSteps step={0}/>
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <h1 className="flex items-center gap-3 font-serif text-2xl font-bold text-foreground">
          <ShoppingBag className="h-6 w-6 text-forest-800" aria-hidden="true" />
          {t("nav.cart")}
          <span className="rounded-full bg-forest-100 px-3 py-0.5 text-xs font-semibold text-forest-900">
            {itemCount} รายการ
          </span>
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart items list */}
        <div className="space-y-6 lg:col-span-2">
          {groups.map((group) => (
            <section key={group.itemType} className="space-y-3">
              <h2 className="font-serif text-xs font-bold uppercase tracking-wider text-forest-900/70">
                {t(CART_GROUP_LABELS[group.itemType])}
              </h2>
              <ul className="space-y-3">
                {group.items.map((item) => (
                  <li
                    key={`${group.itemType}-${String(item.entity_id)}-${item.checkin_date ?? "-"}-${item.checkout_date ?? "-"}`}
                    className="flex gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:shadow-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayImage(
                        item.image_url,
                        placeholderKindForCartType(item.item_type),
                        String(item.entity_id),
                        200,
                      )}
                      alt={item.title}
                      className="h-20 w-20 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="font-serif text-base font-bold leading-snug text-foreground">
                          {item.title}
                        </p>
                        {item.checkin_date && <p className="wt-muted">{formatDateText(item.checkin_date,locale)} – {formatDateText(item.checkout_date,locale)}</p>}
                        <p className="mt-1 text-sm font-semibold text-forest-800">
                          {formatPriceText(item.unit_price, locale)}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex items-center rounded-xl border border-border/80 bg-cream-50/50">
                          <button
                            type="button"
                            aria-label={locale === "th" ? "ลดจำนวน" : "Decrease quantity"}
                            className="grid h-8 w-8 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                            disabled={item.quantity <= 1}
                            onClick={() =>
                              updateQuantity(
                                item.entity_id,
                                item.item_type,
                                item.quantity - 1,
                                item.checkin_date, item.checkout_date,
                              )
                            }
                          >
                            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={locale === "th" ? "เพิ่มจำนวน" : "Increase quantity"}
                            className="grid h-8 w-8 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                            onClick={() =>
                              updateQuantity(
                                item.entity_id,
                                item.item_type,
                                item.quantity + 1,
                                item.checkin_date, item.checkout_date,
                              )
                            }
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>

                        <button
                          type="button"
                          aria-label={t("cart.remove")}
                          onClick={() => removeItem(item.entity_id, item.item_type, item.checkin_date, item.checkout_date)}
                          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Total Summary Box */}
        <div className="wt-booking-summary h-fit space-y-4 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
          <h2 className="font-serif font-bold text-foreground">สรุปรายการคำสั่งซื้อ</h2>
          <div className="flex items-baseline justify-between border-t border-border/60 pt-4">
            <span className="text-sm text-muted-foreground">{t("cart.total")}</span>
            <span className="font-serif text-2xl font-bold text-forest-900">
              {formatPriceText(totalPrice, locale)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t("cart.estimateNote")}
          </p>
          <Link href="/checkout" className="wt-button w-full"><span>{t("cart.proceed")}</span><ArrowRight size={17}/></Link>
        </div>
      </div>
    </div>
  );
}
