import type { ResumeResponse, ResumeUploadRequest, SoftSkillOutputResponse } from '@cato/shared';
import { apiGet, apiPost, apiRequest } from './client';

export function skipResume(accessToken: string) {
  return apiPost<ResumeResponse>('/onboarding/resume/skip', accessToken);
}

export function uploadResume(accessToken: string, body: ResumeUploadRequest) {
  return apiPost<ResumeResponse>('/resume/upload', accessToken, body);
}

export function getResume(accessToken: string) {
  return apiGet<ResumeResponse>('/resume', accessToken);
}

export function deleteResume(accessToken: string) {
  return apiRequest<{ deleted: true }>('/resume', {
    method: 'DELETE',
    accessToken
  });
}

export function getSoftSkills(accessToken: string) {
  return apiGet<SoftSkillOutputResponse>('/profile/soft-skills', accessToken);
}
