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
    <div className="wt-page space-y-8">
      {/* 1. Photo-First 4:5 Atmosphere Carousel */}
      <AtmosphereCarousel heroMode />

      {/* 2. Quick Category Selection Chips */}
      <section className="wt-categories" aria-label={copy("หมวดบริการท่องเที่ยว", "Service categories")}>
        {categories.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </section>

      {/* 3. Privacy-Compliant Geolocation Consent */}
      <LocationConsent />

      {/* 4. Dynamic API Catalog Feeds */}
      {sections.map((section) => (
        <section key={section.id} className="wt-section" aria-labelledby={`home-${section.id}`}>
          <div className="wt-section-title">
            <div>
              <span className="wt-eyebrow">{section.eyebrow}</span>
              <h2 id={`home-${section.id}`}>{section.title}</h2>
            </div>
            <Link href={section.href}>
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
            <div className="wt-empty">
              {copy("ยังไม่มีรายการที่เปิดให้บริการในขณะนี้", "No listings available at the moment.")}
            </div>
          ) : (
            <div className="wt-scroll-row">
              {section.items.map((item) => (
                <Link key={item.id} href={item.href} className="wt-card">
                  <div className="wt-media">
                    {item.image ? (
                      <img src={item.image} alt={item.title} loading="lazy" />
                    ) : (
                      <div className="wt-media-fallback">
                        <span>{copy("ไม่มีรูปภาพ", "No image")}</span>
                      </div>
                    )}
                  </div>
                  <h3>{item.title}</h3>
                  {item.meta && (
                    <span className="wt-card-meta">
                      <MapPin size={13} />
                      <span>{item.meta}</span>
                    </span>
                  )}
                  <p className="wt-price">
                    {item.price !== null ? formatBaht(item.price) : copy("สอบถามราคา", "Inquire price")}{" "}
                    {item.unit && <small>{item.unit}</small>}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      ))}

      {/* 5. Health Trip Helper Card */}
      <section className="wt-section wt-panel">
        <span className="wt-eyebrow">
          <Leaf size={16} /> A LITTLE MORE YOU
        </span>
        <h2 className="font-serif text-2xl font-normal text-[#193E30] my-2">
          {copy("ให้ทริปนี้เหมาะกับคุณมากขึ้น", "Find a trip that feels like you")}
        </h2>
        <p className="wt-muted">
          {copy(
            "ประเมินเป้าหมายสุขภาพและไลฟ์สไตล์การพักผ่อน เพื่อรับคำแนะนำโฮมสเตย์ อาหาร และกิจกรรมนวดสมุนไพรที่ออกแบบมาเพื่อคุณ",
            "Take a quick wellness assessment to discover personalized homestays, healthy dining, and herbal spas in Sisaket."
          )}
        </p>
        <Link className="wt-button mt-4" href="/health">
          <span>{copy("เริ่มประเมินสุขภาพ", "Start assessment")}</span>
          <ArrowUpRight size={16} />
        </Link>
      </section>

      {/* 6. Community Stories & Sound of Sisaket Events */}
      <section className="wt-section space-y-3">
        <Link className="wt-story-link" href="/community">
          <Users size={24} />
          <div>
            <strong>{copy("พบผู้คนและชุมชน", "Meet local hosts")}</strong>
            <small>{copy("เรื่องราวจาก 13 หมู่บ้าน OTOP นวัตวิถี", "Stories from 13 OTOP villages")}</small>
          </div>
          <ArrowUpRight size={18} />
        </Link>

        <Link className="wt-story-link" href="/news">
          <Newspaper size={24} />
          <div>
            <strong>{copy("ข่าวและกิจกรรมระหว่างทาง", "Events & Stories")}</strong>
            <small>{copy("Sound of Sisaket 2026 & ปฏิทินงาน", "Sound of Sisaket 2026 calendar")}</small>
          </div>
          <ArrowUpRight size={18} />
        </Link>
      </section>
    </div>
  );
}
