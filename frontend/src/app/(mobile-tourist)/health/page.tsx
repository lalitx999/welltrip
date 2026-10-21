"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  HeartPulse,
  Activity,
  ClipboardCheck,
  Scale,
  Calendar,
  User,
  Flame,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  ShieldCheck,
  Info,
} from "lucide-react";
import { submitHealthAssessment } from "@/lib/api/ai";
import { extractErrorMessage } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STEPPER = [
  { id: 0, title: "ข้อมูลสุขภาพพื้นฐาน", icon: HeartPulse },
  { id: 1, title: "ความต้องการพักผ่อน", icon: Activity },
  { id: 2, title: "สรุปผลและคำแนะนำ", icon: ClipboardCheck },
];

const GOALS = [
  {
    value: "STRESS_RELIEF",
    label: "พักผ่อนและคลายความเครียด (Slow Life & Relaxation)",
    desc: "เน้นการพักผ่อนแบบสโลว์ไลฟ์ สูดอากาศบริสุทธิ์ ผ่อนคลายกล้ามเนื้อ",
  },
  {
    value: "DETOX",
    label: "สรรหาความสงบและสปาบำบัด (Detox & Spa Therapy)",
    desc: "เน้นการล้างพิษร่างกาย วนสปา และนวดแผนไทยสมุนไพรพื้นบ้าน",
  },
  {
    value: "BLOOD_SUGAR_CONTROL",
    label: "เดินทางช้าชื่นชมวิถีชุมชน (Community Culture & Food)",
    desc: "เน้นอาหารสุขภาพโซเดียมต่ำ หวานน้อย และการเรียนรู้วิถีชุมชน",
  },
  {
    value: "FATIGUE_RECOVERY",
    label: "ทริปทำกิจกรรมครอบครัว (Family & Nature Activity)",
    desc: "เน้นกิจกรรมธรรมชาติ เวิร์กช็อปสมุนไพร และการฟื้นฟูความเหนื่อยล้า",
  },
];

const DIET_OPTIONS = [
  { id: "vegan", label: "วีแกน (Vegan)", tag: "พืชผัก 100%" },
  { id: "low_sodium", label: "โซเดียมต่ำ (Low Sodium)", tag: "ดีต่อไต & ความดัน" },
  { id: "low_sugar", label: "หวานน้อย (Low Sugar)", tag: "ควบคุมระดับน้ำตาล" },
  { id: "organic", label: "ออร์แกนิก (Organic)", tag: "ปลอดสารเคมี" },
];

