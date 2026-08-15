// Shared helpers for the Cato dummy-applicant seed + reset scripts.
//
// These scripts create ONLY applicant dummy data. They never touch recruiter
// accounts, real applicants, or any document that is not explicitly tagged with
// the seed marker below.
//
// Env is loaded with the same pattern as the other apps/api scripts: it reads
// the repo-root .env if present and reuses the existing MONGODB_URL /
// CLOUDINARY_* variables.

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

const rootEnvPath = resolve(process.cwd(), '../../.env');

config({
  path: existsSync(rootEnvPath) ? rootEnvPath : undefined
});

// Every document created by the seed carries these two fields. Cleanup only ever
// deletes documents that match SEED_MARKER, so real data can never be removed.
export const SEED_MARKER = { isSeed: true };
export const SEED_TAG = 'cato-dummy-applicant';

// Cloudinary folder that holds every generated seed asset. Kept separate from
// real users' folders (which are keyed by supabaseUserId) so it can be wiped by
// prefix without risk.
export const SEED_CLOUDINARY_FOLDER = 'cato_seed';

// supabaseUserId + email prefixes make seed users trivially identifiable and
// guarantee they cannot collide with real Supabase-backed users.
export const SEED_SUPABASE_PREFIX = `seed:${SEED_TAG}:`;
export const SEED_EMAIL_DOMAIN = 'cato-seed.invalid';

// Collection names, mirrored from apps/api/src/db/collections.ts. Duplicated
// here (rather than imported) because these scripts are plain .mjs and must not
// depend on the compiled TS app.
export const collections = {
  applicants: 'applicants',
  educationProfiles: 'education_profiles',
  resumes: 'resumes',
  applicantSignals: 'applicant_signals',
  applicantActivities: 'applicant_activities',
  applicantProjects: 'applicant_projects',
  softSkillOutputs: 'soft_skill_outputs',
  internships: 'internships',
  appUserRoles: 'app_user_roles',
  recruiterBookmarks: 'recruiter_bookmarks',
  recruiterCandidateReviews: 'recruiter_candidate_reviews',
  recruiterInterestRequests: 'recruiter_interest_requests',
  recruiterMessages: 'recruiter_messages'
};

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}. Set it in your repo-root .env`);
  }
  return value;
}

export async function withDatabase(run) {
  const url = requireEnv('MONGODB_URL');
  const client = new MongoClient(url);
  await client.connect();
  try {
    // client.db() with no name uses the database encoded in the connection
    // string, exactly like apps/api/src/db/mongo.ts.
    return await run(client.db());
  } finally {
    await client.close();
  }
}

export function log(...args) {
  console.log('[cato-seed]', ...args);
}
