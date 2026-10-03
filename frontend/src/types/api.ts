/**
 * types/api.ts - the shared API envelope shapes (spec §4 + backend
 * common/responses.py).
 *
 * The backend wraps EVERY response in one of two envelopes:
 *   success -> { success: true, data, message, meta? }
 *   failure -> { success: false, error: { code, details }, message }
 *
 * WHY a generic ApiSuccess<T> instead of per-endpoint response types:
 * every call site then unwraps `data` (plus the optional meta.pagination)
 * the same way, and a new endpoint only has to state its own `data` type.
 *
 * The failure envelope already exists as ApiErrorEnvelope in types/auth.ts
 * (auth was the first slice that needed it). We re-export that definition
 * here so the two files can never drift apart.
 */
import type { ApiErrorEnvelope } from "@/types/auth";

/** meta.pagination shape produced by StandardPagination (common/pagination.py). */
export interface PaginationMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

/** Success envelope: `{ success: true, data, message, meta? }`. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
  /** Present only on paginated endpoints (list views). */
  meta?: {
    pagination: PaginationMeta;
  };
}

/** Local name so api-layer code does not have to import the auth type file. */
export type ApiError = ApiErrorEnvelope;

/** Discriminated union of both envelopes (rarely needed - success is typical). */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
