/**
 * types/catalog.ts - read models for the PUBLIC catalog endpoints
 * (accommodations, foods, wellness, otop).
 *
 * These types mirror the DRF serializer output EXACTLY (backend apps:
 * accommodations/services/otop serializers.py - re-read before changing).
 * Three non-obvious API conventions are copied on purpose:
 *  1. Money is a STRING: DRF DecimalField renders "1000.00" (never a JS
 *     number) to avoid float rounding. Convert with Number()/parseFloat()
 *     only at render time.
 *  2. Time fields arrive as "HH:MM:SS". Wellness slot ids are INTEGERS
 *     (BIGSERIAL); every other entity id in the system is a UUID string.
 *  3. availability / capacity_available are the REAL remaining counts
 *     (a missing calendar row means "full inventory", resolved by backend).
 *
 * The public serializers do NOT expose vendor/owner info yet (backend gap -
 * see docs/C6.md known-issues), so these types have no vendor fields.
 */

/* ------------------------------------------------------------------ */
/* Enums - single source of truth for the filter chips and unions      */
/* ------------------------------------------------------------------ */

export const ACCOMMODATION_STATUSES = [
  "PENDING_VERIFICATION",
  "ACTIVE",
  "SUSPENDED",
] as const;
export type AccommodationStatus = (typeof ACCOMMODATION_STATUSES)[number];

export const FOOD_WELLNESS_CATEGORIES = [
  "LOW_SUGAR",
  "LOW_SODIUM",
  "ORGANIC",
  "HERBAL",
  "VEGAN",
] as const;
export type FoodWellnessCategory = (typeof FOOD_WELLNESS_CATEGORIES)[number];

export const OTOP_CATEGORIES = [
  "HERBAL_PRODUCT",
  "TEXTILE",
  "PROCESSED_FOOD",
  "CRAFT",
] as const;
export type OTOPCategory = (typeof OTOP_CATEGORIES)[number];

/* ------------------------------------------------------------------ */
/* Accommodation (apps/accommodations/serializers.py)                  */
/* ------------------------------------------------------------------ */

/** One gallery photo of a room. `id` is a BIGSERIAL int. */
export interface RoomImage {
  id: number;
  image_url: string;
  order: number;
  is_primary: boolean;
}

/** Public listing row (AccommodationSerializer). */
export interface Accommodation {
  image_url?: string;
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  subdistrict: string;
  district: string;
  province: string;
  postal_code: string;
  /** Decimal -> string or null when the vendor left it blank. */
  latitude: string | null;
  longitude: string | null;
  /** TimeField as "HH:MM:SS" (defaults 14:00:00 / 12:00:00). */
  checkin_time: string;
  checkout_time: string;
  status: AccommodationStatus;
  /** Cheapest ACTIVE room price (string) or null when no active room. */
  min_price_per_night: string | null;
  room_count: number;
  created_at: string;
}

export interface AccommodationQuery {
  province?: string;
  /** YYYY-MM-DD; backend requires checkin+checkout as a pair. */
  checkin?: string;
  checkout?: string;
  /** >= 1; keeps accommodations that have an ACTIVE room big enough. */
  guests?: number;
  /** Cheapest active room base price, in THB. */
  min_price?: number;
  max_price?: number;
  /** 1-based page (StandardPagination, default 20 / page). */
  page?: number;
  limit?: number;
}

/** GET /accommodations/{id}/rooms/ (NOT paginated - data is one object). */
export interface AccommodationRoomsQuery {
  checkin?: string;
  checkout?: string;
}

/** A room row enriched with live availability (RoomPublicSerializer). */
export interface RoomPublic {
  id: string;
  name: string;
  description: string;
  base_capacity: number;
  max_capacity: number;
  /** Decimal -> string, e.g. "1500.00". */
  base_price_per_night: string;
  total_inventory: number;
  amenities: Record<string, unknown>;
  is_active: boolean;
  images: RoomImage[];
  /**
   * When a date range was sent: `{ "YYYY-MM-DD": remainingCount, ... }` for
   * every night of the stay. Null when the request carried no dates.
   */
  availability: Record<string, number> | null;
  /** Total for the whole stay (string) or null when no dates were given. */
  total_price_for_stay: string | null;
}

/** Response of GET /accommodations/{id}/rooms/ (also carries the listing). */
export interface AccommodationRoomsResult {
  accommodation: Accommodation;
  rooms: RoomPublic[];
}

/* ------------------------------------------------------------------ */
/* Foods (apps/services/serializers.py: FoodMenuSerializer)            */
/* ------------------------------------------------------------------ */

export interface FoodMenu {
  id: string;
  name: string;
  description: string;
  /** Decimal -> string. */
  price: string;
  wellness_category: FoodWellnessCategory;
  calorie_estimate: number | null;
  is_available: boolean;
  image_url: string;
}

export interface FoodQuery {
  /** Single value or a list (joined as comma-separated for the API). */
  category?: FoodWellnessCategory | readonly FoodWellnessCategory[];
  max_calorie?: number;
  page?: number;
  limit?: number;
}

/* ------------------------------------------------------------------ */
/* Wellness (apps/services/serializers.py)                             */
/* ------------------------------------------------------------------ */

export interface WellnessService {
  image_url?: string;
  id: string;
  title: string;
  description: string;
  /** Decimal -> string. */
  price: string;
  duration_minutes: number;
  max_capacity_per_session: number;
  is_active: boolean;
}

export interface WellnessPageQuery {
  page?: number;
  limit?: number;
}

/**
 * One available session instance. IMPORTANT: `id` is an INT (BIGSERIAL) and
 * must be sent as an integer in checkout's entity_id - never as a UUID.
 */
export interface WellnessTimeSlot {
  id: number;
  slot_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  capacity_available: number;
}

/** Response of GET /wellness/{id}/slots/ (also carries the service). */
export interface WellnessSlotsResult {
  wellness_service: WellnessService;
  slots: WellnessTimeSlot[];
}

/* ------------------------------------------------------------------ */
/* OTOP (apps/otop/serializers.py: OTOPProductSerializer)              */
/* ------------------------------------------------------------------ */

export interface OTOPProduct {
  image_url?: string;
  id: string;
  name: string;
  category: OTOPCategory;
  description: string;
  /** Decimal -> string. */
  price: string;
  stock_quantity: number;
  sku: string;
  is_active: boolean;
}

export interface OTOPQuery {
  category?: OTOPCategory | readonly OTOPCategory[];
  search?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
}

