"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Filter,
  Phone,
  Search,
  ShieldCheck,
  UserCheck,
  User as UserIcon,
  Users,
  XCircle,
  Pencil,
  Ban,
  Calendar,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { getAdminUsers, updateUserRole } from "@/lib/api/admin";
import { extractErrorMessage } from "@/lib/api/errors";
import { useI18n } from "@/lib/i18n";
import type { UserProfile, UserRole } from "@/types/auth";

const ROLE_LABELS: Record<UserRole, string> = {
  TOURIST: "นักท่องเที่ยว (Tourist)",
  HOMESTAY_OWNER: "เจ้าของที่พัก (Homestay)",
  RESTAURANT_OWNER: "เจ้าของร้านอาหาร (Restaurant)",
  WELLNESS_OWNER: "เจ้าของสปา (Wellness)",
  OTOP_OWNER: "ผู้ขาย OTOP (OTOP Vendor)",
  COMMUNITY_ADMIN: "แอดมินชุมชน (Community Admin)",
  SUPER_ADMIN: "ผู้ดูแลระบบสูงสุด (Super Admin)",
};

const ROLE_COLORS: Record<UserRole, string> = {
  TOURIST: "bg-slate-100 text-slate-600 border-slate-200",
  HOMESTAY_OWNER: "bg-emerald-50 text-emerald-700 border-emerald-200",
  RESTAURANT_OWNER: "bg-rose-50 text-rose-700 border-rose-200",
  WELLNESS_OWNER: "bg-purple-50 text-purple-700 border-purple-200",
  OTOP_OWNER: "bg-amber-50 text-[#D97706] border-[#D97706]/30",
  COMMUNITY_ADMIN: "bg-blue-50 text-blue-700 border-blue-200",
  SUPER_ADMIN: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export default function AdminUsersManagementPage() {
  const { locale } = useI18n();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Selected user for Role Upgrade Modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("TOURIST");

  // Confirm dialog for suspending/activating user
  const [suspendingUser, setSuspendingUser] = useState<UserProfile | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin-users", selectedRoleFilter],
    queryFn: () =>
      getAdminUsers(
        selectedRoleFilter !== "ALL" ? { role: selectedRoleFilter } : undefined
      ),
  });

  const updateRoleMutation = useMutation({
    mutationFn: () =>
      updateUserRole(editingUser!.id, newRole, editingUser!.is_verified, editingUser!.is_active),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingUser(null);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (userToToggle: UserProfile) =>
      updateUserRole(
        userToToggle.id,
        userToToggle.role,
        userToToggle.is_verified,
        !userToToggle.is_active
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setSuspendingUser(null);
    },
  });

  // Ensure robust array fallback if API fails or returns null
  const users: UserProfile[] = Array.isArray(usersQuery.data?.data)
    ? usersQuery.data.data
    : [];

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone_number && u.phone_number.includes(searchTerm));
    return matchesSearch;
  });

  const paginatedUsers = filteredUsers.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-[#D97706] border border-[#D97706]/20">
              <Users className="h-5 w-5" />
            </div>
            <h1 className="font-serif text-xl font-bold text-[#1B2A24]">
              {locale === "th" ? "จัดการผู้ใช้ & ร้านค้าผู้ประกอบการ" : "User & Merchant Management"}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {locale === "th"
              ? "ตรวจสอบรายชื่อผู้ใช้งาน ปรับเปลี่ยนบทบาทสิทธิ์อนุมัติผู้ประกอบการ และบริหารจัดการสถานะบัญชี"
              : "Manage platform users, merchant roles, and account access statuses."}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder={
              locale === "th"
                ? "ค้นหาชื่อ, อีเมล, เบอร์โทร หรือชื่อผู้ใช้..."
                : "Search name, email, phone, username..."
            }
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-slate-200/80 rounded-xl text-xs font-semibold text-[#1B2A24] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedRoleFilter}
            onChange={(e) => {
              setSelectedRoleFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto py-2.5 px-3 rounded-xl border border-slate-200/80 bg-[#FAF8F5] text-xs font-semibold text-[#1B2A24] outline-none cursor-pointer"
          >
            <option value="ALL">สิทธิ์ทั้งหมด (All Roles)</option>
            <option value="TOURIST">นักท่องเที่ยว (Tourist)</option>
            <option value="HOMESTAY_OWNER">เจ้าของที่พัก (Homestay)</option>
            <option value="WELLNESS_OWNER">เจ้าของสปา/Wellness</option>
            <option value="OTOP_OWNER">ผู้ขายสินค้า OTOP</option>
            <option value="RESTAURANT_OWNER">เจ้าของร้านอาหาร</option>
            <option value="COMMUNITY_ADMIN">แอดมินชุมชน</option>
            <option value="SUPER_ADMIN">ผู้ดูแลระบบสูงสุด</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {usersQuery.isLoading ? (
        <ListLoading />
      ) : usersQuery.isError ? (
        <ListError
          message={extractErrorMessage(usersQuery.error, "ไม่สามารถดึงข้อมูลผู้ใช้งานได้")}
          onRetry={() => void usersQuery.refetch()}
        />
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 space-y-2">
          <Users className="mx-auto h-10 w-10 text-slate-300" />
          <p className="text-base font-bold text-[#1B2A24]">
            {locale === "th" ? "ไม่พบผู้ใช้งานที่ตรงตามเงื่อนไข" : "No matching users found"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200/80 bg-slate-50/80 font-bold text-[#1B2A24]">
                  <tr>
                    <th className="px-4 py-3.5">ผู้ใช้งาน (User)</th>
                    <th className="px-4 py-3.5">เบอร์โทรศัพท์</th>
                    <th className="px-4 py-3.5">ประเภทสิทธิ์ (Role)</th>
                    <th className="px-4 py-3.5">สถานะบัญชี</th>
                    <th className="px-4 py-3.5">วันที่ลงทะเบียน</th>
                    <th className="px-4 py-3.5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedUsers.map((u) => {
                    const rolePillClass = ROLE_COLORS[u.role] || "bg-slate-100 text-slate-600 border-slate-200";
                    const formattedRegisteredDate = u.created_at
                      ? new Date(u.created_at).toLocaleDateString("th-TH")
                      : "—";

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#1B2A24] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {u.first_name ? u.first_name[0].toUpperCase() : u.username ? u.username[0].toUpperCase() : "U"}
                            </div>
                            <div>
                              <p className="font-bold text-[#1B2A24]">
                                {u.first_name ? `${u.first_name} ${u.last_name || ""}` : u.username}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-600 font-medium">
                          {u.phone_number ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{u.phone_number}</span>
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block rounded-full border px-3 py-0.5 text-[11px] font-bold ${rolePillClass}`}>
                            {ROLE_LABELS[u.role] ?? u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {u.is_active !== false ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>ใช้งานปกติ</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 text-[11px]">
                              <Ban className="h-3.5 w-3.5" />
                              <span>ระงับการใช้งาน</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formattedRegisteredDate}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingUser(u);
                                setNewRole(u.role);
                              }}
                              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#1B2A24] hover:bg-[#1B2A24] hover:text-white transition-all shadow-xs flex items-center gap-1"
                            >
                              <Pencil className="w-3 h-3 text-[#D97706]" />
                              <span>แก้ไขสิทธิ์</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSuspendingUser(u)}
                              className={`p-1.5 rounded-xl border text-xs font-semibold transition-all ${
                                u.is_active !== false
                                  ? "border-rose-200 text-rose-600 hover:bg-rose-50"
                                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              }`}
                              title={u.is_active !== false ? "ระงับการใช้งาน" : "ปลดล็อกบัญชี"}
                            >
                              {u.is_active !== false ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <AdminPagination
            currentPage={page}
            totalItems={filteredUsers.length}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(newPerPage) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* Role Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="h-5 w-5 text-[#D97706]" />
              <h3 className="font-serif font-bold text-base text-[#1B2A24]">
                ปรับปรุงสิทธิ์การใช้งานของบัญชี
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                บัญชี: <strong className="text-[#1B2A24]">{editingUser.email}</strong>
              </p>

              <div>
                <label className="block font-bold text-[#1B2A24] mb-1">เลือกประเภทสิทธิ์ใหม่</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-[#FAF8F5] text-xs font-semibold outline-none cursor-pointer"
                >
                  <option value="TOURIST">นักท่องเที่ยว (Tourist)</option>
                  <option value="HOMESTAY_OWNER">เจ้าของที่พัก (Homestay)</option>
                  <option value="WELLNESS_OWNER">เจ้าของสปา/Wellness</option>
                  <option value="OTOP_OWNER">ผู้ขายสินค้า OTOP</option>
                  <option value="RESTAURANT_OWNER">เจ้าของร้านอาหาร</option>
                  <option value="COMMUNITY_ADMIN">แอดมินชุมชน</option>
                  <option value="SUPER_ADMIN">ผู้ดูแลระบบสูงสุด</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={updateRoleMutation.isPending}
                onClick={() => updateRoleMutation.mutate()}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-[#1B2A24] text-white font-bold hover:bg-[#151d1a] shadow-sm flex items-center justify-center gap-2"
              >
                <UserCheck className="h-4 w-4 text-[#D97706]" />
                <span>{updateRoleMutation.isPending ? "กำลังบันทึก..." : "ยืนยันปรับสิทธิ์"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend / Unlock Confirm Dialog */}
      {suspendingUser && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 text-center border border-slate-100">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-serif font-bold text-base text-[#1B2A24]">
                {suspendingUser.is_active !== false ? "ยืนยันระงับการใช้งานบัญชี?" : "ปลดล็อกบัญชีผู้ใช้?"}
              </h3>
              <p className="text-xs text-slate-500">
                บัญชี: <strong className="text-[#1B2A24]">{suspendingUser.email}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSuspendingUser(null)}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={toggleStatusMutation.isPending}
                onClick={() => toggleStatusMutation.mutate(suspendingUser)}
                className={`w-1/2 py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1 ${
                  suspendingUser.is_active !== false
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                <span>{toggleStatusMutation.isPending ? "กำลังบันทึก..." : "ยืนยัน"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
