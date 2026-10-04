/** Missing catalogue media stays neutral; never substitute another business photo. */
export type PlaceholderKind = "hotel" | "room" | "food" | "wellness" | "otop";
export function placeholderUrl(_kind: PlaceholderKind, _seed: string, _width = 800): string {
  return "/images/catalog-placeholder.svg";
}
export function displayImage(candidate: string | null | undefined, kind: PlaceholderKind, seed: string, width = 800): string {
  return candidate?.trim() || placeholderUrl(kind, seed, width);
}
