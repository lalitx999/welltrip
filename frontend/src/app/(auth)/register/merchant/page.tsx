"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  Hotel,
  Image as ImageIcon,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  User,
  UtensilsCrossed,
} from "lucide-react";

import { apiRegisterMerchant, extractApiErrorMessage } from "@/lib/auth-api";
import { tokenManager } from "@/lib/token-manager";
import { useAuthStore } from "@/store/auth-store";

const CATEGORIES = [
  {
    id: "HOMESTAY",
    title: "โฮมสเตย์ / ที่พักชุมชน",
    subtitle: "รีสอร์ท บ้านพัก โฮมสเตย์เชิงนิเวศ",
    icon: Hotel,
  },
  {
    id: "RESTAURANT",
    title: "ร้านอาหารเพื่อสุขภาพ",
    subtitle: "อาหารออร์แกนิก อาหารพื้นบ้าน สมุนไพร",
    icon: UtensilsCrossed,
  },
  {
    id: "WELLNESS",
    title: "บริการสุขภาพ & สปา",
    subtitle: "นวดแผนไทย สปา นวดอโรมา วารีบำบัด",
    icon: Sparkles,
  },
  {
    id: "OTOP",
    title: "สินค้า OTOP ชุมชน",
    subtitle: "ของฝากชุมชน สมุนไพรแปรรูป หัตถกรรม",
    icon: ShoppingBag,
  },
];

