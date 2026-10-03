/**
 * lib/images.ts - display-image helper with Unsplash fallbacks.
 *
 * WHY: Phase 1 media is not populated yet (room images are usually empty,
 * OTOP products have no image_url field at all). Until real photos exist the
 * UI shows a tasteful Unsplash placeholder instead of an empty box/icon
 * (user decision, Module-4 UI revision). The chosen photo IDs were verified
 * reachable (HTTP 200) before being hardcoded.
 *
 * Usage rule: ALWAYS route catalog photos through displayImage() - it keeps
 * one switch point ("has real image ? real : fallback") so the placeholders
 * disappear automatically once real media arrives.
 */

export type PlaceholderKind = "hotel" | "room" | "food" | "wellness" | "otop";

/** Verified-on-2026-09-09 Unsplash photo IDs (HTTP 200 via images.unsplash.com). */
const POOL: Record<PlaceholderKind, readonly string[]> = {
  hotel: [
    "1566073771259-6a8506099945", // resort pool
    "1611892440504-42a792e24d32", // hotel room
    "1506744038136-46273834b3fb", // landscape
    "1564013799919-ab600027ffc6", // house exterior
  ],
  room: [
    "1590490360182-c33d57733427", // bedroom
    "1524758631624-e2822e304c36", // interior
    "1586023492125-27b2c045efd7", // living room
  ],
  food: [
    "1546069901-ba9599a7e63c", // healthy bowl
    "1556910103-1c02745aae4d", // cooking/kitchen
    "1570172619644-dfd03ed5d881", // food flat lay
  ],
  wellness: [
    "1544161515-4ab6ce6db874", // spa
    "1441974231531-c6227db76b6e", // nature/forest
    "1470071459604-3b5ec3a7fe05", // mountain mist
  ],
  otop: [
    "1512069772995-ec65ed45afd6", // handmade/herbal tone
    "1506744038136-46273834b3fb", // landscape texture
    "1441974231531-c6227db76b6e", // organic feel
  ],
};

/** Tiny deterministic hash so the SAME item always gets the SAME image. */
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Build an Unsplash fallback URL for a kind + seed (deterministic).
 * `width` picks the compression size (list thumbs ~400, hero/banners ~1200).
 */
export function placeholderUrl(
  kind: PlaceholderKind,
  seed: string,
  width = 800,
): string {
  const pool = POOL[kind];
  const id = pool[hashSeed(seed) % pool.length];
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`;
}

/**
 * Real image when present, else the deterministic Unsplash placeholder.
 * Pass the raw `image_url` field (may be "") as `candidate`.
 */
export function displayImage(
  candidate: string | null | undefined,
  kind: PlaceholderKind,
  seed: string,
  width = 800,
): string {
  const trimmed = candidate?.trim() ?? "";
  return trimmed ? trimmed : placeholderUrl(kind, seed, width);
}
