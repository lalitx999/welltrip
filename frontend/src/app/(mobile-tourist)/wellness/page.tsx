"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Heart,
  Leaf,
  Sparkles,
  Utensils,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { PageHeading } from "@/components/travel/Primitives";
import { getWellnessServices } from "@/lib/api/catalog";
import { extractErrorMessage } from "@/lib/api/errors";
import { formatBaht } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { useI18n } from "@/lib/i18n";
import type { WellnessService } from "@/types/catalog";

const wellnessCategories = [
  { id: "all", th: "ทั้งหมด", en: "All Treatments" },
  { id: "facial", th: "พอกหน้าและดีท็อกซ์", en: "Facial Detox & Mask" },
  { id: "foot", th: "นวดกดจุดสะท้อนเท้า", en: "Reflexology Foot Massage" },
  { id: "aroma", th: "นวดอโรมาน้ำมันมะพร้าว", en: "Coconut Oil Aroma Spa" },
  { id: "herbal", th: "ประคบสมุนไพรโบราณ", en: "Traditional Herbal Compress" },
];

export default function WellnessPage() {
  const { locale } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["wellness-services", page],
    queryFn: () => getWellnessServices({ page, limit: 12 }),
  });

  const servicesList = data?.data ?? [];

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-6 pb-28 lg:pb-12 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Header Section */}
        <PageHeading
          eyebrow="TIME TO UNWIND & RECHARGE"
          title={locale === "th" ? "ให้วันนี้เป็นวันพักผ่อน ฟื้นฟูกายใจด้วยสมุนไพรแท้" : "Serene Herbal Spa & Unwind"}
          description={
            locale === "th"
              ? "คัดสรรบริการนวดแผนไทย สปาสมุนไพรสด และทรีตเมนต์บำบัดจากผู้ให้บริการวิสาหกิจชุมชนศรีสะเกษ"
              : "Discover authentic local herbal spa treatments and traditional Thai massage from Sisaket community enterprises."
          }
        />

        {/* Category Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {wellnessCategories.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setPage(1);
                }}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all shadow-xs ${
                  isActive
                    ? "bg-[#1B2A24] text-white shadow-sm"
                    : "bg-white border border-stone-200 text-stone-700 hover:border-stone-400"
                }`}
              >
                {locale === "th" ? cat.th : cat.en}
              </button>
            );
          })}
        </div>

        {/* Wellness Services Grid */}
        {isLoading ? (
          <ListLoading />
        ) : isError ? (
          <ListError
            message={extractErrorMessage(error, "ไม่สามารถโหลดรายการสปาได้")}
            onRetry={() => void refetch()}
          />
        ) : servicesList.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-medium text-slate-600">
              {locale === "th" ? "ยังไม่มีบริการในหมวดหมู่นี้" : "No services found in this category."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicesList.map((service) => (
              <div
                key={service.id}
                className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-[#D97706] transition-all group flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* 16:9 Image Thumbnail */}
                  <div className="relative aspect-[16/9] bg-stone-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayImage(service.image_url, "wellness", service.id, 600)}
                      alt={service.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Top-Left Duration Pill */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1B2A24]/85 backdrop-blur-md px-3 py-1 text-[10px] font-bold text-white border border-[#D97706]/40 shadow-sm">
                        <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>{service.duration_minutes} {locale === "th" ? "นาที" : "min"}</span>
                      </span>
                    </div>

                    {/* Top-Right Price Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center rounded-full bg-white/95 backdrop-blur-md text-[#1B2A24] px-3 py-1 text-xs font-serif font-bold shadow-md border border-slate-200/90">
                        {formatBaht(service.price)}
                      </span>
                    </div>
                  </div>

                  {/* Card Main Info */}
                  <div className="px-5 space-y-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-[#D97706] font-bold uppercase tracking-wider">
                      <Leaf className="w-3.5 h-3.5 shrink-0" />
                      <span>{locale === "th" ? "ศาสตร์การบำบัดพื้นถิ่นศรีสะเกษ" : "Local Heritage Spa"}</span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-[#1B2A24] group-hover:text-[#D97706] transition-colors line-clamp-1">
                      {service.title}
                    </h3>

                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {service.description ||
                        (locale === "th"
                          ? "ผ่อนคลายกล้ามเนื้อและฟื้นฟูผิวพรรณด้วยไพลสดและขมิ้นชันอินทรีย์ ปรุงสดใหม่โดยผู้เชี่ยวชาญชุมชน"
                          : "Relieve muscle fatigue and nourish skin with fresh organic herbal compress.")}
                    </p>

                    <div className="pt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg w-fit border border-emerald-200/60">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{locale === "th" ? "วัตถุดิบอินทรีย์ 100%" : "100% Organic Ingredients"}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="p-5 border-t border-slate-100 mt-4">
                  <Link
                    href={`/wellness/${service.id}`}
                    className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-[#1B2A24] hover:text-white text-[#1B2A24] font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs group/btn"
                  >
                    <Calendar className="w-4 h-4 text-[#D97706] group-hover/btn:text-[#D97706]" />
                    <span>{locale === "th" ? "เลือกรอบเวลาการเข้าบริการ" : "Select Time Slot"}</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
