"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
  Navigation,
} from "lucide-react";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { useAuth } from "@/hooks/use-auth";
import { extractErrorMessage } from "@/lib/api/errors";
import { getLocationLogs, getLocationPolicy } from "@/lib/api/experience";
import { useI18n } from "@/lib/i18n";

const labels: Record<string, { th: string; en: string; tone: "success" | "danger" | "warning" }> = {
  granted: { th: "ยินยอม (Granted)", en: "Granted", tone: "success" },
  denied: { th: "ปฏิเสธ (Denied)", en: "Denied", tone: "danger" },
  timeout: { th: "หมดเวลา (Timeout)", en: "Timeout", tone: "warning" },
  unavailable: { th: "หาตำแหน่งไม่ได้", en: "Unavailable", tone: "danger" },
};

function getDistrictFromCoords(lat: string | number | null, lng: string | number | null): string {
  if (lat === null || lng === null || lat === "" || lng === "") return "ไม่ระบุตำแหน่ง (No GPS)";
  const numLat = typeof lat === "number" ? lat : parseFloat(lat);
  const numLng = typeof lng === "number" ? lng : parseFloat(lng);
  if (isNaN(numLat) || isNaN(numLng)) return "ไม่ระบุตำแหน่ง";

  if (numLat >= 14.4 && numLat <= 14.7 && numLng >= 104.5 && numLng <= 104.8) return "อ.กันทรลักษ์, จ.ศรีสะเกษ";
  if (numLat >= 14.4 && numLat <= 14.7 && numLng >= 104.3 && numLng < 104.5) return "อ.ขุนหาญ, จ.ศรีสะเกษ";
  if (numLat >= 14.4 && numLat <= 14.6 && numLng >= 104.0 && numLng < 104.3) return "อ.ภูสิงห์, จ.ศรีสะเกษ";
  if (numLat >= 14.9 && numLat <= 15.2 && numLng >= 104.2 && numLng <= 104.5) return "อ.เมืองศรีสะเกษ, จ.ศรีสะเกษ";
  if (numLat >= 15.0 && numLat <= 15.2 && numLng >= 104.0 && numLng < 104.2) return "อ.อุทุมพรพิสัย, จ.ศรีสะเกษ";
  if (numLat >= 15.2 && numLat <= 15.5 && numLng >= 104.0 && numLng <= 104.4) return "อ.ราษีไศล, จ.ศรีสะเกษ";
  return "อ.เมือง, จ.ศรีสะเกษ";
}

