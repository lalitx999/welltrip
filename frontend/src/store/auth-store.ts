/**
 * auth-store.ts - Zustand store for the authenticated user + session state.
 *
 * WHY Zustand (and not only React context): per spec, Zustand owns global
 * client states; the auth user is read by many components (nav bar,
 * profile, protected logic) and Zustand avoids re-render propagation noise.
 *
 * Tokens themselves are NOT kept here - they live in token-manager.
 */
import { create } from "zustand";

import { tokenManager } from "@/lib/token-manager";
import type { UserProfile } from "@/types/auth";

export type AuthStatus = "idle" | "loading" | "authenticated" | "guest";

interface AuthStoreState {
  status: AuthStatus;
  user: UserProfile | null;
  setStatus: (status: AuthStatus) => void;
  /** Call after tokens were already stored in token-manager. */
  setSession: (user: UserProfile) => void;
  setUser: (user: UserProfile) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthStoreState>()((set) => ({
  status: "idle",
  user: null,

  setStatus: (status) => set({ status }),

  setSession: (user) => {
    tokenManager.cacheUser(user);
    set({ user, status: "authenticated" });
  },

  setUser: (user) => {
    tokenManager.cacheUser(user);
    set({ user });
  },

  clearSession: () => {
    tokenManager.clear();
    set({ user: null, status: "guest" });
  },
}));
