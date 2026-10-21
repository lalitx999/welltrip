"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Flower2,
  House,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  Tag,
  Trash2,
  Utensils,
} from "lucide-react";

import { BookingSteps } from "@/components/travel/BookingSteps";
import {
  CART_GROUP_LABELS,
  placeholderKindForCartType,
} from "@/lib/booking-presentation";
import { formatPriceText, formatDateText } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { useI18n } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";

export default function CartPage() {
  const { t, locale } = useI18n();
  const groups = useCartStore((s) => s.groupedByCategory());
  const totalPrice = useCartStore((s) => s.totalPrice);
  const itemCount = useCartStore((s) => s.itemCount);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === "WELLTRIP" || promoCode.trim().toUpperCase() === "SISAKET") {
      const disc = Math.round(totalPrice * 0.1);
      setDiscount(disc);
      setPromoApplied(true);
    } else if (promoCode.trim()) {
      alert(locale === "th" ? "โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ" : "Invalid or expired promo code");
    }
  };

  const finalTotal = Math.max(0, totalPrice - discount);

  const getCategoryBadge = (itemType: string) => {
    switch (itemType) {
      case "wellness":
        return {
          label: locale === "th" ? "บริการนวดและสปา" : "Wellness & Spa",
          icon: Flower2,
        };
      case "homestay":
        return {
          label: locale === "th" ? "โฮมสเตย์นิเวศ" : "Eco Homestay",
          icon: House,
        };
      case "restaurant":
        return {
          label: locale === "th" ? "อาหารเพื่อสุขภาพ" : "Healthy Dining",
          icon: Utensils,
        };
      case "otop":
        return {
          label: locale === "th" ? "สินค้า OTOP ชุมชน" : "OTOP Craft",
          icon: ShoppingBasket,
        };
      default:
        return {
          label: locale === "th" ? "บริการท่องเที่ยว" : "Travel Service",
          icon: Sparkles,
        };
    }
  };

  if (itemCount === 0) {
    return (
      <div className="min-h-[75vh] bg-[#FAF8F5] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-[#D97706]/10 flex items-center justify-center text-[#D97706]">
            <ShoppingBag className="w-10 h-10" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-[#1B2A24]">
              {t("cart.empty")}
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              {t("cart.emptyHint")}
            </p>
          </div>
          <Link
            href="/hotels"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-[#1B2A24] text-white font-semibold hover:bg-[#151d1a] transition shadow-sm"
          >
            <span>{t("cart.browse")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-6 sm:py-10 pb-28 lg:pb-12 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* 1. Modern Horizontal Stepper Header */}
        <BookingSteps step={0} />

        {/* 2. Main Content Grid (7 cols left, 5 cols right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Cart Items List (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Header with Cart Icon & Item Count Badge */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <h1 className="flex items-center gap-3 font-serif text-2xl font-bold text-[#1B2A24]">
                <ShoppingBag className="w-6 h-6 text-[#D97706]" aria-hidden="true" />
                <span>{locale === "th" ? "ตะกร้าของคุณ" : "Your Cart"}</span>
              </h1>
              <span className="rounded-full bg-[#D97706]/15 border border-[#D97706]/30 px-3.5 py-1 text-xs font-bold text-[#D97706]">
                {itemCount} {locale === "th" ? "รายการ" : "items"}
              </span>
            </div>

            {/* Cart Group Sections */}
            <div className="space-y-8">
              {groups.map((group) => {
                const categoryBadge = getCategoryBadge(group.itemType);
                const CategoryIcon = categoryBadge.icon;

                return (
                  <section key={group.itemType} className="space-y-4">
                    {/* Category Subheader */}
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D97706] bg-[#D97706]/10 px-3 py-1.5 rounded-lg w-fit">
                      <CategoryIcon className="w-3.5 h-3.5" />
                      <span>{t(CART_GROUP_LABELS[group.itemType])}</span>
                    </div>

                    {/* Cart Item Cards */}
                    <ul className="space-y-4">
                      {group.items.map((item) => (
                        <li
                          key={`${group.itemType}-${String(item.entity_id)}-${item.checkin_date ?? "-"}-${item.checkout_date ?? "-"}`}
                          className="flex flex-col sm:flex-row gap-4 sm:gap-5 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all"
                        >
                          {/* Left: 1:1 Square Rounded Thumbnail Image */}
                          <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl overflow-hidden bg-slate-100 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={displayImage(
                                item.image_url,
                                placeholderKindForCartType(item.item_type),
                                String(item.entity_id),
                                300,
                              )}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Middle & Right Details */}
                          <div className="min-w-0 flex-1 flex flex-col justify-between space-y-3">
                            <div>
                              {/* Tag Badge */}
                              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D97706] bg-[#FAF8F5] border border-[#D97706]/20 px-2.5 py-0.5 rounded-full mb-1">
                                <Tag className="w-3 h-3" />
                                <span>{categoryBadge.label}</span>
                              </div>

                              {/* Title */}
                              <h3 className="font-serif text-base font-bold text-[#1B2A24] leading-snug">
                                {item.title}
                              </h3>

                              {/* Metadata Row: Date & Time */}
                              <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                {item.checkin_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-[#D97706]" />
                                    <span>{formatDateText(item.checkin_date, locale)}</span>
                                  </span>
                                )}
                                {item.checkout_date && item.checkout_date !== item.checkin_date && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                                    <span>ถึง {formatDateText(item.checkout_date, locale)}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Controls & Price Row */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                              <span className="font-serif text-lg font-bold text-[#1B2A24]">
                                {formatPriceText(item.unit_price * item.quantity, locale)}
                              </span>

                              <div className="flex items-center gap-3">
                                {/* Sleek Quantity Stepper */}
                                <div className="flex items-center rounded-xl border border-slate-200 bg-[#FAF8F5] p-0.5">
                                  <button
                                    type="button"
                                    aria-label={locale === "th" ? "ลดจำนวน" : "Decrease quantity"}
                                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:text-[#1B2A24] hover:bg-white transition-colors disabled:opacity-30"
                                    disabled={item.quantity <= 1}
                                    onClick={() =>
                                      updateQuantity(
                                        item.entity_id,
                                        item.item_type,
                                        item.quantity - 1,
                                        item.checkin_date,
                                        item.checkout_date,
                                      )
                                    }
                                  >
                                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                                  </button>
                                  <span className="w-8 text-center text-xs font-bold text-[#1B2A24]">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    aria-label={locale === "th" ? "เพิ่มจำนวน" : "Increase quantity"}
                                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:text-[#1B2A24] hover:bg-white transition-colors"
                                    onClick={() =>
                                      updateQuantity(
                                        item.entity_id,
                                        item.item_type,
                                        item.quantity + 1,
                                        item.checkin_date,
                                        item.checkout_date,
                                      )
                                    }
                                  >
                                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                                  </button>
                                </div>

                                {/* Trash Icon Button */}
                                <button
                                  type="button"
                                  aria-label={t("cart.remove")}
                                  onClick={() =>
                                    removeItem(
                                      item.entity_id,
                                      item.item_type,
                                      item.checkin_date,
                                      item.checkout_date,
                                    )
                                  }
                                  className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>

            {/* Action Row Below List */}
            <div className="pt-4">
              <Link
                href="/hotels"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B2A24] hover:text-[#D97706] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{locale === "th" ? "เลือกซื้อบริการอื่นเพิ่มเติม" : "Continue shopping"}</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Sticky Order Summary Card (5 Cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
              <h2 className="font-serif text-lg font-bold text-[#1B2A24] border-b border-slate-100 pb-3">
                {locale === "th" ? "สรุปรายการคำสั่งซื้อ" : "Order Summary"}
              </h2>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>{locale === "th" ? "ยอดรวมบริการ (Subtotal)" : "Subtotal"}</span>
                  <span className="font-semibold text-[#1B2A24]">
                    {formatPriceText(totalPrice, locale)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>{locale === "th" ? "ค่าธรรมเนียมชุมชน (Community Fee)" : "Community Fee"}</span>
                  <span className="font-semibold text-emerald-600">
                    {locale === "th" ? "ฟรี" : "Free"}
                  </span>
                </div>

                {promoApplied && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>{locale === "th" ? "ส่วนลดพิเศษ (10%)" : "Special Discount (10%)"}</span>
                    <span>-{formatPriceText(discount, locale)}</span>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-3 flex items-baseline justify-between">
                  <span className="font-bold text-[#1B2A24]">
                    {locale === "th" ? "ยอดสุทธิ (Total Amount)" : "Total Amount"}
                  </span>
                  <span className="font-serif text-2xl font-bold text-[#1B2A24]">
                    {formatPriceText(finalTotal, locale)}
                  </span>
                </div>
              </div>

              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="pt-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  {locale === "th" ? "โค้ดส่วนลดชุมชน" : "Promo Code"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder={locale === "th" ? "ใส่โค้ดส่วนลด (เช่น WELLTRIP)" : "Enter code (e.g. WELLTRIP)"}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-medium focus:outline-none focus:border-[#1B2A24] transition-colors"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-slate-200 text-xs font-bold text-[#1B2A24] hover:bg-[#1B2A24] hover:text-white transition-all shrink-0"
                  >
                    {locale === "th" ? "ใช้งาน" : "Apply"}
                  </button>
                </div>
              </form>

              {/* Primary CTA Button */}
              <Link
                href="/checkout"
                className="w-full py-3.5 px-6 rounded-xl bg-[#1B2A24] text-white font-semibold hover:bg-[#151d1a] transition-colors shadow-sm flex items-center justify-center gap-2 text-sm"
              >
                <span>{locale === "th" ? "ดำเนินการไปหน้าชำระเงิน" : "Proceed to Checkout"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Trust Badge Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                <span>{locale === "th" ? "รับประกันการจองตรงสู่ชุมชน 100%" : "100% Direct Community Booking Guarantee"}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
