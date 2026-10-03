"use client";

/**
 * (mobile-tourist)/checkout/page.tsx - order summary + confirm with Eco-Premium styling.
 */
import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, Loader2, ReceiptText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ListError } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { extractErrorMessage } from "@/lib/api/errors";
import { checkout } from "@/lib/api/booking";
import { CART_GROUP_LABELS } from "@/lib/booking-presentation";
import { formatDateText, formatPriceText } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { rememberPendingPayment } from "@/lib/pending-payment";
import { useCartStore } from "@/store/cart-store";

export default function CheckoutPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { status, login } = useAuth();
  const groups = useCartStore((s) => s.groupedByCategory());
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);
  const toCheckoutPayload = useCartStore((s) => s.toCheckoutPayload);
  const idempotencyKeyRef = useRef<string>("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
      idempotencyKeyRef.current = window.crypto.randomUUID();
    } else {
      idempotencyKeyRef.current = `wt-${Date.now()}`;
    }
  }, []);

  const mutation = useMutation({
    mutationFn: () => checkout(toCheckoutPayload(), idempotencyKeyRef.current),
    onSuccess: (res) => {
      const { payment_id, expires_at, net_amount, booking_code } = res.data;
      rememberPendingPayment(payment_id, {
        expires_at,
        amount: net_amount,
        booking_code,
      });
      clearCart();
      router.replace(`/checkout/payment/${payment_id}`);
    },
  });

  const showGuestGate = status !== "authenticated";

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 pb-16 pt-6 sm:px-6">
      <div className="flex items-center gap-3 border-b border-border/60 pb-4">
        <ReceiptText className="h-6 w-6 text-forest-800" aria-hidden="true" />
        <h1 className="font-serif text-2xl font-bold text-foreground">
          {t("checkout.title")} (Order Confirmation)
        </h1>
      </div>

      {showGuestGate ? (
        <div className="rounded-2xl border border-gold-500/30 bg-cream-50/60 p-8 text-center shadow-sm">
          <AlertCircle
            className="mx-auto h-10 w-10 text-gold-600"
            aria-hidden="true"
          />
          <h2 className="mt-3 font-serif text-lg font-bold text-foreground">กรุณาเข้าสู่ระบบก่อนทำการจอง</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("checkout.needLogin")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={async () => {
                try {
                  await login("tourist@welltrip.com", "tourist1234");
                } catch (e) {
                  console.error(e);
                }
              }}
              className="rounded-xl bg-forest-900 hover:bg-forest-800 text-cream-50 px-6 font-semibold shadow-md"
            >
              ⚡ เข้าสู่ระบบในนาม นักท่องเที่ยว (tourist@welltrip.com)
            </Button>
            <Link href="/login">
              <Button variant="outline" className="rounded-xl px-6 font-semibold border-border/80">{t("profile.goLogin")}</Button>
            </Link>
          </div>
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center">
          <p className="text-base font-medium text-muted-foreground">
            {t("checkout.empty")}
          </p>
        </div>
      ) : (
        <>
          {/* Order summary by category */}
          <div className="space-y-6">
            {groups.map((group) => (
              <section key={group.itemType} className="space-y-3">
                <h2 className="font-serif text-xs font-bold uppercase tracking-wider text-forest-900/70">
                  {t(CART_GROUP_LABELS[group.itemType])}
                </h2>
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li
                      key={`${group.itemType}-${String(item.entity_id)}`}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-serif text-base font-bold text-foreground">
                          {item.title}
                        </p>
                        {item.item_type === "ROOM_RESERVATION" &&
                          item.checkin_date && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatDateText(item.checkin_date, locale)} →{" "}
                              {formatDateText(item.checkout_date, locale)}
                            </p>
                          )}
                        <p className="mt-1 text-xs font-semibold text-muted-foreground">
                          จำนวน: {item.quantity} รายการ
                        </p>
                      </div>
                      <p className="shrink-0 font-serif text-lg font-bold text-forest-900">
                        {formatPriceText(item.unit_price * item.quantity, locale)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Totals + confirm */}
          <section className="space-y-3 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t("checkout.subtotal")}</span>
              <span className="font-semibold">{formatPriceText(totalPrice, locale)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t("checkout.platformFee")}</span>
              <span className="font-semibold">{formatPriceText(0, locale)}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-border/60 pt-3 text-lg font-bold text-foreground">
              <span className="font-serif">{t("checkout.net")}</span>
              <span className="font-serif text-2xl text-forest-900">
                {formatPriceText(totalPrice, locale)}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-2 rounded-xl bg-forest-50/60 p-3 text-xs text-forest-900 font-medium">
              <ShieldCheck className="h-4 w-4 text-forest-700 shrink-0" />
              <span>การชำระเงินของคุณปลอดภัย ได้รับการคุ้มครองตามมาตรฐาน WellTrip</span>
            </div>
          </section>

          {mutation.isError && (
            <ListError
              message={extractErrorMessage(
                mutation.error,
                t("common.networkError"),
              )}
              onRetry={() => mutation.mutate()}
            />
          )}

          <Button
            className="w-full justify-center rounded-xl py-3.5 font-semibold text-base shadow-md"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            )}
            {mutation.isPending
              ? t("checkout.confirming")
              : t("checkout.confirm")}
          </Button>
        </>
      )}
    </div>
  );
}

