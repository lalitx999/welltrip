"use client";

/**
 * (portal)/portal/homestay/page.tsx - Homestay & room pricing management.
 * Supports adding new accommodations and configuring nightly room pricing.
 */
import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarDays, Hotel, Plus, UploadCloud, X } from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/api/errors";
import { getAccommodationRooms } from "@/lib/api/catalog";
import { createAccommodation, getMyAccommodations, setRoomPricing } from "@/lib/api/vendor";
import { formatDateText, todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { Accommodation } from "@/types/catalog";

const SISAKET_DISTRICTS = [
  "เมืองศรีสะเกษ",
  "กันทรลักษ์",
  "ขุขันธ์",
  "อุทุมพรพิสัย",
  "ราษีไศล",
  "ขุนหาญ",
  "ไพรบึง",
  "ยางชุมน้อย",
  "ปรางค์กู่",
];

export default function HomestayPortalPage() {
  const { t, locale } = useI18n();
  const [accommodationId, setAccommodationId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [priceOverride, setPriceOverride] = useState("");
  const [availableCount, setAvailableCount] = useState("");

  // Add Item Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("เมืองศรีสะเกษ");
  const [pricePerNight, setPricePerNight] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accQuery = useQuery({
    queryKey: ["portal-accommodations"],
    queryFn: () => getMyAccommodations<Accommodation[] | { results: Accommodation[] }>(),
  });
  const accommodationsData = accQuery.data?.data;
  const accommodations: Accommodation[] = Array.isArray(accommodationsData)
    ? accommodationsData
    : (accommodationsData as any)?.results ?? [];

  const roomsQuery = useQuery({
    queryKey: ["portal-rooms", accommodationId],
    enabled: accommodationId.length > 0,
    queryFn: () => getAccommodationRooms(accommodationId),
  });
  const rooms = roomsQuery.data?.data.rooms ?? [];

  const createAccMutation = useMutation({
    mutationFn: () =>
      createAccommodation({
        name,
        district,
        province: "ศรีสะเกษ",
        price_per_night: Number(pricePerNight),
        description,
        image_url: imagePreview,
      }),
    onSuccess: () => {
      void accQuery.refetch();
      setModalOpen(false);
      setName("");
      setPricePerNight("");
      setDescription("");
      setImagePreview("");
      alert("เพิ่มโฮมสเตย์/ที่พักชุมชนเรียบร้อยแล้ว!");
    },
    onError: (err) => {
      alert(`เกิดข้อผิดพลาด: ${extractErrorMessage(err)}`);
    },
  });

  const pricingMutation = useMutation({
    mutationFn: () =>
      setRoomPricing(roomId, {
        date,
        ...(priceOverride.trim() !== ""
          ? { price_override: priceOverride.trim() }
          : {}),
        ...(availableCount.trim() !== ""
          ? { available_count: Number(availableCount) }
          : {}),
      }),
  });

  const bothEmpty = priceOverride.trim() === "" && availableCount.trim() === "";

  function submitPricing(e: FormEvent) {
    e.preventDefault();
    if (bothEmpty) return;
    pricingMutation.mutate();
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
            <Hotel className="h-5 w-5 text-[#D97706]" aria-hidden="true" />
            <span>{t("portal.homestay")}</span>
          </h1>
          <p className="text-xs leading-relaxed text-muted-foreground mt-1">
            จัดการราคาห้องพักรายวัน ตรวจสอบห้องว่าง และลงทะเบียนเพิ่มโฮมสเตย์/ที่พักชุมชนใหม่
          </p>
        </div>

        {/* Add New Accommodation Button */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#1B2A24] text-white font-bold text-xs hover:bg-[#151d1a] shadow-sm flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-[#D97706]" />
          <span>เพิ่มโฮมสเตย์ / ที่พักใหม่</span>
        </button>
      </div>

      {accQuery.isLoading ? (
        <ListLoading />
      ) : accQuery.isError ? (
        <ListError
          message={extractErrorMessage(accQuery.error, t("common.networkError"))}
          onRetry={() => void accQuery.refetch()}
        />
      ) : accommodations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground space-y-3">
          <Hotel className="mx-auto h-12 w-12 text-muted" />
          <p className="text-base font-bold text-foreground">ยังไม่มีรายการโฮมสเตย์ในระบบ</p>
          <p className="text-xs text-muted-foreground">กดปุ่มด้านบนเพื่อเพิ่มโฮมสเตย์/ที่พักรายการแรกของคุณ</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-xl bg-[#1B2A24] text-white font-bold text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#D97706]" />
            <span>เพิ่มโฮมสเตย์ / ที่พักใหม่</span>
          </button>
        </div>
      ) : (
        <form
          onSubmit={submitPricing}
          className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xs"
        >
          <h2 className="text-sm font-bold text-foreground font-serif">ปรับแต่งราคาและจำนวนห้องว่างรายวัน</h2>

          <div className="space-y-1.5">
            <Label htmlFor="acc">{t("portal.chooseAccommodation")}</Label>
            <select
              id="acc"
              value={accommodationId}
              onChange={(e) => {
                setAccommodationId(e.target.value);
                setRoomId("");
              }}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— เลือกโฮมสเตย์/ที่พัก —</option>
              {accommodations.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} · {acc.district ? `${acc.district}, ` : ""}{acc.province}
                </option>
              ))}
            </select>
          </div>

          {accommodationId &&
            (roomsQuery.isLoading ? (
              <ListLoading />
            ) : rooms.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("portal.noRoom")}</p>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="room">{t("portal.chooseRoom")}</Label>
                <select
                  id="room"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— เลือกประเภทห้องพัก —</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}

          {roomId && (
            <div className="space-y-3.5 rounded-xl bg-muted/40 p-4 border border-border/60">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-card-foreground">
                <CalendarDays className="h-4 w-4 text-[#D97706]" aria-hidden="true" />
                {t("portal.roomPricingTitle")}
              </h2>
              <div className="space-y-1.5">
                <Label htmlFor="pdate">{t("portal.dateLabel")}</Label>
                <Input
                  id="pdate"
                  type="date"
                  min={todayISO()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pprice">{t("portal.priceOverride")}</Label>
                <Input
                  id="pprice"
                  type="number"
                  min={0}
                  step="0.01"
                  value={priceOverride}
                  onChange={(e) => setPriceOverride(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {t("portal.clearPriceHint")}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pcount">{t("portal.availableCountLabel")}</Label>
                <Input
                  id="pcount"
                  type="number"
                  min={0}
                  value={availableCount}
                  onChange={(e) => setAvailableCount(e.target.value)}
                />
              </div>

              {pricingMutation.isError && (
                <p className="text-xs text-destructive">
                  {extractErrorMessage(pricingMutation.error, t("common.networkError"))}
                </p>
              )}
              {pricingMutation.isSuccess && pricingMutation.data && (
                <p className="text-xs text-emerald-700 font-semibold">
                  {t("portal.result", {
                    date: formatDateText(pricingMutation.data.data.date, locale),
                    price: pricingMutation.data.data.price_override ?? "—",
                    count: pricingMutation.data.data.available_count,
                  })}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-[#1B2A24] text-white hover:bg-[#151d1a]"
                disabled={pricingMutation.isPending || bothEmpty}
              >
                {pricingMutation.isPending ? t("portal.saved") : t("portal.save")}
              </Button>
            </div>
          )}
        </form>
      )}

      {/* Add New Accommodation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-card p-6 shadow-2xl border border-border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-lg font-bold text-foreground font-serif flex items-center gap-2">
                <Hotel className="w-5 h-5 text-[#D97706]" />
                <span>เพิ่มโฮมสเตย์ / ที่พักใหม่</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim() || !pricePerNight) return;
                createAccMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="acc-name" className="text-xs font-bold">ชื่อโฮมสเตย์ / ที่พัก *</Label>
                <Input
                  id="acc-name"
                  placeholder="เช่น บ้านสวนสุขภาพโฮมสเตย์ ขุนหาญ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="acc-district" className="text-xs font-bold">อำเภอ *</Label>
                  <select
                    id="acc-district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs"
                  >
                    {SISAKET_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="acc-price" className="text-xs font-bold">ราคาเริ่มต้น (บาท/คืน) *</Label>
                  <Input
                    id="acc-price"
                    type="number"
                    min={0}
                    placeholder="800"
                    value={pricePerNight}
                    onChange={(e) => setPricePerNight(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="acc-desc" className="text-xs font-bold">คำอธิบายและสิ่งอำนวยความสะดวก</Label>
                <textarea
                  id="acc-desc"
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="เช่น บรรยากาศเงียบสงบ ล้อมรอบด้วยสวนสมุนไพร มีอาหารเช้าสุขภาพ..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Image Upload Area */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">รูปภาพที่พัก</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer rounded-2xl border-2 border-dashed border-border bg-muted/30 p-4 text-center hover:bg-muted/60 transition-all"
                >
                  {imagePreview ? (
                    <div className="relative h-36 w-full rounded-xl overflow-hidden">
                      <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreview("");
                        }}
                        className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full hover:bg-black"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground py-2">
                      <UploadCloud className="w-8 h-8 text-[#D97706]" />
                      <p className="text-xs font-bold text-foreground">คลิกเพื่ออัปโหลดรูปภาพที่พัก</p>
                      <p className="text-[11px]">รองรับ JPG, PNG, WEBP (ไม่เกิน 5MB)</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  disabled={createAccMutation.isPending || !name.trim() || !pricePerNight}
                  className="bg-[#1B2A24] text-white hover:bg-[#151d1a]"
                >
                  {createAccMutation.isPending ? "กำลังบันทึก..." : "บันทึกที่พักใหม่"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
