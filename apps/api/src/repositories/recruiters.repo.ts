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

export type RecruiterCandidateReviewStatus = 'none' | 'maybe' | 'shortlisted' | 'passed';

export type RecruiterCandidateReviewDocument = {
  recruiterId: ObjectId;
  applicantId: ObjectId;
  status: RecruiterCandidateReviewStatus;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type RecruiterMessageDocument = {
  recruiterId: ObjectId;
  applicantId: ObjectId;
  senderRole?: 'recruiter' | 'applicant';
  body: string;
  readByApplicantAt?: Date;
  readByRecruiterAt?: Date;
  createdAt: Date;
};

export type RecruiterInterestRequestStatus = 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';

export type RecruiterInterestRequestDocument = {
  recruiterId: ObjectId;
  applicantId: ObjectId;
  reason: string;
  roleCategory?: string;
  sourceType?: 'profile' | 'video' | 'search' | 'match_proposal';
  sourceVideoId?: ObjectId;
  sourceProjectId?: ObjectId;
  sourceInternshipId?: ObjectId;
  sourceAccomplishmentId?: ObjectId;
  status: RecruiterInterestRequestStatus;
  sentAt: Date;
  viewedAt?: Date;
  respondedAt?: Date;
  expiresAt?: Date;
  updatedAt: Date;
};

export const INTEREST_REQUEST_EXPIRY_DAYS = 14;
export const INTEREST_REQUEST_RESEND_COOLDOWN_DAYS = 14;
export const RECRUITER_PENDING_INTEREST_REQUEST_LIMIT = 25;
export const RECRUITER_DAILY_INTEREST_REQUEST_LIMIT = 20;

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function recruiterAccountsCollection(db: Db): Collection<RecruiterAccountDocument> {
  return db.collection<RecruiterAccountDocument>(collections.recruiterAccounts);
}

export function recruiterBookmarksCollection(db: Db): Collection<RecruiterBookmarkDocument> {
  return db.collection<RecruiterBookmarkDocument>(collections.recruiterBookmarks);
}

export function recruiterCandidateReviewsCollection(db: Db): Collection<RecruiterCandidateReviewDocument> {
  return db.collection<RecruiterCandidateReviewDocument>(collections.recruiterCandidateReviews);
}

export function recruiterMessagesCollection(db: Db): Collection<RecruiterMessageDocument> {
  return db.collection<RecruiterMessageDocument>(collections.recruiterMessages);
}

export function recruiterInterestRequestsCollection(db: Db): Collection<RecruiterInterestRequestDocument> {
  return db.collection<RecruiterInterestRequestDocument>(collections.recruiterInterestRequests);
}

export async function ensureRecruiterIndexes(db: Db) {
  await Promise.all([
    recruiterAccountsCollection(db).createIndex({ supabaseUserId: 1 }, { unique: true }),
    recruiterAccountsCollection(db).createIndex({ email: 1 }),
    recruiterBookmarksCollection(db).createIndex({ recruiterId: 1, applicantId: 1 }, { unique: true }),
    recruiterBookmarksCollection(db).createIndex({ applicantId: 1 }),
    recruiterCandidateReviewsCollection(db).createIndex({ recruiterId: 1, applicantId: 1 }, { unique: true }),
    recruiterCandidateReviewsCollection(db).createIndex({ recruiterId: 1, status: 1, updatedAt: -1 }),
    recruiterCandidateReviewsCollection(db).createIndex({ recruiterId: 1, tags: 1, updatedAt: -1 }),
    recruiterCandidateReviewsCollection(db).createIndex({ applicantId: 1 }),
    recruiterInterestRequestsCollection(db).createIndex({ recruiterId: 1, applicantId: 1 }, { unique: true }),
    recruiterInterestRequestsCollection(db).createIndex({ recruiterId: 1, status: 1, updatedAt: -1 }),
    recruiterInterestRequestsCollection(db).createIndex({ applicantId: 1, status: 1, updatedAt: -1 }),
    recruiterInterestRequestsCollection(db).createIndex({ sourceType: 1, sourceVideoId: 1 }),
    recruiterInterestRequestsCollection(db).createIndex({ expiresAt: 1 }),
    recruiterMessagesCollection(db).createIndex({ recruiterId: 1, createdAt: -1 }),
    recruiterMessagesCollection(db).createIndex({ applicantId: 1, createdAt: -1 }),
    recruiterMessagesCollection(db).createIndex({ recruiterId: 1, senderRole: 1, readByRecruiterAt: 1 }),
    recruiterMessagesCollection(db).createIndex({ applicantId: 1, senderRole: 1, readByApplicantAt: 1 })
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

export async function findRecruiterCandidateReview(db: Db, recruiterId: ObjectId, applicantId: ObjectId) {
  return recruiterCandidateReviewsCollection(db).findOne({ recruiterId, applicantId });
}

export async function updateRecruiterCandidateReview(
  db: Db,
  recruiterId: ObjectId,
  applicantId: ObjectId,
  input: {
    notes?: string;
    status?: RecruiterCandidateReviewStatus;
    tags?: string[];
  }
) {
  const now = new Date();
  const status = input.status ?? 'none';
  const tags = input.tags ?? [];
  const setFields: Partial<RecruiterCandidateReviewDocument> = {
    status,
    tags,
    updatedAt: now
  };

  if (input.notes !== undefined) {
    setFields.notes = input.notes;
  }

  await recruiterCandidateReviewsCollection(db).updateOne(
    { recruiterId, applicantId },
    {
      $setOnInsert: {
        recruiterId,
        applicantId,
        createdAt: now
      },
      $set: setFields
    },
    { upsert: true }
  );

  const review = await findRecruiterCandidateReview(db, recruiterId, applicantId);

  if (!review) {
    throw new Error('Candidate review save failed');
  }

  return review;
}

export async function upsertRecruiterInterestRequest(
  db: Db,
  recruiterId: ObjectId,
  applicantId: ObjectId,
  input: {
    reason: string;
    resend?: boolean;
    roleCategory?: string;
    sourceType?: 'profile' | 'video' | 'search' | 'match_proposal';
    sourceVideoId?: ObjectId;
    sourceProjectId?: ObjectId;
    sourceInternshipId?: ObjectId;
    sourceAccomplishmentId?: ObjectId;
  }
) {
  const now = new Date();
  const expiresAt = addDays(now, INTEREST_REQUEST_EXPIRY_DAYS);

  await recruiterInterestRequestsCollection(db).updateOne(
    { recruiterId, applicantId },
    {
      $setOnInsert: {
        recruiterId,
        applicantId
      },
      $set: {
        reason: input.reason,
        ...(input.roleCategory ? { roleCategory: input.roleCategory } : {}),
        ...(input.sourceType ? { sourceType: input.sourceType } : {}),
        ...(input.sourceVideoId ? { sourceVideoId: input.sourceVideoId } : {}),
        ...(input.sourceProjectId ? { sourceProjectId: input.sourceProjectId } : {}),
        ...(input.sourceInternshipId ? { sourceInternshipId: input.sourceInternshipId } : {}),
        ...(input.sourceAccomplishmentId ? { sourceAccomplishmentId: input.sourceAccomplishmentId } : {}),
        status: 'sent',
        sentAt: now,
        expiresAt,
        updatedAt: now
      },
      $unset: {
        viewedAt: '',
        respondedAt: '',
        ...(input.sourceType ? {} : { sourceType: '' }),
        ...(input.sourceVideoId ? {} : { sourceVideoId: '' }),
        ...(input.sourceProjectId ? {} : { sourceProjectId: '' }),
        ...(input.sourceInternshipId ? {} : { sourceInternshipId: '' }),
        ...(input.sourceAccomplishmentId ? {} : { sourceAccomplishmentId: '' })
      }
    },
    { upsert: true }
  );

  const request = await findRecruiterInterestRequest(db, recruiterId, applicantId);

  if (!request) {
    throw new Error('Interest request save failed');
  }

  return request;
}

export async function findRecruiterInterestRequest(db: Db, recruiterId: ObjectId, applicantId: ObjectId) {
  return recruiterInterestRequestsCollection(db).findOne({ recruiterId, applicantId });
}

export async function expireStaleInterestRequests(db: Db) {
  const now = new Date();

  await recruiterInterestRequestsCollection(db).updateMany(
    {
      status: { $in: ['sent', 'viewed'] },
      expiresAt: { $lte: now }
    },
    {
      $set: {
        status: 'expired',
        updatedAt: now
      }
    }
  );
}

export async function findRecruiterInterestRequests(db: Db, recruiterId: ObjectId) {
  return recruiterInterestRequestsCollection(db).find({ recruiterId }).sort({ updatedAt: -1 }).toArray();
}

export async function findApplicantInterestRequests(db: Db, applicantId: ObjectId) {
  return recruiterInterestRequestsCollection(db).find({ applicantId }).sort({ updatedAt: -1 }).toArray();
}

export async function findInterestRequestById(db: Db, requestId: ObjectId) {
  return recruiterInterestRequestsCollection(db).findOne({ _id: requestId });
}

export async function markInterestRequestViewed(db: Db, requestId: ObjectId) {
  const now = new Date();

  await recruiterInterestRequestsCollection(db).updateOne(
    { _id: requestId, status: 'sent', viewedAt: { $exists: false } },
    {
      $set: {
        status: 'viewed',
        viewedAt: now,
        updatedAt: now
      }
    }
  );
}

export async function respondToInterestRequest(
  db: Db,
  requestId: ObjectId,
  applicantId: ObjectId,
  action: 'accept' | 'decline'
) {
  const now = new Date();
  const status = action === 'accept' ? 'accepted' : 'declined';

  await expireStaleInterestRequests(db);

  const result = await recruiterInterestRequestsCollection(db).updateOne(
    {
      _id: requestId,
      applicantId,
      status: { $in: ['sent', 'viewed'] },
      $or: [{ expiresAt: { $gt: now } }, { expiresAt: { $exists: false } }]
    },
    {
      $set: {
        status,
        respondedAt: now,
        updatedAt: now
      }
    }
  );

  return result.modifiedCount > 0 ? findInterestRequestById(db, requestId) : null;
}

export async function countRecruiterInterestRequests(db: Db, recruiterId: ObjectId) {
  return recruiterInterestRequestsCollection(db).countDocuments({ recruiterId });
}

export async function countRecruiterPendingInterestRequests(db: Db, recruiterId: ObjectId) {
  await expireStaleInterestRequests(db);
  return recruiterInterestRequestsCollection(db).countDocuments({
    recruiterId,
    status: { $in: ['sent', 'viewed'] }
  });
}

export async function countRecruiterRecentInterestRequests(db: Db, recruiterId: ObjectId, since: Date) {
  return recruiterInterestRequestsCollection(db).countDocuments({
    recruiterId,
    sentAt: { $gte: since }
  });
}

export function getInterestRequestResendAvailableAt(request: WithId<RecruiterInterestRequestDocument>) {
  if (request.status !== 'declined') {
    return undefined;
  }

  return addDays(request.respondedAt ?? request.updatedAt, INTEREST_REQUEST_RESEND_COOLDOWN_DAYS);
}

export async function createRecruiterMessage(db: Db, recruiterId: ObjectId, applicantId: ObjectId, body: string) {
  await recruiterMessagesCollection(db).insertOne({
    recruiterId,
    applicantId,
    senderRole: 'recruiter',
    body,
    createdAt: new Date()
  });
}

export async function createApplicantMessage(db: Db, recruiterId: ObjectId, applicantId: ObjectId, body: string) {
  await recruiterMessagesCollection(db).insertOne({
    recruiterId,
    applicantId,
    senderRole: 'applicant',
    body,
    createdAt: new Date()
  });
}

export async function findRecruiterMessages(db: Db, recruiterId: ObjectId) {
  return recruiterMessagesCollection(db).find({ recruiterId }).sort({ createdAt: -1 }).toArray();
}

export async function findConversationMessages(db: Db, recruiterId: ObjectId, applicantId: ObjectId) {
  return recruiterMessagesCollection(db).find({ recruiterId, applicantId }).sort({ createdAt: 1 }).toArray();
}

export async function countRecruiterMessages(db: Db, recruiterId: ObjectId) {
  return recruiterMessagesCollection(db).countDocuments({ recruiterId });
}

export async function countUnreadRecruiterMessages(db: Db, recruiterId: ObjectId) {
  return recruiterMessagesCollection(db).countDocuments({
    recruiterId,
    senderRole: 'applicant',
    readByRecruiterAt: { $exists: false }
  });
}

export async function countUnreadApplicantMessages(db: Db, applicantId: ObjectId, recruiterId?: ObjectId) {
  return recruiterMessagesCollection(db).countDocuments({
    applicantId,
    ...(recruiterId ? { recruiterId } : {}),
    $or: [{ senderRole: 'recruiter' }, { senderRole: { $exists: false } }],
    readByApplicantAt: { $exists: false }
  });
}

export async function markApplicantConversationRead(db: Db, recruiterId: ObjectId, applicantId: ObjectId) {
  await recruiterMessagesCollection(db).updateMany(
    {
      recruiterId,
      applicantId,
      $or: [{ senderRole: 'recruiter' }, { senderRole: { $exists: false } }],
      readByApplicantAt: { $exists: false }
    },
    {
      $set: {
        readByApplicantAt: new Date()
      }
    }
  );
}

export async function markRecruiterConversationRead(db: Db, recruiterId: ObjectId, applicantId: ObjectId) {
  await recruiterMessagesCollection(db).updateMany(
    {
      recruiterId,
      applicantId,
      senderRole: 'applicant',
      readByRecruiterAt: { $exists: false }
    },
    {
      $set: {
        readByRecruiterAt: new Date()
      }
    }
  );
}

export function serializeRecruiterInterestRequest(
  request: WithId<RecruiterInterestRequestDocument>,
  candidateName?: string
) {
  return {
    id: request._id.toString(),
    recruiterId: request.recruiterId.toString(),
    candidateId: request.applicantId.toString(),
    candidateName,
    reason: request.reason,
    roleCategory: request.roleCategory,
    sourceType: request.sourceType,
    sourceVideoId: request.sourceVideoId?.toString(),
    sourceProjectId: request.sourceProjectId?.toString(),
    sourceInternshipId: request.sourceInternshipId?.toString(),
    sourceAccomplishmentId: request.sourceAccomplishmentId?.toString(),
    status: request.status,
    sentAt: request.sentAt.toISOString(),
    viewedAt: request.viewedAt?.toISOString(),
    respondedAt: request.respondedAt?.toISOString(),
    expiresAt: request.expiresAt?.toISOString(),
    resendAvailableAt: getInterestRequestResendAvailableAt(request)?.toISOString(),
    updatedAt: request.updatedAt.toISOString()
  };
}

export function serializeRecruiterCandidateReview(review: WithId<RecruiterCandidateReviewDocument>) {
  return {
    id: review._id.toString(),
    recruiterId: review.recruiterId.toString(),
    candidateId: review.applicantId.toString(),
    status: review.status,
    notes: review.notes,
    tags: review.tags,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString()
  };
}

export function serializeApplicantInterestRequest(
  request: WithId<RecruiterInterestRequestDocument>,
  recruiter?: WithId<RecruiterAccountDocument> | null
) {
  return {
    id: request._id.toString(),
    recruiterId: request.recruiterId.toString(),
    recruiterName: recruiter?.name,
    companyName: recruiter?.companyName,
    reason: request.reason,
    roleCategory: request.roleCategory,
    sourceType: request.sourceType,
    sourceVideoId: request.sourceVideoId?.toString(),
    sourceProjectId: request.sourceProjectId?.toString(),
    sourceInternshipId: request.sourceInternshipId?.toString(),
    sourceAccomplishmentId: request.sourceAccomplishmentId?.toString(),
    status: request.status,
    sentAt: request.sentAt.toISOString(),
    viewedAt: request.viewedAt?.toISOString(),
    respondedAt: request.respondedAt?.toISOString(),
    expiresAt: request.expiresAt?.toISOString(),
    resendAvailableAt: getInterestRequestResendAvailableAt(request)?.toISOString(),
    updatedAt: request.updatedAt.toISOString()
  };
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
