/**
 * lib/api/catalog.ts - typed wrappers for the PUBLIC catalog endpoints
 * (accommodations, foods, wellness, otop). Views/pages call these functions;
 * they never touch axios directly (same rule as lib/auth-api.ts).
 *
 * All GETs here are anonymous on the backend (AllowAny). Responses are the
 * standard envelope, so each function returns ApiSuccess<T> and the caller
 * reads `.data` (+ optional `.meta.pagination` for the paginated lists).
 *
 * On failure the Axios promise rejects - pages turn it into a message with
 * extractErrorMessage() from lib/api/errors.ts.
 *
 * NOTE on list shapes (do not assume one shape fits all):
 *   - accommodations, foods, wellness, otop            -> data: T[], meta.pagination
 *   - /accommodations/{id}/rooms/ and wellness slots   -> data: one object
 *     that nests its rows (see the *Result types).
 */
import { apiClient } from "@/lib/api-client";

import type { ApiSuccess } from "@/types/api";
import type {
  Accommodation,
  AccommodationQuery,
  AccommodationRoomsQuery,
  AccommodationRoomsResult,
  FoodMenu,
  FoodQuery,
  OTOPProduct,
  OTOPQuery,
  WellnessPageQuery,
  WellnessService,
  WellnessSlotsResult,
} from "@/types/catalog";

/**
 * Drop undefined/null/empty params so we never send `?key=` junk.
 * Accepts any object (interface, literal, spread) - deliberately loose to
 * avoid TS's "implicit index signature" rules on interfaces; the runtime
 * typeof guard is what keeps only string/number values.
 */
function buildParams(input: object): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    if (typeof value === "string" || typeof value === "number") {
      out[key] = value;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Accommodations                                                      */
/* ------------------------------------------------------------------ */

/** Paginated ACTIVE homestay list with optional filters. */
export async function getAccommodations(
  query: AccommodationQuery = {},
): Promise<ApiSuccess<Accommodation[]>> {
  const params = buildParams(query);
  const { data } = await apiClient.get<ApiSuccess<Accommodation[]>>(
    "/api/v1/accommodations/",
    { params },
  );
  return data;
}

/**
 * Rooms of one accommodation. Works with OR without a stay date range:
 * when dates are given each room carries per-night `availability` plus
 * `total_price_for_stay`; without dates `availability` is null. This single
 * call is also what the hotel detail page uses to fetch the accommodation.
 */
export async function getAccommodationRooms(
  accommodationId: string,
  query: AccommodationRoomsQuery = {},
): Promise<ApiSuccess<AccommodationRoomsResult>> {
  const params = buildParams(query);
  const { data } = await apiClient.get<ApiSuccess<AccommodationRoomsResult>>(
    `/api/v1/accommodations/${accommodationId}/rooms/`,
    { params },
  );
  return data;
}

/* ------------------------------------------------------------------ */
/* Foods                                                               */
/* ------------------------------------------------------------------ */

/** Paginated available food menus. `category` accepts a single value or a
 * list; both are sent as the comma-separated form the backend expects. */
export async function getFoods(
  query: FoodQuery = {},
): Promise<ApiSuccess<FoodMenu[]>> {
  const category = query.category
    ? Array.isArray(query.category)
      ? query.category.join(",")
      : query.category
    : undefined;
  const params = buildParams({
    category,
    max_calorie: query.max_calorie,
    page: query.page,
    limit: query.limit,
  });
  const { data } = await apiClient.get<ApiSuccess<FoodMenu[]>>(
    "/api/v1/foods/",
    { params },
  );
  return data;
}

/* ------------------------------------------------------------------ */
/* Wellness                                                            */
/* ------------------------------------------------------------------ */

/** Paginated list of active wellness services. */
export async function getWellnessServices(
  query: WellnessPageQuery = {},
): Promise<ApiSuccess<WellnessService[]>> {
  const params = buildParams(query);
  const { data } = await apiClient.get<ApiSuccess<WellnessService[]>>(
    "/api/v1/wellness/",
    { params },
  );
  return data;
}

/**
 * Available time slots of ONE service on ONE date. `date` is required by the
 * backend (?date=YYYY-MM-DD). The response nests the service plus its slots;
 * slot.id is an INT and is what checkout expects for WELLNESS_SESSION.
 */
export async function getWellnessSlots(
  serviceId: string,
  date: string,
): Promise<ApiSuccess<WellnessSlotsResult>> {
  const { data } = await apiClient.get<ApiSuccess<WellnessSlotsResult>>(
    `/api/v1/wellness/${serviceId}/slots/`,
    { params: { date } },
  );
  return data;
}

/* ------------------------------------------------------------------ */
/* OTOP                                                                */
/* ------------------------------------------------------------------ */

/** Paginated active OTOP products with search/category/price filters. */
export async function getOTOPProducts(
  query: OTOPQuery = {},
): Promise<ApiSuccess<OTOPProduct[]>> {
  const category = query.category
    ? Array.isArray(query.category)
      ? query.category.join(",")
      : query.category
    : undefined;
  const params = buildParams({
    category,
    search: query.search,
    min_price: query.min_price,
    max_price: query.max_price,
    page: query.page,
    limit: query.limit,
  });
  const { data } = await apiClient.get<ApiSuccess<OTOPProduct[]>>(
    "/api/v1/otop/",
    { params },
  );
  return data;
}

