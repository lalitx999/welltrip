"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Store,
} from "lucide-react";

import { apiLogin, extractApiErrorMessage } from "@/lib/auth-api";
import { tokenManager } from "@/lib/token-manager";
import { useAuthStore } from "@/store/auth-store";

export default function MerchantLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await apiLogin(email, password);
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
    <div className="max-w-md mx-auto space-y-8 py-6">
      {/* Editorial Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#d8ddce] bg-[#edf0e3] px-3.5 py-1 text-xs font-semibold text-[#224e39]">
          <Store className="w-3.5 h-3.5 text-[#224e39]" />
          <span>WELLTRIP MERCHANT PORTAL</span>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-[#193e30] tracking-tight">
          เข้าสู่ระบบผู้ประกอบการ
        </h1>
        <p className="text-sm text-[#657468] leading-relaxed">
          เข้าสู่ศูนย์จัดการร้านค้า ที่พัก บริการสปา และรายการสินค้าของคุณ
        </p>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Login Form Card */}
      <div className="bg-[#fffdf8] border border-[#dfe2d5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#193e30] mb-1.5">
              อีเมลผู้ประกอบการ *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#657468]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="merchant@welltrip.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#ffffff] border border-[#d8ddce] text-[#193e30] placeholder-[#a3a3a3] text-sm focus:outline-none focus:ring-2 focus:ring-[#224e39] focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#193e30]">
                รหัสผ่าน *
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#657468]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#ffffff] border border-[#d8ddce] text-[#193e30] placeholder-[#a3a3a3] text-sm focus:outline-none focus:ring-2 focus:ring-[#224e39] focus:border-transparent transition"
              />
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
                <span>กำลังเข้าสู่ระบบ...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>เข้าสู่ระบบศูนย์จัดการร้านค้า</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#e1e2d8] space-y-3 text-center text-xs text-[#657468]">
          <div>
            ยังไม่ได้ลงทะเบียนร้านค้า?{" "}
            <Link
              href="/register/merchant"
              className="font-semibold text-[#224e39] hover:underline inline-flex items-center gap-1 ml-1"
            >
              <span>ลงทะเบียนผู้ประกอบการใหม่</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="text-[#657468] hover:text-[#193e30] underline underline-offset-4"
            >
              เข้าสู่ระบบสำหรับนักท่องเที่ยว (User Login)
            </Link>
          </div>
        </div>
      </div>

      {/* Helper Info Note */}
      <div className="rounded-2xl border border-[#d8ddce] bg-[#edf0e3] p-4 flex items-center gap-3 text-[#224e39] text-xs leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-[#224e39] shrink-0" />
        <span>
          หากคุณลงทะเบียนแล้วและอยู่ในสถานะ <strong>PENDING</strong> สามารถเข้าสู่ระบบเพื่อเตรียมข้อมูลร้านค้าระหว่างรอการอนุมัติได้เช่นกัน
        </span>
      </div>
    </div>
  );
}
