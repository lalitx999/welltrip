"use client";

/**
 * (admin)/admin/approvals/page.tsx - EP 4: Entity Approvals & Catalog Management.
 * Review and approve/reject accommodations, wellness packages, OTOP items, and restaurants.
 * Zero-Emoji Policy: Lucide icons only.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  Building2,
  Sparkles,
  ShoppingBag,
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { formatBaht } from "@/lib/format";
import { extractErrorMessage } from "@/lib/api/errors";
import {
  getPendingApprovals,
  updateEntityApprovalStatus,
  type EntityApprovalItem,
} from "@/lib/api/admin";

type EntityFilterType = "ALL" | "ACCOMMODATION" | "WELLNESS" | "OTOP" | "RESTAURANT";

export default function AdminApprovalsPage() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<EntityFilterType>("ALL");

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
    if (filterType === "ALL") return true;
    return item.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-foreground">
          <CheckSquare className="h-6 w-6 text-forest-900" aria-hidden="true" />
          อนุมัติรายการสถานที่และสินค้า (Entity Approvals)
        </h1>
        <p className="text-xs text-muted-foreground">
          ตรวจสอบความถูกต้องของข้อมูลที่พัก แพ็กเกจสุขภาพ สปา ร้านอาหาร และสินค้าชุมชนก่อนเปิดใช้งาน
        </p>
      </div>

      {/* Tabs / Filters */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setFilterType("ALL")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
            filterType === "ALL"
              ? "bg-forest-900 text-cream-100 shadow-xs"
              : "border border-border/80 bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>ทั้งหมด</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType("ACCOMMODATION")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
            filterType === "ACCOMMODATION"
              ? "bg-forest-900 text-cream-100 shadow-xs"
              : "border border-border/80 bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>ที่พัก & โฮมสเตย์</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType("WELLNESS")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
            filterType === "WELLNESS"
              ? "bg-forest-900 text-cream-100 shadow-xs"
              : "border border-border/80 bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>บริการสุขภาพ & สปา</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType("OTOP")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
            filterType === "OTOP"
              ? "bg-forest-900 text-cream-100 shadow-xs"
              : "border border-border/80 bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>สินค้า OTOP</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType("RESTAURANT")}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
            filterType === "RESTAURANT"
              ? "bg-forest-900 text-cream-100 shadow-xs"
              : "border border-border/80 bg-card text-muted-foreground hover:bg-muted"
          }`}
        >
          <UtensilsCrossed className="h-3.5 w-3.5" />
          <span>ร้านอาหาร</span>
        </button>
      </div>

      {/* Content List */}
      {approvalsQuery.isLoading ? (
        <ListLoading />
      ) : approvalsQuery.isError ? (
        <ListError
          message={extractErrorMessage(approvalsQuery.error, "ไม่สามารถโหลดรายการรออนุมัติได้")}
          onRetry={() => void approvalsQuery.refetch()}
        />
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
          <p className="mt-2 text-sm font-semibold text-foreground">
            ไม่มีรายการรออนุมัติในหมวดหมู่นี้
          </p>
          <p className="text-xs text-muted-foreground">
            รายการใหม่ที่ผู้ประกอบการลงทะเบียนจะแสดงขึ้นในหน้านี้ทันที
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-forest-900/10 px-2.5 py-1 text-[11px] font-bold text-forest-900">
                    {item.type === "ACCOMMODATION" && <Building2 className="h-3.5 w-3.5" />}
                    {item.type === "WELLNESS" && <Sparkles className="h-3.5 w-3.5" />}
                    {item.type === "OTOP" && <ShoppingBag className="h-3.5 w-3.5" />}
                    {item.type === "RESTAURANT" && <UtensilsCrossed className="h-3.5 w-3.5" />}
                    <span>{item.type}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold-700">
                    <Clock className="h-3 w-3" />
                    <span>รอการอนุมัติ</span>
                  </span>
                </div>

                <div>
                  <h3 className="font-serif text-base font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    ผู้ประกอบการ: {item.owner_name} ({item.owner_email})
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    จังหวัด: {item.province}
                  </p>
                  {item.price > 0 && (
                    <p className="mt-2 font-serif text-sm font-bold text-forest-900">
                      ราคาเริ่มต้น {formatBaht(item.price)}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center gap-2 border-t border-border/60 pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRejectingItem(item)}
                  className="flex-1 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>ปฏิเสธ</span>
                </Button>

                <Button
                  size="sm"
                  onClick={() =>
                    approvalMutation.mutate({
                      id: item.id,
                      status: "APPROVED",
                    })
                  }
                  disabled={approvalMutation.isPending}
                  className="flex-1 gap-1 bg-emerald-800 text-cream-100 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>อนุมัติ</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-card p-6 shadow-xl border border-border">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              <h3 className="font-serif text-lg font-bold text-foreground">
                ปฏิเสธการลงทะเบียน
              </h3>
            </div>

            <p className="text-xs text-muted-foreground">
              รายการ: <strong>{rejectingItem.title}</strong>
            </p>

            <div className="space-y-1.5">
              <label htmlFor="rejection-reason" className="text-xs font-semibold">
                ระบุเหตุผลที่ปฏิเสธ (Rejection Reason)
              </label>
              <textarea
                id="rejection-reason"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="เช่น เอกสารประกอบการลงทะเบียนไม่ชัดเจน หรือ ข้อมูลสถานที่ตั้งไม่ครบถ้วน..."
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingItem(null)}
                disabled={approvalMutation.isPending}
              >
                ยกเลิก
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() =>
                  approvalMutation.mutate({
                    id: rejectingItem.id,
                    status: "REJECTED",
                    reason: rejectionReason,
                  })
                }
                disabled={approvalMutation.isPending}
              >
                {approvalMutation.isPending ? "กำลังบันทึก..." : "ยืนยันการปฏิเสธ"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
