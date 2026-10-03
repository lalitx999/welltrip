"use client";

/**
 * (mobile-tourist)/community/page.tsx - Community Network & Provider Directory.
 */
import { Users, Building2, MapPin, Phone, Mail, Award, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CommunityPage() {
  const communities = [
    {
      id: "com-1",
      name: "วิสาหกิจชุมชนท่องเที่ยวเชิงอนุรักษ์บ้านขุนหาญ",
      type: "โฮมสเตย์เรือนไม้ & ท่องเที่ยวสวนผลไม้",
      location: "อ.ขุนหาญ, จ.ศรีสะเกษ",
      members: "35 ครัวเรือน",
      established: "2018",
      highlights: ["โฮมสเตย์มาตรฐานกรมการท่องเที่ยว", "สวนทุเรียนอินทรีย์ GI", "จักรยานชมวิถีชุมชน"],
      image: "/images/hero_lanna_homestay.jpg",
      contact: "081-234-5678",
    },
    {
      id: "com-2",
      name: "กลุ่มแม่บ้านแปรรูปอาหารอินทรีย์และชาสมุนไพร",
      type: "อาหารสุขภาพ & สมุนไพรแปรรูป",
      location: "อ.เมือง, จ.ศรีสะเกษ",
      members: "24 ครัวเรือน",
      established: "2020",
      highlights: ["สำรับอาหารโซเดียมต่ำ", "ชาสมุนไพรอินทรีย์ 5 ชนิด", "มาตรฐาน อย. และ OTOP 5 ดาว"],
      image: "/images/organic_community_food.jpg",
      contact: "089-876-5432",
    },
    {
      id: "com-3",
      name: "กลุ่มสปาหัตถการนวดไทยมรดกภูมิปัญญาล้านนา",
      type: "บริการสปา & นวดสมุนไพร",
      location: "อ.กันทรลักษ์, จ.ศรีสะเกษ",
      members: "18 หมอนวดแพทย์แผนไทย",
      established: "2019",
      highlights: ["ใบรับรองมาตรฐานสปาเพื่อสุขภาพ", "ลูกประคบสมุนไพรสด", "ตู้อบไอน้ำสมุนไพรพื้นบ้าน"],
      image: "/images/eco_wellness_spa.jpg",
      contact: "086-555-4321",
    },
    {
      id: "com-4",
      name: "กลุ่มทอผ้าครามและหัตถกรรมเครื่องจักสานหวาย",
      type: "สินค้า OTOP & งานทอมือ",
      location: "อ.อุทุมพรพิสัย, จ.ศรีสะเกษ",
      members: "42 ครัวเรือน",
      established: "2015",
      highlights: ["ผ้าทอมือย้อมสีธรรมชาติ", "กระติบข้าวหวายละเอียด", "กระเป๋าจักสานแฟชั่นยั่งยืน"],
      image: "/images/hero_lanna_homestay.jpg",
      contact: "084-333-2211",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-8 text-cream-50 shadow-xl lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.25),transparent_60%)]" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
            <Users className="h-3.5 w-3.5" />
            <span>Empowering Local Enterprises</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide sm:text-4xl text-cream-100">
            เครือข่ายชุมชน & ผู้ให้บริการ (Community Directory)
          </h1>
          <p className="text-sm text-cream-200/80 sm:text-base leading-relaxed">
            ทำความรู้จักกลุ่มวิสาหกิจชุมชนและผู้ให้บริการท้องถิ่นที่เป็นหัวใจสำคัญในการขับเคลื่อนท่องเที่ยวสุขภาพยั่งยืน
          </p>
        </div>
      </div>

      {/* Community Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {communities.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:border-gold-500/40 hover:shadow-md"
          >
            <div>
              <div className="relative h-48 w-full overflow-hidden bg-cream-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-cream-50">
                  <span className="inline-block rounded-full bg-gold-500 px-2.5 py-0.5 text-[10px] font-bold text-forest-950">
                    {item.type}
                  </span>
                  <h2 className="font-serif text-lg font-bold text-cream-100 mt-1 line-clamp-1">
                    {item.name}
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-semibold text-forest-800">
                    <MapPin className="h-3.5 w-3.5 text-gold-600" />
                    {item.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-gold-600" />
                    สมาชิก {item.members}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-forest-900">
                    จุดเด่น & มาตรฐานชุมชน
                  </p>
                  <ul className="space-y-1.5">
                    {item.highlights.map((h, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-gold-600 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-border/60 bg-cream-50/40 p-4 px-6 flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-forest-900">
                โทร: {item.contact}
              </span>
              <Link href="/hotels">
                <Button size="sm" className="rounded-xl font-semibold">
                  <span>ดูบริการของชุมชน</span>
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
