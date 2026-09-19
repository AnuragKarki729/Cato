import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';
import { normalizeMatchingOptionKey } from './matchingOptions.repo.js';

export type RecruiterJobEmploymentType = 'internship' | 'full_time' | 'part_time' | 'contract';
export type RecruiterJobStatus = 'active' | 'paused' | 'closed';

export type RecruiterJobCapacity = {
  maxShortlist: number;
  maxAutoProposalsPerRun: number;
  maxActiveInterestRequests: number;
};

export type RecruiterJobDepth = {
  type: 'skill' | 'category';
  id: string;
};

export type RecruiterJobDocument = {
  recruiterId: ObjectId;
  companyName?: string;
  title: string;
  roleCategory: string;
  targetMajors: string[];
  targetCategories: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  desiredDepth?: RecruiterJobDepth;
  searchText?: string;
  location?: string;
  remotePolicy?: string;
  employmentType: RecruiterJobEmploymentType;
  minGpa?: number;
  preferredSemesterRange?: {
    min?: number;
    max?: number;
  };
  capacity: RecruiterJobCapacity;
  status: RecruiterJobStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type SaveRecruiterJobInput = {
  companyName?: string;
  title: string;
  roleCategory: string;
  targetMajors?: string[];
  targetCategories?: string[];
  requiredSkills?: string[];
  preferredSkills?: string[];
  desiredDepth?: RecruiterJobDepth;
  searchText?: string;
  location?: string;
  remotePolicy?: string;
  employmentType: RecruiterJobEmploymentType;
  minGpa?: number;
  preferredSemesterRange?: {
    min?: number;
    max?: number;
  };
  capacity?: Partial<RecruiterJobCapacity>;
  status?: RecruiterJobStatus;
};

const defaultCapacity: RecruiterJobCapacity = {
  maxShortlist: 30,
  maxAutoProposalsPerRun: 20,
  maxActiveInterestRequests: 25
};

function normalizeList(values: string[] | undefined, max: number) {
  return Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean))).slice(0, max);
}

function normalizeDepth(depth: RecruiterJobDepth | undefined) {
  if (!depth) {
    return undefined;
  }

  const id = normalizeMatchingOptionKey(depth.id);

  if (!id) {
    return undefined;
  }

  return {
    type: depth.type,
    id
  };
}

function normalizeCapacity(capacity: Partial<RecruiterJobCapacity> | undefined): RecruiterJobCapacity {
  return {
    maxShortlist: Math.max(1, Math.min(250, capacity?.maxShortlist ?? defaultCapacity.maxShortlist)),
    maxAutoProposalsPerRun: Math.max(1, Math.min(100, capacity?.maxAutoProposalsPerRun ?? defaultCapacity.maxAutoProposalsPerRun)),
    maxActiveInterestRequests: Math.max(1, Math.min(250, capacity?.maxActiveInterestRequests ?? defaultCapacity.maxActiveInterestRequests))
  };
}

export function recruiterJobsCollection(db: Db): Collection<RecruiterJobDocument> {
  return db.collection<RecruiterJobDocument>(collections.recruiterJobs);
}

export async function ensureRecruiterJobIndexes(db: Db) {
  await Promise.all([
    recruiterJobsCollection(db).createIndex({ recruiterId: 1, status: 1, updatedAt: -1 }),
    recruiterJobsCollection(db).createIndex({ status: 1, updatedAt: -1 }),
    recruiterJobsCollection(db).createIndex({ roleCategory: 1, status: 1 }),
    recruiterJobsCollection(db).createIndex({ employmentType: 1, status: 1 }),
    recruiterJobsCollection(db).createIndex({ targetCategories: 1, status: 1 }),
    recruiterJobsCollection(db).createIndex({ targetMajors: 1, status: 1 }),
    recruiterJobsCollection(db).createIndex({ 'desiredDepth.type': 1, 'desiredDepth.id': 1, status: 1 })
  ]);
}

