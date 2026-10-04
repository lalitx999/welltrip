"use client";

/**
 * (mobile-tourist)/wellness/[id]/page.tsx - Eco-Premium Wellness Service + Slot Picker.
 */
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarDays, Clock, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { extractErrorMessage } from "@/lib/api/errors";
import { getWellnessSlots } from "@/lib/api/catalog";
import { formatBaht, formatClockTime, todayISO, toNumber } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { useI18n } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import type { WellnessTimeSlot } from "@/types/catalog";

export default function WellnessDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const serviceId = params?.id ?? "";

  const [slotDate, setSlotDate] = useState(todayISO());
  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["wellness-slots", serviceId, slotDate],
    enabled: serviceId.length > 0,
    queryFn: () => getWellnessSlots(serviceId, slotDate),
  });

  const service = data?.data.wellness_service;
  const slots = data?.data.slots ?? [];

  function alreadyInCart(slotId: number): number {
    return (
      cartItems.find(
        (item) => item.item_type === "WELLNESS_SESSION" && item.entity_id === slotId,
      )?.quantity ?? 0
    );
  }

  function addSlot(slot: WellnessTimeSlot) {
    if (!service) {
      return;
    }
    addItem({
      item_type: "WELLNESS_SESSION",
      entity_id: slot.id,
      quantity: 1,
      title: `${service.title} · ${formatClockTime(slot.start_time)}–${formatClockTime(
        slot.end_time,
      )} (${slot.slot_date})`,
      unit_price: toNumber(service.price),
      image_url: service.image_url,
    });
  }

  const leftFor = (slot: WellnessTimeSlot): number =>
    Math.max(0, slot.capacity_available - alreadyInCart(slot.id));

  const slotKey = (slot: WellnessTimeSlot): string =>
    `${slot.slot_date} ${slot.start_time}`;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Back Link */}
      <Link
        href="/wellness"
        className="inline-flex items-center gap-2 text-sm font-semibold text-forest-800 hover:text-forest-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("catalog.groupWellness")}
      </Link>

      {isLoading ? (
        <ListLoading />
      ) : isError || !service ? (
        <ListError
          message={extractErrorMessage(error, t("common.networkError"))}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          {/* Header Banner */}
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
            <div className="relative h-64 w-full bg-forest-900 sm:h-80 md:h-96">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage(service.image_url, "wellness", service.id, 1200)}
                alt={service.title}
                className="h-full w-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-forest-950/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-cream-50 sm:bottom-8 sm:left-8 sm:right-8">
                <span className="inline-block rounded-full bg-gold-500/90 px-3 py-1 text-xs font-semibold text-forest-950 shadow-sm">
                  Traditional Wellness & Spa
                </span>
                <h1 className="mt-2 font-serif text-2xl font-bold tracking-wide text-cream-100 sm:text-4xl">
                  {service.title}
                </h1>
                <div className="mt-3 flex items-center gap-4 text-xs sm:text-sm text-cream-200">
                  <span className="flex items-center gap-1 font-semibold text-gold-300">
                    {formatBaht(service.price)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-gold-400" />
                    {t("catalog.durationMinutes", { minutes: service.duration_minutes })}
                  </span>
                </div>
              </div>
            </div>

            {service.description && (
              <div className="p-6 sm:p-8 bg-cream-50/40">
                <h2 className="font-serif font-bold text-forest-950">รายละเอียดบริการ (Service Description)</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {service.description}
                </p>
              </div>
            )}
          </div>

          {/* Date Picker */}
          <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-forest-700" aria-hidden="true" />
              <div>
                <h2 className="font-serif font-bold text-foreground">{t("catalog.pickDate")}</h2>
                <p className="text-xs text-muted-foreground">เลือกระบุวันที่ต้องการรับบริการสปาเพื่อเช็ครอบเวลาที่ว่าง</p>
              </div>
            </div>
            <input
              id="slot-date"
              type="date"
              min={todayISO()}
              value={slotDate}
              onChange={(e) => setSlotDate(e.target.value)}
              className="mt-2 max-w-sm w-full rounded-xl border border-border/80 bg-cream-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
            />
          </section>

          {/* Time Slots */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-forest-800" />
              <h2 className="font-serif text-xl font-bold text-foreground">รอบเวลาบริการ (Available Time Slots)</h2>
            </div>

            {slots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 p-10 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  {t("catalog.noSlots")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {slots.map((slot) => {
                  const left = leftFor(slot);
                  const full = left <= 0;
                  return (
                    <div
                      key={slotKey(slot)}
                      className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all hover:border-gold-500/40"
                    >
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <p className="font-serif text-lg font-bold text-forest-950">
                            {formatClockTime(slot.start_time)} – {formatClockTime(slot.end_time)}
                          </p>
                          <span
                            className={
                              full
                                ? "rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive"
                                : "rounded-full bg-forest-100 px-2.5 py-0.5 text-xs font-semibold text-forest-900"
                            }
                          >
                            {full ? t("catalog.outOfStock") : t("catalog.slotCapacity", { left })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {slot.slot_date}
                        </p>
                      </div>

                      <AddToCartButton
                        onAdd={() => addSlot(slot)}
                        disabled={full}
                        disabledLabel={t("catalog.outOfStock")}
                        className="w-full justify-center rounded-xl"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

