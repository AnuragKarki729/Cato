import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';

type ResumeFileType = 'pdf' | 'doc' | 'docx';
type ResumeStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

export type ResumeDocument = {
  applicantId: ObjectId;
  cloudinaryPublicId?: string;
  secureUrl?: string;
  previewCloudinaryPublicId?: string;
  previewUrl?: string;
  previewFileType?: 'pdf';
  originalFileName?: string;
  fileType?: ResumeFileType;
  fileSizeBytes?: number;
  softSkillGenerationStatus: ResumeStatus;
  uploadedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

type SaveUploadedResumeInput = {
  applicantId: ObjectId;
  cloudinaryPublicId: string;
  secureUrl: string;
  previewCloudinaryPublicId?: string;
  previewUrl?: string;
  previewFileType?: 'pdf';
  originalFileName: string;
  fileType: ResumeFileType;
  fileSizeBytes: number;
};

export function resumesCollection(db: Db): Collection<ResumeDocument> {
  return db.collection<ResumeDocument>(collections.resumes);
}

export async function findResumeByApplicantId(db: Db, applicantId: ObjectId) {
  return resumesCollection(db).findOne({ applicantId });
}

export async function deleteResumeByApplicantId(db: Db, applicantId: ObjectId) {
  await resumesCollection(db).deleteOne({ applicantId });
}

export async function markResumeSkipped(db: Db, applicantId: ObjectId) {
  const now = new Date();

  await resumesCollection(db).updateOne(
    { applicantId },
    {
      $setOnInsert: {
        applicantId,
        createdAt: now
      },
      $set: {
        softSkillGenerationStatus: 'skipped',
        updatedAt: now
      },
      $unset: {
        cloudinaryPublicId: '',
        secureUrl: '',
        previewCloudinaryPublicId: '',
        previewUrl: '',
        previewFileType: '',
        originalFileName: '',
        fileType: '',
        fileSizeBytes: '',
        uploadedAt: ''
      }
    },
    { upsert: true }
  );

  const resume = await findResumeByApplicantId(db, applicantId);

  if (!resume) {
    throw new Error('Resume skip failed');
  }

  return resume;
}

export async function saveUploadedResume(db: Db, input: SaveUploadedResumeInput) {
  const now = new Date();

  await resumesCollection(db).updateOne(
    { applicantId: input.applicantId },
    {
      $setOnInsert: {
        applicantId: input.applicantId,
        createdAt: now
      },
      $set: {
        cloudinaryPublicId: input.cloudinaryPublicId,
        secureUrl: input.secureUrl,
        previewCloudinaryPublicId: input.previewCloudinaryPublicId,
        previewUrl: input.previewUrl,
        previewFileType: input.previewFileType,
        originalFileName: input.originalFileName,
        fileType: input.fileType,
        fileSizeBytes: input.fileSizeBytes,
        softSkillGenerationStatus: 'completed',
        uploadedAt: now,
        updatedAt: now
      }
    },
    { upsert: true }
  );

  const resume = await findResumeByApplicantId(db, input.applicantId);

  if (!resume) {
    throw new Error('Resume save failed');
  }

  return resume;
}

export function serializeResume(resume: WithId<ResumeDocument>) {
  return {
    cloudinaryPublicId: resume.cloudinaryPublicId,
    secureUrl: resume.secureUrl,
    previewCloudinaryPublicId: resume.previewCloudinaryPublicId,
    previewUrl: resume.previewUrl,
    previewFileType: resume.previewFileType,
    originalFileName: resume.originalFileName,
    fileType: resume.fileType,
    fileSizeBytes: resume.fileSizeBytes,
    softSkillGenerationStatus: resume.softSkillGenerationStatus,
    uploadedAt: resume.uploadedAt?.toISOString(),
    updatedAt: resume.updatedAt.toISOString()
  };
}