export async function createRecruiterJob(db: Db, recruiterId: ObjectId, input: SaveRecruiterJobInput) {
  const now = new Date();
  const result = await recruiterJobsCollection(db).insertOne({
    recruiterId,
    ...(input.companyName ? { companyName: input.companyName } : {}),
    title: input.title.trim(),
    roleCategory: input.roleCategory.trim(),
    targetMajors: normalizeList(input.targetMajors, 30),
    targetCategories: normalizeList(input.targetCategories, 10),
    requiredSkills: normalizeList(input.requiredSkills, 100),
    preferredSkills: normalizeList(input.preferredSkills, 100),
    ...(normalizeDepth(input.desiredDepth) ? { desiredDepth: normalizeDepth(input.desiredDepth) } : {}),
    ...(input.searchText?.trim() ? { searchText: input.searchText.trim() } : {}),
    ...(input.location?.trim() ? { location: input.location.trim() } : {}),
    ...(input.remotePolicy?.trim() ? { remotePolicy: input.remotePolicy.trim() } : {}),
    employmentType: input.employmentType,
    ...(typeof input.minGpa === 'number' ? { minGpa: input.minGpa } : {}),
    ...(input.preferredSemesterRange ? { preferredSemesterRange: input.preferredSemesterRange } : {}),
    capacity: normalizeCapacity(input.capacity),
    status: input.status ?? 'active',
    createdAt: now,
    updatedAt: now
  });

  const job = await recruiterJobsCollection(db).findOne({ _id: result.insertedId });

  if (!job) {
    throw new Error('Recruiter job create failed');
  }

  return job;
}

export async function updateRecruiterJob(db: Db, recruiterId: ObjectId, jobId: ObjectId, input: SaveRecruiterJobInput) {
  const update = {
    companyName: input.companyName,
    title: input.title.trim(),
    roleCategory: input.roleCategory.trim(),
    targetMajors: normalizeList(input.targetMajors, 30),
    targetCategories: normalizeList(input.targetCategories, 10),
    requiredSkills: normalizeList(input.requiredSkills, 100),
    preferredSkills: normalizeList(input.preferredSkills, 100),
    desiredDepth: normalizeDepth(input.desiredDepth),
    searchText: input.searchText?.trim(),
    location: input.location?.trim(),
    remotePolicy: input.remotePolicy?.trim(),
    employmentType: input.employmentType,
    minGpa: input.minGpa,
    preferredSemesterRange: input.preferredSemesterRange,
    capacity: normalizeCapacity(input.capacity),
    status: input.status ?? 'active',
    updatedAt: new Date()
  };

  await recruiterJobsCollection(db).updateOne(
    { _id: jobId, recruiterId },
    {
      $set: update,
      $unset: {
        ...(input.companyName ? {} : { companyName: '' }),
        ...(input.searchText ? {} : { searchText: '' }),
        ...(input.location ? {} : { location: '' }),
        ...(input.remotePolicy ? {} : { remotePolicy: '' }),
        ...(input.desiredDepth ? {} : { desiredDepth: '' }),
        ...(typeof input.minGpa === 'number' ? {} : { minGpa: '' }),
        ...(input.preferredSemesterRange ? {} : { preferredSemesterRange: '' })
      }
    }
  );

  return findRecruiterJobById(db, jobId, recruiterId);
}

export async function findRecruiterJobById(db: Db, jobId: ObjectId, recruiterId?: ObjectId) {
  return recruiterJobsCollection(db).findOne({
    _id: jobId,
    ...(recruiterId ? { recruiterId } : {})
  });
}

export async function findRecruiterJobs(db: Db, recruiterId: ObjectId) {
  return recruiterJobsCollection(db).find({ recruiterId }).sort({ updatedAt: -1 }).toArray();
}

export async function findActiveRecruiterJobs(db: Db) {
  return recruiterJobsCollection(db).find({ status: 'active' }).sort({ updatedAt: -1 }).toArray();
}

export function serializeRecruiterJob(job: WithId<RecruiterJobDocument>) {
  return {
    id: job._id.toString(),
    recruiterId: job.recruiterId.toString(),
    companyName: job.companyName,
    title: job.title,
    roleCategory: job.roleCategory,
    targetMajors: job.targetMajors,
    targetCategories: job.targetCategories,
    requiredSkills: job.requiredSkills,
    preferredSkills: job.preferredSkills,
    desiredDepth: job.desiredDepth,
    searchText: job.searchText,
    location: job.location,
    remotePolicy: job.remotePolicy,
    employmentType: job.employmentType,
    minGpa: job.minGpa,
    preferredSemesterRange: job.preferredSemesterRange,
    capacity: job.capacity,
    status: job.status,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString()
  };
}
