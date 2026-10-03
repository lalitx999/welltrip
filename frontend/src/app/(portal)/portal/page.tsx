"use client";

/**
 * (portal)/portal/page.tsx - vendor portal landing with verification status & Eco-Premium styling.
 */
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Hotel,
  Info,
  MapPin,
  Phone,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
  XCircle,
  type LucideIcon,
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
  const merchant = user?.merchant_profile;
  const approvalStatus = merchant?.status || "PENDING";

  const visible =
    role === "SUPER_ADMIN"
      ? CARDS
      : CARDS.filter(
          (card) => role !== undefined && card.roles.includes(role)
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
            สวัสดีคุณ {user?.first_name ? `${user.first_name} ${user.last_name || ""}` : user?.email} - จัดการรายการที่พัก เมนูอาหาร บริการสปา และสินค้า OTOP ของคุณในระบบ WellTrip
          </p>
        </div>
      </div>

      {/* Verification Status Banner */}
      {approvalStatus === "PENDING" && (
        <div className="rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50 to-orange-50 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-xs">
                <Clock className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-amber-950 text-base">
                    บัญชีและร้านค้าของคุณอยู่ระหว่างการตรวจสอบ (Under Review)
                  </h2>
                  <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                    PENDING
                  </span>
                </div>
                <p className="text-sm text-amber-800 leading-relaxed max-w-3xl">
                  ข้อมูลร้านค้า &quot;{merchant?.business_name || "ร้านค้าของคุณ"}&quot; ได้ถูกส่งเข้าสู่ระบบแล้ว ผู้ดูแลระบบ (คุณพรหมลิขิต) จะทำการตรวจสอบเอกสารและอนุมัติสิทธิ์การใช้งานของท่าน ท่านสามารถเตรียมข้อมูลล่วงหน้าได้ในระหว่างนี้
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {approvalStatus === "APPROVED" && (
        <div className="rounded-2xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-emerald-950 text-base">
                  บัญชีร้านค้าได้รับการอนุมัติเรียบร้อยแล้ว (Verified Merchant)
                </h2>
                <span className="rounded-full bg-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
                  APPROVED
                </span>
              </div>
              <p className="text-sm text-emerald-800 leading-relaxed">
                ร้านค้าของคุณได้รับการยืนยันสิทธิ์ในระบบ WellTrip Thailand พร้อมเปิดรับการจองและให้บริการแก่นักท่องเที่ยวเรียบร้อยแล้ว
              </p>
            </div>
          </div>
        </div>
      )}

      {approvalStatus === "REJECTED" && (
        <div className="rounded-2xl border border-rose-300/80 bg-rose-50 p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-rose-600 text-white shadow-xs">
              <XCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-rose-950 text-base">
                  บัญชีไม่ผ่านการอนุมัติ (Registration Rejected)
                </h2>
                <span className="rounded-full bg-rose-200 px-2.5 py-0.5 text-xs font-bold text-rose-900">
                  REJECTED
                </span>
              </div>
              <p className="text-sm text-rose-800 leading-relaxed">
                เหตุผลที่ไม่ผ่านการอนุมัติ: {merchant?.rejection_reason || "ข้อมูลร้านค้าไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบเพื่อขอคำแนะนำเพิ่มเติม"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Merchant Profile Summary Card */}
      {merchant && (
        <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h2 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
              <Info className="h-5 w-5 text-forest-800" />
              <span>ข้อมูลสถานประกอบการที่ลงทะเบียน</span>
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              หมวดหมู่: {merchant.business_category}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground block font-medium">ชื่อสถานประกอบการ</span>
              <p className="font-semibold text-foreground">{merchant.business_name}</p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground block font-medium">เบอร์โทรศัพท์ติดต่อ</span>
              <p className="font-medium text-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>{merchant.phone_number || "-"}</span>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-muted-foreground block font-medium">เวลาทำการ</span>
              <p className="font-medium text-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>{merchant.opening_hours || "-"}</span>
              </p>
            </div>

            {merchant.google_maps_url && (
              <div className="space-y-1 sm:col-span-2">
                <span className="text-xs text-muted-foreground block font-medium">ตำแหน่งพิกัดแผนที่</span>
                <a
                  href={merchant.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-forest-800 hover:text-forest-950 font-medium hover:underline text-xs"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>เปิดตำแหน่งใน Google Maps</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {merchant.description && (
            <div className="pt-2 border-t border-border/40">
              <span className="text-xs text-muted-foreground block font-medium mb-1">รายละเอียดบริการ</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{merchant.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Management Tools */}
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