export default function HealthPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(0);

  // Form State
  const [height, setHeight] = useState("165");
  const [weight, setWeight] = useState("60");
  const [age, setAge] = useState("30");
  const [gender, setGender] = useState("male");
  const [goal, setGoal] = useState("STRESS_RELIEF");
  const [diet, setDiet] = useState<string[]>(["low_sodium", "organic"]);
  const [consent, setConsent] = useState(false);

  const mutation = useMutation({
    mutationFn: submitHealthAssessment,
    onSuccess: (res) => {
      sessionStorage.setItem("ai_recommendation_result", JSON.stringify(res.data));
      router.push("/ai-recommendation");
    },
  });

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    if (consent) {
      mutation.mutate({
        height_cm: Number(height),
        weight_kg: Number(weight),
        age: Number(age),
        gender,
        health_goal: goal,
        dietary_restrictions: diet,
        lifestyle: "MODERATE",
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8">
      <div className="max-w-3xl mx-auto px-4 space-y-8">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            AI Personal Wellness Curator
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-stone-900 font-serif">
            ประเมินสุขภาพและออกแบบทริปของคุณ
          </h1>
          <p className="text-stone-500 text-sm max-w-lg mx-auto">
            กรอกข้อมูลสั้นๆ เพื่อให้ AI แนะนำที่พัก กิจกรรมสปา และอาหารสุขภาพที่เหมาะกับคุณ
          </p>
        </div>

        {/* 1. Stepper Bar (Top) */}
        <div className="rounded-2xl bg-white border border-stone-200/80 p-4 shadow-xs">
          <div className="grid grid-cols-3 gap-2">
            {STEPPER.map((s, idx) => {
              const Icon = s.icon;
              const isCompleted = step > idx;
              const isActive = step === idx;

              return (
                <div
                  key={s.id}
                  className={cn(
                    "flex flex-col sm:flex-row items-center justify-center gap-2 p-2.5 rounded-xl transition-all text-center sm:text-left",
                    isActive
                      ? "bg-[#1B2A24] text-white shadow-xs font-bold"
                      : isCompleted
                      ? "bg-emerald-50 text-emerald-800 font-semibold"
                      : "bg-stone-50 text-stone-400 font-medium"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0",
                      isActive
                        ? "bg-amber-400 text-[#1B2A24] font-bold"
                        : isCompleted
                        ? "bg-emerald-600 text-white"
                        : "bg-stone-200 text-stone-500"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-xs truncate">{s.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Wizard Main Card Form */}
        <form
          onSubmit={handleNext}
          className="rounded-3xl bg-white border border-stone-200/80 p-6 md:p-8 shadow-xs space-y-6"
        >
          
          {/* STEP 1: ข้อมูลสุขภาพพื้นฐาน */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <HeartPulse className="w-5 h-5 text-emerald-700" />
                <h2 className="text-lg font-bold text-stone-900 font-serif">
                  Step 1: ข้อมูลสุขภาพพื้นฐาน (Basic Wellness Info)
                </h2>
              </div>

              {/* Physical Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Height */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-2">
                  <label htmlFor="height-input" className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-emerald-700" />
                    <span>ส่วนสูง (ซม.) *</span>
                  </label>
                  <input
                    id="height-input"
                    type="number"
                    min="50"
                    max="250"
                    step="0.1"
                    required
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1B2A24]"
                    placeholder="165"
                  />
                </div>

                {/* Weight */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-2">
                  <label htmlFor="weight-input" className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-700" />
                    <span>น้ำหนัก (กก.) *</span>
                  </label>
                  <input
                    id="weight-input"
                    type="number"
                    min="20"
                    max="300"
                    step="0.1"
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1B2A24]"
                    placeholder="60"
                  />
                </div>

                {/* Age */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-2">
                  <label htmlFor="age-input" className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <span>อายุ (ปี) *</span>
                  </label>
                  <input
                    id="age-input"
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1B2A24]"
                    placeholder="30"
                  />
                </div>

              </div>

              {/* Sex Segmented Pill Controls */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 space-y-2">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-700" />
                  <span>เพศสำหรับการประมวลผลพลังงาน (Biological Sex)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "male", label: "ชาย" },
                    { id: "female", label: "หญิง" },
                    { id: "unspecified", label: "ไม่ระบุ" },
                  ].map((g) => {
                    const active = gender === g.id;
                    return (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => setGender(g.id)}
                        className={cn(
                          "py-2.5 px-3 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer",
                          active
                            ? "bg-[#1B2A24] text-white border-[#1B2A24] shadow-2xs"
                            : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
                        )}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notice Footer Card */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-xs text-amber-900 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  ข้อมูลสัดส่วนและอายุจะถูกนำไปใช้ประมวลผลพลังงาน (kcal) และออกแบบเมนูอาหารที่เหมาะสมเท่านั้น จะไม่มีการแสดงผลต่อสาธารณะ
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: ความต้องการพักผ่อน & ความสนใจ */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <Activity className="w-5 h-5 text-emerald-700" />
                <h2 className="text-lg font-bold text-stone-900 font-serif">
                  Step 2: ความต้องการพักผ่อน & ความสนใจ (Rest & Interest)
                </h2>
              </div>

              {/* Goal Select Cards */}
              <div className="space-y-2.5">
                <label className="text-xs font-bold text-stone-700 block">
                  ทริปนี้ต้องการพักผ่อนแบบไหน? *
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {GOALS.map((g) => {
                    const active = goal === g.value;
                    return (
                      <div
                        key={g.value}
                        onClick={() => setGoal(g.value)}
                        className={cn(
                          "p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3",
                          active
                            ? "bg-[#FAF8F5] border-[#1B2A24] ring-1 ring-[#1B2A24]"
                            : "bg-white border-stone-200 hover:border-stone-300"
                        )}
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-stone-900 font-serif">
                            {g.label}
                          </p>
                          <p className="text-xs text-stone-500">{g.desc}</p>
                        </div>
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1",
                            active
                              ? "bg-[#1B2A24] border-[#1B2A24] text-white"
                              : "border-stone-300 bg-white"
                          )}
                        >
                          {active && <CheckCircle2 className="w-4 h-4 text-amber-300" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dietary Restrictions Interactive Cards */}
              <div className="space-y-2.5 pt-2">
                <label className="text-xs font-bold text-stone-700 block">
                  ความสนใจพิเศษเกี่ยวกับอาหาร (เลือกได้หลายข้อ)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DIET_OPTIONS.map((d) => {
                    const active = diet.includes(d.id);
                    return (
                      <div
                        key={d.id}
                        onClick={() =>
                          setDiet((prev) =>
                            prev.includes(d.id)
                              ? prev.filter((x) => x !== d.id)
                              : [...prev, d.id]
                          )
                        }
                        className={cn(
                          "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2",
                          active
                            ? "bg-[#1B2A24] text-white border-[#1B2A24] shadow-2xs"
                            : "bg-[#FAF8F5] text-stone-800 border-stone-200 hover:bg-stone-100"
                        )}
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold flex items-center gap-1.5">
                            <Flame className={cn("w-3.5 h-3.5", active ? "text-amber-300" : "text-amber-600")} />
                            <span>{d.label}</span>
                          </p>
                          <p className={cn("text-[11px]", active ? "text-stone-300" : "text-stone-500")}>
                            {d.tag}
                          </p>
                        </div>

                        <div
                          className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center shrink-0",
                            active
                              ? "bg-amber-400 border-amber-400 text-[#1B2A24]"
                              : "border-stone-300 bg-white"
                          )}
                        >
                          {active && <CheckCircle2 className="w-4 h-4 font-bold" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ตรวจสอบและส่งข้อมูล */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                <ClipboardCheck className="w-5 h-5 text-emerald-700" />
                <h2 className="text-lg font-bold text-stone-900 font-serif">
                  Step 3: ตรวจสอบและส่งข้อมูล (Review & Submit)
                </h2>
              </div>

              {/* Summary Display Panel */}
              <div className="rounded-2xl border border-stone-200 bg-[#FAF8F5]/60 p-5 space-y-4">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                  สรุปข้อมูลการประเมินของคุณ
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 space-y-1">
                    <span className="text-xs text-stone-400 font-semibold block">สัดส่วนร่างกาย</span>
                    <p className="text-sm font-bold text-stone-900">
                      {height} ซม. • {weight} กก. • อายุ {age} ปี ({gender === "male" ? "ชาย" : gender === "female" ? "หญิง" : "ไม่ระบุ"})
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 space-y-1">
                    <span className="text-xs text-stone-400 font-semibold block">เป้าหมายทริป</span>
                    <p className="text-sm font-bold text-stone-900 line-clamp-1">
                      {GOALS.find((g) => g.value === goal)?.label}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 space-y-1 sm:col-span-2">
                    <span className="text-xs text-stone-400 font-semibold block">ความสนใจอาหาร</span>
                    <p className="text-sm font-bold text-stone-900">
                      {diet.length > 0
                        ? diet.map((id) => DIET_OPTIONS.find((d) => d.id === id)?.label).join(", ")
                        : "ไม่มีข้อจำกัดพิเศษ"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Explicit Data Policy Consent Checkbox */}
              <label className="flex items-start gap-3 p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  required
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-stone-300 text-[#1B2A24] focus:ring-[#1B2A24]"
                />
                <span className="text-xs text-stone-800 font-medium leading-relaxed">
                  ยินยอมให้ประมวลผลข้อมูลข้างต้นเพื่อรับคำแนะนำการท่องเที่ยวที่เหมาะกับคุณ (ข้อมูลจะถูกใช้เฉพาะการแนะนำทริปภายในแพลตฟอร์มเท่านั้น)
                </span>
              </label>

              {mutation.isError && (
                <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
                  {extractErrorMessage(mutation.error)}
                </p>
              )}
            </div>
          )}

          {/* Page Actions (Button Bar) */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100 gap-4">
            {step > 0 ? (
              <button
                type="button"
                disabled={mutation.isPending}
                onClick={() => setStep(step - 1)}
                className="px-5 py-3 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับ</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={mutation.isPending || (step === 2 && !consent)}
              className="bg-[#1B2A24] hover:bg-stone-800 text-white px-6 py-3.5 rounded-xl font-bold text-xs shadow-sm transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 ml-auto"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 text-amber-300" />
                  <span>กำลังออกแบบทริป...</span>
                </>
              ) : step === 2 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  <span>ส่งข้อมูลและออกแบบทริปสุขภาพ</span>
                </>
              ) : (
                <>
                  <span>ถัดไป</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
