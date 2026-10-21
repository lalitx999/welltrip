"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  Heart,
  Leaf,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Wheat,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { getWellnessSlots } from "@/lib/api/catalog";
import { extractErrorMessage } from "@/lib/api/errors";
import { formatBaht, formatClockTime, todayISO, toNumber } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { useI18n } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import type { WellnessTimeSlot } from "@/types/catalog";

export default function WellnessDetailPage() {
  const { locale, t } = useI18n();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const serviceId = params?.id ?? "";

  const [slotDate, setSlotDate] = useState(todayISO());
  const [selectedSlot, setSelectedSlot] = useState<WellnessTimeSlot | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  // Generate 7-day date strip
  const dateStrip = useMemo(() => {
    const dates = [];
    const today = new Date();
    const dayNamesTH = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
    const dayNamesEN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const dayName = locale === "th" ? dayNamesTH[d.getDay()] : dayNamesEN[d.getDay()];
      const dayNum = d.getDate();
      dates.push({ iso, dayName, dayNum });
    }
    return dates;
  }, [locale]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["wellness-slots", serviceId, slotDate],
    enabled: serviceId.length > 0,
    queryFn: () => getWellnessSlots(serviceId, slotDate),
  });

  const service = data?.data.wellness_service;
  const slots = data?.data.slots ?? [];

  function alreadyInCart(slotId: number): number {
    return (
      cartItems.find(
        (item) => item.item_type === "WELLNESS_SESSION" && item.entity_id === slotId,
      )?.quantity ?? 0
    );
  }

  const leftFor = (slot: WellnessTimeSlot): number =>
    Math.max(0, slot.capacity_available - alreadyInCart(slot.id));

  function handleBooking() {
    if (!service || !selectedSlot) return;

    addItem({
      item_type: "WELLNESS_SESSION",
      entity_id: selectedSlot.id,
      quantity,
      title: `${service.title} · ${formatClockTime(selectedSlot.start_time)}–${formatClockTime(
        selectedSlot.end_time,
      )} (${selectedSlot.slot_date})`,
      unit_price: toNumber(service.price),
      image_url: service.image_url,
    });

    const msg = locale === "th"
      ? `เพิ่มรอบเวลา ${formatClockTime(selectedSlot.start_time)} น. ลงตะกร้าแล้ว`
      : `Added slot ${formatClockTime(selectedSlot.start_time)} to cart`;
    setToastMessage(msg);

    setTimeout(() => {
      router.push("/cart");
    }, 1200);
  }

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-6 pb-28 lg:pb-12 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Floating Back Button */}
        <Link
          href="/wellness"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B2A24] hover:text-[#D97706] transition-colors"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          <span>{locale === "th" ? "ย้อนกลับไปบริการสปาทั้งหมด" : "Back to wellness services"}</span>
        </Link>

        {/* Toast Added Notification */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-[10001] bg-[#1B2A24] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#D97706]/40 animate-in fade-in slide-in-from-top-4 duration-300">
            <Check className="w-5 h-5 text-[#D97706] shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </div>
        )}

        {isLoading ? (
          <ListLoading />
        ) : isError || !service ? (
          <ListError
            message={extractErrorMessage(error, t("common.networkError"))}
            onRetry={() => void refetch()}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Service Details & Heritage (7/12 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Hero Showcase Card */}
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
                <div className="relative aspect-[16/9] w-full bg-[#1B2A24] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayImage(service.image_url, "wellness", service.id, 1000)}
                    alt={service.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A24]/90 via-[#1B2A24]/30 to-transparent" />
                  
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                    <span className="inline-block px-3 py-1 rounded-full bg-[#D97706] text-white text-[10px] font-bold tracking-widest uppercase shadow-sm">
                      TRADITIONAL SPA & HERBAL RETREAT
                    </span>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-tight">
                      {service.title}
                    </h1>
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-200">
                      <span className="text-[#D97706] font-serif text-lg font-bold">
                        {formatBaht(service.price)}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                        <Clock className="h-3.5 w-3.5 text-[#D97706]" />
                        <span>{service.duration_minutes} {locale === "th" ? "นาที / ท่าน" : "min / person"}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Service Description */}
                <div className="p-6 space-y-3 border-t border-slate-100">
                  <h2 className="font-serif font-bold text-lg text-[#1B2A24]">
                    {locale === "th" ? "รายละเอียดและประโยชน์ของทรีตเมนต์" : "Treatment Overview"}
                  </h2>
                  <p className="text-xs leading-relaxed text-slate-600">
                    {service.description ||
                      (locale === "th"
                        ? "ทรีตเมนต์สปาสมุนไพรสดสูตรโบราณ ปรุงจากขมิ้นชันอินทรีย์ ไพลสด และน้ำผึ้งป่า ช่วยฟื้นฟูผิวพรรณ คลายความเหนื่อยล้า และกระตุ้นการไหลเวียนโลหิต"
                        : "Fresh herbal spa treatment crafted with organic turmeric, plai, and wild honey to nourish skin and relieve fatigue.")}
                  </p>
                </div>
              </div>

              {/* 3 Benefit Highlights Micro-Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-white border border-slate-200/80 p-4 text-center space-y-1 shadow-xs">
                  <span className="block text-[10px] font-bold uppercase text-[#D97706]">
                    {locale === "th" ? "คุณประโยชน์หลัก" : "Main Benefit"}
                  </span>
                  <span className="font-serif text-xs font-bold text-[#1B2A24]">
                    {locale === "th" ? "ลดการอักเสบผิว" : "Anti-Inflammatory"}
                  </span>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200/80 p-4 text-center space-y-1 shadow-xs">
                  <span className="block text-[10px] font-bold uppercase text-[#D97706]">
                    {locale === "th" ? "สูตรเฉพาะ" : "Herbal Heritage"}
                  </span>
                  <span className="font-serif text-xs font-bold text-emerald-700">
                    {locale === "th" ? "สมุนไพร GI ศรีสะเกษ" : "Sisaket GI Herbs"}
                  </span>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200/80 p-4 text-center space-y-1 shadow-xs">
                  <span className="block text-[10px] font-bold uppercase text-[#D97706]">
                    {locale === "th" ? "ผลลัพธ์" : "Result"}
                  </span>
                  <span className="font-serif text-xs font-bold text-[#1B2A24]">
                    {locale === "th" ? "ผ่อนคลายกล้ามเนื้อ" : "Muscle Relief"}
                  </span>
                </div>
              </div>

              {/* Service Process Timeline Steps */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Sparkles className="w-5 h-5 text-[#D97706]" />
                  <h3 className="font-serif text-base font-bold text-[#1B2A24]">
                    {locale === "th" ? "ขั้นตอนบริการทรีตเมนต์ (Service Steps)" : "Treatment Steps"}
                  </h3>
                </div>

                <div className="space-y-4 pl-2">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-50 text-[#D97706] font-bold text-xs flex items-center justify-center shrink-0 border border-[#D97706]/30">
                      1
                    </div>
                    <div className="text-xs space-y-0.5">
                      <span className="font-bold text-[#1B2A24] block">
                        {locale === "th" ? "ทำความสะอาดผิวหน้าและเรือนร่าง" : "Purify & Cleanse Skin"}
                      </span>
                      <span className="text-slate-500 block">
                        {locale === "th" ? "ด้วยน้ำผึ้งป่าอินทรีย์และน้ำสมุนไพรสกัดสด" : "Cleansing with wild organic honey and fresh herbal extract."}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-50 text-[#D97706] font-bold text-xs flex items-center justify-center shrink-0 border border-[#D97706]/30">
                      2
                    </div>
                    <div className="text-xs space-y-0.5">
                      <span className="font-bold text-[#1B2A24] block">
                        {locale === "th" ? "สครับบำรุงเซลล์ผิวอ่อนพละ" : "Gentle Herbal Exfoliation"}
                      </span>
                      <span className="text-slate-500 block">
                        {locale === "th" ? "ขัดผิวอย่างเบามือด้วยผงไพลและขมิ้นชันบดละเอียด" : "Exfoliating gently with organic plai powder and turmeric."}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-50 text-[#D97706] font-bold text-xs flex items-center justify-center shrink-0 border border-[#D97706]/30">
                      3
                    </div>
                    <div className="text-xs space-y-0.5">
                      <span className="font-bold text-[#1B2A24] block">
                        {locale === "th" ? "พอกบำรุงด้วยสมุนไพรสดสูตรเย็น" : "Cooling Herbal Mask"}
                      </span>
                      <span className="text-slate-500 block">
                        {locale === "th" ? "พอกผิวเพื่อลดความร้อนและฟื้นฟูกระจ่างใส" : "Cooling mask application to soothe and brighten complexion."}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-50 text-[#D97706] font-bold text-xs flex items-center justify-center shrink-0 border border-[#D97706]/30">
                      4
                    </div>
                    <div className="text-xs space-y-0.5">
                      <span className="font-bold text-[#1B2A24] block">
                        {locale === "th" ? "นวดกดจุดผ่อนคลายศีรษะ คอ และบ่า" : "Acupressure Head & Shoulder Massage"}
                      </span>
                      <span className="text-slate-500 block">
                        {locale === "th" ? "ปิดท้ายด้วยการนวดผ่อนคลายความเครียดสะสม" : "Relieving accumulated stress with targeted acupressure."}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200/60">
                  <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>
                    {locale === "th"
                      ? "รับรองมาตรฐานความปลอดภัยและคุณภาพ 100% โดยวิสาหกิจชุมชนศรีสะเกษ"
                      : "100% Certified Safety & Quality Standard by Sisaket Community Enterprise"}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Date & Time Slot Picker (5/12 cols) */}
            <div className="lg:col-span-5 space-y-6 sticky top-24">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
                
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#D97706]" />
                    <h2 className="font-serif text-lg font-bold text-[#1B2A24]">
                      {locale === "th" ? "เลือกรอบเวลาเข้าบริการ" : "Book Time Slot"}
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-[#D97706] bg-amber-50 px-2.5 py-1 rounded-full border border-[#D97706]/20">
                    {service.duration_minutes} {locale === "th" ? "นาที" : "min"}
                  </span>
                </div>

                {/* 7-Day Interactive Horizontal Date Strip Slider */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#1B2A24]">
                    {locale === "th" ? "1. เลือกวันที่ต้องการ" : "1. Select Date"}
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {dateStrip.map((item) => {
                      const isSelected = slotDate === item.iso;
                      return (
                        <button
                          key={item.iso}
                          type="button"
                          onClick={() => {
                            setSlotDate(item.iso);
                            setSelectedSlot(null);
                          }}
                          className={`flex flex-col items-center justify-center min-w-[56px] h-16 rounded-2xl border transition-all text-xs shrink-0 ${
                            isSelected
                              ? "bg-[#1B2A24] text-white border-[#1B2A24] shadow-sm ring-2 ring-[#D97706]/30"
                              : "bg-[#FAF8F5] border-slate-200 text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          <span className="text-[10px] opacity-75 font-semibold">{item.dayName}</span>
                          <span className="font-serif text-base font-bold">{item.dayNum}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots Grid Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#1B2A24] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                      <span>{locale === "th" ? "2. เลือกรอบเวลาบริการ" : "2. Select Time Slot"}</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {slots.length} {locale === "th" ? "รอบบริการ" : "slots"}
                    </span>
                  </div>

                  {slots.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-[#FAF8F5] p-6 text-center text-xs text-slate-500 space-y-1">
                      <p className="font-semibold">{locale === "th" ? "ไม่มีรอบเวลาว่างในวันนี้" : "No slots available on this date"}</p>
                      <p className="text-[11px] text-slate-400">
                        {locale === "th" ? "กรุณาคลิกเลือกวันที่อื่นในแถบด้านบน" : "Please select another date from the strip above."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                      {slots.map((slot) => {
                        const left = leftFor(slot);
                        const isSoldOut = left <= 0;
                        const isSelected = selectedSlot?.id === slot.id;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isSoldOut}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setQuantity(1);
                            }}
                            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                              isSelected
                                ? "bg-[#1B2A24] text-white border-[#1B2A24] shadow-md ring-2 ring-[#D97706]/40"
                                : isSoldOut
                                ? "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                                : "bg-white border-slate-200 text-[#1B2A24] hover:border-[#D97706]"
                            }`}
                          >
                            <span className="font-serif text-xs font-bold block">
                              {formatClockTime(slot.start_time)} – {formatClockTime(slot.end_time)}
                            </span>
                            <span
                              className={`text-[10px] font-semibold mt-1 block ${
                                isSelected
                                  ? "text-[#D97706]"
                                  : isSoldOut
                                  ? "text-rose-400"
                                  : "text-emerald-700"
                              }`}
                            >
                              {isSoldOut
                                ? locale === "th" ? "เต็มแล้ว" : "Sold out"
                                : locale === "th" ? `ว่าง ${left} ท่าน` : `${left} slots left`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quantity & CTA Action Section */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1B2A24]">
                      {locale === "th" ? "จำนวนผู้เข้าบริการ" : "Persons"}
                    </span>
                    <div className="flex items-center rounded-xl border border-slate-200 bg-[#FAF8F5] p-0.5">
                      <button
                        type="button"
                        aria-label="ลดจำนวน"
                        disabled={quantity <= 1 || !selectedSlot}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="grid h-8 w-8 place-items-center text-slate-500 hover:text-[#1B2A24] disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-[#1B2A24]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="เพิ่มจำนวน"
                        disabled={!selectedSlot || quantity >= leftFor(selectedSlot)}
                        onClick={() => setQuantity((q) => q + 1)}
                        className="grid h-8 w-8 place-items-center text-slate-500 hover:text-[#1B2A24] disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Primary CTA Button */}
                  <button
                    type="button"
                    disabled={!selectedSlot}
                    onClick={handleBooking}
                    className="w-full py-4 px-6 rounded-2xl bg-[#1B2A24] text-white font-semibold text-xs hover:bg-[#151d1a] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md group"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#D97706] group-hover:scale-110 transition-transform" />
                    <span>
                      {selectedSlot
                        ? locale === "th"
                          ? `ยืนยันรอบเวลาและจองทันที • ${formatBaht(toNumber(service.price) * quantity)}`
                          : `Confirm & Book Now • ${formatBaht(toNumber(service.price) * quantity)}`
                        : locale === "th"
                        ? "เลือกรอบเวลาก่อนจอง"
                        : "Select a time slot first"}
                    </span>
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
