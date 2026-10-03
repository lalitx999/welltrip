"use client";

/**
 * (mobile-tourist)/health/page.tsx - Interactive Health Assessment for Dual-AI Trip Recommendation.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  ClipboardCheck,
  Heart,
  Activity,
  Sparkles,
  UtensilsCrossed,
  Hotel,
  ArrowRight,
  RefreshCw,
  Brain,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitHealthAssessment, type AIRecommendationResponse } from "@/lib/api/ai";
import { formatPriceText } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export default function HealthAssessmentPage() {
  const { locale } = useI18n();
  const router = useRouter();

  const [height, setHeight] = useState<string>("170");
  const [weight, setWeight] = useState<string>("65");
  const [age, setAge] = useState<string>("28");
  const [gender, setGender] = useState<string>("male");
  const [healthGoal, setHealthGoal] = useState<string>("STRESS_RELIEF");
  const [lifestyle, setLifestyle] = useState<string>("MODERATE");
  const [dietary, setDietary] = useState<string[]>(["organic"]);

  // Live BMI calculation
  const h = Number(height) / 100;
  const w = Number(weight);
  const bmi = h > 0 && w > 0 ? (w / (h * h)).toFixed(2) : "0.00";
  const bmiNum = Number(bmi);

  // Live BMR calculation (Mifflin-St Jeor)
  const a = Number(age);
  let bmr = 1500;
  if (h > 0 && w > 0 && a > 0) {
    bmr = gender === "male"
      ? Math.round(10 * w + 6.25 * Number(height) - 5 * a + 5)
      : Math.round(10 * w + 6.25 * Number(height) - 5 * a - 161);
  }

  let bmiStatus = "เกณฑ์ปกติ (Normal)";
  let bmiColor = "text-emerald-700 bg-emerald-100 border-emerald-300";
  if (bmiNum < 18.5) {
    bmiStatus = "น้ำหนักน้อยกว่าเกณฑ์ (Underweight)";
    bmiColor = "text-amber-800 bg-amber-100 border-amber-300";
  } else if (bmiNum >= 23 && bmiNum < 25) {
    bmiStatus = "น้ำหนักเกินเกณฑ์เล็กน้อย (Overweight)";
    bmiColor = "text-amber-800 bg-amber-100 border-amber-300";
  } else if (bmiNum >= 25) {
    bmiStatus = "เริ่มเข้าสู่ภาวะอ้วน (Obese)";
    bmiColor = "text-rose-800 bg-rose-100 border-rose-300";
  }

  const aiMutation = useMutation({
    mutationFn: submitHealthAssessment,
    onSuccess: (res) => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("ai_recommendation_result", JSON.stringify(res.data));
      }
      router.push("/ai-recommendation");
    },
  });

  function toggleDietary(item: string) {
    setDietary((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    aiMutation.mutate({
      weight_kg: Number(weight),
      height_cm: Number(height),
      age: Number(age),
      gender,
      health_goal: healthGoal,
      lifestyle,
      dietary_restrictions: dietary,
    });
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 pb-16 pt-6 sm:px-6">
      {/* Editorial Header */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-8 text-cream-50 shadow-xl lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.25),transparent_60%)]" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Dual-AI Wellness Intelligence (DeepSeek + Gemini)</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-wide sm:text-4xl text-cream-100">
            ประเมินสุขภาพ & จัดทริปด้วย AI
          </h1>
          <p className="text-sm text-cream-200/80 sm:text-base leading-relaxed">
            ผสานพลัง **DeepSeek AI (วิเคราะห์สุขภาพ)** และ **Gemini AI (จับคู่แพ็กเกจ)** เพื่อแนะนำโฮมสเตย์ อาหารสมุนไพร และสปาล้านนาที่เหมาะกับคุณโดยเฉพาะ
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Assessment Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Activity className="h-5 w-5 text-forest-800" />
              <h2 className="font-serif text-lg font-bold text-foreground">กรอกข้อมูลร่างกาย & เป้าหมายสุขภาพ</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="height" className="mb-1 block text-xs font-semibold text-muted-foreground">
                    ส่วนสูง (Height in cm)
                  </label>
                  <input
                    id="height"
                    type="number"
                    min={100}
                    max={230}
                    required
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-cream-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
                  />
                </div>
                <div>
                  <label htmlFor="weight" className="mb-1 block text-xs font-semibold text-muted-foreground">
                    น้ำหนัก (Weight in kg)
                  </label>
                  <input
                    id="weight"
                    type="number"
                    min={30}
                    max={200}
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-cream-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="age" className="mb-1 block text-xs font-semibold text-muted-foreground">
                    อายุ (Age)
                  </label>
                  <input
                    id="age"
                    type="number"
                    min={1}
                    max={120}
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-cream-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
                  />
                </div>
                <div>
                  <label htmlFor="gender" className="mb-1 block text-xs font-semibold text-muted-foreground">
                    เพศ (Gender)
                  </label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-cream-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600"
                  >
                    <option value="male">ชาย (Male)</option>
                    <option value="female">หญิง (Female)</option>
                    <option value="other">อื่นๆ (Other)</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="healthGoal" className="mb-1 block text-xs font-semibold text-muted-foreground">
                  เป้าหมายสุขภาพที่ต้องการฟื้นฟู (Health Goal)
                </label>
                <select
                  id="healthGoal"
                  value={healthGoal}
                  onChange={(e) => setHealthGoal(e.target.value)}
                  className="w-full rounded-xl border border-border/80 bg-cream-50/50 px-3.5 py-2.5 text-sm transition-all focus:border-forest-600 focus:outline-none focus:ring-1 focus:ring-forest-600 font-semibold text-forest-900"
                >
                  <option value="STRESS_RELIEF">คลายความเครียด & สปาผ่อนคลายกล้ามเนื้อ (Stress Relief)</option>
                  <option value="DETOX">ดีท็อกซ์ล้างสารพิษ & อาหารใยอาหารสูง (Detox & Cleanse)</option>
                  <option value="BLOOD_SUGAR_CONTROL">ควบคุมระดับน้ำตาล & อาหารโซเดียมต่ำ (Sugar & Salt Control)</option>
                  <option value="FATIGUE_RECOVERY">ฟื้นฟูพละกำลัง & การนอนหลับลึก (Fatigue Recovery)</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  ข้อจำกัดทางอาหาร (Dietary Restrictions)
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "vegan", label: "มังสวิรัติ (Vegan)" },
                    { id: "low_sodium", label: "โซเดียมต่ำ (Low Sodium)" },
                    { id: "low_sugar", label: "หวานน้อย (Low Sugar)" },
                    { id: "organic", label: "ออร์แกนิค (Organic Only)" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDietary(d.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                        dietary.includes(d.id)
                          ? "bg-forest-900 text-cream-100 border-forest-900"
                          : "bg-cream-50 text-muted-foreground border-border/80 hover:border-forest-700"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                disabled={aiMutation.isPending}
                className="w-full justify-center rounded-xl py-3.5 font-semibold text-base shadow-md bg-forest-900 hover:bg-forest-950 text-cream-50 mt-4"
              >
                {aiMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>กำลังประมวลผลด้วย Dual AI (DeepSeek ➔ Gemini)...</span>
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-5 w-5 text-gold-400" />
                    <span>ให้ Dual-AI แนะนำแพ็กเกจทริปสุขภาพ</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Live Calculation Cards */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <Heart className="h-5 w-5 text-gold-600" />
              <h2 className="font-serif text-lg font-bold text-foreground">ผลคำนวณดัชนีร่างกาย</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-xl bg-cream-50/70 p-4 border border-border/60 space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">ดัชนีมวลกาย (BMI)</p>
                <p className="font-serif text-3xl font-extrabold text-forest-900">{bmi}</p>
                <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${bmiColor}`}>
                  {bmiStatus}
                </span>
              </div>

              <div className="rounded-xl bg-cream-50/70 p-4 border border-border/60 space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">เผาผลาญพื้นฐาน (BMR)</p>
                <p className="font-serif text-3xl font-extrabold text-forest-900">{bmr}</p>
                <p className="text-[10px] text-muted-foreground">แคลอรี/วัน (kcal)</p>
              </div>
            </div>

            <div className="rounded-xl bg-forest-50/50 p-4 border border-forest-900/10 space-y-2 text-xs text-forest-950">
              <div className="flex items-center gap-1.5 font-bold text-forest-900">
                <Brain className="h-4 w-4 text-forest-800" />
                <span>การทำงานของสถาปัตยกรรม Dual-AI:</span>
              </div>
              <ul className="space-y-1 text-[11px] text-muted-foreground list-disc pl-4">
                <li><strong className="text-foreground">DeepSeek AI:</strong> วิเคราะห์สภาวะสุขภาพและวางแผนการฟื้นฟูเชิงลึก</li>
                <li><strong className="text-foreground">Gemini AI:</strong> จับคู่แพ็กเกจสินค้าจริงในชุมชนออกมาเป็น JSON Format</li>
              </ul>
            </div>

            <div className="rounded-xl bg-amber-500/10 p-3 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-900">
              <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <span>คำแนะนำนี้มีวัตถุประสงค์เพื่อการส่งเสริมสุขภาพเบื้องต้น ไม่ใช่การวินิจฉัยหรือสั่งการรักษาทางการแพทย์</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
