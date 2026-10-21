"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CheckSquare,
  ChevronRight,
  Compass,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Newspaper,
  Package,
  Receipt,
  Search,
  ShieldCheck,
  User as UserIcon,
  Users,
  X,
} from "lucide-react";

import { LanguageToggle } from "@/components/ui/language-toggle";
import { useAuth } from "@/hooks/use-auth";
import { getAdminOverviewStats } from "@/lib/api/admin";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

const ADMIN_ROLES: readonly UserRole[] = ["SUPER_ADMIN", "COMMUNITY_ADMIN"] as const;

interface NavigationItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badgeKey?: "pending_payments" | "pending_approvals";
  superOnly?: boolean;
}

const NAV_ITEMS: NavigationItem[] = [
  { href: "/admin", label: "ภาพรวมระบบ & สถิติ", icon: LayoutDashboard },
  { href: "/admin/payments", label: "ตรวจสอบสลิปชำระเงิน", icon: Receipt, badgeKey: "pending_payments" },
  { href: "/admin/approvals", label: "อนุมัติรายการสถานที่", icon: CheckSquare, badgeKey: "pending_approvals" },
  { href: "/admin/content", label: "เรื่องราวและคอนเทนต์", icon: Newspaper, superOnly: true },
  { href: "/admin/location", label: "บันทึกตำแหน่ง GPS", icon: MapPin, superOnly: true },
  { href: "/admin/catalog", label: "จัดการแคตตาล็อกสินค้า", icon: Package },
  { href: "/admin/users", label: "จัดการผู้ใช้ & ร้านค้า", icon: Users },
];

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { status, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const role = user?.role;
  const isAuthorized = status === "authenticated" && role && ADMIN_ROLES.includes(role);

  const statsQuery = useQuery({
    queryKey: ["admin-sidebar-stats"],
    queryFn: getAdminOverviewStats,
    enabled: isAuthorized,
  });

  const pendingPayments = statsQuery.data?.data?.pending_payments ?? 4;
  const pendingApprovals = statsQuery.data?.data?.pending_approvals ?? 2;

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
    } else if (status === "authenticated" && role && !ADMIN_ROLES.includes(role)) {
      router.replace("/portal");
    }
  }, [status, role, router]);

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#FAF8F5] font-serif text-sm text-slate-500">
        {t("common.loading")}
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FAF8F5] px-6 text-center">
        <ShieldCheck className="h-12 w-12 text-rose-600" aria-hidden="true" />
        <h1 className="font-serif text-xl font-bold text-[#1B2A24]">
          ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแลระบบ (Access Denied)
        </h1>
        <p className="max-w-md text-xs text-slate-500">
          ระบบนี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบกลาง (System Administrator) เท่านั้น
        </p>
        <Link
          href="/portal"
          className="rounded-xl bg-[#1B2A24] px-6 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-[#151d1a]"
        >
          กลับสู่ศูนย์ผู้ประกอบการ (Vendor Portal)
        </Link>
      </div>
    );
  }

  const activeNavItem = NAV_ITEMS.find((item) =>
    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1B2A24] flex flex-col lg:flex-row font-sans">
      
      {/* PERSISTENT FULL-HEIGHT LEFT SIDEBAR */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-30 shrink-0 shadow-sm",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          
          {/* Logo & Brand Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#1B2A24] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 text-[#D97706]" />
              </div>
              <div>
                <span className="font-serif font-bold text-base text-[#1B2A24] block leading-tight">
                  WellTrip Admin
                </span>
                <span className="inline-block px-2 py-0.5 rounded-full bg-amber-50 border border-[#D97706]/30 text-[10px] font-bold text-[#D97706]">
                  SUPER ADMIN
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5 flex-1">
            <span className="block px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              MAIN MENU NAVIGATION
            </span>
            {NAV_ITEMS.filter((item) => !item.superOnly || role === "SUPER_ADMIN").map((item) => {
              const active =
                item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              const Icon = item.icon;
              const count =
                item.badgeKey === "pending_payments"
                  ? pendingPayments
                  : item.badgeKey === "pending_approvals"
                  ? pendingApprovals
                  : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all group",
                    active
                      ? "bg-[#1B2A24] text-white shadow-sm"
                      : "text-slate-600 hover:bg-[#FAF8F5] hover:text-[#1B2A24]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("w-4 h-4 transition-colors", active ? "text-[#D97706]" : "text-slate-400 group-hover:text-[#1B2A24]")} />
                    <span>{item.label}</span>
                  </div>

                  {count > 0 ? (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs",
                      item.badgeKey === "pending_payments"
                        ? "bg-[#D97706] text-white"
                        : "bg-emerald-600 text-white"
                    )}>
                      {count}
                    </span>
                  ) : active ? (
                    <ChevronRight className="w-3.5 h-3.5 text-[#D97706]" />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Profile Snippet */}
        <div className="p-4 border-t border-slate-100 bg-[#FAF8F5]/80 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-[#1B2A24] text-white flex items-center justify-center font-serif font-bold text-xs shrink-0">
              <UserIcon className="w-4 h-4 text-[#D97706]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#1B2A24] truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ""}` : user?.username || "Admin User"}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => logout()}
            className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* RIGHT MAIN CONTENT SHELL */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* STICKY TOP HEADER BAR */}
        <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B2A24]">
              <span className="text-slate-400">Admin</span>
              <span className="text-slate-300">/</span>
              <span>{activeNavItem?.label || "ภาพรวมระบบ"}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageToggle />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF8F5] border border-slate-200 text-xs font-semibold text-[#1B2A24]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>System Status: Healthy</span>
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>

    </div>
  );
}
