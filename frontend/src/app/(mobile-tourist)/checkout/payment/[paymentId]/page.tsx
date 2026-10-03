"use client";

/**
 * (mobile-tourist)/checkout/payment/[paymentId]/page.tsx - bank-transfer payment page with Eco-Premium styling.
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Landmark,
  ShieldCheck,
  Upload,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/api/errors";
import { getPaymentDetail, uploadPaymentSlip } from "@/lib/api/booking";
import { SLIP_STATUS_LABELS } from "@/lib/booking-presentation";
import { formatCountdown, formatDateTimeText, formatPriceText } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { getPendingPayment } from "@/lib/pending-payment";

export default function PaymentPage() {
  const { t, locale } = useI18n();
  const params = useParams<{ paymentId: string }>();
  const paymentId = params?.paymentId ?? "";

  const cached = useMemo(
    () => (typeof window === "undefined" ? null : getPendingPayment(paymentId)),
    [paymentId],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["payment-detail", paymentId],
    enabled: paymentId.length > 0,
    queryFn: () => getPaymentDetail(paymentId),
    refetchInterval: 15_000,
  });

  const payment = data?.data;
  const isSuccess = payment?.status === "SUCCESS";
  const isExpired = payment?.status === "EXPIRED";

  const targetExpiresAt = cached?.expires_at || payment?.expires_at;

  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!targetExpiresAt) {
      return;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [targetExpiresAt]);

  const secondsLeft = targetExpiresAt
    ? Math.max(0, Math.floor((new Date(targetExpiresAt).getTime() - now) / 1000))
    : null;

  const upload = useMutation({
    mutationFn: (file: File) => uploadPaymentSlip(paymentId, file),
    onSuccess: () => {
      void refetch();
    },
  });

  const payeeReady = Boolean(
    payment &&
      (payment.payee_account_number ||
        payment.payee_account_name ||
        payment.payee_bank),
  );

  function onPickSlip(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      upload.mutate(file);
    }
    e.target.value = "";
  }

  const uploadError =
    upload.isError && upload.error
      ? extractErrorMessage(upload.error, t("common.networkError"))
      : null;

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 pb-16 pt-6 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/60 pb-4">
        <Landmark className="h-6 w-6 text-forest-800" aria-hidden="true" />
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">
            {t("payment.title")} (Payment Instructions)
          </h1>
          <p className="text-xs text-muted-foreground">รหัสการจอง: {payment?.booking_code || "-"}</p>
        </div>
      </div>

      {isLoading ? (
        <ListLoading />
      ) : isError || !payment ? (
        <ListError
          message={extractErrorMessage(error, t("common.networkError"))}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          {/* Amount Due Card */}
          <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-6 text-cream-50 shadow-xl sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.3),transparent_60%)]" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-cream-200">
                  {t("payment.amountDue")}
                </span>
                {secondsLeft !== null && (
                  <div
                    className={
                      secondsLeft === 0
                        ? "inline-flex items-center gap-1.5 rounded-full bg-destructive/20 px-3 py-1 text-xs font-bold text-destructive-foreground"
                        : "inline-flex items-center gap-1.5 rounded-full bg-gold-500/20 px-3 py-1 text-xs font-semibold text-gold-300 border border-gold-500/30"
                    }
                  >
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t("payment.timeLeft", { time: formatCountdown(secondsLeft) })}</span>
                  </div>
                )}
              </div>
              <p className="font-serif text-3xl font-bold text-gold-300 sm:text-4xl">
                {formatPriceText(payment.amount, locale)}
              </p>
            </div>
          </div>

          {/* Status Messages */}
          {isSuccess && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold">ชำระเงินเรียบร้อยแล้ว</p>
                <p className="text-xs text-emerald-800 mt-0.5">{t("payment.alreadyPaid")}</p>
              </div>
            </div>
          )}
          {isExpired && (
            <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold">รายการนี้หมดอายุแล้ว</p>
                <p className="text-xs mt-0.5">{t("payment.expiredWarning")}</p>
              </div>
            </div>
          )}

          {/* PAYEE & PROMPTPAY QR CARD */}
          {!isSuccess && !isExpired && (
            <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-forest-800" />
                  <h2 className="font-serif font-bold text-foreground">ชำระเงินผ่าน PromptPay / โอนผ่านธนาคาร</h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-forest-800/20 bg-forest-50 px-2.5 py-0.5 text-[11px] font-bold text-forest-900">
                  ⚡ EasySlip Verification
                </span>
              </div>

              {/* PromptPay QR Code Mockup Box */}
              <div className="flex flex-col items-center justify-center rounded-2xl bg-cream-50/80 p-6 border border-border/60 text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-900 text-cream-100 text-xs font-semibold">
                  <Landmark className="h-3.5 w-3.5" />
                  <span>สแกน QR Code ตามยอดชำระ</span>
                </div>
                <div className="relative p-3 bg-white rounded-2xl shadow-inner border border-border/70">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PROMPTPAY-WELLTRIP-${payment.amount}`}
                    alt="PromptPay QR Code"
                    className="h-44 w-44 object-contain rounded-lg"
                  />
                  <div className="mt-2 text-center">
                    <p className="text-[11px] font-semibold text-muted-foreground">ยอดเงินที่ต้องโอนตรงตามสลิป</p>
                    <p className="font-serif text-xl font-bold text-forest-900">{formatPriceText(payment.amount, locale)}</p>
                  </div>
                </div>
              </div>

              {/* Bank Account Details with Copy Button */}
              {payeeReady && (
                <div className="space-y-3 rounded-xl bg-cream-50/60 p-4 border border-border/50 text-sm">
                  {payment.payee_bank && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs font-medium">ธนาคาร (Bank)</span>
                      <span className="font-semibold text-foreground">{payment.payee_bank}</span>
                    </div>
                  )}
                  {payment.payee_account_number && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs font-medium">เลขที่บัญชี (Account No.)</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-forest-900">{payment.payee_account_number}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs font-semibold text-forest-800 hover:bg-forest-100/50"
                          onClick={() => {
                            if (typeof navigator !== "undefined" && navigator.clipboard) {
                              navigator.clipboard.writeText(payment.payee_account_number);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }
                          }}
                        >
                          {copied ? "✓ คัดลอกแล้ว!" : "คัดลอก"}
                        </Button>
                      </div>
                    </div>
                  )}
                  {payment.payee_account_name && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs font-medium">ชื่อบัญชี (Account Name)</span>
                      <span className="font-medium text-foreground text-right">{payment.payee_account_name}</span>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* UPLOAD SLIP WITH EASYSLIP BADGE */}
          {!isSuccess && !isExpired && (
            <section className="rounded-2xl border border-dashed border-forest-800/40 bg-cream-50/50 p-6 text-center space-y-4">
              <input
                id="slip-file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickSlip}
                disabled={upload.isPending}
              />
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-foreground">แนบสลิปเพื่อตรวจเช็กด้วย EasySlip</h3>
                <p className="text-xs text-muted-foreground">ระบบจะสแกนและตรวจสอบยอดโอนอัตโนมัติทันทีที่แนบสลิป</p>
              </div>

              <label
                htmlFor="slip-file"
                aria-disabled={upload.isPending}
                className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-forest-900 px-6 py-3 text-sm font-semibold text-cream-100 shadow-md transition-all hover:bg-forest-950 disabled:pointer-events-none disabled:opacity-50"
              >
                {upload.isPending ? (
                  <>
                    <Upload className="h-4 w-4 animate-pulse" aria-hidden="true" />
                    <span>{t("payment.uploading")} (กำลังตรวจสลิป...)</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    <span>แนบสลิปโอนเงิน (Upload Bank Slip)</span>
                  </>
                )}
              </label>
              {uploadError && (
                <p className="text-xs font-medium text-destructive">{uploadError}</p>
              )}
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-forest-700" aria-hidden="true" />
                <span>ตรวจสอบข้อมูลโดย EasySlip Gateway · ปลอดภัย 100%</span>
              </p>
            </section>
          )}

          {/* SLIPS LIST */}
          {payment.slips.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-serif text-xs font-bold uppercase tracking-wider text-forest-900/70">
                สลิปที่แนบไว้ ({payment.slips.length})
              </h2>
              <ul className="space-y-3">
                {payment.slips.map((slip) => (
                  <li
                    key={slip.id}
                    className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slip.image}
                      alt={slip.original_filename}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {slip.original_filename || slip.id}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTimeText(slip.uploaded_at, locale)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-forest-100 px-3 py-1 text-xs font-semibold text-forest-900">
                      {t(SLIP_STATUS_LABELS[slip.status])}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* FOOTER LINK */}
          <Link href="/my-bookings" className="block pt-2">
            <Button variant="outline" className="w-full justify-center rounded-xl py-3 font-semibold border-border/80">
              <span>{t("payment.goToBookings")}</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}

