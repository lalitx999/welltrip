"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronRight,
  Minus,
  Package,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Wheat,
  X,
} from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { PageHeading } from "@/components/travel/Primitives";
import { getOTOPProducts } from "@/lib/api/catalog";
import { extractErrorMessage } from "@/lib/api/errors";
import { formatBaht, toNumber } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { useI18n } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import type { OTOPCategory, OTOPProduct } from "@/types/catalog";
import { OTOP_CATEGORIES } from "@/types/catalog";

const otopCategoryLabels: Record<OTOPCategory, { th: string; en: string }> = {
  HERBAL_PRODUCT: { th: "สมุนไพร & สปา", en: "Herbs & Spa" },
  TEXTILE: { th: "ผ้าทอพื้นเมือง", en: "Local Textiles" },
  PROCESSED_FOOD: { th: "อาหารแปรรูป & GI", en: "Processed Food & GI" },
  CRAFT: { th: "หัตถกรรมจักสาน", en: "Handicrafts" },
};

export default function OtopPage() {
  const { locale } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [activeProduct, setActiveProduct] = useState<OTOPProduct | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (activeProduct) {
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
  }, [activeProduct]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["otop-products", selectedCategory, searchQuery, page],
    queryFn: () =>
      getOTOPProducts({
        category: selectedCategory ? (selectedCategory as OTOPCategory) : undefined,
        search: searchQuery || undefined,
        page,
        limit: 12,
      }),
  });

  const productsList = data?.data ?? [];

  function handleAddToCart(product: OTOPProduct, quantity = 1) {
    addItem({
      item_type: "OTOP_GOODS",
      entity_id: product.id,
      quantity,
      title: product.name,
      unit_price: toNumber(product.price),
      image_url: product.image_url || undefined,
    });

    const msg = locale === "th"
      ? `เพิ่ม "${product.name}" จำนวน ${quantity} ชิ้นลงตะกร้าแล้ว`
      : `Added ${quantity}x "${product.name}" to cart`;
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);

    if (activeProduct) {
      setActiveProduct(null);
      setModalQty(1);
    }
  }

  function openQuickView(product: OTOPProduct) {
    setActiveProduct(product);
    setModalQty(1);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearchQuery(searchDraft.trim());
    setPage(1);
  }

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-6 pb-28 lg:pb-12 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Header Title Section */}
        <PageHeading
          eyebrow="LOCAL TREASURES & CRAFTS"
          title={locale === "th" ? "ของดีที่มีเรื่องราว" : "Sisaket Community Treasures"}
          description={
            locale === "th"
              ? "คัดสรรสินค้า OTOP งานหัตถกรรม ผ้าทอ 4 ชนเผ่า และผลิตภัณฑ์ GI ศรีสะเกษ แท้ 100% จากวิสาหกิจชุมชน"
              : "Explore authentic Sisaket OTOP local crafts, handwoven textiles, and certified GI heritage treasures."
          }
        />

        {/* Search Bar Container */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col sm:flex-row items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/80 shadow-xs"
        >
          <div className="flex-1 flex items-center gap-2.5 px-3 w-full">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder={
                locale === "th"
                  ? "ค้นหาของดีศรีสะเกษ เช่น ผ้าทอ, หอมแดง, กาแฟ..."
                  : "Search Sisaket crafts, coffee, textiles..."
              }
              className="w-full bg-transparent text-xs font-semibold text-[#1B2A24] outline-none placeholder:text-slate-400"
            />
            {searchDraft && (
              <button
                type="button"
                onClick={() => {
                  setSearchDraft("");
                  setSearchQuery("");
                  setPage(1);
                }}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1B2A24] text-white font-semibold text-xs hover:bg-[#151d1a] transition-all flex items-center justify-center gap-2 shadow-xs shrink-0"
          >
            <span>{locale === "th" ? "ค้นหาสินค้า" : "Search"}</span>
          </button>
        </form>

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
            {locale === "th" ? "ทั้งหมด" : "All Treasures"}
          </button>
          {OTOP_CATEGORIES.map((catKey) => {
            const isActive = selectedCategory === catKey;
            const label = locale === "th" ? otopCategoryLabels[catKey].th : otopCategoryLabels[catKey].en;
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

        {/* Product Grid Feed */}
        {isLoading ? (
          <ListLoading />
        ) : isError ? (
          <ListError
            message={extractErrorMessage(error, "ไม่สามารถโหลดข้อมูลสินค้า OTOP ได้")}
            onRetry={() => void refetch()}
          />
        ) : productsList.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-medium text-slate-600">
              {locale === "th"
                ? "ยังไม่มีรายการสินค้าในหมวดนี้ ลองค้นหาคำอื่น"
                : "No products found in this category."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {productsList.map((product) => {
              const categoryTag =
                otopCategoryLabels[product.category]?.[locale === "th" ? "th" : "en"] || "ของดีชุมชน";
              const inStock = product.stock_quantity > 0;

              return (
                <div
                  key={product.id}
                  className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs hover:shadow-md hover:border-[#D97706] transition-all group flex flex-col justify-between cursor-pointer"
                  onClick={() => openQuickView(product)}
                >
                  <div className="space-y-3">
                    {/* 1:1 Aspect Ratio Square Image Thumbnail */}
                    <div className="relative aspect-square bg-stone-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={displayImage(product.image_url, "otop", product.id, 600)}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Top-Left GI / Heritage Badge */}
                      <div className="absolute top-2.5 left-2.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#1B2A24]/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white border border-[#D97706]/40 shadow-sm">
                          <Sparkles className="w-3 h-3 text-[#D97706]" />
                          <span>{locale === "th" ? "GI ศรีสะเกษ" : "GI Certified"}</span>
                        </span>
                      </div>

                      {/* Top-Right Price Floating Badge */}
                      <div className="absolute top-2.5 right-2.5">
                        <span className="inline-flex items-center rounded-full bg-white/95 backdrop-blur-md text-[#1B2A24] px-3 py-1 text-xs font-serif font-bold shadow-md border border-slate-200/90">
                          {formatBaht(product.price)}
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="px-3.5 space-y-1">
                      <span className="block text-[10px] font-bold text-[#D97706] uppercase tracking-wider">
                        {categoryTag}
                      </span>
                      <h3 className="font-serif text-sm font-bold text-[#1B2A24] group-hover:text-[#D97706] transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-1">
                        {product.description ||
                          (locale === "th"
                            ? "งานหัตถกรรมประณีตจากภูมิปัญญาวิสาหกิจชุมชนศรีสะเกษ"
                            : "Artisan craft from Sisaket community enterprise.")}
                      </p>
                      <div className="pt-1">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-block ${
                            inStock
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : "bg-rose-50 text-rose-600 border border-rose-200/60"
                          }`}
                        >
                          {inStock
                            ? locale === "th" ? `พร้อมส่ง (เหลือ ${product.stock_quantity} ชิ้น)` : `In Stock (${product.stock_quantity})`
                            : locale === "th" ? "สินค้าหมดชั่วคราว" : "Out of stock"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-3.5 border-t border-slate-100 mt-3 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-500 font-medium group-hover:text-[#1B2A24] transition-colors">
                      {locale === "th" ? "ดูเรื่องราวสินค้า" : "View story"}
                    </span>
                    <button
                      type="button"
                      disabled={!inStock}
                      aria-label="เพิ่มลงตะกร้าแบบด่วน"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (inStock) handleAddToCart(product, 1);
                      }}
                      className="p-2 rounded-xl bg-slate-100 text-[#1B2A24] hover:bg-[#1B2A24] hover:text-white disabled:opacity-40 transition-colors"
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

        {/* In-Page Quick-View Modal / Bottom Sheet Drawer (Teleported to document.body) */}
        {activeProduct && mounted && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 touch-none"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setActiveProduct(null);
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
              
              {/* Left / Top Square Image Showcase */}
              <div className="relative w-full md:w-1/2 aspect-square bg-stone-100 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayImage(activeProduct.image_url, "otop", activeProduct.id, 800)}
                  alt={activeProduct.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
                
                {/* Mobile Floating Badge */}
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1B2A24]/90 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white border border-[#D97706]/40 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>
                      {otopCategoryLabels[activeProduct.category]?.[locale === "th" ? "th" : "en"] || "ของดีศรีสะเกษ"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Right / Bottom Details Section */}
              <div className="w-full md:w-1/2 p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] md:pb-6 space-y-5 overflow-y-auto overscroll-contain flex flex-col justify-between bg-white">
                <div className="space-y-4">
                  
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider block">
                        SISAKET ARTISAN HERITAGE
                      </span>
                      <h2 className="font-serif text-xl font-bold text-[#1B2A24] leading-snug">
                        {activeProduct.name}
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveProduct(null);
                        setModalQty(1);
                      }}
                      className="p-1.5 rounded-full bg-slate-100 hover:bg-[#1B2A24] hover:text-white text-slate-500 transition-colors shrink-0"
                      aria-label="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Price & Stock Badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-2xl font-bold text-[#1B2A24]">
                      {formatBaht(activeProduct.price)}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        activeProduct.stock_quantity > 0
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-rose-50 text-rose-600 border border-rose-200/60"
                      }`}
                    >
                      {activeProduct.stock_quantity > 0
                        ? locale === "th" ? `สต็อกคงเหลือ ${activeProduct.stock_quantity} ชิ้น` : `${activeProduct.stock_quantity} in stock`
                        : locale === "th" ? "สินค้าหมด" : "Out of stock"}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {activeProduct.description ||
                      (locale === "th"
                        ? "ผลิตภัณฑ์ภูมิปัญญาท้องถิ่นศรีสะเกษ ถ่ายทอดมรดกทางวัฒนธรรม 4 ชนเผ่า พิถีพิถันทุกขั้นตอนการผลิต ปลอดสารเคมีและเป็นมิตรต่อสิ่งแวดล้อม"
                        : "Handcrafted local treasure preserving Sisaket's 4-ethnic cultural heritage.")}
                  </p>

                  {/* Origin & Quality Guarantee Card */}
                  <div className="rounded-xl bg-amber-50/60 border border-[#D97706]/30 p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#D97706]">
                      <Wheat className="w-4 h-4" />
                      <span>{locale === "th" ? "วิสาหกิจชุมชนศรีสะเกษ แท้ 100%" : "100% Authentic Community Enterprise"}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {locale === "th"
                        ? "ผลิตโดยกลุ่มแม่บ้านและวิสาหกิจชุมชนจังหวัดศรีสะเกษ รายได้จากการอุดหนุนหมุนเวียนสร้างอาชีพแก่คนในพื้นที่โดยตรง"
                        : "Sourced directly from local women's groups and community enterprises in Sisaket."}
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
                        disabled={modalQty >= activeProduct.stock_quantity}
                        onClick={() => setModalQty((q) => q + 1)}
                        className="grid h-8 w-8 place-items-center text-slate-500 hover:text-[#1B2A24] disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Primary CTA Button */}
                  <button
                    type="button"
                    disabled={activeProduct.stock_quantity <= 0}
                    onClick={() => handleAddToCart(activeProduct, modalQty)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#1B2A24] text-white font-semibold text-xs hover:bg-[#151d1a] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md group"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#D97706] group-hover:scale-110 transition-transform" />
                    <span>
                      {activeProduct.stock_quantity > 0
                        ? locale === "th"
                          ? `เพิ่มลงตะกร้า • ${formatBaht(toNumber(activeProduct.price) * modalQty)}`
                          : `Add to Cart • ${formatBaht(toNumber(activeProduct.price) * modalQty)}`
                        : locale === "th"
                        ? "สินค้าหมดชั่วคราว"
                        : "Out of stock"}
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
