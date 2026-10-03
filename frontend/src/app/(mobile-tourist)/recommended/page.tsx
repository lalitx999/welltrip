"use client";

/**
 * (mobile-tourist)/recommended/page.tsx - Curated Recommended Wellness Experiences.
 */
import { useQuery } from "@tanstack/react-query";
import { HeartHandshake, MapPin, Star, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { EditorialCard } from "@/components/ui/EditorialCard";
import { extractErrorMessage } from "@/lib/api/errors";
import { getAccommodations } from "@/lib/api/catalog";
import { formatBaht } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function RecommendedPage() {
  const { t } = useI18n();

  const recommendQuery = useQuery({
    queryKey: ["recommended-full"],
    queryFn: () => getAccommodations({ page: 1, limit: 12 }),
  });

  const rows = recommendQuery.data?.data ?? [];

  const curatedExperiences = [
    {
      id: "rec-1",
      title: "นครลำดวนโฮมสเตย์เรือนไม้",
      category: "Homestay Stay",
      location: "อ.ขุนหาญ, ศรีสะเกษ",
      price: "900 บาท/คืน",
      rating: 4.9,
      badge: "ยอดนิยมอันดับ 1",
      image: "/images/hero_lanna_homestay.jpg",
      href: "/hotels",
    },
    {
      id: "rec-2",
      title: "สำรับอาหารอินทรีย์สมุนไพรพื้นถิ่น",
      category: "Healthy Dining",
      location: "ศรีสะเกษ",
      price: "250 บาท/ท่าน",
      rating: 4.9,
      badge: " Farm to Table",
      image: "/images/organic_community_food.jpg",
      href: "/foods",
    },
    {
      id: "rec-3",
      title: "สปานวดประคบสมุนไพรไทยโบราณ",
      category: "Herbal Spa",
      location: "ศรีสะเกษ",
      price: "450 บาท/60 นาที",
      rating: 4.9,
      badge: "ผ่อนคลาย",
      image: "/images/eco_wellness_spa.jpg",
      href: "/wellness",
    },
    {
      id: "rec-4",
      title: "โยคะสมาธิตามวิถีธรรมชาติ",
      category: "Mindfulness",
      location: "ศรีสะเกษ",
      price: "300 บาท/ท่าน",
      rating: 4.8,
      badge: "กิจกรรมชุมชน",
      image: "/images/hero_lanna_homestay.jpg",
      href: "/wellness",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-8 text-cream-50 shadow-xl lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.25),transparent_60%)]" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
            <HeartHandshake className="h-3.5 w-3.5" />
            <span>Curated For Your Wellness Journey</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide sm:text-4xl text-cream-100">
            แนะนำสำหรับคุณ (Recommended)
          </h1>
          <p className="text-sm text-cream-200/80 sm:text-base leading-relaxed">
            คัดสรรโฮมสเตย์ สำรับอาหารสุขภาพ และทริปนวดสปาที่ได้รับความพึงพอใจสูงสุดจากผู้ใช้บริการ
          </p>
        </div>
      </div>

      {/* Top Highlight Cards */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold-600" />
          <span>ประสบการณ์ยอดนิยมระดับ 5 ดาว</span>
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {curatedExperiences.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-md"
            >
              <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-forest-900/90 px-2.5 py-0.5 text-[10px] font-bold text-cream-100 backdrop-blur-sm">
                      {item.badge}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-1.5">
                  <h3 className="font-serif text-base font-bold text-foreground group-hover:text-forest-900 transition-colors">
                    {item.title}
                  </h3>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-gold-600" />
                    <span>{item.location}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 bg-cream-50/40 p-4">
                <span className="font-serif font-bold text-forest-900 text-sm">
                  {item.price}
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-foreground">
                  <Star className="h-3.5 w-3.5 fill-gold-500 text-gold-500" />
                  <span>{item.rating}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Accommodations Feed */}
      <div className="space-y-4 pt-4 border-t border-border/60">
        <h2 className="font-serif text-xl font-bold text-foreground">
          โฮมสเตย์อนุรักษ์แนะนำทั้งหมด (All Recommended Homestays)
        </h2>

        {recommendQuery.isLoading ? (
          <ListLoading />
        ) : recommendQuery.isError ? (
          <ListError
            message={extractErrorMessage(recommendQuery.error, t("common.networkError"))}
            onRetry={() => void recommendQuery.refetch()}
          />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("catalog.noResults")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((acc) => (
              <EditorialCard
                key={acc.id}
                title={acc.name}
                subtitle={acc.province}
                price={acc.min_price_per_night ? formatBaht(acc.min_price_per_night) : "฿0"}
                priceUnit={t("catalog.perNight")}
                badge="Recommended"
                imageUrl={displayImage(undefined, "hotel", acc.id, 500)}
                href={`/hotels/${acc.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
