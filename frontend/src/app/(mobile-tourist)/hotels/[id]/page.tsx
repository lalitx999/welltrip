"use client";

/**
 * (mobile-tourist)/hotels/[id]/page.tsx - Eco-Premium Hotel/Homestay Detail + Rooms.
 */
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  Bed,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { extractErrorMessage } from "@/lib/api/errors";
import { getAccommodationRooms } from "@/lib/api/catalog";
import { displayImage } from "@/lib/images";
import { formatBaht, todayISO, toNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import type { RoomPublic } from "@/types/catalog";

export default function HotelDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const accommodationId = params?.id ?? "";

  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [qtyByRoom, setQtyByRoom] = useState<Record<string, number>>({});
  const addItem = useCartStore((s) => s.addItem);

  const bothDatesValid = Boolean(
    checkin && checkout && checkin >= todayISO() && checkout > checkin,
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["accommodation-rooms", accommodationId, checkin, checkout],
    enabled: accommodationId.length > 0,
    queryFn: () =>
      getAccommodationRooms(accommodationId, {
        checkin: bothDatesValid ? checkin : undefined,
        checkout: bothDatesValid ? checkout : undefined,
      }),
  });

  const accommodation = data?.data.accommodation;
  const rooms = data?.data.rooms ?? [];

  function addRoom(room: RoomPublic) {
    if (!bothDatesValid || !accommodation) {
      return;
    }
    const image_url = room.images.find((img) => img.is_primary)?.image_url ?? "";
    addItem({
      item_type: "ROOM_RESERVATION",
      entity_id: room.id,
      quantity: Math.min(qtyByRoom[room.id] ?? 1, minAvailableFor(room) ?? 99),
      checkin_date: checkin,
      checkout_date: checkout,
      title: `${accommodation.name} · ${room.name}`,
      unit_price: room.total_price_for_stay
        ? toNumber(room.total_price_for_stay)
        : toNumber(room.base_price_per_night),
      image_url: image_url || undefined,
    });
  }

  const minAvailableFor = (room: RoomPublic): number | null => {
    if (!room.availability) {
      return null;
    }
    const counts = Object.values(room.availability);
    return counts.length > 0 ? Math.min(...counts) : 0;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Back Button */}
      <Link
        href="/hotels"
        className="inline-flex items-center gap-2 text-sm font-semibold text-forest-800 hover:text-forest-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {t("nav.hotels")}
      </Link>

      {isLoading ? (
        <ListLoading />
      ) : isError || !accommodation ? (
        <ListError
          message={extractErrorMessage(error, t("common.networkError"))}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          {/* Accommodation Header Hero */}
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm">
            <div className="relative h-64 w-full bg-forest-900 sm:h-80 md:h-96">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImage(accommodation.image_url || rooms.flatMap((room) => room.images).find((image) => image.is_primary)?.image_url, "hotel", accommodation.id, 1200)}
                alt={accommodation.name}
                className="h-full w-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-forest-950/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-cream-50 sm:bottom-8 sm:left-8 sm:right-8">
                <span className="inline-block rounded-full bg-gold-500/90 px-3 py-1 text-xs font-semibold text-forest-950 shadow-sm">
                  COMMUNITY STAYS
                </span>
                <h1 className="mt-2 font-serif text-2xl font-bold tracking-wide text-cream-100 sm:text-4xl">
                  {accommodation.name}
                </h1>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-cream-200 sm:text-sm">
                  <MapPin className="h-4 w-4 text-gold-400" aria-hidden="true" />
                  {[accommodation.district, accommodation.province]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>

            {accommodation.description && (
              <div className="p-6 sm:p-8 bg-cream-50/40">
                <h2 className="font-serif font-bold text-forest-950">เกี่ยวกับที่พัก (About Stay)</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {accommodation.description}
                </p>
              </div>
            )}
          </div>

          {/* Stay Dates Box */}
          <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-forest-700" aria-hidden="true" />
              <div>
                <h2 className="font-serif font-bold text-foreground">{t("catalog.pickDate")}</h2>
                <p className="text-xs text-muted-foreground">เลือกวันเข้าพักและวันเช็คเอาท์เพื่อดูราคาและความพร้อมของห้องพัก</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ci" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  {t("catalog.checkinDate")}
                </label>
                <input
                  id="ci"
                  type="date"
                  min={todayISO()}
                  className="w-full rounded-xl border border-border/80 bg-cream-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
                  value={checkin}
                  onChange={(e) => setCheckin(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="co" className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  {t("catalog.checkoutDate")}
                </label>
                <input
                  id="co"
                  type="date"
                  min={checkin || todayISO()}
                  className="w-full rounded-xl border border-border/80 bg-cream-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
                  value={checkout}
                  onChange={(e) => setCheckout(e.target.value)}
                />
              </div>
            </div>

            {checkin && checkout && !bothDatesValid && (
              <p className="mt-3 text-xs font-medium text-destructive">
                {t("catalog.chooseCheckoutFirst")}
              </p>
            )}
          </section>

          {/* Rooms List Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bed className="h-5 w-5 text-forest-800" />
              <h2 className="font-serif text-xl font-bold text-foreground">ประเภทห้องพัก (Available Rooms)</h2>
            </div>

            {rooms.length === 0 && <p className="wt-empty">ยังไม่มีห้องพักเปิดให้จอง</p>}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {rooms.map((room) => {
                const minAvailable = minAvailableFor(room);
                const soldOut = minAvailable === 0;
                const image_url =
                  room.images.find((i) => i.is_primary)?.image_url ?? "";
                const quantity = Math.min(qtyByRoom[room.id] ?? 1, minAvailable ?? 99);

                return (
                  <div
                    key={room.id}
                    className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:shadow-md"
                  >
                    <div>
                      <div className="relative h-48 w-full bg-cream-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={displayImage(image_url, "room", room.id, 500)}
                          alt={room.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="rounded-full bg-forest-900/80 px-3 py-1 text-xs font-medium text-cream-100 backdrop-blur-sm">
                            <Users className="mr-1 inline h-3 w-3" />
                            {t("catalog.capacity", {
                              min: room.base_capacity,
                              max: room.max_capacity,
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-2">
                        <h3 className="font-serif text-lg font-bold text-foreground">
                          {room.name}
                        </h3>
                        {room.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {room.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-border/60 bg-cream-50/40 p-4 sm:p-5">
                      <div className="flex items-baseline justify-between mb-4">
                        <div>
                          <p className="text-lg font-serif font-bold text-forest-900">
                            {room.total_price_for_stay
                              ? `${formatBaht(room.total_price_for_stay)} ${t(
                                  "catalog.totalStay",
                                )}`
                              : `${formatBaht(room.base_price_per_night)} ${t(
                                  "catalog.perNight",
                                )}`}
                          </p>
                          {minAvailable !== null && (
                            <p
                              className={
                                soldOut
                                  ? "text-xs font-medium text-destructive"
                                  : "text-xs text-muted-foreground"
                              }
                            >
                              {soldOut
                                ? t("catalog.outOfStock")
                                : t("catalog.slotCapacity", { left: minAvailable })}
                            </p>
                          )}
                        </div>

                        {!soldOut && (
                          <div className="flex items-center rounded-xl border border-border/80 bg-card">
                            <button
                              type="button"
                              aria-label="ลดจำนวนห้อง"
                              className="grid h-9 w-8 place-items-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                              disabled={quantity <= 1}
                              onClick={() =>
                                setQtyByRoom((prev) => ({
                                  ...prev,
                                  [room.id]: Math.max(1, (prev[room.id] ?? 1) - 1),
                                }))
                              }
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-xs font-semibold">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="เพิ่มจำนวนห้อง"
                              disabled={minAvailable !== null && quantity >= minAvailable}
                              className="grid h-9 w-8 place-items-center text-muted-foreground transition-colors hover:text-foreground"
                              onClick={() =>
                                setQtyByRoom((prev) => ({
                                  ...prev,
                                  [room.id]: Math.min(quantity + 1, minAvailable ?? 99),
                                }))
                              }
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>

                      <AddToCartButton
                        onAdd={() => addRoom(room)}
                        disabled={soldOut || !bothDatesValid || minAvailable === null}
                        disabledLabel={
                          soldOut ? t("catalog.outOfStock") : "กรุณาเลือกวันเข้าพัก"
                        }
                        className="w-full justify-center rounded-xl"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

