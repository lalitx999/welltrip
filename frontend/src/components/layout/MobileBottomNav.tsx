"use client";

/**
 * MobileBottomNav.tsx - Sleek Bottom Navigation Bar (< 1024px).
 *
 * Theme: Community Eco-Premium
 * Background: Warm Linen White (#FFFFFF / #FAF8F5) with top border (#E8E4DD)
 * Active indicator: Deep Forest Green (#1B3B2B) & Muted Gold (#C5A059)
 */
import {
  Compass,
  Hotel,
  Package,
  Receipt,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

export function MobileBottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.itemCount);

  const tabs = [
    { href: "/home", label: t("nav.explore"), icon: Compass },
    { href: "/hotels", label: t("nav.hotels"), icon: Hotel },
    { href: "/foods", label: "Foods", icon: UtensilsCrossed },
    { href: "/wellness", label: "Spa", icon: Sparkles },
    { href: "/otop", label: "OTOP", icon: Package },
    { href: "/my-bookings", label: t("nav.orders"), icon: Receipt },
    { href: "/cart", label: t("nav.cart"), icon: ShoppingBag, badge: itemCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-[#E8E4DD] bg-[#FAF8F5]/95 px-2 backdrop-blur-md lg:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          pathname === tab.href ||
          (tab.href !== "/home" && pathname.startsWith(tab.href));

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative flex flex-col items-center justify-center py-1 text-center transition-colors min-w-[44px]",
              isActive ? "text-[#1B3B2B]" : "text-[#7A736C] hover:text-[#1B3B2B]",
            )}
          >
            <div className="relative">
              <Icon
                className={cn(
                  "h-5 w-5 transition-transform",
                  isActive ? "scale-110 text-[#1B3B2B]" : "text-[#7A736C]",
                )}
                strokeWidth={isActive ? 2 : 1.75}
                aria-hidden="true"
              />
              {Boolean(tab.badge) && tab.badge! > 0 && (
                <span className="absolute -right-2 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-[#C5A059] px-1 text-[9px] font-bold text-[#12291E]">
                  {tab.badge}
                </span>
              )}
            </div>
            <span
              className={cn(
                "mt-0.5 text-[10px] tracking-tight transition-colors",
                isActive ? "font-bold text-[#1B3B2B]" : "font-medium text-[#7A736C]",
              )}
            >
              {tab.label}
            </span>
            {isActive && (
              <span className="absolute bottom-0.5 h-1 w-4 rounded-full bg-[#C5A059]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
