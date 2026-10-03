"use client";

/**
 * use-auth.tsx - AuthProvider + useAuth() hook.
 *
 * The provider is responsible for ONE thing at boot: session hydration.
 * If a refresh token exists (returning visitor), it silently refreshes the
 * access token and restores the cached user profile; otherwise the user is
 * a guest. Login/logout actions are exposed through the context.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";

import {
  apiGoogleLogin,
  apiLogin,
  apiRegister,
  type RegisterPayload,
} from "@/lib/auth-api";
import { refreshAccessToken } from "@/lib/api-client";
import { tokenManager } from "@/lib/token-manager";
import { useAuthStore, type AuthStatus } from "@/store/auth-store";
import { useCartStore } from "@/store/cart-store";
import type { UserProfile } from "@/types/auth";

interface AuthContextValue {
  status: AuthStatus;
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<UserProfile>;
  loginWithGoogle: (idToken: string) => Promise<UserProfile>;
  register: (payload: RegisterPayload) => Promise<UserProfile>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const setStatus = useAuthStore((s) => s.setStatus);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  // --- Boot: silently refresh if we have a refresh token ----------------
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (!tokenManager.getRefreshToken()) {
        setStatus("guest");
        return;
      }
      setStatus("loading");
      try {
        await refreshAccessToken();
        const cachedUser = tokenManager.getCachedUser();
        if (cancelled) {
          return;
        }
        if (cachedUser) {
          setSession(cachedUser);
        } else {
          // Fresh pair obtained but no cached profile -> safest to log in again.
          clearSession();
          useCartStore.getState().clearCart();
        }
      } catch {
        if (!cancelled) {
          clearSession();
          useCartStore.getState().clearCart();
        }
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [setStatus, setSession, clearSession]);

  // --- Auth actions -------------------------------------------------------
  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiLogin(email, password);
      tokenManager.setTokens(res);
      setSession(res.user);
      return res.user;
    },
    [setSession],
  );

  const loginWithGoogle = useCallback(
    async (idToken: string) => {
      const res = await apiGoogleLogin(idToken);
      tokenManager.setTokens(res);
      setSession(res.user);
      return res.user;
    },
    [setSession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => apiRegister(payload),
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    useCartStore.getState().clearCart();
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login,
      loginWithGoogle,
      register,
      logout,
    }),
    [status, user, login, loginWithGoogle, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>.");
  }
  return ctx;
}
