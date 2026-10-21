"use client";

import { useEffect, useState } from "react";
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
  Trash2,
  Loader2,
} from "lucide-react";

import { AdminPagination } from "@/components/admin/AdminPagination";
import { ListError, ListLoading } from "@/components/catalog/DataStates";
import { useAuth } from "@/hooks/use-auth";
import { extractErrorMessage } from "@/lib/api/errors";
import {
  deleteAdminLocationLogs,
  getLocationLogs,
  getLocationPolicy,
} from "@/lib/api/experience";
import { getDistanceToSisaket, reverseGeocode, formatDistanceText } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";

const labels: Record<string, { th: string; en: string; tone: "success" | "danger" | "warning" }> = {
  granted: { th: "ยินยอม (Granted)", en: "Granted", tone: "success" },
  denied: { th: "ปฏิเสธ (Denied)", en: "Denied", tone: "danger" },
  timeout: { th: "หมดเวลา (Timeout)", en: "Timeout", tone: "warning" },
  unavailable: { th: "หาตำแหน่งไม่ได้", en: "Unavailable", tone: "danger" },
};

function RealLocationCell({
  lat,
  lng,
  locale,
}: {
  lat: string | number | null;
  lng: string | number | null;
  locale: string;
}) {
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const numLat = lat !== null && lat !== "" ? (typeof lat === "number" ? lat : parseFloat(lat)) : null;
  const numLng = lng !== null && lng !== "" ? (typeof lng === "number" ? lng : parseFloat(lng)) : null;
  const isValid = numLat !== null && numLng !== null && !isNaN(numLat) && !isNaN(numLng);

  useEffect(() => {
    if (!isValid) return;
    let active = true;
    setLoading(true);
    reverseGeocode(numLat, numLng)
      .then((addr) => {
        if (active) setAddress(addr);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isValid, numLat, numLng]);

  if (!isValid) {
    return <span className="text-slate-400">ไม่ระบุพิกัด (No GPS)</span>;
  }

  const dist = getDistanceToSisaket({ lat: numLat, lng: numLng });

  return (
    <div>
      <div className="font-bold flex items-center gap-1.5 text-xs text-[#1B2A24]">
        <Navigation className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
        <span>{loading ? "กำลังระบุที่อยู่จริง..." : address || `พิกัด ${numLat}, ${numLng}`}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-slate-500 mt-0.5">
        <span>Lat: {numLat}, Long: {numLng}</span>
        <span className="text-slate-400 font-sans">
          • ห่างจากศรีสะเกษ {formatDistanceText(dist, locale === "th")}
        </span>
      </div>
    </div>
  );
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
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

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

  async function handleDeleteSingle(id: number) {
    if (!confirm("ยืนยันลบรายการบันทึกตำแหน่งนี้?")) return;
    setDeletingId(id);
    try {
      await deleteAdminLocationLogs(id);
      await query.refetch();
    } catch (err) {
      alert(`ลบไม่สำเร็จ: ${extractErrorMessage(err)}`);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleClearAll() {
    if (!confirm("คุณต้องการล้างประวัติการบันทึกตำแหน่งทั้งหมดในระบบใช่หรือไม่?")) return;
    setClearingAll(true);
    try {
      await deleteAdminLocationLogs(undefined, true);
      await query.refetch();
    } catch (err) {
      alert(`ล้างข้อมูลไม่สำเร็จ: ${extractErrorMessage(err)}`);
    } finally {
      setClearingAll(false);
    }
  }

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
    const matchesSearch =
      coordStr.includes(searchQuery) ||
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

        <div className="flex items-center gap-2 shrink-0">
          {logsList.length > 0 && (
            <button
              type="button"
              disabled={clearingAll}
              onClick={() => void handleClearAll()}
              className="px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              title="ล้างข้อมูลบันทึกตำแหน่งทั้งหมดออกจากฐานข้อมูล"
            >
              {clearingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span>{clearingAll ? "กำลังล้าง..." : "ล้างประวัติทั้งหมด"}</span>
            </button>
          )}

          <button
            type="button"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-[#1B2A24] hover:text-white text-[#1B2A24] font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${query.isFetching ? "animate-spin text-[#D97706]" : ""}`} />
            <span>โหลดข้อมูลล่าสุด</span>
          </button>
        </div>
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
            {locale === "th" ? "ไม่พบบันทึกตำแหน่งในระบบ (ฐานข้อมูลว่าง)" : "No location logs in database"}
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
                    <th className="px-4 py-3.5">เวอร์ชัน</th>
                    <th className="px-4 py-3.5 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedLogs.map((row) => {
                    const tagInfo = labels[row.outcome] || { th: row.outcome, en: row.outcome, tone: "warning" };

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
                          <RealLocationCell lat={row.latitude} lng={row.longitude} locale={locale} />
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {row.accuracy_m === null ? "—" : `±${row.accuracy_m} เมตร`}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                          {row.expires_at ? new Date(row.expires_at).toLocaleDateString("th-TH") : "—"}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-400">
                          v{row.consent_version}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            disabled={deletingId === row.id}
                            onClick={() => void handleDeleteSingle(row.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="ลบรายการนี้ออกจากฐานข้อมูล"
                          >
                            {deletingId === row.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
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
