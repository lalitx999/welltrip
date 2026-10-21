"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, Loader2, X, CheckCircle2, MapPin, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useTravelCopy } from "./travel-shell";
import {
  getLocationPolicy,
  recordLocation,
  type LocationOutcome,
  type LocationPolicy,
} from "@/lib/api/experience";
import { getDistanceToSisaket, formatDistanceText, reverseGeocode } from "@/lib/geo";

export function LocationConsent() {
  const copy = useTravelCopy();
  const { status } = useAuth();
  const [policy, setPolicy] = useState<LocationPolicy | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [hidden, setHidden] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string>("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    try {
      if (localStorage.getItem("wt_location_handled") === "true") {
        setHidden(true);
      }
    } catch {
      // Ignore SSR/storage errors
    }
    return () => {
      mounted.current = false;
    };
  }, []);

  if (hidden) return null;

  async function loadPolicy() {
    try {
      setPolicy(await getLocationPolicy());
      setMessage("");
    } catch {
      setMessage(
        copy(
          "ยังโหลดรายละเอียดการเก็บข้อมูลไม่ได้ โปรดลองอีกครั้ง",
          "Could not load the data policy. Please try again."
        )
      );
    }
  }

  async function requestLocation() {
    if (!policy || !consent || busy || status !== "authenticated") return;
    if (!window.isSecureContext || !navigator.geolocation) {
      setMessage(
        copy(
          "อุปกรณ์นี้ไม่รองรับ หรือเว็บไซต์ต้องใช้ HTTPS คุณยังใช้งานต่อได้โดยไม่แชร์ตำแหน่ง",
          "Location requires a supported browser and HTTPS. You can continue without sharing."
        )
      );
      return;
    }
    setBusy(true);
    setMessage("");

    const save = async (
      outcome: LocationOutcome,
      position?: GeolocationPosition
    ) => {
      if (!mounted.current) return;
      try {
        if (position) {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          const distance = getDistanceToSisaket({ lat: userLat, lng: userLng });
          setCalculatedDistance(distance);

          reverseGeocode(userLat, userLng).then((addr) => {
            if (mounted.current) setDetectedAddress(addr);
          });

          try {
            localStorage.setItem(
              "wt_user_coords",
              JSON.stringify({ lat: userLat, lng: userLng, distanceKm: distance })
            );
          } catch {}
        }

        await recordLocation({
          consent: true,
          consent_version: policy.version,
          outcome,
          ...(position
            ? {
                latitude: Number(position.coords.latitude.toFixed(2)),
                longitude: Number(position.coords.longitude.toFixed(2)),
                accuracy_m: Math.min(
                  40075000,
                  Math.ceil(position.coords.accuracy)
                ),
              }
            : {}),
        });
      } catch {
        // Proceed even if network record fails
      } finally {
        if (mounted.current) {
          setBusy(false);
          setConsent(false);
          if (!position) {
            // If denied or failed, hide immediately
            try {
              localStorage.setItem("wt_location_handled", "true");
            } catch {}
            setHidden(true);
          }
        }
      }
    };

    navigator.geolocation.getCurrentPosition(
      (p) => {
        void save("granted", p);
      },
      (error) => {
        void save(
          error.code === 1
            ? "denied"
            : error.code === 3
            ? "timeout"
            : "unavailable"
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  const handleDismiss = () => {
    try {
      localStorage.setItem("wt_location_handled", "true");
    } catch {}
    setHidden(true);
  };

  return (
    <div className="wt-location wt-panel bg-white border border-[#e5e7eb] rounded-3xl p-5 shadow-sm relative transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <LocateFixed size={20} className="text-[#c49a45] shrink-0" />
          <h3 className="font-serif text-base font-bold text-[#1f2925]">
            {copy("แชร์ตำแหน่งปัจจุบันเพื่อวางแผนการเดินทาง", "Share location for trip planning")}
          </h3>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-[#6b7280] hover:text-[#1f2925] p-1 rounded-full transition"
          title={copy("ซ่อน", "Hide")}
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {calculatedDistance !== null ? (
          /* Success Result State */
          <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-emerald-950 font-serif">
                  {detectedAddress
                    ? copy(`ตำแหน่งของคุณ: ${detectedAddress}`, `Your Location: ${detectedAddress}`)
                    : copy("บันทึกพิกัดตำแหน่งของคุณเรียบร้อยแล้ว", "Location successfully detected")}
                </p>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {copy(
                    `ขณะนี้คุณอยู่ห่างจากแหล่งท่องเที่ยวศรีสะเกษ ${formatDistanceText(calculatedDistance, true)} ระบบพร้อมช่วยแนะนำเส้นทาง โฮมสเตย์ และกิจกรรมเพื่อสุขภาพ`,
                    `You are currently ${formatDistanceText(calculatedDistance, false)} from Sisaket attractions. WellTrip is ready to guide your journey.`
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-1.5 bg-[#1B2A24] text-white hover:bg-stone-800 rounded-xl text-xs font-semibold transition-all shadow-xs"
              >
                {copy("รับทราบ / ปิดการแจ้งเตือน", "Got it / Close")}
              </button>
            </div>
          </div>
        ) : (
          /* Normal Prompt State */
          <>
            <p className="wt-muted text-xs leading-relaxed">
              {copy(
                "เราขอตำแหน่งเพื่อคำนวณระยะทางจากจุดที่คุณอยู่ไปยังโฮมสเตย์และสถานที่ท่องเที่ยว โดยไม่ติดตามเบื้องหลังและไม่ส่งต่อให้บุคคลภายนอก",
                "We request your location to calculate real distance to attractions and homestays. No background tracking or 3rd-party sharing."
              )}
            </p>

            {policy ? (
              <p className="wt-muted text-xs leading-relaxed bg-[#faf9f6] p-3 rounded-2xl border border-[#e5e7eb]">
                {copy(
                  `บันทึกเฉพาะพิกัดที่ปัดเหลือ 2 ตำแหน่งทศนิยม (ประมาณระดับกิโลเมตร) เก็บ ${policy.retention_days} วัน เพื่อการวิเคราะห์และการวางแผนเดินทาง`,
                  `Only coordinates rounded to 2 decimals (roughly kilometre scale) are logged for ${policy.retention_days} days for travel guidance.`
                )}
              </p>
            ) : (
              <button
                type="button"
                className="wt-button secondary text-xs py-2 px-4 min-h-[38px]"
                onClick={() => void loadPolicy()}
              >
                {copy("โหลดรายละเอียดการเก็บข้อมูล", "Load data policy")}
              </button>
            )}

            {status === "authenticated" ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs text-[#1f2925] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    disabled={!policy}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1f2925] focus:ring-[#c49a45]"
                  />
                  <span>
                    {copy(
                      "ยินยอมให้ขอตำแหน่งและคำนวณระยะทาง",
                      "I agree to share location for distance calculation."
                    )}
                  </span>
                </label>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    className="wt-button text-xs py-2 px-5 min-h-[40px]"
                    type="button"
                    disabled={!policy || !consent || busy}
                    onClick={() => void requestLocation()}
                  >
                    {busy ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <LocateFixed size={15} />
                    )}
                    <span>{copy("แชร์ตำแหน่ง", "Share location")}</span>
                  </button>
                  <button
                    className="wt-button secondary text-xs py-2 px-4 min-h-[40px]"
                    type="button"
                    onClick={handleDismiss}
                  >
                    <span>{copy("ข้ามไปก่อน", "Skip")}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-2">
                <Link className="wt-button secondary text-xs py-2 px-4 min-h-[38px]" href="/login">
                  {copy("เข้าสู่ระบบก่อนแชร์ตำแหน่ง", "Sign in to share location")}
                </Link>
                <button
                  className="text-xs text-[#6b7280] hover:underline cursor-pointer"
                  type="button"
                  onClick={handleDismiss}
                >
                  {copy("ข้ามไปก่อน", "Skip")}
                </button>
              </div>
            )}
          </>
        )}

        {message && (
          <p role="status" className="wt-muted text-xs text-[#c49a45] font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
