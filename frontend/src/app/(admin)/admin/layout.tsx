"use client";

/**
 * (admin)/admin/layout.tsx - System Admin Shell Layout with Eco-Premium styling.
 * Role Protection: Guarded for SUPER_ADMIN and COMMUNITY_ADMIN only.
 * Strict Zero-Emoji Policy: Lucide icons only.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  LayoutDashboard,
  Users,
  CheckSquare,
  Receipt,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";

import { LanguageToggle } from "@/components/ui/language-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

const ADMIN_ROLES: readonly UserRole[] = ["SUPER_ADMIN", "COMMUNITY_ADMIN"] as const;

interface NavigationItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavigationItem[] = [
  { href: "/admin", label: "ภาพรวมระบบ & สถิติ", icon: LayoutDashboard },
  { href: "/admin/users", label: "จัดการผู้ใช้ & ผู้ประกอบการ", icon: Users },
  { href: "/admin/approvals", label: "อนุมัติรายการ & สถานที่", icon: CheckSquare },
  { href: "/admin/payments", label: "ตรวจสอบการชำระเงิน", icon: Receipt },
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

  useEffect(() => {
    if (status === "guest") {
      router.replace("/login");
    } else if (status === "authenticated" && role && !ADMIN_ROLES.includes(role)) {
      router.replace("/portal");
    }
  }, [status, role, router]);

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-cream-50 font-serif text-sm text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <ShieldCheck className="h-12 w-12 text-destructive" aria-hidden="true" />
        <h1 className="font-serif text-xl font-bold text-foreground">
          ไม่มีสิทธิ์เข้าถึงระบบผู้ดูแลระบบ (Access Denied)
        </h1>
        <p className="max-w-md text-xs text-muted-foreground">
          ระบบนี้สงวนสิทธิ์เฉพาะผู้ดูแลระบบกลาง (System Administrator) เท่านั้น
        </p>
        <Link
          href="/portal"
          className="rounded-xl bg-forest-900 px-6 py-2.5 text-xs font-semibold text-cream-100 shadow-md transition-all hover:bg-forest-800"
        >
          กลับสู่ศูนย์ผู้ประกอบการ (Vendor Portal)
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur shadow-xs">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>

            <Link
              href="/admin"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest-900 text-cream-100 shadow-sm">
                <Compass className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-serif text-lg font-bold tracking-tight text-forest-950">
                WellTrip
              </span>
            </Link>
            <span className="hidden rounded-full border border-gold-500/40 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-700 sm:inline-block">
              System Admin Console
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            <button
              type="button"
              onClick={() => logout()}
              className="hidden items-center gap-1.5 rounded-xl border border-border/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-all hover:bg-muted hover:text-foreground sm:flex"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row">
        {/* Sidebar Navigation */}
        <nav
          aria-label="Admin Navigation"
          className={cn(
            "sticky top-16 z-30 border-b border-border/60 bg-card px-4 py-3 lg:top-16 lg:w-64 lg:shrink-0 lg:flex-col lg:justify-start lg:border-b-0 lg:border-r lg:bg-transparent lg:px-6 lg:py-8",
            mobileMenuOpen ? "flex flex-col gap-2" : "hidden lg:flex"
          )}
        >
          <div className="mb-4 hidden px-3 lg:block">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              ผู้ดูแลระบบกลาง
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-forest-900">
              {user?.first_name ? `${user.first_name} ${user.last_name || ""}` : user?.email}
            </p>
            <span className="mt-1 inline-block rounded-md bg-forest-900/10 px-2 py-0.5 text-[10px] font-bold text-forest-900">
              {role}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center justify-between rounded-xl px-4 text-xs font-semibold tracking-wide transition-all",
                    active
                      ? "bg-forest-900 text-cream-100 shadow-sm"
                      : "text-muted-foreground hover:bg-cream-100/50 hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{label}</span>
                  </div>
                  {active && <ChevronRight className="hidden h-3.5 w-3.5 text-gold-400 lg:block" />}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 border-t border-border/60 pt-4 lg:hidden">
            <button
              type="button"
              onClick={() => logout()}
              className="flex w-full items-center gap-2 rounded-xl border border-border/80 px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </nav>

        {/* Page Content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
