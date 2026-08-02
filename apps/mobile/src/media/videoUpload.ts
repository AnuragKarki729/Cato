import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import { completeVideoUpload, prepareVideoUpload } from '../api/signal';

type LocalRecordedVideo = {
  uri: string;
  contentType: string;
  durationSeconds: number;
  fileSizeBytes?: number | null;
};

type CloudinaryUploadResponse = {
  public_id: string;
  secure_url: string;
  bytes?: number;
  resource_type?: string;
  format?: string;
};

export async function uploadRecordedVideoToCloudinary(
  accessToken: string,
  type: '10-second' | '30-second',
  video: LocalRecordedVideo
) {
  const fileSizeBytes =
    typeof video.fileSizeBytes === 'number' && Number.isFinite(video.fileSizeBytes) && video.fileSizeBytes > 0
      ? video.fileSizeBytes
      : undefined;
  const prepared = await prepareVideoUpload(accessToken, type, {
    contentType: video.contentType,
    fileSizeBytes
  });

  const formData = new FormData();
  formData.append('file', new File(video.uri));
  formData.append('api_key', prepared.apiKey);
  formData.append('timestamp', String(prepared.timestamp));
  formData.append('signature', prepared.signature);
  formData.append('folder', prepared.folder);
  formData.append('public_id', prepared.publicId);

  const uploadResponse = await expoFetch(prepared.uploadUrl, {
    method: 'POST',
    body: formData
  });

  if (!uploadResponse.ok) {
    throw new Error(`Video upload failed: ${uploadResponse.status}`);
  }

  const uploaded = (await uploadResponse.json()) as CloudinaryUploadResponse;

  return completeVideoUpload(accessToken, type, {
    cloudinaryPublicId: uploaded.public_id,
    secureUrl: uploaded.secure_url,
    contentType: video.contentType,
    fileSizeBytes: uploaded.bytes ?? fileSizeBytes,
    durationSeconds: video.durationSeconds
  });
}
