import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';

export type RecruiterAccountDocument = {
  supabaseUserId: string;
  email: string;
  name?: string;
  companyName?: string;
  plan: 'free' | 'professional' | 'team';
  createdAt: Date;
  updatedAt: Date;
};

export type RecruiterBookmarkDocument = {
  recruiterId: ObjectId;
  applicantId: ObjectId;
  createdAt: Date;
};

export type RecruiterMessageDocument = {
  recruiterId: ObjectId;
  applicantId: ObjectId;
  body: string;
  createdAt: Date;
};

export function recruiterAccountsCollection(db: Db): Collection<RecruiterAccountDocument> {
  return db.collection<RecruiterAccountDocument>(collections.recruiterAccounts);
}

export function recruiterBookmarksCollection(db: Db): Collection<RecruiterBookmarkDocument> {
  return db.collection<RecruiterBookmarkDocument>(collections.recruiterBookmarks);
}

export function recruiterMessagesCollection(db: Db): Collection<RecruiterMessageDocument> {
  return db.collection<RecruiterMessageDocument>(collections.recruiterMessages);
}

export async function ensureRecruiterIndexes(db: Db) {
  await Promise.all([
    recruiterAccountsCollection(db).createIndex({ supabaseUserId: 1 }, { unique: true }),
    recruiterBookmarksCollection(db).createIndex({ recruiterId: 1, applicantId: 1 }, { unique: true }),
    recruiterMessagesCollection(db).createIndex({ recruiterId: 1, createdAt: -1 })
  ]);
}

export async function syncRecruiterAccount(
  db: Db,
  input: {
    supabaseUserId: string;
    email: string;
    name?: string;
  }
) {
  const now = new Date();

  await recruiterAccountsCollection(db).updateOne(
    { supabaseUserId: input.supabaseUserId },
    {
      $setOnInsert: {
        supabaseUserId: input.supabaseUserId,
        plan: 'free',
        createdAt: now
      },
      $set: {
        email: input.email,
        ...(input.name ? { name: input.name } : {}),
        updatedAt: now
      }
    },
    { upsert: true }
  );

  const recruiter = await findRecruiterBySupabaseUserId(db, input.supabaseUserId);

  if (!recruiter) {
    throw new Error('Recruiter sync failed');
  }

  return recruiter;
}

export async function findRecruiterBySupabaseUserId(db: Db, supabaseUserId: string) {
  return recruiterAccountsCollection(db).findOne({ supabaseUserId });
}

export async function addRecruiterBookmark(db: Db, recruiterId: ObjectId, applicantId: ObjectId) {
  await recruiterBookmarksCollection(db).updateOne(
    { recruiterId, applicantId },
    {
      $setOnInsert: {
        recruiterId,
        applicantId,
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
}

export async function deleteRecruiterBookmark(db: Db, recruiterId: ObjectId, applicantId: ObjectId) {
  await recruiterBookmarksCollection(db).deleteOne({ recruiterId, applicantId });
}

export async function findRecruiterBookmarks(db: Db, recruiterId: ObjectId) {
  return recruiterBookmarksCollection(db).find({ recruiterId }).toArray();
}

export async function isCandidateBookmarked(db: Db, recruiterId: ObjectId, applicantId: ObjectId) {
  const bookmark = await recruiterBookmarksCollection(db).findOne({ recruiterId, applicantId });
  return Boolean(bookmark);
}

export async function createRecruiterMessage(db: Db, recruiterId: ObjectId, applicantId: ObjectId, body: string) {
  await recruiterMessagesCollection(db).insertOne({
    recruiterId,
    applicantId,
    body,
    createdAt: new Date()
  });
}

export async function findRecruiterMessages(db: Db, recruiterId: ObjectId) {
  return recruiterMessagesCollection(db).find({ recruiterId }).sort({ createdAt: -1 }).toArray();
}

export async function countRecruiterMessages(db: Db, recruiterId: ObjectId) {
  return recruiterMessagesCollection(db).countDocuments({ recruiterId });
}

export function serializeRecruiter(recruiter: WithId<RecruiterAccountDocument>) {
  return {
    id: recruiter._id.toString(),
    supabaseUserId: recruiter.supabaseUserId,
    email: recruiter.email,
    name: recruiter.name,
    companyName: recruiter.companyName,
    plan: recruiter.plan,
    createdAt: recruiter.createdAt.toISOString(),
    updatedAt: recruiter.updatedAt.toISOString()
  };
}
