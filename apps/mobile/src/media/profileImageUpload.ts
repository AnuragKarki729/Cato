import { File } from 'expo-file-system';
import { fetch as expoFetch } from 'expo/fetch';
import { completeProfileImageUpload, prepareProfileImageUpload } from '../api/profile';

type LocalProfileImage = {
  uri: string;
  contentType: string;
  fileSizeBytes?: number | null;
};

type CloudinaryImageUploadResponse = {
  public_id: string;
  secure_url: string;
  bytes?: number;
};

export async function uploadProfileImageToCloudinary(accessToken: string, image: LocalProfileImage) {
  const fileSizeBytes =
    typeof image.fileSizeBytes === 'number' && Number.isFinite(image.fileSizeBytes) && image.fileSizeBytes > 0
      ? image.fileSizeBytes
      : undefined;
  const prepared = await prepareProfileImageUpload(accessToken, {
    contentType: image.contentType,
    fileSizeBytes
  });

  const formData = new FormData();
  formData.append('file', new File(image.uri));
  formData.append('api_key', prepared.apiKey);
  formData.append('timestamp', String(prepared.timestamp));
  formData.append('signature', prepared.signature);
  formData.append('folder', prepared.folder);
  formData.append('public_id', prepared.publicId);
  formData.append('overwrite', String(prepared.overwrite));

  const uploadResponse = await expoFetch(prepared.uploadUrl, {
    method: 'POST',
    body: formData
  });

  if (!uploadResponse.ok) {
    throw new Error(`Profile image upload failed: ${uploadResponse.status}`);
  }

  const uploaded = (await uploadResponse.json()) as CloudinaryImageUploadResponse;

  return completeProfileImageUpload(accessToken, {
    cloudinaryPublicId: uploaded.public_id,
    secureUrl: uploaded.secure_url,
    contentType: image.contentType,
    fileSizeBytes: uploaded.bytes ?? fileSizeBytes
  });
}
