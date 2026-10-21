"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Hotel,
  Info,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShoppingBag,
  Sparkles,
  Store,
  User,
  UtensilsCrossed,
  KeyRound,
} from "lucide-react";

import {
  apiRegisterMerchant,
  apiRequestEmailOtp,
  apiVerifyEmailOtp,
  extractApiErrorMessage,
} from "@/lib/auth-api";
import { tokenManager } from "@/lib/token-manager";
import { useAuthStore } from "@/store/auth-store";

const CATEGORIES = [
  {
    id: "HOMESTAY",
    title: "โฮมสเตย์ / ที่พักชุมชน",
    subtitle: "บ้านพัก ที่พักนิเวศ รีสอร์ทชุมชน",
    icon: Hotel,
  },
  {
    id: "RESTAURANT",
    title: "ร้านอาหารเพื่อสุขภาพ",
    subtitle: "อาหารออร์แกนิก สมุนไพร อาหารพื้นบ้าน",
    icon: UtensilsCrossed,
  },
  {
    id: "WELLNESS",
    title: "บริการสุขภาพ & สปา",
    subtitle: "นวดแผนไทย สปาอโรมา วารีบำบัด",
    icon: Sparkles,
  },
  {
    id: "OTOP",
    title: "สินค้า OTOP ชุมชน",
    subtitle: "สินค้าชุมชน ผลิตภัณฑ์สมุนไพร หัตถกรรม",
    icon: ShoppingBag,
  },
];

