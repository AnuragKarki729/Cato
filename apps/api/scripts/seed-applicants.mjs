// Seed dummy APPLICANT users for the Cato POC.
//
//   node scripts/seed-applicants.mjs           # default ~16 applicants
//   SEED_COUNT=20 node scripts/seed-applicants.mjs
//
// Creates only applicant data (never recruiters). Every document is tagged with
// isSeed:true so scripts/reset-applicants.mjs can remove them cleanly. Dummy
// users are NOT registered in Supabase — they exist only in Mongo/Cloudinary and
// still appear as fully-completed applicants on the recruiter side.
//
// See scripts/seed/README.md for env + video details.

import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongodb';
import {
  SEED_MARKER,
  SEED_TAG,
  SEED_SUPABASE_PREFIX,
  SEED_EMAIL_DOMAIN,
  collections,
  withDatabase,
  requireEnv,
  log
} from './seed/shared.mjs';
import { buildApplicantProfile, makeRng } from './seed/data.mjs';
import { buildMediaPools } from './seed/media.mjs';

const DEFAULT_COUNT = 16;

function parseCount() {
  const raw = process.env.SEED_COUNT;
  if (!raw) return DEFAULT_COUNT;
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 1 || n > 200) {
    throw new Error('SEED_COUNT must be an integer between 1 and 200');
  }
  return n;
}

function buildDryRunMediaPools() {
  const videoAsset = (kind, durationSeconds) => ({
    storageProvider: 'cloudinary',
    cloudinaryPublicId: `dry_run/${kind}`,
    secureUrl: `https://example.com/dry-run/${kind}.mp4`,
    thumbnailUrl: `https://example.com/dry-run/${kind}.jpg`,
    contentType: 'video/mp4',
    fileSizeBytes: durationSeconds * 1024 * 1024,
    durationSeconds,
    maxResolution: '1080p',
    orientation: 'portrait'
  });

  return {
    tenSecond: [videoAsset('10s', 10)],
    thirtySecond: [videoAsset('30s', 30)],
    resume: {
      cloudinaryPublicId: 'dry_run/resume.pdf',
      secureUrl: 'https://example.com/dry-run/resume.pdf',
      fileSizeBytes: 4096
    }
  };
}

