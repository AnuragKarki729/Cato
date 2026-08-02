import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET
});

type UploadResumeInput = {
  dataUri: string;
  supabaseUserId: string;
};

type UploadResumePreviewInput = {
  dataUri: string;
  publicId: string;
  supabaseUserId: string;
};

type SignedVideoUploadInput = {
  supabaseUserId: string;
  videoType: '10_sec' | '30_sec';
};

type SignedProfileImageUploadInput = {
  supabaseUserId: string;
};

const signedUploadExpirySeconds = 300;

export async function uploadResumeToCloudinary(input: UploadResumeInput) {
  return cloudinary.uploader.upload(input.dataUri, {
    folder: `${input.supabaseUserId}/resume`,
    resource_type: 'raw',
    use_filename: true,
    unique_filename: true,
    overwrite: false
  });
}

export async function uploadResumePreviewPdfToCloudinary(input: UploadResumePreviewInput) {
  return cloudinary.uploader.upload(input.dataUri, {
    folder: `${input.supabaseUserId}/resume`,
    public_id: input.publicId,
    resource_type: 'raw',
    overwrite: true
  });
}

export function createSignedVideoUpload(input: SignedVideoUploadInput) {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `${input.supabaseUserId}/video`;
  const publicId = `${input.videoType}_${Date.now()}`;
  const signature = cloudinary.utils.api_sign_request(
    {
      folder,
      public_id: publicId,
      timestamp
    },
    env.CLOUDINARY_API_SECRET
  );

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/video/upload`,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    publicId,
    expiresInSeconds: signedUploadExpirySeconds
  };
}

export function createSignedProfileImageUpload(input: SignedProfileImageUploadInput) {
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `${input.supabaseUserId}/profile`;
  const publicId = 'profile';
  const overwrite = true;
  const signature = cloudinary.utils.api_sign_request(
    {
      folder,
      overwrite,
      public_id: publicId,
      timestamp
    },
    env.CLOUDINARY_API_SECRET
  );

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    publicId,
    overwrite,
    expiresInSeconds: signedUploadExpirySeconds
  };
}

export function assertCloudinaryVideoBelongsToUser(publicId: string, supabaseUserId: string) {
  if (!publicId.startsWith(`${supabaseUserId}/video/`)) {
    throw new Error('Video public id does not belong to user');
  }
}

export function assertCloudinaryProfileImageBelongsToUser(publicId: string, supabaseUserId: string) {
  if (!publicId.startsWith(`${supabaseUserId}/profile/`)) {
    throw new Error('Profile image public id does not belong to user');
  }
}

export async function deleteCloudinaryAsset(publicId: string, resourceType: 'raw' | 'video' | 'image' = 'video') {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType
  });
}

export async function deleteCloudinaryAssetsByPrefix(prefix: string, resourceType: 'raw' | 'video' | 'image') {
  return cloudinary.api.delete_resources_by_prefix(prefix, {
    resource_type: resourceType
  });
}
