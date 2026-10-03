"use client";

import { useState } from "react";
import { Users, MapPin, Phone, CheckCircle2, ArrowRight, Sparkles, Building2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SISAKET_OTOP_VILLAGES, SisaketOTOPVillage } from "@/lib/sisaket-tourism-data";

export default function CommunityPage() {
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");

  const districts = Array.from(new Set(SISAKET_OTOP_VILLAGES.map((v) => v.district)));

  const filteredVillages = SISAKET_OTOP_VILLAGES.filter((v) => {
    if (selectedDistrict === "ALL") return true;
    return v.district === selectedDistrict;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      {/* Editorial Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-8 text-cream-50 shadow-xl lg:p-12 border border-gold-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.25),transparent_60%)]" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
            <Users className="h-3.5 w-3.5" />
            <span>OTOP Nawatwithi Sisaket · หมู่บ้านท่องเที่ยว OTOP นวัตวิถี</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide sm:text-4xl text-cream-100">
            เครือข่ายชุมชน & หมู่บ้านท่องเที่ยว OTOP นวัตวิถี
          </h1>
          <p className="text-sm text-cream-200/80 sm:text-base leading-relaxed">
            ทำความรู้จัก 13 หมู่บ้านท่องเที่ยว OTOP นวัตวิถีอันโดดเด่นของจังหวัดศรีสะเกษ สัมผัสอัตลักษณ์ ชนเผ่า สินค้า OTOP และโฮมสเตย์ชุมชนอบอุ่น
          </p>
        </div>
      </div>

      {/* District Filter Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-gold-600" />
          <h2 className="font-serif text-xl font-bold text-foreground">
            หมู่บ้านท่องเที่ยวทั้งหมด ({filteredVillages.length} แห่ง)
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={selectedDistrict === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedDistrict("ALL")}
            className="rounded-xl text-xs"
          >
            ทั้งหมด
          </Button>
          {districts.map((dist) => (
            <Button
              key={dist}
              variant={selectedDistrict === dist ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDistrict(dist)}
              className="rounded-xl text-xs"
            >
              {dist}
            </Button>
          ))}
        </div>
      </div>

      {/* Community Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredVillages.map((item) => (
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
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-cream-50">
                  <span className="inline-block rounded-full bg-gold-500 px-2.5 py-0.5 text-[10px] font-bold text-forest-950">
                    {item.subdistrict} {item.district}
                  </span>
                  <h2 className="font-serif text-xl font-bold text-cream-100 mt-1">
                    {item.name}
                  </h2>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">
                    ผู้นำชุมชน / ผู้ติดต่อ:
                  </span>
                  <p className="text-sm font-bold text-forest-900">{item.chief}</p>
                </div>

                <div className="space-y-2 pt-1 border-t border-border/60">
                  <p className="text-xs font-bold uppercase tracking-wider text-forest-900 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-gold-600" />
                    <span>จุดเด่น & อัตลักษณ์ชุมชน</span>
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.highlights}
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-forest-900">
                    กิจกรรมท่องเที่ยวแนะนำ
                  </p>
                  <ul className="space-y-1.5">
                    {item.activities.map((act, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-gold-600 shrink-0" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t border-border/60 bg-cream-50/40 p-4 px-5 flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-forest-900 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-gold-600" />
                <span>{item.phone}</span>
              </span>
              <Link href="/hotels">
                <Button size="sm" className="rounded-xl font-semibold text-xs">
                  <span>ดูโฮมสเตย์ชุมชน</span>
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
