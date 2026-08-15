import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';

export const MAX_RECRUITER_SAVED_FILTERS = 10;

export type RecruiterSavedFilterCriteria = {
  bookmarkedOnly?: boolean;
  categoryFieldIds?: string[];
  gpaMin?: number;
  hasInternship?: boolean;
  majors?: string[];
  q?: string;
  reviewStatus?: 'none' | 'maybe' | 'shortlisted' | 'passed';
  semesterNumbers?: number[];
  universities?: string[];
};

export type RecruiterSavedFilterDocument = {
  recruiterId: ObjectId;
  name: string;
  criteria: RecruiterSavedFilterCriteria;
  filterKey: string;
  createdAt: Date;
  updatedAt: Date;
};

export function recruiterSavedFiltersCollection(db: Db): Collection<RecruiterSavedFilterDocument> {
  return db.collection<RecruiterSavedFilterDocument>(collections.recruiterSavedFilters);
}

export async function ensureRecruiterSavedFilterIndexes(db: Db) {
  await Promise.all([
    recruiterSavedFiltersCollection(db).createIndex({ recruiterId: 1, updatedAt: -1 }),
    recruiterSavedFiltersCollection(db).createIndex({ recruiterId: 1, filterKey: 1 }, { unique: true })
  ]);
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeTextArray(values: string[] | undefined) {
  return Array.from(new Set((values ?? []).map(normalizeText).filter(Boolean).map((value) => value.toLowerCase()))).sort();
}

function normalizeNumberArray(values: number[] | undefined) {
  return Array.from(new Set((values ?? []).filter((value) => Number.isFinite(value)))).sort((a, b) => a - b);
}

export function normalizeSavedFilterCriteria(criteria: RecruiterSavedFilterCriteria): RecruiterSavedFilterCriteria {
  const categoryFieldIds = normalizeTextArray(criteria.categoryFieldIds);
  const universities = normalizeTextArray(criteria.universities);
  const majors = normalizeTextArray(criteria.majors);
  const semesterNumbers = normalizeNumberArray(criteria.semesterNumbers);

  return {
    ...(criteria.q?.trim() ? { q: normalizeText(criteria.q) } : {}),
    ...(categoryFieldIds.length > 0 ? { categoryFieldIds } : {}),
    ...(universities.length > 0 ? { universities } : {}),
    ...(majors.length > 0 ? { majors } : {}),
    ...(semesterNumbers.length > 0 ? { semesterNumbers } : {}),
    ...(typeof criteria.gpaMin === 'number' ? { gpaMin: Math.round(criteria.gpaMin * 100) / 100 } : {}),
    ...(typeof criteria.hasInternship === 'boolean' ? { hasInternship: criteria.hasInternship } : {}),
    ...(criteria.bookmarkedOnly ? { bookmarkedOnly: true } : {}),
    ...(criteria.reviewStatus ? { reviewStatus: criteria.reviewStatus } : {})
  };
}

export function buildSavedFilterKey(criteria: RecruiterSavedFilterCriteria) {
  return JSON.stringify(normalizeSavedFilterCriteria(criteria));
}

export async function findRecruiterSavedFilters(db: Db, recruiterId: ObjectId) {
  return recruiterSavedFiltersCollection(db).find({ recruiterId }).sort({ updatedAt: -1 }).toArray();
}

export async function createRecruiterSavedFilter(
  db: Db,
  recruiterId: ObjectId,
  input: { criteria: RecruiterSavedFilterCriteria; name: string }
) {
  const name = normalizeText(input.name);
  const criteria = normalizeSavedFilterCriteria(input.criteria);
  const filterKey = buildSavedFilterKey(criteria);

  const existing = await recruiterSavedFiltersCollection(db).findOne({ recruiterId, filterKey });

  if (existing) {
    const error = new Error(`This filter combination already exists in "${existing.name}"`);
    error.name = 'DuplicateSavedFilterError';
    throw error;
  }

  const existingCount = await recruiterSavedFiltersCollection(db).countDocuments({ recruiterId });

  if (existingCount >= MAX_RECRUITER_SAVED_FILTERS) {
    const error = new Error(`You can save up to ${MAX_RECRUITER_SAVED_FILTERS} filters.`);
    error.name = 'SavedFilterLimitError';
    throw error;
  }

  const now = new Date();
  const document: RecruiterSavedFilterDocument = {
    recruiterId,
    name,
    criteria,
    filterKey,
    createdAt: now,
    updatedAt: now
  };
  const result = await recruiterSavedFiltersCollection(db).insertOne(document);
  return { ...document, _id: result.insertedId };
}

export async function deleteRecruiterSavedFilter(db: Db, recruiterId: ObjectId, filterId: ObjectId) {
  const result = await recruiterSavedFiltersCollection(db).deleteOne({ _id: filterId, recruiterId });
  return result.deletedCount > 0;
}

export function serializeRecruiterSavedFilter(filter: WithId<RecruiterSavedFilterDocument>) {
  return {
    id: filter._id.toString(),
    recruiterId: filter.recruiterId.toString(),
    name: filter.name,
    criteria: filter.criteria,
    createdAt: filter.createdAt.toISOString(),
    updatedAt: filter.updatedAt.toISOString()
  };
}
