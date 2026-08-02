export type ResumeFileType = 'pdf' | 'doc' | 'docx';

export type ResumeParsingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

export type Resume = {
  cloudinaryPublicId?: string;
  secureUrl?: string;
  previewCloudinaryPublicId?: string;
  previewUrl?: string;
  previewFileType?: 'pdf';
  originalFileName?: string;
  fileType?: ResumeFileType;
  fileSizeBytes?: number;
  softSkillGenerationStatus: ResumeParsingStatus;
  uploadedAt?: string;
  updatedAt: string;
};

export type ResumeUploadRequest = {
  dataUri: string;
  originalFileName: string;
  fileType: ResumeFileType;
  fileSizeBytes: number;
};

export type ResumeResponse = {
  resume: Resume | null;
};
