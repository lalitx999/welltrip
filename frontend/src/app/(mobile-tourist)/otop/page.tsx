"use client";

/**
 * (mobile-tourist)/otop/page.tsx - OTOP product catalog with featured Sisaket T-shirt & Coffee.
 */
import { useQuery } from "@tanstack/react-query";
import { ShoppingBag, Search, SlidersHorizontal, Sparkles, CheckCircle2, ShoppingCart } from "lucide-react";
import { useState, type FormEvent } from "react";

import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import type { MessageKey } from "@/i18n/messages";
import { extractErrorMessage } from "@/lib/api/errors";
import { getOTOPProducts } from "@/lib/api/catalog";
import { formatPriceText } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import {
  OTOP_CATEGORIES,
  type OTOPCategory,
  type OTOPProduct,
} from "@/types/catalog";
import { Button } from "@/components/ui/button";
import { SISAKET_FEATURED_PRODUCTS, SisaketFeaturedProduct } from "@/lib/sisaket-tourism-data";

const CATEGORY_KEYS: Record<OTOPCategory, MessageKey> = {
  HERBAL_PRODUCT: "catalog.otopHerbalProduct",
  TEXTILE: "catalog.otopTextile",
  PROCESSED_FOOD: "catalog.otopProcessedFood",
  CRAFT: "catalog.otopCraft",
};

