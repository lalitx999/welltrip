"use client";

/**
 * (mobile-tourist)/news/page.tsx - Community News & Eco-Tourism Events.
 */
import { Newspaper, Calendar, MapPin, Tag, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewsPage() {
  const newsList = [
    {
      id: "news-1",
      title: "งานเทศกาลทุเรียนภูเขาไฟ & ผลไม้อินทรีย์ศรีสะเกษ 2026",
      date: "25 - 30 กันยายน 2026",
      location: "อำเภอกันทรลักษ์, ศรีสะเกษ",
      category: "เทศกาลชุมชน",
      summary:
        "เชิญเที่ยวชมสวนทุเรียนภูเขาไฟ GI ดินแดนภูเขาไฟโบราณ ชิมผลไม้อินทรีย์สดจากต้น พร้อมกิจกรรมปั่นจักรยานชมสวนสุขภาพ",
      image: "/images/hero_lanna_homestay.jpg",
    },
    {
      id: "news-2",
      title: "อบรมเวิร์กช็อปมรดกผ้าทอมือย้อมสีธรรมชาติโบราณ",
      date: "5 ตุลาคม 2026",
      location: "ศูนย์หัตถกรรมย้อมครามชุมชน",
      category: "เวิร์กช็อปมรดกวัฒนธรรม",
      summary:
        "เรียนรู้ศาสตร์การสกัดสีธรรมชาติจากเปลือกไม้และครามพื้นบ้าน พร้อมลงมือทอผ้าและทำมัดย้อมชิ้นเดียวในโลกด้วยตนเอง",
      image: "/images/organic_community_food.jpg",
    },
    {
      id: "news-3",
      title: "โครงการยกระดับโฮมสเตย์ชุมชนสู่มาตรฐานสากลเชิงอนุรักษ์",
      date: "12 ตุลาคม 2026",
      location: "เครือข่ายท่องเที่ยวสุขภาพ WellTrip",
      category: "ข่าวสารพัฒนาชุมชน",
      summary:
        " WellTrip ร่วมมือกับชุมชนพัฒนาโฮมสเตย์เรือนไม้และเมนูโภชนาการโซเดียมต่ำ เพื่อรองรับนักท่องเที่ยวสุขภาพยุคใหม่",
      image: "/images/eco_wellness_spa.jpg",
    },
    {
      id: "news-4",
      title: "กิจกรรมเดินป่าศึกษาตู้ยาสมุนไพรและอบสมุนไพรพื้นบ้าน",
      date: "20 ตุลาคม 2026",
      location: "ป่าชุมชนบ้านขุนหาญ",
      category: "กิจกรรมสุขภาพ",
      summary:
        "ร่วมเดินป่าศึกษาสมุนไพรไทยกับปราชญ์ชาวบ้าน พร้อมเข้าอบไอน้ำสมุนไพรธรรมชาติเพื่อดีท็อกซ์ร่างกายและผ่อนคลายจิตใจ",
      image: "/images/hero_lanna_homestay.jpg",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-8 text-cream-50 shadow-xl lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.25),transparent_60%)]" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
            <Newspaper className="h-3.5 w-3.5" />
            <span>Community Events & Updates</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide sm:text-4xl text-cream-100">
            ข่าวสาร & กิจกรรมชุมชน (News & Events)
          </h1>
          <p className="text-sm text-cream-200/80 sm:text-base leading-relaxed">
            อัปเดตกิจกรรมท่องเที่ยวเชิงสุขภาพ งานเทศกาลประจำถิ่น และกิจกรรมเวิร์กช็อปมรดกภูมิปัญญา
          </p>
        </div>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {newsList.map((item) => (
          <article
            key={item.id}
            className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:border-gold-500/40 hover:shadow-md"
          >
            <div>
              <div className="relative h-56 w-full overflow-hidden bg-cream-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <span className="rounded-full bg-forest-950/80 px-3 py-1 text-xs font-semibold text-cream-100 backdrop-blur-sm">
                    {item.category}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-semibold text-forest-800">
                    <Calendar className="h-3.5 w-3.5 text-gold-600" />
                    {item.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-gold-600" />
                    {item.location}
                  </span>
                </div>

                <h2 className="font-serif text-xl font-bold text-foreground group-hover:text-forest-900 transition-colors leading-snug">
                  {item.title}
                </h2>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.summary}
                </p>
              </div>
            </div>

            <div className="border-t border-border/60 bg-cream-50/40 p-4 px-6 flex items-center justify-between">
              <span className="text-xs font-semibold text-forest-800">เข้าร่วมกิจกรรมชุมชน</span>
              <Button size="sm" variant="outline" className="rounded-xl">
                <span>อ่านรายละเอียด</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
