"use client";

/**
 * DesktopSidebar.tsx - Mature Editorial Desktop Navigation Sidebar (>= 1024px).
 * Matching reference image: WellTrip Sidebar Dashboard
 */
import {
  Home,
  Hotel,
  UtensilsCrossed,
  Sparkles,
  ClipboardList,
  HeartHandshake,
  ShoppingBag,
  Newspaper,
  Users,
  User,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function DesktopSidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isVendor =
    user?.role &&
    ["HOMESTAY_OWNER", "RESTAURANT_OWNER", "WELLNESS_OWNER", "OTOP_OWNER", "SUPER_ADMIN"].includes(
      user.role,
    );

  const navItems = [
    { href: "/home", label: "หน้าหลัก", icon: Home },
    { href: "/hotels", label: "จองที่พัก", icon: Hotel },
    { href: "/foods", label: "จองอาหารสุขภาพ", icon: UtensilsCrossed },
    { href: "/wellness", label: "จองนวด/กิจกรรม", icon: Sparkles },
    { href: "/health", label: "ประเมินสุขภาพ", icon: ClipboardList },
    { href: "/recommended", label: "แนะนำสำหรับคุณ", icon: HeartHandshake },
    { href: "/otop", label: "สินค้า OTOP THAILAND", icon: ShoppingBag, isNew: true },
    { href: "/news", label: "ข่าวสาร/กิจกรรม", icon: Newspaper },
    { href: "/community", label: "ชุมชน/ผู้ให้บริการ", icon: Users },
    { href: "/profile", label: "โปรไฟล์", icon: User },
    { href: "/cart", label: "ข้อความ/ตะกร้า", icon: MessageSquare },
    { href: "/settings", label: "ตั้งค่า", icon: Settings },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/60 bg-card text-card-foreground lg:flex shadow-sm">
      {/* Brand Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
        <Link href="/home" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest-900 text-cream-100 font-bold shadow-sm">
            🌿
          </span>
          <div>
            <div className="flex items-center gap-1 font-serif text-lg font-bold tracking-tight text-forest-950">
              WellTrip
            </div>
            <p className="text-[10px] font-medium text-forest-800">
              เที่ยวดี สุขภาพดี รายได้สู่ชุมชน
            </p>
          </div>
        </Link>
        <button
          type="button"
          aria-label="Toggle menu"
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-cream-100/60"
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/home" && !item.href.includes("#") && pathname.startsWith(item.href));

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold tracking-wide transition-all duration-150",
                isActive
                  ? "bg-forest-100 text-forest-950 font-bold shadow-2xs border border-forest-800/10"
                  : "text-muted-foreground hover:bg-cream-100/50 hover:text-foreground",
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-forest-900" : "text-muted-foreground group-hover:text-foreground",
                  )}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </div>

              {item.isNew && (
                <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white shadow-2xs">
                  NEW
                </span>
              )}
            </Link>
          );
        })}

        {/* Vendor Portal Switcher if vendor */}
        {isVendor && (
          <div className="pt-3 mt-3 border-t border-border/60">
            <Link
              href="/portal"
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gold-600 hover:bg-gold-500/10 transition-all",
                pathname.startsWith("/portal") && "bg-gold-500/20 font-bold text-gold-700",
              )}
            >
              <span>ศูนย์จัดการผู้ประกอบการ</span>
            </Link>
          </div>
        )}
      </nav>

      {/* Logout Footer Button */}
      <div className="border-t border-border/60 p-3 bg-cream-50/40">
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
}

