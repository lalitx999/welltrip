/**
 * api-client.ts - the single configured Axios instance (spec Networking:
 * "Axios Instance with Request/Response Interceptors for Bearer JWT
 * Handling and Silent Refresh").
 *
 * Design decisions:
 *   - A Bearer header is attached automatically when an access token exists.
 *   - On a 401 the interceptor tries ONE silent refresh and replays the
 *     original request. Concurrent 401s share a single refresh promise
 *     ("single-flight") so the browser never fires a refresh storm.
 *   - Auth endpoints themselves are never auto-retried.
 */
import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import { tokenManager } from "@/lib/token-manager";
import type { ApiSuccess } from "@/types/api";
import type { RefreshResponse } from "@/types/auth";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// --- Request interceptor: attach Bearer access token ----------------------
apiClient.interceptors.request.use((config) => {
  const token = tokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Silent refresh (single-flight) ---------------------------------------
let refreshPromise: Promise<string> | null = null;

async function requestNewAccessToken(): Promise<string> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) {
    throw new Error("NO_REFRESH_TOKEN");
  }
  // Use a BARE axios call (not apiClient) to avoid recursive interceptors.
  const { data } = await axios.post<ApiSuccess<RefreshResponse>>(
    `${API_BASE_URL}/api/v1/auth/refresh/`,
    { refresh: refreshToken },
    { timeout: 15_000 },
  );
  tokenManager.setTokens(data.data);
  return data.data.access_token;
}

/** Force a refresh now (used by auth hydration). */
export async function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = requestNewAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  await refreshPromise;
}

// --- Response interceptor: retry-once after silent refresh ----------------
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    if (
      !original ||
      original._retry ||
      error.response?.status !== 401 ||
      !tokenManager.getRefreshToken() ||
      (original.url ?? "").includes("/auth/")
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      await refreshAccessToken();
      const token = tokenManager.getAccessToken();
      original.headers.Authorization = `Bearer ${token ?? ""}`;
      return apiClient(original);
    } catch (refreshError) {
      // Refresh failed (expired/rotated/reused) -> drop session.
      tokenManager.clear();
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
      return Promise.reject(refreshError);
    }
  },
);
