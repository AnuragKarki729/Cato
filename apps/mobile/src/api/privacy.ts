import type { MeResponse } from '@cato/shared';
import { apiPost } from './client';

export function acceptPrivacyConsent(
  accessToken: string,
  body: { resume?: boolean; video?: boolean; privacyPolicy?: boolean }
) {
  return apiPost<MeResponse>('/privacy/consent', accessToken, body);
}
