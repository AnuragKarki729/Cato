import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';

export type ResumeParsedTextDocument = {
  applicantId: ObjectId;
  resumeId?: ObjectId;
  text: string;
  parser: 'client' | 'manual' | 'unknown';
  sourceFileName?: string;
  extractedSkills: string[];
  createdAt: Date;
  updatedAt: Date;
};

export function resumeParsedTextsCollection(db: Db): Collection<ResumeParsedTextDocument> {
  return db.collection<ResumeParsedTextDocument>(collections.resumeParsedTexts);
}

export async function ensureResumeParsedTextIndexes(db: Db) {
  await Promise.all([
    resumeParsedTextsCollection(db).createIndex({ applicantId: 1 }, { unique: true }),
    resumeParsedTextsCollection(db).createIndex({ updatedAt: -1 }),
    resumeParsedTextsCollection(db).createIndex({ extractedSkills: 1 })
  ]);
}

export async function findResumeParsedTextByApplicantId(db: Db, applicantId: ObjectId) {
  return resumeParsedTextsCollection(db).findOne({ applicantId });
}

export async function deleteResumeParsedTextByApplicantId(db: Db, applicantId: ObjectId) {
  await resumeParsedTextsCollection(db).deleteOne({ applicantId });
}

export async function upsertResumeParsedText(
  db: Db,
  input: {
    applicantId: ObjectId;
    resumeId?: ObjectId;
    text: string;
    parser?: ResumeParsedTextDocument['parser'];
    sourceFileName?: string;
    extractedSkills?: string[];
  }
) {
  const now = new Date();
  await resumeParsedTextsCollection(db).updateOne(
    { applicantId: input.applicantId },
    {
      $setOnInsert: {
        applicantId: input.applicantId,
        createdAt: now
      },
      $set: {
        ...(input.resumeId ? { resumeId: input.resumeId } : {}),
        text: input.text,
        parser: input.parser ?? 'unknown',
        ...(input.sourceFileName ? { sourceFileName: input.sourceFileName } : {}),
        extractedSkills: input.extractedSkills ?? [],
        updatedAt: now
      }
    },
    { upsert: true }
  );

  const parsedText = await findResumeParsedTextByApplicantId(db, input.applicantId);

  if (!parsedText) {
    throw new Error('Resume parsed text save failed');
  }

  return parsedText;
}

export function serializeResumeParsedText(parsedText: WithId<ResumeParsedTextDocument>) {
  return {
    applicantId: parsedText.applicantId.toString(),
    resumeId: parsedText.resumeId?.toString(),
    text: parsedText.text,
    parser: parsedText.parser,
    sourceFileName: parsedText.sourceFileName,
    extractedSkills: parsedText.extractedSkills,
    createdAt: parsedText.createdAt.toISOString(),
    updatedAt: parsedText.updatedAt.toISOString()
  };
}
