// Delete ONLY seeded dummy applicant data + their Cloudinary assets.
//
//   node scripts/reset-applicants.mjs
//
// Safety: applicant-owned deletes are scoped to { isSeed: true }. Recruiter
// workflow records are removed only when they point to seeded applicant ids.

import { v2 as cloudinary } from 'cloudinary';
import {
  SEED_MARKER,
  SEED_CLOUDINARY_FOLDER,
  collections,
  withDatabase,
  requireEnv,
  log
} from './seed/shared.mjs';

async function deleteSeedCloudinaryAssets() {
  if (process.env.SEED_SKIP_MEDIA === 'true') {
    log('SEED_SKIP_MEDIA=true — skipping Cloudinary cleanup (assets are externally managed).');
    return;
  }
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    log('No Cloudinary config found — skipping Cloudinary cleanup.');
    return;
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  for (const type of ['video', 'raw', 'image']) {
    try {
      await cloudinary.api.delete_resources_by_prefix(SEED_CLOUDINARY_FOLDER, { resource_type: type });
    } catch (err) {
      log(`  (cloudinary ${type} cleanup warning: ${err?.message ?? err})`);
    }
  }
  try {
    await cloudinary.api.delete_folder(SEED_CLOUDINARY_FOLDER);
  } catch {
    // Folder may be non-empty across resource types or already gone — ignore.
  }
  log(`Deleted Cloudinary seed assets under "${SEED_CLOUDINARY_FOLDER}/".`);
}

async function main() {
  requireEnv('MONGODB_URL');

  await withDatabase(async (db) => {
    const seedApplicantIds = await db.collection(collections.applicants).distinct('_id', { ...SEED_MARKER });
    if (seedApplicantIds.length > 0) {
      for (const name of [
        collections.recruiterBookmarks,
        collections.recruiterCandidateReviews,
        collections.recruiterInterestRequests,
        collections.recruiterMessages
      ]) {
        const res = await db.collection(name).deleteMany({ applicantId: { $in: seedApplicantIds } });
        log(`  ${name}: deleted ${res.deletedCount} seed-linked recruiter records`);
      }
    }

    // Applicant-owned collections keyed by applicantId (or supabaseUserId for
    // roles). All filtered strictly by the seed marker.
    const targets = [
      collections.educationProfiles,
      collections.resumes,
      collections.applicantSignals,
      collections.applicantActivities,
      collections.applicantProjects,
      collections.softSkillOutputs,
      collections.internships,
      collections.appUserRoles,
      collections.applicants
    ];

    let total = 0;
    for (const name of targets) {
      const res = await db.collection(name).deleteMany({ ...SEED_MARKER });
      log(`  ${name}: deleted ${res.deletedCount}`);
      total += res.deletedCount;
    }

    log(`Deleted ${total} seed documents total.`);
  });

  await deleteSeedCloudinaryAssets();
  log('Reset complete. Real applicants and recruiter data unrelated to seed applicants are untouched.');
}

main().catch((err) => {
  console.error('[cato-seed] RESET FAILED:', err);
  process.exit(1);
});
