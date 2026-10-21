"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Coffee,
  Filter,
  House,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  Wifi,
  X,
} from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { PageHeading } from "@/components/travel/Primitives";
import { getAccommodations } from "@/lib/api/catalog";
import { extractErrorMessage } from "@/lib/api/errors";
import { formatPriceText } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { useI18n } from "@/lib/i18n";

const PAGE_SIZE = 12;

interface Filters {
  district: string;
  guestsRange: string;
  priceRange: string;
  categoryChip: string;
}

const EMPTY_FILTERS: Filters = {
  district: "",
  guestsRange: "",
  priceRange: "",
  categoryChip: "all",
};

export default function HotelsPage() {
  const { t, locale } = useI18n();
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mobileDrawerOpen) {
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
  }, [mobileDrawerOpen]);

  // Map price range string to min/max numbers for API
  const getMinMaxPrice = (range: string) => {
    switch (range) {
      case "under1000":
        return { min: undefined, max: 1000 };
      case "1000-2000":
        return { min: 1000, max: 2000 };
      case "above2000":
        return { min: 2000, max: undefined };
      default:
        return { min: undefined, max: undefined };
    }
  };

  const { min: minPrice, max: maxPrice } = getMinMaxPrice(applied.priceRange);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["accommodations", applied, page],
    queryFn: () =>
      getAccommodations({
        province: applied.district || undefined,
        guests: applied.guestsRange ? (applied.guestsRange === "5+" ? 5 : Number(applied.guestsRange.split("-")[0])) : undefined,
        min_price: minPrice,
        max_price: maxPrice,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  });

  function applyFilters() {
    setPage(1);
    setApplied({ ...draft });
    setMobileDrawerOpen(false);
  }

  function resetFilters() {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
    setMobileDrawerOpen(false);
  }

  function handleChipSelect(chipId: string) {
    const updated = { ...draft, categoryChip: chipId };
    setDraft(updated);
    setApplied(updated);
    setPage(1);
  }

  const setFilterKey = (key: keyof Filters) => (value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const categoryChips = [
    { id: "all", label: locale === "th" ? "ทั้งหมด" : "All Stays" },
    { id: "wooden", label: locale === "th" ? "โฮมสเตย์เรือนไม้" : "Wooden Homestays" },
    { id: "nature", label: locale === "th" ? "วิวทุ่งนา & ริมน้ำ" : "Riverside & Nature" },
    { id: "organic", label: locale === "th" ? "อาหารเช้าออร์แกนิก" : "Organic Breakfast" },
    { id: "tribes", label: locale === "th" ? "วิถี 4 ชนเผ่า" : "4 Ethnic Heritage" },
    { id: "spa", label: locale === "th" ? "มีบริการนวดสมุนไพร" : "Herbal Spa" },
  ];

  const districtsList = [
    { value: "", label: locale === "th" ? "ทุกอำเภอในศรีสะเกษ" : "All Districts in Sisaket" },
    { value: "เมืองศรีสะเกษ", label: locale === "th" ? "อ.เมืองศรีสะเกษ" : "Mueang Sisaket" },
    { value: "กันทรลักษ์", label: locale === "th" ? "อ.กันทรลักษ์ (ผามออีแดง)" : "Kantharalak" },
    { value: "ภูสิงห์", label: locale === "th" ? "อ.ภูสิงห์ (ช่องสะงำ)" : "Phu Sing" },
    { value: "ขุนหาญ", label: locale === "th" ? "อ.ขุนหาญ (น้ำตกห้วยจันทร์)" : "Khun Han" },
    { value: "อุทุมพรพิสัย", label: locale === "th" ? "อ.อุทุมพรพิสัย" : "Uthumphon Phisai" },
  ];

  const rows = data?.data ?? [];
  const pagination = data?.meta?.pagination;

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-6 pb-28 lg:pb-12 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Heading */}
        <PageHeading
          eyebrow="STAY CLOSE TO NATURE"
          title={locale === "th" ? "โฮมสเตย์และที่พักชุมชนนิเวศ" : "Find Your Slow Stay"}
          description={
            locale === "th"
              ? "ค้นหาและกรองที่พักตามสเปก สัมผัสวิถีชีวิต 4 ชนเผ่า และอุดหนุนวิสาหกิจชุมชนศรีสะเกษ 100%"
              : "Filter eco homestays by specs, experience 4-ethnic cultures, and support Sisaket local communities."
          }
        />

        {/* 1. Primary Filter Pill (Floating Rounded-2xl Search Capsule) */}
        
        {/* Mobile Search Pill Button (< md) */}
        <div className="md:hidden flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex-1 flex items-center justify-between bg-white border border-slate-200/90 rounded-full px-4 py-3 shadow-sm hover:shadow-md transition text-left"
          >
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-[#D97706]" />
              <div>
                <span className="block font-bold text-xs text-[#1B2A24]">
                  {applied.district || (locale === "th" ? "ค้นหาที่พักตามอำเภอ / สเปก..." : "Filter by district or specs...")}
                </span>
                <span className="block text-[10px] text-slate-400">
                  {applied.guestsRange ? `${applied.guestsRange} ท่าน` : locale === "th" ? "จำนวนผู้เข้าพัก · ช่วงงบประมาณ" : "Guests · budget range"}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#1B2A24] text-white flex items-center justify-center shrink-0">
              <Filter className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Desktop Primary Filter Pill (>= md) */}
        <div className="hidden md:block bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/90 shadow-sm space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters();
            }}
            className="flex flex-wrap md:flex-nowrap items-center gap-3"
          >
            {/* Location Selector */}
            <div className="flex-1 min-w-[180px] px-3.5 py-1.5 border-r border-slate-200 flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#D97706]">
                  {locale === "th" ? "อำเภอ / ทำเล" : "District"}
                </label>
                <select
                  value={draft.district}
                  onChange={(e) => setFilterKey("district")(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-[#1B2A24] focus:outline-none cursor-pointer truncate"
                >
                  {districtsList.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Guests Selector */}
            <div className="w-44 px-3.5 py-1.5 border-r border-slate-200 flex items-center gap-2.5">
              <Users className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#D97706]">
                  {locale === "th" ? "จำนวนผู้เข้าพัก" : "Guests"}
                </label>
                <select
                  value={draft.guestsRange}
                  onChange={(e) => setFilterKey("guestsRange")(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-[#1B2A24] focus:outline-none cursor-pointer"
                >
                  <option value="">{locale === "th" ? "ทุกขนาดกลุ่ม" : "Any group"}</option>
                  <option value="1-2">1–2 ท่าน (คู่รัก/เดี่ยว)</option>
                  <option value="3-4">3–4 ท่าน (กลุ่มเล็ก)</option>
                  <option value="5+">5 ท่านขึ้นไป (หมู่คณะ)</option>
                </select>
              </div>
            </div>

            {/* Price Filter */}
            <div className="w-48 px-3.5 py-1.5 border-r border-slate-200 flex items-center gap-2.5">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#D97706]">
                  {locale === "th" ? "งบประมาณต่อคืน" : "Price Range"}
                </label>
                <select
                  value={draft.priceRange}
                  onChange={(e) => setFilterKey("priceRange")(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-[#1B2A24] focus:outline-none cursor-pointer"
                >
                  <option value="">{locale === "th" ? "ทุกระดับราคา" : "Any price"}</option>
                  <option value="under1000">ไม่เกิน 1,000 บาท</option>
                  <option value="1000-2000">1,000–2,000 บาท</option>
                  <option value="above2000">2,000 บาทขึ้นไป</option>
                </select>
              </div>
            </div>

            {/* Search Action Button */}
            <div className="flex items-center gap-2 shrink-0">
              {(applied.district || applied.guestsRange || applied.priceRange) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="p-2.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-[#1B2A24] transition-colors"
                  title={t("catalog.reset")}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={isFetching}
                className="py-3 px-6 rounded-xl bg-[#1B2A24] text-white font-medium text-xs hover:bg-stone-800 transition-all flex items-center gap-2 shadow-sm shrink-0"
              >
                <Search className="w-4 h-4 text-[#D97706]" />
                <span>{locale === "th" ? "ค้นหาที่พัก" : "Search Stays"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Quick Category Chips (Horizontal Scrollable Pill List) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoryChips.map((chip) => {
            const isActive = draft.categoryChip === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleChipSelect(chip.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs transition-all shadow-xs ${
                  isActive
                    ? "bg-[#1B2A24] text-white font-semibold shadow-sm"
                    : "bg-white border border-stone-200 text-stone-600 hover:border-stone-400"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Filter Drawer / Bottom Sheet Modal (Teleported to document.body) */}
        {mobileDrawerOpen && mounted && createPortal(
          <div 
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 touch-none"
            onClick={(e) => {
              if (e.target === e.currentTarget) setMobileDrawerOpen(false);
            }}
            onTouchMove={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault();
              }
            }}
          >
            <div className="fixed inset-x-0 bottom-0 sm:relative z-[10000] w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] space-y-5 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-[#1B2A24]">
                  <Filter className="w-5 h-5 text-[#D97706]" />
                  <h3 className="font-serif text-lg font-bold text-[#1B2A24]">
                    {locale === "th" ? "กรองข้อมูลที่พัก" : "Filter Accommodations"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-[#1B2A24]"
                  aria-label="Close filter"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  applyFilters();
                }}
                className="space-y-4 text-xs overflow-y-auto overscroll-contain pr-1 flex-1"
              >
                <div>
                  <label className="block font-bold text-[#1B2A24] mb-1">
                    {locale === "th" ? "อำเภอ / ทำเล" : "District"}
                  </label>
                  <select
                    value={draft.district}
                    onChange={(e) => setFilterKey("district")(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-semibold focus:outline-none"
                  >
                    {districtsList.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1B2A24] mb-1">
                    {locale === "th" ? "จำนวนผู้เข้าพัก" : "Guests"}
                  </label>
                  <select
                    value={draft.guestsRange}
                    onChange={(e) => setFilterKey("guestsRange")(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-semibold focus:outline-none"
                  >
                    <option value="">{locale === "th" ? "ทุกขนาดกลุ่ม" : "Any group"}</option>
                    <option value="1-2">1–2 ท่าน (คู่รัก/เดี่ยว)</option>
                    <option value="3-4">3–4 ท่าน (กลุ่มเล็ก)</option>
                    <option value="5+">5 ท่านขึ้นไป (หมู่คณะ)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1B2A24] mb-1">
                    {locale === "th" ? "งบประมาณต่อคืน" : "Price Range"}
                  </label>
                  <select
                    value={draft.priceRange}
                    onChange={(e) => setFilterKey("priceRange")(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-semibold focus:outline-none"
                  >
                    <option value="">{locale === "th" ? "ทุกระดับราคา" : "Any price"}</option>
                    <option value="under1000">ไม่เกิน 1,000 บาท</option>
                    <option value="1000-2000">1,000–2,000 บาท</option>
                    <option value="above2000">2,000 บาทขึ้นไป</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="w-1/3 py-3.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
                  >
                    {t("catalog.reset")}
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-3.5 px-4 rounded-xl bg-[#1B2A24] text-white font-semibold hover:bg-[#151d1a] shadow-sm transition-colors"
                  >
                    {locale === "th" ? "แสดงผลลัพธ์" : "Apply Filter"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* 2. Accommodation Grid Feed */}
        {isLoading ? (
          <ListLoading />
        ) : isError ? (
          <ListError
            message={extractErrorMessage(error, t("common.networkError"))}
            onRetry={() => void refetch()}
          />
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
            <House className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-medium text-slate-600">
              {t("catalog.noResults")}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {rows.map((acc) => (
                <Link
                  key={acc.id}
                  href={`/hotels/${acc.id}`}
                  className="rounded-2xl border border-stone-200/80 bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-[#D97706] transition-all group flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* 4:3 Aspect Ratio Image Container */}
                    <div className="relative aspect-[4/3] bg-stone-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={displayImage(acc.image_url, "hotel", acc.id, 500)}
                        alt={acc.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Top-Left Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1B2A24]/85 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-white border border-[#D97706]/40 shadow-sm">
                          <Sparkles className="w-3 h-3 text-[#D97706]" />
                          <span>{locale === "th" ? "วิถี 4 ชนเผ่า" : "Eco-Certified"}</span>
                        </span>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="px-4 space-y-2">
                      {/* Location Row */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                        <span className="truncate">
                          {[acc.district, acc.province].filter(Boolean).join(", ") || (locale === "th" ? "เมืองศรีสะเกษ, ศรีสะเกษ" : "Sisaket")}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-serif text-base font-bold text-[#1B2A24] group-hover:text-[#D97706] transition-colors line-clamp-1">
                        {acc.name}
                      </h3>

                      {/* Amenities Preview Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-[#FAF8F5] border border-slate-200 px-2 py-0.5 rounded-md">
                          <Coffee className="w-3 h-3 text-[#D97706]" />
                          <span>{locale === "th" ? "อาหารเช้าพื้นบ้าน" : "Local breakfast"}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-[#FAF8F5] border border-slate-200 px-2 py-0.5 rounded-md">
                          <Wifi className="w-3 h-3 text-[#D97706]" />
                          <span>Wi-Fi</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Price & CTA Row */}
                  <div className="p-4 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">{locale === "th" ? "เริ่มต้น" : "From"}</span>
                      <span className="font-serif text-base font-bold text-[#1B2A24]">
                        {acc.min_price_per_night ? formatPriceText(acc.min_price_per_night, locale) : "฿850"}
                        <small className="text-[11px] font-normal text-slate-500"> {t("catalog.perNight")}</small>
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1B2A24] text-white text-xs font-semibold group-hover:bg-[#D97706] transition-colors shrink-0">
                      <span>{locale === "th" ? "ดูห้องพัก" : "View rooms"}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#1B2A24] hover:bg-slate-100 disabled:opacity-40 transition"
                >
                  {t("catalog.prev")}
                </button>
                <span className="text-xs font-semibold text-slate-500">
                  {t("catalog.pageOf", {
                    page: pagination.page,
                    pages: pagination.total_pages,
                  })}
                </span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#1B2A24] hover:bg-slate-100 disabled:opacity-40 transition"
                >
                  {t("catalog.next")}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
