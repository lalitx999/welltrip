/**
 * lib/api/booking.ts - typed wrappers for the authenticated booking/payment
 * endpoints (checkout, my-orders, booking detail, payment detail, slip upload).
 * Views/pages call these functions; they never touch axios directly.
 *
 * SECURITY notes:
 *  - Every endpoint here is TOURIST-gated or owner-gated on the backend; the
 *    shared apiClient attaches the Bearer token and retries once after a
 *    silent refresh (lib/api-client.ts) - no per-call auth code needed.
 *  - checkout items must keep entity_id typed: number for WELLNESS_SESSION,
 *    UUID string otherwise (see types/booking.ts header - C3 §3.2).
 *  - The slip upload sends multipart/form-data; axios drops the instance-wide
 *    JSON content-type for FormData in the browser, letting it add the
 *    boundary itself.
 */
import { apiClient } from "@/lib/api-client";

import type { ApiSuccess } from "@/types/api";
import type {
  Booking,
  BookingDetail,
  CartItemPayload,
  CheckoutResult,
  MyOrdersQuery,
  PaymentDetail,
  PaymentSlip,
} from "@/types/booking";

/* ------------------------------------------------------------------ */
/* Checkout                                                            */
/* ------------------------------------------------------------------ */

/**
 * Atomic multi-vendor checkout (POST /bookings/checkout/).
 * Pass the FULL normalized cart payload; on success the response carries
 * booking_id + payment_id + expires_at needed by the payment page.
 * Business conflicts (room/slot/stock) reject as HTTP 409 with codes such as
 * ROOM_UNAVAILABLE - check extractErrorCode() before showing a message.
 */
export async function checkout(
  items: CartItemPayload[],
  idempotencyKey?: string,
): Promise<ApiSuccess<CheckoutResult>> {
  const headers: Record<string, string> = {};
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }
  const { data } = await apiClient.post<ApiSuccess<CheckoutResult>>(
    "/api/v1/bookings/checkout/",
    items,
    { headers },
  );
  return data;
}

/* ------------------------------------------------------------------ */
/* Order history                                                       */
/* ------------------------------------------------------------------ */

/**
 * Paginated order history of the current tourist. `status` maps to the
 * backend tab sets: active/completed/cancelled (cancelled includes
 * PAYMENT_EXPIRED server-side). Omit it to fetch every booking.
 */
export async function getMyOrders(
  query: MyOrdersQuery = {},
): Promise<ApiSuccess<Booking[]>> {
  const params: Record<string, string | number> = {};
  if (query.status) {
    params.status = query.status;
  }
  if (query.page) {
    params.page = query.page;
  }
  if (query.limit) {
    params.limit = query.limit;
  }
  const { data } = await apiClient.get<ApiSuccess<Booking[]>>(
    "/api/v1/bookings/my-orders/",
    { params },
  );
  return data;
}

/** Full order: booking + every item snapshot + payment (owner only). */
export async function getBookingDetail(
  bookingId: string,
): Promise<ApiSuccess<BookingDetail>> {
  const { data } = await apiClient.get<ApiSuccess<BookingDetail>>(
    `/api/v1/bookings/${bookingId}/`,
  );
  return data;
}

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

/** Payment state + payee snapshot + slip history (booking owner only). */
export async function getPaymentDetail(
  paymentId: string,
): Promise<ApiSuccess<PaymentDetail>> {
  const { data } = await apiClient.get<ApiSuccess<PaymentDetail>>(
    `/api/v1/payments/${paymentId}/`,
  );
  return data;
}

/**
 * Upload one bank slip for a pending payment (multipart).
 * The backend stores it as PENDING_CHECK - verification is wired later when a
 * Slip Check provider exists, so the UI should say "uploaded, awaiting
 * verification", never "paid".
 */
export async function uploadPaymentSlip(
  paymentId: string,
  image: File,
): Promise<ApiSuccess<PaymentSlip>> {
  const formData = new FormData();
  formData.append("payment_id", paymentId);
  formData.append("image", image);

  const { data } = await apiClient.post<ApiSuccess<PaymentSlip>>(
    "/api/v1/payments/slips/upload/",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}
