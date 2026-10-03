"use client";

/**
 * (mobile-tourist)/my-bookings/page.tsx - order history with ACTIVE /
 * COMPLETED / CANCELLED tabs.
 *
 * The tabs map 1:1 to the backend's ?status= values (active/completed/
 * cancelled); note "cancelled" also includes PAYMENT_EXPIRED server-side
 * (bookings/views.py _TAB_STATUSES), so an expired order shows up here and its
 * badge still says "Payment expired".
 */
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Receipt } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import type { MessageKey } from "@/i18n/messages";
import { extractErrorMessage } from "@/lib/api/errors";
import { getMyOrders } from "@/lib/api/booking";
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_STYLES,
} from "@/lib/booking-presentation";
import { formatDateTimeText, formatPriceText } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { BookingStatus, MyOrdersTab } from "@/types/booking";

interface TabDef {
  value: MyOrdersTab;
  labelKey: MessageKey;
}

const TABS: TabDef[] = [
  { value: "active", labelKey: "order.tabActive" },
  { value: "completed", labelKey: "order.tabCompleted" },
  { value: "cancelled", labelKey: "order.tabCancelled" },
];

export default function MyBookingsPage() {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<MyOrdersTab>("active");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-bookings", tab, page],
    queryFn: () => getMyOrders({ status: tab, page, limit: 10 }),
  });

  const rows = data?.data ?? [];
  const pagination = data?.meta?.pagination;
  const totalPages = pagination?.total_pages ?? 1;

  function onSelectTab(nextTab: MyOrdersTab) {
    setTab(nextTab);
    setPage(1);
  }

  return (
    <div className="space-y-4 px-4 pb-8 pt-5">
      <h1 className="flex items-center gap-2 text-lg font-bold">
        <Receipt className="h-5 w-5 text-primary" aria-hidden="true" />
        {t("order.myBookings")}
      </h1>

      {/* Tabs */}
      <div
        role="tablist"
        className="flex rounded-full border border-border bg-card p-1"
      >
        {TABS.map(({ value, labelKey }) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={tab === value}
            onClick={() => onSelectTab(value)}
            className={cn(
              "min-h-10 flex-1 rounded-full text-xs font-semibold transition-colors",
              tab === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground",
            )}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <ListLoading />
      ) : isError ? (
        <ListError
          message={extractErrorMessage(error, t("common.networkError"))}
          onRetry={() => void refetch()}
        />
      ) : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t("order.noBookings")}
        </p>
      ) : (
        <>
          <ul className="space-y-3">
            {rows.map((booking) => {
              const statusKey: BookingStatus = booking.status;
              return (
                <li key={booking.id}>
                  <Link
                    href={`/my-bookings/${booking.id}`}
                    className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-card-foreground">
                        {booking.booking_code}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          BOOKING_STATUS_STYLES[statusKey],
                        )}
                      >
                        {t(BOOKING_STATUS_LABELS[statusKey])}
                      </span>
                    </div>
                    <div className="mt-2 flex items-end justify-between">
                      <div className="text-xs text-muted-foreground">
                        <p>{formatDateTimeText(booking.created_at, locale)}</p>
                        {booking.status === "AWAITING_PAYMENT" && booking.expires_at && (
                          <p className="mt-0.5 text-amber-700">
                            {t("order.expiresOn", {
                              time: formatDateTimeText(booking.expires_at, locale),
                            })}
                          </p>
                        )}
                      </div>
                      <p className="flex items-center gap-1 text-sm font-bold text-primary">
                        {formatPriceText(booking.net_amount, locale)}
                        <ChevronRight
                          className="h-4 w-4 text-muted-foreground/60"
                          aria-hidden="true"
                        />
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
