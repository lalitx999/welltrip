"use client";

/**
 * (admin)/admin/users/page.tsx - EP 3: User & Partner/Merchant Management.
 * Manages platform users, role assignment, partner verification & KYC approvals.
 * Zero-Emoji Policy: Lucide icons only.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  UserCheck,
  Building2,
} from "lucide-react";

import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractErrorMessage } from "@/lib/api/errors";
import { getAdminUsers, updateUserRole } from "@/lib/api/admin";
import type { UserProfile, UserRole } from "@/types/auth";

const ROLE_LABELS: Record<UserRole, string> = {
  TOURIST: "นักท่องเที่ยว (Tourist)",
  HOMESTAY_OWNER: "เจ้าของที่พัก (Homestay Owner)",
  RESTAURANT_OWNER: "เจ้าของร้านอาหาร (Restaurant Owner)",
  WELLNESS_OWNER: "เจ้าของสปา/Wellness (Wellness Owner)",
  OTOP_OWNER: "ผู้ขายสินค้า OTOP (OTOP Owner)",
  COMMUNITY_ADMIN: "แอดมินชุมชน (Community Admin)",
  SUPER_ADMIN: "ผู้ดูแลระบบสูงสุด (Super Admin)",
};

export default function AdminUsersManagementPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");

  // Selected user for Role Upgrade Modal
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>("TOURIST");

  const usersQuery = useQuery({
    queryKey: ["admin-users", selectedRoleFilter],
    queryFn: () =>
      getAdminUsers(
        selectedRoleFilter !== "ALL" ? { role: selectedRoleFilter } : undefined
      ),
  });

  const updateRoleMutation = useMutation({
    mutationFn: () =>
      updateUserRole(editingUser!.id, newRole, true),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingUser(null);
    },
  });

  const users = usersQuery.data?.data ?? [];

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-bold text-foreground">
            <Users className="h-6 w-6 text-forest-900" aria-hidden="true" />
            จัดการผู้ใช้ & ผู้ประกอบการ (User & Partner Management)
          </h1>
          <p className="text-xs text-muted-foreground">
            ตรวจสอบรายชื่อผู้ใช้งาน อนุมัติสิทธิ์ผู้ประกอบการ และบริหารสิทธิ์การใช้งานในระบบ
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="ค้นหาชื่อ, อีเมล หรือชื่อผู้ใช้..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-xs font-semibold"
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
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          <Users className="mx-auto h-8 w-8 text-muted-foreground/60" />
          <p className="mt-2 text-sm">ไม่พบผู้ใช้งานที่ตรงตามเงื่อนไข</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">ผู้ใช้งาน (User)</th>
                <th className="px-4 py-3">อีเมล (Email)</th>
                <th className="px-4 py-3">ประเภทสิทธิ์ (Role)</th>
                <th className="px-4 py-3">สถานะยืนยัน</th>
                <th className="px-4 py-3 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold text-foreground">
                    <div>
                      <span>
                        {u.first_name ? `${u.first_name} ${u.last_name || ""}` : u.username}
                      </span>
                      <p className="text-[11px] font-normal text-muted-foreground">@{u.username}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3 font-medium">
                    <span className="inline-block rounded-md bg-forest-900/10 px-2.5 py-1 text-[11px] font-semibold text-forest-900">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_verified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>ยืนยันแล้ว</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>ยังไม่ยืนยัน</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingUser(u);
                        setNewRole(u.role);
                      }}
                      className="gap-1.5 text-xs"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-forest-800" />
                      <span>ปรับสิทธิ์/บทบาท</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Change Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-card p-6 shadow-xl border border-border">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-forest-900" />
              <h3 className="font-serif text-lg font-bold">ปรับเปลี่ยนสิทธิ์ผู้ใช้งาน</h3>
            </div>

            <div className="space-y-2 text-xs">
              <p>
                <strong>ชื่อ:</strong> {editingUser.first_name} {editingUser.last_name}
              </p>
              <p>
                <strong>อีเมล:</strong> {editingUser.email}
              </p>
              <p>
                <strong>สิทธิ์ปัจจุบัน:</strong> {ROLE_LABELS[editingUser.role]}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role-select">เลือกบทบาทใหม่ (New Role)</Label>
              <select
                id="role-select"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-xs font-semibold"
              >
                <option value="TOURIST">นักท่องเที่ยว (Tourist)</option>
                <option value="HOMESTAY_OWNER">เจ้าของที่พัก (Homestay Owner)</option>
                <option value="WELLNESS_OWNER">เจ้าของสปา/Wellness (Wellness Owner)</option>
                <option value="OTOP_OWNER">ผู้ขายสินค้า OTOP (OTOP Owner)</option>
                <option value="RESTAURANT_OWNER">เจ้าของร้านอาหาร (Restaurant Owner)</option>
                <option value="COMMUNITY_ADMIN">แอดมินชุมชน (Community Admin)</option>
                <option value="SUPER_ADMIN">ผู้ดูแลระบบสูงสุด (Super Admin)</option>
              </select>
            </div>

            {updateRoleMutation.isError && (
              <p className="text-xs text-destructive">
                {extractErrorMessage(updateRoleMutation.error, "เกิดข้อผิดพลาดในการปรับสิทธิ์")}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingUser(null)}
                disabled={updateRoleMutation.isPending}
              >
                ยกเลิก
              </Button>
              <Button
                size="sm"
                onClick={() => updateRoleMutation.mutate()}
                disabled={updateRoleMutation.isPending}
                className="bg-forest-900 text-cream-100"
              >
                {updateRoleMutation.isPending ? "กำลังบันทึก..." : "ยืนยันการเปลี่ยนสิทธิ์"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
