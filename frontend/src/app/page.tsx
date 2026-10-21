"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Flower2,
  Heart,
  House,
  Leaf,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Utensils,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { TravelShell, useTravelCopy } from "@/components/travel/travel-shell";
import {
  getAccommodations,
  getFoods,
  getOTOPProducts,
  getWellnessServices,
} from "@/lib/api/catalog";
import { formatBaht } from "@/lib/format";

export default function LandingPage() {
  const { status } = useAuth();
  const router = useRouter();
  const copy = useTravelCopy();

  const [activeTab, setActiveTab] = useState("hotels");
  const [query, setQuery] = useState("");
  const [heroBgIndex, setHeroBgIndex] = useState(0);
  const heroBanners = ["/banner1.jpeg", "/banner2.jpeg"];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroBgIndex((prev) => (prev + 1) % heroBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  // Live Backend Data Queries via TanStack Query
  const staysQuery = useQuery({
    queryKey: ["landing-stays"],
    queryFn: () => getAccommodations({ page: 1, limit: 2 }),
    staleTime: 60000,
  });

  const wellnessQuery = useQuery({
    queryKey: ["landing-wellness"],
    queryFn: () => getWellnessServices({ page: 1, limit: 2 }),
    staleTime: 60000,
  });

  const foodsQuery = useQuery({
    queryKey: ["landing-foods"],
    queryFn: () => getFoods({ page: 1, limit: 2 }),
    staleTime: 60000,
  });

  const productsQuery = useQuery({
    queryKey: ["landing-products"],
    queryFn: () => getOTOPProducts({ page: 1, limit: 2 }),
    staleTime: 60000,
  });

  // Combine real items from all 4 API endpoints
  const realStays = (staysQuery.data?.data ?? []).map((r) => ({
    id: r.id,
    title: r.name,
    category: copy("ที่พักชุมชน", "Eco Stay"),
    location: [r.district, r.province].filter(Boolean).join(", ") || copy("ศรีสะเกษ", "Sisaket"),
    price: formatBaht(r.min_price_per_night),
    period: copy("/ คืน", "/ night"),
    rating: 4.9,
    reviews: 12,
    badge: copy("โฮมสเตย์นิเวศ", "Eco Stay"),
    image: r.image_url || "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80",
    href: `/hotels/${r.id}`,
  }));

  const realWellness = (wellnessQuery.data?.data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    category: copy("สปาและกิจกรรม", "Wellness"),
    location: copy("ศรีสะเกษ", "Sisaket"),
    price: formatBaht(r.price),
    period: r.duration_minutes ? `/ ${r.duration_minutes} นาที` : copy("/ รอบ", "/ session"),
    rating: 4.8,
    reviews: 8,
    badge: copy("สปาสมุนไพรสด", "Herbal Spa"),
    image: r.image_url || "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
    href: `/wellness/${r.id}`,
  }));

  const realFoods = (foodsQuery.data?.data ?? []).map((r) => ({
    id: r.id,
    title: r.name,
    category: copy("อาหารเพื่อสุขภาพ", "Dining"),
    location: copy("ศรีสะเกษ", "Sisaket"),
    price: formatBaht(r.price),
    period: copy("/ ชุด", "/ set"),
    rating: 5.0,
    reviews: 15,
    badge: copy("วัตถุดิบสวนชุมชน", "Organic"),
    image: r.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    href: "/foods",
  }));

  const realProducts = (productsQuery.data?.data ?? []).map((r) => ({
    id: r.id,
    title: r.name,
    category: copy("หัตถกรรม OTOP", "Local Craft"),
    location: copy("ศรีสะเกษ", "Sisaket"),
    price: formatBaht(r.price),
    period: copy("/ ชิ้น", "/ piece"),
    rating: 4.9,
    reviews: 6,
    badge: copy("สินค้า OTOP", "OTOP Craft"),
    image: r.image_url || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80",
    href: "/otop",
  }));

  const featuredExperiences = [...realStays, ...realWellness, ...realFoods, ...realProducts].slice(0, 4);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const target = activeTab ? `/${activeTab}` : "/hotels";
    router.push(query ? `${target}?q=${encodeURIComponent(query)}` : target);
  }

  // Real Database Total Counts
  const totalStays = staysQuery.data?.meta?.pagination?.total_items ?? 0;
  const totalWellness = wellnessQuery.data?.meta?.pagination?.total_items ?? 0;
  const totalFoods = foodsQuery.data?.meta?.pagination?.total_items ?? 0;
  const totalProducts = productsQuery.data?.meta?.pagination?.total_items ?? 0;

  // Categories Slider / Chips with Real DB Totals
  const categoryChips = [
    { id: "hotels", label: copy("โฮมสเตย์นิเวศ", "Eco Stays"), icon: House, count: `${totalStays} ที่พัก` },
    { id: "wellness", label: copy("นวด & สปา herbal", "Spa & Wellness"), icon: Flower2, count: `${totalWellness} บริการ` },
    { id: "foods", label: copy("อาหารเพื่อสุขภาพ", "Local Dining"), icon: Utensils, count: `${totalFoods} เมนู` },
    { id: "otop", label: copy("ของดี & OTOP", "Local Crafts"), icon: ShoppingBag, count: `${totalProducts} สินค้า` },
    { id: "health", label: copy("ประเมินสุขภาพ", "Health Check"), icon: Leaf, count: "AI Curator" },
  ];

  // AI Goals
  const wellnessGoals = [
    { id: "relax", label: copy("🌿 พักผ่อนผ่อนคลาย", "Relaxation & Anti-Stress"), target: "/health?goal=relax" },
    { id: "detox", label: copy("🍵 ดีท็อกซ์กินอาหารสุขภาพ", "Healthy Food Detox"), target: "/foods" },
    { id: "nature", label: copy("🛖 สัมผัสวิถีชีวิตสวนผลไม้", "Volcanic Orchard Living"), target: "/hotels" },
    { id: "spa", label: copy("💆 นวดประคบสมุนไพรไทย", "Herbal Thai Massage"), target: "/wellness" },
  ];

  // Stats Counters from Live DB Data
  const stats = [
    { value: `${totalStays}`, label: copy("โฮมสเตย์นิเวศในระบบ", "Eco Stays in System") },
    { value: `${totalWellness}`, label: copy("บริการสุขภาพ & สปา", "Wellness Services") },
    { value: `${totalFoods}`, label: copy("เมนูอาหารเพื่อสุขภาพ", "Healthy Menu Items") },
    { value: `${totalProducts}`, label: copy("สินค้า OTOP ชุมชน", "OTOP Local Products") },
  ];

  return (
    <TravelShell>
      {/* 1. Full-Bleed Edge-to-Edge Travilla Hero Banner Section */}
      <section className="relative w-full min-h-[82vh] flex flex-col justify-between px-4 sm:px-12 py-10 sm:py-16 overflow-hidden bg-[#1f2925] text-[#faf9f6]">
        {/* Full-Color Scenic Background Photo Carousel (/banner1.jpeg & /banner2.jpeg) */}
        {heroBanners.map((bannerSrc, idx) => (
          <div
            key={bannerSrc}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 scale-105 ${
              idx === heroBgIndex ? "opacity-100 z-0" : "opacity-0 -z-10"
            }`}
            style={{
              backgroundImage: `url('${bannerSrc}')`,
            }}
          />
        ))}

        {/* Semi-transparent dark overlay layer for crisp gold & white text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 z-0 pointer-events-none" />

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-5xl mx-auto w-full pt-4 sm:pt-10 flex flex-col items-center text-center space-y-4 sm:space-y-6">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#c49a45]/80 bg-black/60 px-3.5 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#c49a45] backdrop-blur-md shadow-lg">
            <MapPin size={13} />
            <span>SISAKET · LUXURY ECO-WELLNESS DESTINATION</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white drop-shadow-xl leading-[1.18]">
            {copy("ออกไปพักผ่อน ให้ธรรมชาติศรีสะเกษ", "Explore The Beautiful Eco-Nature")}
            <br />
            <span className="text-[#c49a45] italic font-normal drop-shadow-md">
              {copy("ดูแลสุขภาพกายและใจของคุณ", "of Sisaket Thailand")}
            </span>
          </h1>

          <p className="text-xs sm:text-lg text-white/95 max-w-3xl leading-relaxed font-normal px-2 drop-shadow-md">
            {copy(
              "สัมผัสประสบการณ์เดินทางท่องเที่ยวช้าๆ ท่ามกลางโฮมสเตย์นิเวศ สปาสมุนไพรไทย อาหารพื้นถิ่นออร์แกนิก และมรดกภูมิปัญญาชุมชนศรีสะเกษ",
              "Slow down and recharge through welcoming eco-homestays, authentic Thai herbal wellness, and volcanic organic gastronomy."
            )}
          </p>

          {/* Key Floating Stats Badges */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-white">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-md">
              <ShieldCheck size={14} className="text-[#c49a45]" />
              <span>100% รับรองโดยชุมชน</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/50 backdrop-blur-md border border-white/20 shadow-md">
              <Sparkles size={14} className="text-[#c49a45]" />
              <span>จัดทริปด้วย AI ฟรี</span>
            </span>
          </div>
        </div>

        {/* 2. Travilla Interactive Capsule Reservation & Search Widget */}
        <div className="relative z-20 max-w-4xl mx-auto w-full mt-6 sm:mt-10 mb-2">
          {/* Category Tabs (Horizontal Scrollable Pill Bar on Mobile) */}
          <div className="flex items-center justify-start sm:justify-center gap-2 mb-3 overflow-x-auto pb-2 px-1 scrollbar-none">
            {categoryChips.slice(0, 4).map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                    isActive
                      ? "bg-[#c49a45] text-[#1f2925] shadow-md"
                      : "bg-[#1f2925]/80 text-[#faf9f6] border border-[#faf9f6]/20 hover:bg-[#faf9f6]/20"
                  }`}
                >
                  <Icon size={14} className="shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Capsule Search Form */}
          <form
            onSubmit={handleSearch}
            className="travilla-pill-bar bg-[#faf9f6] rounded-2xl sm:rounded-[2rem] p-3 text-[#1f2925] shadow-2xl border border-[#c49a45]/40 flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="flex-1 w-full flex items-center gap-3 px-3 sm:px-4 py-2 border-b sm:border-b-0 sm:border-r border-slate-200">
              <House className="text-[#c49a45] shrink-0" size={18} />
              <div className="flex flex-col w-full">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c49a45]">หมวดหมู่บริการ</span>
                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full bg-transparent text-xs font-bold text-[#1f2925] focus:outline-none cursor-pointer"
                >
                  <option value="hotels">{copy("โฮมสเตย์ & บ้านพักนิเวศ", "Eco Homestays & Stays")}</option>
                  <option value="wellness">{copy("สปา & กิจกรรมดูแลสุขภาพ", "Wellness & Thai Spa")}</option>
                  <option value="foods">{copy("อาหารพื้นถิ่นออร์แกนิก", "Organic Local Food")}</option>
                  <option value="otop">{copy("สินค้า OTOP & หัตถกรรม", "Local Craft & OTOP")}</option>
                </select>
              </div>
            </div>

            <div className="flex-[2] w-full flex items-center gap-3 px-3 sm:px-4 py-2">
              <Search className="text-slate-400 shrink-0" size={18} />
              <div className="flex flex-col w-full">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c49a45]">ค้นหาตามใจคุณ</span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={copy("พิมพ์ชื่อที่พัก, อำเภอ หรือเมนู...", "Search homestay, district, or dish...")}
                  className="w-full bg-transparent text-xs text-[#1f2925] placeholder-slate-400 font-medium focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-[1.5rem] bg-[#1f2925] hover:bg-[#2b3832] text-[#faf9f6] text-xs font-bold tracking-wider inline-flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <span>{copy("ค้นหาบริการ", "Search Stays")}</span>
              <ArrowRight size={16} className="text-[#c49a45]" />
            </button>
          </form>
        </div>
      </section>

      {/* 3. Category Chips Explorer Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-10 -mt-4 sm:-mt-6 relative z-30">
        <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-lg border border-slate-200/80 space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {categoryChips.slice(0, 4).map((chip) => {
              const Icon = chip.icon;
              return (
                <Link
                  key={chip.id}
                  href={`/${chip.id}`}
                  className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-[#faf9f6] hover:bg-slate-100 transition-all border border-slate-200/60 group"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#1f2925]/5 text-[#c49a45] group-hover:bg-[#1f2925] group-hover:text-[#faf9f6] flex items-center justify-center shrink-0 transition-colors">
                    <Icon size={16} />
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-[#1f2925] group-hover:text-[#c49a45] transition-colors truncate">
                      {chip.label}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">{chip.count}</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* 5th Item: Featured AI Health Curator Banner */}
          <Link
            href="/health"
            className="flex items-center justify-between p-3 px-4 rounded-2xl bg-[#1f2925] text-[#faf9f6] hover:bg-[#2b3832] transition-all shadow-sm group border border-[#c49a45]/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#c49a45]/20 text-[#c49a45] flex items-center justify-center shrink-0">
                <Leaf size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#faf9f6] group-hover:text-[#c49a45] transition-colors">
                  {copy("ประเมินสุขภาพ AI Curator", "AI Health & Wellness Curator")}
                </h4>
                <p className="text-[10px] text-slate-300">
                  {copy("รับคำแนะนำที่พักและกิจกรรมที่เหมาะกับสุขภาพของคุณ", "Get personalized stay and activity recommendations")}
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-[#c49a45] shrink-0" />
          </Link>
        </div>
      </section>

      {/* 4. Curated Showcase: Popular Stays & Experiences Grid */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold tracking-widest text-[#c49a45] uppercase">CURATED SELECTION</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#1f2925]">
              {copy("ประสบการณ์และที่พักในระบบ", "Featured Stays & Experiences")}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              {copy("คัดสรรพิเศษเพื่อสุขภาพกายและใจ การันตีความอบอุ่นโดยชุมชน", "Handpicked eco stays and wellness packages verified by community hosts.")}
            </p>
          </div>
          <Link
            href="/hotels"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1f2925] text-[#faf9f6] text-xs font-bold hover:bg-[#2b3832] transition"
          >
            <span>{copy("ดูทั้งหมดในระบบ", "View All Catalog")}</span>
            <ArrowUpRight size={16} className="text-[#c49a45]" />
          </Link>
        </div>

        {/* 4-Card Luxury Destination Grid or Empty State */}
        {featuredExperiences.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
            <h3 className="font-semibold text-base text-[#1f2925]">{copy("ยังไม่มีรายการในขณะนี้", "No items found")}</h3>
            <p className="text-xs text-slate-500">{copy("ผู้ประกอบการชุมชนกำลังทยอยเพิ่มที่พักและบริการเข้าระบบ", "Local hosts are updating their listings.")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredExperiences.map((item) => (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-xl hover:border-[#c49a45]/50 group flex flex-col justify-between"
              >
                <div>
                  <div className="relative overflow-hidden rounded-2xl mb-3 aspect-[4/3]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Top Badge */}
                    <span className="absolute top-3 left-3 bg-[#1f2925]/90 text-[#c49a45] text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md border border-[#c49a45]/30">
                      {item.badge}
                    </span>
                    {/* Wishlist Button */}
                    <button className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 text-slate-600 hover:text-red-500 flex items-center justify-center backdrop-blur-md transition-colors">
                      <Heart size={15} />
                    </button>
                    {/* Price Tag Overlay */}
                    <div className="absolute bottom-3 left-3 bg-[#1f2925]/90 text-white px-3 py-1.5 rounded-xl backdrop-blur-md flex items-baseline gap-1">
                      <span className="text-sm font-bold text-[#c49a45]">{item.price}</span>
                      <span className="text-[10px] text-slate-300">{item.period}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 p-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-[#c49a45]">{item.category}</span>
                      <span className="flex items-center gap-1 font-bold text-[#1f2925]">
                        <Star size={13} className="text-[#c49a45] fill-[#c49a45]" />
                        {item.rating}
                      </span>
                    </div>

                    <h3 className="font-semibold text-base text-[#1f2925] group-hover:text-[#c49a45] transition-colors line-clamp-1">
                      {item.title}
                    </h3>

                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin size={13} className="text-[#c49a45]" />
                      {item.location}
                    </p>
                  </div>
                </div>

                <Link
                  href={item.href}
                  className="mt-4 inline-flex items-center justify-between w-full min-h-[44px] px-4 rounded-xl bg-[#faf9f6] text-[#1f2925] font-semibold text-xs hover:bg-[#1f2925] hover:text-[#faf9f6] transition-all border border-slate-200/60"
                >
                  <span>{copy("ดูรายละเอียด", "Explore Stay")}</span>
                  <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* 5. AI Wellness Curator Banner */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-12">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-[#2b3832] to-[#1f2925] text-[#faf9f6] p-8 sm:p-10 border border-[#c49a45]/30 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-[#c49a45] text-xs font-bold">
                <Sparkles size={16} />
                <span className="uppercase tracking-widest">AI WELLNESS TRIP CURATOR</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold">
                {copy("ให้ AI ช่วยวางแผนทริปที่เหมาะกับสุขภาพของคุณ", "Let AI Personalize Your Sisaket Break")}
              </h3>
            </div>
            <Link
              href="/health"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-[#c49a45] text-[#1f2925] text-xs font-bold hover:bg-[#a88034] transition shrink-0"
            >
              <span>{copy("เริ่มประเมินสุขภาพฟรี", "Start AI Assessment")}</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>

          {/* Goal selection chips */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="text-xs text-slate-300 font-medium">{copy("เลือกเป้าหมายของคุณ:", "Select Goal:")}</span>
            {wellnessGoals.map((g) => (
              <Link
                key={g.id}
                href={g.target}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-[#c49a45] hover:text-[#1f2925] text-xs font-semibold text-[#faf9f6] transition-all border border-white/15"
              >
                {g.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Why Choose Us & Real Live System Totals (Full Width Edge-to-Edge) */}
      <section className="w-full bg-[#1f2925] text-[#faf9f6] py-16 px-6 sm:px-12 my-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold tracking-widest text-[#c49a45] uppercase">WHY WELLTRIP SISAKET</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#faf9f6]">
              {copy("เที่ยวแบบชะลอวัย อุ่นใจในทุกขั้นตอน", "Why Plan Your Slow Break With Us")}
            </h2>
            <p className="text-xs sm:text-sm text-[#faf9f6]/90 leading-relaxed font-normal">
              {copy(
                "เราคัดสรรโฮมสเตย์และบริการสุขภาพที่ผ่านการรับรองโดยชุมชน ปลอดสารเคมี และกระจายรายได้สู่ผู้ประกอบการท้องถิ่นโดยตรง",
                "We partner with verified local community hosts committed to organic living and warm hospitality."
              )}
            </p>
          </div>

          {/* Real Live Database Totals */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center border-y border-[#faf9f6]/15 py-8">
            {stats.map((s, idx) => (
              <div key={idx} className="space-y-1">
                <div className="font-serif text-3xl sm:text-4xl font-bold text-[#c49a45]">{s.value}</div>
                <div className="text-xs text-[#faf9f6]/80">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Newsletter & Community Join Banner */}
      <section className="max-w-5xl mx-auto px-6 sm:px-10 py-12">
        <div className="rounded-3xl bg-[#faf9f6] border border-slate-200 p-8 text-center space-y-4 shadow-sm">
          <span className="text-xs font-bold tracking-widest text-[#c49a45] uppercase">STAY CONNECTED</span>
          <h3 className="font-serif text-2xl font-bold text-[#1f2925]">
            {copy("รับข่าวสารสิทธิพิเศษและทริปสุขภาพศรีสะเกษ", "Join Our Eco-Tourism Newsletter")}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {copy("ลงทะเบียนเพื่อรับสิทธิส่วนลดพิเศษ แพ็กเกจโฮมสเตย์ประจำฤดูกาล และคำแนะนำสุขภาพฟรี", "Subscribe to get exclusive seasonal discounts and wellness travel tips.")}
          </p>
          <div className="flex max-w-md mx-auto gap-2 pt-2">
            <input
              type="email"
              placeholder={copy("กรอกอีเมลของคุณ...", "Enter your email...")}
              className="flex-1 px-4 py-3 rounded-full border border-slate-300 text-xs text-[#1f2925] focus:outline-none focus:border-[#1f2925]"
            />
            <button className="px-6 py-3 rounded-full bg-[#1f2925] text-[#faf9f6] text-xs font-bold hover:bg-[#2b3832] transition">
              {copy("สมัครรับข่าวสาร", "Subscribe")}
            </button>
          </div>
        </div>
      </section>
    </TravelShell>
  );
}
