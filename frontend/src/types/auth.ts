/**
 * Shared TypeScript models for auth API payloads and responses.
 * Mirrors the Django serializer output (see backend serializers.py).
 */

export const USER_ROLES = [
  "TOURIST",
  "HOMESTAY_OWNER",
  "RESTAURANT_OWNER",
  "WELLNESS_OWNER",
  "OTOP_OWNER",
  "COMMUNITY_ADMIN",
  "SUPER_ADMIN",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: UserRole;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse {
  user: UserProfile;
  access_token: string;
  refresh_token: string;
}

export interface RegisterResponse {
  user: UserProfile;
}

export interface GoogleOAuthResponse extends LoginResponse {
  is_new_user: boolean;
}

export interface RefreshResponse extends AuthTokens {}

/** Standard error envelope returned by the backend (spec §4). */
export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    details: unknown;
  };
  message: string;
}