export default function LocationAdminPage() {
  const { locale } = useI18n();
  const { user } = useAuth();
  const allowed =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "COMMUNITY_ADMIN" ||
    Boolean(user?.is_superuser);

  const [searchQuery, setSearchQuery] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const query = useQuery({
    queryKey: ["location-admin"],
    queryFn: getLocationLogs,
    enabled: allowed,
    gcTime: 0,
  });

  const policy = useQuery({
    queryKey: ["location-policy"],
    queryFn: getLocationPolicy,
    enabled: allowed,
  });

  if (!allowed) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 font-medium">
        เฉพาะผู้ดูแลระบบสูงสุดเท่านั้น (Super Admin Only)
      </div>
    );
  }

  const logsList = query.data ?? [];

  const filteredLogs = logsList.filter((log) => {
    const coordStr = `${log.latitude ?? ""}, ${log.longitude ?? ""}`;
    const locationName = getDistrictFromCoords(log.latitude, log.longitude);
    const matchesSearch =
      coordStr.includes(searchQuery) ||
      locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(log.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(log.consent_version ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOutcome = outcomeFilter === "ALL" || log.outcome === outcomeFilter;
    return matchesSearch && matchesOutcome;
  });

  const paginatedLogs = filteredLogs.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-[#D97706] border border-[#D97706]/20">
              <MapPin className="h-5 w-5" />
            </div>
            <h1 className="font-serif text-xl font-bold text-[#1B2A24]">
              {locale === "th" ? "บันทึกตำแหน่งโดยความยินยอม (Location Logs)" : "Consent Location Logs"}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {locale === "th"
              ? `บันทึกพิกัด GPS และสถานที่ของผู้ใช้อัตโนมัติ (จัดเก็บสูงสุด ${policy.data?.retention_days || 7} วัน ปลอดชื่อผู้ใช้งาน)`
              : `Consented GPS location logs retained for ${policy.data?.retention_days || 7} days.`}
          </p>
        </div>

        <button
          type="button"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-[#1B2A24] hover:text-white text-[#1B2A24] font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${query.isFetching ? "animate-spin text-[#D97706]" : ""}`} />
          <span>โหลดข้อมูลล่าสุด</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder={
              locale === "th"
                ? "ค้นหาอำเภอ, จังหวัด, พิกัด GPS หรือรหัสบันทึก..."
                : "Search district, province, coordinates..."
            }
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-slate-200/80 rounded-xl text-xs font-semibold text-[#1B2A24] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={outcomeFilter}
            onChange={(e) => {
              setOutcomeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full sm:w-auto py-2.5 px-3 rounded-xl border border-slate-200/80 bg-[#FAF8F5] text-xs font-semibold text-[#1B2A24] outline-none cursor-pointer"
          >
            <option value="ALL">{locale === "th" ? "ผลลัพธ์ทั้งหมด" : "All Outcomes"}</option>
            <option value="granted">ยินยอม (Granted)</option>
            <option value="denied">ปฏิเสธ (Denied)</option>
            <option value="timeout">หมดเวลา (Timeout)</option>
            <option value="unavailable">หาตำแหน่งไม่ได้ (Unavailable)</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      {query.isPending ? (
        <ListLoading />
      ) : query.isError ? (
        <ListError
          message={extractErrorMessage(query.error, "ไม่สามารถโหลดข้อมูลบันทึกตำแหน่งได้")}
          onRetry={() => void query.refetch()}
        />
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-500 space-y-2">
          <MapPin className="mx-auto h-10 w-10 text-slate-300" />
          <p className="text-base font-bold text-[#1B2A24]">
            {locale === "th" ? "ไม่พบบันทึกตำแหน่งที่ตรงตามเงื่อนไข" : "No location logs found"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200/80 bg-slate-50/80 font-bold text-[#1B2A24]">
                  <tr>
                    <th className="px-4 py-3.5">วันที่และเวลาบันทึก</th>
                    <th className="px-4 py-3.5">สถานะความยินยอม</th>
                    <th className="px-4 py-3.5">อำเภอ / จังหวัด (พิกัด GPS)</th>
                    <th className="px-4 py-3.5">ความคลาดเคลื่อน</th>
                    <th className="px-4 py-3.5">วันหมดอายุบันทึก (TTL)</th>
                    <th className="px-4 py-3.5 text-right">เวอร์ชัน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedLogs.map((row) => {
                    const tagInfo = labels[row.outcome] || { th: row.outcome, en: row.outcome, tone: "warning" };
                    const districtName = getDistrictFromCoords(row.latitude, row.longitude);

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-[#1B2A24]">
                          {new Date(row.created_at).toLocaleString("th-TH")}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              tagInfo.tone === "success"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : tagInfo.tone === "danger"
                                ? "bg-rose-50 text-rose-600 border border-rose-200"
                                : "bg-amber-50 text-[#D97706] border border-[#D97706]/30"
                            }`}
                          >
                            <span>{locale === "th" ? tagInfo.th : tagInfo.en}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[#1B2A24]">
                          <div className="font-bold flex items-center gap-1.5 text-xs text-[#1B2A24]">
                            <Navigation className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                            <span>{districtName}</span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                            {row.latitude !== null && row.longitude !== null
                              ? `Lat: ${row.latitude}, Long: ${row.longitude}`
                              : "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {row.accuracy_m === null ? "—" : `±${row.accuracy_m} เมตร`}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                          {row.expires_at ? new Date(row.expires_at).toLocaleDateString("th-TH") : "—"}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-400">
                          v{row.consent_version}
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
            totalItems={filteredLogs.length}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(newPerPage) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
          />
        </div>
      )}
    </div>
  );
}
