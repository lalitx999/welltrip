"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { HeartHandshake, MapPin, Star, Sparkles, ArrowRight, Compass, Landmark, Trees } from "lucide-react";
import Link from "next/link";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { EditorialCard } from "@/components/ui/EditorialCard";
import { extractErrorMessage } from "@/lib/api/errors";
import { getAccommodations } from "@/lib/api/catalog";
import { formatBaht } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { SISAKET_ATTRACTIONS, SisaketAttraction } from "@/lib/sisaket-tourism-data";

export default function RecommendedPage() {
  const { t } = useI18n();
  const [activeCategory, setActiveCategory] = useState<"ALL" | "NATURAL" | "CULTURAL" | "HISTORICAL">("ALL");

  const recommendQuery = useQuery({
    queryKey: ["recommended-full"],
    queryFn: () => getAccommodations({ page: 1, limit: 12 }),
  });

  const rows = recommendQuery.data?.data ?? [];

  const filteredAttractions = SISAKET_ATTRACTIONS.filter((item) => {
    if (activeCategory === "ALL") return true;
    return item.category === activeCategory;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-8 text-cream-50 shadow-xl lg:p-12 border border-gold-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.25),transparent_60%)]" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
            <HeartHandshake className="h-3.5 w-3.5" />
            <span>Official Sisaket Tourism Guide · คู่มือท่องเที่ยวศรีสะเกษ</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide sm:text-4xl text-cream-100">
            สถานที่ท่องเที่ยวแนะนำจังหวัดศรีสะเกษ (31 แห่ง)
          </h1>
          <p className="text-sm text-cream-200/80 sm:text-base leading-relaxed">
            สำรวจ 31 แหล่งท่องเที่ยวธรรมชาติ ศิลปวัฒนธรรม ศาสนสถาน และปราสาทขอมโบราณ คัดสรรจากข้อมูลการท่องเที่ยวจังหวัดศรีสะเกษ
          </p>
        </div>
      </div>

      {/* Category Tabs & Attractions Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
              <Compass className="h-6 w-6 text-gold-600" />
              <span>จุดหมายปลายทางยอดนิยม</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              แสดง {filteredAttractions.length} จาก 31 สถานที่ท่องเที่ยวในจังหวัดศรีสะเกษ
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeCategory === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("ALL")}
              className="rounded-xl text-xs"
            >
              ทั้งหมด (31)
            </Button>
            <Button
              variant={activeCategory === "NATURAL" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("NATURAL")}
              className="rounded-xl text-xs"
            >
              <Trees className="mr-1.5 h-3.5 w-3.5" />
              ธรรมชาติ (13)
            </Button>
            <Button
              variant={activeCategory === "CULTURAL" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("CULTURAL")}
              className="rounded-xl text-xs"
            >
              <Landmark className="mr-1.5 h-3.5 w-3.5" />
              วัด & วัฒนธรรม (9)
            </Button>
            <Button
              variant={activeCategory === "HISTORICAL" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("HISTORICAL")}
              className="rounded-xl text-xs"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              ปราสาทโบราณ (9)
            </Button>
          </div>
        </div>

        {/* Attractions Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAttractions.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-md"
            >
              <div>
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-cream-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-forest-900/90 px-2.5 py-0.5 text-[10px] font-bold text-cream-100 backdrop-blur-sm">
                      {item.categoryLabel}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-forest-900 transition-colors">
                      {item.name}
                    </h3>
                    <span className="flex items-center gap-1 text-xs font-semibold text-forest-800 shrink-0">
                      <MapPin className="h-3.5 w-3.5 text-gold-600" />
                      {item.district}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {item.description}
                  </p>

                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {item.highlights.map((hl, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-cream-50 px-2 py-0.5 text-[10px] font-medium text-forest-900 border border-border/60"
                      >
                        {hl}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 bg-cream-50/40 p-4 px-5">
                <span className="text-xs font-semibold text-forest-900">
                  จังหวัดศรีสะเกษ
                </span>
                <Link href="/hotels">
                  <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs font-semibold text-forest-900 hover:text-gold-700">
                    <span>ค้นหาที่พักใกล้เคียง</span>
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accommodations Feed */}
      <div className="space-y-4 pt-6 border-t border-border/60">
        <h2 className="font-serif text-xl font-bold text-foreground">
          โฮมสเตย์และที่พักแนะนำ (Recommended Homestays & Stays)
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
