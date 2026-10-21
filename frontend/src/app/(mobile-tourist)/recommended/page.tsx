"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  MapPin,
  ChevronRight,
  Compass,
  Sprout,
  Flower2,
  Utensils,
  ShoppingBag,
  Heart,
  Trash2,
  Hotel,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatBaht } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useFavoritesStore } from "@/store/favorites-store";

const CATEGORIES = [
  { id: "all", label: "ทั้งหมด", icon: Compass },
  { id: "nature", label: "ธรรมชาติ & วิถีชีวิต", icon: Sprout },
  { id: "spa", label: "สปา & บำบัด", icon: Flower2 },
  { id: "food", label: "อาหารสุขภาพ", icon: Utensils },
  { id: "culture", label: "วัฒนธรรม & OTOP", icon: ShoppingBag },
];

export default function RecommendedInspirationPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"favorites" | "inspirations">("favorites");
  const [activeCategory, setActiveCategory] = useState("all");

  const favoritesMap = useFavoritesStore((s) => s.favorites);
  const removeFavorite = useFavoritesStore((s) => s.removeFavorite);
  const favoritesList = Object.values(favoritesMap);

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-8">
        
        {/* 1. Banner Section (Hero section) */}
        <div className="relative overflow-hidden rounded-3xl min-h-[300px] md:min-h-[340px] flex flex-col justify-end p-6 md:p-10 text-white shadow-xl border border-stone-200/80 group">
          {/* Image Background */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{
              backgroundImage: "url('/banner1.jpeg')",
            }}
          />
          {/* Dark / Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A24] via-[#1B2A24]/70 to-black/30" />

          {/* Text Area */}
          <div className="relative z-10 space-y-3 max-w-2xl">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[#D97706]/90 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-amber-300/40 backdrop-blur-xs">
                WELLTRIP COLLECTION
              </span>
              <span className="bg-white/20 text-stone-100 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/30 backdrop-blur-xs flex items-center gap-1">
                <Heart className="w-3 h-3 text-rose-400" />
                <span>SAVED & CURATED</span>
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-2xl md:text-3xl font-bold text-white font-serif leading-tight">
              รายการโปรดและแรงบันดาลใจเพื่อการพักใจ
            </h1>

            {/* Description */}
            <p className="text-stone-200 text-sm md:text-base leading-relaxed font-normal">
              รวมสถานที่พักผ่อน เมนูอาหารสุขภาพ และของดีชุมชนที่คุณบันทึกไว้ เพื่อวางแผนทริปท่องเที่ยวที่ตรงใจคุณที่สุด
            </p>
          </div>
        </div>

        {/* 2. Top Tabs: Favorites vs Inspirations */}
        <div className="flex items-center gap-4 border-b border-stone-200/80 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("favorites")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === "favorites"
                ? "bg-[#1B2A24] text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-100"
            )}
          >
            <Heart className={cn("w-4 h-4", activeTab === "favorites" ? "text-rose-400" : "text-stone-400")} />
            <span>รายการโปรดที่บันทึกไว้ ({favoritesList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("inspirations")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              activeTab === "inspirations"
                ? "bg-[#1B2A24] text-white shadow-sm"
                : "bg-white text-stone-600 hover:bg-stone-100"
            )}
          >
            <Sparkles className={cn("w-4 h-4", activeTab === "inspirations" ? "text-amber-300" : "text-stone-400")} />
            <span>ค้นหาแรงบันดาลใจใหม่</span>
          </button>
        </div>

        {/* 3. Tab Content */}
        {activeTab === "favorites" ? (
          <div className="space-y-6">
            {favoritesList.length === 0 ? (
              /* Empty State */
              <div className="rounded-3xl bg-white border border-stone-200/80 p-10 md:p-14 text-center my-6 shadow-xs max-w-2xl mx-auto space-y-5">
                <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 border border-rose-200/60 flex items-center justify-center text-rose-500 shadow-2xs">
                  <Heart className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-stone-800 font-serif">
                    ยังไม่มีรายการโปรดที่บันทึกไว้
                  </h3>
                  <p className="text-stone-500 text-sm max-w-md mx-auto leading-relaxed">
                    เมื่อคุณพบโฮมสเตย์เรือนไม้ ร้านอาหารเพื่อสุขภาพ หรือของดี OTOP ที่ชอบ สามารถกดไอคอนหัวใจเพื่อบันทึกไว้ดูภายหลังได้ที่นี่
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Link
                    href="/hotels"
                    className="bg-[#1B2A24] hover:bg-stone-800 text-white px-5 py-2.5 rounded-xl font-medium text-xs transition-all inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Hotel className="w-4 h-4 text-amber-300" />
                    <span>สำรวจที่พัก</span>
                  </Link>
                  <Link
                    href="/otop"
                    className="bg-stone-100 hover:bg-stone-200 text-stone-800 px-5 py-2.5 rounded-xl font-medium text-xs transition-all inline-flex items-center gap-1.5 shadow-xs border border-stone-200"
                  >
                    <ShoppingBag className="w-4 h-4 text-emerald-700" />
                    <span>ดูของดีชุมชน</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* Favorites Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {favoritesList.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Image container */}
                      <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">
                            <Compass className="w-8 h-8" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFavorite(item.id)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-rose-600 hover:bg-rose-50 transition-colors shadow-xs"
                          title="นำออกจากรายการโปรด"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-[#D97706] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                          {item.type.toUpperCase()}
                        </span>
                        <h4 className="font-serif font-bold text-stone-900 line-clamp-1">
                          {item.title}
                        </h4>
                        {item.location && (
                          <p className="text-xs text-stone-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0 border-t border-stone-100 mt-2 flex items-center justify-between">
                      <span className="font-bold text-sm text-[#1B2A24]">
                        {item.price ? formatBaht(item.price) : "ดูรายละเอียด"}
                      </span>
                      <Link
                        href={item.type === "hotel" ? `/hotels/${item.id}` : `/${item.type}`}
                        className="text-xs font-semibold text-[#D97706] hover:underline inline-flex items-center gap-1"
                      >
                        <span>เปิดดู</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Inspirations Tab */
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#1B2A24] text-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between border border-stone-200/80 gap-6 shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 w-48 h-48 bg-[#D97706]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="space-y-2 max-w-xl relative z-10">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>AI Personalized Trip Curator</span>
                </span>
                <h2 className="text-xl font-bold text-white font-serif">
                  ออกแบบทริปสุขภาพที่ตรงกับตัวตนของคุณ
                </h2>
                <p className="text-stone-300 text-sm leading-relaxed">
                  ตอบแบบสอบถามสั้นๆ เพื่อให้ระบบ AI แนะนำที่พัก กิจกรรมบำบัด และเมนูอาหารตามค่าดัชนีสุขภาพของคุณ
                </p>
              </div>
              <div className="relative z-10 shrink-0 w-full md:w-auto">
                <Link
                  href="/health"
                  className="bg-white hover:bg-stone-100 text-stone-900 px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 group w-full md:w-auto"
                >
                  <span>เริ่มประเมินสุขภาพ</span>
                  <ArrowRight className="w-4 h-4 text-[#1B2A24] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