async function main() {
  const dryRun = process.env.SEED_DRY_RUN === 'true';
  if (!dryRun) {
    requireEnv('MONGODB_URL');
  }
  const count = parseCount();
  // Seed profile variety from the count so a given SEED_COUNT has repeatable shape.
  // Use a real random batch id for identities so reruns never collide.
  const rng = makeRng(count * 7919 + 13);
  const batchId = randomUUID().slice(0, 8);

  const media = dryRun ? buildDryRunMediaPools() : await buildMediaPools();
  if (media.tenSecond.length === 0) {
    throw new Error('No 10s video assets available — the 10s video is mandatory.');
  }

  const now = Date.now();

  const buildAndMaybeInsert = async (db) => {
    const applicantDocs = [];
    const educationDocs = [];
    const internshipDocs = [];
    const projectDocs = [];
    const resumeDocs = [];
    const signalDocs = [];
    const softSkillDocs = [];
    const roleDocs = [];

    let withThirty = 0;
    let withResume = 0;
    let withInternships = 0;
    let withProjects = 0;

    for (let i = 0; i < count; i += 1) {
      const profile = buildApplicantProfile(i, rng);
      const applicantId = new ObjectId();
      const supabaseUserId = `${SEED_SUPABASE_PREFIX}${batchId}:${i}`;
      const email = `${profile.emailSlug}.${batchId}@${SEED_EMAIL_DOMAIN}`;
      // Stagger updatedAt so the recruiter feed (sorted by updatedAt desc) shows a
      // natural, interleaved ordering.
      const updatedAt = new Date(now - i * 37 * 60 * 1000);
      const createdAt = new Date(updatedAt.getTime() - 3 * 24 * 60 * 60 * 1000);

      const tenAsset = {
        ...media.tenSecond[i % media.tenSecond.length],
        uploadedAt: createdAt
      };

      const wantsThirty = profile.signal.hasThirtySecond && media.thirtySecond.length > 0;
      const thirtyAsset = wantsThirty
        ? { ...media.thirtySecond[i % media.thirtySecond.length], uploadedAt: createdAt }
        : undefined;

      // Some applicants use their 30s clip frame as the profile image.
      const profileImageSource = thirtyAsset && rng() < 0.4 ? 'thirty_second_video' : 'ten_second_video';

      applicantDocs.push({
        _id: applicantId,
        supabaseUserId,
        email,
        name: profile.name,
        profileImage: { source: profileImageSource },
        authProvider: rng() < 0.5 ? 'google' : 'email',
        onboardingStatus: 'onboarding_complete',
        onboardingCompletedAt: updatedAt,
        videoConsentAcceptedAt: createdAt,
        privacyPolicyAcknowledgedAt: createdAt,
        ...(profile.hasResume ? { resumeConsentAcceptedAt: createdAt } : {}),
        createdAt,
        updatedAt,
        seedTag: SEED_TAG,
        ...SEED_MARKER
      });

      educationDocs.push({
        applicantId,
        ...profile.education,
        createdAt,
        updatedAt,
        seedTag: SEED_TAG,
        ...SEED_MARKER
      });

      if (profile.internships.length > 0) {
        withInternships += 1;
        for (const internship of profile.internships) {
          internshipDocs.push({
            applicantId,
            company: internship.company,
            durationMonths: internship.durationMonths,
            roleDepartment: internship.roleDepartment,
            createdAt,
            updatedAt,
            seedTag: SEED_TAG,
            ...SEED_MARKER
          });
        }
      }

      if (profile.projects.length > 0) {
        withProjects += 1;
        for (const project of profile.projects) {
          projectDocs.push({
            applicantId,
            title: project.title,
            type: project.type,
            description: project.description,
            ...(project.linkUrl ? { linkUrl: project.linkUrl } : {}),
            createdAt,
            updatedAt,
            seedTag: SEED_TAG,
            ...SEED_MARKER
          });
        }
      }

      if (profile.hasResume && media.resume) {
        withResume += 1;
        resumeDocs.push({
          applicantId,
          cloudinaryPublicId: media.resume.cloudinaryPublicId,
          secureUrl: media.resume.secureUrl,
          previewUrl: media.resume.secureUrl,
          previewFileType: 'pdf',
          originalFileName: `${profile.emailSlug}-resume.pdf`,
          fileType: 'pdf',
          fileSizeBytes: media.resume.fileSizeBytes ?? 4096,
          softSkillGenerationStatus: 'completed',
          uploadedAt: createdAt,
          createdAt,
          updatedAt,
          seedTag: SEED_TAG,
          ...SEED_MARKER
        });
      } else {
        // No resume: mirror the "skipped" path from the real onboarding flow.
        resumeDocs.push({
          applicantId,
          softSkillGenerationStatus: 'skipped',
          createdAt,
          updatedAt,
          seedTag: SEED_TAG,
          ...SEED_MARKER
        });
      }

      if (wantsThirty) withThirty += 1;
      signalDocs.push({
        applicantId,
        promptId: profile.signal.promptId,
        promptFieldId: profile.signal.promptFieldId,
        promptFieldLabel: profile.signal.promptFieldLabel,
        promptTextSnapshot: profile.signal.promptTextSnapshot,
        tenSecondElaboration: profile.signal.tenSecondElaboration,
        tenSecondElaborationSkipped: false,
        tenSecondVideo: tenAsset,
        ...(thirtyAsset ? { thirtySecondVideo: thirtyAsset } : {}),
        thirtySecondVideoSkipped: !wantsThirty,
        createdAt,
        updatedAt,
        seedTag: SEED_TAG,
        ...SEED_MARKER
      });

      softSkillDocs.push({
        applicantId,
        source: 'dummy',
        provider: 'none',
        status: 'completed',
        items: profile.softSkills,
        editableByApplicant: false,
        generatedAt: createdAt,
        createdAt,
        updatedAt,
        seedTag: SEED_TAG,
        ...SEED_MARKER
      });

      roleDocs.push({
        supabaseUserId,
        email,
        role: 'applicant',
        createdAt,
        updatedAt,
        seedTag: SEED_TAG,
        ...SEED_MARKER
      });
    }

    if (dryRun) {
      log(`DRY RUN: built ${count} dummy applicants. No Mongo writes or Cloudinary uploads were performed.`);
      log(`  applicants:            ${applicantDocs.length}`);
      log(`  education_profiles:    ${educationDocs.length}`);
      log(`  internships:           ${internshipDocs.length}`);
      log(`  applicant_projects:    ${projectDocs.length}`);
      log(`  resumes:               ${resumeDocs.length}`);
      log(`  applicant_signals:     ${signalDocs.length}`);
      log(`  soft_skill_outputs:    ${softSkillDocs.length}`);
      log(`  app_user_roles:        ${roleDocs.length}`);
      log(`  with 30s deeper signal: ${withThirty}`);
      log(`  with resume:            ${withResume}`);
      log(`  with internships:       ${withInternships}`);
      log(`  with projects:          ${withProjects}`);
      log(`  sample identity:        ${applicantDocs[0]?.email}`);
      return;
    }

    await db.collection(collections.applicants).insertMany(applicantDocs);
    await db.collection(collections.educationProfiles).insertMany(educationDocs);
    if (internshipDocs.length > 0) {
      await db.collection(collections.internships).insertMany(internshipDocs);
    }
    if (projectDocs.length > 0) {
      await db.collection(collections.applicantProjects).insertMany(projectDocs);
    }
    await db.collection(collections.resumes).insertMany(resumeDocs);
    await db.collection(collections.applicantSignals).insertMany(signalDocs);
    await db.collection(collections.softSkillOutputs).insertMany(softSkillDocs);
    await db.collection(collections.appUserRoles).insertMany(roleDocs);

    log(`Seeded ${count} dummy applicants (marker isSeed:true, seedTag="${SEED_TAG}").`);
    log(`  with 30s deeper signal: ${withThirty}`);
    log(`  with resume:            ${withResume}`);
    log(`  with internships:       ${withInternships}`);
    log(`  with projects:          ${withProjects}`);
    log('Recruiter feed will now show these as completed applicants.');
    log('Reset any time with:  node scripts/reset-applicants.mjs');
  };

  if (dryRun) {
    await buildAndMaybeInsert(null);
  } else {
    await withDatabase(buildAndMaybeInsert);
  }
}

main().catch((err) => {
  console.error('[cato-seed] FAILED:', err);
  process.exit(1);
});
