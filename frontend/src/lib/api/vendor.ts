/**
 * lib/api/vendor.ts - typed wrappers for the VENDOR action endpoints used by
 * the (portal) module.
 *
 * Phase-1 capability note (docs/C12.md): the backend exposes ONLY these
 * action endpoints for vendors - set room pricing, create a wellness time
 * slot, adjust OTOP stock - plus content CREATE endpoints. There is no
 * vendor-scoped GET and no PATCH yet, so "see my own items" and
 * is_available toggles are Phase-2 work (do not invent endpoints).
 *
 * Ownership is enforced server-side: acting on somebody else's item returns
 * 403 (SURFACE the message, never swallow it).
 */
import { apiClient } from "@/lib/api-client";

import type { ApiSuccess } from "@/types/api";
import type { WellnessTimeSlot } from "@/types/catalog";

/** POST /accommodations/rooms/{id}/pricing/ - price_override: send null to
 * clear, omit to keep. available_count: omit to keep. One of them required. */
export interface RoomPricingPayload {
  date: string; // YYYY-MM-DD
  price_override?: string | null;
  available_count?: number;
}

export interface RoomPricingResult {
  room_id: string;
  date: string;
  price_override: string | null;
  available_count: number;
}

export interface WellnessSlotCreatePayload {
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM (backend parses TimeField)
  end_time: string;
  capacity?: number;
}

export interface StockAdjustPayload {
  delta: number; // signed int, never 0
}

export interface StockAdjustResult {
  id: string;
  stock_quantity: number;
}

export async function setRoomPricing(
  roomId: string,
  payload: RoomPricingPayload,
): Promise<ApiSuccess<RoomPricingResult>> {
  const { data } = await apiClient.post<ApiSuccess<RoomPricingResult>>(
    `/api/v1/accommodations/rooms/${roomId}/pricing/`,
    payload,
  );
  return data;
}

export async function createWellnessSlot(
  serviceId: string,
  payload: WellnessSlotCreatePayload,
): Promise<ApiSuccess<WellnessTimeSlot>> {
  const { data } = await apiClient.post<ApiSuccess<WellnessTimeSlot>>(
    `/api/v1/wellness/${serviceId}/slots/`,
    payload,
  );
  return data;
}

export async function adjustOtopStock(
  productId: string,
  payload: StockAdjustPayload,
): Promise<ApiSuccess<StockAdjustResult>> {
  const { data } = await apiClient.post<ApiSuccess<StockAdjustResult>>(
    `/api/v1/otop/${productId}/stock/`,
    payload,
  );
  return data;
}

/* ------------------------------------------------------------------ */
/* Stage S5 - Scoped GET and PATCH API wrappers                       */
/* ------------------------------------------------------------------ */

export async function getMyAccommodations<T = any>(): Promise<ApiSuccess<T>> {
  const { data } = await apiClient.get<ApiSuccess<T>>("/api/v1/accommodations/my/");
  return data;
}

export async function updateAccommodation<T = any>(
  id: string,
  payload: Record<string, unknown>,
): Promise<ApiSuccess<T>> {
  const { data } = await apiClient.patch<ApiSuccess<T>>(
    `/api/v1/accommodations/${id}/`,
    payload,
  );
  return data;
}

export async function updateRoom<T = any>(
  id: string,
  payload: Record<string, unknown>,
): Promise<ApiSuccess<T>> {
  const { data } = await apiClient.patch<ApiSuccess<T>>(
    `/api/v1/accommodations/rooms/${id}/`,
    payload,
  );
  return data;
}

export async function getMyFoods<T = any>(): Promise<ApiSuccess<T>> {
  const { data } = await apiClient.get<ApiSuccess<T>>("/api/v1/foods/my/");
  return data;
}

export async function updateFood<T = any>(
  id: string,
  payload: Record<string, unknown>,
): Promise<ApiSuccess<T>> {
  const { data } = await apiClient.patch<ApiSuccess<T>>(
    `/api/v1/foods/${id}/`,
    payload,
  );
  return data;
}

export async function getMyWellness<T = any>(): Promise<ApiSuccess<T>> {
  const { data } = await apiClient.get<ApiSuccess<T>>("/api/v1/wellness/my/");
  return data;
}

export async function updateWellness<T = any>(
  id: string,
  payload: Record<string, unknown>,
): Promise<ApiSuccess<T>> {
  const { data } = await apiClient.patch<ApiSuccess<T>>(
    `/api/v1/wellness/${id}/`,
    payload,
  );
  return data;
}

export async function getMyOtopProducts<T = any>(): Promise<ApiSuccess<T>> {
  const { data } = await apiClient.get<ApiSuccess<T>>("/api/v1/otop/my/");
  return data;
}

export async function updateOtopProduct<T = any>(
  id: string,
  payload: Record<string, unknown>,
): Promise<ApiSuccess<T>> {
  const { data } = await apiClient.patch<ApiSuccess<T>>(
    `/api/v1/otop/${id}/`,
    payload,
  );
  return data;
}

