"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  Flame,
  Leaf,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Utensils,
  Wheat,
  X,
} from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { PageHeading } from "@/components/travel/Primitives";
import { getFoods } from "@/lib/api/catalog";
import { extractErrorMessage } from "@/lib/api/errors";
import { formatBaht, toNumber } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { useI18n } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import type { FoodMenu, FoodWellnessCategory } from "@/types/catalog";
import { FOOD_WELLNESS_CATEGORIES } from "@/types/catalog";

const categoryLabels: Record<FoodWellnessCategory, { th: string; en: string }> = {
  LOW_SUGAR: { th: "หวานน้อย", en: "Low Sugar" },
  LOW_SODIUM: { th: "โซเดียมต่ำ", en: "Low Sodium" },
  ORGANIC: { th: "ออร์แกนิก", en: "Organic" },
  HERBAL: { th: "สมุนไพร", en: "Herbal" },
  VEGAN: { th: "วีแกน", en: "Vegan" },
};

export default function FoodsPage() {
  const { locale } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [page, setPage] = useState(1);
  const [activeFood, setActiveFood] = useState<FoodMenu | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeFood) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [activeFood]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["foods", selectedCategory, page],
    queryFn: () =>
      getFoods({
        category: selectedCategory ? (selectedCategory as FoodWellnessCategory) : undefined,
        page,
        limit: 12,
      }),
  });

  const foodsList = data?.data ?? [];

  function handleAddToCart(food: FoodMenu, quantity = 1) {
    addItem({
      item_type: "FOOD_ORDER",
      entity_id: food.id,
      quantity,
      title: food.name,
      unit_price: toNumber(food.price),
      image_url: food.image_url || undefined,
    });

    const msg = locale === "th" 
      ? `เพิ่ม "${food.name}" จำนวน ${quantity} รายการลงตะกร้าแล้ว`
      : `Added ${quantity}x "${food.name}" to cart`;
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);

    if (activeFood) {
      setActiveFood(null);
      setModalQty(1);
    }
  }

  function openQuickView(food: FoodMenu) {
    setActiveFood(food);
    setModalQty(1);
  }

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-6 pb-28 lg:pb-12 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Header Title Section */}
        <PageHeading
          eyebrow="LOCAL FLAVOURS & HEALTHY DISHES"
          title={locale === "th" ? "อาหารอร่อยจากชุมชน" : "A Taste of Sisaket Community"}
          description={
            locale === "th"
              ? "คัดสรรเมนูโภชนาการสูง ปรุงจากวัตถุดิบอินทรีย์และสมุนไพรสดศรีสะเกษ เพื่อสุขภาพที่ดีของคุณ"
              : "Explore organic, nutrient-dense local gastronomy cooked fresh by Sisaket community providers."
          }
        />

        {/* Category Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("");
              setPage(1);
            }}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-xs ${
              selectedCategory === ""
                ? "bg-[#1B2A24] text-white shadow-sm"
                : "bg-white border border-stone-200 text-stone-700 hover:border-stone-400"
            }`}
          >
            {locale === "th" ? "ทั้งหมด" : "All Dishes"}
          </button>
          {FOOD_WELLNESS_CATEGORIES.map((catKey) => {
            const isActive = selectedCategory === catKey;
            const label = locale === "th" ? categoryLabels[catKey].th : categoryLabels[catKey].en;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => {
                  setSelectedCategory(catKey);
                  setPage(1);
                }}
                className={`shrink-0 px-4 py-2 rounded-full text-xs transition-all shadow-xs ${
                  isActive
                    ? "bg-[#1B2A24] text-white font-semibold shadow-sm"
                    : "bg-white border border-stone-200 text-stone-700 hover:border-stone-400"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Toast Added Confirmation */}
        {toastMessage && (
          <div className="fixed top-20 right-4 sm:right-8 z-[10001] bg-[#1B2A24] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-[#D97706]/40 animate-in fade-in slide-in-from-top-4 duration-300">
            <Check className="w-5 h-5 text-[#D97706] shrink-0" />
            <span className="text-xs font-semibold">{toastMessage}</span>
            <Link
              href="/cart"
              className="ml-2 underline text-xs font-bold text-[#D97706] hover:text-white"
            >
              {locale === "th" ? "ไปที่ตะกร้า" : "View Cart"}
            </Link>
          </div>
        )}

        {/* Food Grid Feed */}
        {isLoading ? (
          <ListLoading />
        ) : isError ? (
          <ListError
            message={extractErrorMessage(error, "ไม่สามารถโหลดข้อมูลอาหารได้")}
            onRetry={() => void refetch()}
          />
        ) : foodsList.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
            <Utensils className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-medium text-slate-600">
              {locale === "th"
                ? "ยังไม่มีรายการอาหารในหมวดนี้ กรุณาเลือกหมวดหมู่อื่น"
                : "No dishes found in this category."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {foodsList.map((food) => {
              const categoryTag =
                categoryLabels[food.wellness_category]?.[locale === "th" ? "th" : "en"] || "อาหารสุขภาพ";
              const kcal = food.calorie_estimate ?? (food.name.length * 15 + 180);

              return (
                <div
                  key={food.id}
                  className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-[#D97706] transition-all group flex flex-col justify-between cursor-pointer"
                  onClick={() => openQuickView(food)}
                >
                  <div className="space-y-3">
                    {/* 16:9 Aspect Ratio Food Image Banner */}
                    <div className="relative aspect-[16/9] bg-stone-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={displayImage(food.image_url, "food", food.id, 600)}
                        alt={food.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Top-Left Kcal Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1B2A24]/85 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-white border border-[#D97706]/40 shadow-sm">
                          <Flame className="w-3.5 h-3.5 text-[#D97706]" />
                          <span>{kcal} kcal</span>
                        </span>
                      </div>

                      {/* Top-Right Price Floating Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center rounded-full bg-white/95 backdrop-blur-md text-[#1B2A24] px-3 py-1 text-xs font-serif font-bold shadow-md border border-slate-200/90">
                          {formatBaht(food.price)}
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="px-4 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#D97706] font-bold uppercase tracking-wider">
                        <Leaf className="w-3.5 h-3.5 shrink-0" />
                        <span>{categoryTag}</span>
                      </div>
                      <h3 className="font-serif text-base font-bold text-[#1B2A24] group-hover:text-[#D97706] transition-colors line-clamp-1">
                        {food.name}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {food.description ||
                          (locale === "th"
                            ? "วัตถุดิบอินทรีย์สดจากชุมชน ปรุงด้วยสมุนไพรศรีสะเกษ โซเดียมต่ำ อุดมด้วยคุณค่าทางโภชนาการ"
                            : "Fresh organic local ingredients, low sodium, rich in nutrition.")}
                      </p>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 font-medium group-hover:text-[#1B2A24] transition-colors">
                      {locale === "th" ? "ดูรายละเอียดด่วน" : "Quick view"}
                    </span>
                    <button
                      type="button"
                      aria-label="เพิ่มลงตะกร้าแบบด่วน"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(food, 1);
                      }}
                      className="p-2.5 rounded-xl bg-slate-100 text-[#1B2A24] hover:bg-[#1B2A24] hover:text-white transition-colors"
                      title={locale === "th" ? "เพิ่มลงตะกร้าทันที" : "Add to cart"}
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick-View Food Detail Modal / Bottom Sheet Drawer (Teleported to document.body) */}
        {activeFood && mounted && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 touch-none"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveFood(null);
                setModalQty(1);
              }
            }}
            onTouchMove={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
              }
            }}
          >
            <div className="fixed inset-x-0 bottom-0 sm:relative z-[10000] w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] animate-in slide-in-from-bottom duration-300">
              
              {/* Left / Top Media Section */}
              <div className="relative w-full md:w-1/2 aspect-[16/9] md:aspect-auto bg-stone-100 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayImage(activeFood.image_url, "food", activeFood.id, 800)}
                  alt={activeFood.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
                
                {/* Mobile Floating Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1B2A24]/90 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white border border-[#D97706]/40 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>
                      {categoryLabels[activeFood.wellness_category]?.[locale === "th" ? "th" : "en"] || "อาหารสุขภาพ"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Right / Bottom Content Section */}
              <div className="w-full md:w-1/2 p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:pb-6 space-y-5 overflow-y-auto overscroll-contain flex flex-col justify-between bg-white">
                <div className="space-y-4">
                  {/* Top Header Row with Close Button */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider block">
                        SISAKET ECO-WELLNESS GASTRONOMY
                      </span>
                      <h2 className="font-serif text-xl font-bold text-[#1B2A24] leading-snug">
                        {activeFood.name}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFood(null);
                        setModalQty(1);
                      }}
                      className="p-1.5 rounded-full bg-slate-100 hover:bg-[#1B2A24] hover:text-white text-slate-500 transition-colors shrink-0"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeFood.description ||
                      (locale === "th"
                        ? "อาหารเพื่อสุขภาพคัดสรรวัตถุดิบอินทรีย์ ปรุงสดใหม่วันต่อวัน ไร้สารกันเสีย โซเดียมต่ำ อุดมด้วยคุณประโยชน์จากสมุนไพรศรีสะเกษ"
                        : "Organic health menu cooked fresh daily with local herbs, low sodium, and high nutrition.")}
                  </p>

                  {/* Nutrition Highlights Row */}
                  <div className="grid grid-cols-3 gap-2 py-1">
                    <div className="rounded-xl bg-[#FAF8F5] border border-slate-200/80 p-2.5 text-center space-y-0.5">
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                        {locale === "th" ? "แคลอรี" : "Calories"}
                      </span>
                      <span className="font-serif text-xs font-bold text-[#1B2A24] flex items-center justify-center gap-1">
                        <Flame className="w-3 h-3 text-[#D97706]" />
                        <span>{activeFood.calorie_estimate ?? 380} kcal</span>
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#FAF8F5] border border-slate-200/80 p-2.5 text-center space-y-0.5">
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                        {locale === "th" ? "โซเดียม" : "Sodium"}
                      </span>
                      <span className="font-serif text-xs font-bold text-emerald-700">
                        {locale === "th" ? "ต่ำ 240mg" : "Low 240mg"}
                      </span>
                    </div>

                    <div className="rounded-xl bg-[#FAF8F5] border border-slate-200/80 p-2.5 text-center space-y-0.5">
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase">
                        {locale === "th" ? "วัตถุดิบ" : "Ingredients"}
                      </span>
                      <span className="font-serif text-xs font-bold text-[#1B2A24] flex items-center justify-center gap-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{locale === "th" ? "ออร์แกนิก 100%" : "100% Organic"}</span>
                      </span>
                    </div>
                  </div>

                  {/* Community Origin Story Card */}
                  <div className="rounded-xl bg-amber-50/60 border border-[#D97706]/30 p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#D97706]">
                      <Wheat className="w-4 h-4" />
                      <span>{locale === "th" ? "ภูมิปัญญาอาหาร 4 ชนเผ่าศรีสะเกษ" : "4 Ethnic Heritage Gastronomy"}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {locale === "th"
                        ? "ส่งตรงจากกลุ่มเกษตรกรอินทรีย์วิสาหกิจชุมชนจังหวัดศรีสะเกษ ช่วยสร้างรายได้หมุนเวียนสู่ท้องถิ่น"
                        : "Directly sourced from Sisaket organic farming community enterprises, supporting local farmers."}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Area: Quantity Stepper & Add to Cart CTA */}
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1B2A24]">
                      {locale === "th" ? "ระบุจำนวน" : "Quantity"}
                    </span>
                    <div className="flex items-center rounded-xl border border-slate-200 bg-[#FAF8F5] p-0.5">
                      <button
                        type="button"
                        aria-label="ลดจำนวน"
                        disabled={modalQty <= 1}
                        onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                        className="grid h-8 w-8 place-items-center text-slate-500 hover:text-[#1B2A24] disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-[#1B2A24]">
                        {modalQty}
                      </span>
                      <button
                        type="button"
                        aria-label="เพิ่มจำนวน"
                        onClick={() => setModalQty((q) => q + 1)}
                        className="grid h-8 w-8 place-items-center text-slate-500 hover:text-[#1B2A24] transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Primary CTA Button */}
                  <button
                    type="button"
                    onClick={() => handleAddToCart(activeFood, modalQty)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#1B2A24] text-white font-semibold text-xs hover:bg-[#151d1a] transition-all flex items-center justify-center gap-2 shadow-md group"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#D97706] group-hover:scale-110 transition-transform" />
                    <span>
                      {locale === "th"
                        ? `เพิ่มลงตะกร้า • ${formatBaht(toNumber(activeFood.price) * modalQty)}`
                        : `Add to Cart • ${formatBaht(toNumber(activeFood.price) * modalQty)}`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
