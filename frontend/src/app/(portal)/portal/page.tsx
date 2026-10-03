"use client";

/**
 * (portal)/portal/page.tsx - portal landing with Eco-Premium styling.
 */
import {
  Hotel,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
  type LucideIcon,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/hooks/use-auth";
import type { MessageKey } from "@/i18n/messages";
import { useI18n } from "@/lib/i18n";
import type { UserRole } from "@/types/auth";

interface CardDef {
  href: string;
  labelKey: MessageKey;
  descKey: MessageKey;
  icon: LucideIcon;
  roles: readonly UserRole[];
}

const CARDS: CardDef[] = [
  {
    href: "/portal/homestay",
    labelKey: "portal.homestay",
    descKey: "portal.roomPricingTitle",
    icon: Hotel,
    roles: ["HOMESTAY_OWNER"],
  },
  {
    href: "/portal/restaurant",
    labelKey: "portal.restaurant",
    descKey: "portal.menuStatus",
    icon: UtensilsCrossed,
    roles: ["RESTAURANT_OWNER"],
  },
  {
    href: "/portal/wellness",
    labelKey: "portal.wellness",
    descKey: "portal.fillSlot",
    icon: Sparkles,
    roles: ["WELLNESS_OWNER"],
  },
  {
    href: "/portal/otop",
    labelKey: "portal.otop",
    descKey: "portal.stockAdjust",
    icon: ShoppingBag,
    roles: ["OTOP_OWNER"],
  },
];

export default function PortalDashboardPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const role = user?.role;

  const visible =
    role === "SUPER_ADMIN"
      ? CARDS
      : CARDS.filter(
          (card) => role !== undefined && card.roles.includes(role),
        );

  return (
    <div className="space-y-8">
      {/* Editorial Dashboard Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-8 text-cream-50 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.25),transparent_60%)]" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-300">
            <Store className="h-3.5 w-3.5" />
            <span>Community Vendor Partner</span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-wide sm:text-3xl text-cream-100">
            ยินดีต้อนรับสู่ศูนย์จัดการผู้ประกอบการ
          </h1>
          <p className="text-sm text-cream-200/80 leading-relaxed">
            จัดการรายการที่พัก เมนูอาหาร บริการสปา และสินค้า OTOP ของคุณได้อย่างสะดวกในที่เดียว
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="font-serif text-lg font-bold text-foreground">
          เครื่องมือจัดการของคุณ (Management Tools)
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ href, labelKey, descKey, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-gold-500/40"
            >
              <div className="space-y-3 mb-6">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-forest-900/10 text-forest-800 transition-colors group-hover:bg-forest-900 group-hover:text-cream-100">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-forest-900 transition-colors">
                    {t(labelKey)}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {t(descKey)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-forest-800 group-hover:text-forest-950">
                <span>จัดการข้อมูล</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

