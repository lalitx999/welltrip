import { apiClient } from "@/lib/api-client";
import type { ApiSuccess } from "@/types/api";
export type ContentKind = "STORY" | "COMMUNITY" | "ATTRACTION";
export interface ContentEntry { id:string; kind:ContentKind; title:string; title_en:string; summary:string; summary_en:string; body:string; body_en:string; image_url:string; image_alt:string; location:string; starts_at:string|null; ends_at:string|null; is_published:boolean; updated_at:string }
export async function getContent(kind:ContentKind,page=1) { return (await apiClient.get<ApiSuccess<ContentEntry[]>>("/api/v1/content/",{params:{kind,page}})).data; }
export async function getContentDetail(id:string) { return (await apiClient.get<ApiSuccess<ContentEntry>>(`/api/v1/content/${id}/`)).data; }
export interface LocationPolicy { version:string; retention_days:number; coordinate_decimals:number; purpose:string }
export async function getLocationPolicy() { return (await apiClient.get<ApiSuccess<LocationPolicy>>("/api/v1/location/policy/")).data.data; }
export type LocationOutcome = "granted"|"denied"|"timeout"|"unavailable";
export async function recordLocation(payload:{consent:true;consent_version:string;outcome:LocationOutcome;latitude?:number;longitude?:number;accuracy_m?:number}) { await apiClient.post("/api/v1/location/events/",payload); }
export async function deleteLocationHistory() { await apiClient.delete("/api/v1/location/my-events/"); }

export type ContentDraft = Omit<ContentEntry,"id"|"updated_at">;
export async function getAdminContent() { return (await apiClient.get<ApiSuccess<ContentEntry[]>>("/api/v1/content-admin/")).data.data; }
export async function saveContent(payload:ContentDraft,id?:string) {
  const response = id ? await apiClient.patch<ApiSuccess<ContentEntry>>(`/api/v1/content-admin/${id}/`,payload) : await apiClient.post<ApiSuccess<ContentEntry>>("/api/v1/content-admin/",payload);
  return response.data.data;
}
export interface LocationLog { id:number;outcome:LocationOutcome;latitude:string|null;longitude:string|null;accuracy_m:number|null;consent_version:string;created_at:string;expires_at:string }
export async function getLocationLogs() { return (await apiClient.get<ApiSuccess<LocationLog[]>>("/api/v1/location/admin/")).data.data; }
