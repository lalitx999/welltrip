"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Flower2,
  House,
  Leaf,
  MapPin,
  Newspaper,
  Package,
  Search,
  ShoppingBag,
  Sprout,
  Users,
  Utensils,
  Sparkles,
  Heart,
  Landmark,
  Trees,
  HelpCircle,
  BookOpen,
} from "lucide-react";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { useTravelCopy } from "@/components/travel/travel-shell";
import styles from "@/components/travel/travel.module.css";
import { useAuth } from "@/hooks/use-auth";
import { getAccommodations, getOTOPProducts, getFoods, getWellnessServices } from "@/lib/api/catalog";
import { extractErrorMessage } from "@/lib/api/errors";
import { formatBaht } from "@/lib/format";
import { displayImage } from "@/lib/images";
import { SISAKET_ATTRACTIONS, SISAKET_OTOP_VILLAGES, SISAKET_FEATURED_PRODUCTS } from "@/lib/sisaket-tourism-data";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const copy = useTravelCopy();
  const router = useRouter();
  const { user } = useAuth();
  const [destination, setDestination] = useState("/hotels");
  const [activeAttractionCat, setActiveAttractionCat] = useState<"ALL" | "NATURAL" | "CULTURAL" | "HISTORICAL">("ALL");

  // Dynamic API Queries for Database Entities (Strictly fetched from DB)
  const staysQuery = useQuery({
    queryKey: ["home-recommended-stays"],
    queryFn: () => getAccommodations({ page: 1, limit: 4 }),
  });

  const otopQuery = useQuery({
    queryKey: ["home-otop-products"],
    queryFn: () => getOTOPProducts({ page: 1, limit: 4 }),
  });

  const foodsQuery = useQuery({
    queryKey: ["home-foods-menu"],
    queryFn: () => getFoods({ page: 1, limit: 4 }),
  });

  const wellnessQuery = useQuery({
    queryKey: ["home-wellness-services"],
    queryFn: () => getWellnessServices({ page: 1, limit: 4 }),
  });

  const stays = staysQuery.data?.data ?? [];
  const otopProducts = otopQuery.data?.data ?? [];
  const foodMenus = foodsQuery.data?.data ?? [];
  const wellnessServices = wellnessQuery.data?.data ?? [];

  const categories = [
    { href: "/hotels", label: copy("พักสบาย", "Stay a little"), detail: copy("โฮมสเตย์เรือนไม้ & สวนผลไม้", "Stays & homestays"), icon: House },
    { href: "/foods", label: copy("อร่อยพื้นถิ่น", "Taste local"), detail: copy("อาหารสุขภาพ & ปลาน้ำมูล", "Community dining"), icon: Utensils },
    { href: "/wellness", label: copy("เติมความสดชื่น", "Feel refreshed"), detail: copy("สปาสมุนไพร & อบไอน้ำ", "Wellness & spa"), icon: Flower2 },
    { href: "/otop", label: copy("พาของดีกลับบ้าน", "Bring a story home"), detail: copy("เสื้อยืด & กาแฟภูเขาไฟ", "Local crafts & goods"), icon: ShoppingBag },
  ];

  const filteredAttractions = SISAKET_ATTRACTIONS.filter((att) => {
    if (activeAttractionCat === "ALL") return true;
    return att.category === activeAttractionCat;
  }).slice(0, 6);

  function explore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(destination);
  }

  return (
    <div className="space-y-10 pb-16">
      {/* Greeting Bar */}
      <div className={styles.greeting}>
        <span>
          <Sprout size={16} aria-hidden="true" />
          {user?.first_name
            ? copy(`สวัสดี คุณ${user.first_name} ยินดีต้อนรับสู่ศรีสะเกษ`, `Hello, ${user.first_name}. Welcome to Sisaket!`)
            : copy("วันดี ๆ เริ่มต้นจากการออกเดินทางสัมผัสศรีสะเกษ", "A good day begins with a gentle journey in Sisaket.")}
        </span>
        <span>
          <MapPin size={14} aria-hidden="true" />
          {copy("ศรีสะเกษ เมืองแห่งโอกาส · ประเทศไทย", "Sisaket · Land of Opportunity · Thailand")}
        </span>
      </div>

      {/* Hero Banner Section */}
      <section className={styles.hero} aria-labelledby="travel-home-title">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.heroImage}
          src="/images/attractions/suan-somdet-srinagarindra.jpeg"
          alt="สวนสมเด็จพระศรีนครินทร์ ศรีสะเกษ ดงต้นลำดวนธรรมชาติ 40,000 ต้น"
          width={900}
          height={1350}
          fetchPriority="high"
        />
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>
            <MapPin size={14} aria-hidden="true" /> SISAKET RESONANCE · 4 ETHNIC TRIBES
          </span>
          <h1 id="travel-home-title">
            {copy("เที่ยวให้ช้าลง", "Slow down.")}
            <br />
            {copy("สุขให้มากขึ้น ที่ศรีสะเกษ", "Find more joy in Sisaket.")}
          </h1>
          <p>
            {copy(
              "สัมผัสวิถีชีวิต 4 ชนเผ่า (เขมร ลาว ส่วย เยอ) โฮมสเตย์สวนผลไม้ ทุเรียนภูเขาไฟ GI กาแฟขุนหาญ และปราสาทขอมโบราณ 31 แห่ง",
              "Discover 4 ethnic cultures, volcano durian homestays, GI volcano coffee, and 31 Khmer historical castles."
            )}
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primary} href="#sisaket-catalog-sections">
              {copy("ค้นพบประสบการณ์", "Discover experiences")}
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <Link className={styles.secondary} href="/community">
              {copy("13 หมู่บ้าน OTOP นวัตวิถี", "13 OTOP Villages")}
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Interactive Search & Category Filter */}
      <form className={styles.discover} onSubmit={explore}>
        <div className={styles.discoverIntro}>
          <Compass size={25} aria-hidden="true" />
          <div>
            <strong>{copy("ทริปศรีสะเกษนี้ อยากทำอะไร?", "What brings you to Sisaket?")}</strong>
            <small>{copy("เลือกประสบการณ์สุขภาพและวิถีชุมชนที่ใช่สำหรับคุณ", "Find your kind of Sisaket experience")}</small>
          </div>
        </div>
        <label htmlFor="travel-category">
          {copy("เลือกหมวดหมู่ที่สนใจ", "Start with what you love")}
          <select
            id="travel-category"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <option value="/hotels">{copy("หาที่พัก & โฮมสเตย์ชุมชน", "Find homestays & places to stay")}</option>
            <option value="/foods">{copy("ลองอาหารสุขภาพ & ปลาแม่น้ำมูล", "Explore healthy local dining")}</option>
            <option value="/wellness">{copy("นวดสมุนไพรสด & สปาผ่อนคลาย", "Unwind with herbal spa & wellness")}</option>
            <option value="/otop">{copy("เลือกซื้อเสื้อยืด & กาแฟดินภูเขาไฟ GI", "Shop OTOP t-shirts & volcano coffee")}</option>
            <option value="/recommended">{copy("31 สถานที่ท่องเที่ยวจังหวัดศรีสะเกษ", "Explore 31 Sisaket attractions")}</option>
            <option value="/news">{copy("ปฏิทินกิจกรรม Sound of Sisaket 2026", "View Sound of Sisaket 2026 events")}</option>
          </select>
        </label>
        <button type="submit" className={styles.primary}>
          <Search size={17} aria-hidden="true" />
          {copy("ออกสำรวจ", "Explore")}
        </button>
      </form>

      {/* Featured Sound of Sisaket 2026 Event Banner */}
      <section className="overflow-hidden rounded-3xl bg-forest-900 border border-gold-500/30 p-6 text-cream-50 shadow-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-300">
              <Newspaper className="h-3.5 w-3.5 text-gold-400" />
              <span>SOUND OF SISAKET 2026 · ศรีสะเกษ เมืองแห่งโอกาส</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-cream-100 sm:text-3xl">
              {copy("ปฏิทินกิจกรรมส่งท้ายปี พ.ย. - ธ.ค. 2569", "Sisaket Event Calendar Nov - Dec 2026")}
            </h2>
            <p className="text-xs text-cream-200/80 sm:text-sm leading-relaxed">
              {copy(
                "จัดเต็มทั้ง ดนตรี โปงลาง กาแฟคราฟท์ ฟุตบอลคิงส์คัพ ครั้งที่ 52 งานฉลองเมือง 244 ปี งานงิ้ว CAMP กลางเกาะ และไทบ้านแลนด์ 7.0",
                "Enjoy music, craft coffee, King's Cup 52, 244th City Celebration, and Sound of Sisaket 2026!"
              )}
            </p>
          </div>
          <Link
            href="/news"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gold-500 px-5 py-3 text-xs font-bold text-forest-950 shadow-md transition-all hover:bg-gold-400"
          >
            <span>{copy("ดูปฏิทินกิจกรรมทั้งหมด", "View All Events")}</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Category Grid Section */}
      <section className={styles.section} aria-labelledby="travel-category-title">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.eyebrow}>YOUR KIND OF GETAWAY</span>
            <h2 id="travel-category-title">{copy("ประสบการณ์ท่องเที่ยว ในแบบของคุณ", "A getaway that feels like you.")}</h2>
          </div>
        </div>
        <div className={styles.categoryGrid}>
          {categories.map(({ href, label, detail, icon: Icon }) => (
            <Link className={styles.category} href={href} key={href}>
              <Icon aria-hidden="true" />
              <span>
                <strong>{label}</strong>
                <small>{detail}</small>
              </span>
              <ArrowUpRight aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      {/* Catalog Section Anchor */}
      <div id="sisaket-catalog-sections" />

      {/* 1. Dynamic Accommodations Feed (From DB API) */}
      <section className={styles.section} aria-labelledby="travel-stays-title">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.eyebrow}>ECO HOMESTAYS & RESORTS</span>
            <h2 id="travel-stays-title">{copy("ที่พักและโฮมสเตย์ศรีสะเกษ (Accommodations)", "Places to stay in Sisaket.")}</h2>
            <p>{copy("โฮมสเตย์เรือนไม้ วิวทุ่งนา และรีสอร์ทเพื่อสุขภาพจากฐานข้อมูลชุมชน", "Explore community homestays and eco-resorts.")}</p>
          </div>
          <Link href="/hotels" className={styles.textLink}>
            {copy("ดูที่พักทั้งหมด", "All stays")}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        {staysQuery.isLoading ? (
          <ListLoading />
        ) : staysQuery.isError ? (
          <ListError
            message={extractErrorMessage(staysQuery.error)}
            onRetry={() => {
              void staysQuery.refetch();
            }}
          />
        ) : stays.length === 0 ? (
          <div className={styles.empty}>
            <House size={22} aria-hidden="true" />
            {copy("ยังไม่มีรายการที่พักให้แสดงในขณะนี้", "No stays are available to display yet.")}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stays.slice(0, 4).map((stay) => (
              <Link
                key={stay.id}
                href={`/hotels/${stay.id}`}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs transition-all hover:-translate-y-1 hover:border-gold-500/50 hover:shadow-md"
              >
                <div>
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayImage(undefined, "hotel", stay.id, 500)}
                      alt={stay.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4 space-y-1.5">
                    <h3 className="font-serif text-base font-bold text-foreground group-hover:text-forest-900 transition-colors">
                      {stay.name}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-gold-600" />
                      <span>{[stay.district, stay.province].filter(Boolean).join(", ")}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border/60 bg-cream-50/40 p-4">
                  <span className="text-xs text-muted-foreground">{copy("เริ่มต้น", "From")}</span>
                  <span className="font-serif font-bold text-forest-900 text-sm">
                    {stay.min_price_per_night !== null ? formatBaht(stay.min_price_per_night) : "฿0"} / คืน
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 2. Dynamic Sisaket OTOP Products Showcase (From DB API + Featured Items) */}
      <section className={styles.section} aria-labelledby="travel-products-title">
        <div className={styles.sectionHead}>
          <div>
            <span className={styles.eyebrow}>OFFICIAL SOUVENIRS & OTOP</span>
            <h2 id="travel-products-title">{copy("สินค้า OTOP และของดีศรีสะเกษ (Featured OTOP)", "Official Sisaket OTOP Goods.")}</h2>
            <p>{copy("เสื้อยืดอัตลักษณ์ศรีสะเกษ กาแฟโรบัสต้าดินภูเขาไฟ GI และสินค้าหัตถกรรมชุมชน", "Discover local crafts, t-shirts, and GI volcano coffee.")}</p>
          </div>
          <Link href="/otop" className={styles.textLink}>
            {copy("ดูสินค้า OTOP ทั้งหมด", "All products")}
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {/* Featured Sisaket T-shirt & Coffee Highlight Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {SISAKET_FEATURED_PRODUCTS.map((prod) => (
            <div
              key={prod.id}
              className="flex flex-col justify-between overflow-hidden rounded-2xl border border-gold-500/30 bg-card p-5 shadow-xs transition-all hover:border-gold-500/50 hover:shadow-md space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="rounded-full bg-forest-900 px-2.5 py-0.5 text-[10px] font-bold text-cream-100">
                    RECOMMENDED SOUVENIR
                  </span>
                  <h3 className="font-serif text-base font-bold text-foreground">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {prod.description}
                  </p>
                </div>
                <div className="relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={prod.images[0].url} alt={prod.name} className="h-full w-full object-cover" />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/60 pt-3">
                <span className="font-serif font-bold text-forest-900 text-sm">
                  {prod.priceText}
                </span>
                <Link href="/otop">
                  <Button size="sm" className="rounded-xl text-xs font-bold bg-forest-900 text-cream-100 hover:bg-forest-800">
                    <span>ดูรายละเอียดสินค้า</span>
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Database OTOP Products Grid */}
        {otopQuery.isLoading ? (
          <ListLoading />
        ) : otopQuery.isError ? (
          <ListError
            message={extractErrorMessage(otopQuery.error)}
            onRetry={() => {
              void otopQuery.refetch();
            }}
          />
        ) : otopProducts.length === 0 ? null : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {otopProducts.slice(0, 4).map((product) => (
              <Link key={product.id} href="/otop" className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-4 shadow-xs transition-all hover:border-gold-500/40">
                <div className="space-y-2">
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-cream-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayImage(undefined, "otop", product.id, 500)}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-serif text-sm font-bold text-foreground group-hover:text-forest-900 transition-colors">
                    {product.name}
                  </h3>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                  <span className="font-serif font-bold text-forest-900 text-sm">
                    {formatBaht(product.price)}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    {product.stock_quantity > 0 ? "พร้อมส่ง" : "สินค้าหมด"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 3. 31 Sisaket Tourism Attractions Spotlight (Categorized) */}
      <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-800 flex items-center gap-1.5">
              <Trees className="h-4 w-4 text-gold-600" />
              <span>31 แหล่งท่องเที่ยวอย่างเป็นทางการ</span>
            </span>
            <h2 className="font-serif text-2xl font-bold text-foreground mt-1">
              จุดหมายปลายทางยอดนิยม จังหวัดศรีสะเกษ
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeAttractionCat === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveAttractionCat("ALL")}
              className="rounded-xl text-xs"
            >
              ทั้งหมด (31)
            </Button>
            <Button
              variant={activeAttractionCat === "NATURAL" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveAttractionCat("NATURAL")}
              className="rounded-xl text-xs"
            >
              ธรรมชาติ (13)
            </Button>
            <Button
              variant={activeAttractionCat === "CULTURAL" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveAttractionCat("CULTURAL")}
              className="rounded-xl text-xs"
            >
              วัด & วัฒนธรรม (9)
            </Button>
            <Button
              variant={activeAttractionCat === "HISTORICAL" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveAttractionCat("HISTORICAL")}
              className="rounded-xl text-xs"
            >
              ปราสาทโบราณ (9)
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAttractions.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-cream-50/40 p-4 shadow-xs transition-all hover:border-gold-500/40 hover:bg-card"
            >
              <div className="space-y-3">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-cream-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-2 left-2 rounded-full bg-forest-900/90 px-2 py-0.5 text-[10px] font-bold text-cream-100">
                    {item.district}
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-foreground">
                    {item.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-forest-800">
                  {item.categoryLabel}
                </span>
                <Link href="/recommended">
                  <Button size="sm" variant="ghost" className="h-7 text-xs font-semibold text-forest-900 hover:text-gold-700 p-0">
                    <span>ดูเพิ่มเติม</span>
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-2">
          <Link href="/recommended">
            <Button variant="outline" className="rounded-xl text-xs font-bold border-gold-500/40 text-forest-900 hover:bg-gold-500/10">
              <Compass className="mr-1.5 h-4 w-4 text-gold-600" />
              <span>ชมสถานที่ท่องเที่ยวศรีสะเกษทั้งหมด 31 แห่ง</span>
            </Button>
          </Link>
        </div>
      </section>

      {/* 4. AEO (Answer Engine Optimization) & Factual Knowledge Base Section */}
      <section className="rounded-3xl border border-border/80 bg-gradient-to-br from-cream-50 via-card to-cream-100 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-border/60 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800 flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-gold-600" />
            <span>รอบรู้เรื่องศรีสะเกษ (Sisaket Tourism FAQ & Knowledge)</span>
          </span>
          <h2 className="font-serif text-2xl font-bold text-foreground mt-0.5">
            ข้อมูลน่ารู้ก่อนเดินทางท่องเที่ยวศรีสะเกษ
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-2">
            <h3 className="font-serif text-base font-bold text-forest-900 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-gold-600 shrink-0" />
              <span>ดินแดน 4 ชนเผ่ามรดกขอม</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              ศรีสะเกษผสานวัฒนธรรมชนเผ่าพื้นเมือง 4 ชนเผ่า ได้แก่ เขมร ลาว ส่วย (กูย) และเยอ มีภาษา ผ้าทอมือย้อมคราม และปราสาทขอมโบราณ 31 แห่งทั่วจังหวัด
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-2">
            <h3 className="font-serif text-base font-bold text-forest-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold-600 shrink-0" />
              <span>ผลผลิตเกษตรดินภูเขาไฟ GI</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              ปลูกบนผืนดินภูเขาไฟอุดมด้วยแร่ธาตุธรรมชาติ มีทุเรียนภูเขาไฟ GI เนื้อนุ่ม กาแฟโรบัสต้าขุนหาญ 500g หอมเข้ม และหอมแดงกระเทียม GI คุณภาพสูง
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-5 space-y-2">
            <h3 className="font-serif text-base font-bold text-forest-900 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-gold-600 shrink-0" />
              <span>Sound of Sisaket 2026</span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              มหกรรมเทศกาลดนตรี กาแฟ แคมป์ปิ้ง การประกวด และงานฉลองเมือง 244 ปี ส่งท้ายปี พฤศจิกายน - ธันวาคม 2569 จัดโดยหอการค้าจังหวัดศรีสะเกษ
            </p>
          </div>
        </div>
      </section>

      {/* Health Assessment & Community Stories Section */}
      <section className={styles.assessment} aria-labelledby="travel-assessment-title">
        <Leaf aria-hidden="true" />
        <div>
          <span className={styles.eyebrow}>A LITTLE MORE YOU</span>
          <h2 id="travel-assessment-title">{copy("ยังไม่รู้จะเริ่มตรงไหน? เริ่มจากตัวคุณ", "Not sure where to start? Start with you.")}</h2>
          <p>{copy("บอกเป้าหมายการพักผ่อนของคุณ เพื่อประกอบการแนะนำทริปศรีสะเกษ", "Share your wellness goals to help guide your Sisaket trip.")}</p>
        </div>
        <Link href="/health" className={styles.primary}>
          {copy("เริ่มประเมินสุขภาพ", "Start an assessment")}
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </section>

      {/* Community Links Grid */}
      <section className={`${styles.section} ${styles.stories}`} aria-label={copy("เรื่องราวและชุมชน", "Stories and communities")}>
        <Link className={styles.story} href="/community">
          <Users aria-hidden="true" />
          <div>
            <h3>{copy("13 หมู่บ้าน OTOP นวัตวิถี", "13 OTOP Nawatwithi Villages.")}</h3>
            <p>{copy("รู้จักผู้นำชุมชนและกิจกรรมท่องเที่ยว", "Meet our community hosts and local activities")}</p>
          </div>
          <ArrowUpRight aria-hidden="true" />
        </Link>
        <Link className={styles.story} href="/news">
          <Newspaper aria-hidden="true" />
          <div>
            <h3>{copy("เรื่องราวใหม่ ระหว่างทาง", "Something new along the way.")}</h3>
            <p>{copy("ติดตามข่าวปฏิทินกิจกรรมศรีสะเกษ", "Explore Sisaket event calendar")}</p>
          </div>
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
