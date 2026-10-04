/**
 * lib/api/ai.ts - API client functions for Dual-AI Health Recommendation Engine (DeepSeek + Gemini).
 */
import { apiClient } from "@/lib/api-client";
import type { ApiSuccess } from "@/types/api";

export interface HealthAssessmentPayload {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: string;
  health_goal: string;
  lifestyle?: string;
  dietary_restrictions?: string[];
}

export interface PackageItem {
  item_type: "ROOM_RESERVATION" | "FOOD_ORDER" | "WELLNESS_SESSION" | "OTOP_GOODS";
  entity_id: string;
  title: string;
  unit_price: string;
  quantity: number;
  category_label: string;
  image_url: string;
  detail_url?: string;
  requires_selection?: boolean;
}

export interface RecommendedPackage {
  package_title: string;
  duration_label: string;
  total_package_price: string;
  items: PackageItem[];
  ai_providers: string[];
  disclaimer: string;
}

export interface HealthMetrics {
  bmi: string;
  bmr: number;
  weight_kg: number;
  height_cm: number;
  health_goal: string;
}

export interface AIRecommendationResponse {
  health_metrics: HealthMetrics;
  deepseek_analysis: string;
  recommended_package: RecommendedPackage;
}

export async function submitHealthAssessment(
  payload: HealthAssessmentPayload,
): Promise<ApiSuccess<AIRecommendationResponse>> {
  const { data } = await apiClient.post<ApiSuccess<AIRecommendationResponse>>(
    "/api/v1/health/assessment/",
    payload,
  );
  return data;
}

export async function getMyHealthProfile(): Promise<ApiSuccess<HealthMetrics | null>> {
  const { data } = await apiClient.get<ApiSuccess<HealthMetrics | null>>(
    "/api/v1/health/my-profile/",
  );
  return data;
}
