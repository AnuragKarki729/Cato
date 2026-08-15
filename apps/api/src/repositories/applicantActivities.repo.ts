import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';
import type { RecruiterAccountDocument } from './recruiters.repo.js';

export type ApplicantActivityType =
  | 'profile_viewed'
  | 'resume_opened'
  | 'deeper_signal_opened'
  | 'bookmarked'
  | 'shortlisted'
  | 'interest_sent'
  | 'message_sent';

export type ApplicantActivityDocument = {
  applicantId: ObjectId;
  recruiterId?: ObjectId;
  type: ApplicantActivityType;
  title: string;
  body: string;
  actorName?: string;
  actorCompanyName?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
};

type RecordApplicantActivityInput = {
  applicantId: ObjectId;
  body: string;
  dedupeHours?: number;
  metadata?: Record<string, unknown>;
  recruiter?: WithId<RecruiterAccountDocument>;
  title: string;
  type: ApplicantActivityType;
};

export function applicantActivitiesCollection(db: Db): Collection<ApplicantActivityDocument> {
  return db.collection<ApplicantActivityDocument>(collections.applicantActivities);
}

export async function ensureApplicantActivityIndexes(db: Db) {
  await Promise.all([
    applicantActivitiesCollection(db).createIndex({ applicantId: 1, createdAt: -1 }),
    applicantActivitiesCollection(db).createIndex({ recruiterId: 1, applicantId: 1, type: 1, createdAt: -1 })
  ]);
}

export async function recordApplicantActivity(db: Db, input: RecordApplicantActivityInput) {
  const now = new Date();
  const recruiterId = input.recruiter?._id;

  if (input.dedupeHours && recruiterId) {
    const since = new Date(now.getTime() - input.dedupeHours * 60 * 60 * 1000);
    const existing = await applicantActivitiesCollection(db).findOne({
      applicantId: input.applicantId,
      recruiterId,
      type: input.type,
      createdAt: { $gte: since }
    });

    if (existing) {
      return existing;
    }
  }

  const document: ApplicantActivityDocument = {
    applicantId: input.applicantId,
    ...(recruiterId ? { recruiterId } : {}),
    type: input.type,
    title: input.title,
    body: input.body,
    actorName: input.recruiter?.name,
    actorCompanyName: input.recruiter?.companyName,
    metadata: input.metadata,
    createdAt: now
  };

  const result = await applicantActivitiesCollection(db).insertOne(document);
  return { ...document, _id: result.insertedId };
}

export async function findApplicantActivities(db: Db, applicantId: ObjectId, limit = 10) {
  return applicantActivitiesCollection(db)
    .find({ applicantId })
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(limit, 50)))
    .toArray();
}

export async function countApplicantActivitiesByType(db: Db, applicantId: ObjectId, type: ApplicantActivityType) {
  return applicantActivitiesCollection(db).countDocuments({ applicantId, type });
}

export function serializeApplicantActivity(activity: WithId<ApplicantActivityDocument>) {
  return {
    id: activity._id.toString(),
    applicantId: activity.applicantId.toString(),
    recruiterId: activity.recruiterId?.toString(),
    type: activity.type,
    title: activity.title,
    body: activity.body,
    actorName: activity.actorName,
    actorCompanyName: activity.actorCompanyName,
    metadata: activity.metadata,
    createdAt: activity.createdAt.toISOString()
  };
}
