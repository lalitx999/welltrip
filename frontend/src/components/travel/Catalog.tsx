"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Clock, ArrowUpRight, Search, ShoppingBag } from "lucide-react";
import {
  getFoods,
  getOTOPProducts,
  getWellnessServices,
} from "@/lib/api/catalog";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Alert } from "@/components/ui/alert";
import { extractErrorMessage } from "@/lib/api/errors";
import { useCartStore } from "@/store/cart-store";
import { formatBaht } from "@/lib/format";
import { useTravelCopy } from "./travel-shell";
import { Media, PageHeading, Pagination } from "./Primitives";
import {
  FOOD_WELLNESS_CATEGORIES,
  OTOP_CATEGORIES,
  type FoodWellnessCategory,
  type OTOPCategory,
} from "@/types/catalog";

const foodLabels: Record<FoodWellnessCategory, [string, string]> = {
  LOW_SUGAR: ["หวานน้อย", "Low sugar"],
  LOW_SODIUM: ["โซเดียมต่ำ", "Low sodium"],
  ORGANIC: ["ออร์แกนิก", "Organic"],
  HERBAL: ["สมุนไพร", "Herbal"],
  VEGAN: ["วีแกน", "Vegan"],
};

const productLabels: Record<OTOPCategory, [string, string]> = {
  HERBAL_PRODUCT: ["สมุนไพร", "Herbal"],
  TEXTILE: ["ผ้าทอ", "Textiles"],
  PROCESSED_FOOD: ["อาหารแปรรูป", "Food products"],
  CRAFT: ["หัตถกรรม", "Crafts"],
};

