import type {
  RecruiterBookmarksResponse,
  RecruiterCandidateResponse,
  RecruiterCandidatesResponse,
  RecruiterContactCandidateRequest,
  RecruiterDashboardResponse,
  RecruiterMessagesResponse,
  RecruiterSyncResponse
} from '@cato/shared';
import { apiGet, apiPost, apiRequest } from './client';

export function syncRecruiter(accessToken: string) {
  return apiPost<RecruiterSyncResponse>('/recruiter/auth/sync', accessToken);
}

export function getRecruiterDashboard(accessToken: string) {
  return apiGet<RecruiterDashboardResponse>('/recruiter/dashboard', accessToken);
}

export function getRecruiterCandidates(accessToken: string) {
  return apiGet<RecruiterCandidatesResponse>('/recruiter/candidates', accessToken);
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

export function deleteRecruiterAccount(accessToken: string) {
  return apiRequest<{ deleted: true }>('/recruiter/account', {
    method: 'DELETE',
    accessToken
  });
}
