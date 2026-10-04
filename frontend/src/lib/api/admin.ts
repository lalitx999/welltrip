/**
 * admin.ts - System Admin API client layer for WellTrip.
 * Uses apiClient (Axios with Bearer Token & Auto Refresh).
 * Strictly uses process.env configurations for endpoints without hardcoding.
 */
import { apiClient, API_BASE_URL } from "@/lib/api-client";
import type { ApiSuccess } from "@/types/api";
import type { UserProfile, UserRole } from "@/types/auth";

export const MEDIA_BASE_URL =
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? API_BASE_URL;

export interface AdminOverviewStats {
  total_gmv: number;
  total_bookings: number;
  total_users: number;
  total_merchants: number;
  total_accommodations: number;
  total_wellness_services: number;
  total_otop_products: number;
  pending_approvals: number;
  pending_payments: number;
}

export interface MerchantKYCRequest {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  business_name: string;
  business_type: "HOMESTAY" | "WELLNESS" | "OTOP" | "RESTAURANT";
  requested_role: UserRole;
  tax_id: string;
  document_url: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submitted_at: string;
}

export interface EntityApprovalItem {
  id: string;
  title: string;
  type: "ACCOMMODATION" | "WELLNESS" | "OTOP" | "RESTAURANT";
  owner_name: string;
  owner_email: string;
  province: string;
  price: number;
  image_url: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
}

export interface PaymentAuditItem {
  id: string;
  booking_reference: string;
  customer_name: string;
  amount: number;
  payment_method: "PROMPTPAY" | "OMISE_CREDIT_CARD";
  slip_image_url?: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "REFUNDED";
  created_at: string;
}

/** Get high-level executive dashboard statistics for Admin Overview. */
export async function getAdminOverviewStats(): Promise<ApiSuccess<AdminOverviewStats>> {
  const { data } = await apiClient.get<ApiSuccess<AdminOverviewStats>>(
    "/api/v1/analytics/overview/"
  );
  return data;
}

/** Get list of users and merchants with filtering. */
export async function getAdminUsers(params?: {
  role?: string;
  search?: string;
}): Promise<ApiSuccess<UserProfile[]>> {
  const { data } = await apiClient.get<ApiSuccess<UserProfile[]>>(
    "/api/v1/auth/users/",
    { params }
  );
  return data;
}

/** Update user role or verification status. */
export async function updateUserRole(
  userId: string,
  role: UserRole,
  is_verified = true
): Promise<ApiSuccess<UserProfile>> {
  const { data } = await apiClient.patch<ApiSuccess<UserProfile>>(
    `/api/v1/auth/users/${userId}/role/`,
    { role, is_verified }
  );
  return data;
}

/** Get list of pending entity approvals (Accommodations, Services, OTOP). */
export async function getPendingApprovals(): Promise<ApiSuccess<EntityApprovalItem[]>> {
  const { data } = await apiClient.get<ApiSuccess<EntityApprovalItem[]>>(
    "/api/v1/admin/approvals/"
  );
  return data;
}

/** Approve or Reject an entity registration. */
export async function updateEntityApprovalStatus(
  entityId: string,
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string
): Promise<ApiSuccess<{ id: string; status: string }>> {
  const { data } = await apiClient.post<ApiSuccess<{ id: string; status: string }>>(
    `/api/v1/admin/approvals/${entityId}/`,
    { status, rejection_reason: rejectionReason }
  );
  return data;
}

/** Get list of pending payment verification audits. */
export async function getPendingPayments(): Promise<ApiSuccess<PaymentAuditItem[]>> {
  const { data } = await apiClient.get<ApiSuccess<PaymentAuditItem[]>>(
    "/api/v1/payments/admin/pending/"
  );
  return data;
}

/** Approve or reject a payment slip audit. */
export async function verifyPaymentSlip(
  paymentId: string,
  status: "VERIFIED" | "REJECTED",
  note?: string
): Promise<ApiSuccess<{ id: string; status: string }>> {
  const { data } = await apiClient.post<ApiSuccess<{ id: string; status: string }>>(
    `/api/v1/payments/${paymentId}/verify/`,
    { status, note }
  );
  return data;
}
