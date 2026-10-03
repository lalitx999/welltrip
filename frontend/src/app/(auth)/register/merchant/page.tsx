"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
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
    <div className="space-y-8 py-4">
      {/* Editorial Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#d8ddce] bg-[#edf0e3] px-3.5 py-1 text-xs font-semibold text-[#224e39]">
          <Store className="w-3.5 h-3.5 text-[#224e39]" />
          <span>WELLTRIP MERCHANT PARTNER</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#193e30] tracking-tight">
          ลงทะเบียนผู้ประกอบการท่องเที่ยวเชิงสุขภาพ
        </h1>
        <p className="text-sm sm:text-base text-[#657468] max-w-2xl mx-auto leading-relaxed">
          ร่วมนำเสนอร้านค้า ที่พัก บริการสปา และผลิตภัณฑ์ชุมชนสู่กลุ่มนักท่องเที่ยวเชิงสุขภาพของ WellTrip Thailand
        </p>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Category Selection Cards */}
        <div className="bg-[#fffdf8] border border-[#dfe2d5] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-[#e1e2d8]">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#224e39] text-[#fffdf5] font-bold text-sm">
              1
            </span>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#193e30]">
                เลือกประเภทสถานประกอบการของคุณ
              </h2>
              <p className="text-xs text-[#657468]">
                ระบุหมวดหมู่ธุรกิจเพื่อจัดหมวดหมู่บริการในระบบ
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = formData.business_category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategorySelect(cat.id)}
                  className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all duration-150 ${
                    isSelected
                      ? "bg-[#224e39] border-[#173a29] text-[#fffdf5] shadow-md"
                      : "bg-[#ffffff] border-[#dfe2d5] text-[#193e30] hover:border-[#668164] hover:bg-[#fbfcf8]"
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl shrink-0 ${
                      isSelected
                        ? "bg-[#ffffff]/15 text-[#fffdf5]"
                        : "bg-[#edf0e3] text-[#224e39]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-medium text-sm flex items-center justify-between gap-2">
                      <span>{cat.title}</span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#c5a059]" />
                      )}
                    </div>
                    <p
                      className={`text-xs leading-relaxed ${
                        isSelected ? "text-[#fffdf5]/80" : "text-[#657468]"
                      }`}
                    >
                      {cat.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Account Owner Info */}
        <div className="bg-[#fffdf8] border border-[#dfe2d5] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-[#e1e2d8]">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#224e39] text-[#fffdf5] font-bold text-sm">
              2
            </span>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#193e30] flex items-center gap-2">
                <User className="w-4 h-4 text-[#224e39]" />
                <span>ข้อมูลเจ้าของบัญชีผู้สมัคร</span>
              </h2>
              <p className="text-xs text-[#657468]">
                ข้อมูลส่วนตัวสำหรับลงทะเบียนเข้าสู่ระบบและติดต่อประสานงาน
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#193e30] mb-1.5">
                ชื่อจริง *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-[#657468]" />
                <input
                  type="text"
                  name="first_name"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="สมชาย"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#ffffff] border border-[#d8ddce] text-[#193e30] placeholder-[#a3a3a3] text-sm focus:outline-none focus:ring-2 focus:ring-[#224e39] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#193e30] mb-1.5">
                นามสกุล *
              </label>
              <input
                type="text"
                name="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
                placeholder="ใจดี"
                className="w-full px-4 py-3 rounded-xl bg-[#ffffff] border border-[#d8ddce] text-[#193e30] placeholder-[#a3a3a3] text-sm focus:outline-none focus:ring-2 focus:ring-[#224e39] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#193e30] mb-1.5">
                อีเมล (สำหรับใช้เข้าสู่ระบบ) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#657468]" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="merchant@welltrip.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#ffffff] border border-[#d8ddce] text-[#193e30] placeholder-[#a3a3a3] text-sm focus:outline-none focus:ring-2 focus:ring-[#224e39] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#193e30] mb-1.5">
                เบอร์โทรศัพท์ติดต่อ *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-[#657468]" />
                <input
                  type="tel"
                  name="phone_number"
                  required
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="0812345678"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#ffffff] border border-[#d8ddce] text-[#193e30] placeholder-[#a3a3a3] text-sm focus:outline-none focus:ring-2 focus:ring-[#224e39] focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#193e30] mb-1.5">
                รหัสผ่าน (อย่างน้อย 8 ตัวอักษร) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#657468]" />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="อย่างน้อย 8 ตัวอักษร"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#ffffff] border border-[#d8ddce] text-[#193e30] placeholder-[#a3a3a3] text-sm focus:outline-none focus:ring-2 focus:ring-[#224e39] focus:border-transparent transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Business Details */}
        <div className="bg-[#fffdf8] border border-[#dfe2d5] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-[#e1e2d8]">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#224e39] text-[#fffdf5] font-bold text-sm">
              3
            </span>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-[#193e30] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#224e39]" />
                <span>ข้อมูลรายละเอียดสถานประกอบการ</span>
              </h2>
              <p className="text-xs text-[#657468]">
                ข้อมูลที่จะนำไปแสดงในหน้ารายละเอียดสำหรับนักท่องเที่ยว
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#193e30] mb-1.5">
                ชื่อร้าน / สถานประกอบการ *
              </label>
              <div className="relative">
                <Store className="w-4 h-4 absolute left-3.5 top-3.5 text-[#657468]" />
                <input
                  type="text"
                  name="business_name"
                  required
                  value={formData.business_name}
                  onChange={handleChange}
                  placeholder="เช่น โฮมสเตย์เรือนไม้โบราณ"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#ffffff] border border-[#d8ddce] text-[#193e30] placeholder-[#a3a3a3] text-sm focus:outline-none focus:ring-2 focus:ring-[#224e39] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#193e30] mb-1.5">
                เวลาทำการ
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#657468]" />
                <input
                  type="text"
                  name="opening_hours"
                  value={formData.opening_hours}
                  onChange={handleChange}
                  placeholder="08:00 - 18:00 น. (เปิดทุกวัน)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#ffffff] border border-[#d8ddce] text-[#193e30] placeholder-[#a3a3a3] text-sm focus:outline-none focus:ring-2 focus:ring-[#224e39] focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#193e30] mb-1.5">
                รายละเอียดร้านค้า / บริการ / ไฮไลท์
              </label>
              <div className="relative">
                <FileText className="w-4 h-4 absolute left-3.5 top-3.5 text-[#657468]" />
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="อธิบายจุดเด่นของร้าน บรรยากาศ บริการ หรือสินค้า..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#ffffff] border border-[#d8ddce] text-[#193e30] placeholder-[#a3a3a3] text-sm focus:outline-none focus:ring-2 focus:ring-[#224e39] focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#193e30] mb-1.5">
                  ลิงก์แผนที่ Google Maps (Share URL)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-[#657468]" />
                  <input
                    type="url"
                    name="google_maps_url"
                    value={formData.google_maps_url}
                    onChange={handleChange}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#ffffff] border border-[#d8ddce] text-[#193e30] placeholder-[#a3a3a3] text-sm focus:outline-none focus:ring-2 focus:ring-[#224e39] focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#193e30] mb-1.5">
                  ลิงก์รูปภาพหน้าร้าน (Cover Image URL)
                </label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-[#657468]" />
                  <input
                    type="url"
                    name="cover_image_url"
                    value={formData.cover_image_url}
                    onChange={handleChange}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#ffffff] border border-[#d8ddce] text-[#193e30] placeholder-[#a3a3a3] text-sm focus:outline-none focus:ring-2 focus:ring-[#224e39] focus:border-transparent transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Info Banner & Action Button */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#d8ddce] bg-[#edf0e3] p-5 flex items-start gap-3.5 text-[#224e39] text-xs sm:text-sm leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-[#224e39] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-[#193e30] mb-0.5">
                ขั้นตอนการตรวจสอบและอนุมัติบัญชีร้านค้า
              </span>
              เมื่อยื่นสมัครสำเร็จ บัญชีร้านค้าของคุณจะเข้าสู่สถานะ{" "}
              <strong>อยู่ระหว่างการตรวจสอบ (PENDING)</strong>{" "}
              โดยระบบจะส่งอีเมลแจ้งเตือนผู้ดูแลระบบ (คุณพรหมลิขิต) ทันที ท่านสามารถเข้าสู่ระบบ Dashboard เพื่อจัดการเตรียมข้อมูลล่วงหน้าได้ทันที
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-xl bg-[#224e39] hover:bg-[#173a29] text-[#fffdf5] font-serif font-bold text-base shadow-sm transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังยื่นข้อมูลลงทะเบียน...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>ยื่นสมัครลงทะเบียนร้านค้า WellTrip</span>
              </>
            )}
          </button>
        </div>

        <div className="text-center text-sm text-[#657468]">
          มีบัญชีผู้ประกอบการแล้ว?{" "}
          <Link href="/login" className="font-medium text-[#224e39] underline-offset-4 hover:underline">
            เข้าสู่ระบบที่นี่
          </Link>
        </div>
      </form>
    </div>
  );
}
