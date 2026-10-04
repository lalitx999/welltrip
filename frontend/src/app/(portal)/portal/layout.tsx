"use client";

/**
 * (portal)/portal/layout.tsx - vendor portal shell (URL: /portal) with Eco-Premium design.
 */
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Hotel,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
  type LucideIcon,
  LogOut,
  ChevronRight,
} from "lucide-react";

import { LanguageToggle } from "@/components/ui/language-toggle";
import { useAuth } from "@/hooks/use-auth";
import type { MessageKey } from "@/i18n/messages";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/auth";

const VENDOR_ROLES: readonly UserRole[] = [
  "HOMESTAY_OWNER",
  "RESTAURANT_OWNER",
  "WELLNESS_OWNER",
  "OTOP_OWNER",
] as const;

interface ModuleDef {
  href: string;
  labelKey: MessageKey;
  icon: LucideIcon;
  roles: readonly UserRole[];
}

const MODULES: ModuleDef[] = [
  { href: "/portal", labelKey: "portal.dashboard", icon: Store, roles: VENDOR_ROLES },
  { href: "/portal/homestay", labelKey: "portal.homestay", icon: Hotel, roles: ["HOMESTAY_OWNER"] },
  { href: "/portal/restaurant", labelKey: "portal.restaurant", icon: UtensilsCrossed, roles: ["RESTAURANT_OWNER"] },
  { href: "/portal/wellness", labelKey: "portal.wellness", icon: Sparkles, roles: ["WELLNESS_OWNER"] },
  { href: "/portal/otop", labelKey: "portal.otop", icon: ShoppingBag, roles: ["OTOP_OWNER"] },
];

export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const { status, user, logout } = useAuth();

  const role = user?.role;

  useEffect(() => {
    if (status === "authenticated" && role === "TOURIST") {
      router.replace("/home");
    }
  }, [status, role, router]);

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-cream-50 text-sm text-muted-foreground font-serif">
        {t("common.loading")}
      </div>
    );
  }

  const allowedModules =
    role === "SUPER_ADMIN"
      ? MODULES
      : MODULES.filter(
          (mod) => role !== undefined && mod.roles.includes(role),
        );

  const isAllowedEntry = status === "authenticated" && allowedModules.length > 0;

  return (
    <div className="wt-management flex min-h-screen w-full flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur shadow-xs">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/home"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-forest-900 text-cream-100 shadow-sm">
                <Compass className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="font-serif text-lg font-bold tracking-tight text-forest-950">
                WellTrip
              </span>
            </Link>
            <span className="hidden sm:inline-block rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-600">
              Vendor Management Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageToggle />
            {status === "authenticated" && (
              <button
                type="button"
                onClick={() => logout()}
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-border/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>ออกจากระบบ</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {!isAllowedEntry ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-serif text-base text-muted-foreground">{t("portal.noAccess")}</p>
          <Link
            href="/home"
            className="rounded-xl bg-forest-900 px-6 py-2.5 text-xs font-semibold text-cream-100 shadow-md"
          >
            {t("portal.backHome")}
          </Link>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row">
          {/* Navigation Sidebar for Desktop & Horizontal Chips for Mobile */}
          <nav
            aria-label="Portal Navigation"
            className="sticky top-16 z-30 flex gap-2 overflow-x-auto border-b border-border/60 bg-card px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:top-16 lg:w-64 lg:flex-col lg:justify-start lg:border-b-0 lg:border-r lg:bg-transparent lg:py-8 lg:px-6 lg:shrink-0"
          >
            <div className="hidden lg:block mb-4 px-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                การจัดการร้านค้า
              </p>
              <p className="text-xs text-forest-800 font-medium mt-0.5 truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ""}` : user?.email}
              </p>
            </div>

            {allowedModules.map(({ href, labelKey, icon: Icon }) => {
              const active =
                href === "/portal"
                  ? pathname === "/portal"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center justify-between rounded-xl px-4 text-xs font-semibold tracking-wide transition-all",
                    active
                      ? "bg-forest-900 text-cream-100 shadow-sm"
                      : "text-muted-foreground hover:bg-cream-100/50 hover:text-foreground",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    <span>{t(labelKey)}</span>
                  </div>
                  {active && <ChevronRight className="hidden lg:block h-3.5 w-3.5 text-gold-400" />}
                </Link>
              );
            })}
          </nav>

          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      )}
    </div>
  );
}

