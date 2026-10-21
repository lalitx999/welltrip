"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  UploadCloud,
  Compass,
  ArrowRight,
  ChevronRight,
  Hotel,
} from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { extractErrorMessage } from "@/lib/api/errors";
import { getMyOrders } from "@/lib/api/booking";
import {
  BOOKING_STATUS_LABELS,
} from "@/lib/booking-presentation";
import { formatDateText, formatPriceText } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { BookingStatus, MyOrdersTab } from "@/types/booking";

type FilterTab = "all" | MyOrdersTab;

interface TabOption {
  value: FilterTab;
  label: string;
}

const TAB_OPTIONS: TabOption[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "active", label: "กำลังดำเนินการ" },
  { value: "completed", label: "สำเร็จแล้ว" },
  { value: "cancelled", label: "ยกเลิก / คืนเงิน" },
];

export default function MyBookingsPage() {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);

  const queryStatus = activeTab === "all" ? undefined : activeTab;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["my-bookings", activeTab, page],
    queryFn: () =>
      getMyOrders({
        ...(queryStatus ? { status: queryStatus } : {}),
        page,
        limit: 10,
      }),
  });

  const rows = data?.data ?? [];
  const pagination = data?.meta?.pagination;
  const totalPages = pagination?.total_pages ?? 1;
  const activeCount = rows.filter(
    (b) => b.status === "AWAITING_PAYMENT" || b.status === "CONFIRMED"
  ).length;

  function handleTabChange(nextTab: FilterTab) {
    setActiveTab(nextTab);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        
        {/* 1. Page Header */}
        <div className="space-y-2">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <Link
              href="/home"
              className="hover:text-[#1B2A24] transition-colors"
            >
              หน้าหลัก
            </Link>
            <span className="text-stone-300">/</span>
            <span className="text-[#1B2A24] font-semibold">การจองของฉัน</span>
          </nav>

          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 font-serif">
            คำสั่งซื้อและการจองของฉัน
          </h1>
          <p className="text-stone-500 text-sm">
            ตรวจสอบสถานะการจองโฮมสเตย์ บริการนวดสปา และรายการสั่งซื้อของดีชุมชน
          </p>
        </div>

        {/* 2. Modern Filter Tabs */}
        <div className="border-b border-stone-200/80 flex gap-6 text-sm font-medium overflow-x-auto pt-2 scrollbar-none">
          {TAB_OPTIONS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => handleTabChange(tab.value)}
                className={cn(
                  "pb-3 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border-b-2 font-medium",
                  isActive
                    ? "border-[#1B2A24] text-stone-900 font-bold"
                    : "border-transparent text-stone-500 hover:text-stone-800"
                )}
              >
                <span>{tab.label}</span>
                {tab.value === "active" && activeCount > 0 && (
                  <span className="bg-amber-100 text-[#D97706] text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                    {activeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        {isLoading ? (
          <ListLoading />
        ) : isError ? (
          <ListError
            message={extractErrorMessage(error, t("common.networkError"))}
            onRetry={() => void refetch()}
          />
        ) : rows.length === 0 ? (
          
          /* 4. Inspiring Empty State */
          <div className="rounded-3xl bg-white/90 border border-stone-200/70 p-10 md:p-12 text-center my-8 shadow-xs max-w-xl mx-auto space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-stone-100/90 flex items-center justify-center text-stone-400 border border-stone-200/60 shadow-2xs">
              <Compass className="w-10 h-10 text-stone-400" aria-hidden="true" />
            </div>
            
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-stone-800 font-serif">
                ยังไม่มีประวัติการจองหรือคำสั่งซื้อ
              </h2>
              <p className="text-stone-500 text-sm max-w-md mx-auto leading-relaxed">
                เริ่มต้นวางแผนการพักผ่อน สัมผัสวิถีชีวิต 4 ชนเผ่า และลิ้มลองรสชาติอาหารสุขภาพเมืองศรีสะเกษได้เลยวันนี้
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/hotels"
                className="bg-[#1B2A24] hover:bg-stone-800 text-white px-6 py-3 rounded-xl font-medium shadow-sm transition-all inline-flex items-center gap-2 text-sm"
              >
                <span>สำรวจที่พักและกิจกรรมชุมชน</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        ) : (
          
          /* 3. Rich Order Cards List */
          <div className="space-y-4">
            {rows.map((booking) => {
              const statusKey: BookingStatus = booking.status;
              const isAwaitingPayment = statusKey === "AWAITING_PAYMENT";
              const isConfirmed = statusKey === "CONFIRMED" || statusKey === "COMPLETED";
              const isCancelled = statusKey === "CANCELLED" || statusKey === "PAYMENT_EXPIRED";

              return (
                <div
                  key={booking.id}
                  className="rounded-2xl bg-white border border-stone-200/80 p-5 md:p-6 shadow-xs hover:shadow-md transition-all space-y-4"
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                      <span className="font-mono text-sm font-bold text-[#1B2A24]">
                        {booking.booking_code}
                      </span>
                      <span className="text-stone-300">•</span>
                      <span>ทำรายการเมื่อ {formatDateText(booking.created_at, locale)}</span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isAwaitingPayment && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full px-3 py-1 text-xs font-medium inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>{t(BOOKING_STATUS_LABELS[statusKey]) || "รอแนบสลิปโอนเงิน"}</span>
                        </span>
                      )}

                      {isConfirmed && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full px-3 py-1 text-xs font-medium inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{t(BOOKING_STATUS_LABELS[statusKey]) || "ยืนยันและชำระแล้ว"}</span>
                        </span>
                      )}

                      {isCancelled && (
                        <span className="bg-stone-100 text-stone-600 border border-stone-200 rounded-full px-3 py-1 text-xs font-medium inline-flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-stone-400" />
                          <span>{t(BOOKING_STATUS_LABELS[statusKey]) || "ยกเลิกแล้ว"}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Preview Content */}
                  <div className="flex items-center gap-4 py-1">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-500 shrink-0 overflow-hidden">
                      <Hotel className="w-7 h-7 text-[#D97706]" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="font-serif text-base font-bold text-stone-900 truncate">
                        รายการจอง WellTrip ({booking.booking_code})
                      </h3>
                      <p className="text-xs text-stone-500 line-clamp-1">
                        การจองบริการและสินค้าชุมชนศรีสะเกษ · ชำระผ่าน PromptPay
                      </p>
                      {isAwaitingPayment && booking.expires_at && (
                        <p className="text-xs font-bold text-amber-700 flex items-center gap-1 pt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>หมดเวลาชำระ: {formatDateText(booking.expires_at, locale)}</span>
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0 hidden sm:block">
                      <span className="text-xs text-stone-400 block">ยอดสุทธิ</span>
                      <span className="text-lg font-bold text-[#1B2A24] font-serif">
                        {formatPriceText(booking.net_amount, locale)}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                    <div className="sm:hidden">
                      <span className="text-xs text-stone-400 block">ยอดสุทธิ</span>
                      <span className="text-base font-bold text-[#1B2A24] font-serif">
                        {formatPriceText(booking.net_amount, locale)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 ml-auto">
                      {/* Secondary: Details */}
                      <Link
                        href={`/my-bookings/${booking.id}`}
                        className="border border-stone-200 hover:bg-stone-50 px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Receipt className="w-4 h-4 text-stone-500" />
                        <span>ดูรายละเอียดคำสั่งซื้อ</span>
                      </Link>

                      {/* Primary: Attach Slip (if awaiting payment) */}
                      {isAwaitingPayment && (
                        <Link
                          href={`/checkout/payment/${booking.id}`}
                          className="bg-[#1B2A24] hover:bg-stone-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <UploadCloud className="w-4 h-4 text-amber-300" />
                          <span>แนบสลิปโอนเงิน</span>
                        </Link>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-700 disabled:opacity-40 hover:bg-stone-50 transition-colors"
                >
                  ย้อนกลับ
                </button>
                <span className="text-xs font-bold text-stone-500">
                  หน้า {page} จาก {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-700 disabled:opacity-40 hover:bg-stone-50 transition-colors"
                >
                  ถัดไป
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
