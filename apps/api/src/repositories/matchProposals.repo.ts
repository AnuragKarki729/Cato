import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';

export type ApplicantJobComponentScores = {
  bm25: number;
  filters: number;
  profileStrength: number;
  projects: number;
  internships: number;
  softSkills: number;
  freshness: number;
};

export type ApplicantJobScore = {
  applicantId: string;
  jobId: string;
  totalScore: number;
  componentScores: ApplicantJobComponentScores;
  reasons: string[];
  blockers: string[];
};

export type MatchProposalStatus =
  | 'suggested'
  | 'queued'
  | 'sent'
  | 'held'
  | 'rejected_by_algorithm'
  | 'accepted_by_applicant'
  | 'declined_by_applicant'
  | 'expired';

export type MatchProposalDocument = {
  jobId: ObjectId;
  recruiterId: ObjectId;
  applicantId: ObjectId;
  status: MatchProposalStatus;
  score: ApplicantJobScore;
  rankForJob: number;
  rankForApplicant: number;
  runId: ObjectId;
  proposedAt: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export function matchProposalsCollection(db: Db): Collection<MatchProposalDocument> {
  return db.collection<MatchProposalDocument>(collections.matchProposals);
}

export async function ensureMatchProposalIndexes(db: Db) {
  await Promise.all([
    matchProposalsCollection(db).createIndex({ jobId: 1, applicantId: 1 }, { unique: true }),
    matchProposalsCollection(db).createIndex({ recruiterId: 1, status: 1, updatedAt: -1 }),
    matchProposalsCollection(db).createIndex({ applicantId: 1, status: 1, updatedAt: -1 }),
    matchProposalsCollection(db).createIndex({ runId: 1 }),
    matchProposalsCollection(db).createIndex({ jobId: 1, status: 1, 'score.totalScore': -1 })
  ]);
}

export async function upsertMatchProposal(
  db: Db,
  input: {
    jobId: ObjectId;
    recruiterId: ObjectId;
    applicantId: ObjectId;
    status: MatchProposalStatus;
    score: ApplicantJobScore;
    rankForJob: number;
    rankForApplicant: number;
    runId: ObjectId;
    expiresAt?: Date;
  }
) {
  const now = new Date();
  await matchProposalsCollection(db).updateOne(
    { jobId: input.jobId, applicantId: input.applicantId },
    {
      $setOnInsert: {
        jobId: input.jobId,
        recruiterId: input.recruiterId,
        applicantId: input.applicantId,
        createdAt: now
      },
      $set: {
        status: input.status,
        score: input.score,
        rankForJob: input.rankForJob,
        rankForApplicant: input.rankForApplicant,
        runId: input.runId,
        proposedAt: now,
        ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
        updatedAt: now
      },
      $unset: input.expiresAt ? {} : { expiresAt: '' }
    },
    { upsert: true }
  );

  const proposal = await matchProposalsCollection(db).findOne({ jobId: input.jobId, applicantId: input.applicantId });

  if (!proposal) {
    throw new Error('Match proposal save failed');
  }

  return proposal;
}

export async function findRecruiterMatchProposals(db: Db, recruiterId: ObjectId, status?: MatchProposalStatus) {
  return matchProposalsCollection(db)
    .find({
      recruiterId,
      ...(status ? { status } : {})
    })
    .sort({ updatedAt: -1 })
    .toArray();
}

export async function findApplicantMatchProposals(db: Db, applicantId: ObjectId, status?: MatchProposalStatus) {
  return matchProposalsCollection(db)
    .find({
      applicantId,
      ...(status ? { status } : {})
    })
    .sort({ updatedAt: -1 })
    .toArray();
}

export async function findMatchProposalsByRunId(db: Db, runId: ObjectId) {
  return matchProposalsCollection(db).find({ runId }).sort({ rankForJob: 1 }).toArray();
}

export function serializeMatchProposal(proposal: WithId<MatchProposalDocument>) {
  return {
    id: proposal._id.toString(),
    jobId: proposal.jobId.toString(),
    recruiterId: proposal.recruiterId.toString(),
    applicantId: proposal.applicantId.toString(),
    status: proposal.status,
    score: proposal.score,
    rankForJob: proposal.rankForJob,
    rankForApplicant: proposal.rankForApplicant,
    runId: proposal.runId.toString(),
    proposedAt: proposal.proposedAt.toISOString(),
    expiresAt: proposal.expiresAt?.toISOString(),
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString()
  };
}
