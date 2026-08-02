import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';

type SoftSkillItem = {
  label: string;
  rating: number;
  evidence: string;
  confidence: 'low' | 'medium' | 'high';
};

export type SoftSkillOutputDocument = {
  applicantId: ObjectId;
  source: 'dummy' | 'resume';
  provider: 'none' | 'gemini';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  items: SoftSkillItem[];
  editableByApplicant: boolean;
  generatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export function softSkillOutputsCollection(db: Db): Collection<SoftSkillOutputDocument> {
  return db.collection<SoftSkillOutputDocument>(collections.softSkillOutputs);
}

export async function findSoftSkillsByApplicantId(db: Db, applicantId: ObjectId) {
  return softSkillOutputsCollection(db).findOne({ applicantId });
}

export async function saveDummySoftSkills(db: Db, applicantId: ObjectId, items: SoftSkillItem[]) {
  const now = new Date();

  await softSkillOutputsCollection(db).updateOne(
    { applicantId },
    {
      $setOnInsert: {
        applicantId,
        createdAt: now
      },
      $set: {
        source: 'dummy',
        provider: 'none',
        status: 'completed',
        items,
        editableByApplicant: true,
        generatedAt: now,
        updatedAt: now
      }
    },
    { upsert: true }
  );

  const output = await findSoftSkillsByApplicantId(db, applicantId);

  if (!output) {
    throw new Error('Soft-skill output save failed');
  }

  return output;
}

export async function markSoftSkillsSkipped(db: Db, applicantId: ObjectId) {
  const now = new Date();

  await softSkillOutputsCollection(db).updateOne(
    { applicantId },
    {
      $setOnInsert: {
        applicantId,
        createdAt: now
      },
      $set: {
        source: 'dummy',
        provider: 'none',
        status: 'skipped',
        items: [],
        editableByApplicant: true,
        updatedAt: now
      },
      $unset: {
        generatedAt: ''
      }
    },
    { upsert: true }
  );

  const output = await findSoftSkillsByApplicantId(db, applicantId);

  if (!output) {
    throw new Error('Soft-skill skip failed');
  }

  return output;
}

export async function updateSoftSkillItems(db: Db, applicantId: ObjectId, items: SoftSkillItem[]) {
  const now = new Date();

  await softSkillOutputsCollection(db).updateOne(
    { applicantId },
    {
      $setOnInsert: {
        applicantId,
        source: 'dummy',
        provider: 'none',
        status: 'completed',
        editableByApplicant: true,
        createdAt: now
      },
      $set: {
        items,
        updatedAt: now
      }
    },
    { upsert: true }
  );

  const output = await findSoftSkillsByApplicantId(db, applicantId);

  if (!output) {
    throw new Error('Soft-skill update failed');
  }

  return output;
}

export function serializeSoftSkills(output: WithId<SoftSkillOutputDocument>) {
  return {
    source: output.source,
    provider: output.provider,
    status: output.status,
    items: output.items,
    editableByApplicant: output.editableByApplicant,
    generatedAt: output.generatedAt?.toISOString(),
    updatedAt: output.updatedAt.toISOString()
  };
}
