import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';

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
  createdAt: Date;
  updatedAt: Date;
};

export function educationProfilesCollection(db: Db): Collection<EducationProfileDocument> {
  return db.collection<EducationProfileDocument>(collections.educationProfiles);
}

export async function upsertEducationProfile(
  db: Db,
  applicantId: ObjectId,
  input: SaveEducationRequest
) {
  const now = new Date();

  await educationProfilesCollection(db).updateOne(
    { applicantId },
    {
      $setOnInsert: {
        applicantId,
        createdAt: now
      },
      $set: {
        ...input,
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
    minor: education.minor,
    updatedAt: education.updatedAt.toISOString()
  };
}
