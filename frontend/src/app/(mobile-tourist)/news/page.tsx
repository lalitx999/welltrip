"use client";

import React, { useState } from "react";
import {
  Calendar,
  Coffee,
  Compass,
  Flame,
  Globe,
  Heart,
  Image as ImageIcon,
  Info,
  MapPin,
  Music,
  Phone,
  Share2,
  Sparkles,
  Store,
  Trophy,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SISAKET_TRADITIONAL_FESTIVALS } from "@/lib/sisaket-tourism-data";

const SISAKET_EVENTS_2026 = [
  {
    id: "evt-1",
    dates: "6 - 7 พ.ย. 2569",
    month: "พฤศจิกายน",
    title: "การประกวดวงดนตรีพื้นบ้านโปงลาง 'ศรีศิลป์'",
    location: "สวนเฉลิมพระเกียรติฯ (เกาะห้วยน้ำคำ)",
    category: "ดนตรี & วัฒนธรรม",
    icon: Music,
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    description:
      "การประกวดวงดนตรีพื้นบ้านโปงลางระดับจังหวัดร่วมสืบสานมรดกทางวัฒนธรรมอีสาน พร้อมการแสดงศิลปวัฒนธรรมท้องถิ่นตระการตา",
  },
  {
    id: "evt-2",
    dates: "13 - 15 พ.ย. 2569",
    month: "พฤศจิกายน",
    title: "เทศกาลกาแฟและดนตรี ครั้งที่ 4 (Sisaket Coffee & Music Fest #4 'สร้างสุข')",
    location: "ลานหลังศรีสะเกษอควาเรียม • เกาะห้วยน้ำคำ",
    category: "กาแฟ & ดนตรี",
    icon: Coffee,
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
    description:
      "จิบกาแฟคราฟท์จากดอยและสวนอินทรีย์ เคล้าเสียงดนตรีอะคูสติกชิลล์ๆ ริมน้ำ สัมผัสบรรยากาศ Slow Life ชุมชนศรีสะเกษ",
  },
  {
    id: "evt-3",
    dates: "14 - 17 พ.ย. 2569",
    month: "พฤศจิกายน",
    title: "ฟุตบอลคิงส์คัพ ครั้งที่ 52",
    location: "สนามกีฬาการกีฬาแห่งประเทศไทย จังหวัดศรีสะเกษ",
    category: "กีฬา",
    icon: Trophy,
    badgeColor: "bg-blue-100 text-blue-900 border-blue-300",
    description:
      "มหกรรมแข่งขันฟุตบอลชิงถ้วยพระราชทานคิงส์คัพ ครั้งที่ 52 เชียร์ทีมชาติไทยร่วมกับแฟนบอลทั่วประเทศ ณ ศรีสะเกษ",
  },
  {
    id: "evt-4",
    dates: "18 - 22 พ.ย. 2569",
    month: "พฤศจิกายน",
    title: "งานฉลองเมือง 244 ปี ศรีสะเกษ",
    location: "สวนเฉลิมพระเกียรติฯ (เกาะห้วยน้ำคำ)",
    category: "เทศกาลประวัติศาสตร์",
    icon: Sparkles,
    badgeColor: "bg-purple-100 text-purple-900 border-purple-300",
    description:
      "เฉลิมฉลองครบรอบ 244 ปี การก่อตั้งเมืองศรีสะเกษ ชมการแสดงแสงสีเสียง ร้านค้า OTOP และการรำรำลึกบรรพบุรุษ",
  },
  {
    id: "evt-5",
    dates: "21 - 22 พ.ย. 2569",
    month: "พฤศจิกายน",
    title: "การประกวดวงดนตรีลูกทุ่งแห่งประเทศไทย ชิงถ้วยพระราชทานฯ",
    location: "สวนเฉลิมพระเกียรติฯ (เกาะห้วยน้ำคำ)",
    category: "การประกวดดนตรี",
    icon: Music,
    badgeColor: "bg-rose-100 text-rose-900 border-rose-300",
    description:
      "เฟ้นหาสุดยอดวงดนตรีลูกทุ่งเยาวชนและประชาชนจากทั่วประเทศ ชิงถ้วยพระราชทานฯ อันทรงเกียรติ",
  },
  {
    id: "evt-6",
    dates: "23 - 24 พ.ย. 2569",
    month: "พฤศจิกายน",
    title: "ประเพณีลอยกระทง ศรีสะเกษ",
    location: "สวนเฉลิมพระเกียรติฯ (เกาะห้วยน้ำคำ)",
    category: "ประเพณีไทย",
    icon: Heart,
    badgeColor: "bg-teal-100 text-teal-900 border-teal-300",
    description:
      "ร่วมสืบสานประเพณีลอยกระทงสายน้ำเกาะห้วยน้ำคำ ชมกระทงโบราณ การประกวดนางนพมาศ และกิจกรรมวัฒนธรรม",
  },
  {
    id: "evt-7",
    dates: "25 พ.ย. - 2 ธ.ค. 2569",
    month: "พฤศจิกายน-ธันวาคม",
    title: "งานงิ้วประจำปี 2569",
    location: "ศาลเจ้าปู่ตาศรีสะเกษ",
    category: "เทศกาลชุมชน",
    icon: Flame,
    badgeColor: "bg-red-100 text-red-900 border-red-300",
    description:
      "งานสมโภชศาลเจ้าปู่ตาศรีสะเกษ การแสดงงิ้วเปลี่ยนหน้า งิ้วแต้จิ๋ว มังกรทอง สตรีทฟู้ดชุมชน และความบันเทิงตลอด 8 คืน",
  },
  {
    id: "evt-8",
    dates: "12-13 & 19-20 ธ.ค. 2569",
    month: "ธันวาคม",
    title: "CAMP กลางเกาะ ศรีสะเกษ",
    location: "ลานหลังศรีสะเกษอควาเรียม • เกาะห้วยน้ำคำ",
    category: "แคมป์ปิ้ง & ไลฟ์สไตล์",
    icon: Compass,
    badgeColor: "bg-lime-100 text-lime-900 border-lime-300",
    description:
      "กิจกรรมแคมป์ปิ้งรับลมหนาวกลางเกาะห้วยน้ำคำ ฟังดนตรีอะคูสติก รอบกองไฟ ชิมอาหารดิปปิ้งและกาแฟดริป",
  },
  {
    id: "evt-9",
    dates: "16 - 19 ธ.ค. 2569",
    month: "ธันวาคม",
    title: "การประกวดวงโยธวาทิตโลก ชิงถ้วยพระราชทานฯ แห่งประเทศไทย",
    location: "สนามกีฬาการกีฬาแห่งประเทศไทย จังหวัดศรีสะเกษ",
    category: "การแข่งขันระดับโลก",
    icon: Globe,
    badgeColor: "bg-sky-100 text-[#12291e] border-sky-300",
    description:
      "การแข่งขันวงโยธวาทิตระดับนานาชาติรวมทีมชั้นนำทั่วโลก ชิงถ้วยพระราชทานฯ สร้างความยิ่งใหญ่ตระการตา",
  },
  {
    id: "evt-10",
    dates: "16 - 20 ธ.ค. 2569",
    month: "ธันวาคม",
    title: "Sound of Sisaket 2026 (อะคูสติกมิวสิกเฟสติวัล)",
    location: "ลานกิจกรรมใจกลางเมืองศรีสะเกษ",
    category: "เทศกาลดนตรีใหญ่",
    icon: Music,
    badgeColor: "bg-gold-100 text-gold-900 border-gold-300",
    description:
      "ไฮไลท์เทศกาลดนตรีส่งท้ายปี Sound of Sisaket 2026 สัมผัสบทเพลงและบรรยากาศอันอบอุ่นของเมืองศรีสะเกษ",
  },
  {
    id: "evt-11",
    dates: "19 ธ.ค. 2569",
    month: "ธันวาคม",
    title: "ไทบ้านแลนด์ 7.0 มิวสิกเฟสติวัล",
    location: "ลานกิจกรรมไทบ้านแลนด์ อบต.น้ำคำ",
    category: "เทศกาลดนตรีไทบ้าน",
    icon: Sparkles,
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
    description:
      "มหกรรมคอนเสิร์ตศิลปินไทบ้าน มิวสิกเฟสติวัลสุดมันส์ฉลองครบรอบ 7.0 ปี รวบรวมความสนุกแบบอีสานแท้ๆ",
  },
];

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "NOV" | "DEC">("ALL");

  const filteredEvents = SISAKET_EVENTS_2026.filter((evt) => {
    if (activeTab === "NOV") return evt.month.includes("พฤศจิกายน");
    if (activeTab === "DEC") return evt.month.includes("ธันวาคม");
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-8 text-cream-50 shadow-xl lg:p-12 border border-gold-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.3),transparent_65%)]" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3.5 py-1 text-xs font-semibold text-gold-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-gold-400" />
            <span>SOUND OF SISAKET 2026 · ศรีสะเกษ เมืองแห่งโอกาส</span>
          </div>

          <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-5xl text-cream-100 leading-tight">
            ปฏิทินกิจกรรม ศรีสะเกษ Sisaket Resonance 2026
          </h1>

          <p className="text-sm text-cream-200/90 sm:text-base leading-relaxed">
            ปลายปีนี้ ศรีสะเกษมีอะไรให้ไปเพียบ! ใครกำลังหากิจกรรมไว้เช็กอิน เตรียมปฏิทินให้พร้อมเลย! พฤศจิกายน–ธันวาคมนี้ จัดเต็มทั้ง ดนตรี กาแฟ กีฬา การประกวด แคมป์ งานงิ้ว ไทบ้านแลนด์ และเทศกาลสุดสนุก
          </p>

          <div className="flex flex-wrap gap-2 pt-2 text-xs font-semibold text-gold-300">
            <span className="rounded-lg bg-forest-950/60 px-2.5 py-1 border border-gold-500/30">#ศรีสะเกษเมืองแห่งโอกาส</span>
            <span className="rounded-lg bg-forest-950/60 px-2.5 py-1 border border-gold-500/30">#ปฏิทินกิจกรรมศรีสะเกษ</span>
            <span className="rounded-lg bg-forest-950/60 px-2.5 py-1 border border-gold-500/30">#เที่ยวศรีสะเกษ</span>
            <span className="rounded-lg bg-forest-950/60 px-2.5 py-1 border border-gold-500/30">#SoundOfSisaket2026</span>
          </div>
        </div>
      </div>

      {/* Official Poster Showcase Card */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-800 flex items-center gap-1.5">
              <ImageIcon className="h-4 w-4 text-gold-600" />
              <span>โปสเตอร์ทางการ · หอการค้าจังหวัดศรีสะเกษ</span>
            </span>
            <h2 className="font-serif text-2xl font-bold text-foreground mt-1">
              ปฏิทินกิจกรรมส่งท้ายปี พฤศจิกายน - ธันวาคม 2569
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("ALL")}
              className="rounded-xl text-xs"
            >
              กิจกรรมทั้งหมด ({SISAKET_EVENTS_2026.length})
            </Button>
            <Button
              variant={activeTab === "NOV" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("NOV")}
              className="rounded-xl text-xs"
            >
              พฤศจิกายน
            </Button>
            <Button
              variant={activeTab === "DEC" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("DEC")}
              className="rounded-xl text-xs"
            >
              ธันวาคม
            </Button>
          </div>
        </div>

        {/* Poster Grid Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Poster Image */}
          <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-border shadow-md bg-forest-950 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/sisaket_events_calendar_2026.jpg"
              alt="ปฏิทินกิจกรรม ศรีสะเกษ Sisaket Resonance พฤศจิกายน - ธันวาคม 2569"
              className="w-full h-auto object-cover group-hover:scale-102 transition-transform duration-300"
            />
            <div className="p-3 bg-forest-900 text-cream-100 text-center text-xs font-semibold flex items-center justify-center gap-2">
              <Info className="h-3.5 w-3.5 text-gold-400" />
              <span>จัดโดย หอการค้าจังหวัดศรีสะเกษ & เครือข่ายท่องเที่ยว</span>
            </div>
          </div>

          {/* Right Column: Dynamic Event Cards */}
          <div className="lg:col-span-7 space-y-4 max-h-[780px] overflow-y-auto pr-1">
            {filteredEvents.map((evt) => {
              const Icon = evt.icon;
              return (
                <div
                  key={evt.id}
                  className="rounded-2xl border border-border/80 bg-cream-50/50 p-5 transition-all hover:border-gold-500/50 hover:bg-card hover:shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-forest-900/10 text-forest-800">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold ${evt.badgeColor}`}>
                          {evt.dates}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-lg">
                      {evt.category}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-foreground leading-snug">
                    {evt.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="pt-1 flex items-center gap-1.5 text-xs font-medium text-forest-800">
                    <MapPin className="h-3.5 w-3.5 text-gold-600 shrink-0" />
                    <span>{evt.location}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full 12-Month Traditional Sisaket Festivals Section */}
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-border/60 pb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-forest-800 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-gold-600" />
            <span>ปฏิทินประเพณีตลอดปี 12 เดือน</span>
          </span>
          <h2 className="font-serif text-2xl font-bold text-foreground mt-1">
            เทศกาลและงานประเพณีประจำปี จังหวัดศรีสะเกษ
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            รวบรวมงานประเพณีสำคัญ เทศกาลดอกลำดวนบาน ทุเรียนภูเขาไฟ GI แซนโฎนตา และประเพณี 4 ชนเผ่าตลอดปี
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SISAKET_TRADITIONAL_FESTIVALS.map((fest) => (
            <div
              key={fest.id}
              className="rounded-2xl border border-border/70 bg-cream-50/40 p-5 space-y-3 transition-all hover:border-gold-500/50 hover:bg-card hover:shadow-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-forest-900 px-3 py-0.5 text-xs font-bold text-gold-300">
                  {fest.month}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {fest.organizer}
                </span>
              </div>

              <h3 className="font-serif text-base font-bold text-foreground">
                {fest.title}
              </h3>

              <div className="flex items-center gap-1 text-xs text-forest-800 font-medium">
                <MapPin className="h-3.5 w-3.5 text-gold-600 shrink-0" />
                <span className="line-clamp-1">{fest.location}</span>
              </div>

              <div className="pt-1 border-t border-border/60 space-y-1">
                {fest.activities.map((act, idx) => (
                  <div key={idx} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-500 shrink-0" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Community Shop Showcase Card: COCOA CrafT */}
      <div className="rounded-3xl border border-amber-300/60 bg-gradient-to-br from-amber-50/60 via-card to-cream-100 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-amber-200/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500 text-white shadow-xs">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-950">
                RECOMMENDED OTOP FOODTRUCK
              </span>
              <h2 className="font-serif text-2xl font-bold text-foreground mt-0.5">
                ร้านโกโก้คราฟท์ COCOA CrafT ศรีสะเกษ
              </h2>
            </div>
          </div>

          <Link href="/otop">
            <Button size="sm" variant="outline" className="rounded-xl border-amber-400 text-amber-950 hover:bg-amber-100">
              <Store className="h-4 w-4 mr-1.5" />
              <span>ดูสินค้า OTOP ทั้งหมด</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Shop Poster Image */}
          <div className="md:col-span-5 rounded-2xl overflow-hidden border border-amber-300 shadow-md bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/cocoa_craft_sisaket.png"
              alt="ร้านโกโก้คราฟท์ COCOA CrafT ของดีจังหวัดศรีสะเกษ"
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Shop Info Details */}
          <div className="md:col-span-7 space-y-4">
            <div className="space-y-2">
              <h3 className="font-serif text-xl font-bold text-amber-950">
                โกโก้คราฟท์ COCOA CrafT (since 2022)
              </h3>
              <p className="text-sm text-amber-900/90 leading-relaxed">
                เมนูชิกเนเจอร์ใช้เมล็ดพันธุ์โกโก้พรีเมียมจากทวีปแอฟริกา ผสานส่วนผสมที่ลงตัวทำให้ได้ &quot;โกโก้คราฟท์&quot; ที่เข้มข้นหวานน้อย เลือกจับคู่กับเครื่องดื่มได้หลากหลาย พร้อมชงสดใหม่ทุกแก้วด้วยความตั้งใจในรูปแบบ Food Truck สดชื่นส่งถึงทุกท่าน
              </p>
            </div>

            <div className="rounded-xl bg-amber-100/70 p-4 border border-amber-200/80 space-y-2 text-xs text-amber-950">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <Coffee className="h-4 w-4 text-amber-700" />
                <span>เครื่องดื่มแนะนำ</span>
              </div>
              <p>
                กาแฟสด, มัทฉะ, ชาไทย, ชาเขียว, เผือก, เครื่องดื่มชงสด/ปั่น, น้ำผลไม้สด, น้ำส้ม, น้ำมะพร้าว, เลม่อนดองน้ำผึ้ง
              </p>
              <div className="pt-1 font-semibold text-amber-900">
                * รับงานนอกสถานที่ งานอีเวนต์ งานบุญ งานบวช งานแต่ง งานขึ้นบ้านใหม่ โรงทาน และงานเลี้ยงต่างๆ
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Phone className="h-4 w-4 text-amber-600 shrink-0" />
                <span>093-5645996 / 098-1512942</span>
              </div>
              <div className="flex items-center gap-2 text-foreground font-medium">
                <Share2 className="h-4 w-4 text-amber-600 shrink-0" />
                <span>FB / TikTok / IG: โโก้คราฟท์ COCOA CrafT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
