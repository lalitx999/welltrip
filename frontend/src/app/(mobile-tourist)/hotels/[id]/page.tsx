"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  ChevronLeft,
  Coffee,
  Heart,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
  Wifi,
  Wind,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Alert } from "@/components/ui/alert";
import { getAccommodationRooms } from "@/lib/api/catalog";
import { extractErrorMessage } from "@/lib/api/errors";
import { formatBaht, todayISO, toNumber } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { useFavoritesStore } from "@/store/favorites-store";
import type { RoomPublic } from "@/types/catalog";

export default function HotelDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams<{ id: string }>();
  const accommodationId = params?.id ?? "";

  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [qtyByRoom, setQtyByRoom] = useState<Record<string, number>>({});
  const [galleryIndex, setGalleryIndex] = useState(0);
  const addItem = useCartStore((s) => s.addItem);

  const bothDatesValid = Boolean(
    checkin && checkout && checkin >= todayISO() && checkout > checkin,
  );

  const calculateNights = () => {
    if (!bothDatesValid) return 1;
    const start = new Date(checkin).getTime();
    const end = new Date(checkout).getTime();
    return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  };

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

  const gallery = Array.from(
    new Set(
      [
        accommodation?.image_url,
        ...rooms.flatMap((room) => room.images.map((image) => image.image_url)),
      ].filter((url): url is string => Boolean(url && url.trim())),
    ),
  );

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

  const isFav = useFavoritesStore((s) => s.isFavorite(accommodationId));
  const toggleFav = useFavoritesStore((s) => s.toggleFavorite);

  return (
    <div className="bg-[#FAF8F5] min-h-[85vh] py-6 pb-28 lg:pb-12 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/hotels"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1B2A24] hover:text-[#D97706] transition-colors"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span>{locale === "th" ? "ย้อนกลับไปที่พักชุมชน" : "Back to accommodations"}</span>
          </Link>

          {accommodation && (
            <button
              type="button"
              onClick={() =>
                toggleFav({
                  id: accommodation.id,
                  type: "hotel",
                  title: accommodation.name,
                  imageUrl: accommodation.image_url,
                  price: accommodation.min_price_per_night ? Number(accommodation.min_price_per_night) : undefined,
                  location: [accommodation.district, accommodation.province].filter(Boolean).join(", "),
                })
              }
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-all shadow-xs cursor-pointer",
                isFav
                  ? "bg-rose-50 border-rose-200 text-rose-600"
                  : "bg-white border-stone-200 text-stone-600 hover:text-rose-600"
              )}
            >
              <Heart className={cn("w-3.5 h-3.5", isFav && "fill-rose-500 text-rose-500")} />
              <span>{isFav ? (locale === "th" ? "บันทึกแล้ว" : "Saved") : (locale === "th" ? "บันทึกเป็นรายการโปรด" : "Save")}</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <ListLoading />
        ) : isError || !accommodation ? (
          <ListError
            message={extractErrorMessage(error, t("common.networkError"))}
            onRetry={() => void refetch()}
          />
        ) : (
          <>
            {/* Top Gallery & Overview Hero Section */}
            <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm space-y-0">
              
              {/* Hero Aspect-Ratio Gallery Banner */}
              <div className="relative aspect-[16/9] md:aspect-[21/9] w-full bg-[#1B2A24] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayImage(
                    gallery[galleryIndex] ?? accommodation.image_url,
                    "hotel",
                    accommodation.id,
                    1200,
                  )}
                  alt={accommodation.name}
                  className="h-full w-full object-cover transition-opacity duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A24]/90 via-[#1B2A24]/40 to-transparent" />
                
                <div className="absolute bottom-6 left-6 right-6 text-white sm:bottom-8 sm:left-8 sm:right-8 space-y-2">
                  <span className="inline-block px-3 py-1 rounded-full bg-[#D97706] text-white text-[10px] font-bold tracking-widest uppercase shadow-sm">
                    ECO-HOMESTAY DESTINATION
                  </span>
                  <h1 className="font-serif text-2xl sm:text-4xl font-bold text-white leading-tight">
                    {accommodation.name}
                  </h1>
                  <p className="flex items-center gap-1.5 text-xs text-slate-200 font-medium">
                    <MapPin className="h-4 w-4 text-[#D97706]" aria-hidden="true" />
                    <span>
                      {[accommodation.district, accommodation.province]
                        .filter(Boolean)
                        .join(", ") || (locale === "th" ? "เมืองศรีสะเกษ, ศรีสะเกษ" : "Sisaket")}
                    </span>
                  </p>
                </div>
              </div>

              {/* Gallery Thumbnails Carousel Bar */}
              {gallery.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto p-4 bg-[#FAF8F5] border-t border-slate-100 scrollbar-none">
                  {gallery.slice(0, 8).map((url, index) => (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => setGalleryIndex(index)}
                      aria-pressed={galleryIndex === index}
                      className={cn(
                        "h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all shadow-xs",
                        galleryIndex === index
                          ? "border-[#D97706] ring-2 ring-[#D97706]/20"
                          : "border-transparent opacity-70 hover:opacity-100",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={displayImage(url, "room", accommodation.id, 200)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* About Stay Story Section */}
              <div className="p-6 sm:p-8 space-y-3 border-t border-slate-100">
                <h2 className="font-serif font-bold text-xl text-[#1B2A24]">
                  {locale === "th" ? "เกี่ยวกับที่พักและวิถีชุมชน" : "About This Eco Homestay"}
                </h2>
                <p className="text-sm leading-relaxed text-slate-600 font-normal">
                  {accommodation.description ||
                    (locale === "th"
                      ? "สัมผัสวิถีชีวิตโฮมสเตย์เรือนไม้บรรยากาศธรรมชาติ เรียนรู้วิถีชุมชน 4 ชนเผ่าศรีสะเกษ รับประทานอาหารพื้นเมืองออร์แกนิก และผ่อนคลายด้วยสปาสมุนไพรสดรับรองโดยวิสาหกิจชุมชน"
                      : "Experience traditional wooden homestay hospitality, authentic 4-ethnic culture, organic local gastronomy, and fresh herbal wellness in Sisaket.")}
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-[#1B2A24] font-medium">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] border border-slate-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>{locale === "th" ? "100% รับรองโดยวิสาหกิจชุมชน" : "100% Community Certified"}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] border border-slate-200">
                    <Sparkles className="w-4 h-4 text-[#D97706]" />
                    <span>{locale === "th" ? "มรดกภูมิปัญญา 4 ชนเผ่า" : "4 Ethnic Cultural Heritage"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Date Selection & Availability Picker */}
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 text-[#D97706] border border-[#D97706]/20">
                    <CalendarDays className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-lg text-[#1B2A24]">
                      {locale === "th" ? "ระบุช่วงเวลาเข้าพัก" : "Stay Duration & Availability"}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      {locale === "th"
                        ? "เพื่อตรวจสอบจำนวนห้องว่างและคำนวณราคาสุทธิประจำทริปของคุณ"
                        : "Check real-time room availability and total price"}
                    </p>
                  </div>
                </div>

                {bothDatesValid && (
                  <span className="self-start sm:self-center inline-flex items-center gap-1.5 bg-[#1B2A24] text-[#D97706] px-3.5 py-1.5 rounded-full text-xs font-bold border border-[#D97706]/30 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{calculateNights()} {locale === "th" ? "คืน" : "nights"}</span>
                  </span>
                )}
              </div>

              {/* 2-Box Grid with Center Nights Connector */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-3 pt-1">
                {/* Left Box: Check-in */}
                <div className="rounded-xl border border-slate-200/90 bg-[#FAF8F5] p-3.5 focus-within:border-[#1B2A24] focus-within:bg-white transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="ci" className="text-xs font-bold text-[#1B2A24] cursor-pointer">
                      {t("catalog.checkinDate")}
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {locale === "th" ? "ตั้งแต่ 14:00 น." : "From 14:00"}
                    </span>
                  </div>
                  <input
                    id="ci"
                    type="date"
                    min={todayISO()}
                    className="w-full bg-transparent text-sm font-bold text-[#1B2A24] outline-none cursor-pointer"
                    value={checkin}
                    onChange={(e) => setCheckin(e.target.value)}
                  />
                </div>

                {/* Center Badge / Divider */}
                <div className="hidden md:flex flex-col items-center justify-center px-2">
                  <span className="text-xs font-bold text-[#D97706] bg-amber-50 px-2.5 py-1 rounded-full border border-[#D97706]/20">
                    {bothDatesValid ? `• ${calculateNights()} คืน` : "→"}
                  </span>
                </div>

                {/* Right Box: Check-out */}
                <div className="rounded-xl border border-slate-200/90 bg-[#FAF8F5] p-3.5 focus-within:border-[#1B2A24] focus-within:bg-white transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="co" className="text-xs font-bold text-[#1B2A24] cursor-pointer">
                      {t("catalog.checkoutDate")}
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {locale === "th" ? "ก่อน 12:00 น." : "Before 12:00"}
                    </span>
                  </div>
                  <input
                    id="co"
                    type="date"
                    min={checkin || todayISO()}
                    className="w-full bg-transparent text-sm font-bold text-[#1B2A24] outline-none cursor-pointer"
                    value={checkout}
                    onChange={(e) => setCheckout(e.target.value)}
                  />
                </div>
              </div>

              {!bothDatesValid && (
                <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50/80 p-3 rounded-xl border border-amber-200/60">
                  <Sparkles className="w-4 h-4 text-[#D97706] shrink-0" />
                  <span>
                    {locale === "th"
                      ? "กรุณาระบุวันเช็คอินและวันเช็คเอาต์เพื่อดูจำนวนห้องคงเหลือและกดเลือกห้องพัก"
                      : "Please specify check-in and check-out dates to view available rooms and book"}
                  </span>
                </div>
              )}
            </section>

            {/* Available Rooms Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <BedDouble className="h-6 w-6 text-[#D97706]" />
                  <h2 className="font-serif text-2xl font-bold text-[#1B2A24]">
                    {locale === "th" ? "ประเภทห้องพักที่เปิดให้บริการ" : "Available Rooms"}
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {rooms.length} {locale === "th" ? "ประเภทห้อง" : "room types"}
                </span>
              </div>

              {rooms.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-500 text-sm">
                  {locale === "th" ? "ยังไม่มีห้องพักเปิดให้จองในขณะนี้" : "No rooms available at the moment."}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {rooms.map((room) => {
                  const minAvailable = minAvailableFor(room);
                  const soldOut = minAvailable === 0;
                  const primaryImageUrl =
                    room.images.find((i) => i.is_primary)?.image_url ?? "";
                  const quantity = Math.min(qtyByRoom[room.id] ?? 1, minAvailable ?? 99);

                  return (
                    <div
                      key={room.id}
                      className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm hover:border-[#D97706] hover:shadow-md transition-all group"
                    >
                      <div>
                        {/* Room Thumbnail Image (16:9 Aspect Ratio) */}
                        <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={displayImage(primaryImageUrl, "room", room.id, 500)}
                            alt={room.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          {/* Capacity Badge Overlay */}
                          <div className="absolute top-3 left-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#1B2A24]/85 backdrop-blur-md px-3 py-1 text-xs font-bold text-white border border-[#D97706]/40 shadow-sm">
                              <Users className="w-3.5 h-3.5 text-[#D97706]" />
                              <span>
                                {t("catalog.capacity", {
                                  min: room.base_capacity,
                                  max: room.max_capacity,
                                })}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Room Center Info */}
                        <div className="p-5 space-y-3">
                          <h3 className="font-serif text-lg font-bold text-[#1B2A24] group-hover:text-[#D97706] transition-colors">
                            {room.name}
                          </h3>
                          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                            {room.description ||
                              (locale === "th"
                                ? "บรรยากาศธรรมชาติ พร้อมสิ่งอำนวยความสะดวกครบครันและอาหารเช้าพื้นเมือง"
                                : "Eco-lodge room with full amenities and traditional breakfast")}
                          </p>

                          {/* Mini Amenities List Icons */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-600 font-medium">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-slate-200">
                              <Wifi className="w-3.5 h-3.5 text-[#D97706]" />
                              <span>Wi-Fi</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-slate-200">
                              <Coffee className="w-3.5 h-3.5 text-[#D97706]" />
                              <span>{locale === "th" ? "อาหารเช้า" : "Breakfast"}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-slate-200">
                              <Wind className="w-3.5 h-3.5 text-[#D97706]" />
                              <span>{locale === "th" ? "เครื่องปรับอากาศ" : "Air-con"}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right / Bottom Action Bar */}
                      <div className="border-t border-slate-100 bg-[#FAF8F5] p-5 space-y-4">
                        <div className="flex items-baseline justify-between">
                          <div>
                            <p className="text-xl font-serif font-bold text-[#1B2A24]">
                              {room.total_price_for_stay
                                ? `${formatBaht(room.total_price_for_stay)}`
                                : `${formatBaht(room.base_price_per_night)}`}
                              <small className="text-xs font-normal text-slate-500">
                                {" "}
                                {room.total_price_for_stay ? t("catalog.totalStay") : t("catalog.perNight")}
                              </small>
                            </p>
                            {minAvailable !== null && (
                              <p
                                className={
                                  soldOut
                                    ? "text-xs font-semibold text-rose-600"
                                    : "text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5 border border-emerald-200/60"
                                }
                              >
                                {soldOut
                                  ? t("catalog.outOfStock")
                                  : t("catalog.slotCapacity", { left: minAvailable })}
                              </p>
                            )}
                          </div>

                          {/* Stepper Quantity Control */}
                          {!soldOut && (
                            <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5">
                              <button
                                type="button"
                                aria-label="ลดจำนวนห้อง"
                                className="grid h-8 w-8 place-items-center text-slate-500 hover:text-[#1B2A24] transition-colors disabled:opacity-30"
                                disabled={quantity <= 1}
                                onClick={() =>
                                  setQtyByRoom((prev) => ({
                                    ...prev,
                                    [room.id]: Math.max(1, (prev[room.id] ?? 1) - 1),
                                  }))
                                }
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-7 text-center text-xs font-bold text-[#1B2A24]">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                aria-label="เพิ่มจำนวนห้อง"
                                disabled={minAvailable !== null && quantity >= minAvailable}
                                className="grid h-8 w-8 place-items-center text-slate-500 hover:text-[#1B2A24] transition-colors"
                                onClick={() =>
                                  setQtyByRoom((prev) => ({
                                    ...prev,
                                    [room.id]: Math.min(quantity + 1, minAvailable ?? 99),
                                  }))
                                }
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Add to Cart CTA */}
                        <AddToCartButton
                          onAdd={() => addRoom(room)}
                          disabled={soldOut || !bothDatesValid || minAvailable === null}
                          disabledLabel={
                            soldOut
                              ? t("catalog.outOfStock")
                              : locale === "th"
                              ? "เลือกวันเข้าพักก่อนจอง"
                              : "Pick dates first"
                          }
                          className="w-full justify-center rounded-xl !min-h-[46px] bg-[#1B2A24] text-white font-semibold text-xs hover:bg-[#151d1a] transition"
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
    </div>
  );
}
