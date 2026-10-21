"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  HelpCircle,
  Landmark,
  Loader2,
  Receipt,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { BookingSteps } from "@/components/travel/BookingSteps";
import { getPaymentDetail, uploadPaymentSlip } from "@/lib/api/booking";
import { extractErrorMessage } from "@/lib/api/errors";
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
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!targetExpiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [targetExpiresAt]);

  const secondsLeft = targetExpiresAt
    ? Math.max(0, Math.floor((new Date(targetExpiresAt).getTime() - now) / 1000))
    : null;

  const upload = useMutation({
    mutationFn: (file: File) => uploadPaymentSlip(paymentId, file),
    onSuccess: () => {
      setSelectedFile(null);
      void refetch();
    },
  });

  const payeeBank = payment?.payee_bank || "ธนาคารกสิกรไทย (Kasikornbank)";
  const payeeAccountNo = payment?.payee_account_number || "001-1-50448-5";
  const payeeAccountName = payment?.payee_account_name || "นาย พรหมลิขิต อุรา";
  const bookingCode = payment?.booking_code || "WT-20261010-123F5A";

  const handleCopy = async (text: string, type: "account" | "code") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "account") {
        setCopiedAccount(true);
        setTimeout(() => setCopiedAccount(false), 3000);
      } else {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 3000);
      }
    } catch {
      // Fallback
    }
  };

  const handleFileSelect = (file: File) => {
    if (file && (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp")) {
      setSelectedFile(file);
    } else {
      alert(locale === "th" ? "รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WEBP เท่านั้น" : "Only JPG, PNG, and WEBP images are supported");
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmitSlip = () => {
    if (selectedFile) {
      upload.mutate(selectedFile);
    }
  };

  const uploadError =
    upload.isError && upload.error
      ? extractErrorMessage(upload.error, t("common.networkError"))
      : null;

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-6 sm:py-10 pb-28 lg:pb-12 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* 1. Stepper Bar & Header Subtitle */}
        <div className="space-y-4 text-center">
          <BookingSteps step={2} />
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200/80 px-4 py-1.5 rounded-full shadow-sm text-xs text-slate-600">
            <span className="font-semibold">{locale === "th" ? "รหัสการจอง:" : "Booking Code:"}</span>
            <span className="font-mono font-bold text-[#1B2A24]">{bookingCode}</span>
            <button
              type="button"
              onClick={() => handleCopy(bookingCode, "code")}
              className="text-slate-400 hover:text-[#1B2A24] transition-colors ml-1"
              title={locale === "th" ? "คัดลอกรหัสการจอง" : "Copy booking code"}
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
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
            {/* Payment Status Banners */}
            {isSuccess && (
              <div className="max-w-xl mx-auto rounded-3xl border border-emerald-300 bg-emerald-50 p-6 text-center space-y-3 shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h2 className="font-serif text-2xl font-bold text-emerald-950">
                  {locale === "th" ? "ชำระเงินและตรวจสอบสลิปเรียบร้อยแล้ว" : "Payment Confirmed Successfully"}
                </h2>
                <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
                  {t("payment.alreadyPaid")}
                </p>
                <div className="pt-2">
                  <Link
                    href="/my-bookings"
                    className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-[#1B2A24] text-white font-semibold text-xs hover:bg-[#151d1a] transition"
                  >
                    <span>{t("payment.goToBookings")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {isExpired && (
              <div className="max-w-xl mx-auto rounded-3xl border border-rose-300 bg-rose-50 p-6 text-center space-y-3 shadow-sm">
                <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
                <h2 className="font-serif text-2xl font-bold text-rose-950">
                  {locale === "th" ? "รายการจองนี้หมดอายุแล้ว" : "Booking Hold Expired"}
                </h2>
                <p className="text-xs text-rose-800 leading-relaxed max-w-md mx-auto">
                  {t("payment.expiredWarning")}
                </p>
                <div className="pt-2">
                  <Link
                    href="/hotels"
                    className="inline-flex items-center gap-2 py-3 px-6 rounded-xl bg-[#1B2A24] text-white font-semibold text-xs hover:bg-[#151d1a] transition"
                  >
                    <span>{locale === "th" ? "เลือกการจองใหม่" : "Start New Booking"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* 2. Main Section Grid (6/12 Left, 6/12 Right) */}
            {!isSuccess && !isExpired && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT COLUMN: Payment Details & Bank Transfer Info (6 Cols) */}
                <div className="lg:col-span-6 space-y-6">
                  
                  {/* Amount Due & Countdown Banner */}
                  <div className="rounded-2xl bg-[#1B2A24] text-white p-6 sm:p-8 shadow-md border border-[#1B2A24] space-y-5 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]">
                        {locale === "th" ? "ยอดที่ต้องชำระสุทธิ" : "Amount Due"}
                      </span>
                      {secondsLeft !== null && (
                        <div
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-sm border ${
                            secondsLeft === 0
                              ? "bg-rose-900/90 text-rose-200 border-rose-500/40"
                              : "bg-[#D97706]/20 text-[#D97706] border-[#D97706]/40"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 text-[#D97706] animate-pulse" />
                          <span>
                            {locale === "th" ? "เวลาที่เหลือในการชำระ:" : "Time left:"}{" "}
                            {formatCountdown(secondsLeft)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-1">
                      <p className="font-serif text-4xl sm:text-5xl font-bold text-white tracking-tight">
                        {formatPriceText(payment.amount, locale)}
                      </p>
                    </div>
                  </div>

                  {/* Bank Account Information Card */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Landmark className="w-5 h-5 text-[#D97706]" />
                        <h2 className="font-serif text-base font-bold text-[#1B2A24]">
                          {locale === "th" ? "โอนเงินผ่านบัญชีธนาคาร" : "Bank Transfer Info"}
                        </h2>
                      </div>
                      <span className="text-[11px] font-bold text-[#D97706] bg-[#FAF8F5] border border-[#D97706]/30 px-2.5 py-0.5 rounded-full">
                        Kasikornbank
                      </span>
                    </div>

                    {/* Payee Info Box */}
                    <div className="space-y-4 rounded-xl bg-[#FAF8F5] p-4 sm:p-5 border border-slate-200/80 text-xs">
                      {/* Bank Name */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">{locale === "th" ? "ธนาคาร" : "Bank"}</span>
                        <span className="font-bold text-[#1B2A24]">{payeeBank}</span>
                      </div>

                      {/* Account Number */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                        <span className="text-slate-500 font-semibold">{locale === "th" ? "เลขที่บัญชี" : "Account No."}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-bold text-[#1B2A24] tracking-wide">
                            {payeeAccountNo}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(payeeAccountNo, "account")}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1B2A24] text-white text-[11px] font-bold hover:bg-[#D97706] transition-colors shadow-sm"
                          >
                            {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedAccount ? (locale === "th" ? "คัดลอกแล้ว" : "Copied!") : (locale === "th" ? "คัดลอกเลขบัญชี" : "Copy")}</span>
                          </button>
                        </div>
                      </div>

                      {/* Account Name */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                        <span className="text-slate-500 font-semibold">{locale === "th" ? "ชื่อบัญชี" : "Account Name"}</span>
                        <span className="font-bold text-[#1B2A24]">{payeeAccountName}</span>
                      </div>
                    </div>

                    {/* Quick Micro-Steps */}
                    <div className="space-y-2 pt-2">
                      <span className="block text-xs font-bold text-[#1B2A24]">
                        {locale === "th" ? "ขั้นตอนการโอนเงิน 3 สเต็ปง่ายๆ:" : "3 Quick Steps:"}
                      </span>
                      <ol className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 font-medium text-center">
                        <li className="bg-[#FAF8F5] p-2 rounded-lg border border-slate-200/60">
                          1. เปิดแอปธนาคาร
                        </li>
                        <li className="bg-[#FAF8F5] p-2 rounded-lg border border-slate-200/60">
                          2. โอนยอดตรงตามที่ระบุ
                        </li>
                        <li className="bg-[#FAF8F5] p-2 rounded-lg border border-slate-200/60">
                          3. แนบสลิปด้านขวา
                        </li>
                      </ol>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN: Slip Upload & Submission (6 Cols) */}
                <div className="lg:col-span-6 space-y-6">
                  
                  {/* Slip Upload Dropzone Card */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-[#D97706]" />
                        <h2 className="font-serif text-base font-bold text-[#1B2A24]">
                          {locale === "th" ? "แนบหลักฐานการโอนเงิน (Slip)" : "Upload Payment Slip"}
                        </h2>
                      </div>
                    </div>

                    {/* Interactive Upload Area */}
                    <input
                      id="slip-file-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handleInputChange}
                      disabled={upload.isPending || secondsLeft === 0}
                    />

                    {!selectedFile ? (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById("slip-file-input")?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                          dragOver
                            ? "border-[#1B2A24] bg-[#1B2A24]/5"
                            : "border-[#D97706]/40 hover:border-[#1B2A24] hover:bg-[#FAF8F5]"
                        }`}
                      >
                        <UploadCloud className="w-10 h-10 text-[#D97706] mx-auto mb-3" />
                        <p className="text-xs font-bold text-[#1B2A24]">
                          {locale === "th"
                            ? "คลิกเพื่ออัปโหลด หรือลากไฟล์สลิปมาวางที่นี่"
                            : "Click to upload or drag and drop slip image here"}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {locale === "th" ? "รองรับไฟล์ JPG, PNG (ขนาดไม่เกิน 5MB)" : "Supports JPG, PNG (Max 5MB)"}
                        </p>
                      </div>
                    ) : (
                      /* Selected File Preview State */
                      <div className="rounded-xl border border-slate-200 bg-[#FAF8F5] p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-slate-200 overflow-hidden shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={URL.createObjectURL(selectedFile)}
                              alt="Slip Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 text-xs">
                            <p className="font-bold text-[#1B2A24] truncate">{selectedFile.name}</p>
                            <p className="text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title={locale === "th" ? "ยกเลิกไฟล์นี้" : "Remove file"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {uploadError && (
                      <p className="text-xs font-bold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200">
                        {uploadError}
                      </p>
                    )}

                    {/* Auto-Check Notice */}
                    <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200/80 p-3 rounded-xl">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{locale === "th" ? "ระบบจะตรวจสอบความถูกต้องของสลิปโดยอัตโนมัติ" : "Automatic automated slip verification enabled"}</span>
                    </div>

                    {/* Primary CTA Button */}
                    <button
                      type="button"
                      disabled={upload.isPending || !selectedFile || secondsLeft === 0}
                      onClick={handleSubmitSlip}
                      className="w-full py-4 px-6 rounded-xl bg-[#1B2A24] text-white font-semibold hover:bg-[#151d1a] transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      {upload.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{locale === "th" ? "กำลังตรวจสอบและอัปโหลดสลิป..." : "Verifying slip..."}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span>{locale === "th" ? "ยืนยันและส่งหลักฐานการชำระเงิน" : "Submit Payment Slip"}</span>
                        </>
                      )}
                    </button>

                    {/* Attached Slips List */}
                    {payment.slips.length > 0 && (
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        <span className="block text-xs font-bold text-[#1B2A24]">
                          {locale === "th" ? `สลิปที่แนบไว้แล้ว (${payment.slips.length})` : `Uploaded Slips (${payment.slips.length})`}
                        </span>
                        <ul className="space-y-2">
                          {payment.slips.map((slip) => (
                            <li
                              key={slip.id}
                              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/80 bg-[#FAF8F5] text-xs"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={slip.image}
                                  alt="Slip"
                                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                                />
                                <div className="min-w-0">
                                  <p className="font-bold text-[#1B2A24] truncate">{slip.original_filename || slip.id}</p>
                                  <p className="text-[10px] text-slate-400">{formatDateTimeText(slip.uploaded_at, locale)}</p>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-[#1B2A24] border border-slate-200 shrink-0">
                                {t(SLIP_STATUS_LABELS[slip.status])}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Fallback Help Link */}
                    <div className="pt-2 text-center">
                      <Link
                        href="/my-bookings"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#1B2A24] transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>{locale === "th" ? "ต้องการความช่วยเหลือ หรือแจ้งปัญหาการชำระเงิน" : "Need help with payment?"}</span>
                      </Link>
                    </div>

                  </div>
                </div>

              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
