"use client";

/**
 * (mobile-tourist)/wellness/page.tsx - wellness & spa service list with Eco-Premium styling.
 */
import { useQuery } from "@tanstack/react-query";
import { Clock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { EditorialCard } from "@/components/ui/EditorialCard";
import { extractErrorMessage } from "@/lib/api/errors";
import { getWellnessServices } from "@/lib/api/catalog";
import { formatPriceText } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export default function WellnessPage() {
  const { t, locale } = useI18n();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["wellness-services", page],
    queryFn: () => getWellnessServices({ page, limit: 12 }),
  });

  const rows = data?.data ?? [];
  const pagination = data?.meta?.pagination;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-8 text-cream-50 shadow-xl lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.25),transparent_60%)]" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Traditional & Eco Healing</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide sm:text-4xl text-cream-100">
            {t("catalog.groupWellness")} & Spa Treatments
          </h1>
          <p className="text-sm text-cream-200/80 sm:text-base leading-relaxed">
            ฟื้นฟูร่างกายและจิตใจด้วยศาสตร์การนวดสมุนไพรพื้นบ้าน อบไอน้ำธรรมชาติตามวิถีภูมิปัญญาท้องถิ่น
          </p>
        </div>
      </div>

      {isLoading ? (
        <ListLoading />
      ) : isError ? (
        <ListError
          message={extractErrorMessage(error, t("common.networkError"))}
          onRetry={() => void refetch()}
        />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-12 text-center">
          <p className="text-base font-medium text-muted-foreground">
            {t("catalog.noResults")}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((service) => (
              <EditorialCard
                key={service.id}
                title={service.title}
                subtitle={t("catalog.durationMinutes", { minutes: service.duration_minutes })}
                price={formatPriceText(service.price, locale)}
                badge="Wellness Spa"
                imageUrl={displayImage(undefined, "wellness", service.id, 500)}
                href={`/wellness/${service.id}`}
              />
            ))}
          </div>

          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={pagination.page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t("catalog.prev")}
              </Button>
              <span className="text-xs font-semibold text-muted-foreground">
                {t("catalog.pageOf", {
                  page: pagination.page,
                  pages: pagination.total_pages,
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={pagination.page >= pagination.total_pages || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("catalog.next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

