"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Pencil, Search, Layers, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeading, Media, Pagination } from "@/components/travel/Primitives";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import {
  getOTOPProducts,
  getAccommodations,
  getWellnessServices,
  getFoods,
} from "@/lib/api/catalog";
import {
  updateOtopProduct,
  updateAccommodation,
  updateWellness,
  updateFood,
} from "@/lib/api/vendor";
import { extractErrorMessage } from "@/lib/api/errors";
import { formatBaht } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { CatalogMultiImageUploader } from "@/components/travel/CatalogMultiImageUploader";

type Kind = "OTOP" | "ACCOMMODATION" | "WELLNESS" | "FOOD";

type Row = {
  id: string;
  title: string;
  description: string;
  image?: string;
  price: string | null;
};

const tabs: Record<Kind, string> = {
  OTOP: "ของดีชุมชน OTOP",
  ACCOMMODATION: "ที่พักและโฮมสเตย์",
  WELLNESS: "นวดและสุขภาพ",
  FOOD: "อาหารและเครื่องดื่ม",
};

export default function AdminCatalog() {
  const { user } = useAuth();
  const [kind, setKind] = useState<Kind>("OTOP");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const products = useQuery({
    queryKey: ["admin-catalog", "OTOP", page],
    queryFn: () => getOTOPProducts({ page, limit: 12 }),
    enabled: kind === "OTOP",
  });

  const stays = useQuery({
    queryKey: ["admin-catalog", "ACCOMMODATION", page],
    queryFn: () => getAccommodations({ page, limit: 12 }),
    enabled: kind === "ACCOMMODATION",
  });

  const wellness = useQuery({
    queryKey: ["admin-catalog", "WELLNESS", page],
    queryFn: () => getWellnessServices({ page, limit: 12 }),
    enabled: kind === "WELLNESS",
  });

  const foods = useQuery({
    queryKey: ["admin-catalog", "FOOD", page],
    queryFn: () => getFoods({ page, limit: 12 }),
    enabled: kind === "FOOD",
  });

  const query =
    kind === "OTOP"
      ? products
      : kind === "ACCOMMODATION"
      ? stays
      : kind === "WELLNESS"
      ? wellness
      : foods;

  const rows: Row[] =
    kind === "OTOP"
      ? (products.data?.data ?? []).map((x) => ({
          id: x.id,
          title: x.name,
          description: x.description,
          image: x.image_url,
          price: x.price,
        }))
      : kind === "ACCOMMODATION"
      ? (stays.data?.data ?? []).map((x) => ({
          id: x.id,
          title: x.name,
          description: x.description,
          image: x.image_url,
          price: x.min_price_per_night,
        }))
      : kind === "WELLNESS"
      ? (wellness.data?.data ?? []).map((x) => ({
          id: x.id,
          title: x.title,
          description: x.description,
          image: x.image_url,
          price: x.price,
        }))
      : (foods.data?.data ?? []).map((x) => ({
          id: x.id,
          title: x.name,
          description: x.description,
          image: x.image_url,
          price: x.price,
        }));

  const visible = rows.filter((row) =>
    row.title.toLocaleLowerCase().includes(search.toLocaleLowerCase())
  );

  return (
    <div className="wt-page space-y-6 max-w-7xl mx-auto pb-12">
      <PageHeading
        eyebrow="ECO-PREMIUM LIVE CATALOG MANAGEMENT"
        title="จัดการระบบแคตตาล็อกสินค้า & บริการ"
        description="รายการสินค้า ที่พัก อาหาร และบริการที่เปิดใช้งานในระบบ สามารถอัปโหลดรูปภาพหลายรูป แก้ไขข้อมูล และปรับแต่งการแสดงผล"
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#193E30]/15 pb-4">
        {Object.entries(tabs).map(([value, label]) => (
          <button
            key={value}
            aria-pressed={kind === value}
            onClick={() => {
              setKind(value as Kind);
              setPage(1);
              setSearch("");
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              kind === value
                ? "bg-[#193E30] text-[#FAF8F1] shadow-sm font-semibold"
                : "bg-white text-[#193E30]/80 border border-[#193E30]/15 hover:bg-[#FAF8F1]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#193E30]/40"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อสินค้า ที่พัก หรือบริการ..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#193E30]/20 bg-white text-sm outline-none focus:border-[#193E30] focus:ring-2 focus:ring-[#193E30]/10 text-[#193E30]"
        />
      </div>

      {/* Main Content List */}
      {query.isLoading ? (
        <ListLoading />
      ) : query.isError ? (
        <ListError
          message={extractErrorMessage(query.error, "โหลดรายการไม่สำเร็จ")}
          onRetry={() => void query.refetch()}
        />
      ) : !visible.length ? (
        <div className="rounded-2xl border border-dashed border-[#193E30]/20 bg-white p-12 text-center text-[#193E30]/60">
          ไม่พบรายการในหน้านี้
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visible.map((row) => (
            <CatalogRow
              key={`${kind}-${row.id}`}
              row={row}
              kind={kind}
              canEdit={user?.role === "SUPER_ADMIN"}
            />
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

function CatalogRow({
  row,
  kind,
  canEdit,
}: {
  row: Row;
  kind: Kind;
  canEdit: boolean;
}) {
  const [title, setTitle] = useState(row.title);
  const [description, setDescription] = useState(row.description);
  const [price, setPrice] = useState(row.price ?? "");

  // Parse existing image into array format for multi-uploader
  const initialImages = row.image
    ? row.image.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const [imageList, setImageList] = useState<string[]>(initialImages);

  const client = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      const primaryImage = imageList.length > 0 ? imageList[0] : "";
      // Save all images separated by comma if multiple, or primary URL
      const joinedImages = imageList.join(",");

      const payload: Record<string, unknown> = {
        [kind === "WELLNESS" ? "title" : "name"]: title,
        description,
      };

      if (kind !== "ACCOMMODATION") {
        payload.price = price;
        payload.image_url = primaryImage;
        if (joinedImages) {
          payload.gallery_images = joinedImages;
        }
      } else {
        payload.image_url = primaryImage;
      }

      return kind === "OTOP"
        ? updateOtopProduct(row.id, payload)
        : kind === "ACCOMMODATION"
        ? updateAccommodation(row.id, payload)
        : kind === "WELLNESS"
        ? updateWellness(row.id, payload)
        : updateFood(row.id, payload);
    },
    onSuccess: async () => {
      await client.invalidateQueries();
    },
  });

  return (
    <article className="rounded-2xl border border-[#193E30]/15 bg-white p-5 shadow-xs transition-all hover:shadow-md space-y-4 text-[#193E30]">
      <div className="flex gap-4 items-start">
        <div className="w-28 h-24 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-[#193E30]/10">
          <Media src={imageList[0] || row.image} alt={row.title} />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold truncate text-[#193E30]">
              {row.title}
            </h2>
          </div>
          <p className="text-xs text-[#193E30]/70 line-clamp-2">
            {row.description || "ไม่มีรายละเอียดสินค้า"}
          </p>
          <div className="pt-1 flex items-center justify-between">
            <span className="text-sm font-bold text-[#193E30]">
              {row.price ? formatBaht(row.price) : "ยังไม่ระบุราคา"}
              {kind === "ACCOMMODATION" ? " / คืน" : ""}
            </span>
            {imageList.length > 1 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#C5A059]/15 text-[#193E30] font-medium flex items-center gap-1">
                <Layers size={12} className="text-[#C5A059]" />
                {imageList.length} รูป
              </span>
            )}
          </div>
        </div>
      </div>

      {canEdit && (
        <details className="group border-t border-[#193E30]/10 pt-3">
          <summary className="flex cursor-pointer items-center justify-between text-sm font-medium text-[#193E30] hover:text-[#C5A059] transition-colors py-1">
            <span className="flex items-center gap-2">
              <Pencil size={15} />
              แก้ไขข้อมูลและรูปภาพสินค้า
            </span>
            <span className="text-xs text-[#193E30]/50 group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>

          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <fieldset
              disabled={mutation.isPending}
              className="space-y-4 disabled:opacity-60"
            >
              <div>
                <label className="block text-xs font-semibold text-[#193E30] mb-1">
                  ชื่อรายการ <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  maxLength={150}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[#193E30]/25 bg-[#FAF8F1]/50 px-3.5 py-2 text-sm outline-none focus:border-[#193E30] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#193E30] mb-1">
                  รายละเอียด
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-[#193E30]/25 bg-[#FAF8F1]/50 px-3.5 py-2 text-sm outline-none focus:border-[#193E30] focus:bg-white"
                />
              </div>

              {kind !== "ACCOMMODATION" && (
                <div>
                  <label className="block text-xs font-semibold text-[#193E30] mb-1">
                    ราคา (บาท) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-xl border border-[#193E30]/25 bg-[#FAF8F1]/50 px-3.5 py-2 text-sm outline-none focus:border-[#193E30] focus:bg-white"
                  />
                </div>
              )}

              {/* Multi Image Upload Component */}
              <CatalogMultiImageUploader
                images={imageList}
                onChange={setImageList}
                maxImages={8}
                label="อัปโหลดภาพสินค้า/บริการ (เลือกได้หลายภาพ)"
                description="ภาพแรกจะเป็นภาพหลัก (Cover) ที่แสดงผลหน้าแรก สามารถคลิกดาวเพื่อเปลี่ยนภาพหลักได้"
              />

              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#193E30] px-4 py-2.5 text-sm font-semibold text-[#FAF8F1] shadow-sm hover:bg-[#193E30]/90 transition active:scale-[0.99] disabled:opacity-50"
              >
                <Save size={16} />
                {mutation.isPending ? "กำลังบันทึกข้อมูล..." : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </fieldset>

            {mutation.isError && (
              <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                <AlertCircle size={16} className="flex-shrink-0" />
                {extractErrorMessage(mutation.error, "บันทึกไม่สำเร็จ")}
              </div>
            )}

            {mutation.isSuccess && (
              <div role="status" className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-600" />
                บันทึกการเปลี่ยนแปลงสำเร็จแล้ว
              </div>
            )}
          </form>
        </details>
      )}
    </article>
  );
}