export default function MerchantRegisterPage() {
  const router = useRouter();

  // 3-Step Wizard state: 1 | 2 | 3
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    business_name: "",
    business_category: "HOMESTAY",
    description: "",
    opening_hours: "08:00 - 18:00 น.",
  });

  // OTP states
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpMessage, setOtpMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // OTP countdown effect
  React.useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // If email changes, reset OTP verification state
    if (name === "email" && isOtpVerified) {
      setIsOtpVerified(false);
      setIsOtpSent(false);
      setOtpCode("");
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setFormData({ ...formData, business_category: categoryId });
  };

  const handleRequestOtp = async () => {
    const email = formData.email.trim();
    if (!email || !email.includes("@")) {
      setOtpMessage({ type: "error", text: "โปรดระบุอีเมลที่ถูกต้องก่อนขอรหัส OTP" });
      return;
    }

    setOtpMessage(null);
    setIsSendingOtp(true);
    try {
      const res = await apiRequestEmailOtp(email, "MERCHANT_REGISTER");
      setIsOtpSent(true);
      setOtpCountdown(60);
      setOtpMessage({ type: "success", text: res.message || "ส่งรหัส OTP ไปยังอีเมลเรียบร้อยแล้ว" });
    } catch (err: unknown) {
      setOtpMessage({ type: "error", text: extractApiErrorMessage(err) });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.trim();
    if (code.length !== 6) {
      setOtpMessage({ type: "error", text: "โปรดระบุรหัส OTP ให้ครบ 6 หลัก" });
      return;
    }

    setOtpMessage(null);
    setIsVerifyingOtp(true);
    try {
      const res = await apiVerifyEmailOtp(formData.email.trim(), code, "MERCHANT_REGISTER");
      setIsOtpVerified(true);
      setOtpMessage({ type: "success", text: res.message || "ยืนยันรหัส OTP สำเร็จเรียบร้อยแล้ว" });
    } catch (err: unknown) {
      setOtpMessage({ type: "error", text: extractApiErrorMessage(err) });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 2 Validation Check: requires email OTP to be verified
  const isStep2Valid =
    formData.first_name.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.phone_number.trim() !== "" &&
    formData.password.trim() !== "" &&
    isOtpVerified;

  // Step 3 Validation Check
  const isStep3Valid = formData.business_name.trim() !== "" && termsAccepted;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep3Valid) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await apiRegisterMerchant({
        ...formData,
        otp_code: otpCode.trim(),
      });
      tokenManager.setTokens({
        access_token: res.access_token,
        refresh_token: res.refresh_token,
      });
      useAuthStore.getState().setSession(res.user);
      router.push("/portal");
    } catch (err: unknown) {
      setErrorMsg(extractApiErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 3-Step Horizontal Stepper Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between max-w-md mx-auto relative">
          {/* Progress Connecting Line */}
          <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
          <div
            className="absolute top-1/2 left-8 -translate-y-1/2 h-0.5 bg-[#1B2A24] transition-all duration-300 -z-0"
            style={{
              width: step === 1 ? "0%" : step === 2 ? "50%" : "100%",
            }}
          />

          {/* Step 1 Indicator */}
          <div className="flex flex-col items-center relative z-10 space-y-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center border-2 transition-all ${
                step === 1
                  ? "bg-[#1B2A24] text-white border-[#1B2A24] shadow-md scale-105"
                  : step > 1
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-slate-100 text-slate-400 border-slate-200"
              }`}
            >
              {step > 1 ? <Check className="w-4 h-4" /> : "1"}
            </button>
            <span
              className={`text-[11px] font-bold ${
                step === 1 ? "text-[#1B2A24]" : "text-slate-500"
              }`}
            >
              ประเภทธุรกิจ
            </span>
          </div>

          {/* Step 2 Indicator */}
          <div className="flex flex-col items-center relative z-10 space-y-1">
            <button
              type="button"
              onClick={() => {
                if (formData.business_category) setStep(2);
              }}
              className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center border-2 transition-all ${
                step === 2
                  ? "bg-[#1B2A24] text-white border-[#1B2A24] shadow-md scale-105"
                  : step > 2
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-slate-100 text-slate-400 border-slate-200"
              }`}
            >
              {step > 2 ? <Check className="w-4 h-4" /> : "2"}
            </button>
            <span
              className={`text-[11px] font-bold ${
                step === 2 ? "text-[#1B2A24]" : "text-slate-500"
              }`}
            >
              บัญชีผู้ใช้
            </span>
          </div>

          {/* Step 3 Indicator */}
          <div className="flex flex-col items-center relative z-10 space-y-1">
            <button
              type="button"
              onClick={() => {
                if (isStep2Valid) setStep(3);
              }}
              className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center border-2 transition-all ${
                step === 3
                  ? "bg-[#1B2A24] text-white border-[#1B2A24] shadow-md scale-105"
                  : "bg-slate-100 text-slate-400 border-slate-200"
              }`}
            >
              3
            </button>
            <span
              className={`text-[11px] font-bold ${
                step === 3 ? "text-[#1B2A24]" : "text-slate-500"
              }`}
            >
              ข้อมูลร้านค้า
            </span>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <span className="text-xs font-medium">{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: เลือกประเภทสถานประกอบการ */}
      {step === 1 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-6 shadow-sm animate-in fade-in duration-200">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#1B2A24]">
              เลือกประเภทสถานประกอบการของคุณ
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              ระบุหมวดหมู่ธุรกิจของคุณเพื่อจัดสรรเครื่องมือการจัดการที่เหมาะสม
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = formData.business_category === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all duration-200 relative ${
                    isSelected
                      ? "border-2 border-[#1B2A24] bg-amber-50/50 text-[#1B2A24] shadow-sm"
                      : "border-slate-200/80 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl shrink-0 ${
                      isSelected
                        ? "bg-[#1B2A24] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="space-y-0.5 pr-6">
                    <h3 className="font-bold text-xs text-[#1B2A24]">
                      {cat.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {cat.subtitle}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="absolute top-3.5 right-3.5 p-1 rounded-full bg-[#1B2A24] text-white">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-xl bg-[#1B2A24] text-white text-xs font-bold hover:bg-[#151d1a] transition-all flex items-center gap-2 shadow-xs"
            >
              <span>ถัดไป: ข้อมูลเจ้าของบัญชี</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: ข้อมูลเจ้าของบัญชี */}
      {step === 2 && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-6 shadow-sm animate-in fade-in duration-200">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#1B2A24]">
              ข้อมูลเจ้าของบัญชีผู้ลงทะเบียน
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              กรอกข้อมูลส่วนตัวสำหรับเข้าสู่ระบบและติดต่อประสานงานแอดมิน
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#1B2A24] mb-1">
                  ชื่อจริง *
                </label>
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="เช่น สมชาย"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-semibold text-[#1B2A24] outline-none focus:ring-2 focus:ring-[#D97706]/20"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1B2A24] mb-1">
                  นามสกุล
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="เช่น ใจดี"
                  className="w-full p-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-semibold text-[#1B2A24] outline-none focus:ring-2 focus:ring-[#D97706]/20"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-[#1B2A24]">
                  อีเมล (สำหรับเข้าสู่ระบบและรับข้อมูล) *
                </label>
                {isOtpVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="w-3 h-3" />
                    ยืนยันตัวตนแล้ว
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    disabled={isOtpVerified || isSendingOtp}
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-semibold text-[#1B2A24] outline-none focus:ring-2 focus:ring-[#D97706]/20 disabled:opacity-75"
                  />
                </div>
                <button
                  type="button"
                  disabled={!formData.email.includes("@") || otpCountdown > 0 || isSendingOtp || isOtpVerified}
                  onClick={handleRequestOtp}
                  className="px-4 py-3 rounded-xl bg-[#D97706] text-white text-xs font-bold hover:bg-[#b86504] transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {isSendingOtp ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : otpCountdown > 0 ? (
                    <span>ขอใหม่ ({otpCountdown}s)</span>
                  ) : isOtpVerified ? (
                    <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> ยืนยันแล้ว</span>
                  ) : (
                    <span>ขอรหัส OTP</span>
                  )}
                </button>
              </div>

              {/* OTP Status Feedback Message */}
              {otpMessage && (
                <div
                  className={`mt-2 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                    otpMessage.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {otpMessage.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  )}
                  <span>{otpMessage.text}</span>
                </div>
              )}

              {/* OTP 6-Digit Verification Box */}
              {isOtpSent && !isOtpVerified && (
                <div className="mt-2.5 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1B2A24] text-[11px]">
                      กรอกรหัส OTP 6 หลักที่ส่งไปที่ {formData.email}
                    </span>
                    <span className="text-[10px] text-amber-800 font-medium">รหัสหมดอายุใน 10 นาที</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-amber-300 bg-white font-mono text-sm tracking-widest font-bold text-[#1B2A24] outline-none focus:ring-2 focus:ring-[#D97706]/30 text-center"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={otpCode.length !== 6 || isVerifyingOtp}
                      onClick={handleVerifyOtp}
                      className="px-5 py-2.5 rounded-xl bg-[#1B2A24] text-white text-xs font-bold hover:bg-[#151d1a] transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      {isVerifyingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>ยืนยันรหัส</span>}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-[#1B2A24] mb-1">
                เบอร์โทรศัพท์ติดต่อ *
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  name="phone_number"
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="081-234-5678"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-semibold text-[#1B2A24] outline-none focus:ring-2 focus:ring-[#D97706]/20"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1B2A24] mb-1">
                รหัสผ่าน *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="กำหนดรหัสผ่านอย่างน้อย 8 ตัวอักษร"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-semibold text-[#1B2A24] outline-none focus:ring-2 focus:ring-[#D97706]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ย้อนกลับ</span>
            </button>

            <button
              type="button"
              disabled={!isStep2Valid}
              onClick={() => {
                if (isStep2Valid) setStep(3);
              }}
              className={`px-6 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                isStep2Valid
                  ? "bg-[#1B2A24] text-white hover:bg-[#151d1a] shadow-xs"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <span>ถัดไป: ข้อมูลร้านค้า</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ข้อมูลสถานประกอบการเบื้องต้น & Submit */}
      {step === 3 && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-6 shadow-sm animate-in fade-in duration-200"
        >
          <div>
            <h2 className="font-serif text-lg font-bold text-[#1B2A24]">
              ข้อมูลสถานประกอบการเบื้องต้น
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              กรอกข้อมูลชื่อร้านและเวลาเปิดให้บริการเบื้องต้น
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[#1B2A24] mb-1">
                ชื่อร้าน / สถานประกอบการ *
              </label>
              <div className="relative">
                <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="business_name"
                  required
                  value={formData.business_name}
                  onChange={handleChange}
                  placeholder="เช่น บ้านสวนโฮมสเตย์ ศรีสะเกษ"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-semibold text-[#1B2A24] outline-none focus:ring-2 focus:ring-[#D97706]/20"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1B2A24] mb-1">
                เวลาทำการเปิดให้บริการ
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="opening_hours"
                  value={formData.opening_hours}
                  onChange={handleChange}
                  placeholder="เช่น 08:00 - 18:00 น. หรือ เปิดบริการทุกวัน 24 ชม."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-semibold text-[#1B2A24] outline-none focus:ring-2 focus:ring-[#D97706]/20"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#1B2A24] mb-1">
                รายละเอียดสั้นๆ / จุดเด่นของสถานประกอบการ
              </label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="บอกเล่าไฮไลต์ความโดดเด่นของบริการ หรือบรรยากาศชุมชน..."
                className="w-full p-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs outline-none focus:ring-2 focus:ring-[#D97706]/20"
              />
            </div>

            {/* Helpful Notice Box (Replacing URL inputs) */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                รูปภาพปกหน้าร้านและอัลบั้มบริการ สามารถอัปโหลดเพิ่มเติมได้อย่างง่ายดายผ่านหน้าจัดการโปรไฟล์ร้านค้าของคุณหลังลงทะเบียนสำเร็จ
              </p>
            </div>

            {/* Terms Consent Checkbox */}
            <div className="pt-2 flex items-center gap-2.5">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#1B2A24] focus:ring-0 cursor-pointer"
              />
              <label htmlFor="terms" className="font-semibold text-slate-700 cursor-pointer text-xs">
                ฉันยอมรับ <span className="underline text-[#1B2A24]">ข้อตกลงเงื่อนไข</span> และนโยบายความเป็นส่วนตัวของ WellTrip
              </label>
            </div>
          </div>

          {/* Final Submit & Navigation Controls */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับ</span>
              </button>

              <button
                type="submit"
                disabled={isLoading || !isStep3Valid}
                className={`flex-1 py-3.5 px-6 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 ${
                  isStep3Valid && !isLoading
                    ? "bg-[#1B2A24] hover:bg-[#151d1a] text-white"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#D97706]" />
                    <span>กำลังลงทะเบียน...</span>
                  </>
                ) : (
                  <>
                    <span>ยืนยันลงทะเบียนร้านค้า WellTrip</span>
                    <ArrowRight className="w-4 h-4 text-[#D97706]" />
                  </>
                )}
              </button>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/login/merchant"
                className="text-xs font-bold text-slate-600 hover:text-[#1B2A24] underline transition-colors"
              >
                มีบัญชีผู้ประกอบการแล้ว? เข้าสู่ระบบที่นี่
              </Link>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
