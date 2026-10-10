"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  QrCode,
  Receipt,
  Search,
  X,
  XCircle,
  Building2,
  Calendar,
  Phone,
  User,
} from "lucide-react";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { useAuth } from "@/hooks/use-auth";
import {
  getPendingPayments,
  MEDIA_BASE_URL,
  verifyPaymentSlip,
  type PaymentAuditItem,
} from "@/lib/api/admin";
import { extractErrorMessage } from "@/lib/api/errors";
import { formatBaht } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export default function AdminPaymentsPage() {
  const { locale } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const allowed =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "COMMUNITY_ADMIN" ||
    Boolean(user?.is_superuser);

  const [selectedPayment, setSelectedPayment] = useState<PaymentAuditItem | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const paymentsQuery = useQuery({
    queryKey: ["admin-pending-payments"],
    queryFn: getPendingPayments,
    enabled: allowed,
  });

  const verifyMutation = useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status: "VERIFIED" | "REJECTED";
      note?: string;
    }) => verifyPaymentSlip(id, status, note),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-pending-payments"] });
      setSelectedPayment(null);
      setRejectNote("");
    },
  });

  if (!allowed) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 font-medium">
        เฉพาะผู้ดูแลระบบสูงสุดเท่านั้น (Super Admin Only)
      </div>
    );
  }

  const allPayments: PaymentAuditItem[] = Array.isArray(paymentsQuery.data?.data)
    ? paymentsQuery.data.data
    : [];

  // Defensive Filter & Search Logic
  const filteredPayments = allPayments.filter((p) => {
    if (!p) return false;
    const ref = (p.booking_reference ?? "").toString().toLowerCase();
    const name = (p.customer_name ?? "").toString().toLowerCase();
    const phone = (p.customer_phone ?? "").toString();
    const query = (searchQuery ?? "").toLowerCase();

    const matchesSearch =
      ref.includes(query) || name.includes(query) || phone.includes(searchQuery);
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Client-side pagination slice
  const paginatedPayments = filteredPayments.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-[#D97706] border border-[#D97706]/20">
              <Receipt className="h-5 w-5" />
            </div>
            <h1 className="font-serif text-xl font-bold text-[#1B2A24]">
              {locale === "th" ? "ตรวจสอบสลิปการชำระเงิน" : "Payment Slip Audit"}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {locale === "th"
              ? "ตรวจสอบความถูกต้องของสลิปโอนเงินผ่านระบบ PromptPay / Bank Transfer และอนุมัติการชำระเงิน"
              : "Audit PromptPay bank transfer slips and verify traveler payment proofs."}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder={
              locale === "th"
                ? "ค้นหารหัสการจอง (WT-XXXX), ชื่อผู้ชำระเงิน หรือเบอร์โทร..."
                : "Search booking code (WT-XXXX), name or phone..."
            }
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-slate-200/80 rounded-xl text-xs font-semibold text-[#1B2A24] outline-none focus:ring-2 focus:ring-[#D97706]/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto py-2.5 px-3 rounded-xl border border-slate-200/80 bg-[#FAF8F5] text-xs font-semibold text-[#1B2A24] outline-none cursor-pointer"
          >
            <option value="ALL">{locale === "th" ? "ทุกสถานะ" : "All Statuses"}</option>
            <option value="PENDING">{locale === "th" ? "รอตรวจสอบ (Pending)" : "Pending Verification"}</option>
            <option value="VERIFIED">{locale === "th" ? "อนุมัติแล้ว (Verified / Confirmed)" : "Verified"}</option>
            <option value="REJECTED">{locale === "th" ? "ปฏิเสธสลิป (Rejected)" : "Rejected"}</option>
          </select>
        </div>
      </div>

      {/* Table Data View */}
      {paymentsQuery.isLoading ? (
        <ListLoading />
      ) : paymentsQuery.isError ? (
        <ListError
          message={extractErrorMessage(paymentsQuery.error, "ไม่สามารถโหลดข้อมูลรายการชำระเงินได้")}
          onRetry={() => void paymentsQuery.refetch()}
        />
      ) : filteredPayments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 space-y-2">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <p className="text-base font-bold text-[#1B2A24]">
            {locale === "th" ? "ไม่พบสลิปชำระเงินที่ต้องตรวจสอบ" : "No pending payment slips"}
          </p>
          <p className="text-xs text-slate-400">
            {locale === "th" ? "ทุกรายการได้รับการยืนยันหรือระบุเงื่อนไขค้นหาไม่พบข้อมูล" : "No payment slip records match your filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200/80 bg-slate-50/80 font-bold text-[#1B2A24]">
                  <tr>
                    <th className="px-4 py-3.5">รหัสการจอง</th>
                    <th className="px-4 py-3.5">ผู้ชำระเงิน (Guest)</th>
                    <th className="px-4 py-3.5">ยอดชำระ</th>
                    <th className="px-4 py-3.5">ช่องทางชำระเงิน</th>
                    <th className="px-4 py-3.5">วันที่โอน</th>
                    <th className="px-4 py-3.5">สถานะ</th>
                    <th className="px-4 py-3.5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedPayments.map((p) => {
                    const isVerified = p.status === "VERIFIED" || p.status === "CONFIRMED";
                    const isRejected = p.status === "REJECTED";
                    const formattedDate = p.created_at
                      ? new Date(p.created_at).toLocaleString("th-TH", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—";

                    const cleanBookingRef = (p.booking_reference ?? "").toString().replace(/^WT-?/i, "");

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-[#1B2A24]">
                          WT-{cleanBookingRef || "—"}
                        </td>
                        <td className="px-4 py-3.5 text-[#1B2A24]">
                          <div className="font-bold flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{p.customer_name || "นักท่องเที่ยว WellTrip"}</span>
                          </div>
                          {p.customer_phone && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                              <Phone className="h-3 w-3" />
                              <span>{p.customer_phone}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-serif font-bold text-[#1B2A24] text-sm">
                          {formatBaht(p.amount ?? 0)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-[#1B2A24] bg-amber-50/60 px-2.5 py-1 rounded-lg border border-[#D97706]/20">
                            <Building2 className="h-3.5 w-3.5 text-[#D97706]" />
                            <span>ธนาคารกสิกรไทย (PromptPay)</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            <span>{formattedDate}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          {isVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>อนุมัติแล้ว</span>
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-600 border border-rose-200">
                              <XCircle className="h-3.5 w-3.5" />
                              <span>ปฏิเสธสลิป</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-[#D97706] border border-[#D97706]/30 animate-pulse">
                              <Clock className="h-3.5 w-3.5" />
                              <span>รอตรวจสอบ</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedPayment(p)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#1B2A24] hover:bg-[#1B2A24] hover:text-white transition-all shadow-xs"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>ดูสลิป & ตรวจสอบ</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reusable Bottom Pagination */}
          <AdminPagination
            currentPage={page}
            totalItems={filteredPayments.length}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(newPerPage) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* Slip Modal Preview & Inspection Dialog */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-[#D97706]" />
                <h3 className="font-serif font-bold text-base text-[#1B2A24]">
                  ตรวจสอบหลักฐานการโอนเงิน (WT-{(selectedPayment.booking_reference ?? "").toString().replace(/^WT-?/i, "")})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPayment(null);
                  setRejectNote("");
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-[#1B2A24] hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Slip Image & Details Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* High-res Image Box */}
                <div className="space-y-2">
                  <p className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                    รูปภาพสลิปโอนเงิน
                  </p>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center min-h-[320px] max-h-[420px]">
                    {selectedPayment.slip_image_url ? (
                      <img
                        src={
                          selectedPayment.slip_image_url.startsWith("http")
                            ? selectedPayment.slip_image_url
                            : `${MEDIA_BASE_URL}${selectedPayment.slip_image_url}`
                        }
                        alt="สลิปการโอนเงิน"
                        className="w-full h-full object-contain max-h-[400px]"
                      />
                    ) : (
                      <div className="p-6 text-center space-y-2 text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto text-amber-500" />
                        <p className="text-xs font-semibold">ไม่มีไฟล์สลิปแนบมา</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking & Payment Metadata */}
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                    <p className="font-bold text-slate-500">สรุปยอดชำระเงิน</p>
                    <p className="font-serif font-bold text-2xl text-[#1B2A24]">
                      {formatBaht(selectedPayment.amount ?? 0)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      ช่องทาง: ธนาคารกสิกรไทย (PromptPay QR)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-semibold">ผู้สั่งซื้อ / Guest:</span>
                      <span className="font-bold text-[#1B2A24]">
                        {selectedPayment.customer_name || "นักท่องเที่ยว"}
                      </span>
                    </div>
                    {selectedPayment.customer_phone && (
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 font-semibold">เบอร์โทรศัพท์:</span>
                        <span className="font-mono font-bold text-[#1B2A24]">
                          {selectedPayment.customer_phone}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-semibold">รหัสอ้างอิงการจอง:</span>
                      <span className="font-mono font-bold text-[#1B2A24]">
                        WT-{(selectedPayment.booking_reference ?? "").toString().replace(/^WT-?/i, "")}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500 font-semibold">สถานะปัจจุบัน:</span>
                      <span className="font-bold text-[#D97706]">{selectedPayment.status}</span>
                    </div>
                  </div>

                  {/* Optional Rejection Reason */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ระบุเหตุผลในการปฏิเสธสลิป (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                      placeholder="เช่น จำนวนเงินไม่ตรง, รูปภาพสลิปไม่ชัดเจน..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={verifyMutation.isPending}
                  onClick={() =>
                    verifyMutation.mutate({
                      id: selectedPayment.id,
                      status: "REJECTED",
                      note: rejectNote,
                    })
                  }
                  className="w-1/2 py-3 px-4 rounded-xl border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{verifyMutation.isPending ? "กำลังบันทึก..." : "ปฏิเสธสลิป"}</span>
                </button>

                <button
                  type="button"
                  disabled={verifyMutation.isPending}
                  onClick={() =>
                    verifyMutation.mutate({
                      id: selectedPayment.id,
                      status: "VERIFIED",
                    })
                  }
                  className="w-1/2 py-3 px-4 rounded-xl bg-[#1B2A24] text-white font-bold hover:bg-[#151d1a] shadow-sm flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{verifyMutation.isPending ? "กำลังอนุมัติ..." : "อนุมัติการชำระเงิน"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
