"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, ShieldCheck, Star, Store, UserRound } from "lucide-react";
import { TravelShell, useTravelCopy } from "@/components/travel/travel-shell";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const copy = useTravelCopy();

  const isRegistration = pathname.includes("register");
  const isMerchantRoute = pathname === "/register/merchant" || pathname === "/login/merchant";
  const isCallback = pathname === "/callback/google";

  const heroImageSrc = isRegistration ? "/register.jpeg" : "/login.jpeg";

  return (
    <TravelShell>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-12 min-h-[82vh] flex items-center justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 w-full rounded-3xl sm:rounded-[2.5rem] overflow-hidden bg-white border border-slate-200/80 shadow-xl items-stretch">
          
          {/* Left Column: Travilla Hero Showcase Banner (Visible on Desktop) */}
          <div className="hidden lg:flex lg:col-span-5 relative text-[#faf9f6] p-8 sm:p-12 flex-col justify-between overflow-hidden min-h-[540px]">
            {/* Bright, Full-Color Background Photo */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-500 scale-105"
              style={{
                backgroundImage: `url('${heroImageSrc}')`,
              }}
            />
            {/* Thin Dark Gradient Overlay for High Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/60" />

            {/* Top Eyebrow Badge */}
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#c49a45]/80 bg-black/50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#c49a45] backdrop-blur-md shadow-sm">
                <MapPin size={13} />
                <span>WELLTRIP SISAKET</span>
              </div>
              <h2 className="font-serif text-3xl font-bold leading-tight text-white drop-shadow-md whitespace-pre-line">
                {isRegistration
                  ? copy("ให้ทริปครั้งใหม่\nพาคุณใกล้ธรรมชาติ", "Let a new journey\nbring you closer to nature")
                  : copy("ทริปที่ดีต่อใจ\nเริ่มได้อีกครั้งที่นี่", "Your next slow journey\nstarts here")}
              </h2>
            </div>

            {/* Bottom Quote & Trust Badges */}
            <div className="relative z-10 space-y-4 pt-8">
              <p className="text-sm text-white/95 leading-relaxed italic drop-shadow-sm bg-black/40 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                {copy(
                  "“สัมผัสวิถีชีวิตโฮมสเตย์ธรรมชาติ อาหารสุขภาพออร์แกนิก และบริการสปาประคบสมุนไพรไทย”",
                  "“Experience organic homestays, wellness herbs, and Sisaket local hospitality.”"
                )}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#c49a45]">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md">
                  <Star size={12} className="text-[#c49a45] fill-[#c49a45]" />
                  <span>4.9 / 5 (12,000+ รีวิว)</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-white/20 text-white backdrop-blur-md">
                  <ShieldCheck size={12} className="text-[#c49a45]" />
                  <span>ความปลอดภัย 100%</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Mobile-Optimized Auth Form Container */}
          <div className="lg:col-span-7 p-5 sm:p-10 lg:p-12 flex flex-col justify-center bg-[#faf9f6]/50">
            {/* Mobile Hero Image Banner */}
            <div className="lg:hidden relative h-44 -mx-5 -mt-5 sm:-mx-10 sm:-mt-10 mb-6 overflow-hidden rounded-b-3xl">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url('${heroImageSrc}')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/60" />
              <div className="absolute bottom-3 left-4 right-4 text-white z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-[#c49a45]/60 text-[10px] font-bold text-[#c49a45] backdrop-blur-md">
                  <MapPin size={12} />
                  <span>WELLTRIP SISAKET</span>
                </span>
              </div>
            </div>

            {!isCallback && (
              <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
                {/* Role Switcher Tabs (Full width on Mobile) */}
                <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-2xl w-full sm:w-fit text-xs font-bold text-center">
                  <Link
                    href={isRegistration ? "/register" : "/login"}
                    className={`inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl transition-all ${
                      !isMerchantRoute
                        ? "bg-[#1f2925] text-[#faf9f6] shadow-sm"
                        : "text-slate-600 hover:text-[#1f2925]"
                    }`}
                  >
                    <UserRound size={14} />
                    <span>{copy("นักท่องเที่ยว", "Tourist")}</span>
                  </Link>
                  <Link
                    href={isRegistration ? "/register/merchant" : "/login/merchant"}
                    className={`inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl transition-all ${
                      isMerchantRoute
                        ? "bg-[#1f2925] text-[#faf9f6] shadow-sm"
                        : "text-slate-600 hover:text-[#1f2925]"
                    }`}
                  >
                    <Store size={14} />
                    <span>{copy("ผู้ประกอบการ", "Merchant / Host")}</span>
                  </Link>
                </div>

                <div>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[#c49a45]">
                    {isMerchantRoute
                      ? "MERCHANT PORTAL AUTH"
                      : isRegistration
                      ? "BEGIN YOUR JOURNEY"
                      : "WELCOME BACK"}
                  </span>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1f2925] mt-0.5 sm:mt-1">
                    {isMerchantRoute
                      ? isRegistration
                        ? copy("ลงทะเบียนผู้ประกอบการ", "Register Host Account")
                        : copy("เข้าสู่ระบบผู้ประกอบการ", "Merchant Sign In")
                      : isRegistration
                      ? copy("สร้างบัญชีนักท่องเที่ยวใหม่", "Create Tourist Account")
                      : copy("ยินดีต้อนรับกลับมา", "Sign In to WellTrip")}
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    {isMerchantRoute
                      ? copy("จัดการที่พัก ร้านอาหาร สปา และสินค้า OTOP ของคุณ", "Manage your stays, dining, spa services, and products")
                      : isRegistration
                      ? copy("ลงทะเบียนเพื่อบันทึกทริปในดวงใจและติดตามสถานะการจอง", "Sign up to save favorite stays and manage bookings")
                      : copy("เข้าสู่ระบบเพื่อจัดการข้อมูลบัญชีและการจองของคุณ", "Sign in to access your bookings and profile")}
                  </p>
                </div>
              </div>
            )}

            <div className="w-full">{children}</div>
          </div>

        </div>
      </div>
    </TravelShell>
  );
}
