"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  Clock,
  Hotel,
  Landmark,
  Loader2,
  ReceiptText,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ListError } from "@/components/catalog/DataStates";
import { BookingSteps } from "@/components/travel/BookingSteps";
import { useAuth } from "@/hooks/use-auth";
import { checkout } from "@/lib/api/booking";
import { extractErrorMessage } from "@/lib/api/errors";
import { CART_GROUP_LABELS, placeholderKindForCartType } from "@/lib/booking-presentation";
import { formatDateText, formatPriceText } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { useI18n } from "@/lib/i18n";
import { rememberPendingPayment } from "@/lib/pending-payment";
import { useCartStore } from "@/store/cart-store";

export default function CheckoutPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { user, status } = useAuth();
  const groups = useCartStore((s) => s.groupedByCategory());
  const totalPrice = useCartStore((s) => s.totalPrice);
  const clearCart = useCartStore((s) => s.clearCart);
  const toCheckoutPayload = useCartStore((s) => s.toCheckoutPayload);
  const idempotencyKeyRef = useRef<string>("");

  const [specialRequest, setSpecialRequest] = useState("");

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

  // Calculate nights logic for display
  const calculateNights = (checkin?: string, checkout?: string) => {
    if (!checkin || !checkout) return 1;
    const start = new Date(checkin).getTime();
    const end = new Date(checkout).getTime();
    const diff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    return diff;
  };

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-6 sm:py-10 pb-28 lg:pb-12 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* 1. Stepper Bar (Top) */}
        <BookingSteps step={1} />

        {/* Guest Authentication Gate */}
        {showGuestGate ? (
          <div className="max-w-md mx-auto rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-sm space-y-5">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#D97706]/15 flex items-center justify-center text-[#D97706]">
              <AlertCircle className="w-8 h-8" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h2 className="font-serif text-2xl font-bold text-[#1B2A24]">
                {locale === "th" ? "กรุณาเข้าสู่ระบบก่อนทำการจอง" : "Sign in required to proceed"}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t("checkout.needLogin")}
              </p>
            </div>
            <Link
              href="/login?redirect=%2Fcheckout"
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-[#1B2A24] text-white font-semibold hover:bg-[#151d1a] transition shadow-sm text-sm"
            >
              <span>{t("profile.goLogin")}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : groups.length === 0 ? (
          <div className="max-w-md mx-auto text-center bg-white border border-slate-200/80 rounded-3xl p-10 shadow-sm space-y-4">
            <p className="text-base font-medium text-slate-600">
              {t("checkout.empty")}
            </p>
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B2A24] hover:text-[#D97706]"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{locale === "th" ? "ย้อนกลับไปที่ตะกร้า" : "Back to cart"}</span>
            </Link>
          </div>
        ) : (
          <>
            {/* 2. Main Section Grid (7/12 Left, 5/12 Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: Booking Details & Guest Information (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4">
                  <ReceiptText className="w-6 h-6 text-[#D97706]" aria-hidden="true" />
                  <h1 className="font-serif text-2xl font-bold text-[#1B2A24]">
                    {locale === "th" ? "ตรวจสอบข้อมูลและยืนยันการจอง" : "Order Confirmation"}
                  </h1>
                </div>

                {/* Booking Item Cards */}
                <div className="space-y-6">
                  {groups.map((group) => (
                    <section key={group.itemType} className="space-y-4">
                      <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D97706] bg-[#D97706]/10 px-3 py-1.5 rounded-lg w-fit">
                        <Hotel className="w-4 h-4 text-[#D97706]" />
                        <span>{t(CART_GROUP_LABELS[group.itemType])}</span>
                      </h2>

                      <ul className="space-y-4">
                        {group.items.map((item) => {
                          const nights = calculateNights(item.checkin_date, item.checkout_date);
                          const isStay = item.item_type === "ROOM_RESERVATION";

                          return (
                            <div
                              key={`${group.itemType}-${String(item.entity_id)}-${item.checkin_date ?? ""}-${item.checkout_date ?? ""}`}
                              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4"
                            >
                              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                                {/* Thumbnail Image */}
                                <div className="w-full sm:w-36 h-28 shrink-0 rounded-xl overflow-hidden bg-slate-100">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={displayImage(
                                      item.image_url,
                                      placeholderKindForCartType(item.item_type),
                                      String(item.entity_id),
                                      400,
                                    )}
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                {/* Item Info */}
                                <div className="flex-1 space-y-2 min-w-0">
                                  <h3 className="font-serif text-base font-bold text-[#1B2A24]">
                                    {item.title}
                                  </h3>
                                  <p className="text-xs text-slate-500 font-medium">
                                    {isStay
                                      ? locale === "th"
                                        ? "ห้องพักเรือนไม้เอกลักษณ์ (บ้านสร้างเรือง)"
                                        : "Unique Wooden Homestay Room"
                                      : locale === "th"
                                      ? "บริการสปาและกิจกรรมเพื่อสุขภาพ"
                                      : "Wellness & Spa Package"}
                                  </p>

                                  {/* Dates Badge */}
                                  {item.checkin_date && (
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#1B2A24] font-medium pt-1">
                                      <span className="inline-flex items-center gap-1 bg-[#FAF8F5] border border-slate-200 px-2.5 py-1 rounded-lg">
                                        <CalendarDays className="w-3.5 h-3.5 text-[#D97706]" />
                                        <span>
                                          {formatDateText(item.checkin_date, locale)}
                                          {item.checkout_date && item.checkout_date !== item.checkin_date
                                            ? ` – ${formatDateText(item.checkout_date, locale)}`
                                            : ""}
                                          {isStay ? ` (${nights} คืน)` : ""}
                                        </span>
                                      </span>

                                      <span className="inline-flex items-center gap-1 bg-[#FAF8F5] border border-slate-200 px-2.5 py-1 rounded-lg">
                                        <Users className="w-3.5 h-3.5 text-[#D97706]" />
                                        <span>{locale === "th" ? `${item.quantity} รายการ / ท่าน` : `${item.quantity} qty`}</span>
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Additional Details Line */}
                              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                                  <span>
                                    {isStay
                                      ? locale === "th"
                                        ? "เวลาเช็กอิน: 14:00 น. | เช็กเอาต์: 12:00 น."
                                        : "Check-in: 14:00 | Check-out: 12:00"
                                      : locale === "th"
                                      ? "กรุณามาถึงก่อนเวลา 15 นาที"
                                      : "Please arrive 15 minutes prior"}
                                  </span>
                                </span>
                                <span className="font-serif text-base font-bold text-[#1B2A24]">
                                  {formatPriceText(item.unit_price * item.quantity, locale)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </div>

                {/* Guest Details Card */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <UserCheck className="w-5 h-5 text-[#D97706]" />
                    <h2 className="font-serif text-base font-bold text-[#1B2A24]">
                      {locale === "th" ? "ข้อมูลผู้ติดต่อเพื่อรับสิทธิ์เข้าพัก" : "Guest Contact Information"}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">
                        {locale === "th" ? "ชื่อ-นามสกุล" : "Full Name"}
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={
                          [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
                          (user?.username ? user.username : locale === "th" ? "นักท่องเที่ยว WellTrip" : "WellTrip Guest")
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#FAF8F5] text-slate-700 font-medium focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-500 mb-1">
                        {locale === "th" ? "เบอร์โทรศัพท์ติดต่อ" : "Phone Number"}
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={user?.phone_number || "081-234-5678"}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#FAF8F5] text-slate-700 font-medium focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-500 mb-1">
                        {locale === "th" ? "อีเมลรับใบยืนยัน" : "Email Address"}
                      </label>
                      <input
                        type="email"
                        readOnly
                        value={user?.email || "guest@welltrip.com"}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#FAF8F5] text-slate-700 font-medium focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Special Request Box */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                      {locale === "th" ? "คำขอพิเศษเพิ่มเติม (ไม่บังคับ)" : "Special Requests (Optional)"}
                    </label>
                    <textarea
                      rows={2}
                      value={specialRequest}
                      onChange={(e) => setSpecialRequest(e.target.value)}
                      placeholder={
                        locale === "th"
                          ? "เช่น อาหารเช้าแบบมังสวิรัติ, ขอเตียงเสริม หรือเตรียมสปาสมุนไพร"
                          : "e.g. Vegetarian breakfast, extra bed request"
                      }
                      className="w-full p-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-medium focus:outline-none focus:border-[#1B2A24] transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* Cancellation & Community Guarantee Card */}
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                    <span>{locale === "th" ? "รับประกันการจองตรงสู่วิสาหกิจชุมชน 100%" : "100% Direct Community Guarantee"}</span>
                  </div>
                  <p className="text-xs text-emerald-900/80 leading-relaxed pl-7">
                    {locale === "th"
                      ? "เมื่อกดยืนยัน ระบบจะล็อกสิทธิ์ห้องพักและบริการไว้ให้คุณเป็นเวลา 15 นาที กรุณาทำรายการชำระเงินและแนบสลิปเพื่อสมบูรณ์การจอง สามารถยกเลิกฟรีตามเงื่อนไขของชุมชน"
                      : "Your booking reservation is held for 15 minutes upon confirmation. Free cancellation is supported according to local community policy."}
                  </p>
                </div>
              </div>

              {/* RIGHT COLUMN: Sticky Pricing Breakdown & Action (5 Cols) */}
              <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
                  <h2 className="font-serif text-lg font-bold text-[#1B2A24] border-b border-slate-100 pb-3">
                    {locale === "th" ? "สรุปยอดชำระเงิน" : "Payment Summary"}
                  </h2>

                  {/* Itemized Calculation */}
                  <div className="space-y-3 text-sm">
                    {groups.flatMap((g) => g.items).map((item) => {
                      const nights = calculateNights(item.checkin_date, item.checkout_date);
                      return (
                        <div key={`summary-${item.entity_id}`} className="flex justify-between text-xs text-slate-600">
                          <span className="line-clamp-1 pr-2">
                            {item.title} {item.item_type === "ROOM_RESERVATION" ? `(${formatPriceText(item.unit_price, locale)} x ${nights} คืน)` : `x ${item.quantity}`}
                          </span>
                          <span className="font-semibold text-[#1B2A24] shrink-0">
                            {formatPriceText(item.unit_price * item.quantity, locale)}
                          </span>
                        </div>
                      );
                    })}

                    <div className="flex justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
                      <span>{locale === "th" ? "ภาษีและค่าธรรมเนียมชุมชน" : "Taxes & Community Fees"}</span>
                      <span className="font-semibold text-emerald-600">{locale === "th" ? "ฟรี" : "Free"}</span>
                    </div>

                    <div className="border-t border-slate-200 pt-3 flex items-baseline justify-between">
                      <span className="font-bold text-[#1B2A24] text-base">
                        {locale === "th" ? "ยอดชำระสุทธิ (Total)" : "Total Net Amount"}
                      </span>
                      <span className="font-serif text-3xl font-bold text-[#1B2A24]">
                        {formatPriceText(totalPrice, locale)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Method Notice */}
                  <div className="rounded-xl bg-[#FAF8F5] border border-slate-200 p-3.5 flex items-center gap-3 text-xs text-[#1B2A24]">
                    <Landmark className="w-5 h-5 text-[#D97706] shrink-0" />
                    <span className="font-medium">
                      {locale === "th"
                        ? "ชำระเงินผ่านการโอนบัญชีธนาคารพร้อมแนบสลิป"
                        : "Bank transfer payment with slip upload"}
                    </span>
                  </div>

                  {/* Secure Info Callout Banner */}
                  <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3.5 text-xs text-amber-900 leading-relaxed">
                    {locale === "th"
                      ? "เมื่อกดยืนยัน ระบบจะล็อกห้องพักและบริการไว้ให้คุณเป็นเวลา 15 นาที เพื่อดำเนินการโอนเงินและแนบหลักฐาน"
                      : "Upon confirmation, your reservation will be locked for 15 minutes to complete payment and upload your slip."}
                  </div>

                  {mutation.isError && (
                    <ListError
                      message={extractErrorMessage(mutation.error, t("common.networkError"))}
                      onRetry={() => mutation.mutate()}
                    />
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      className="w-full py-4 px-6 rounded-xl bg-[#1B2A24] text-white font-semibold hover:bg-[#151d1a] transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate()}
                    >
                      {mutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                          <span>{t("checkout.confirming")}</span>
                        </>
                      ) : (
                        <>
                          <span>{locale === "th" ? "ยืนยันการจองและไปชำระเงิน" : "Confirm Booking & Pay"}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <Link
                      href="/cart"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-[#1B2A24] transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>{locale === "th" ? "ย้อนกลับไปแก้ไขตะกร้า" : "Back to edit cart"}</span>
                    </Link>
                  </div>

                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
