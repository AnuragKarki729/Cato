import type {
  ApplicantInterestRequestsResponse,
  ApplicantActivityResponse,
  ApplicantProjectResponse,
  CompleteProfileRequest,
  CompleteProfileImageUploadRequest,
  InternshipResponse,
  PrepareProfileImageUploadRequest,
  PrepareProfileImageUploadResponse,
  ProfileResponse,
  ProfileImageSource,
  RespondToInterestRequest,
  SaveApplicantProjectRequest,
  SaveEducationRequest,
  SaveInternshipRequest,
  SaveEducationResponse,
  SoftSkillOutputResponse,
  SoftSkillUpdateRequest,
  UpdateApplicantRequest
} from '@cato/shared';
import { apiGet, apiPost, apiRequest } from './client';

export function completeOnboardingProfile(accessToken: string, body: CompleteProfileRequest) {
  return apiPost<{ onboardingStatus: string; nextRoute: string }>('/onboarding/profile', accessToken, body);
}

export function getProfile(accessToken: string) {
  return apiGet<ProfileResponse>('/profile', accessToken);
}

export function updateApplicant(accessToken: string, body: UpdateApplicantRequest) {
  return apiRequest<Pick<ProfileResponse, 'applicant'>>('/profile/applicant', {
    method: 'PATCH',
    accessToken,
    body
  });
}

export function prepareProfileImageUpload(accessToken: string, body: PrepareProfileImageUploadRequest) {
  return apiPost<PrepareProfileImageUploadResponse>('/profile/image/upload-url', accessToken, body);
}

export function completeProfileImageUpload(accessToken: string, body: CompleteProfileImageUploadRequest) {
  return apiPost<Pick<ProfileResponse, 'applicant'>>('/profile/image/complete', accessToken, body);
}

export function setProfileImageSource(accessToken: string, source: ProfileImageSource) {
  return apiRequest<Pick<ProfileResponse, 'applicant'>>('/profile/image/source', {
    method: 'PATCH',
    accessToken,
    body: { source }
  });
}

export function updateEducation(accessToken: string, body: SaveEducationRequest) {
  return apiRequest<SaveEducationResponse>('/profile/education', {
    method: 'PATCH',
    accessToken,
    body
  });
}

export function createInternship(accessToken: string, body: SaveInternshipRequest) {
  return apiPost<InternshipResponse>('/profile/internships', accessToken, body);
}

export function updateInternship(accessToken: string, internshipId: string, body: SaveInternshipRequest) {
  return apiRequest<InternshipResponse>(`/profile/internships/${internshipId}`, {
    method: 'PATCH',
    accessToken,
    body
  });
}

export function deleteInternship(accessToken: string, internshipId: string) {
  return apiRequest<{ deleted: true }>(`/profile/internships/${internshipId}`, {
    method: 'DELETE',
    accessToken
  });
}

export function createProject(accessToken: string, body: SaveApplicantProjectRequest) {
  return apiPost<ApplicantProjectResponse>('/profile/projects', accessToken, body);
}

export function updateProject(accessToken: string, projectId: string, body: SaveApplicantProjectRequest) {
  return apiRequest<ApplicantProjectResponse>(`/profile/projects/${projectId}`, {
    method: 'PATCH',
    accessToken,
    body
  });
}

export function deleteProject(accessToken: string, projectId: string) {
  return apiRequest<{ deleted: true }>(`/profile/projects/${projectId}`, {
    method: 'DELETE',
    accessToken
  });
}

export function updateSoftSkills(accessToken: string, body: SoftSkillUpdateRequest) {
  return apiRequest<SoftSkillOutputResponse>('/profile/soft-skills', {
    method: 'PATCH',
    accessToken,
    body
  });
}

export function getApplicantInterestRequests(accessToken: string) {
  return apiGet<ApplicantInterestRequestsResponse>('/applicant/interest-requests', accessToken);
}

export function getApplicantActivity(accessToken: string) {
  return apiGet<ApplicantActivityResponse>('/applicant/activity', accessToken);
}

export function respondToApplicantInterestRequest(accessToken: string, requestId: string, body: RespondToInterestRequest) {
  return apiPost<{ request: ApplicantInterestRequestsResponse['requests'][number] }>(
    `/applicant/interest-requests/${requestId}/respond`,
    accessToken,
    body
  );
}

export function deleteAccount(accessToken: string) {
  return apiRequest<{ deleted: true }>('/account', {
    method: 'DELETE',
    accessToken
  });
}
