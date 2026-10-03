"use client";

/**
 * (mobile-tourist)/hotels/page.tsx - homestay search list with Eco-Premium styling.
 */
import { useQuery } from "@tanstack/react-query";
import { Hotel, MapPin, RotateCcw, Search, Filter, Calendar } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { EditorialCard } from "@/components/ui/EditorialCard";
import { extractErrorMessage } from "@/lib/api/errors";
import { getAccommodations } from "@/lib/api/catalog";
import { formatPriceText } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { useI18n } from "@/lib/i18n";

const PAGE_SIZE = 12;

interface Filters {
  province: string;
  guests: string;
  checkin: string;
  checkout: string;
  min: string;
  max: string;
}

const EMPTY_FILTERS: Filters = {
  province: "",
  guests: "",
  checkin: "",
  checkout: "",
  min: "",
  max: "",
};

export default function HotelsPage() {
  const { t, locale } = useI18n();
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [dateError, setDateError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["accommodations", applied, page],
    queryFn: () =>
      getAccommodations({
        province: applied.province || undefined,
        guests: applied.guests ? Number(applied.guests) : undefined,
        checkin: applied.checkin && applied.checkout ? applied.checkin : undefined,
        checkout: applied.checkin && applied.checkout ? applied.checkout : undefined,
        min_price: applied.min ? Number(applied.min) : undefined,
        max_price: applied.max ? Number(applied.max) : undefined,
        page,
        limit: PAGE_SIZE,
      }),
    placeholderData: (prev) => prev,
  });

  function applyFilters() {
    if (draft.checkin && draft.checkout && draft.checkout <= draft.checkin) {
      setDateError(t("catalog.chooseCheckoutFirst"));
      return;
    }
    setDateError(null);
    setPage(1);
    setApplied({ ...draft });
  }

  function resetFilters() {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setPage(1);
    setDateError(null);
  }

  const set = (key: keyof Filters) => (value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const rows = data?.data ?? [];
  const pagination = data?.meta?.pagination;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-8 text-cream-50 shadow-xl lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.25),transparent_60%)]" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
            <Hotel className="h-3.5 w-3.5" />
            <span>Eco-Friendly Accommodations</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide sm:text-4xl text-cream-100">
            {t("nav.hotels")} & Eco-Stays
          </h1>
          <p className="text-sm text-cream-200/80 sm:text-base leading-relaxed">
            สัมผัสการพักผ่อนท่ามกลางธรรมชาติ โฮมสเตย์ชุมชนทรงคุณค่า และสถาปัตยกรรมล้านนาที่เปี่ยมด้วยเสน่ห์
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-center gap-2 border-b border-border/50 pb-3">
          <Filter className="h-4 w-4 text-forest-700" />
          <h2 className="font-serif font-bold text-foreground">ค้นหาที่พัก (Filter Accommodations)</h2>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters();
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label htmlFor="province" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                {t("catalog.province")}
              </label>
              <input
                id="province"
                className="w-full rounded-xl border border-border/80 bg-cream-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
                value={draft.province}
                onChange={(e) => set("province")(e.target.value)}
                placeholder="เช่น เชียงใหม่, น่าน"
              />
            </div>
            <div>
              <label htmlFor="guests" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                {t("catalog.guests")} (จำนวนผู้เข้าพัก)
              </label>
              <input
                id="guests"
                type="number"
                min={1}
                max={10}
                className="w-full rounded-xl border border-border/80 bg-cream-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
                value={draft.guests}
                onChange={(e) => set("guests")(e.target.value)}
                placeholder="1–10 ท่าน"
              />
            </div>
            <div>
              <label htmlFor="minPrice" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                {t("catalog.minPrice")} (฿)
              </label>
              <input
                id="minPrice"
                type="number"
                min={0}
                className="w-full rounded-xl border border-border/80 bg-cream-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
                value={draft.min}
                onChange={(e) => set("min")(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="maxPrice" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                {t("catalog.maxPrice")} (฿)
              </label>
              <input
                id="maxPrice"
                type="number"
                min={0}
                className="w-full rounded-xl border border-border/80 bg-cream-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
                value={draft.max}
                onChange={(e) => set("max")(e.target.value)}
                placeholder="ไม่จำกัด"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="checkin" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                {t("catalog.checkinDate")}
              </label>
              <input
                id="checkin"
                type="date"
                className="w-full rounded-xl border border-border/80 bg-cream-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
                value={draft.checkin}
                onChange={(e) => set("checkin")(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="checkout" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                {t("catalog.checkoutDate")}
              </label>
              <input
                id="checkout"
                type="date"
                className="w-full rounded-xl border border-border/80 bg-cream-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
                value={draft.checkout}
                onChange={(e) => set("checkout")(e.target.value)}
              />
            </div>
          </div>

          {dateError && <p className="text-xs font-medium text-destructive">{dateError}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={resetFilters} className="rounded-xl border-border/80 px-4">
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("catalog.reset")}
            </Button>
            <Button type="submit" variant="default" disabled={isFetching} className="rounded-xl px-6 font-semibold">
              <Search className="mr-2 h-4 w-4" />
              {t("catalog.search")}
            </Button>
          </div>
        </form>
      </div>

      {/* Results Grid */}
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
            {rows.map((acc) => (
              <EditorialCard
                key={acc.id}
                title={acc.name}
                subtitle={acc.province}
                price={acc.min_price_per_night ? formatPriceText(acc.min_price_per_night, locale) : undefined}
                priceUnit={acc.min_price_per_night ? t("catalog.perNight") : undefined}
                badge="Homestay"
                imageUrl={displayImage(undefined, "hotel", acc.id, 500)}
                href={`/hotels/${acc.id}`}
              />
            ))}
          </div>

          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-6">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                disabled={pagination.page <= 1}
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
                disabled={pagination.page >= pagination.total_pages}
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

