import type {
  ApplicantSignalResponse,
  CompleteVideoUploadRequest,
  PrepareVideoUploadRequest,
  PrepareVideoUploadResponse,
  SaveTenSecondElaborationRequest,
  SelectSignalPromptRequest
} from '@cato/shared';
import { apiGet, apiPost, apiRequest } from './client';

export function getSignal(accessToken: string) {
  return apiGet<ApplicantSignalResponse>('/signal', accessToken);
}

export function selectSignalPrompt(accessToken: string, body: SelectSignalPromptRequest) {
  return apiPost<ApplicantSignalResponse>('/onboarding/signal-prompt', accessToken, body);
}

export function markDeeperSignalSeen(accessToken: string, body: SaveTenSecondElaborationRequest = {}) {
  return apiPost<{ signal: ApplicantSignalResponse['signal'] | null }>('/onboarding/deeper-signal/seen', accessToken, body);
}

export function prepareVideoUpload(
  accessToken: string,
  type: '10-second' | '30-second',
  body: PrepareVideoUploadRequest
) {
  return apiPost<PrepareVideoUploadResponse>(`/videos/${type}/upload-url`, accessToken, body);
}

export function completeVideoUpload(
  accessToken: string,
  type: '10-second' | '30-second',
  body: CompleteVideoUploadRequest
) {
  return apiPost<ApplicantSignalResponse>(`/videos/${type}/complete`, accessToken, body);
}

export function skipThirtySecondVideo(accessToken: string) {
  return apiPost<ApplicantSignalResponse>('/onboarding/deeper-video/skip', accessToken);
}

export function getVideos(accessToken: string) {
  return apiGet<{
    videos: Pick<ApplicantSignalResponse['signal'], 'tenSecondVideo' | 'thirtySecondVideo' | 'thirtySecondVideoSkipped'>;
  }>('/videos', accessToken);
}

export function deleteVideo(accessToken: string, type: '10-second' | '30-second') {
  return apiRequest<ApplicantSignalResponse>(`/videos/${type}`, {
    method: 'DELETE',
    accessToken
  });
}
