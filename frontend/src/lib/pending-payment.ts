/**
 * lib/pending-payment.ts - remembers the just-created payment's expiry across
 * the checkout -> payment navigation.
 *
 * WHY: GET /payments/{id}/ does not expose the booking's `expires_at` (it
 * lives on the Booking row), but the payment page countdown needs it. We cache
 * the checkout response (payment_id -> expires_at/amount) in sessionStorage so
 * the countdown survives a page reload on the same tab, and remove it once the
 * payment is done. sessionStorage (NOT localStorage) on purpose: it is scoped
 * to the tab and dies with it - no stale orders linger on the device.
 */
interface PendingPayment {
  expires_at: string;
  amount: string;
  booking_code: string;
}

const STORAGE_KEY = "wt_pending_payment";

function readAll(): Record<string, PendingPayment> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PendingPayment>) : {};
  } catch {
    return {};
  }
}

function writeAll(record: Record<string, PendingPayment>): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Storage full / private mode - the countdown simply falls back to none.
  }
}

export function rememberPendingPayment(
  paymentId: string,
  pending: PendingPayment,
): void {
  const all = readAll();
  all[paymentId] = pending;
  writeAll(all);
}

export function getPendingPayment(paymentId: string): PendingPayment | null {
  return readAll()[paymentId] ?? null;
}

export function forgetPendingPayment(paymentId: string): void {
  const all = readAll();
  if (!(paymentId in all)) {
    return;
  }
  delete all[paymentId];
  writeAll(all);
}
