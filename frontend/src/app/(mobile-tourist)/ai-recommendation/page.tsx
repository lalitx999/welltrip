"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ShoppingBag, Sparkles } from "lucide-react";
import type { AIRecommendationResponse, PackageItem } from "@/lib/api/ai";
import { PageHeading, Media } from "@/components/travel/Primitives";
import { useTravelCopy } from "@/components/travel/travel-shell";
import { formatPriceText } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";

export default function AIRecommendationPage() {
  const copy = useTravelCopy();
  const { locale } = useI18n();
  const add = useCartStore((s) => s.addItem);

  const [result, setResult] = useState<AIRecommendationResponse | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("ai_recommendation_result");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          Array.isArray(parsed?.recommended_package?.items) &&
          parsed?.health_metrics
        ) {
          setResult(parsed);
        }
      }
    } catch {
    } finally {
      setReady(true);
    }
  }, []);

  if (!ready) {
    return (
      <p role="status" className="wt-empty py-16 text-center text-sm text-[#657468]">
        {copy("กำลังประมวลผลคำแนะนำ...", "Generating recommendations...")}
      </p>
    );
  }

  if (!result) {
    return (
      <div className="wt-page max-w-xl mx-auto py-10 space-y-6 text-center">
        <PageHeading
          eyebrow="YOUR NEXT BREAK"
          title={copy("ออกแบบวันพักผ่อนของคุณ", "Start planning your next break")}
          description={copy(
            "ยังไม่มีข้อมูลการประเมินสุขภาพในระบบของคุณ",
            "No health assessment data found in your current session."
          )}
        />
        <Link className="wt-button inline-flex items-center gap-2" href="/health">
          <Sparkles size={16} />
          {copy("เริ่มประเมินสุขภาพ", "Start assessment")}
        </Link>
      </div>
    );
  }

  const pack = result.recommended_package;

  function destination(item: PackageItem) {
    const fallback = item.item_type === "ROOM_RESERVATION" ? "/hotels" : "/wellness";
    return item.detail_url && /^\/(hotels|wellness)\/[a-zA-Z0-9-]+$/.test(item.detail_url)
      ? item.detail_url
      : fallback;
  }

  return (
    <div className="wt-page space-y-8 py-4">
      <PageHeading
        eyebrow="AI WELLNESS CURATION"
        title={pack.package_title}
        description={pack.duration_label}
      />

      {/* Analysis Card */}
      <section className="bg-[#fffdf8] border border-[#dfe2d5] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#e1e2d8] pb-4">
          <h2 className="font-serif text-xl font-semibold text-[#193e30]">
            {copy("ข้อมูลประกอบการเลือกทริป", "A starting point for your trip")}
          </h2>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#edf0e3] text-[#224e39]">
            BMI {result.health_metrics.bmi}
          </span>
        </div>

        <p className="text-sm text-[#193e30] leading-relaxed whitespace-pre-line">
          {result.deepseek_analysis}
        </p>

        <p className="text-xs text-[#657468] italic border-t border-[#e1e2d8] pt-3">
          {pack.disclaimer}
        </p>
      </section>

      {/* Recommended Items Header */}
      <div className="flex items-center justify-between border-b border-[#e1e2d8] pb-3">
        <h2 className="font-serif text-2xl font-semibold text-[#193e30]">
          {copy("บริการและสินค้าแนะนำ", "Recommended catalog options")}
        </h2>
        <Link href="/cart" className="inline-flex items-center gap-1 text-xs font-semibold text-[#224e39] hover:underline">
          {copy("ดูตะกร้าสินค้า", "View cart")}
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {notice && (
        <p role="status" className="rounded-xl bg-[#edf0e3] p-3 text-xs font-semibold text-[#224e39]">
          {notice}
        </p>
      )}

      {!pack.items.length ? (
        <p className="py-12 text-center text-sm text-[#657468]">
          {copy("ยังไม่มีบริการให้แนะนำในขณะนี้", "No catalog options are available yet.")}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pack.items.map((item, i) => {
            const needsSelection =
              item.item_type === "ROOM_RESERVATION" ||
              item.item_type === "WELLNESS_SESSION";

            return (
              <article
                key={`${item.item_type}-${item.entity_id}-${i}`}
                className="bg-[#fffdf8] border border-[#dfe2d5] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:border-[#193e30]/30 transition"
              >
                <div>
                  <Media src={item.image_url} alt={item.title} />
                  <div className="p-5 space-y-2">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#224e39] bg-[#edf0e3] px-2.5 py-0.5 rounded-full inline-block">
                      {item.category_label}
                    </span>
                    <h3 className="font-serif text-lg font-semibold text-[#193e30] line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="font-serif text-base font-bold text-[#193e30]">
                      {formatPriceText(item.unit_price, locale)}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  {needsSelection ? (
                    <Link
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#d8ddce] bg-white text-xs font-semibold text-[#193e30] hover:bg-[#edf0e3] transition"
                      href={destination(item)}
                    >
                      <span>{copy("เลือกวันหรือรอบเวลา", "Choose dates or session")}</span>
                      <ArrowUpRight size={14} />
                    </Link>
                  ) : (
                    <button
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#224e39] hover:bg-[#173a29] text-xs font-semibold text-[#faf8f1] transition"
                      onClick={() => {
                        add({
                          item_type: item.item_type,
                          entity_id: item.entity_id,
                          title: item.title,
                          unit_price: Number(item.unit_price),
                          quantity: item.quantity,
                          image_url: item.image_url,
                        });
                        setNotice(copy(`เพิ่ม ${item.title} แล้ว`, `Added ${item.title}.`));
                      }}
                    >
                      <ShoppingBag size={14} />
                      <span>{copy("เพิ่มลงตะกร้า", "Add to cart")}</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="pt-4 text-center">
        <Link
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#d8ddce] bg-white text-xs font-semibold text-[#193e30] hover:bg-[#edf0e3] transition"
          href="/health"
        >
          {copy("ปรับข้อมูลของฉัน", "Update my preferences")}
        </Link>
      </div>
    </div>
  );
}
