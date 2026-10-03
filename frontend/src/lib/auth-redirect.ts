/**
 * auth-redirect.ts
 * Helper function to determine the target landing page after authentication
 * based on user role.
 *
 * Rules:
 * - SUPER_ADMIN / COMMUNITY_ADMIN -> /admin
 * - Merchant Owners (HOMESTAY, RESTAURANT, WELLNESS, OTOP) -> /portal
 * - TOURIST / Default -> /home
 */

export function getRoleRedirectPath(role?: string | null): string {
  if (!role) return "/home";
  
  const normalizedRole = role.toUpperCase().trim();

  if (normalizedRole === "SUPER_ADMIN" || normalizedRole === "COMMUNITY_ADMIN") {
    return "/admin";
  }

  if (
    normalizedRole === "HOMESTAY_OWNER" ||
    normalizedRole === "RESTAURANT_OWNER" ||
    normalizedRole === "WELLNESS_OWNER" ||
    normalizedRole === "OTOP_OWNER"
  ) {
    return "/portal";
  }

  return "/home";
}
