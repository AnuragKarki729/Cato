import type { Collection, Db, WithId } from 'mongodb';
import { collections } from '../db/collections.js';

type OnboardingStatus =
  | 'auth_complete'
  | 'education_complete'
  | 'resume_complete'
  | 'signal_prompt_selected'
  | 'signal_video_uploaded'
  | 'deeper_signal_seen'
  | 'deeper_video_skipped'
  | 'deeper_video_uploaded'
  | 'profile_form_complete'
  | 'onboarding_complete';

export type ApplicantDocument = {
  supabaseUserId: string;
  email: string;
  name?: string;
  profileImage?: {
    source: 'ten_second_video' | 'thirty_second_video' | 'uploaded';
    cloudinaryPublicId?: string;
    secureUrl?: string;
    contentType?: string;
    fileSizeBytes?: number;
    uploadedAt?: Date;
  };
  authProvider: 'google' | 'email';
  onboardingStatus: OnboardingStatus;
  onboardingCompletedAt?: Date;
  resumeConsentAcceptedAt?: Date;
  videoConsentAcceptedAt?: Date;
  privacyPolicyAcknowledgedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const onboardingStatusRank: Record<OnboardingStatus, number> = {
  auth_complete: 0,
  education_complete: 1,
  resume_complete: 2,
  signal_prompt_selected: 3,
  signal_video_uploaded: 4,
  deeper_signal_seen: 5,
  deeper_video_skipped: 6,
  deeper_video_uploaded: 7,
  profile_form_complete: 8,
  onboarding_complete: 9
};

type SyncApplicantInput = {
  supabaseUserId: string;
  email: string;
  name?: string;
  authProvider: 'google' | 'email';
};

export function applicantsCollection(db: Db): Collection<ApplicantDocument> {
  return db.collection<ApplicantDocument>(collections.applicants);
}

export async function ensureApplicantIndexes(db: Db) {
  const collection = applicantsCollection(db);

  await Promise.all([
    collection.createIndex({ supabaseUserId: 1 }, { unique: true }),
    collection.createIndex({ email: 1 })
  ]);
}

export async function syncApplicant(db: Db, input: SyncApplicantInput) {
  const now = new Date();
  const collection = applicantsCollection(db);

  await collection.updateOne(
    { supabaseUserId: input.supabaseUserId },
    {
      $setOnInsert: {
        supabaseUserId: input.supabaseUserId,
        onboardingStatus: 'auth_complete',
        createdAt: now
      },
      $set: {
        email: input.email,
        authProvider: input.authProvider,
        ...(input.name ? { name: input.name } : {}),
        updatedAt: now
      }
    },
    { upsert: true }
  );

  const applicant = await findApplicantBySupabaseUserId(db, input.supabaseUserId);

  if (!applicant) {
    throw new Error('Applicant sync failed');
  }

  return applicant;
}

export async function findApplicantBySupabaseUserId(db: Db, supabaseUserId: string) {
  return applicantsCollection(db).findOne({ supabaseUserId });
}

export async function updateApplicantOnboardingStatus(
  db: Db,
  supabaseUserId: string,
  onboardingStatus: OnboardingStatus
) {
  const applicant = await findApplicantBySupabaseUserId(db, supabaseUserId);

  if (!applicant) {
    return;
  }

  if (onboardingStatusRank[applicant.onboardingStatus] > onboardingStatusRank[onboardingStatus]) {
    return;
  }

  const now = new Date();

  await applicantsCollection(db).updateOne(
    { supabaseUserId },
    {
      $set: {
        onboardingStatus,
        ...(onboardingStatus === 'onboarding_complete' ? { onboardingCompletedAt: now } : {}),
        updatedAt: now
      }
    }
  );
}

export async function updateApplicantName(db: Db, supabaseUserId: string, name: string) {
  const now = new Date();

  await applicantsCollection(db).updateOne(
    { supabaseUserId },
    {
      $set: {
        name,
        updatedAt: now
      }
    }
  );
}

export async function updateApplicantProfileImageSource(
  db: Db,
  supabaseUserId: string,
  source: 'ten_second_video' | 'thirty_second_video' | 'uploaded'
) {
  const now = new Date();

  await applicantsCollection(db).updateOne(
    { supabaseUserId },
    {
      $set: {
        'profileImage.source': source,
        updatedAt: now
      }
    }
  );

  return findApplicantBySupabaseUserId(db, supabaseUserId);
}

export async function saveApplicantUploadedProfileImage(
  db: Db,
  supabaseUserId: string,
  input: {
    cloudinaryPublicId: string;
    secureUrl: string;
    contentType: string;
    fileSizeBytes?: number;
  }
) {
  const now = new Date();

  await applicantsCollection(db).updateOne(
    { supabaseUserId },
    {
      $set: {
        profileImage: {
          source: 'uploaded',
          cloudinaryPublicId: input.cloudinaryPublicId,
          secureUrl: input.secureUrl,
          contentType: input.contentType,
          fileSizeBytes: input.fileSizeBytes,
          uploadedAt: now
        },
        updatedAt: now
      }
    }
  );

  return findApplicantBySupabaseUserId(db, supabaseUserId);
}

export async function acceptApplicantConsent(
  db: Db,
  supabaseUserId: string,
  consent: { resume?: boolean; video?: boolean; privacyPolicy?: boolean }
) {
  const now = new Date();

  await applicantsCollection(db).updateOne(
    { supabaseUserId },
    {
      $set: {
        ...(consent.resume ? { resumeConsentAcceptedAt: now } : {}),
        ...(consent.video ? { videoConsentAcceptedAt: now } : {}),
        ...(consent.privacyPolicy ? { privacyPolicyAcknowledgedAt: now } : {}),
        updatedAt: now
      }
    }
  );

  return findApplicantBySupabaseUserId(db, supabaseUserId);
}

export function serializeApplicant(applicant: WithId<ApplicantDocument>) {
  return {
    id: applicant._id.toString(),
    supabaseUserId: applicant.supabaseUserId,
    email: applicant.email,
    name: applicant.name,
    profileImage: applicant.profileImage
      ? {
          source: applicant.profileImage.source,
          cloudinaryPublicId: applicant.profileImage.cloudinaryPublicId,
          secureUrl: applicant.profileImage.secureUrl,
          contentType: applicant.profileImage.contentType,
          uploadedAt: applicant.profileImage.uploadedAt?.toISOString()
        }
      : undefined,
    authProvider: applicant.authProvider,
    onboardingStatus: applicant.onboardingStatus,
    onboardingCompletedAt: applicant.onboardingCompletedAt?.toISOString(),
    resumeConsentAcceptedAt: applicant.resumeConsentAcceptedAt?.toISOString(),
    videoConsentAcceptedAt: applicant.videoConsentAcceptedAt?.toISOString(),
    privacyPolicyAcknowledgedAt: applicant.privacyPolicyAcknowledgedAt?.toISOString(),
    createdAt: applicant.createdAt.toISOString(),
    updatedAt: applicant.updatedAt.toISOString()
  };
}
