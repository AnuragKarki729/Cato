export type VideoType = 'ten_second' | 'thirty_second';

export type MediaAsset = {
  storageProvider: 'cloudinary';
  cloudinaryPublicId?: string;
  secureUrl?: string;
  thumbnailUrl?: string;
  contentType?: string;
  fileSizeBytes?: number;
  durationSeconds: number;
  maxResolution: '1080p';
  orientation: 'portrait';
  uploadedAt: string;
};

export type ApplicantSignal = {
  promptId?: string;
  promptTextSnapshot?: string;
  tenSecondElaboration?: string;
  tenSecondElaborationSkipped: boolean;
  tenSecondVideo?: MediaAsset;
  thirtySecondVideo?: MediaAsset;
  thirtySecondVideoSkipped: boolean;
  updatedAt: string;
};

export type SelectSignalPromptRequest = {
  promptId: string;
};

export type SaveTenSecondElaborationRequest = {
  elaboration?: string;
  skipped?: boolean;
};

export type PrepareVideoUploadRequest = {
  contentType: string;
  fileSizeBytes?: number | null;
};

export type PrepareVideoUploadResponse = {
  uploadUrl: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  expiresInSeconds: number;
};

export type CompleteVideoUploadRequest = {
  cloudinaryPublicId: string;
  secureUrl: string;
  contentType: string;
  fileSizeBytes?: number | null;
  durationSeconds: number;
};

export type ApplicantSignalResponse = {
  signal: ApplicantSignal;
};
