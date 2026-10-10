"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  CheckSquare,
  Clock,
  Filter,
  Search,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import {
  getPendingApprovals,
  updateEntityApprovalStatus,
  type EntityApprovalItem,
} from "@/lib/api/admin";
import { extractErrorMessage } from "@/lib/api/errors";
import { formatBaht } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

type EntityFilterType = "ALL" | "ACCOMMODATION" | "WELLNESS" | "OTOP" | "RESTAURANT";

export default function AdminApprovalsPage() {
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<EntityFilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Rejection modal state
  const [rejectingItem, setRejectingItem] = useState<EntityApprovalItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const approvalsQuery = useQuery({
    queryKey: ["admin-pending-approvals"],
    queryFn: getPendingApprovals,
  });

  const approvalMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: "APPROVED" | "REJECTED";
      reason?: string;
    }) => updateEntityApprovalStatus(id, status, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-pending-approvals"] });
      setRejectingItem(null);
      setRejectionReason("");
    },
  });

  const items = approvalsQuery.data?.data ?? [];

  const filteredItems = items.filter((item) => {
    const matchesFilter =
      filterType === "ALL" ||
      item.type === filterType ||
      (filterType === "ACCOMMODATION" && item.type === "HOMESTAY");
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.owner_name ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const paginatedItems = filteredItems.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-[#D97706] border border-[#D97706]/20">
              <CheckSquare className="h-5 w-5" />
            </div>
            <h1 className="font-serif text-xl font-bold text-[#1B2A24]">
              {locale === "th" ? "อนุมัติรายการสถานที่และสินค้า" : "Entity Approvals"}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {locale === "th"
              ? "ตรวจสอบความถูกต้องของข้อมูลที่พัก แพ็กเกจสุขภาพ สปา ร้านอาหาร และสินค้าชุมชนก่อนอนุมัติเปิดขาย"
              : "Review and verify homestays, spa packages, local dining, and OTOP items before publishing."}
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-3">
          <button
            type="button"
            onClick={() => {
              setFilterType("ALL");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              filterType === "ALL"
                ? "bg-[#1B2A24] text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span>ทั้งหมด</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterType("ACCOMMODATION");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              filterType === "ACCOMMODATION"
                ? "bg-[#1B2A24] text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Building2 className="h-3.5 w-3.5 text-[#D97706]" />
            <span>ที่พัก & โฮมสเตย์</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterType("WELLNESS");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              filterType === "WELLNESS"
                ? "bg-[#1B2A24] text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-[#D97706]" />
            <span>บริการสุขภาพ & สปา</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterType("OTOP");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              filterType === "OTOP"
                ? "bg-[#1B2A24] text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5 text-[#D97706]" />
            <span>สินค้า OTOP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilterType("RESTAURANT");
              setPage(1);
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              filterType === "RESTAURANT"
                ? "bg-[#1B2A24] text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <UtensilsCrossed className="h-3.5 w-3.5 text-[#D97706]" />
            <span>ร้านอาหาร</span>
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="ค้นหาชื่อรายการ หรือชื่อผู้ประกอบการ..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-semibold text-[#1B2A24] outline-none"
          />
        </div>
      </div>

      {/* Main Content List / Table */}
      {approvalsQuery.isLoading ? (
        <ListLoading />
      ) : approvalsQuery.isError ? (
        <ListError
          message={extractErrorMessage(approvalsQuery.error, "ไม่สามารถดึงข้อมูลรายการอนุมัติได้")}
          onRetry={() => void approvalsQuery.refetch()}
        />
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 space-y-2">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
          <p className="text-base font-bold text-[#1B2A24]">ไม่มีรายการที่รอการอนุมัติในขณะนี้</p>
          <p className="text-xs text-slate-400">ทุกรายการได้รับการตรวจสอบและอนุมัติเรียบร้อยแล้ว</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200/80 bg-slate-50/80 font-bold text-[#1B2A24]">
                <tr>
                  <th className="px-4 py-3.5">รายการ (Entity)</th>
                  <th className="px-4 py-3.5">ประเภท</th>
                  <th className="px-4 py-3.5">ผู้ประกอบการ / ชุมชน</th>
                  <th className="px-4 py-3.5">ราคาเริ่มต้น</th>
                  <th className="px-4 py-3.5 text-right">การอนุมัติ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-[#1B2A24]">
                      {item.title}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-[#D97706] border border-[#D97706]/30">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">
                      {item.owner_name}
                    </td>
                    <td className="px-4 py-3.5 font-serif font-bold text-[#1B2A24]">
                      {item.price ? formatBaht(item.price) : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setRejectingItem(item)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          ปฏิเสธ
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            approvalMutation.mutate({
                              id: item.id,
                              status: "APPROVED",
                            })
                          }
                          disabled={approvalMutation.isPending}
                          className="px-3.5 py-1.5 rounded-xl bg-[#1B2A24] text-xs font-semibold text-white hover:bg-[#151d1a] shadow-xs transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>อนุมัติ</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminPagination
            currentPage={page}
            perPage={perPage}
            totalItems={filteredItems.length}
            onPageChange={(p) => setPage(p)}
            onPerPageChange={(pp) => {
              setPerPage(pp);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <XCircle className="h-5 w-5 text-rose-600" />
              <h3 className="font-serif text-lg font-bold text-[#1B2A24]">
                ปฏิเสธรายการ {rejectingItem.title}
              </h3>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="reason" className="text-xs font-bold text-[#1B2A24]">
                เหตุผลที่ไม่ผ่านการอนุมัติ (Rejection Reason)
              </label>
              <textarea
                id="reason"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="ระบุเหตุผลที่ไม่ผ่าน เช่น ข้อมูลภาพไม่ชัดเจน ข้อมูลไม่ครบถ้วน..."
                className="w-full rounded-xl border border-slate-200 bg-[#FAF8F5] p-3 text-xs font-semibold text-[#1B2A24] outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() =>
                  approvalMutation.mutate({
                    id: rejectingItem.id,
                    status: "REJECTED",
                    reason: rejectionReason,
                  })
                }
                disabled={approvalMutation.isPending}
                className="py-2.5 px-5 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 shadow-sm"
              >
                {approvalMutation.isPending ? "กำลังบันทึก..." : "ยืนยันการปฏิเสธ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
