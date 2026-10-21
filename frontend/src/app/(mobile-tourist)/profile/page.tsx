"use client";

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
  CalendarDays,
  ShoppingBag,
  Heart,
  UserCheck,
  Lock,
  MapPin,
  Sparkles,
  Edit3,
  ChevronRight,
  Compass,
} from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { useAuth } from "@/hooks/use-auth";
import { apiGetMe } from "@/lib/auth-api";
import { getMyOrders } from "@/lib/api/booking";
import { formatDateText } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useFavoritesStore } from "@/store/favorites-store";
import type { UserRole } from "@/types/auth";

const ROLE_LABELS: Record<UserRole, string> = {
  TOURIST: "นักท่องเที่ยว (Eco-Traveler)",
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
  const favorites = useFavoritesStore((s) => s.favorites);
  const favoritesCount = Object.keys(favorites).length;

  const meQuery = useQuery({
    queryKey: ["user-me-profile"],
    queryFn: apiGetMe,
    initialData: authUser ?? undefined,
  });

  const ordersQuery = useQuery({
    queryKey: ["user-profile-orders-count"],
    queryFn: () => getMyOrders({ page: 1, limit: 50 }),
    enabled: Boolean(authUser),
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
      ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
      : user.username || user.email?.split("@")[0] || "ผู้ใช้งาน WellTrip";

  const initials = (user.first_name || user.username || user.email || "W")
    .charAt(0)
    .toUpperCase();

  const isVendor = user.role && user.role !== "TOURIST";

  const ordersList = ordersQuery.data?.data ?? [];
  const totalOrdersCount = ordersQuery.data?.meta?.pagination?.total_items ?? ordersList.length;

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        
        {/* 1. Profile Hero Card (Elevated luxury container) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1B2A24] via-[#23382F] to-[#263E34] p-6 md:p-8 text-white shadow-xl border border-emerald-900/40">
          {/* Subtle Ambient Glow Background */}
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-[#D97706]/10 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            
            {/* Avatar & User Core Details */}
            <div className="flex items-center gap-5">
              {/* Circular Avatar */}
              <div className="w-20 h-20 rounded-full border-2 border-amber-400/80 shadow-md bg-stone-100 flex items-center justify-center font-bold text-2xl text-stone-800 shrink-0 font-serif">
                {initials}
              </div>

              {/* Text Info */}
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold text-white font-serif tracking-wide">
                  {fullName}
                </h1>
                
                <p className="text-stone-300 text-sm font-medium flex flex-wrap items-center gap-2">
                  <span>@{user.username || user.email?.split("@")[0] || "member"}</span>
                  <span className="text-stone-500">•</span>
                  <span>{user.email || "-"}</span>
                </p>

                {/* Badges Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{user.is_verified ? "ยืนยันตัวตนแล้ว" : "สมาชิกระบบ"}</span>
                  </span>

                  <span className="bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{ROLE_LABELS[user.role] ?? "นักท่องเที่ยว (Eco-Traveler)"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action: Edit Profile Button */}
            <Link
              href="/settings"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 font-medium shrink-0 shadow-xs"
            >
              <Edit3 className="w-4 h-4 text-amber-300" />
              <span>แก้ไขข้อมูลส่วนตัว</span>
            </Link>
          </div>
        </div>

        {/* 2. Quick Stats Overview Bar (3 interactive cards grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: การจองของฉัน */}
          <Link
            href="/my-bookings"
            className="group rounded-2xl bg-white p-5 border border-stone-200/80 shadow-xs hover:shadow-md hover:border-[#D97706]/40 transition-all flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold">
                <CalendarDays className="w-4 h-4 text-emerald-700" />
                <span>การจองของฉัน</span>
              </div>
              <p className="text-xl font-bold text-[#1B2A24] font-serif group-hover:text-[#D97706] transition-colors">
                {ordersQuery.isLoading ? "กำลังโหลด..." : `${totalOrdersCount} รายการ`}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-[#1B2A24] group-hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </div>
          </Link>

          {/* Card 2: ตะกร้าสินค้าปัจจุบัน */}
          <Link
            href="/cart"
            className="group rounded-2xl bg-white p-5 border border-stone-200/80 shadow-xs hover:shadow-md hover:border-[#D97706]/40 transition-all flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold">
                <ShoppingBag className="w-4 h-4 text-amber-700" />
                <span>ตะกร้าสินค้า & รอชำระ</span>
              </div>
              <p className="text-xl font-bold text-[#1B2A24] font-serif group-hover:text-[#D97706] transition-colors">
                ดูตะกร้าของฉัน
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-[#1B2A24] group-hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </div>
          </Link>

          {/* Card 3: รายการโปรดที่บันทึกไว้ */}
          <Link
            href="/recommended"
            className="group rounded-2xl bg-white p-5 border border-stone-200/80 shadow-xs hover:shadow-md hover:border-[#D97706]/40 transition-all flex items-center justify-between"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold">
                <Heart className="w-4 h-4 text-rose-600" />
                <span>รายการโปรดที่บันทึกไว้</span>
              </div>
              <p className="text-xl font-bold text-[#1B2A24] font-serif group-hover:text-[#D97706] transition-colors">
                {favoritesCount > 0 ? `${favoritesCount} รายการ` : "ยังไม่มีรายการ"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-[#1B2A24] group-hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </div>
          </Link>

        </div>

        {/* 3. Account Details Section */}
        <div className="rounded-3xl bg-white p-6 md:p-8 border border-stone-200/80 shadow-xs space-y-6">
          
          {/* Section Header */}
          <div className="flex items-center gap-2.5 border-b border-stone-100 pb-4">
            <UserCheck className="w-5 h-5 text-stone-700" />
            <h2 className="text-lg font-bold text-[#1B2A24] font-serif">
              ข้อมูลบัญชีส่วนตัว (Account Overview)
            </h2>
          </div>

          {/* 2-Column Responsive Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            
            {/* Field 1: Username */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/60 space-y-1">
              <span className="text-xs font-semibold text-stone-500 flex items-center gap-2">
                <UserRound className="w-4 h-4 text-stone-400" />
                <span>ชื่อผู้ใช้ (Username)</span>
              </span>
              <p className="text-sm font-bold text-[#1B2A24] font-mono">
                @{user.username || user.email?.split("@")[0] || "user"}
              </p>
            </div>

            {/* Field 2: Email */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/60 space-y-1">
              <span className="text-xs font-semibold text-stone-500 flex items-center gap-2">
                <Mail className="w-4 h-4 text-stone-400" />
                <span>อีเมล (Email Address)</span>
              </span>
              <p className="text-sm font-bold text-[#1B2A24]">
                {user.email || "-"}
              </p>
            </div>

            {/* Field 3: Phone */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/60 flex items-center justify-between gap-2">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-stone-500 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-stone-400" />
                  <span>เบอร์โทรศัพท์ (Phone)</span>
                </span>
                <p className="text-sm font-bold text-[#1B2A24]">
                  {user.phone_number || "ยังไม่ได้ระบุเบอร์โทร"}
                </p>
              </div>
              <Link
                href="/settings"
                className="text-xs font-bold text-[#D97706] hover:underline px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/60 shrink-0"
              >
                {user.phone_number ? "แก้ไข" : "เพิ่มเบอร์โทร"}
              </Link>
            </div>

            {/* Field 4: Member Since */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/60 space-y-1">
              <span className="text-xs font-semibold text-stone-500 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-stone-400" />
                <span>สมาชิกตั้งแต่ (Member Since)</span>
              </span>
              <p className="text-sm font-bold text-[#1B2A24]">
                {user.created_at
                  ? formatDateText(user.created_at, locale)
                  : "-"}
              </p>
            </div>

            {/* Field 5: Account Status */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/60 space-y-1 md:col-span-2">
              <span className="text-xs font-semibold text-stone-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-stone-400" />
                <span>สถานะบัญชี (Account Status)</span>
              </span>
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>พร้อมใช้งาน (Active)</span>
              </div>
            </div>

          </div>

          {/* Action / Settings Row at Bottom */}
          <div className="pt-4 border-t border-stone-100 flex flex-wrap gap-3">
            <Link
              href="/settings"
              className="px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold text-xs inline-flex items-center gap-2 transition-all shadow-2xs"
            >
              <Lock className="w-4 h-4 text-stone-600" />
              <span>เปลี่ยนรหัสผ่าน</span>
            </Link>

            <Link
              href="/settings"
              className="px-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold text-xs inline-flex items-center gap-2 transition-all shadow-2xs"
            >
              <MapPin className="w-4 h-4 text-stone-600" />
              <span>ที่อยู่จัดส่งสำหรับสินค้า OTOP</span>
            </Link>

            {isVendor && (
              <Link
                href="/portal"
                className="px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-[#D97706] font-bold text-xs inline-flex items-center gap-2 transition-all shadow-2xs ml-auto"
              >
                <Compass className="w-4 h-4 text-[#D97706]" />
                <span>ศูนย์ผู้ประกอบการ (Vendor Portal)</span>
              </Link>
            )}
          </div>

        </div>

        {/* 4. Account Footer: Logout Row */}
        <div className="flex justify-end pt-2">
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="text-rose-600 hover:bg-rose-50 border border-rose-200/80 bg-white px-5 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 font-semibold text-sm shadow-2xs"
          >
            <LogOut className="w-4 h-4 text-rose-600" />
            <span>ออกจากระบบ</span>
          </button>
        </div>

      </div>
    </div>
  );
}
