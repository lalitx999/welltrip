"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Compass,
  Flower2,
  Heart,
  HeartPulse,
  HelpCircle,
  Hotel,
  House,
  Leaf,
  LogOut,
  MapPin,
  Menu,
  Newspaper,
  Receipt,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  User,
  UserRound,
  Users,
  Utensils,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useCartStore } from "@/store/cart-store";
import styles from "./travel.module.css";

export function useTravelCopy() {
  const { locale } = useI18n();
  return (th: string, en: string) => (locale === "th" ? th : en);
}

export function TravelShell({ children }: { children: React.ReactNode }) {
  const copy = useTravelCopy();
  const pathname = usePathname();
  const { status, user, logout } = useAuth();
  const count = useCartStore((s) => s.itemCount);
  const [panel, setPanel] = useState<"explore" | "account" | null>(null);
  const header = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const authenticated = status === "authenticated";

  const links = [
    { href: "/home", label: copy("หน้าหลัก", "Home"), icon: Compass },
    { href: "/hotels", label: copy("ที่พักชุมชน", "Places to stay"), icon: House },
    { href: "/foods", label: copy("อาหารสุขภาพ", "Local dining"), icon: Utensils },
    { href: "/wellness", label: copy("นวดและกิจกรรม", "Wellness & activities"), icon: Flower2 },
    { href: "/health", label: copy("ประเมินสุขภาพ", "Wellness assessment"), icon: Leaf },
    { href: "/recommended", label: copy("แนะนำสำหรับคุณ", "For you"), icon: Sprout },
    { href: "/otop", label: copy("ของดีชุมชน", "Local treasures"), icon: ShoppingBag },
    { href: "/news", label: copy("ข่าวและกิจกรรม", "Stories & events"), icon: Newspaper },
    { href: "/community", label: copy("รู้จักชุมชน", "Meet the community"), icon: Users },
  ];

  useEffect(() => {
    setPanel(null);
  }, [pathname]);

  useEffect(() => {
    if (!panel) return;
    const menu = document.getElementById(`travel-${panel}-menu`);
    menu?.querySelector<HTMLElement>("a,button")?.focus();

    function closeOutside(event: PointerEvent) {
      const target = event.target as HTMLElement;
      if (!header.current?.contains(target) && !target.closest("[data-travel-toggle]")) {
        setPanel(null);
      }
    }

    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPanel(null);
        trigger.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", escape);
    };
  }, [panel]);

  function toggle(next: "explore" | "account", button: HTMLButtonElement) {
    trigger.current = button;
    setPanel((previous) => (previous === next ? null : next));
  }

  const active = (href: string) =>
    pathname === href || (href !== "/home" && pathname.startsWith(href + "/"));

  const isVendor =
    user &&
    ["HOMESTAY_OWNER", "RESTAURANT_OWNER", "WELLNESS_OWNER", "OTOP_OWNER", "SUPER_ADMIN"].includes(
      user.role
    );

  return (
    <div className={`${styles.shell} wt-tourist`}>
      <a className={styles.skip} href="#travel-main">
        {copy("ข้ามไปเนื้อหา", "Skip to content")}
      </a>

      {/* Glassmorphism Luxury Header */}
      <header ref={header} className={styles.header}>
        <div className={styles.topbar}>
          {/* Brand Logo & Subtitle */}
          <Link href="/home" className={styles.brand} aria-label="WellTrip home">
            <img
              src="/logoWelltrip.jpg"
              alt="WellTrip Logo"
              className="w-7 h-7 rounded-full object-cover border border-[#D97706]/30 shadow-2xs"
            />
            <span>
              WellTrip
              <small className="text-[8px] tracking-[1.8px] font-bold text-[#D97706]">SLOW DAYS · SISAKET</small>
            </span>
          </Link>

          {/* Primary Navigation Links */}
          <nav className={styles.desktopNav} aria-label={copy("เมนูหลัก", "Main navigation")}>
            <button
              data-travel-toggle
              aria-expanded={panel === "explore"}
              aria-controls="travel-explore-menu"
              onClick={(e) => toggle("explore", e.currentTarget)}
              className="flex items-center gap-1 hover:text-stone-900 transition-colors"
            >
              <span>{copy("สำรวจศรีสะเกษ", "Explore Sisaket")}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            {links
              .filter((x) => ["/hotels", "/foods", "/wellness", "/otop"].includes(x.href))
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active(item.href) ? "page" : undefined}
                  className="hover:text-stone-900 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
          </nav>

          {/* Right Action Group */}
          <div className={styles.headerActions}>
            {/* Desktop Only Actions: Language Toggle & Account Button */}
            <div className="hidden lg:flex items-center gap-2">
              <LanguageToggle />
              <button
                className="rounded-full border border-stone-200/90 px-3.5 py-1.5 flex items-center gap-2 hover:shadow-sm hover:border-stone-300 transition-all cursor-pointer bg-white text-stone-800 text-xs font-semibold"
                data-travel-toggle
                aria-expanded={panel === "account"}
                aria-controls="travel-account-menu"
                onClick={(e) => toggle("account", e.currentTarget)}
              >
                <User className="w-4 h-4 text-stone-600" />
                <span>
                  {authenticated
                    ? user?.first_name || user?.username || copy("บัญชี", "Account")
                    : copy("บัญชี", "Account")}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>
            </div>

            {/* Cart Button */}
            <Link
              href="/cart"
              className={styles.iconButton}
              aria-label={copy(`ตะกร้า ${count} รายการ`, `Cart, ${count} items`)}
            >
              <ShoppingBag size={19} aria-hidden="true" />
              {count > 0 && <span className={styles.badge}>{count > 99 ? "99+" : count}</span>}
            </Link>

            {/* Mobile Menu Button */}
            <button
              className={`${styles.iconButton} ${styles.mobileMenu}`}
              data-travel-toggle
              aria-expanded={panel === "explore"}
              aria-controls="travel-explore-menu"
              aria-label={copy("เปิดเมนูสำรวจ", "Open explore menu")}
              onClick={(e) => toggle("explore", e.currentTarget)}
            >
              {panel === "explore" ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* High-End 2-Column Desktop & Responsive Mobile Mega Menu */}
        <div
          id="travel-explore-menu"
          className={`${styles.menuPanel} w-[calc(100vw-1.5rem)] max-w-5xl mx-auto inset-x-0 overflow-x-hidden`}
          hidden={panel !== "explore"}
        >
          <div className="max-w-6xl mx-auto py-4 sm:py-6 px-4 sm:px-8 space-y-6">
            
            {/* Top Bar inside Menu */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1B2A24] uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#D97706]" />
                <span>{copy("สัมผัสเสน่ห์ศรีสะเกษในแบบของคุณ", "Experience Sisaket Charm Your Way")}</span>
              </div>
              <button
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#1B2A24] hover:text-white flex items-center justify-center text-[#1B2A24] transition-all"
                aria-label={copy("ปิดเมนู", "Close menu")}
                onClick={() => {
                  setPanel(null);
                  trigger.current?.focus();
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Content Grid (8 cols left / 4 cols right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch text-left">
              
              {/* LEFT AREA (8/12 Cols) - Categorized Navigation Links */}
              <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Column A: บริการและผลิตภัณฑ์ชุมชน */}
                <div className="space-y-3">
                  <span className="block text-xs font-bold text-[#D97706] uppercase tracking-wider px-2">
                    {copy("บริการและผลิตภัณฑ์ชุมชน", "Services & Local Goods")}
                  </span>
                  <div className="space-y-1">
                    <Link
                      href="/hotels"
                      onClick={() => setPanel(null)}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-100/70 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-[#1B2A24] group-hover:text-white transition-colors">
                        <Hotel className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-[#1B2A24] group-hover:text-[#D97706] transition-colors">
                          {copy("ที่พักชุมชน", "Eco Homestays")}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {copy("โฮมสเตย์เรือนไม้และวิถีชุมชน 4 ชนเผ่า", "Wooden homestays & 4 ethnic cultures")}
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/foods"
                      onClick={() => setPanel(null)}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-100/70 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-[#1B2A24] group-hover:text-white transition-colors">
                        <UtensilsCrossed className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-[#1B2A24] group-hover:text-[#D97706] transition-colors">
                          {copy("อาหารพื้นถิ่นเพื่อสุขภาพ", "Healthy Local Dining")}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {copy("วัตถุดิบออร์แกนิก โซเดียมต่ำ หวานน้อย", "Organic low-sodium dishes")}
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/wellness"
                      onClick={() => setPanel(null)}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-100/70 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-[#1B2A24] group-hover:text-white transition-colors">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-[#1B2A24] group-hover:text-[#D97706] transition-colors">
                          {copy("นวดและหัตถการสมุนไพร", "Herbal Massage & Spa")}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {copy("ศาสตร์บำบัดกล้ามเนื้อและผ่อนคลายจิตใจ", "Traditional herbal muscle therapy")}
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/otop"
                      onClick={() => setPanel(null)}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-100/70 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-[#1B2A24] group-hover:text-white transition-colors">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-[#1B2A24] group-hover:text-[#D97706] transition-colors">
                          {copy("ของดีศรีสะเกษ (OTOP)", "Sisaket OTOP Treasures")}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {copy("ผ้าทอย้อมคราม สมุนไพรแปรรูปแท้", "Woven fabrics & organic coffee")}
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Column B: กิจกรรมและวิถีธรรมชาติ */}
                <div className="space-y-3">
                  <span className="block text-xs font-bold text-[#D97706] uppercase tracking-wider px-2">
                    {copy("กิจกรรมและวิถีธรรมชาติ", "Experiences & Discovery")}
                  </span>
                  <div className="space-y-1">
                    <Link
                      href="/health"
                      onClick={() => setPanel(null)}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-100/70 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center shrink-0 group-hover:bg-[#1B2A24] group-hover:text-white transition-colors">
                        <HeartPulse className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-[#1B2A24] group-hover:text-[#D97706] transition-colors">
                          {copy("ประเมินสุขภาพ (AI Wellness)", "AI Health Assessment")}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {copy("วิเคราะห์เป้าหมายสุขภาพและจัดทริปเฉพาะบุคคล", "Personalized health trip curator")}
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/recommended"
                      onClick={() => setPanel(null)}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-100/70 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center shrink-0 group-hover:bg-[#1B2A24] group-hover:text-white transition-colors">
                        <Compass className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-[#1B2A24] group-hover:text-[#D97706] transition-colors">
                          {copy("แนะนำสำหรับคุณ", "Curated For You")}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {copy("เส้นทางท่องเที่ยวคัดสรรประจำฤดูกาล", "Seasonal handpicked eco routes")}
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/community"
                      onClick={() => setPanel(null)}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-100/70 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center shrink-0 group-hover:bg-[#1B2A24] group-hover:text-white transition-colors">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-[#1B2A24] group-hover:text-[#D97706] transition-colors">
                          {copy("รู้จักชุมชนและมรดกท้องถิ่น", "Meet Local Community")}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {copy("เรื่องราวประเพณีและผู้ผลิตชุมชน", "Stories of 13 OTOP villages")}
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/news"
                      onClick={() => setPanel(null)}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-100/70 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center shrink-0 group-hover:bg-[#1B2A24] group-hover:text-white transition-colors">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-serif text-sm font-bold text-[#1B2A24] group-hover:text-[#D97706] transition-colors">
                          {copy("ข่าวสารและกิจกรรมชุมชน", "Stories & Events")}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {copy("เวิร์กช็อปเก็บสมุนไพรและงานประเพณี", "Sound of Sisaket 2026 calendar")}
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>

              </div>

              {/* RIGHT AREA (4/12 Cols) - Featured Destination Showcase Card */}
              <div className="lg:col-span-4">
                <Link
                  href="/hotels"
                  onClick={() => setPanel(null)}
                  className="relative rounded-2xl overflow-hidden shadow-md group border border-slate-200/80 min-h-[280px] h-full flex flex-col justify-end p-6 text-white text-left block"
                >
                  {/* Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                    style={{
                      backgroundImage: "url('/banner1.jpeg')",
                    }}
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1B2A24] via-[#1B2A24]/40 to-transparent" />

                  {/* Badge at Top */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-black/60 backdrop-blur-md border border-[#D97706]/60 text-[#D97706] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {copy("ไฮไลต์ประจำสัปดาห์", "Weekly Highlight")}
                    </span>
                  </div>

                  {/* Card Content at Bottom */}
                  <div className="relative z-10 space-y-1">
                    <h4 className="font-serif text-base font-bold text-white leading-tight">
                      {copy("สัมผัสลมหนาว ผามออีแดง & วิถีโฮมสเตย์บ้านสร้างเรือง", "Pha Mo E-Daeng & Ban Sang Rueang Homestay")}
                    </h4>
                    <p className="text-xs text-slate-200 font-normal leading-relaxed">
                      {copy("แพ็กเกจสุขภาพ 2 วัน 1 คืน สำหรับการชาร์จพลังชีวิต", "2D1N wellness package for life recharge")}
                    </p>
                    <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-[#D97706] group-hover:text-white transition-colors">
                      <span>{copy("สำรวจโปรแกรมนี้", "Explore this trip")}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              </div>

            </div>

          </div>
        </div>

        {/* Modern Compact Account Dropdown Popover */}
        <div
          id="travel-account-menu"
          className="absolute right-4 sm:right-8 top-full mt-2 w-64 rounded-2xl bg-white shadow-xl border border-stone-100 p-2.5 z-50 text-left animate-in fade-in-0 zoom-in-95"
          hidden={panel !== "account"}
        >
          {/* Top Welcome / User Section */}
          <div className="p-3 border-b border-stone-100 mb-1">
            {authenticated ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1B2A24] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {user?.first_name?.[0] || user?.username?.[0] || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-sm font-bold text-[#1B2A24] truncate">
                      {[user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
                        user?.username ||
                        copy("นักท่องเที่ยว", "Tourist")}
                    </p>
                    <p className="text-[11px] text-stone-400 truncate">{user?.email}</p>
                  </div>
                </div>
                {user?.role && (
                  <span className="inline-block text-[10px] font-bold text-[#D97706] bg-amber-50 border border-[#D97706]/30 px-2 py-0.5 rounded-full mt-1">
                    {user.role === "SUPER_ADMIN"
                      ? copy("ผู้ดูแลระบบสูงสุด", "Super Admin")
                      : isVendor
                      ? copy("ผู้ประกอบการชุมชน", "Vendor / Host")
                      : copy("นักท่องเที่ยว WellTrip", "WellTrip Member")}
                  </span>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-serif text-sm font-bold text-[#1B2A24]">
                  {copy("ยินดีต้อนรับสู่ WellTrip", "Welcome to WellTrip")}
                </p>
                <p className="text-[11px] text-stone-500 leading-tight">
                  {copy("เข้าสู่ระบบเพื่อจัดการทริปและการจองของคุณ", "Sign in to manage your trips and bookings")}
                </p>
                <Link
                  className="bg-[#1B2A24] text-white rounded-xl py-2.5 px-4 text-xs font-semibold w-full text-center hover:bg-[#151d1a] transition-colors block"
                  href="/login"
                  onClick={() => setPanel(null)}
                >
                  {copy("เข้าสู่ระบบ / สมัครสมาชิก", "Sign in / Sign up")}
                </Link>
              </div>
            )}
          </div>

          {/* Menu Items Group */}
          <div className="space-y-0.5">
            <Link
              href="/profile"
              onClick={() => setPanel(null)}
              className="hover:bg-stone-50 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 flex items-center gap-2.5 transition-colors"
            >
              <UserRound className="w-4 h-4 text-[#D97706]" />
              <span>{copy("โปรไฟล์ส่วนตัว", "My Profile")}</span>
            </Link>

            <Link
              href="/my-bookings"
              onClick={() => setPanel(null)}
              className="hover:bg-stone-50 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 flex items-center gap-2.5 transition-colors"
            >
              <Receipt className="w-4 h-4 text-stone-500" />
              <span>{copy("การจองของฉัน", "My Bookings")}</span>
            </Link>

            <Link
              href="/recommended"
              onClick={() => setPanel(null)}
              className="hover:bg-stone-50 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 flex items-center gap-2.5 transition-colors"
            >
              <Heart className="w-4 h-4 text-stone-500" />
              <span>{copy("รายการที่บันทึกไว้", "Saved Trips")}</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setPanel(null)}
              className="hover:bg-stone-50 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 flex items-center gap-2.5 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4 text-stone-500" />
              <span>{copy("ตั้งค่าบัญชี", "Account Settings")}</span>
            </Link>

            <Link
              href="/help"
              onClick={() => setPanel(null)}
              className="hover:bg-stone-50 rounded-xl px-3 py-2 text-xs font-semibold text-stone-700 flex items-center gap-2.5 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-stone-500" />
              <span>{copy("ศูนย์ช่วยเหลือ", "Help & Support")}</span>
            </Link>

            {isVendor && (
              <Link
                href="/portal"
                onClick={() => setPanel(null)}
                className="hover:bg-amber-50 rounded-xl px-3 py-2 text-xs font-semibold text-[#D97706] flex items-center gap-2.5 transition-colors border-t border-stone-100 mt-1 pt-1"
              >
                <House className="w-4 h-4 text-[#D97706]" />
                <span>{copy("ศูนย์ผู้ประกอบการ", "Vendor Portal")}</span>
              </Link>
            )}
          </div>

          {/* Bottom Logged-in Section */}
          {authenticated && (
            <div className="border-t border-stone-100 mt-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  logout();
                  setPanel(null);
                }}
                className="w-full hover:bg-rose-50 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 flex items-center gap-2.5 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>{copy("ออกจากระบบ", "Log out")}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main id="travel-main" className={styles.main}>
        {children}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div>
            <Link href="/home" className={styles.brand}>
              <Sprout aria-hidden="true" />
              <span>
                WellTrip
                <small>SLOW DAYS · SISAKET</small>
              </span>
            </Link>
            <p>
              {copy(
                "เดินทางช้าลง รู้จักผู้คนมากขึ้น\nเติมความสุขให้ตัวเองและชุมชน",
                "Travel slower. Connect a little deeper.\nFind joy for yourself and the community."
              )}
            </p>
          </div>
          <div>
            <span className={styles.eyebrow}>{copy("ออกเดินทาง", "EXPLORE")}</span>
            <Link href="/hotels">{copy("ที่พักชุมชน", "Places to stay")}</Link>
            <Link href="/foods">{copy("อาหารพื้นถิ่น", "Local dining")}</Link>
            <Link href="/wellness">{copy("นวดและกิจกรรม", "Wellness & activities")}</Link>
          </div>
          <div>
            <span className={styles.eyebrow}>{copy("เชื่อมถึงชุมชน", "CONNECT")}</span>
            <Link href="/community">{copy("รู้จักชุมชน", "Our communities")}</Link>
            <Link href="/otop">{copy("ของดีชุมชน", "Local treasures")}</Link>
            <Link href="/news">{copy("ข่าวและกิจกรรม", "Stories & events")}</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} WellTrip</span>
          <span>
            <MapPin size={14} aria-hidden="true" />
            {copy("ศรีสะเกษ ประเทศไทย", "Sisaket, Thailand")}
          </span>
        </div>
      </footer>

      <nav className={styles.bottomNav} aria-label={copy("เมนูมือถือ", "Mobile navigation")}>
        <Link href="/home" aria-current={active("/home") ? "page" : undefined}>
          <Compass aria-hidden="true" />
          <span>{copy("หน้าหลัก", "Home")}</span>
        </Link>
        <button
          data-travel-toggle
          aria-expanded={panel === "explore"}
          aria-controls="travel-explore-menu"
          onClick={(e) => toggle("explore", e.currentTarget)}
        >
          <Leaf aria-hidden="true" />
          <span>{copy("สำรวจ", "Explore")}</span>
        </button>
        <Link href="/my-bookings" aria-current={active("/my-bookings") ? "page" : undefined}>
          <Receipt aria-hidden="true" />
          <span>{copy("การจอง", "Bookings")}</span>
        </Link>
        <Link href="/cart" aria-current={active("/cart") ? "page" : undefined}>
          <span className={styles.cartIcon}>
            <ShoppingBag aria-hidden="true" />
            {count > 0 && <i className={styles.badge}>{count > 99 ? "99+" : count}</i>}
          </span>
          <span>{copy("ตะกร้า", "Cart")}</span>
        </Link>
        <button
          data-travel-toggle
          aria-expanded={panel === "account"}
          aria-controls="travel-account-menu"
          onClick={(e) => toggle("account", e.currentTarget)}
        >
          <UserRound aria-hidden="true" />
          <span>{copy("บัญชี", "Account")}</span>
        </button>
      </nav>
    </div>
  );
}