export function Catalog({ kind }: { kind: "foods" | "wellness" | "otop" }) {
  const copy = useTravelCopy();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const addItem = useCartStore((s) => s.addItem);

  const foods = useQuery({
    queryKey: ["foods", category, page],
    queryFn: () =>
      getFoods({
        category: category ? (category as FoodWellnessCategory) : undefined,
        page,
        limit: 12,
      }),
    enabled: kind === "foods",
  });

  const wellness = useQuery({
    queryKey: ["wellness", page],
    queryFn: () => getWellnessServices({ page, limit: 12 }),
    enabled: kind === "wellness",
  });

  const otop = useQuery({
    queryKey: ["otop", category, search, page],
    queryFn: () =>
      getOTOPProducts({
        category: category ? (category as OTOPCategory) : undefined,
        search,
        page,
        limit: 12,
      }),
    enabled: kind === "otop",
  });

  const query = kind === "foods" ? foods : kind === "wellness" ? wellness : otop;

  const options =
    kind === "foods"
      ? FOOD_WELLNESS_CATEGORIES.map((key) => ({
          key,
          label: copy(...foodLabels[key]),
        }))
      : kind === "otop"
      ? OTOP_CATEGORIES.map((key) => ({
          key,
          label: copy(...productLabels[key]),
        }))
      : [];

  const rows =
    kind === "foods"
      ? (foods.data?.data ?? []).map((r) => ({
          id: r.id,
          title: r.name,
          description: r.description,
          price: r.price,
          image: r.image_url,
          available: r.is_available,
          meta:
            r.calorie_estimate !== null
              ? `${r.calorie_estimate} kcal`
              : copy(...foodLabels[r.wellness_category]),
        }))
      : kind === "wellness"
      ? (wellness.data?.data ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          price: r.price,
          image: r.image_url,
          available: r.is_active,
          meta: `${r.duration_minutes} ${copy("นาที", "min")}`,
        }))
      : (otop.data?.data ?? []).map((r) => ({
          id: r.id,
          title: r.name,
          description: r.description,
          price: r.price,
          image: r.image_url,
          available: r.is_active && r.stock_quantity > 0,
          meta: copy(...productLabels[r.category]),
        }));

  return (
    <div className="wt-page space-y-6">
      <PageHeading
        eyebrow={
          kind === "foods"
            ? "LOCAL FLAVOURS & HEALTHY DISHES"
            : kind === "wellness"
            ? "TIME TO UNWIND & RECHARGE"
            : "LOCAL TREASURES & CRAFTS"
        }
        title={
          kind === "foods"
            ? copy("อาหารอร่อยจากชุมชน", "A taste of the community")
            : kind === "wellness"
            ? copy("ให้วันนี้เป็นวันพักผ่อน", "Make room for a little rest")
            : copy("ของดีที่มีเรื่องราว", "Bring a little story home")
        }
        description={copy(
          "คัดสรรจากผู้ให้บริการชุมชนในจังหวัดศรีสะเกษ ข้อมูลราคาและรายละเอียดอัปเดตตามจริง",
          "Explore authentic local provider listings in Sisaket with up-to-date pricing."
        )}
      />

      {/* Search Input for OTOP */}
      {kind === "otop" && (
        <form
          className="travilla-pill-bar flex flex-col sm:flex-row gap-3 items-stretch my-4"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setSearch(draft.trim());
          }}
        >
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280] h-4 w-4" />
            <input
              id="catalog-search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={copy("ค้นหาสินค้า OTOP ชุมชน...", "Search OTOP crafts...")}
              className="w-full pl-11 pr-4 py-2 bg-transparent text-sm text-[#1f2925] outline-none"
            />
          </div>
          <button type="submit" className="wt-button flex-shrink-0 !py-2.5">
            {copy("ค้นหา", "Search")}
          </button>
        </form>
      )}

      {/* Category Filter Chips */}
      {options.length > 0 && (
        <div className="wt-filters" aria-label={copy("หมวดหมู่", "Categories")}>
          {[{ key: "", label: copy("ทั้งหมด", "All") }, ...options].map((o) => (
            <button
              key={o.key}
              className="wt-chip"
              aria-pressed={category === o.key}
              onClick={() => {
                setCategory(o.key);
                setPage(1);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      {/* Added to Cart Notification Toast */}
      {notice && (
        <Alert tone="success" title={notice}>
          <Link href="/cart" className="font-semibold underline">
            {copy("ดูตะกร้าสินค้า", "View Cart")}
          </Link>
        </Alert>
      )}

      {/* Main Listing Grid */}
      {query.isLoading ? (
        <ListLoading />
      ) : query.isError ? (
        <ListError
          message={extractErrorMessage(query.error)}
          onRetry={() => {
            void query.refetch();
          }}
        />
      ) : !rows.length ? (
        <div className="wt-empty">
          {copy(
            "ยังไม่มีรายการในหมวดนี้ ลองเปลี่ยนหมวดหรือกลับมาใหม่",
            "No listings in this category yet. Try another category or return later."
          )}
        </div>
      ) : (
        <div className="wt-grid">
          {rows.map((row) => (
            <article className="wt-card group" key={row.id}>
              <div className="wt-media relative">
                <Media src={row.image} alt={row.title} />
                <div className="travilla-badge-price">
                  <span>{formatBaht(row.price)}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                <span className="wt-card-meta">
                  {kind === "wellness" && <Clock size={13} className="text-[#c49a45]" />}
                  <span>{row.meta}</span>
                </span>
                <h3 className="font-serif font-bold text-lg text-[#1f2925] group-hover:text-[#c49a45] transition line-clamp-1">
                  {row.title}
                </h3>
              </div>

              {row.description && (
                <p className="wt-muted line-clamp-2 text-xs">
                  {row.description}
                </p>
              )}

              <div className="pt-3 mt-auto flex items-center justify-between border-t border-[#e5e7eb]">
                {kind === "wellness" ? (
                  <Link className="wt-button w-full !min-h-[40px] text-xs" href={`/wellness/${row.id}`}>
                    <span>{copy("ดูรอบเวลา", "View sessions")}</span>
                    <ArrowUpRight size={14} />
                  </Link>
                ) : (
                  <button
                    className="wt-button w-full !min-h-[40px] text-xs"
                    disabled={!row.available}
                    onClick={() => {
                      addItem({
                        item_type: kind === "foods" ? "FOOD_ORDER" : "OTOP_GOODS",
                        entity_id: row.id,
                        title: row.title,
                        quantity: 1,
                        unit_price: Number(row.price),
                        image_url: row.image,
                      });
                      setNotice(
                        copy(
                          `เพิ่ม ${row.title} ลงในตะกร้าเรียบร้อยแล้ว`,
                          `Added ${row.title} to your cart.`
                        )
                      );
                    }}
                  >
                    <ShoppingBag size={14} />
                    <span>
                      {row.available
                        ? copy("เพิ่มลงตะกร้า", "Add to cart")
                        : copy("ยังไม่พร้อมจำหน่าย", "Unavailable")}
                    </span>
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        page={page}
        total={query.data?.meta?.pagination?.total_pages ?? 1}
        busy={query.isFetching}
        onChange={setPage}
      />
    </div>
  );
}
