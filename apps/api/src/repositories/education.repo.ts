import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';
import { deriveAcademicFieldIds } from '../data/academicFields.js';

type SaveEducationRequest = {
  universityUnitId?: string;
  universityName: string;
  universityMatchedFromEmail: boolean;
  semesterLabel: string;
  semesterNumber: number;
  gpa?: number;
  major?: string;
  minor?: string;
};

export type EducationProfileDocument = SaveEducationRequest & {
  applicantId: ObjectId;
  majorFieldIds?: string[];
  minorFieldIds?: string[];
  createdAt: Date;
  updatedAt: Date;
};

export function educationProfilesCollection(db: Db): Collection<EducationProfileDocument> {
  return db.collection<EducationProfileDocument>(collections.educationProfiles);
}

export async function ensureEducationIndexes(db: Db) {
  await Promise.all([
    educationProfilesCollection(db).createIndex({ applicantId: 1 }, { unique: true }),
    educationProfilesCollection(db).createIndex({ universityUnitId: 1 }),
    educationProfilesCollection(db).createIndex({ universityName: 1 }),
    educationProfilesCollection(db).createIndex({ major: 1 }),
    educationProfilesCollection(db).createIndex({ majorFieldIds: 1 }),
    educationProfilesCollection(db).createIndex({ minorFieldIds: 1 }),
    educationProfilesCollection(db).createIndex({ semesterNumber: 1 }),
    educationProfilesCollection(db).createIndex({ gpa: 1 }),
    educationProfilesCollection(db).createIndex({ universityName: 1, major: 1, semesterNumber: 1, gpa: 1 })
  ]);
}

export async function upsertEducationProfile(
  db: Db,
  applicantId: ObjectId,
  input: SaveEducationRequest
) {
  const now = new Date();
  const majorFieldIds = deriveAcademicFieldIds(input.major);
  const minorFieldIds = deriveAcademicFieldIds(input.minor);

  await educationProfilesCollection(db).updateOne(
    { applicantId },
    {
      $setOnInsert: {
        applicantId,
        createdAt: now
      },
      $set: {
        ...input,
        majorFieldIds,
        minorFieldIds,
        updatedAt: now
      }
    },
    { upsert: true }
  );

  const education = await educationProfilesCollection(db).findOne({ applicantId });

  if (!education) {
    throw new Error('Education profile save failed');
  }

  return education;
}

export async function findEducationProfileByApplicantId(db: Db, applicantId: ObjectId) {
  return educationProfilesCollection(db).findOne({ applicantId });
}

export function serializeEducationProfile(education: WithId<EducationProfileDocument>) {
  return {
    universityUnitId: education.universityUnitId,
    universityName: education.universityName,
    universityMatchedFromEmail: education.universityMatchedFromEmail,
    semesterLabel: education.semesterLabel,
    semesterNumber: education.semesterNumber,
    gpa: education.gpa,
    major: education.major,
    majorFieldIds: education.majorFieldIds ?? [],
    minor: education.minor,
    minorFieldIds: education.minorFieldIds ?? [],
    updatedAt: education.updatedAt.toISOString()
  };
}
