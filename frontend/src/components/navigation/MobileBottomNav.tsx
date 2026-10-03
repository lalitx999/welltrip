"use client";

/**
 * MobileBottomNav - fixed bottom navigation for the (mobile-tourist) shell.
 *
 * WHY a dedicated component instead of inlining in the layout: the nav has
 * state of its own (active tab + live cart badge) and will be reused by every
 * tourist page; keeping it isolated makes the layout purely compositional.
 *
 * Active-tab rules:
 *  - a tab is active when the URL starts with its prefix segment(s)
 *    (so /hotels/[id] still highlights "Hotels");
 *  - /checkout* is treated as part of the cart flow (highlights Cart);
 *  - the cart badge shows useCartStore.itemCount (sum of quantities).
 *
 * Icons are official lucide-react only (zero-emoji rule). Touch targets keep
 * the 44px minimum from spec §7.1.
 */
import {
  Compass,
  Hotel,
  Receipt,
  ShoppingBag,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { MessageKey } from "@/i18n/messages";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

interface TabDef {
  labelKey: MessageKey;
  href: string;
  icon: LucideIcon;
  /** URL prefixes that count as "on this tab". */
  prefixes: string[];
}

const TABS: TabDef[] = [
  { labelKey: "nav.explore", href: "/home", icon: Compass, prefixes: ["/home"] },
  { labelKey: "nav.hotels", href: "/hotels", icon: Hotel, prefixes: ["/hotels"] },
  { labelKey: "nav.cart", href: "/cart", icon: ShoppingBag, prefixes: ["/cart", "/checkout"] },
  { labelKey: "nav.orders", href: "/my-bookings", icon: Receipt, prefixes: ["/my-bookings"] },
  { labelKey: "nav.profile", href: "/profile", icon: User, prefixes: ["/profile"] },
];

export function MobileBottomNav() {
  const { t } = useI18n();
  const pathname = usePathname() ?? "";
  const itemCount = useCartStore((s) => s.itemCount);

  const isActive = (prefixes: string[]): boolean =>
    prefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur"
    >
      <div className="mx-auto grid w-full max-w-md grid-cols-5 px-1 pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ labelKey, href, icon: Icon, prefixes }) => {
          const active = isActive(prefixes);
          const showBadge = href === "/cart" && itemCount > 0;

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="relative">
                <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={active ? 2.4 : 2} />
                {showBadge && (
                  <span
                    aria-hidden="true"
                    className="absolute -right-2.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground"
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </span>
                )}
              </span>
              <span>{t(labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
