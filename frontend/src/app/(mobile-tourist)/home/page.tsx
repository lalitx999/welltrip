"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, Compass, Flower2, House, Leaf, MapPin, Newspaper, Package, Search, ShoppingBag, Sprout, Users, Utensils } from "lucide-react";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { useTravelCopy } from "@/components/travel/travel-shell";
import styles from "@/components/travel/travel.module.css";
import { useAuth } from "@/hooks/use-auth";
import { getAccommodations, getOTOPProducts } from "@/lib/api/catalog";
import { extractErrorMessage } from "@/lib/api/errors";
import { formatBaht } from "@/lib/format";

export default function HomePage() {
  const copy = useTravelCopy();
  const router = useRouter();
  const { user } = useAuth();
  const [destination, setDestination] = useState("/hotels");
  const staysQuery = useQuery({
    queryKey: ["home-recommended"],
    queryFn: () => getAccommodations({ page: 1, limit: 4 }),
  });
  const otopQuery = useQuery({
    queryKey: ["home-otop"],
    queryFn: () => getOTOPProducts({ page: 1, limit: 5 }),
  });
  const stays = staysQuery.data?.data ?? [];
  const products = otopQuery.data?.data ?? [];
  const categories = [
    { href: "/hotels", label: copy("พักสบาย", "Stay a little"), detail: copy("ที่พักและโฮมสเตย์", "Stays & homestays"), icon: House },
    { href: "/foods", label: copy("อร่อยพื้นถิ่น", "Taste local"), detail: copy("อาหารจากชุมชน", "Community dining"), icon: Utensils },
    { href: "/wellness", label: copy("เติมความสดชื่น", "Feel refreshed"), detail: copy("นวดและกิจกรรม", "Wellness & activities"), icon: Flower2 },
    { href: "/otop", label: copy("พาของดีกลับบ้าน", "Bring a story home"), detail: copy("สินค้า OTOP", "Local crafts & goods"), icon: ShoppingBag },
  ];
  function explore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Navigate to existing, working category filters rather than a pretend global search.
    router.push(destination);
  }
  return <>
    <div className={styles.greeting}><span><Sprout size={16} aria-hidden="true" />{user?.first_name ? copy(`สวัสดี คุณ${user.first_name} วันนี้อยากไปที่ไหน`, `Hello, ${user.first_name}. Where will today take you?`) : copy("วันดี ๆ เริ่มต้นจากการออกเดินทาง", "A good day begins with a little adventure.")}</span><span><MapPin size={14} aria-hidden="true" />{copy("ศรีสะเกษ · ประเทศไทย", "Sisaket · Thailand")}</span></div>

    <section className={styles.hero} aria-labelledby="travel-home-title">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={styles.heroImage} src="/images/sisaket-nature-concept.webp" alt="" width={900} height={1350} fetchPriority="high" />
      <div className={styles.heroCopy}>
        <span className={styles.eyebrow}><MapPin size={14} aria-hidden="true" /> A SLOWER SIDE OF SISAKET</span>
        <h1 id="travel-home-title">{copy("เที่ยวให้ช้าลง", "Slow down.")}<br />{copy("สุขให้มากขึ้น", "Find a little more joy.")}</h1>
        <p>{copy("พักใกล้ธรรมชาติ กินอร่อยแบบท้องถิ่น\nแล้วปล่อยให้ศรีสะเกษเล่าเรื่องราวระหว่างทาง", "Stay close to nature, taste something local,\nand let Sisaket share its stories along the way.")}</p>
        <div className={styles.heroActions}><a className={styles.primary} href="#travel-experiences">{copy("ค้นพบประสบการณ์", "Discover experiences")}<ArrowUpRight size={17} aria-hidden="true" /></a><Link className={styles.secondary} href="/community">{copy("รู้จักชุมชนของเรา", "Meet the community")}</Link></div>
      </div>
      <small className={styles.photoCredit}>{copy("ภาพบรรยากาศสร้างด้วย AI · แรงบันดาลใจจากชนบทอีสาน", "AI-created atmosphere · Inspired by rural Isan")}</small>
    </section>

    <form className={styles.discover} onSubmit={explore}>
      <div className={styles.discoverIntro}><Compass size={25} aria-hidden="true" /><div><strong>{copy("ทริปนี้ อยากทำอะไร", "What brings you here?")}</strong><small>{copy("เลือกความสุขในแบบคุณ", "Find your kind of day")}</small></div></div>
      <label htmlFor="travel-category">{copy("เริ่มจากสิ่งที่คุณสนใจ", "Start with what you love")}<select id="travel-category" value={destination} onChange={e => setDestination(e.target.value)}><option value="/hotels">{copy("หาที่พักใกล้ธรรมชาติ", "Find a place to stay")}</option><option value="/foods">{copy("ลองอาหารสุขภาพพื้นถิ่น", "Explore local dining")}</option><option value="/wellness">{copy("นวดผ่อนคลายและกิจกรรม", "Unwind with wellness & activities")}</option><option value="/otop">{copy("เลือกซื้อของดีชุมชน", "Shop local treasures")}</option><option value="/recommended">{copy("หาแรงบันดาลใจสำหรับทริป", "Find trip inspiration")}</option></select></label>
      <button type="submit" className={styles.primary}><Search size={17} aria-hidden="true" />{copy("ออกสำรวจ", "Explore")}</button>
    </form>

    {/* Featured Sound of Sisaket 2026 Event Calendar Banner */}
    <section className="my-6 overflow-hidden rounded-3xl bg-forest-900 border border-gold-500/30 p-6 text-cream-50 shadow-lg">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-300">
            <Newspaper className="h-3.5 w-3.5 text-gold-400" />
            <span>FEATURED SISAKET EVENTS 2026</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-cream-100 sm:text-3xl">
            {copy("ปฏิทินกิจกรรมศรีสะเกษ พ.ย. - ธ.ค. 2569", "Sisaket Event Calendar Nov - Dec 2026")}
          </h2>
          <p className="text-xs text-cream-200/80 sm:text-sm leading-relaxed">
            {copy("จัดเต็มทั้ง ดนตรี กาแฟ กีฬา การประกวด แคมป์ งานงิ้ว ไทบ้านแลนด์ และ Sound of Sisaket 2026 มาเจอกันที่ศรีสะเกษ เมืองแห่งโอกาส", "Enjoy music, coffee, sports, camping, and Sound of Sisaket 2026 in Sisaket!")}
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

    <section className={styles.section} aria-labelledby="travel-category-title">
      <div className={styles.sectionHead}><div><span className={styles.eyebrow}>YOUR KIND OF GETAWAY</span><h2 id="travel-category-title">{copy("วันพักผ่อน ในแบบของคุณ", "A getaway that feels like you.")}</h2></div></div>
      <div className={styles.categoryGrid}>{categories.map(({href,label,detail,icon:Icon}) => <Link className={styles.category} href={href} key={href}><Icon aria-hidden="true" /><span><strong>{label}</strong><small>{detail}</small></span><ArrowUpRight aria-hidden="true" /></Link>)}</div>
    </section>

    <section className={styles.section} aria-labelledby="travel-stays-title">
      <div className={styles.sectionHead}><div><span className={styles.eyebrow}>STAY A LITTLE LONGER</span><h2 id="travel-stays-title">{copy("หาที่พัก แล้วค่อย ๆ รู้จักกัน", "Stay awhile. Feel a little closer.")}</h2><p>{copy("เลือกที่พักจากรายการในชุมชน แล้วดูห้องและวันที่เหมาะกับทริป", "Browse community stays, then find the room and dates that suit your trip.")}</p></div><Link href="/hotels" className={styles.textLink}>{copy("ดูที่พักทั้งหมด", "All stays")}<ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      {staysQuery.isLoading ? <ListLoading /> : staysQuery.isError ? <ListError message={extractErrorMessage(staysQuery.error)} onRetry={() => { void staysQuery.refetch(); }} /> : stays.length === 0 ? <div className={styles.empty}><House size={22} aria-hidden="true" />{copy("ยังไม่มีรายการที่พักให้แสดงในขณะนี้", "No stays are available to display yet.")}</div> : <div className={styles.listingGrid}>{stays.slice(0,4).map(stay => <Link href={`/hotels/${stay.id}`} key={stay.id} className={styles.listing}>
        {/* The list API has no photo field. Do not pass off an unrelated photo as this property. */}
        <div className={styles.listingVisual}><House aria-hidden="true" /><small>{copy("ดูรายละเอียดที่พัก", "Explore this stay")}</small></div>
        <h3>{stay.name}</h3><p><MapPin size={13} aria-hidden="true" />{[stay.district,stay.province].filter(Boolean).join(", ") || copy("ดูทำเลในรายละเอียด", "See location details")}</p><div className={styles.price}>{stay.min_price_per_night !== null ? <><small>{copy("เริ่ม", "From")}</small><strong>{formatBaht(stay.min_price_per_night)}</strong><small>{copy("/ คืน", "/ night")}</small></> : <span>{copy("ดูห้องที่เปิดให้จอง", "View available rooms")}</span>}</div>
      </Link>)}</div>}
    </section>

    <section className={styles.section} id="travel-experiences" aria-labelledby="travel-experiences-title">
      <div className={styles.sectionHead}><div><span className={styles.eyebrow}>LESS RUSH. MORE MOMENTS.</span><h2 id="travel-experiences-title">{copy("ความทรงจำดี ๆ อยู่ระหว่างทาง", "The little moments make the journey.")}</h2></div><Link href="/recommended" className={styles.textLink}>{copy("หาไอเดียเที่ยว", "Find inspiration")}<ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      <div className={styles.editorialGrid}>
        <Link className={styles.experience} href="/foods">
          {/* These images illustrate categories, not specific bookable products. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/organic_community_food.jpg" alt="" loading="lazy" width={900} height={600} />
          <div><span className={styles.eyebrow}><Utensils size={15} aria-hidden="true" /> LOCAL FLAVOURS</span><h3>{copy("รู้จักชุมชน ผ่านรสชาติ", "A taste of the community.")}</h3><p>{copy("ค้นพบเมนูและวัตถุดิบพื้นถิ่นในหมวดอาหารสุขภาพ", "Discover local flavours in our community dining collection.")}</p><span className={styles.textLink}>{copy("สำรวจอาหารสุขภาพ", "Explore local dining")}<ArrowRight size={17} aria-hidden="true" /></span></div>
        </Link>
        <Link className={styles.experience} href="/wellness">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/eco_wellness_spa.jpg" alt="" loading="lazy" width={900} height={600} />
          <div><span className={styles.eyebrow}><Flower2 size={15} aria-hidden="true" /> TIME TO UNWIND</span><h3>{copy("ให้วันนี้ เป็นวันของคุณ", "Make today a little gentler.")}</h3><p>{copy("เลือกการนวดและกิจกรรม สำหรับช่วงเวลาพักผ่อน", "Find a wellness experience for your next moment of rest.")}</p><span className={styles.textLink}>{copy("ดูนวดและกิจกรรม", "Explore wellness")}<ArrowRight size={17} aria-hidden="true" /></span></div>
        </Link>
      </div>
    </section>

    <section className={styles.assessment} aria-labelledby="travel-assessment-title"><Leaf aria-hidden="true" /><div><span className={styles.eyebrow}>A LITTLE MORE YOU</span><h2 id="travel-assessment-title">{copy("ยังไม่รู้จะเริ่มตรงไหน? เริ่มจากตัวคุณ", "Not sure where to start? Start with you.")}</h2><p>{copy("บอกเป้าหมายการพักผ่อนของคุณ เพื่อประกอบการแนะนำทริป", "Share your wellness goals to help guide your next trip.")}</p></div><Link href="/health" className={styles.primary}>{copy("เริ่มประเมินสุขภาพ", "Start an assessment")}<ArrowUpRight size={17} aria-hidden="true" /></Link></section>

    <section className={styles.section} aria-labelledby="travel-products-title"><div className={styles.sectionHead}><div><span className={styles.eyebrow}>TAKE A LITTLE STORY HOME</span><h2 id="travel-products-title">{copy("ของฝาก ที่มีเรื่องราว", "A little more than a souvenir.")}</h2><p>{copy("เลือกซื้อสินค้า OTOP และของดีจากชุมชน", "Discover OTOP products and locally made treasures.")}</p></div><Link href="/otop" className={styles.textLink}>{copy("ดูสินค้าทั้งหมด", "All products")}<ArrowUpRight size={16} aria-hidden="true" /></Link></div>
      {otopQuery.isLoading ? <ListLoading /> : otopQuery.isError ? <ListError message={extractErrorMessage(otopQuery.error)} onRetry={() => { void otopQuery.refetch(); }} /> : products.length === 0 ? <div className={styles.empty}><Package size={22} aria-hidden="true" />{copy("ยังไม่มีสินค้าให้แสดงในขณะนี้", "No products are available to display yet.")}</div> : <div className={styles.listingGrid}>{products.slice(0,4).map(product => <Link key={product.id} href="/otop" className={styles.listing}><div className={styles.listingVisual}><Package aria-hidden="true" /><small>{copy("สินค้า OTOP", "OTOP product")}</small></div><h3>{product.name}</h3><p>{product.stock_quantity > 0 ? copy("ดูสินค้าในร้านชุมชน", "Explore in our local shop") : copy("สินค้าหมดชั่วคราว", "Currently out of stock")}</p><div className={styles.price}><strong>{formatBaht(product.price)}</strong><ArrowUpRight size={16} aria-hidden="true" /></div></Link>)}</div>}
    </section>

    <section className={`${styles.section} ${styles.stories}`} aria-label={copy("เรื่องราวและชุมชน", "Stories and communities")}><Link className={styles.story} href="/community"><Users aria-hidden="true" /><div><h3>{copy("ผู้คนที่ทำให้ทริปมีความหมาย", "The people behind the journey.")}</h3><p>{copy("รู้จักชุมชนและผู้ให้บริการ", "Meet our communities and local hosts")}</p></div><ArrowUpRight aria-hidden="true" /></Link><Link className={styles.story} href="/news"><Newspaper aria-hidden="true" /><div><h3>{copy("เรื่องราวใหม่ ระหว่างทาง", "Something new along the way.")}</h3><p>{copy("ติดตามข่าวและกิจกรรมชุมชน", "Explore community stories and events")}</p></div><ArrowUpRight aria-hidden="true" /></Link></section>
  </>;
}
