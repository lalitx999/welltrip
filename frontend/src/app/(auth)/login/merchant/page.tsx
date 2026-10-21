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
    <div className="space-y-6">
      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <span className="text-xs font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Login Form Card */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#1f2925] mb-1.5">
            อีเมลผู้ประกอบการ *
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="merchant@welltrip.com"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-300 text-[#1f2925] placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#1f2925] focus:border-transparent transition"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-[#1f2925]">
              รหัสผ่าน *
            </label>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-300 text-[#1f2925] placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-[#1f2925] focus:border-transparent transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl bg-[#1f2925] hover:bg-[#2b3832] text-[#faf9f6] font-bold text-xs shadow-md transition duration-150 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>กำลังเข้าสู่ระบบ...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#c49a45]" />
              <span>เข้าสู่ระบบศูนย์จัดการร้านค้า</span>
            </>
          )}
        </button>
      </form>

      <div className="pt-4 border-t border-slate-200 space-y-3 text-center text-xs text-slate-500">
        <div>
          ยังไม่ได้ลงทะเบียนร้านค้า?{" "}
          <Link
            href="/register/merchant"
            className="font-semibold text-[#1f2925] hover:text-[#c49a45] hover:underline inline-flex items-center gap-1 ml-1"
          >
            <span>ลงทะเบียนผู้ประกอบการใหม่</span>
            <ArrowRight className="w-3 h-3 text-[#c49a45]" />
          </Link>
        </div>
      </div>

      {/* Helper Info Note */}
      <div className="rounded-2xl border border-[#c49a45]/30 bg-[#1f2925]/5 p-4 flex items-center gap-3 text-[#1f2925] text-xs leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-[#c49a45] shrink-0" />
        <span>
          หากคุณลงทะเบียนแล้วและอยู่ในสถานะ <strong>PENDING</strong> สามารถเข้าสู่ระบบเพื่อเตรียมข้อมูลร้านค้าระหว่างรอการอนุมัติได้เช่นกัน
        </span>
      </div>
    </div>
  );
}
