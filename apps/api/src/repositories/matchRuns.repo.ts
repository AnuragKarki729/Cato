import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';

export type MatchRunScope = 'all' | 'job' | 'applicant' | 'recruiter';
export type MatchRunStatus = 'running' | 'completed' | 'failed';

export type MatchRunStats = {
  jobsProcessed: number;
  applicantsConsidered: number;
  proposalsCreated: number;
  proposalsHeld: number;
  proposalsRejected: number;
};

export type MatchRunDocument = {
  status: MatchRunStatus;
  scope: MatchRunScope;
  targetId?: ObjectId;
  startedAt: Date;
  completedAt?: Date;
  stats: MatchRunStats;
  error?: string;
};

export function matchRunsCollection(db: Db): Collection<MatchRunDocument> {
  return db.collection<MatchRunDocument>(collections.matchRuns);
}

export async function ensureMatchRunIndexes(db: Db) {
  await Promise.all([
    matchRunsCollection(db).createIndex({ status: 1, startedAt: -1 }),
    matchRunsCollection(db).createIndex({ scope: 1, targetId: 1, startedAt: -1 })
  ]);
}

export async function createMatchRun(db: Db, input: { scope: MatchRunScope; targetId?: ObjectId }) {
  const result = await matchRunsCollection(db).insertOne({
    status: 'running',
    scope: input.scope,
    ...(input.targetId ? { targetId: input.targetId } : {}),
    startedAt: new Date(),
    stats: {
      jobsProcessed: 0,
      applicantsConsidered: 0,
      proposalsCreated: 0,
      proposalsHeld: 0,
      proposalsRejected: 0
    }
  });

  const run = await matchRunsCollection(db).findOne({ _id: result.insertedId });

  if (!run) {
    throw new Error('Match run create failed');
  }

  return run;
}

export async function completeMatchRun(db: Db, runId: ObjectId, stats: MatchRunStats) {
  await matchRunsCollection(db).updateOne(
    { _id: runId },
    {
      $set: {
        status: 'completed',
        completedAt: new Date(),
        stats
      }
    }
  );

  return matchRunsCollection(db).findOne({ _id: runId });
}

export async function failMatchRun(db: Db, runId: ObjectId, error: string) {
  await matchRunsCollection(db).updateOne(
    { _id: runId },
    {
      $set: {
        status: 'failed',
        completedAt: new Date(),
        error
      }
    }
  );

  return matchRunsCollection(db).findOne({ _id: runId });
}

export async function findMatchRunById(db: Db, runId: ObjectId) {
  return matchRunsCollection(db).findOne({ _id: runId });
}

export function serializeMatchRun(run: WithId<MatchRunDocument>) {
  return {
    id: run._id.toString(),
    status: run.status,
    scope: run.scope,
    targetId: run.targetId?.toString(),
    startedAt: run.startedAt.toISOString(),
    completedAt: run.completedAt?.toISOString(),
    stats: run.stats,
    error: run.error
  };
}
