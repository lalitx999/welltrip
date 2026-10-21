/**
 * WellTrip Image Display Helper with high-res local Sisaket Eco-Resort fallbacks.
 * Ensures no empty gray placeholder boxes ever appear.
 */
export type PlaceholderKind = "hotel" | "room" | "food" | "wellness" | "otop";

const FALLBACK_IMAGES: Record<PlaceholderKind, string[]> = {
  hotel: [
    "/images/hero_lanna_homestay.jpg",
    "/banner1.jpeg",
    "/images/village.webp",
    "/images/attractions/pha-mo-e-daeng.jpeg",
  ],
  room: [
    "/banner1.jpeg",
    "/images/hero_lanna_homestay.jpg",
    "/banner2.jpeg",
    "/images/sunset.webp",
  ],
  food: [
    "/images/organic_community_food.jpg",
    "/banner1.jpeg",
  ],
  wellness: [
    "/images/eco_wellness_spa.jpg",
    "/banner2.jpeg",
  ],
  otop: [
    "/images/cocoa_craft_sisaket.jpg",
    "/images/otop/sisaket-volcano-coffee-beans.jpg",
  ],
};

export function placeholderUrl(kind: PlaceholderKind, seed: string, _width = 800): string {
  const list = FALLBACK_IMAGES[kind] || FALLBACK_IMAGES.hotel;
  const hash = (seed || "welltrip")
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return list[hash % list.length];
}

export function displayImage(
  candidate: string | null | undefined,
  kind: PlaceholderKind,
  seed: string,
  width = 800,
): string {
  if (
    candidate &&
    candidate.trim() &&
    candidate !== "/images/catalog-placeholder.svg" &&
    !candidate.includes("placeholder")
  ) {
    return candidate.trim();
  }
  return placeholderUrl(kind, seed, width);
}
