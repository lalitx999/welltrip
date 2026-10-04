"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
    { href: "/hotels", icon: House, label: copy("ที่พักชุมชน", "Stays"), detail: copy("โฮมสเตย์ & วิวทุ่งนา", "Homestays") },
    { href: "/foods", icon: Utensils, label: copy("อาหารพื้นถิ่น", "Dining"), detail: copy("ปลาแม่น้ำมูล & อาหารสุขภาพ", "Local food") },
    { href: "/wellness", icon: Flower2, label: copy("นวด & กิจกรรม", "Wellness"), detail: copy("สปาสมุนไพรสด", "Herbal spa") },
    { href: "/otop", icon: ShoppingBag, label: copy("ของฝาก OTOP", "OTOP"), detail: copy("ผ้าทอ & กาแฟภูเขาไฟ", "Crafts & coffee") },
  ];

  const sections = [
    {
      id: "stays",
      eyebrow: "ECO HOMESTAYS & RESORTS",
      title: copy("ที่พักสำหรับวันพักใจ", "Places to stay & slow down"),
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
      title: copy("อร่อยพื้นถิ่นใกล้ชุมชน", "A taste of Sisaket local life"),
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
      title: copy("ของฝากที่มีเรื่องราว", "Bring a story home"),
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
    <div className="min-h-screen bg-[#FAF8F1] px-4 py-3 sm:px-6 sm:py-6 space-y-8 max-w-5xl mx-auto">
      {/* 1. Photo-First 4:5 Atmosphere Carousel */}
      <AtmosphereCarousel heroMode />

      {/* 2. Quick Category Filter Grid */}
      <section aria-label={copy("หมวดบริการท่องเที่ยว", "Service categories")}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {categories.map(({ href, icon: Icon, label, detail }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col justify-between p-4 rounded-2xl bg-white border border-[#E2EDE6] shadow-sm hover:shadow-md hover:border-[#C5A059] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#E2EDE6] text-[#193E30] flex items-center justify-center group-hover:bg-[#193E30] group-hover:text-[#FAF8F1] transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#657267] group-hover:text-[#C5A059] transition-colors" />
              </div>
              <div>
                <strong className="block text-sm font-semibold text-[#193E30]">{label}</strong>
                <small className="block text-xs text-[#657267] mt-0.5">{detail}</small>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Location Consent Widget */}
      <LocationConsent />

      {/* 4. Dynamic Catalog Feeds */}
      {sections.map((section) => (
        <section key={section.id} className="space-y-4" aria-labelledby={`home-${section.id}`}>
          <div className="flex items-end justify-between gap-4 border-b border-[#E2EDE6] pb-3">
            <div>
              <span className="text-[10px] font-semibold tracking-widest text-[#657267] uppercase">
                {section.eyebrow}
              </span>
              <h2 id={`home-${section.id}`} className="font-serif text-xl sm:text-2xl font-semibold text-[#193E30]">
                {section.title}
              </h2>
            </div>
            <Link
              href={section.href}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#193E30] hover:text-[#C5A059] transition-colors shrink-0"
            >
              <span>{copy("ดูทั้งหมด", "View all")}</span>
              <ArrowUpRight className="w-4 h-4" />
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
            <div className="p-8 text-center rounded-2xl border border-dashed border-[#C4DBD0] text-xs text-[#657267]">
              {copy("ยังไม่มีรายการที่เปิดให้บริการในขณะนี้", "No listings available at the moment.")}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
              {section.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="w-[72vw] sm:w-64 shrink-0 snap-start flex flex-col rounded-2xl bg-white border border-[#E2EDE6] overflow-hidden shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="aspect-[4/3] relative bg-[#E2EDE6] overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#657267] text-xs">
                        {copy("ไม่มีรูปภาพ", "No image")}
                      </div>
                    )}
                  </div>
                  <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-[#193E30] line-clamp-1 group-hover:text-[#C5A059] transition-colors">
                        {item.title}
                      </h3>
                      {item.meta && (
                        <span className="flex items-center gap-1 text-xs text-[#657267] mt-1">
                          <MapPin className="w-3 h-3 text-[#C5A059]" />
                          <span className="line-clamp-1">{item.meta}</span>
                        </span>
                      )}
                    </div>
                    <div className="pt-2 border-t border-[#FAF8F1] flex items-baseline justify-between">
                      <span className="text-sm font-bold text-[#193E30]">
                        {item.price !== null ? formatBaht(item.price) : copy("สอบถามราคา", "Inquire price")}
                      </span>
                      {item.unit && <small className="text-xs text-[#657267] font-normal">{item.unit}</small>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      ))}

      {/* 5. Health Trip Assessment Feature Banner */}
      <section className="p-6 rounded-3xl bg-[#193E30] text-[#FAF8F1] shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F1]/10 border border-[#C5A059]/40 text-xs text-[#C5A059]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SISAKET WELLNESS GUIDE</span>
          </div>
          <h2 className="font-serif text-2xl font-normal text-[#FAF8F1]">
            {copy("ให้ทริปนี้เหมาะกับคุณมากขึ้น", "Find a trip that feels like you")}
          </h2>
          <p className="text-xs sm:text-sm text-[#FAF8F1]/80 leading-relaxed">
            {copy(
              "ประเมินเป้าหมายสุขภาพและไลฟ์สไตล์การพักผ่อน เพื่อรับคำแนะนำโฮมสเตย์ อาหารพื้นถิ่น และสปาสมุนไพรที่ออกแบบเพื่อคุณโดยเฉพาะ",
              "Take a quick wellness assessment to discover personalized homestays, healthy local cuisine, and herbal spas in Sisaket."
            )}
          </p>
          <Link
            href="/health"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#A8833D] text-[#193E30] text-xs font-bold transition-all shadow-md"
          >
            <span>{copy("เริ่มประเมินสุขภาพ", "Start assessment")}</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 6. Community Stories & Events */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <Link
          href="/community"
          className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#E2EDE6] hover:border-[#C5A059] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E2EDE6] text-[#193E30] flex items-center justify-center group-hover:bg-[#193E30] group-hover:text-[#FAF8F1] transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <strong className="block text-sm font-semibold text-[#193E30]">
                {copy("พบผู้คนและชุมชน", "Meet local hosts")}
              </strong>
              <small className="block text-xs text-[#657267]">
                {copy("เรื่องราวจาก 13 หมู่บ้าน OTOP นวัตวิถี", "Stories from 13 OTOP villages")}
              </small>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#657267] group-hover:text-[#C5A059] transition-colors" />
        </Link>

        <Link
          href="/news"
          className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#E2EDE6] hover:border-[#C5A059] transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E2EDE6] text-[#193E30] flex items-center justify-center group-hover:bg-[#193E30] group-hover:text-[#FAF8F1] transition-colors">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <strong className="block text-sm font-semibold text-[#193E30]">
                {copy("ข่าวและกิจกรรมระหว่างทาง", "Events & News")}
              </strong>
              <small className="block text-xs text-[#657267]">
                {copy(" Sound of Sisaket 2026 & ปฏิทินงาน", "Sound of Sisaket 2026 calendar")}
              </small>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#657267] group-hover:text-[#C5A059] transition-colors" />
        </Link>
      </section>
    </div>
  );
}
