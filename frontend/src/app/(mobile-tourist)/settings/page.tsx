"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Languages,
  MapPin,
  ShieldCheck,
  Trash2,
  EyeOff,
  ChevronRight,
  KeyRound,
  Sparkles,
  Lock,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Navigation,
} from "lucide-react";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useTravelCopy } from "@/components/travel/travel-shell";
import {
  deleteLocationHistory,
  getMyLocation,
  getLocationPolicy,
  recordLocation,
} from "@/lib/api/experience";
import { getDistanceToSisaket, formatDistanceText, reverseGeocode } from "@/lib/geo";
import { formatDateText } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export default function SettingsPage() {
  const copy = useTravelCopy();
  const { locale } = useI18n();
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [realAddress, setRealAddress] = useState<string>("");

  // Fetch latest recorded location directly from PostgreSQL database
  const locationQuery = useQuery({
    queryKey: ["my-saved-location"],
    queryFn: getMyLocation,
    enabled: Boolean(user),
  });

  const savedLocation = locationQuery.data;

  useEffect(() => {
    if (savedLocation?.latitude && savedLocation?.longitude) {
      const lat = Number(savedLocation.latitude);
      const lng = Number(savedLocation.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        let active = true;
        reverseGeocode(lat, lng).then((addr) => {
          if (active) setRealAddress(addr);
        });
        return () => {
          active = false;
        };
      }
    } else {
      setRealAddress("");
    }
  }, [savedLocation?.latitude, savedLocation?.longitude]);

  const distanceKm =
    savedLocation?.latitude && savedLocation?.longitude
      ? getDistanceToSisaket({ lat: savedLocation.latitude, lng: savedLocation.longitude })
      : null;

  async function handleRemoveLocation() {
    setBusy(true);
    try {
      await deleteLocationHistory();
      // Clear client-side flags so new location can be re-requested
      try {
        localStorage.removeItem("wt_location_handled");
        localStorage.removeItem("wt_user_coords");
      } catch {}
      await locationQuery.refetch();
      setMessage({
        type: "success",
        text: copy(
          "ลบประวัติตำแหน่งจากฐานข้อมูลและอุปกรณ์เรียบร้อยแล้ว คุณสามารถขอสิทธิ์หรือบันทึกตำแหน่งใหม่ได้ทันที",
          "Location history has been removed from database and device. You can now request or update new location."
        ),
      });
      setConfirm(false);
    } catch {
      setMessage({
        type: "error",
        text: copy("ลบไม่สำเร็จ โปรดลองใหม่อีกครั้ง", "Could not delete location history. Please try again."),
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateLocation() {
    if (!navigator.geolocation) {
      setMessage({
        type: "error",
        text: copy("เบราว์เซอร์นี้ไม่รองรับการระบุพิกัด GPS", "Browser does not support geolocation."),
      });
      return;
    }

    setUpdatingLocation(true);
    try {
      const policy = await getLocationPolicy();

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            const newDistance = getDistanceToSisaket({ lat: userLat, lng: userLng });

            // 1. Record directly to PostgreSQL database via API
            await recordLocation({
              consent: true,
              consent_version: policy.version,
              outcome: "granted",
              latitude: Number(userLat.toFixed(2)),
              longitude: Number(userLng.toFixed(2)),
              accuracy_m: Math.min(40075000, Math.ceil(position.coords.accuracy)),
            });

            // 2. Save to client storage for local cache
            try {
              localStorage.setItem(
                "wt_user_coords",
                JSON.stringify({ lat: userLat, lng: userLng, distanceKm: newDistance })
              );
              localStorage.setItem("wt_location_handled", "true");
            } catch {}

            // 3. Refetch database state and resolve genuine address
            const realAddr = await reverseGeocode(userLat, userLng);
            setRealAddress(realAddr);
            await locationQuery.refetch();

            setMessage({
              type: "success",
              text: copy(
                `อัปเดตและบันทึกพิกัดจริงลงฐานข้อมูลเรียบร้อยแล้ว: อยู่ที่ ${realAddr} (ห่างจากศรีสะเกษ ${formatDistanceText(newDistance, true)})`,
                `Updated and recorded real location to database: ${realAddr} (${formatDistanceText(newDistance, false)} from Sisaket).`
              ),
            });
          } catch {
            setMessage({
              type: "error",
              text: copy("บันทึกพิกัดลงฐานข้อมูลไม่สำเร็จ", "Failed to save location to database."),
            });
          } finally {
            setUpdatingLocation(false);
          }
        },
        () => {
          setMessage({
            type: "error",
            text: copy("ไม่สามารถเข้าถึงพิกัด GPS ได้ โปรดตรวจสอบการอนุญาตในเบราว์เซอร์", "Could not access GPS. Please check browser permissions."),
          });
          setUpdatingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch {
      setMessage({
        type: "error",
        text: copy("โหลดนโยบายตำแหน่งไม่สำเร็จ", "Could not load location policy."),
      });
      setUpdatingLocation(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] py-8">
      <div className="max-w-3xl mx-auto px-4 space-y-6">
        
        {/* 1. Header */}
        <div className="space-y-1">
          <span className="text-xs font-bold text-[#D97706] tracking-wider uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            PREFERENCES & PRIVACY
          </span>
          <h1 className="text-2xl font-bold text-stone-900 font-serif">
            ตั้งค่าการใช้งาน
          </h1>
          <p className="text-stone-500 text-sm">
            จัดการภาษา การแจ้งเตือน และควบคุมสิทธิ์ความเป็นส่วนตัวของคุณ
          </p>
        </div>

        {/* Notification Message */}
        {message && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setMessage(null)}
              className="text-stone-500 hover:text-stone-900 font-bold ml-3"
            >
              ปิด
            </button>
          </div>
        )}

        {/* 2. Language & Regional Settings */}
        <section className="rounded-2xl bg-white p-5 border border-stone-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 shrink-0">
              <Languages className="w-5 h-5 text-stone-600" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-[#1B2A24]">
                ภาษาของเว็บไซต์ (Display Language)
              </h2>
              <p className="text-xs text-stone-500">
                สลับภาษารวดเร็วระหว่างภาษาไทยและภาษาอังกฤษ
              </p>
            </div>
          </div>
          <LanguageToggle />
        </section>

        {/* 3. Location & Privacy Control (Direct DB Integration) */}
        <section className="rounded-2xl bg-white p-5 border border-stone-200/80 shadow-xs space-y-5">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                <MapPin className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#1B2A24] flex items-center gap-2">
                  <span>สิทธิ์เข้าถึงพิกัดตำแหน่ง (Location Management)</span>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>PDPA Coarse Logging</span>
                  </span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  คำนวณระยะทางและแนะนำที่พักใกล้ตัว บันทึกลงฐานข้อมูลเฉพาะเมื่อคุณยินยอม
                </p>
              </div>
            </div>

            {/* Action Buttons Group */}
            {user && (
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  disabled={updatingLocation || busy}
                  onClick={() => void handleUpdateLocation()}
                  className="bg-[#1B2A24] hover:bg-stone-800 text-white px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  title="ขอสิทธิ์และอัปเดตพิกัดใหม่ลงฐานข้อมูล"
                >
                  {updatingLocation ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>{updatingLocation ? "กำลังอัปเดต..." : "อัปเดตตำแหน่งใหม่"}</span>
                </button>

                {savedLocation && (
                  <button
                    type="button"
                    disabled={updatingLocation || busy}
                    onClick={() => setConfirm(true)}
                    className="text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl text-xs font-semibold border border-rose-200/80 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="ลบข้อมูลพิกัดออกจากฐานข้อมูลและอุปกรณ์"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>ลบประวัติ</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Current Saved Location Status Card */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/60 space-y-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              สถานะข้อมูลพิกัดในฐานข้อมูล (Database Status)
            </span>
            {locationQuery.isLoading ? (
              <p className="text-xs text-stone-400">กำลังตรวจสอบข้อมูลจากฐานข้อมูล...</p>
            ) : savedLocation && savedLocation.latitude && savedLocation.longitude ? (
              <div className="space-y-1.5">
                {realAddress && (
                  <div className="flex items-center gap-1.5 text-xs text-[#1B2A24] font-bold">
                    <Navigation className="w-3.5 h-3.5 text-[#C49A45] shrink-0" />
                    <span>{realAddress}</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-600">
                  <span className="font-mono">
                    พิกัด: {savedLocation.latitude}° N, {savedLocation.longitude}° E
                  </span>
                  {distanceKm !== null && (
                    <span className="text-emerald-700 bg-emerald-100/60 border border-emerald-200 text-xs px-2 py-0.5 rounded-lg font-sans">
                      ห่างจากศรีสะเกษ {formatDistanceText(distanceKm, locale === "th")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500">
                  บันทึกล่าสุด: {formatDateText(savedLocation.created_at, locale)} • สถานะสิทธิ์: {savedLocation.outcome}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs font-medium text-stone-600">
                  ยังไม่มีการบันทึกข้อมูลพิกัดของคุณในฐานข้อมูล
                </p>
                <p className="text-[11px] text-stone-400">
                  คุณสามารถกดปุ่ม "อัปเดตตำแหน่งใหม่" ด้านบนเพื่อระบุพิกัดปัจจุบันและบันทึกลงฐานข้อมูลได้ทันที
                </p>
              </div>
            )}
          </div>

          {/* Confirm Deletion Box */}
          {confirm && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-3 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-900 leading-relaxed">
                  ยืนยันลบประวัติตำแหน่งทั้งหมดของคุณออกจากฐานข้อมูลระบบ และล้างแคชในอุปกรณ์?
                  (หลังจากลบแล้ว คุณจะสามารถขอตำแหน่งใหม่ได้)
                </p>
              </div>
              <div className="flex items-center gap-2 pl-6">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleRemoveLocation()}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  {busy ? "กำลังลบ..." : "ยืนยันลบข้อมูล"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setConfirm(false)}
                  className="bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          )}

          {/* Row 2: PDPA Privacy Policy Link */}
          <div
            onClick={() => setShowPrivacyModal(true)}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 shrink-0">
                <EyeOff className="w-5 h-5 text-stone-600" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-[#1B2A24]">
                  นโยบายความเป็นส่วนตัว (PDPA / Privacy Policy)
                </h3>
                <p className="text-xs text-stone-500">
                  อ่านข้อกำหนดและสิทธิ์ในการคุ้มครองข้อมูลส่วนบุคคลของคุณ
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-stone-400" />
          </div>
        </section>

        {/* 4. Account Security */}
        <section className="rounded-2xl bg-white p-5 border border-stone-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 shrink-0">
              <KeyRound className="w-5 h-5 text-stone-600" />
            </div>
            <div className="min-w-0 flex-1 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#1B2A24]">
                  เปลี่ยนรหัสผ่าน (Change Password)
                </h3>
                <p className="text-xs text-stone-500">
                  อัปเดตรหัสผ่านใหม่เพื่อความปลอดภัยของบัญชี
                </p>
              </div>
              <span className="text-xs font-semibold text-stone-400 bg-stone-100 px-3 py-1 rounded-lg">
                เข้าด้วย Google SSO
              </span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
