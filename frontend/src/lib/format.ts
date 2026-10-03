/**
 * lib/format.ts - display formatters shared by catalog/cart pages.
 *
 * WHY a tiny shared module instead of inline formatters in each page:
 * the API sends money as Decimal STRINGS ("1500.00") and time as "HH:MM:SS"
 * (see types/catalog.ts header). Every page would otherwise re-implement the
 * same parse/round/format logic and drift apart.
 *
 * NOTE: formatting is presentation-only - never feed formatBaht() output back
 * into a request body or cart math. Keep numbers/strings unformatted until
 * render time.
 */
import type { Locale } from "@/i18n/messages";

/** Best-effort number from a Decimal string/number/null (display only). */
export function toNumber(
  value: string | number | null | undefined,
): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

/**
 * "฿1,250.00" for money display. th-TH grouping can be ambiguous for the EN
 * locale, so we format with en-US thousands separators + a ฿ prefix.
 */
export function formatBaht(
  value: string | number | null | undefined,
): string {
  const formatted = toNumber(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `฿${formatted}`;
}

/** "09:00" from the backend's "09:00:00" time string. */
export function formatClockTime(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return value.length >= 5 ? value.slice(0, 5) : value;
}

/** Local calendar day as YYYY-MM-DD (backend date format / input[type=date]). */
export function todayISO(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Short date (e.g. "9/9/2569" for th, "Sep 9, 2026" for en) from an ISO date
 * string ("2026-09-09" or a full datetime). Display-only. */
export function formatDateText(value: string | null | undefined, locale: Locale): string {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parsed);
}

/** Short date + time (list headers, expiry lines). */
export function formatDateTimeText(value: string | null | undefined, locale: Locale): string {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsed);
}

/** mm:ss (or h:mm:ss beyond an hour) from a number of seconds - countdown. */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const mm = `${minutes}`.padStart(2, "0");
  const ss = `${seconds}`.padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Locale-aware price phrase: "550 บาท" in Thai, "฿550" in English (mock
 * design). Whole numbers drop the cents; decimals keep 2 places.
 */
export function formatPriceText(value: string | number | null | undefined, locale: Locale): string {
  const num = toNumber(value);
  const digits = Number.isInteger(num)
    ? num.toLocaleString(locale === "th" ? "th-TH" : "en-US")
    : num.toLocaleString(locale === "th" ? "th-TH" : "en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  return locale === "th" ? `${digits} บาท` : `฿${digits}`;
}
