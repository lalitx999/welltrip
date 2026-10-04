"use client";

import Link from "next/link";
import { ArrowUpRight, Flower2, Heart, House, Leaf, MapPin, ShoppingBag, Utensils } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { NaturePhoto, SisaketFooter, SisaketHeader, useSisaketCopy } from "@/components/sisaket/sisaket-shell";
import styles from "@/components/sisaket/sisaket.module.css";

export default function LandingPage() {
  const { status } = useAuth();
  const copy = useSisaketCopy();
  const authenticated = status === "authenticated";
  const categories = [
    { href: "/hotels", icon: House, title: copy("ที่พักชุมชน", "Community stays"), description: copy("ตื่นมาเจอความสงบ พักผ่อนในจังหวะที่ช้าลง", "Wake up to peaceful surroundings and a slower pace.") },
    { href: "/foods", icon: Utensils, title: copy("อาหารพื้นถิ่น", "Local flavours"), description: copy("รู้จักเมืองผ่านรสชาติ และวัตถุดิบใกล้ตัว", "Discover the community through local food and ingredients.") },
    { href: "/wellness", icon: Flower2, title: copy("เวลาพักใจ", "Wellness moments"), description: copy("เติมความสดชื่น ดูแลกายและใจไปด้วยกัน", "Make room to recharge your body and mind.") },
    { href: "/otop", icon: ShoppingBag, title: copy("ของดีชุมชน", "Local treasures"), description: copy("พาเรื่องราวกลับบ้าน ผ่านงานฝีมือท้องถิ่น", "Bring a story home through locally made crafts.") },
  ];
  return <div className={styles.shell}>
    <SisaketHeader authenticated={authenticated} />
    <main>
      <section className={styles.hero}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}><MapPin size={15} aria-hidden="true" />{copy("ศรีสะเกษ · SISAKET", "SISAKET · THAILAND")}</p>
          <h1>{copy("ออกไปพักใจ", "Take a little break.")}<br />{copy("ให้ธรรมชาติ", "Let nature")}<br />{copy("ดูแลคุณ", "take care of you.")}</h1>
          <p className={styles.intro}>{copy("ค่อย ๆ เที่ยว ค่อย ๆ รู้จักศรีสะเกษ\nผ่านที่พักอบอุ่น อาหารพื้นถิ่น และเรื่องราวของผู้คน", "Slow down and discover Sisaket through welcoming stays, local flavours and the stories of its people.")}</p>
          <div className={styles.actions}><a href="#explore" className={styles.primary}>{copy("เริ่มสำรวจศรีสะเกษ", "Explore Sisaket")}<ArrowUpRight size={18} aria-hidden="true" /></a><Link href="/home" className={styles.secondary}>{authenticated ? copy("ไปต่อกับทริปของคุณ", "Continue your journey") : copy("เริ่มต้นทริปของคุณ", "Start your journey")}</Link></div>
          <p className={styles.note}>{copy("ทริปเล็ก ๆ ที่ดีต่อใจ และใกล้ชิดชุมชน", "Small journeys. Meaningful moments. Closer communities.")}</p>
        </div>
        <NaturePhoto arch title={copy("วันธรรมดา ที่พิเศษกว่าเดิม", "An ordinary day, a little more special.")} subtitle="A LITTLE CLOSER TO NATURE" />
      </section>
      <div className={styles.band}><span><Leaf aria-hidden="true" />{copy("พักใกล้ธรรมชาติ", "Stay close to nature")}</span><span><Utensils aria-hidden="true" />{copy("ลิ้มรสท้องถิ่น", "Taste local flavours")}</span><span><Heart aria-hidden="true" />{copy("เชื่อมถึงชุมชน", "Connect with communities")}</span></div>
      <section id="explore" className={styles.explore}><p className={styles.eyebrow}>FIND YOUR SLOW MOMENT</p><h2>{copy("ความสุขระหว่างทาง เลือกได้ในแบบคุณ", "Find your own kind of happiness along the way.")}</h2><div className={styles.grid}>{categories.map(({href, icon: Icon, title, description}) => <Link key={href} href={href} className={styles.category}><Icon aria-hidden="true" /><h3>{title}<ArrowUpRight size={17} aria-hidden="true" /></h3><p>{description}</p></Link>)}</div></section>
    </main><SisaketFooter />
  </div>;
}
