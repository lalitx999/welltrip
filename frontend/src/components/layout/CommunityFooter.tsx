"use client";

/**
 * CommunityFooter.tsx - Bottom banner section matching the reference mockup.
 */
import { Users, Heart, Leaf, TrendingUp } from "lucide-react";

export function CommunityFooter() {
  const pillars = [
    {
      title: "ชุมชนเป็นเจ้าของ",
      desc: "สร้างงาน สร้างรายได้ กระจายสู่คนในชุมชน",
      icon: Users,
    },
    {
      title: "สุขภาพดี",
      desc: "อาหาร กิจกรรม สุขภาพกายและใจที่ดี",
      icon: Heart,
    },
    {
      title: "สิ่งแวดล้อมยั่งยืน",
      desc: "ใช้ทรัพยากรอย่างคุ้มค่า ท่องเที่ยวอย่างรับผิดชอบ",
      icon: Leaf,
    },
    {
      title: "เศรษฐกิจเติบโต",
      desc: "เพิ่มมูลค่าการท่องเที่ยว ขยายโอกาสทางธุรกิจ",
      icon: TrendingUp,
    },
  ];

  return (
    <footer className="w-full bg-forest-900 text-cream-50 mt-12 border-t border-forest-800">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 border-b border-forest-800/80 pb-8">
          {pillars.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500/20 text-gold-400 border border-gold-500/30">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-serif text-sm font-bold text-cream-100">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-cream-200/70 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center justify-between gap-4 pt-6 sm:flex-row text-xs text-cream-200/80">
          <div className="flex items-center gap-2">
            <span className="font-serif text-base font-bold text-cream-100">WellTrip</span>
            <span>© 2026 Smart Wellness Tourism Platform for Community. All rights reserved.</span>
          </div>
          <div className="font-serif font-semibold text-gold-300 text-sm">
            “เที่ยวดี สุขภาพดี รายได้สู่ชุมชน” ไปด้วยกัน อย่างยั่งยืน
          </div>
        </div>
      </div>
    </footer>
  );
}