export default function OtopPage() {
  const { t, locale } = useI18n();
  const [category, setCategory] = useState<OTOPCategory | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [searchDraft, setSearchDraft] = useState("");
  const [searchApplied, setSearchApplied] = useState("");
  const [page, setPage] = useState(1);
  const addItem = useCartStore((s) => s.addItem);

  // Active image selection state for featured products
  const [activeTshirtImg, setActiveTshirtImg] = useState(0);
  const [activeCoffeeImg, setActiveCoffeeImg] = useState(0);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["otop", category, searchApplied, page],
    queryFn: () =>
      getOTOPProducts({
        category: category ? [category] : undefined,
        search: searchApplied || undefined,
        page,
        limit: 12,
      }),
  });

  const rows = data?.data ?? [];
  const pagination = data?.meta?.pagination;

  function addToCart(product: OTOPProduct) {
    addItem({
      item_type: "OTOP_GOODS",
      entity_id: product.id,
      quantity: 1,
      title: product.name,
      unit_price: Number(product.price),
    });
  }

  function addFeaturedToCart(featured: SisaketFeaturedProduct) {
    addItem({
      item_type: "OTOP_GOODS",
      entity_id: featured.id,
      quantity: 1,
      title: featured.name,
      unit_price: featured.price,
    });
  }

  function submitSearch(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearchApplied(searchDraft.trim());
  }

  function pickCategory(value: OTOPCategory | null) {
    setCategory(value);
    setPage(1);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-8 text-cream-50 shadow-xl lg:p-12 border border-gold-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.25),transparent_60%)]" />
        <div className="relative z-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Official Sisaket Souvenirs & OTOP Products</span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-wide sm:text-4xl text-cream-100">
              สินค้า OTOP & ของฝากจังหวัดศรีสะเกษ
            </h1>
            <p className="text-sm text-cream-200/80 sm:text-base leading-relaxed">
              สนับสนุนเสื้อยืดอัตลักษณ์ศรีสะเกษ กาแฟโรบัสต้าดินภูเขาไฟ GI ผลิตภัณฑ์ผ้าทอมือ และสินค้าหัตถกรรมชุมชน
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-label={t("catalog.search")}
              onClick={() => setSearchOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-cream-100/20 bg-cream-100/10 text-cream-100 backdrop-blur-sm transition-colors hover:bg-cream-100/20"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={t("catalog.filter")}
              onClick={() => setFiltersVisible((v) => !v)}
              className={cn(
                "grid h-10 w-10 place-items-center rounded-xl border border-cream-100/20 backdrop-blur-sm transition-colors",
                filtersVisible ? "bg-gold-500 text-forest-950 font-bold" : "bg-cream-100/10 text-cream-100 hover:bg-cream-100/20",
              )}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Featured Products Spotlight: Sisaket T-Shirt & Volcano Coffee */}
      <div className="space-y-6">
        <div className="border-b border-border/60 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-gold-600" />
            <span>สินค้าไฮไลท์ประจำจังหวัดศรีสะเกษ (Official Featured Goods)</span>
          </span>
          <h2 className="font-serif text-2xl font-bold text-foreground mt-0.5">
            สินค้าที่ระลึกและของฝากยอดนิยม
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Featured Product 1: T-Shirt */}
          {SISAKET_FEATURED_PRODUCTS[0] && (() => {
            const prod = SISAKET_FEATURED_PRODUCTS[0];
            return (
              <div className="rounded-3xl border border-gold-500/30 bg-gradient-to-br from-card via-cream-50/50 to-card p-6 shadow-md space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-forest-900 px-3 py-1 text-xs font-bold text-cream-100">
                      เสื้อยืดอัตลักษณ์ศรีสะเกษ
                    </span>
                    <span className="font-serif text-xl font-bold text-forest-900">
                      {prod.priceText}
                    </span>
                  </div>

                  {/* Main Image View */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={prod.images[activeTshirtImg].url}
                      alt={prod.name}
                      className="h-full w-full object-cover transition-all duration-300"
                    />
                    <div className="absolute bottom-3 left-3 bg-forest-950/80 text-cream-100 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold backdrop-blur-sm">
                      {prod.images[activeTshirtImg].label}
                    </div>
                  </div>

                  {/* Image Thumbnails Selector */}
                  <div className="grid grid-cols-4 gap-2">
                    {prod.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveTshirtImg(idx)}
                        className={cn(
                          "relative aspect-square overflow-hidden rounded-xl border transition-all",
                          activeTshirtImg === idx ? "border-gold-500 ring-2 ring-gold-500/40" : "border-border/70 opacity-70 hover:opacity-100"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.label} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 pt-1">
                    <h3 className="font-serif text-lg font-bold text-foreground">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {prod.description}
                    </p>
                    <ul className="space-y-1 pt-1">
                      {prod.highlights.map((hl, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-forest-800 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-gold-600 shrink-0" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60">
                  <Button
                    onClick={() => addFeaturedToCart(prod)}
                    className="w-full rounded-xl font-bold bg-forest-900 hover:bg-forest-800 text-cream-100 shadow-md flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4 text-gold-400" />
                    <span>สั่งซื้อเสื้อยืด (฿{prod.price})</span>
                  </Button>
                </div>
              </div>
            );
          })()}

          {/* Featured Product 2: Volcano Coffee */}
          {SISAKET_FEATURED_PRODUCTS[1] && (() => {
            const prod = SISAKET_FEATURED_PRODUCTS[1];
            return (
              <div className="rounded-3xl border border-amber-400/40 bg-gradient-to-br from-card via-amber-50/30 to-card p-6 shadow-md space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-amber-700 px-3 py-1 text-xs font-bold text-cream-100">
                      กาแฟโรบัสต้าดินภูเขาไฟ GI
                    </span>
                    <span className="font-serif text-xl font-bold text-amber-950">
                      {prod.priceText}
                    </span>
                  </div>

                  {/* Main Image View */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={prod.images[activeCoffeeImg].url}
                      alt={prod.name}
                      className="h-full w-full object-cover transition-all duration-300"
                    />
                    <div className="absolute bottom-3 left-3 bg-amber-950/80 text-cream-100 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold backdrop-blur-sm">
                      {prod.images[activeCoffeeImg].label}
                    </div>
                  </div>

                  {/* Image Thumbnails Selector */}
                  <div className="grid grid-cols-2 gap-2">
                    {prod.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveCoffeeImg(idx)}
                        className={cn(
                          "relative aspect-[16/9] overflow-hidden rounded-xl border transition-all",
                          activeCoffeeImg === idx ? "border-amber-500 ring-2 ring-amber-500/40" : "border-border/70 opacity-70 hover:opacity-100"
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.label} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2 pt-1">
                    <h3 className="font-serif text-lg font-bold text-foreground">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {prod.description}
                    </p>
                    <ul className="space-y-1 pt-1">
                      {prod.highlights.map((hl, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs text-amber-900 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60">
                  <Button
                    onClick={() => addFeaturedToCart(prod)}
                    className="w-full rounded-xl font-bold bg-amber-800 hover:bg-amber-900 text-cream-100 shadow-md flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4 text-gold-300" />
                    <span>สั่งซื้อกาแฟ 500g (฿{prod.price})</span>
                  </Button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Expandable Search Input */}
      {searchOpen && (
        <form onSubmit={submitSearch} className="flex gap-3 max-w-xl">
          <input
            className="w-full rounded-xl border border-border/80 bg-cream-50/50 px-4 py-2.5 text-sm transition-all focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder={t("catalog.search")}
            autoFocus
          />
          <Button
            type="submit"
            disabled={isFetching}
            className="rounded-xl px-6 font-semibold shrink-0"
          >
            {t("catalog.search")}
          </Button>
        </form>
      )}

      {/* Category Pills */}
      {filtersVisible && (
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/60">
          <button
            type="button"
            onClick={() => pickCategory(null)}
            className={cn(
              "rounded-full px-5 py-2.5 text-xs font-semibold tracking-wide transition-all",
              category === null
                ? "bg-forest-900 text-cream-100 shadow-sm"
                : "border border-border/80 bg-card text-muted-foreground hover:bg-cream-100/50 hover:text-foreground",
            )}
          >
            {t("catalog.all")}
          </button>
          {OTOP_CATEGORIES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => pickCategory(value)}
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
      )}

      {/* Product Grid */}
      {isLoading ? (
        <ListLoading />
      ) : isError ? (
        <ListError
          message={extractErrorMessage(error, t("common.networkError"))}
          onRetry={() => void refetch()}
        />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center">
          <p className="text-base font-medium text-muted-foreground">
            {t("catalog.noResults")}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((product) => {
              const soldOut = product.stock_quantity <= 0;
              return (
                <div
                  key={product.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:shadow-md hover:border-gold-500/40"
                >
                  <div>
                    <div className="relative aspect-square w-full overflow-hidden bg-cream-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={displayImage(undefined, "otop", product.id, 500)}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {soldOut && (
                        <div className="absolute inset-0 grid place-items-center bg-forest-950/70 text-xs font-bold text-destructive-foreground backdrop-blur-xs">
                          {t("catalog.outOfStock")}
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="rounded-full bg-forest-950/80 px-2.5 py-1 text-[10px] font-semibold text-cream-100 backdrop-blur-sm">
                          OTOP
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-serif text-base font-bold leading-snug text-foreground group-hover:text-forest-900 transition-colors">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 bg-cream-50/40 p-4">
                    <p className="font-serif font-bold text-forest-900 text-base">
                      {formatPriceText(product.price, locale)}
                    </p>
                    {!soldOut && (
                      <AddToCartButton
                        onAdd={() => addToCart(product)}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold"
                      />
                    )}
                  </div>
                </div>
              );
            })}
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
