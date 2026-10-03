"use client";

/**
 * (admin)/admin/payments/page.tsx - EP 5: Booking & Payment Verification System.
 * Audit PromptPay QR slips and verify payment statuses.
 * Zero-Emoji Policy: Lucide icons only.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  CreditCard,
  AlertCircle,
  QrCode,
} from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { formatBaht } from "@/lib/format";
import { extractErrorMessage } from "@/lib/api/errors";
import {
  getPendingPayments,
  verifyPaymentSlip,
  MEDIA_BASE_URL,
  type PaymentAuditItem,
} from "@/lib/api/admin";

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<PaymentAuditItem | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const paymentsQuery = useQuery({
    queryKey: ["admin-pending-payments"],
    queryFn: getPendingPayments,
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

  const payments = paymentsQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-foreground">
          <Receipt className="h-6 w-6 text-forest-900" aria-hidden="true" />
          ตรวจสอบสลิปและการชำระเงิน (Booking & Payment Verification)
        </h1>
        <p className="text-xs text-muted-foreground">
          ตรวจสอบความถูกต้องของสลิปการโอนเงินผ่าน PromptPay QR และสถานะการชำระเงินจาก Payment Gateway
        </p>
      </div>

      {/* Payment Audit List Table */}
      {paymentsQuery.isLoading ? (
        <ListLoading />
      ) : paymentsQuery.isError ? (
        <ListError
          message={extractErrorMessage(paymentsQuery.error, "ไม่สามารถดึงข้อมูลรายการชำระเงินได้")}
          onRetry={() => void paymentsQuery.refetch()}
        />
      ) : payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
          <p className="mt-2 text-sm font-semibold text-foreground">
            ไม่มีสลิปชำระเงินที่รอการตรวจสอบ
          </p>
          <p className="text-xs text-muted-foreground">
            ทุกรายการชำระเงินได้รับการยืนยันเรียบร้อยแล้ว
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">รหัสอ้างอิงการจอง</th>
                <th className="px-4 py-3">ผู้ชำระเงิน</th>
                <th className="px-4 py-3">ช่องทางชำระ</th>
                <th className="px-4 py-3">ยอดเงิน (Amount)</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-right">สลิป / การอนุมัติ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono font-bold text-foreground">
                    #{p.booking_reference}
                  </td>
                  <td className="px-4 py-3 text-foreground font-medium">
                    {p.customer_name}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-forest-900">
                      {p.payment_method === "PROMPTPAY" ? (
                        <>
                          <QrCode className="h-3.5 w-3.5 text-forest-800" />
                          <span>PromptPay QR</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-3.5 w-3.5 text-gold-700" />
                          <span>Credit Card</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-serif font-bold text-foreground">
                    {formatBaht(p.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-gold-500/10 px-2 py-0.5 text-[11px] font-bold text-gold-700">
                      <Clock className="h-3 w-3" />
                      <span>{p.status}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPayment(p)}
                      className="gap-1.5 text-xs border-forest-900/30 text-forest-900 hover:bg-forest-900/10"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>ดูสลิป & ตรวจสอบ</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slip Audit & Verification Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg space-y-4 rounded-2xl bg-card p-6 shadow-xl border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-forest-900" />
                <h3 className="font-serif text-lg font-bold">
                  ตรวจสอบสลิปชำระเงิน #{selectedPayment.booking_reference}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <p>
                <strong>ลูกค้า:</strong> {selectedPayment.customer_name}
              </p>
              <p>
                <strong>ยอดเงิน:</strong>{" "}
                <span className="font-bold text-forest-900">
                  {formatBaht(selectedPayment.amount)}
                </span>
              </p>
            </div>

            {/* Slip Image Container */}
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-4 min-h-[220px]">
              {selectedPayment.slip_image_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={
                    selectedPayment.slip_image_url.startsWith("http")
                      ? selectedPayment.slip_image_url
                      : `${MEDIA_BASE_URL}${selectedPayment.slip_image_url}`
                  }
                  alt={`สลิปชำระเงิน ${selectedPayment.booking_reference}`}
                  className="max-h-72 w-auto rounded-lg shadow-sm object-contain"
                />
              ) : (
                <div className="text-center text-xs text-muted-foreground space-y-1">
                  <AlertCircle className="mx-auto h-8 w-8 text-gold-600" />
                  <p className="font-semibold">ไม่มีรูปภาพสลิปที่แนบมา</p>
                  <p className="text-[11px]">รายการนี้เป็นการชำระเงินอัตโนมัติผ่าน Omise Gateway</p>
                </div>
              )}
            </div>

            {/* Rejection Note */}
            <div className="space-y-1.5">
              <label htmlFor="reject-note" className="text-xs font-semibold">
                หมายเหตุเพิ่มเติม (Optional Note)
              </label>
              <input
                id="reject-note"
                type="text"
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="ระบุหมายเหตุการอนุมัติหรือเหตุผลที่ไม่ผ่าน..."
                className="w-full rounded-md border border-input bg-background p-2 text-xs"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  verifyMutation.mutate({
                    id: selectedPayment.id,
                    status: "REJECTED",
                    note: rejectNote,
                  })
                }
                disabled={verifyMutation.isPending}
                className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <XCircle className="h-4 w-4" />
                <span>ปฏิเสธสลิป</span>
              </Button>

              <Button
                size="sm"
                onClick={() =>
                  verifyMutation.mutate({
                    id: selectedPayment.id,
                    status: "VERIFIED",
                    note: rejectNote,
                  })
                }
                disabled={verifyMutation.isPending}
                className="flex-1 bg-emerald-800 text-cream-100 hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>ยืนยันสลิปถูกต้อง</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
