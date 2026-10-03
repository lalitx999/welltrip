/**
 * types/booking.ts - models for the booking & payment flow
 * (cart, checkout, order history, payment/slip).
 *
 * Source of truth is the backend serializers (apps/bookings + apps/payments
 * serializers.py) and the checkout service return value
 * (apps/bookings/services.py execute_atomic_checkout). Read them before
 * changing any field here.
 *
 * The most important typing rule in the whole project (C3 §3.2):
 *   - WELLNESS_SESSION.entity_id is a NUMBER (the slot's BIGSERIAL pk)
 *   - ROOM_RESERVATION / FOOD_ORDER / OTOP_GOODS.entity_id is a UUID string
 * The cart keeps them distinguishable and toCheckoutPayload() preserves the
 * types (never stringify the wellness id, never numberify a UUID).
 */

/* ------------------------------------------------------------------ */
/* Enums (backend TextChoices)                                         */
/* ------------------------------------------------------------------ */

export const BOOKING_ITEM_TYPES = [
  "ROOM_RESERVATION",
  "WELLNESS_SESSION",
  "FOOD_ORDER",
  "OTOP_GOODS",
] as const;
export type CartItemType = (typeof BOOKING_ITEM_TYPES)[number];

export const BOOKING_STATUSES = [
  "AWAITING_PAYMENT",
  "PAYMENT_EXPIRED",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_CHANNELS = ["BANK_TRANSFER"] as const;
export type PaymentChannel = (typeof PAYMENT_CHANNELS)[number];

export const PAYMENT_STATUSES = ["PENDING", "SUCCESS", "FAILED", "EXPIRED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_SLIP_STATUSES = [
  "PENDING_CHECK",
  "VERIFIED",
  "REJECTED",
] as const;
export type PaymentSlipStatus = (typeof PAYMENT_SLIP_STATUSES)[number];

/** Query value accepted by GET /bookings/my-orders/?status= (backend maps
 * these to concrete Booking.status sets; "cancelled" also includes
 * PAYMENT_EXPIRED on the server side). */
export type MyOrdersTab = "active" | "completed" | "cancelled";

/* ------------------------------------------------------------------ */
/* Cart + checkout payload                                             */
/* ------------------------------------------------------------------ */

/** One line in the cart. entity_id is string for UUID items, number for
 * wellness slots (see file header). The *_display fields are UI-only and are
 * dropped by toCheckoutPayload() before hitting the API. */
export interface CartItem {
  item_type: CartItemType;
  entity_id: string | number;
  quantity: number;
  /** Room stays only. */
  checkin_date?: string; // YYYY-MM-DD
  checkout_date?: string; // YYYY-MM-DD
  /** Display fields. */
  title: string;
  /** Parsed from the API's Decimal string so cart math stays in JS numbers. */
  unit_price: number;
  image_url?: string;
  /** Optional - public APIs do not send vendor info yet (docs/C6.md). */
  vendor_id?: string;
  vendor_name?: string;
}

/** Exactly what POST /bookings/checkout/ accepts (backend CartItemSerializer). */
export interface CartItemPayload {
  item_type: CartItemType;
  entity_id: string | number;
  quantity: number;
  checkin_date?: string;
  checkout_date?: string;
}

/** Alias kept for callers that prefer the "CheckoutPayload" wording. */
export type CheckoutPayload = CartItemPayload;

/* ------------------------------------------------------------------ */
/* Checkout result (bookings/services.py execute_atomic_checkout)      */
/* ------------------------------------------------------------------ */

export interface CheckoutResult {
  booking_id: string;
  booking_code: string;
  status: BookingStatus;
  total_subtotal: string;
  platform_fee: string;
  net_amount: string;
  /** ISO datetime; the 15-minute countdown target. */
  expires_at: string;
  payment_id: string;
  payment_channel: PaymentChannel;
}

/* ------------------------------------------------------------------ */
/* Read models - orders (apps/bookings/serializers.py)                 */
/* ------------------------------------------------------------------ */

/** Compact row of GET /bookings/my-orders/ (BookingListSerializer). */
export interface Booking {
  id: string;
  booking_code: string;
  status: BookingStatus;
  total_subtotal: string;
  platform_fee: string;
  net_amount: string;
  expires_at: string;
  created_at: string;
  /** Reverse 1:1 payment.status - null only if no payment exists. */
  payment_status: PaymentStatus | null;
}

/** Query for GET /bookings/my-orders/. */
export interface MyOrdersQuery {
  status?: MyOrdersTab;
  page?: number;
  limit?: number;
}

/** One order line snapshot (BookingItemReadSerializer). */
export interface BookingItem {
  /** BIGSERIAL int. */
  id: number;
  item_type: CartItemType;
  /** Canonical string as stored by the backend (see file header). */
  entity_id: string;
  item_title_snapshot: string;
  unit_price_snapshot: string;
  quantity: number;
  total_price: string;
  /** Room: scheduled_date = check-in. Wellness: the session date. */
  scheduled_date: string | null;
  scheduled_end_date: string | null;
  /** Wellness session label (e.g. "09:00:00-10:00:00"). */
  scheduled_time_slot: string | null;
}

/** Payment fields nested in a booking (PaymentSummarySerializer). */
export interface PaymentSummary {
  id: string;
  payment_channel: PaymentChannel;
  /** Empty strings today - filled when the owner configures the account. */
  payee_account_number: string;
  payee_account_name: string;
  payee_bank: string;
  amount: string;
  status: PaymentStatus;
  paid_at: string | null;
}

/** Full order view (BookingDetailSerializer). */
export interface BookingDetail {
  id: string;
  booking_code: string;
  status: BookingStatus;
  total_subtotal: string;
  platform_fee: string;
  net_amount: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  items: BookingItem[];
  /** Always present in Phase 1 (checkout creates it) - typed nullable as a
   * defensive guard for any future booking without a payment attempt. */
  payment: PaymentSummary | null;
}

/* ------------------------------------------------------------------ */
/* Payments (apps/payments/serializers.py)                             */
/* ------------------------------------------------------------------ */

/** One uploaded slip (PaymentSlipSerializer). */
export interface PaymentSlip {
  id: string;
  /** Absolute media URL (backend renders it with request context). */
  image: string;
  original_filename: string;
  /** Decimal string or null until the slip provider reads it. */
  amount_seen: string | null;
  status: PaymentSlipStatus;
  provider_reference: string;
  checked_at: string | null;
  uploaded_at: string;
}

/** GET /payments/{id}/ (PaymentDetailSerializer). */
export interface PaymentDetail {
  id: string;
  booking_code: string;
  payment_channel: PaymentChannel;
  /** Empty strings until the product owner supplies the receiving account. */
  payee_account_number: string;
  payee_account_name: string;
  payee_bank: string;
  amount: string;
  status: PaymentStatus;
  expires_at?: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  slips: PaymentSlip[];
}

