"use client";

/**
 * (mobile-tourist)/profile/page.tsx - Eco-Premium Tourist Profile Dashboard.
 * Displays real user profile details fetched directly from Django DRF API.
 * Strict Zero-Emoji Policy: Lucide icons only.
 */
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserRound,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  Calendar,
  LogOut,
  CalendarCheck,
  Award,
  Compass,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { apiGetMe } from "@/lib/auth-api";
import { formatDateText } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import type { UserRole } from "@/types/auth";

const ROLE_LABELS: Record<UserRole, string> = {
  TOURIST: "นักท่องเที่ยว (Tourist)",
  HOMESTAY_OWNER: "เจ้าของที่พัก (Homestay Owner)",
  RESTAURANT_OWNER: "เจ้าของร้านอาหาร (Restaurant Owner)",
  WELLNESS_OWNER: "เจ้าของสปา/Wellness (Wellness Owner)",
  OTOP_OWNER: "ผู้ขายสินค้า OTOP (OTOP Owner)",
  COMMUNITY_ADMIN: "แอดมินชุมชน (Community Admin)",
  SUPER_ADMIN: "ผู้ดูแลระบบสูงสุด (Super Admin)",
};

export default function ProfileDashboardPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { user: authUser, logout } = useAuth();

  const meQuery = useQuery({
    queryKey: ["user-me-profile"],
    queryFn: apiGetMe,
    initialData: authUser ?? undefined,
  });

  const user = meQuery.data ?? authUser;

  if (meQuery.isLoading && !user) {
    return <ListLoading />;
  }

  if (meQuery.isError && !user) {
    return (
      <ListError
        message="ไม่สามารถดึงข้อมูลโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง"
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  if (!user) {
    return null;
  }

  const fullName =
    user.first_name || user.last_name
      ? `${user.first_name} ${user.last_name || ""}`.trim()
      : user.username || user.email;

  const initials = (user.first_name || user.email).charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 pb-16 pt-6 sm:px-6">
      {/* Editorial Profile Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-6 text-cream-50 shadow-xl sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.3),transparent_60%)]" />
        <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gold-500 text-2xl font-bold text-forest-950 shadow-md">
            {initials}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-xl font-bold tracking-wide text-cream-100 sm:text-2xl">
                {fullName}
              </h1>
              {user.is_verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-gold-500/30 bg-gold-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-gold-300">
                  <BadgeCheck className="h-3.5 w-3.5 text-gold-400" />
                  <span>ยืนยันแล้ว</span>
                </span>
              )}
            </div>
            <p className="truncate text-xs text-cream-200/80 sm:text-sm">{user.email}</p>
            <span className="inline-block rounded-md bg-cream-100/10 px-2.5 py-0.5 text-[11px] font-semibold text-cream-200">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/my-bookings"
          className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-4 shadow-xs transition-all hover:border-gold-500/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">ประวัติการจอง</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-forest-900/10 text-forest-800">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-bold text-forest-900">
            <span>ดูรายการจองทั้งหมด</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </Link>

        <Link
          href="/community"
          className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-4 shadow-xs transition-all hover:border-gold-500/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">พาสปอร์ตสะสมแต้ม</span>
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gold-500/20 text-gold-700">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs font-bold text-forest-900">
            <span>เช็คอิน & รับคูปอง</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </Link>
      </div>

      {/* Personal Details List */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
        <h2 className="flex items-center gap-2 font-serif text-base font-bold text-foreground border-b border-border/60 pb-3">
          <ShieldCheck className="h-4 w-4 text-forest-800" />
          <span>ข้อมูลบัญชีส่วนตัว (Personal Profile)</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-1.5 border-b border-border/40">
            <span className="flex items-center gap-2 text-muted-foreground">
              <UserRound className="h-4 w-4" />
              <span>ชื่อผู้ใช้ (Username)</span>
            </span>
            <span className="font-semibold text-foreground">@{user.username}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-border/40">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>อีเมล (Email Address)</span>
            </span>
            <span className="font-semibold text-foreground">{user.email}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-border/40">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>เบอร์โทรศัพท์ (Phone)</span>
            </span>
            <span className="font-semibold text-foreground">
              {user.phone_number || "ยังไม่ได้ระบุ"}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-border/40">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>วันที่สมัครสมาชิก (Member Since)</span>
            </span>
            <span className="font-semibold text-foreground">
              {formatDateText(user.created_at, locale)}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              <span>สถานะบัญชี (Account Status)</span>
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>พร้อมใช้งาน (Active)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Admin / Portal Shortcut Button if Vendor */}
      {user.role !== "TOURIST" && (
        <Link href="/portal" className="block">
          <div className="flex items-center justify-between rounded-2xl border border-gold-500/40 bg-gold-500/10 p-4 text-xs font-bold text-gold-800 transition-all hover:bg-gold-500/20">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-gold-700" />
              <span>ไปยังศูนย์จัดการผู้ประกอบการ (Vendor Portal)</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </div>
        </Link>
      )}

      {/* Logout Button */}
      <Button
        variant="outline"
        onClick={() => {
          logout();
          router.replace("/login");
        }}
        className="w-full justify-center rounded-xl py-3 text-xs font-semibold border-destructive/30 text-destructive hover:bg-destructive/10"
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>ออกจากระบบ (Sign Out)</span>
      </Button>
    </div>
  );
}
