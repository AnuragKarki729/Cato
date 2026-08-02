import type { AuthRoleResponse, ClaimAuthRoleRequest, MeResponse } from '@cato/shared';
import { apiGet, apiPost } from './client';

export function syncApplicant(accessToken: string) {
  return apiPost<MeResponse>('/auth/sync', accessToken);
}

export function getMe(accessToken: string) {
  return apiGet<MeResponse>('/me', accessToken);
}

export function getAuthRole(accessToken: string) {
  return apiGet<AuthRoleResponse>('/auth/role', accessToken);
}

export function claimAuthRole(accessToken: string, body: ClaimAuthRoleRequest) {
  return apiPost<AuthRoleResponse>('/auth/role', accessToken, body);
}
