"use client";

/**
 * (portal)/portal/wellness/page.tsx - Wellness service management & slot scheduling.
 * Supports creating new wellness services and adding time slots for booking.
 */
import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CatalogImageEditor } from "@/components/travel/CatalogImageEditor";
import { Clock, Plus, Sparkles, UploadCloud, X } from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/api/errors";
import { getWellnessSlots } from "@/lib/api/catalog";
import { createWellness, createWellnessSlot, getMyWellness } from "@/lib/api/vendor";
import { formatClockTime, todayISO } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { WellnessService } from "@/types/catalog";

export default function WellnessPortalPage() {
  const { t } = useI18n();
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [capacity, setCapacity] = useState("");

  // Add Item Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const serviceQuery = useQuery({
    queryKey: ["portal-services"],
    queryFn: () => getMyWellness<WellnessService[] | { results: WellnessService[] }>(),
  });
  const servicesData = serviceQuery.data?.data;
  const services: WellnessService[] = Array.isArray(servicesData)
    ? servicesData
    : (servicesData as any)?.results ?? [];

  const slotsQuery = useQuery({
    queryKey: ["portal-slots", serviceId, date],
    enabled: serviceId.length > 0,
    queryFn: () => getWellnessSlots(serviceId, date),
  });
  const slots = slotsQuery.data?.data.slots ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      createWellness({
        title,
        duration_minutes: Number(durationMinutes),
        price: Number(price),
        description,
        image_url: imagePreview,
      }),
    onSuccess: () => {
      void serviceQuery.refetch();
      setModalOpen(false);
      setTitle("");
      setDurationMinutes("60");
      setPrice("");
      setDescription("");
      setImagePreview("");
      alert("เพิ่มบริการสปา/นวดสุขภาพเรียบร้อยแล้ว!");
    },
    onError: (err) => {
      alert(`เกิดข้อผิดพลาด: ${extractErrorMessage(err)}`);
    },
  });

  const slotMutation = useMutation({
    mutationFn: () =>
      createWellnessSlot(serviceId, {
        date,
        start_time: startTime,
        end_time: endTime,
        ...(capacity.trim() !== "" ? { capacity: Number(capacity) } : {}),
      }),
    onSuccess: () => {
      void slotsQuery.refetch();
    },
  });

  function submitSlot(e: FormEvent) {
    e.preventDefault();
    slotMutation.mutate();
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
            <Sparkles className="h-5 w-5 text-[#D97706]" aria-hidden="true" />
            <span>{t("portal.wellness")}</span>
          </h1>
          <p className="text-xs leading-relaxed text-muted-foreground mt-1">
            จัดการบริการนวด/สปาสุขภาพ สร้างรอบเวลาให้บริการ (Time Slots) และลงทะเบียนเพิ่มบริการใหม่
          </p>
        </div>

        {/* Add New Service Button */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#1B2A24] text-white font-bold text-xs hover:bg-[#151d1a] shadow-sm flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-[#D97706]" />
          <span>เพิ่มบริการสปา/นวดสุขภาพใหม่</span>
        </button>
      </div>

      {serviceQuery.isLoading ? (
        <ListLoading />
      ) : serviceQuery.isError ? (
        <ListError
          message={extractErrorMessage(serviceQuery.error, t("common.networkError"))}
          onRetry={() => void serviceQuery.refetch()}
        />
      ) : services.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground space-y-3">
          <Sparkles className="mx-auto h-12 w-12 text-muted" />
          <p className="text-base font-bold text-foreground">ยังไม่มีรายการบริการสุขภาพในระบบ</p>
          <p className="text-xs text-muted-foreground">กดปุ่มด้านบนเพื่อเพิ่มบริการสปา/นวดสุขภาพรายการแรกของคุณ</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-2 px-4 py-2 rounded-xl bg-[#1B2A24] text-white font-bold text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#D97706]" />
            <span>เพิ่มบริการสปา/นวดสุขภาพใหม่</span>
          </button>
        </div>
      ) : (
        <>
          {/* Create Time Slot Form */}
          <form
            onSubmit={submitSlot}
            className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-xs"
          >
            <h2 className="text-sm font-bold text-foreground font-serif">สร้างรอบเวลาให้บริการ (Time Slot)</h2>
            <div className="space-y-1.5">
              <Label htmlFor="service">{t("portal.chooseService")}</Label>
              <select
                id="service"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">— เลือกบริการ —</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.title} ({svc.duration_minutes ?? 60} นาที · {svc.price} ฿)
                  </option>
                ))}
              </select>
            </div>

            {serviceId && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="slot-date">{t("portal.slotDate")}</Label>
                  <Input
                    id="slot-date"
                    type="date"
                    min={todayISO()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="capacity">{t("portal.capacityOptional")}</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="start">{t("portal.startTime")}</Label>
                  <Input
                    id="start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end">{t("portal.endTime")}</Label>
                  <Input
                    id="end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {slotMutation.isError && (
              <p className="text-xs text-destructive">
                {extractErrorMessage(slotMutation.error, t("common.networkError"))}
              </p>
            )}
            {slotMutation.isSuccess && (
              <p className="text-xs text-emerald-700">{t("portal.slotCreated")}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#1B2A24] text-white hover:bg-[#151d1a]"
              disabled={!serviceId || slotMutation.isPending}
            >
              {slotMutation.isPending ? t("portal.saved") : t("portal.createSlot")}
            </Button>
          </form>

          {services.filter((service) => service.id === serviceId).map((service) => (
            <CatalogImageEditor key={service.id} kind="wellness" id={service.id} image={service.image_url} title={service.title} />
          ))}

          {/* Existing slots on the chosen date */}
          {serviceId && (
            <section className="space-y-2">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-[#D97706]" aria-hidden="true" />
                {t("portal.slotListTitle")}
              </h2>
              {slotsQuery.isLoading ? (
                <ListLoading />
              ) : slotsQuery.isError ? (
                <ListError message={extractErrorMessage(slotsQuery.error)} onRetry={() => void slotsQuery.refetch()} />
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("portal.noSlotsForDate")}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {slots.map((slot) => (
                    <li
                      key={`${slot.slot_date}-${slot.start_time}`}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-sm shadow-xs"
                    >
                      <span className="font-medium">
                        {formatClockTime(slot.start_time)} – {formatClockTime(slot.end_time)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("catalog.slotCapacity", {
                          left: slot.capacity_available,
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}

      {/* Add New Wellness Service Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-card p-6 shadow-2xl border border-border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <h3 className="text-lg font-bold text-foreground font-serif flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D97706]" />
                <span>เพิ่มบริการสปา/นวดสุขภาพใหม่</span>
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
                if (!title.trim() || !price || !durationMinutes) return;
                createMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="wellness-name" className="text-xs font-bold">ชื่อบริการ *</Label>
                <Input
                  id="wellness-name"
                  placeholder="เช่น นวดแผนไทยโบราณ, สปาสมุนไพรสด 90 นาที"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="wellness-duration" className="text-xs font-bold">ระยะเวลา (นาที) *</Label>
                  <Input
                    id="wellness-duration"
                    type="number"
                    min={15}
                    step={15}
                    placeholder="60"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wellness-price" className="text-xs font-bold">ราคา (บาท) *</Label>
                  <Input
                    id="wellness-price"
                    type="number"
                    min={0}
                    placeholder="500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wellness-desc" className="text-xs font-bold">รายละเอียดและจุดเด่นของบริการ</Label>
                <textarea
                  id="wellness-desc"
                  rows={3}
                  className="w-full rounded-xl border border-input bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="เช่น นวดประคบสมุนไพรพื้นบ้าน ช่วยผ่อนคลายกล้ามเนื้อ..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Image Upload Area */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">รูปภาพบริการ</Label>
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
                      <p className="text-xs font-bold text-foreground">คลิกเพื่ออัปโหลดรูปภาพบริการ</p>
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
                  disabled={createMutation.isPending || !title.trim() || !price || !durationMinutes}
                  className="bg-[#1B2A24] text-white hover:bg-[#151d1a]"
                >
                  {createMutation.isPending ? "กำลังบันทึก..." : "บันทึกบริการใหม่"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
