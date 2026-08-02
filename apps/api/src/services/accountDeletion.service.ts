import type { Db, ObjectId } from 'mongodb';
import { createClient } from '@supabase/supabase-js';
import { collections } from '../db/collections.js';
import { findResumeByApplicantId } from '../repositories/resumes.repo.js';
import { findSignalByApplicantId } from '../repositories/signals.repo.js';
import { deleteCloudinaryAsset, deleteCloudinaryAssetsByPrefix } from './cloudinary.service.js';
import { env } from '../config/env.js';

const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export async function deleteApplicantAccount(db: Db, applicantId: ObjectId, supabaseUserId: string) {
  const resume = await findResumeByApplicantId(db, applicantId);
  const signal = await findSignalByApplicantId(db, applicantId);

  if (resume?.cloudinaryPublicId) {
    await deleteCloudinaryAsset(resume.cloudinaryPublicId, 'raw');
  }

  if (signal?.tenSecondVideo?.cloudinaryPublicId) {
    await deleteCloudinaryAsset(signal.tenSecondVideo.cloudinaryPublicId, 'video');
  }

  if (signal?.thirtySecondVideo?.cloudinaryPublicId) {
    await deleteCloudinaryAsset(signal.thirtySecondVideo.cloudinaryPublicId, 'video');
  }

  await deleteUserCloudinaryAssets(supabaseUserId);

  await Promise.all([
    db.collection(collections.educationProfiles).deleteMany({ applicantId }),
    db.collection(collections.resumes).deleteMany({ applicantId }),
    db.collection(collections.applicantSignals).deleteMany({ applicantId }),
    db.collection(collections.softSkillOutputs).deleteMany({ applicantId }),
    db.collection(collections.internships).deleteMany({ applicantId })
  ]);

  await db.collection(collections.applicants).deleteOne({ _id: applicantId });
  await db.collection(collections.appUserRoles).deleteOne({ supabaseUserId });
  await supabaseAdmin.auth.admin.deleteUser(supabaseUserId);
}

export async function deleteRecruiterAccount(db: Db, recruiterId: ObjectId, supabaseUserId: string) {
  await deleteUserCloudinaryAssets(supabaseUserId);

  await Promise.all([
    db.collection(collections.recruiterBookmarks).deleteMany({ recruiterId }),
    db.collection(collections.recruiterMessages).deleteMany({ recruiterId })
  ]);

  await db.collection(collections.recruiterAccounts).deleteOne({ _id: recruiterId });
  await db.collection(collections.appUserRoles).deleteOne({ supabaseUserId });
  await supabaseAdmin.auth.admin.deleteUser(supabaseUserId);
}

async function deleteUserCloudinaryAssets(supabaseUserId: string) {
  await Promise.all([
    deleteCloudinaryAssetsByPrefix(`${supabaseUserId}/resume`, 'raw'),
    deleteCloudinaryAssetsByPrefix(`${supabaseUserId}/video`, 'video'),
    deleteCloudinaryAssetsByPrefix(`${supabaseUserId}/profile`, 'image')
  ]);
}
