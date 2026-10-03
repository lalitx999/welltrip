/**
 * lib/api/errors.ts - shared Axios error -> message/code utils.
 *
 * WHY a NEW file instead of importing extractApiErrorMessage from lib/auth-api:
 * that module was written and reviewed together with the auth pages, and the
 * project handover (docs/C5.md §5) says not to touch reviewed auth files unless
 * asked. This is the shared home that the catalog/cart/checkout pages will use;
 * auth keeps its private copy until a Phase-2 cleanup merges the two (that
 * refactor would need a fresh user review).
 *
 * The backend error envelope puts the best human-readable text in `message`,
 * but field-level DRF validation errors live in `error.details` as a map of
 * field -> array-of-strings, so those win when present (mirrors auth-api.ts).
 *
 * SECURITY note: `message` and `details` originate from OUR backend only; they
 * are still user-influenced strings (vendor-supplied names etc.), so pages
 * must render them through React text nodes, never dangerouslySetInnerHTML.
 */
import axios from "axios";

import type { ApiErrorEnvelope } from "@/types/auth";

/**
 * Best user-facing message for an unknown Axios error.
 * Returns the backend `message` (or a field-level detail when present);
 * falls back to `fallback` when the request never reached a JSON envelope
 * (network down, timeout, HTML error page). Callers should pass a localized
 * fallback string via useI18n().t(...).
 */
export function extractErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (axios.isAxiosError<ApiErrorEnvelope>(error)) {
    const envelope = error.response?.data;
    if (envelope) {
      const details = envelope.error?.details;
      // Field-level validation: { fieldName: ["message", ...], ... }
      if (details && typeof details === "object" && !Array.isArray(details)) {
        const first = Object.values(details)[0];
        if (Array.isArray(first) && typeof first[0] === "string") {
          return first[0];
        }
      }
      if (envelope.message) {
        return envelope.message;
      }
    }
  }
  return fallback;
}

/**
 * Machine-readable `error.code` from the envelope (e.g. ROOM_UNAVAILABLE,
 * VALIDATIONERROR, NOTFOUND). Useful for branching on business errors
 * (409 conflict on checkout) before falling back to a generic message.
 */
export function extractErrorCode(error: unknown): string | null {
  if (axios.isAxiosError<ApiErrorEnvelope>(error)) {
    return error.response?.data?.error?.code ?? null;
  }
  return null;
}
