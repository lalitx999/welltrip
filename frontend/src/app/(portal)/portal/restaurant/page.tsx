"use client";

/**
 * (portal)/portal/restaurant/page.tsx - Food & healthy dining menu management studio.
 * Supports adding new healthy food menu items and toggling availability status.
 */
import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Plus, Save, UploadCloud, UtensilsCrossed, X, XCircle } from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { extractErrorMessage } from "@/lib/api/errors";
import { createFood, getMyFoods, updateFood } from "@/lib/api/vendor";
import { formatPriceText } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { FoodMenu } from "@/types/catalog";

const FOOD_CATEGORIES = [
  { value: "ORGANIC_DISH", label: "อาหารจานหลักวัตถุดิบอินทรีย์" },
  { value: "HERBAL_SOUP", label: "ซุปและแกงสมุนไพรพื้นบ้าน" },
  { value: "HEALTH_DRINK", label: "เครื่องดื่มสมุนไพรและน้ำผักผลไม้" },
  { value: "CLEAN_SNACK", label: "ของว่างและขนมสุขภาพ" },
];

export default function RestaurantPortalPage() {
  const { t, locale } = useI18n();

  // Add Item Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("ORGANIC_DISH");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["portal-foods"],
    queryFn: () => getMyFoods<FoodMenu[] | { results: FoodMenu[] }>(),
  });

  const foodsData = data?.data;
  const rows: FoodMenu[] = Array.isArray(foodsData)
    ? foodsData
    : (foodsData as any)?.results ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      createFood({
        name,
        wellness_category: category,
        price: Number(price),
        description,
        image_url: imagePreview,
      }),
    onSuccess: () => {
      void refetch();
      setModalOpen(false);
      setName("");
      setPrice("");
      setDescription("");
      setImagePreview("");
      alert("เพิ่มเมนูอาหารเพื่อสุขภาพเรียบร้อยแล้ว!");
    },
    onError: (err) => {
      alert(`เกิดข้อผิดพลาด: ${extractErrorMessage(err)}`);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      updateFood(id, { is_available: isAvailable }),
    onSuccess: () => {
      void refetch();
    },
  });

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
            <UtensilsCrossed className="h-5 w-5 text-[#D97706]" aria-hidden="true" />
            <span>{t("portal.restaurant")}</span>
          </h1>
          <p className="text-xs leading-relaxed text-muted-foreground mt-1">
            จัดการเมนูอาหารสุขภาพ ปรับสถานะพร้อมเสิร์ฟ และเพิ่มรายการอาหารใหม่ของคุณ
          </p>
        </div>

        {/* Add New Food Menu Button */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#1B2A24] text-white font-bold text-xs hover:bg-[#151d1a] shadow-sm flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-[#D97706]" />
          <span>เพิ่มเมนูอาหารสุขภาพใหม่</span>
        </button>
      </div>

      {/* Food List Content */}
      {isLoading ? (
        <ListLoading />
      ) : isError ? (
        <ListError
          message={extractErrorMessage(error, t("common.networkError"))}
          onRetry={() => void refetch()}
        />
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground space-y-3">
          <UtensilsCrossed className="mx-auto h-12 w-12 text-muted" />
          <p className="text-base font-bold text-foreground">ยังไม่มีรายการเมนูอาหารในระบบ</p>
          <p className="text-xs text-muted-foreground">กดปุ่มด้านบนเพื่อเพิ่มเมนูอาหารสุขภาพรายการแรกของคุณ</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-xl bg-[#1B2A24] text-white font-bold text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#D97706]" />
            <span>เพิ่มเมนูอาหารสุขภาพใหม่</span>
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((menu) => (
            <li
              key={menu.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs hover:shadow-md transition-all"
            >
              <span
                className={
                  menu.is_available
                    ? "grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"
                }
              >
                {menu.is_available ? (
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <XCircle className="h-6 w-6" aria-hidden="true" />
                )}
              </span>

              {menu.image_url && (
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                  <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground font-serif">
                  {menu.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPriceText(menu.price, locale)}
                </p>
              </div>

              <Button
                variant={menu.is_available ? "outline" : "default"}
                size="sm"
                disabled={toggleMutation.isPending}
                onClick={() =>
                  toggleMutation.mutate({
                    id: menu.id,
                    isAvailable: !menu.is_available,
                  })
                }
              >
                {menu.is_available ? t("portal.available") : t("portal.unavailable")}
              </Button>
            </li>
          ))}
        </ul>
      )}

      {/* Add New Food Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-card rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 border border-border">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-serif font-bold text-base text-foreground">
                <UtensilsCrossed className="w-5 h-5 text-[#D97706]" />
                <h3>เพิ่มเมนูอาหารเพื่อสุขภาพใหม่</h3>
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
                <label className="block font-bold text-foreground mb-1">ชื่อเมนูอาหาร *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ต้มยำสมุนไพรพื้นบ้านอินทรีย์, ยำผักกูดกุ้งสด..."
                  className="w-full p-3 rounded-xl border border-border bg-[#FAF8F5] font-semibold outline-none focus:ring-2 focus:ring-[#D97706]/20 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-foreground mb-1">หมวดหมู่อาหารสุขภาพ *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 rounded-xl border border-border bg-[#FAF8F5] font-semibold outline-none text-xs cursor-pointer"
                  >
                    {FOOD_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-foreground mb-1">ราคาตั้งต้น (บาท) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="เช่น 120"
                    className="w-full p-3 rounded-xl border border-border bg-[#FAF8F5] font-bold outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-foreground mb-1">คำอธิบายวัตถุดิบ & คุณประโยชน์สุขภาพ</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ระบุส่วนผสม สมุนไพร หรือคุณประโยชน์ต่อสุขภาพ..."
                  className="w-full p-3 rounded-xl border border-border bg-[#FAF8F5] font-medium outline-none text-xs"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-1">
                <label className="block font-bold text-foreground">รูปภาพเมนูอาหาร</label>
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
                    <span className="text-xs font-semibold">คลิกอัปโหลดรูปภาพเมนูอาหาร</span>
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
                  <span>{createMutation.isPending ? "กำลังบันทึก..." : "บันทึกสร้างเมนู"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

