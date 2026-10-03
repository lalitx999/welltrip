"use client";

/**
 * (mobile-tourist)/foods/page.tsx - healthy food catalog with Eco-Premium styling.
 */
import { useQuery } from "@tanstack/react-query";
import { Flame, UtensilsCrossed, Leaf } from "lucide-react";
import { useState } from "react";

import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import type { MessageKey } from "@/i18n/messages";
import { extractErrorMessage } from "@/lib/api/errors";
import { getFoods } from "@/lib/api/catalog";
import { formatPriceText, toNumber } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import {
  FOOD_WELLNESS_CATEGORIES,
  type FoodMenu,
  type FoodWellnessCategory,
} from "@/types/catalog";
import { Button } from "@/components/ui/button";

const CATEGORY_KEYS: Record<FoodWellnessCategory, MessageKey> = {
  LOW_SUGAR: "catalog.foodLowSugar",
  LOW_SODIUM: "catalog.foodLowSodium",
  ORGANIC: "catalog.foodOrganic",
  HERBAL: "catalog.foodHerbal",
  VEGAN: "catalog.foodVegan",
};

export default function FoodsPage() {
  const { t, locale } = useI18n();
  const [category, setCategory] = useState<FoodWellnessCategory | null>(null);
  const [page, setPage] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["foods", category, page],
    queryFn: () =>
      getFoods({
        category: category ? [category] : undefined,
        page,
        limit: 12,
      }),
  });

  const rows = data?.data ?? [];
  const pagination = data?.meta?.pagination;

  function addToCart(menu: FoodMenu) {
    addItem({
      item_type: "FOOD_ORDER",
      entity_id: menu.id,
      quantity: 1,
      title: menu.name,
      unit_price: toNumber(menu.price),
      image_url: menu.image_url || undefined,
    });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-8 text-cream-50 shadow-xl lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.25),transparent_60%)]" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
            <UtensilsCrossed className="h-3.5 w-3.5" />
            <span>Farm to Table Wellness</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide sm:text-4xl text-cream-100">
            {t("catalog.groupFoods")} & Organic Dining
          </h1>
          <p className="text-sm text-cream-200/80 sm:text-base leading-relaxed">
            อาหารเพื่อสุขภาพ ปรุงจากวัตถุดิบอินทรีย์พื้นบ้าน ปราศจากสารเคมี ส่งตรงจากเกษตรกรในชุมชน
          </p>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setCategory(null);
            setPage(1);
          }}
          className={cn(
            "rounded-full px-5 py-2.5 text-xs font-semibold tracking-wide transition-all",
            category === null
              ? "bg-forest-900 text-cream-100 shadow-sm"
              : "border border-border/80 bg-card text-muted-foreground hover:bg-cream-100/50 hover:text-foreground",
          )}
        >
          {t("catalog.all")}
        </button>
        {FOOD_WELLNESS_CATEGORIES.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setCategory(value);
              setPage(1);
            }}
            className={cn(
              "rounded-full px-5 py-2.5 text-xs font-semibold tracking-wide transition-all",
              category === value
                ? "bg-forest-900 text-cream-100 shadow-sm"
                : "border border-border/80 bg-card text-muted-foreground hover:bg-cream-100/50 hover:text-foreground",
            )}
          >
            {t(CATEGORY_KEYS[value])}
          </button>
        ))}
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
            {rows.map((menu) => (
              <div
                key={menu.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:shadow-md hover:border-gold-500/40"
              >
                <div>
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayImage(menu.image_url, "food", menu.id, 500)}
                      alt={menu.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      <span className="rounded-full bg-forest-950/80 px-2.5 py-1 text-[10px] font-semibold text-cream-100 backdrop-blur-sm">
                        {t(CATEGORY_KEYS[menu.wellness_category])}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="font-serif text-base font-bold leading-snug text-foreground group-hover:text-forest-900 transition-colors">
                      {menu.name}
                    </h3>
                    {menu.calorie_estimate !== null && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                        <Flame className="h-3.5 w-3.5 text-gold-600" aria-hidden="true" />
                        <span>{menu.calorie_estimate} kcal</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/60 bg-cream-50/40 p-4">
                  <p className="font-serif font-bold text-forest-900 text-base">
                    {formatPriceText(menu.price, locale)}
                  </p>
                  <AddToCartButton
                    onAdd={() => addToCart(menu)}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold"
                  />
                </div>
              </div>
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

