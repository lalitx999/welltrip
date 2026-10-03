/**
 * auth-api.ts - typed wrappers around the backend auth endpoints.
 * Views/components call these functions; they never touch axios directly.
 */
import axios from "axios";

import { apiClient } from "@/lib/api-client";
import type { ApiSuccess } from "@/types/api";
import type {
  ApiErrorEnvelope,
  GoogleOAuthResponse,
  LoginResponse,
  RegisterResponse,
  UserProfile,
} from "@/types/auth";

export interface RegisterPayload {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export async function apiRegister(
  payload: RegisterPayload,
): Promise<UserProfile> {
  const { data } = await apiClient.post<ApiSuccess<RegisterResponse>>(
    "/api/v1/auth/register/",
    payload,
  );
  return data.data.user;
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiSuccess<LoginResponse>>("/api/v1/auth/login/", {
    email,
    password,
  });
  return data.data;
}

export async function apiGoogleLogin(
  idToken: string,
): Promise<GoogleOAuthResponse> {
  const { data } = await apiClient.post<ApiSuccess<GoogleOAuthResponse>>(
    "/api/v1/auth/oauth/google/",
    { id_token: idToken },
  );
  return data.data;
}

export async function apiGetMe(): Promise<UserProfile> {
  const { data } = await apiClient.get<ApiSuccess<UserProfile>>("/api/v1/auth/me/");
  return data.data;
}

/**
 * Turn any Axios error into a human-readable message.
 * The backend error envelope puts the best user-facing text in `message`,
 * but field-level validation details (register form) are more useful.
 */
export function extractApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorEnvelope>(error)) {
    const envelope = error.response?.data;
    if (envelope) {
      const details = envelope.error?.details;
      if (details && typeof details === "object") {
        const first = Object.values(details)[0];
        if (Array.isArray(first) && typeof first[0] === "string") {
          return first[0];
        }
      }
      if (envelope.message) {
        return envelope.message;
      }
    }
    if (error.code === "ECONNABORTED") {
      return "The request timed out. Please try again.";
    }
    if (!error.response) {
      return "Cannot reach the server. Is the backend running?";
    }
    return "Something went wrong. Please try again.";
  }
  return "Unexpected error. Please try again.";
}
