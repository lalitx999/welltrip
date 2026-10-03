/**
 * token-manager.ts - single source of truth for JWT storage.
 *
 * SECURITY DECISION (please review, project rule ZERO-TRUST):
 *   - access token  : kept in MEMORY only. It is short-lived (15 min) and
 *                     disappears on page reload. Never persisted.
 *   - refresh token : persisted in localStorage FOR DEVELOPMENT ONLY.
 *
 * WHY not localStorage for the refresh token in production?
 *   If the app ever suffers an XSS attack, the attacker can read
 *   localStorage and steal the refresh token. Rotation + blacklist on the
 *   backend limits (but does not remove) the blast radius.
 *
 * TODO (R0, before production): move the refresh token into an httpOnly,
 * SameSite=Lax cookie set by the backend, and delete localStorage usage.
 * The rest of the code only talks to this module, so the swap is localised.
 */
import type { AuthTokens, UserProfile } from "@/types/auth";

const REFRESH_KEY = "wt_refresh_token";
const USER_KEY = "wt_user_profile";

let accessToken: string | null = null;

export const tokenManager = {
  /** Store a full token pair after login / refresh. */
  setTokens(tokens: AuthTokens): void {
    accessToken = tokens.access_token;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    }
  },

  /** Store only a fresh access token (after a silent refresh). */
  setAccessToken(token: string): void {
    accessToken = token;
  },

  getAccessToken(): string | null {
    return accessToken;
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage.getItem(REFRESH_KEY);
  },

  cacheUser(user: UserProfile): void {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  getCachedUser(): UserProfile | null {
    if (typeof window === "undefined") {
      return null;
    }
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as UserProfile;
    } catch {
      return null;
    }
  },

  /** Clear everything on logout or when a refresh finally fails. */
  clear(): void {
    accessToken = null;
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(REFRESH_KEY);
      window.localStorage.removeItem(USER_KEY);
    }
  },
};
