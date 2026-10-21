"use client";

/**
 * (portal)/portal/otop/page.tsx - OTOP product management & stock adjustment studio.
 * Supports adding new OTOP items and adjusting inventory stock.
 */
import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CatalogImageEditor } from "@/components/travel/CatalogImageEditor";
import { Package, Plus, ShoppingBag, UploadCloud, X, Save, AlertCircle } from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { extractErrorMessage } from "@/lib/api/errors";
import {
  adjustOtopStock,
  createOtopProduct,
  getMyOtopProducts,
  updateOtopProduct,
} from "@/lib/api/vendor";
import { useI18n } from "@/lib/i18n";
import type { OTOPProduct } from "@/types/catalog";

const OTOP_CATEGORIES = [
  { value: "HERBAL_PRODUCT", label: "สมุนไพรแปรรูป / สุขภาพ" },
  { value: "FOOD_BEVERAGE", label: "อาหารและเครื่องดื่มชุมชน" },
  { value: "TEXTILE", label: "ผ้าทอพื้นเมือง / เครื่องแต่งกาย" },
  { value: "HANDICRAFT", label: "ของใช้ ของตกแต่ง หัตถกรรม" },
];

export default function OtopPortalPage() {
  const { t } = useI18n();
  const [delta, setDelta] = useState<Record<string, string>>({});

  // Add Item Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("HERBAL_PRODUCT");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("50");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["portal-otop"],
    queryFn: () => getMyOtopProducts<OTOPProduct[] | { results: OTOPProduct[] }>(),
  });
  const otopData = data?.data;
  const rows: OTOPProduct[] = Array.isArray(otopData)
    ? otopData
    : (otopData as any)?.results ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      createOtopProduct({
        name,
        category,
        price: Number(price),
        stock_quantity: Number(stock),
        description,
        image_url: imagePreview,
      }),
    onSuccess: () => {
      void refetch();
      setModalOpen(false);
      setName("");
      setPrice("");
      setStock("50");
      setDescription("");
      setImagePreview("");
      alert("เพิ่มสินค้า OTOP เรียบร้อยแล้ว!");
    },
    onError: (err) => {
      alert(`เกิดข้อผิดพลาด: ${extractErrorMessage(err)}`);
    },
  });

  const adjust = useMutation({
    mutationFn: ({ productId, value }: { productId: string; value: number }) =>
      adjustOtopStock(productId, { delta: value }),
    onSuccess: () => {
      void refetch();
    },
  });

  const toggleActive = useMutation({
    mutationFn: ({ productId, isActive }: { productId: string; isActive: boolean }) =>
      updateOtopProduct(productId, { is_active: isActive }),
    onSuccess: () => {
      void refetch();
    },
  });

  function onAdjust(productId: string) {
    const value = Number(delta[productId] ?? "");
    if (!Number.isInteger(value) || value === 0) {
      return;
    }
    adjust.mutate({ productId, value });
  }

  function handleFileSelect(file: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-6 px-4 pb-8 pt-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-foreground font-serif">
            <Package className="h-5 w-5 text-[#D97706]" aria-hidden="true" />
            <span>{t("portal.otop")}</span>
          </h1>
          <p className="text-xs leading-relaxed text-muted-foreground mt-1">
            จัดการสต็อก ปรับเปลี่ยนสถานะสินค้า และลงทะเบียนเพิ่มสินค้า OTOP ของคุณในระบบ
          </p>
        </div>

        {/* Add New Item Button */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#1B2A24] text-white font-bold text-xs hover:bg-[#151d1a] shadow-sm flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-[#D97706]" />
          <span>เพิ่มสินค้า OTOP ใหม่</span>
        </button>
      </div>

      {/* Product List Content */}
      {isLoading ? (
        <ListLoading />
      ) : isError ? (
        <ListError
          message={extractErrorMessage(error, t("common.networkError"))}
          onRetry={() => void refetch()}
        />
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground space-y-3">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted" />
          <p className="text-base font-bold text-foreground">ยังไม่มีรายการสินค้า OTOP ในระบบ</p>
          <p className="text-xs text-muted-foreground">กดปุ่มด้านบนเพื่อเพิ่มสินค้า OTOP รายการแรกของคุณ</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-xl bg-[#1B2A24] text-white font-bold text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#D97706]" />
            <span>เพิ่มสินค้า OTOP ใหม่</span>
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((product) => {
            const failed =
              adjust.isError && adjust.variables?.productId === product.id;
            return (
              <li
                key={product.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    {product.image_url && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-border shrink-0">
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div>
                      <p className="truncate text-sm font-bold text-foreground font-serif">
                        {product.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ราคา: <strong>{product.price} ฿</strong> · {t("portal.currentStock")}: <strong>{product.stock_quantity}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={
                        product.stock_quantity <= 0 || !product.is_active
                          ? "shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700 border border-red-200"
                          : "shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200"
                      }
                    >
                      {!product.is_active
                        ? t("portal.unavailable")
                        : product.stock_quantity <= 0
                        ? t("catalog.outOfStock")
                        : t("portal.available")}
                    </span>
                    <Button
                      variant={product.is_active ? "outline" : "default"}
                      size="sm"
                      disabled={toggleActive.isPending}
                      onClick={() =>
                        toggleActive.mutate({
                          productId: product.id,
                          isActive: !product.is_active,
                        })
                      }
                    >
                      {product.is_active ? t("portal.available") : t("portal.unavailable")}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                  <Input
                    aria-label={`${t("portal.deltaHint")} ${product.name}`}
                    type="number"
                    placeholder={t("portal.deltaHint")}
                    value={delta[product.id] ?? ""}
                    onChange={(e) =>
                      setDelta((prev) => ({ ...prev, [product.id]: e.target.value }))
                    }
                    className="min-w-0 flex-1 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={adjust.isPending}
                    onClick={() => onAdjust(product.id)}
                  >
                    {t("portal.applyDelta")}
                  </Button>
                </div>
                <CatalogImageEditor kind="otop" id={product.id} image={product.image_url} title={product.name}/>
                {toggleActive.isError && toggleActive.variables?.productId === product.id && <p role="alert" className="wt-error">{extractErrorMessage(toggleActive.error)}</p>}
                {failed && (
                  <p className="mt-1.5 text-xs text-destructive">
                    {extractErrorMessage(adjust.error, t("common.networkError"))}
                  </p>
                )}
                {adjust.isSuccess && adjust.variables?.productId === product.id && (
                  <p className="mt-1.5 text-xs text-emerald-700 font-semibold">
                    {t("portal.stockUpdated")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Add New OTOP Item Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-card rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 border border-border">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-foreground">
                <ShoppingBag className="w-5 h-5 text-[#D97706]" />
                <h3>ลงทะเบียนสินค้า OTOP ชุมชนใหม่</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-foreground mb-1">ชื่อสินค้า OTOP *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ชาดอกดาวเรืองอินทรีย์, ผ้าทอมือลายโบราณ..."
                  className="w-full p-3 rounded-xl border border-border bg-[#FAF8F5] font-semibold outline-none focus:ring-2 focus:ring-[#D97706]/20 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-foreground mb-1">หมวดหมู่สินค้า *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 rounded-xl border border-border bg-[#FAF8F5] font-semibold outline-none text-xs cursor-pointer"
                  >
                    {OTOP_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">ราคาขาย (บาท) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="เช่น 150"
                    className="w-full p-3 rounded-xl border border-border bg-[#FAF8F5] font-bold outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">จำนวนสต็อกเริ่มต้น *</label>
                <input
                  type="number"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="เช่น 50"
                  className="w-full p-3 rounded-xl border border-border bg-[#FAF8F5] font-semibold outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">คำอธิบายสินค้า & เรื่องราวชุมชน</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ระบุที่มา วัตถุดิบอินทรีย์ หรือภูมิปัญญาท้องถิ่น..."
                  className="w-full p-3 rounded-xl border border-border bg-[#FAF8F5] font-medium outline-none text-xs"
                />
              </div>

              {/* Image Upload Dropzone */}
              <div className="space-y-1">
                <label className="block font-bold text-foreground">รูปภาพสินค้า</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative rounded-2xl border border-border bg-muted/40 p-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0 border border-border">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">เลือกรูปภาพแล้ว</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImagePreview("")}
                      className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 rounded-2xl border border-dashed border-border bg-[#FAF8F5] hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground"
                  >
                    <UploadCloud className="w-6 h-6 text-[#D97706]" />
                    <span className="text-xs font-semibold">คลิกอัปโหลดรูปภาพสินค้า</span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/2 py-2.5 px-4 rounded-xl border border-border text-foreground font-bold hover:bg-muted"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-1/2 py-2.5 px-4 rounded-xl bg-[#1B2A24] text-white font-bold hover:bg-[#151d1a] shadow-sm flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4 text-[#D97706]" />
                  <span>{createMutation.isPending ? "กำลังบันทึก..." : "บันทึกสร้างสินค้า"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

