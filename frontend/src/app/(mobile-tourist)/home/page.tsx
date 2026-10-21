"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";

const SisaketInteractiveMap = dynamic(
  () => import("@/components/travel/SisaketInteractiveMap"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[380px] sm:h-[440px] w-full bg-[#faf9f6] rounded-3xl border border-[#e5e7eb] flex items-center justify-center text-xs text-[#6b7280]">
        กำลังโหลดแผนที่ท่องเที่ยวศรีสะเกษ...
      </div>
    ),
  }
);
import {
  ArrowUpRight,
  House,
  Utensils,
  Flower2,
  ShoppingBag,
  Leaf,
  Users,
  Newspaper,
  MapPin,
  Sparkles,
} from "lucide-react";
import { AtmosphereCarousel } from "@/components/travel/AtmosphereCarousel";
import { LocationConsent } from "@/components/travel/LocationConsent";
import { useTravelCopy } from "@/components/travel/travel-shell";
import {
  getAccommodations,
  getOTOPProducts,
  getFoods,
  getWellnessServices,
} from "@/lib/api/catalog";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { extractErrorMessage } from "@/lib/api/errors";
import { formatBaht } from "@/lib/format";

export default function HomePage() {
  const copy = useTravelCopy();

  const staysQuery = useQuery({
    queryKey: ["home-stays"],
    queryFn: () => getAccommodations({ page: 1, limit: 4 }),
    staleTime: 60000,
  });

  const foodsQuery = useQuery({
    queryKey: ["home-foods"],
    queryFn: () => getFoods({ page: 1, limit: 4 }),
    staleTime: 60000,
  });

  const wellnessQuery = useQuery({
    queryKey: ["home-wellness"],
    queryFn: () => getWellnessServices({ page: 1, limit: 4 }),
    staleTime: 60000,
  });

  const productsQuery = useQuery({
    queryKey: ["home-products"],
    queryFn: () => getOTOPProducts({ page: 1, limit: 4 }),
    staleTime: 60000,
  });

  const categories = [
    {
      href: "/hotels",
      icon: House,
      label: copy("ที่พักชุมชน", "Stays"),
      detail: copy("โฮมสเตย์ & วิวทุ่งนา", "Homestays"),
    },
    {
      href: "/foods",
      icon: Utensils,
      label: copy("อาหารพื้นถิ่น", "Dining"),
      detail: copy("ปลาแม่น้ำมูล & อาหารสุขภาพ", "Local food"),
    },
    {
      href: "/wellness",
      icon: Flower2,
      label: copy("นวด & กิจกรรม", "Wellness"),
      detail: copy("สปาสมุนไพรสด", "Herbal spa"),
    },
    {
      href: "/otop",
      icon: ShoppingBag,
      label: copy("ของฝาก OTOP", "OTOP"),
      detail: copy("ผ้าทอ & กาแฟภูเขาไฟ", "Crafts & coffee"),
    },
  ];

  const sections = [
    {
      id: "stays",
      eyebrow: "ECO HOMESTAYS & RESORTS",
      title: copy("โฮมสเตย์สำหรับวันพักใจ", "Places to stay & slow down"),
      href: "/hotels",
      query: staysQuery,
      items: (staysQuery.data?.data ?? []).map((r) => ({
        id: r.id,
        title: r.name,
        image: r.image_url,
        price: r.min_price_per_night,
        meta: [r.district, r.province].filter(Boolean).join(", "),
        href: `/hotels/${r.id}`,
        unit: copy("/ คืน", "/ night"),
      })),
    },
    {
      id: "foods",
      eyebrow: "TASTE LOCAL HEALTHY DISHES",
      title: copy("อร่อยพื้นถิ่นเพื่อสุขภาพ", "A taste of Sisaket local life"),
      href: "/foods",
      query: foodsQuery,
      items: (foodsQuery.data?.data ?? []).map((r) => ({
        id: r.id,
        title: r.name,
        image: r.image_url,
        price: r.price,
        meta: copy("วัตถุดิบอินทรีย์ชุมชน", "Organic local ingredients"),
        href: "/foods",
        unit: "",
      })),
    },
    {
      id: "wellness",
      eyebrow: "TIME TO REFRESH & UNWIND",
      title: copy("เติมความสดชื่นให้ร่างกาย", "Make room for wellness"),
      href: "/wellness",
      query: wellnessQuery,
      items: (wellnessQuery.data?.data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        image: r.image_url,
        price: r.price,
        meta: `${r.duration_minutes} ${copy("นาที", "min")}`,
        href: `/wellness/${r.id}`,
        unit: "",
      })),
    },
    {
      id: "products",
      eyebrow: "LOCAL TREASURES & VOLCANO CRAFTS",
      title: copy("ของฝากชุมชนที่มีเรื่องราว", "Bring a story home"),
      href: "/otop",
      query: productsQuery,
      items: (productsQuery.data?.data ?? []).map((r) => ({
        id: r.id,
        title: r.name,
        image: r.image_url,
        price: r.price,
        meta: copy("สินค้าอัตลักษณ์ GI", "GI Volcano Craft"),
        href: "/otop",
        unit: "",
      })),
    },
  ];

  return (
    <div className="wt-page space-y-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6 pb-24 lg:pb-12 overflow-x-hidden">
      {/* 1. Photo-First 4:5 Atmosphere Carousel */}
      <AtmosphereCarousel heroMode />

      {/* 2. Responsive 4-Column Category Grid Selection */}
      <section
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
        aria-label={copy("หมวดบริการท่องเที่ยว", "Service categories")}
      >
        {categories.map(({ href, icon: Icon, label, detail }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-3xl bg-white border border-[#e5e7eb] hover:border-[#c49a45] hover:shadow-md transition text-center gap-2 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#faf9f6] flex items-center justify-center group-hover:bg-[#1f2925] transition-colors">
              <Icon
                size={24}
                className="text-[#c49a45] group-hover:text-white transition-colors"
                aria-hidden="true"
              />
            </div>
            <div>
              <span className="block font-serif text-sm font-bold text-[#1f2925] group-hover:text-[#c49a45] transition-colors">
                {label}
              </span>
              <span className="block text-[11px] text-[#6b7280] mt-0.5">
                {detail}
              </span>
            </div>
          </Link>
        ))}
      </section>

      {/* 3. Privacy-Compliant Geolocation Consent (Auto-hides upon action/consent) */}
      <LocationConsent />

      {/* 4. Sisaket Interactive Tourism & Wellness Map */}
      <SisaketInteractiveMap />

      {/* 5. Dynamic API Catalog Feeds with Responsive 4-Column Travilla Cards */}
      {sections.map((section) => (
        <section
          key={section.id}
          className="wt-section space-y-4"
          aria-labelledby={`home-${section.id}`}
        >
          <div className="flex items-end justify-between border-b border-[#e5e7eb] pb-3">
            <div>
              <span className="wt-eyebrow text-xs tracking-wider font-bold text-[#c49a45] uppercase">
                {section.eyebrow}
              </span>
              <h2
                id={`home-${section.id}`}
                className="font-serif text-2xl font-bold text-[#1f2925] mt-1"
              >
                {section.title}
              </h2>
            </div>
            <Link
              href={section.href}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#c49a45] hover:text-[#1f2925] transition"
            >
              <span>{copy("ดูทั้งหมด", "View all")}</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>

          {section.query.isLoading ? (
            <ListLoading />
          ) : section.query.isError ? (
            <ListError
              message={extractErrorMessage(section.query.error)}
              onRetry={() => {
                void section.query.refetch();
              }}
            />
          ) : !section.items.length ? (
            <div className="wt-empty p-8 text-center text-sm text-[#6b7280] bg-white rounded-3xl border border-dashed border-[#e5e7eb]">
              {copy(
                "ยังไม่มีรายการที่เปิดให้บริการในขณะนี้",
                "No listings available at the moment."
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {section.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="wt-card group bg-white border border-[#e5e7eb] rounded-3xl p-3 hover:border-[#c49a45] hover:shadow-lg transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="wt-media relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#faf9f6]">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#9ca3af]">
                          <span>{copy("ไม่มีรูปภาพ", "No image")}</span>
                        </div>
                      )}
                      {item.price !== null && (
                        <div className="absolute bottom-2 right-2 bg-[#1f2925]/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-[#c49a45]/40 shadow-sm">
                          <span className="text-[#c49a45]">
                            {formatBaht(item.price)}
                          </span>{" "}
                          {item.unit}
                        </div>
                      )}
                    </div>
                    <h3 className="font-serif text-base font-bold text-[#1f2925] group-hover:text-[#c49a45] transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                  </div>

                  {item.meta && (
                    <div className="flex items-center gap-1.5 text-xs text-[#6b7280] mt-3 pt-2 border-t border-[#f3f4f6]">
                      <MapPin size={13} className="text-[#c49a45] shrink-0" />
                      <span className="truncate">{item.meta}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>
      ))}

      {/* 5. Health Trip Helper Card */}
      <section className="wt-section bg-gradient-to-br from-white to-[#faf9f6] border border-[#e5e7eb] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <span className="wt-eyebrow text-xs tracking-wider font-bold text-[#c49a45] uppercase flex items-center gap-1.5">
          <Leaf size={16} /> A LITTLE MORE YOU
        </span>
        <h2 className="font-serif text-2xl font-bold text-[#1f2925]">
          {copy(
            "ออกแบบทริปสุขภาพที่เหมาะกับคุณ",
            "Find a trip that feels like you"
          )}
        </h2>
        <p className="text-sm text-[#4b5563] leading-relaxed max-w-2xl">
          {copy(
            "ประเมินเป้าหมายสุขภาพและไลฟ์สไตล์การพักผ่อน เพื่อรับคำแนะนำโฮมสเตย์ อาหาร และกิจกรรมนวดสมุนไพรที่ออกแบบมาเพื่อคุณ",
            "Take a quick wellness assessment to discover personalized homestays, healthy dining, and herbal spas in Sisaket."
          )}
        </p>
        <div>
          <Link
            className="wt-button inline-flex items-center gap-2 text-sm font-semibold bg-[#1f2925] text-white px-6 py-3 rounded-full hover:bg-[#151d1a] transition"
            href="/health"
          >
            <Sparkles size={16} className="text-[#c49a45]" />
            <span>{copy("เริ่มประเมินสุขภาพ", "Start assessment")}</span>
          </Link>
        </div>
      </section>

      {/* 6. Community Stories & Sound of Sisaket Events (Responsive 2-Column Grid) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
        <Link
          className="flex items-center justify-between rounded-3xl p-6 border border-[#e5e7eb] bg-white hover:border-[#c49a45] hover:shadow-md transition group"
          href="/community"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#faf9f6] flex items-center justify-center shrink-0">
              <Users size={24} className="text-[#c49a45]" />
            </div>
            <div>
              <strong className="block font-serif text-base font-bold text-[#1f2925] group-hover:text-[#c49a45] transition-colors">
                {copy("พบผู้คนและชุมชน", "Meet local hosts")}
              </strong>
              <span className="block text-xs text-[#6b7280] mt-0.5">
                {copy("เรื่องราวจาก 13 หมู่บ้าน OTOP นวัตวิถี", "Stories from 13 OTOP villages")}
              </span>
            </div>
          </div>
          <ArrowUpRight
            size={20}
            className="text-[#c49a45] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </Link>

        <Link
          className="flex items-center justify-between rounded-3xl p-6 border border-[#e5e7eb] bg-white hover:border-[#c49a45] hover:shadow-md transition group"
          href="/news"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#faf9f6] flex items-center justify-center shrink-0">
              <Newspaper size={24} className="text-[#c49a45]" />
            </div>
            <div>
              <strong className="block font-serif text-base font-bold text-[#1f2925] group-hover:text-[#c49a45] transition-colors">
                {copy("ข่าวและกิจกรรมระหว่างทาง", "Events & Stories")}
              </strong>
              <span className="block text-xs text-[#6b7280] mt-0.5">
                {copy("Sound of Sisaket 2026 & ปฏิทินงาน", "Sound of Sisaket 2026 calendar")}
              </span>
            </div>
          </div>
          <ArrowUpRight
            size={20}
            className="text-[#c49a45] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
          />
        </Link>
      </section>
    </div>
  );
}
