import type {
  RecruiterBookmarksResponse,
  RecruiterCandidateResponse,
  RecruiterCandidateReviewResponse,
  RecruiterCandidateSearchFilters,
  RecruiterCandidatesResponse,
  RecruiterContactCandidateRequest,
  RecruiterDashboardResponse,
  RecruiterEvidenceQueueResponse,
  RecruiterInterestRequest,
  RecruiterInterestRequestsResponse,
  RecruiterMessagesResponse,
  RecruiterSavedFilterResponse,
  RecruiterSavedFiltersResponse,
  SendRecruiterInterestRequest,
  UpdateRecruiterCandidateReviewRequest,
  CreateRecruiterSavedFilterRequest,
  RecruiterSyncResponse
} from '@cato/shared';
import { apiGet, apiPost, apiRequest } from './client';

export function syncRecruiter(accessToken: string) {
  return apiPost<RecruiterSyncResponse>('/recruiter/auth/sync', accessToken);
}

export function getRecruiterDashboard(accessToken: string) {
  return apiGet<RecruiterDashboardResponse>('/recruiter/dashboard', accessToken);
}

export function getRecruiterCandidates(accessToken: string, filters: RecruiterCandidateSearchFilters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          params.append(key, String(item));
        }
      });
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();
  const path = queryString ? `/recruiter/candidates?${queryString}` : '/recruiter/candidates';

  return apiGet<RecruiterCandidatesResponse>(path, accessToken);
}

export function getRecruiterEvidenceQueue(accessToken: string, filters: RecruiterCandidateSearchFilters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          params.append(key, String(item));
        }
      });
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();
  const path = queryString ? `/recruiter/evidence-queue?${queryString}` : '/recruiter/evidence-queue';

  return apiGet<RecruiterEvidenceQueueResponse>(path, accessToken);
}

export function getRecruiterCandidate(accessToken: string, candidateId: string) {
  return apiGet<RecruiterCandidateResponse>(`/recruiter/candidates/${candidateId}`, accessToken);
}

export function getRecruiterBookmarks(accessToken: string) {
  return apiGet<RecruiterBookmarksResponse>('/recruiter/bookmarks', accessToken);
}

export function bookmarkRecruiterCandidate(accessToken: string, candidateId: string) {
  return apiPost<{ bookmarked: true }>(`/recruiter/candidates/${candidateId}/bookmark`, accessToken);
}

export function deleteRecruiterCandidateBookmark(accessToken: string, candidateId: string) {
  return apiRequest<{ bookmarked: false }>(`/recruiter/candidates/${candidateId}/bookmark`, {
    method: 'DELETE',
    accessToken
  });
}

export function updateRecruiterCandidateReview(
  accessToken: string,
  candidateId: string,
  body: UpdateRecruiterCandidateReviewRequest
) {
  return apiRequest<RecruiterCandidateReviewResponse>(`/recruiter/candidates/${candidateId}/review`, {
    method: 'PATCH',
    accessToken,
    body
  });
}

export function recordRecruiterCandidateActivity(
  accessToken: string,
  candidateId: string,
  type: 'resume_opened' | 'deeper_signal_opened'
) {
  return apiPost<{ recorded: true }>(`/recruiter/candidates/${candidateId}/activity`, accessToken, { type });
}

export function sendRecruiterInterestRequest(
  accessToken: string,
  candidateId: string,
  body: SendRecruiterInterestRequest
) {
  return apiPost<{ request: RecruiterInterestRequest }>(`/recruiter/candidates/${candidateId}/interest`, accessToken, body);
}

export function getRecruiterInterestRequests(accessToken: string) {
  return apiGet<RecruiterInterestRequestsResponse>('/recruiter/interest-requests', accessToken);
}

export function contactRecruiterCandidate(
  accessToken: string,
  candidateId: string,
  body: RecruiterContactCandidateRequest
) {
  return apiPost<{ sent: true }>(`/recruiter/candidates/${candidateId}/contact`, accessToken, body);
}

export function getRecruiterMessages(accessToken: string) {
  return apiGet<RecruiterMessagesResponse>('/recruiter/messages', accessToken);
}

export function getRecruiterSavedFilters(accessToken: string) {
  return apiGet<RecruiterSavedFiltersResponse>('/recruiter/saved-filters', accessToken);
}

export function createRecruiterSavedFilter(accessToken: string, body: CreateRecruiterSavedFilterRequest) {
  return apiPost<RecruiterSavedFilterResponse>('/recruiter/saved-filters', accessToken, body);
}

export function deleteRecruiterSavedFilter(accessToken: string, filterId: string) {
  return apiRequest<{ deleted: true }>(`/recruiter/saved-filters/${filterId}`, {
    method: 'DELETE',
    accessToken
  });
}

export function deleteRecruiterAccount(accessToken: string) {
  return apiRequest<{ deleted: true }>('/recruiter/account', {
    method: 'DELETE',
    accessToken
  });
}
