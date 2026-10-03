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
  Image as ImageIcon,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Store,
  User,
} from "lucide-react";

import { apiRegisterMerchant, extractApiErrorMessage } from "@/lib/auth-api";
import { tokenManager } from "@/lib/token-manager";
import { useAuthStore } from "@/store/auth-store";

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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 text-teal-700 mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            ลงทะเบียนร้านค้า & ผู้ประกอบการ
          </h1>
          <p className="mt-2 text-slate-600">
            เข้าร่วมเป็นส่วนหนึ่งของเครือข่ายท่องเที่ยวเชิงสุขภาพ WellTrip Thailand
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 border border-slate-100 space-y-8"
        >
          {/* Section 1: Account Information */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center space-x-2">
              <User className="w-5 h-5 text-teal-600" />
              <span>1. ข้อมูลผู้ใช้และบัญชีเข้าใช้</span>
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ชื่อจริง *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="เช่น สมชาย"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  นามสกุล *
                </label>
                <input
                  type="text"
                  name="last_name"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="เช่น ใจดี"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  อีเมล (สำหรับเข้าสู่ระบบ) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  รหัสผ่าน *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="tel"
                    name="phone_number"
                    required
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="0812345678"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Business Details */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              <span>2. ข้อมูลร้านค้าและสถานประกอบการ</span>
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ชื่อร้าน / สถานประกอบการ *
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    name="business_name"
                    required
                    value={formData.business_name}
                    onChange={handleChange}
                    placeholder="เช่น โฮมสเตย์สวนลุงพรหม เชียงใหม่"
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ประเภทธุรกิจ *
                  </label>
                  <select
                    name="business_category"
                    value={formData.business_category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm bg-white"
                  >
                    <option value="HOMESTAY">โฮมสเตย์ / ที่พักชุมชน</option>
                    <option value="RESTAURANT">ร้านอาหารเพื่อสุขภาพ</option>
                    <option value="WELLNESS">บริการสุขภาพ & สปา</option>
                    <option value="OTOP">สินค้า OTOP ชุมชน</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    เวลาทำการ
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      name="opening_hours"
                      value={formData.opening_hours}
                      onChange={handleChange}
                      placeholder="08:00 - 18:00 น."
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  รายละเอียดร้านค้า / บริการ
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <textarea
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="อธิบายจุดเด่นของร้าน บริการ หรือบรรยากาศ..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ลิงก์แผนที่ Google Maps (Share URL)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="url"
                    name="google_maps_url"
                    value={formData.google_maps_url}
                    onChange={handleChange}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  ลิงก์รูปภาพหน้าร้าน / Cover Image URL
                </label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="url"
                    name="cover_image_url"
                    value={formData.cover_image_url}
                    onChange={handleChange}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notice & Submit */}
          <div className="pt-4 border-t border-slate-100">
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-800 mb-6 flex items-start space-x-2">
              <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <span>
                เมื่อลงทะเบียนเรียบร้อย บัญชีร้านค้าของคุณจะเข้าสู่สถานะ <strong>อยู่ระหว่างการตรวจสอบ (PENDING)</strong> โดยผู้ดูแลระบบจะส่งการแจ้งเตือนทางอีเมลเพื่อทำการยืนยันสิทธิ์
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 text-white font-medium shadow-md transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>กำลังส่งข้อมูลลงทะเบียน...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>ยื่นสมัครลงทะเบียนร้านค้า</span>
                </>
              )}
            </button>
          </div>

          <div className="text-center text-sm text-slate-500 pt-2">
            มีบัญชีผู้ประกอบการแล้ว?{" "}
            <Link href="/login" className="text-teal-600 font-medium hover:underline">
              เข้าสู่ระบบ
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
