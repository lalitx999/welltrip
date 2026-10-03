"use client";

/**
 * (mobile-tourist)/ai-recommendation/page.tsx - Dual-AI Recommendation Package & One-Click Booking.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  Sparkles,
  CheckCircle2,
  ShoppingCart,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  UtensilsCrossed,
  Hotel,
  PackageCheck,
  Landmark,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { AIRecommendationResponse, PackageItem } from "@/lib/api/ai";
import { formatPriceText } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";

export default function AIRecommendationPage() {
  const { locale } = useI18n();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [aiData, setAiData] = useState<AIRecommendationResponse | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("ai_recommendation_result");
      if (stored) {
        try {
          setAiData(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  if (!aiData) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
        <Brain className="mx-auto h-12 w-12 text-forest-800 animate-bounce" />
        <h1 className="font-serif text-2xl font-bold">ยังไม่มีข้อมูลผลวิเคราะห์จาก AI</h1>
        <p className="text-sm text-muted-foreground">โปรดทำการประเมินสุขภาพที่หน้าประเมินสุขภาพก่อนครับ</p>
        <Link href="/health">
          <Button className="rounded-xl px-6 font-semibold">ไปยังหน้าประเมินสุขภาพ</Button>
        </Link>
      </div>
    );
  }

  const { health_metrics, deepseek_analysis, recommended_package } = aiData;

  function handleAddWholePackage() {
    if (!recommended_package || !recommended_package.items) return;

    for (const item of recommended_package.items) {
      addItem({
        item_type: item.item_type,
        entity_id: item.entity_id,
        title: item.title,
        unit_price: Number(item.unit_price),
        quantity: item.quantity,
      });
    }

    setAdded(true);
    setTimeout(() => {
      router.push("/cart");
    }, 1000);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16 pt-6 sm:px-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-8 text-cream-50 shadow-xl lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.3),transparent_60%)]" />
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-bold text-gold-300">
              <Brain className="h-3.5 w-3.5 text-gold-400" />
              <span>DeepSeek Reasoning Engine</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>Gemini Structured Matching</span>
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-cream-100 sm:text-4xl">
            {recommended_package.package_title}
          </h1>
          <p className="text-sm text-cream-200/80">
            {recommended_package.duration_label} · ผลวิเคราะห์เฉพาะบุคคลตามค่า BMI {health_metrics.bmi}
          </p>
        </div>
      </div>

      {/* DeepSeek Clinical Analysis Section */}
      <section className="rounded-2xl border border-forest-900/20 bg-cream-50/60 p-6 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-forest-900 border-b border-border/60 pb-2">
          <Brain className="h-5 w-5 text-forest-800" />
          <h2 className="font-serif text-base font-bold">บทวิเคราะห์สุขภาพเชิงลึก (DeepSeek Clinical Rationale)</h2>
        </div>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-line font-serif">
          {deepseek_analysis}
        </p>
      </section>

      {/* Package Items Grid (Matched by Gemini AI) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h2 className="font-serif text-xl font-bold text-foreground">
            รายการบริการที่ AI คัดสรรสำหรับทริปนี้ ({recommended_package.items.length} รายการ)
          </h2>
          <span className="text-xs font-semibold text-muted-foreground">
            รวมทั้งสิ้น: <strong className="font-serif text-base text-forest-900">{formatPriceText(Number(recommended_package.total_package_price), locale)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {recommended_package.items.map((item, idx) => (
            <div
              key={`${item.item_type}-${item.entity_id}-${idx}`}
              className="flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image_url}
                alt={item.title}
                className="h-20 w-20 shrink-0 rounded-xl object-cover border border-border/60"
              />
              <div className="min-w-0 flex-1 space-y-1">
                <span className="inline-block rounded-full bg-forest-50 border border-forest-900/10 px-2.5 py-0.5 text-[10px] font-bold text-forest-900">
                  {item.category_label}
                </span>
                <p className="font-serif text-sm font-bold text-foreground leading-snug">
                  {item.title}
                </p>
                <p className="font-serif text-sm font-extrabold text-forest-900">
                  {formatPriceText(Number(item.unit_price), locale)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add Whole Package to Cart Bar */}
      <section className="rounded-2xl border border-gold-500/30 bg-cream-50/80 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">ราคารวมทั้งแพ็กเกจ (Package Total)</p>
            <p className="font-serif text-3xl font-extrabold text-forest-900">
              {formatPriceText(Number(recommended_package.total_package_price), locale)}
            </p>
          </div>
          <Button
            onClick={handleAddWholePackage}
            disabled={added}
            className="rounded-xl bg-forest-900 hover:bg-forest-950 text-cream-50 px-8 py-3.5 font-bold text-base shadow-lg transition-all"
          >
            {added ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5 text-emerald-400" />
                <span>เพิ่มลงตะกร้าแล้ว! กำลังไปหน้าตะกร้า...</span>
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-5 w-5 text-gold-400" />
                <span>⚡ เพิ่มทั้งแพ็กเกจลงตะกร้า (Add Package to Cart)</span>
              </>
            )}
          </Button>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted-foreground pt-2 border-t border-border/60">
          <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <span>{recommended_package.disclaimer}</span>
        </div>
      </section>

      {/* Back link */}
      <div className="pt-2">
        <Link href="/health">
          <Button variant="outline" className="rounded-xl border-border/80">
            <ArrowLeft className="mr-2 h-4 w-4" />
            <span>กลับไปหน้าประเมินสุขภาพ</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
