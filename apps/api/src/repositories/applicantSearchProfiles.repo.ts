import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';
import { normalizeMatchingOptionKey } from './matchingOptions.repo.js';

export type ApplicantSearchProfileDepth = {
  type: 'skill' | 'category';
  id: string;
};

export type ApplicantSearchProfileDocument = {
  applicantId: ObjectId;
  skillIds: string[];
  fieldIds: string[];
  depth: ApplicantSearchProfileDepth;
  source: 'manual' | 'resume' | 'mixed';
  createdAt: Date;
  updatedAt: Date;
};

type SaveApplicantSearchProfileInput = {
  applicantId: ObjectId;
  skillIds: string[];
  fieldIds: string[];
  depth: ApplicantSearchProfileDepth;
  source?: ApplicantSearchProfileDocument['source'];
};

export function applicantSearchProfilesCollection(db: Db): Collection<ApplicantSearchProfileDocument> {
  return db.collection<ApplicantSearchProfileDocument>(collections.applicantSearchProfiles);
}

export async function ensureApplicantSearchProfileIndexes(db: Db) {
  await Promise.all([
    applicantSearchProfilesCollection(db).createIndex({ applicantId: 1 }, { unique: true }),
    applicantSearchProfilesCollection(db).createIndex({ skillIds: 1, updatedAt: -1 }),
    applicantSearchProfilesCollection(db).createIndex({ fieldIds: 1, updatedAt: -1 }),
    applicantSearchProfilesCollection(db).createIndex({ 'depth.type': 1, 'depth.id': 1, updatedAt: -1 })
  ]);
}

export async function findApplicantSearchProfileByApplicantId(db: Db, applicantId: ObjectId) {
  return applicantSearchProfilesCollection(db).findOne({ applicantId });
}

function normalizeIdList(values: string[], max: number) {
  return Array.from(new Set(values.map(normalizeMatchingOptionKey).filter(Boolean))).slice(0, max);
}

export async function upsertApplicantSearchProfile(db: Db, input: SaveApplicantSearchProfileInput) {
  const now = new Date();
  const skillIds = normalizeIdList(input.skillIds, 100);
  const fieldIds = normalizeIdList(input.fieldIds, 10);
  const depth = {
    type: input.depth.type,
    id: normalizeMatchingOptionKey(input.depth.id)
  };

  await applicantSearchProfilesCollection(db).updateOne(
    { applicantId: input.applicantId },
    {
      $setOnInsert: {
        applicantId: input.applicantId,
        createdAt: now
      },
      $set: {
        skillIds,
        fieldIds,
        depth,
        source: input.source ?? 'manual',
        updatedAt: now
      }
    },
    { upsert: true }
  );

  const profile = await findApplicantSearchProfileByApplicantId(db, input.applicantId);

  if (!profile) {
    throw new Error('Applicant search profile save failed');
  }

  return profile;
}

export function serializeApplicantSearchProfile(profile: WithId<ApplicantSearchProfileDocument>) {
  return {
    id: profile._id.toString(),
    applicantId: profile.applicantId.toString(),
    skillIds: profile.skillIds,
    fieldIds: profile.fieldIds,
    depth: profile.depth,
    source: profile.source,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString()
  };
}