export default function MerchantRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    business_name: "",
    business_category: "HOMESTAY",
    description: "",
    google_maps_url: "",
    opening_hours: "08:00 - 18:00 น.",
    cover_image_url: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategorySelect = (categoryId: string) => {
    setFormData({ ...formData, business_category: categoryId });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await apiRegisterMerchant(formData);
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
    <div className="min-h-screen bg-[#0d1f19] text-slate-100 relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Decorative Radial Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        {/* Top Navbar / Brand Link */}
        <div className="flex items-center justify-between border-b border-emerald-800/40 pb-6">
          <Link href="/home" className="flex items-center gap-3 group">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-700/80 text-amber-300 shadow-lg group-hover:scale-105 transition-transform">
              <Compass className="h-6 w-6" />
            </span>
            <div>
              <span className="font-serif text-xl font-bold tracking-tight text-emerald-50 block">
                WellTrip Thailand
              </span>
              <span className="text-xs text-emerald-400 font-medium tracking-wide">
                COMMUNITY WELLNESS NETWORK
              </span>
            </div>
          </Link>

          <Link
            href="/login"
            className="text-xs font-semibold text-amber-300 hover:text-amber-200 border border-amber-400/30 bg-amber-400/10 px-4 py-2 rounded-xl transition hover:bg-amber-400/20"
          >
            เข้าสู่ระบบผู้ประกอบการ
          </Link>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold text-amber-300 shadow-inner">
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span>WELLTRIP MERCHANT REGISTRATION</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-wide">
            เข้าร่วมเป็นผู้ประกอบการท่องเที่ยวเชิงสุขภาพ
          </h1>
          <p className="text-sm sm:text-base text-emerald-200/80 max-w-2xl mx-auto leading-relaxed">
            เปิดโอกาสให้ร้านค้า ที่พัก บริการสปา และผลิตภัณฑ์ชุมชนของคุณ เข้าถึงนักท่องเที่ยวเชิงสุขภาพทั่วประเทศ
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 flex items-start space-x-3 shadow-xl backdrop-blur-md">
            <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Business Category Selection (Visual Grid) */}
          <div className="bg-emerald-950/40 border border-emerald-800/50 backdrop-blur-md rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-emerald-800/40">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/10 text-amber-300 font-bold text-sm border border-amber-400/30">
                1
              </span>
              <div>
                <h2 className="font-serif text-lg font-bold text-white">
                  เลือกประเภทสถานประกอบการของคุณ
                </h2>
                <p className="text-xs text-emerald-300/70">
                  เลือกหมวดหมู่ที่ตรงกับธุรกิจหลักของร้านค้า
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = formData.business_category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all duration-200 ${
                      isSelected
                        ? "bg-emerald-800/60 border-amber-400/80 text-white shadow-lg ring-2 ring-amber-400/40"
                        : "bg-emerald-950/60 border-emerald-800/40 text-emerald-200/80 hover:bg-emerald-900/40 hover:border-emerald-700/60"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-xl shrink-0 ${
                        isSelected
                          ? "bg-amber-400 text-emerald-950 shadow-md"
                          : "bg-emerald-900/80 text-emerald-300"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>{cat.title}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        )}
                      </div>
                      <p className="text-xs text-emerald-300/70 leading-relaxed">
                        {cat.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Account & Personal Info */}
          <div className="bg-emerald-950/40 border border-emerald-800/50 backdrop-blur-md rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-emerald-800/40">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/10 text-amber-300 font-bold text-sm border border-amber-400/30">
                2
              </span>
              <div>
                <h2 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>ข้อมูลเจ้าของบัญชีผู้สมัคร</span>
                </h2>
                <p className="text-xs text-emerald-300/70">
                  สำหรับเข้าสู่ระบบและติดต่อประสานงาน
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-2">
                  ชื่อจริง *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-400/60" />
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="สมชาย"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-white placeholder-emerald-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-2">
                  นามสกุล *
                </label>
                <input
                  type="text"
                  name="last_name"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="ใจดี"
                  className="w-full px-4 py-3 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-white placeholder-emerald-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-2">
                  อีเมล (สำหรับใช้เข้าสู่ระบบ) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-400/60" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="merchant@welltrip.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-white placeholder-emerald-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-2">
                  เบอร์โทรศัพท์ติดต่อ *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-400/60" />
                  <input
                    type="tel"
                    name="phone_number"
                    required
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="0812345678"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-white placeholder-emerald-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-2">
                  รหัสผ่าน (อย่างน้อย 8 ตัวอักษร) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-400/60" />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-white placeholder-emerald-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Detailed Business Info */}
          <div className="bg-emerald-950/40 border border-emerald-800/50 backdrop-blur-md rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-emerald-800/40">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-400/10 text-amber-300 font-bold text-sm border border-amber-400/30">
                3
              </span>
              <div>
                <h2 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>ข้อมูลรายละเอียดร้านค้า & สถานประกอบการ</span>
                </h2>
                <p className="text-xs text-emerald-300/70">
                  ระบุรายละเอียดที่จะแสดงในหน้าค้นหานักท่องเที่ยว
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-2">
                  ชื่อร้าน / สถานประกอบการ *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-400/60" />
                  <input
                    type="text"
                    name="business_name"
                    required
                    value={formData.business_name}
                    onChange={handleChange}
                    placeholder="เช่น โฮมสเตย์เรือนไม้โบราณ เชียงใหม่"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-white placeholder-emerald-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-2">
                  เวลาทำการ
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-400/60" />
                  <input
                    type="text"
                    name="opening_hours"
                    value={formData.opening_hours}
                    onChange={handleChange}
                    placeholder="08:00 - 18:00 น. (เปิดทุกวัน)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-white placeholder-emerald-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-2">
                  รายละเอียดร้านค้า / สโลแกน / ไฮไลท์บริการ
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-400/60" />
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="อธิบายจุดเด่น บรรยากาศ บริการ หรือเมนูแนะนำ..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-white placeholder-emerald-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-2">
                    ลิงก์แผนที่ Google Maps (Share Link)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-400/60" />
                    <input
                      type="url"
                      name="google_maps_url"
                      value={formData.google_maps_url}
                      onChange={handleChange}
                      placeholder="https://maps.app.goo.gl/..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-white placeholder-emerald-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-2">
                    ลิงก์รูปภาพหน้าร้าน (Cover Image URL)
                  </label>
                  <div className="relative">
                    <ImageIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-400/60" />
                    <input
                      type="url"
                      name="cover_image_url"
                      value={formData.cover_image_url}
                      onChange={handleChange}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-white placeholder-emerald-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-sm transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Notice Banner & Action Button */}
          <div className="space-y-6 pt-2">
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 backdrop-blur-md flex items-start gap-4 text-amber-200 text-xs sm:text-sm leading-relaxed">
              <ShieldCheck className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300 block text-sm mb-0.5">
                  ขั้นตอนการอนุมัติร้านค้า (Approval Workflow)
                </span>
                เมื่อส่งข้อมูลสำเร็จ บัญชีจะได้รับการลงทะเบียนในสถานะ{" "}
                <strong className="text-amber-300">อยู่ระหว่างการตรวจสอบ (PENDING)</strong>{" "}
                โดยระบบจะส่งอีเมลแจ้งผู้ดูแลระบบ (คุณพรหมลิขิต) ทันที ท่านสามารถเข้าสู่ระบบ Dashboard เพื่อจัดการเตรียมความพร้อมร้านค้าได้ล่วงหน้า
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-emerald-950 font-bold text-base shadow-xl shadow-amber-500/20 transition duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 hover:scale-[1.01]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-950" />
                  <span>กำลังลงทะเบียนข้อมูลร้านค้า...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-950" />
                  <span>ส่งใบสมัครลงทะเบียนร้านค้า WellTrip</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
