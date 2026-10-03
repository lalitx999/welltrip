"use client";

/**
 * (admin)/admin/page.tsx - EP 2: System Admin Overview & Analytics Dashboard.
 * Displays key KPIs, sales breakdown, system entity statuses, and quick action cards.
 * Zero-Emoji Policy: Lucide icons only.
 */
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  TrendingUp,
  CalendarCheck,
  Users,
  Building2,
  Sparkles,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Receipt,
  CheckSquare,
} from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { formatBaht } from "@/lib/format";
import { getAdminOverviewStats } from "@/lib/api/admin";

export default function AdminDashboardOverviewPage() {
  const statsQuery = useQuery({
    queryKey: ["admin-overview-stats"],
    queryFn: getAdminOverviewStats,
  });

  if (statsQuery.isLoading) {
    return <ListLoading />;
  }

  if (statsQuery.isError) {
    return (
      <ListError
        message="ไม่สามารถโหลดข้อมูลสถิติภาพรวมได้ กรุณาลองใหม่อีกครั้ง"
        onRetry={() => void statsQuery.refetch()}
      />
    );
  }

  const stats = statsQuery.data?.data ?? {
    total_gmv: 0,
    total_bookings: 0,
    total_users: 0,
    total_merchants: 0,
    total_accommodations: 0,
    total_wellness_services: 0,
    total_otop_products: 0,
    pending_approvals: 0,
    pending_payments: 0,
  };

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-forest-900 p-6 text-cream-50 shadow-xl sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(197,160,89,0.25),transparent_60%)]" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>WellTrip System Administrator Control Panel</span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-cream-100 sm:text-3xl">
            ภาพรวมระบบและการวิเคราะห์ (Overview & Analytics)
          </h1>
          <p className="text-xs text-cream-200/80 sm:text-sm">
            สรุปข้อมูลตัวเลขสำคัญ สถานะการอนุมัติร้านค้า การชำระเงิน และสถิติต่างๆ ในแพลตฟอร์ม
          </p>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total GMV */}
        <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">ยอดขายรวม (GMV)</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-forest-900/10 text-forest-800">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-serif text-2xl font-bold text-foreground">
              {formatBaht(stats.total_gmv)}
            </p>
            <p className="mt-1 text-[11px] font-medium text-emerald-600">
              ยอดรวมธุรกรรมทั้งหมดในระบบ
            </p>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">การจองทั้งหมด</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-forest-900/10 text-forest-800">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-serif text-2xl font-bold text-foreground">
              {stats.total_bookings.toLocaleString()} รายการ
            </p>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground">
              รายการจองที่พัก/บริการสำเร็จ
            </p>
          </div>
        </div>

        {/* Total Users */}
        <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">ผู้ใช้งานทั้งหมด</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-forest-900/10 text-forest-800">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-serif text-2xl font-bold text-foreground">
              {stats.total_users.toLocaleString()} บัญชี
            </p>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground">
              นักท่องเที่ยว & ผู้ประกอบการ
            </p>
          </div>
        </div>

        {/* Total Merchants */}
        <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">ผู้ประกอบการในระบบ</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gold-500/20 text-gold-700">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="font-serif text-2xl font-bold text-foreground">
              {stats.total_merchants.toLocaleString()} ราย
            </p>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground">
              พันธมิตรชุมชนที่ยืนยันแล้ว
            </p>
          </div>
        </div>
      </div>

      {/* Urgent Action Section */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Pending Approvals Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-gold-500/30 bg-gold-500/5 p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-700">
                <Clock className="h-4 w-4" />
                <span>รอการตรวจสอบและอนุมัติ</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground">
                {stats.pending_approvals} รายการที่รอการอนุมัติ
              </h3>
              <p className="text-xs text-muted-foreground">
                ที่พัก แพ็กเกจสปา หรือสินค้า OTOP ที่ลงทะเบียนเข้ามาใหม่และรอ Admin ตรวจสอบ
              </p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gold-500/20 text-gold-700 font-bold">
              {stats.pending_approvals}
            </span>
          </div>

          <div className="mt-6">
            <Link
              href="/admin/approvals"
              className="inline-flex items-center gap-2 rounded-xl bg-forest-900 px-4 py-2.5 text-xs font-semibold text-cream-100 transition-all hover:bg-forest-800"
            >
              <CheckSquare className="h-4 w-4" />
              <span>ไปยังหน้าตรวจสอบรายการอนุมัติ</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Pending Payment Verification Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                <AlertCircle className="h-4 w-4" />
                <span>สลิปการชำระเงินรอตรวจสอบ</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-foreground">
                {stats.pending_payments} สลิปที่ต้องยืนยัน
              </h3>
              <p className="text-xs text-muted-foreground">
                การชำระเงินผ่าน PromptPay QR ที่รอยืนยันความถูกต้องของสลิปการโอน
              </p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-800 font-bold">
              {stats.pending_payments}
            </span>
          </div>

          <div className="mt-6">
            <Link
              href="/admin/payments"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-cream-100 transition-all hover:bg-emerald-700"
            >
              <Receipt className="h-4 w-4" />
              <span>ตรวจสอบสลิปการชำระเงิน</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Entity Category Breakdown */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-bold text-foreground">
          จำนวนสถานที่และสินค้าแยกตามประเภท (Entity Catalog Summary)
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-forest-900/10 text-forest-800">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">ที่พัก & โฮมสเตย์</p>
              <p className="font-serif text-xl font-bold text-foreground">
                {stats.total_accommodations} แห่ง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-forest-900/10 text-forest-800">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">บริการสุขภาพ & สปา</p>
              <p className="font-serif text-xl font-bold text-foreground">
                {stats.total_wellness_services} บริการ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-forest-900/10 text-forest-800">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground">สินค้า OTOP ชุมชน</p>
              <p className="font-serif text-xl font-bold text-foreground">
                {stats.total_otop_products} รายการ
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
