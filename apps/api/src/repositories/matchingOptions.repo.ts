import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';

export type MatchingOptionType = 'category' | 'skill';

export type MatchingOptionDocument = {
  type: MatchingOptionType;
  key: string;
  label: string;
  addedByRecruiterId?: ObjectId;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export function normalizeMatchingOptionKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9+#.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s/g, '_');
}

export function normalizeMatchingOptionLabel(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function matchingOptionCatalogCollection(db: Db): Collection<MatchingOptionDocument> {
  return db.collection<MatchingOptionDocument>(collections.matchingOptionCatalog);
}

export async function ensureMatchingOptionIndexes(db: Db) {
  await Promise.all([
    matchingOptionCatalogCollection(db).createIndex({ type: 1, key: 1 }, { unique: true }),
    matchingOptionCatalogCollection(db).createIndex({ type: 1, label: 1 }),
    matchingOptionCatalogCollection(db).createIndex({ type: 1, usageCount: -1, updatedAt: -1 })
  ]);
}

export async function findMatchingOptionByKey(db: Db, type: MatchingOptionType, key: string) {
  return matchingOptionCatalogCollection(db).findOne({ type, key });
}

export async function findCustomMatchingOptions(db: Db, type?: MatchingOptionType) {
  return matchingOptionCatalogCollection(db)
    .find({
      ...(type ? { type } : {})
    })
    .sort({ usageCount: -1, label: 1 })
    .toArray();
}

export async function upsertCustomMatchingOption(
  db: Db,
  input: {
    type: MatchingOptionType;
    label: string;
    addedByRecruiterId?: ObjectId;
  }
) {
  const now = new Date();
  const label = normalizeMatchingOptionLabel(input.label);
  const key = normalizeMatchingOptionKey(label);

  await matchingOptionCatalogCollection(db).updateOne(
    { type: input.type, key },
    {
      $setOnInsert: {
        type: input.type,
        key,
        createdAt: now
      },
      $set: {
        label,
        ...(input.addedByRecruiterId ? { addedByRecruiterId: input.addedByRecruiterId } : {}),
        updatedAt: now
      },
      $inc: {
        usageCount: 1
      }
    },
    { upsert: true }
  );

  const option = await findMatchingOptionByKey(db, input.type, key);

  if (!option) {
    throw new Error('Matching option save failed');
  }

  return option;
}

export function serializeMatchingOption(option: WithId<MatchingOptionDocument> | (MatchingOptionDocument & { builtin?: boolean })) {
  return {
    id: option.key,
    type: option.type,
    key: option.key,
    label: option.label,
    builtin: 'builtin' in option ? option.builtin : false,
    usageCount: option.usageCount,
    addedByRecruiterId: option.addedByRecruiterId?.toString(),
    createdAt: option.createdAt.toISOString(),
    updatedAt: option.updatedAt.toISOString()
  };
}
