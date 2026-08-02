import type {
  OnboardingStatusResponse,
  SaveEducationRequest,
  SaveEducationResponse,
  SignalPromptsResponse,
  UniversityMatchResponse,
  UniversitySearchResponse
} from '@cato/shared';
import { apiGet, apiPost } from './client';

export function getOnboardingStatus(accessToken: string) {
  return apiGet<OnboardingStatusResponse>('/onboarding/status', accessToken);
}

export function saveEducation(accessToken: string, body: SaveEducationRequest) {
  return apiPost<SaveEducationResponse>('/onboarding/education', accessToken, body);
}

export function searchUniversities(accessToken: string, query: string, options: { limit?: number; offset?: number } = {}) {
  const params = new URLSearchParams({
    q: query,
    limit: String(options.limit ?? 3),
    offset: String(options.offset ?? 0)
  });

  return apiGet<UniversitySearchResponse>(`/universities/search?${params.toString()}`, accessToken);
}

export function matchUniversityByEmail(accessToken: string, email: string) {
  return apiPost<UniversityMatchResponse>('/universities/match-email', accessToken, { email });
}

export function getSignalPrompts(accessToken: string) {
  return apiGet<SignalPromptsResponse>('/signal-prompts', accessToken);
}
