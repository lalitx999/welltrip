"use client";

/**
 * (mobile-tourist)/my-bookings/[id]/page.tsx - digital voucher: one booking +
 * its item snapshots + payment state (+ uploaded slips when available).
 *
 * Data flow: BookingDetail carries payment.id but NOT the slip list, so once we
 * know the payment id we make one extra call to GET /payments/{id}/ for the
 * slip previews. Snapshot rows are immutable history - the values shown are
 * what the customer actually paid, regardless of later price changes.
 */
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Receipt } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/api/errors";
import { getBookingDetail, getPaymentDetail } from "@/lib/api/booking";
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_STYLES,
} from "@/lib/booking-presentation";
import {
  formatDateText,
  formatDateTimeText,
  formatPriceText,
} from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function BookingDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams<{ id: string }>();
  const bookingId = params?.id ?? "";

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["booking-detail", bookingId],
    enabled: bookingId.length > 0,
    queryFn: () => getBookingDetail(bookingId),
  });

  const booking = data?.data;

  // Payment detail (slip previews) - only when the booking has a payment.
  const paymentId = booking?.payment?.id;
  const paymentQuery = useQuery({
    queryKey: ["booking-payment", paymentId],
    enabled: Boolean(paymentId),
    queryFn: () => getPaymentDetail(paymentId as string),
  });
  const payment = paymentQuery.data?.data;

  if (isLoading) {
    return (
      <div className="px-4 pb-8 pt-5">
        <ListLoading />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="space-y-5 px-4 pb-8 pt-5">
        <BackLink />
        <ListError
          message={extractErrorMessage(error, t("common.networkError"))}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const awaitingPayment =
    booking.status === "AWAITING_PAYMENT" && booking.payment;

  function BackLink() {
    return (
      <Link
        href="/my-bookings"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("order.myBookings")}
      </Link>
    );
  }

  return (
    <div className="space-y-5 px-4 pb-8 pt-5">
      <BackLink />

      {/* Voucher header */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-sm font-bold text-card-foreground">
            {booking.booking_code}
          </h1>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              BOOKING_STATUS_STYLES[booking.status],
            )}
          >
            {t(BOOKING_STATUS_LABELS[booking.status])}
          </span>
        </div>
        <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
          <p>
            {t("order.createdOn", {
              date: formatDateTimeText(booking.created_at, locale),
            })}
          </p>
          {booking.status === "AWAITING_PAYMENT" && (
            <p className="text-amber-700">
              {t("order.expiresOn", {
                time: formatDateTimeText(booking.expires_at, locale),
              })}
            </p>
          )}
        </div>
      </section>

      {/* Items */}
      <section>
        <h2 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
          {t("order.itemTitle")}
        </h2>
        <ul className="space-y-2">
          {booking.items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-border bg-card p-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-card-foreground">
                  {item.item_title_snapshot}
                </p>
                <p className="shrink-0 text-sm font-semibold text-primary">
                  {formatPriceText(item.total_price, locale)}
                </p>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                x{item.quantity} ·{" "}
                {formatPriceText(item.unit_price_snapshot, locale)}
              </p>
              {(item.scheduled_date || item.scheduled_end_date) && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDateText(item.scheduled_date, locale)}
                  {item.scheduled_end_date
                    ? ` → ${formatDateText(item.scheduled_end_date, locale)}`
                    : ""}
                  {item.scheduled_time_slot
                    ? ` · ${item.scheduled_time_slot}`
                    : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
      {/* REST */}
      {/* Totals */}
      <section className="space-y-1.5 rounded-xl border border-border bg-card p-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>{t("checkout.subtotal")}</span>
          <span>{formatPriceText(booking.total_subtotal, locale)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>{t("checkout.platformFee")}</span>
          <span>{formatPriceText(booking.platform_fee, locale)}</span>
        </div>
        <div className="flex justify-between pt-1 text-base font-bold text-card-foreground">
          <span>{t("order.totalAmount")}</span>
          <span className="text-primary">
            {formatPriceText(booking.net_amount, locale)}
          </span>
        </div>
      </section>

      {/* Payment / payee */}
      {booking.payment && (
        <section className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("payment.title")}
          </p>
          {booking.payment.payee_account_number || booking.payment.payee_bank ? (
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Account</dt>
                <dd className="font-mono font-semibold text-card-foreground">
                  {booking.payment.payee_account_number}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Bank</dt>
                <dd className="font-medium text-card-foreground">
                  {booking.payment.payee_bank}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("payment.payeePlaceholder")}
            </p>
          )}

          {awaitingPayment && paymentId && (
            <Link href={`/checkout/payment/${paymentId}`} className="mt-3 block">
              <Button className="w-full">{t("order.payNow")}</Button>
            </Link>
          )}
        </section>
      )}

      {/* Uploaded slips (from payment detail) */}
      {payment && payment.slips.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Slips
          </h2>
          <ul className="space-y-2">
            {payment.slips.map((slip) => (
              <li
                key={slip.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slip.image}
                  alt={slip.original_filename}
                  className="h-14 w-14 shrink-0 rounded-lg object-cover"
                />
                <p className="truncate text-xs text-muted-foreground">
                  {slip.original_filename || slip.id}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
