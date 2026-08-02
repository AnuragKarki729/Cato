import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';

export type InternshipDocument = {
  applicantId: ObjectId;
  company: string;
  durationMonths: number;
  roleDepartment: string;
  createdAt: Date;
  updatedAt: Date;
};

type SaveInternshipInput = {
  company: string;
  durationMonths: number;
  roleDepartment: string;
};

export function internshipsCollection(db: Db): Collection<InternshipDocument> {
  return db.collection<InternshipDocument>(collections.internships);
}

export async function findInternshipsByApplicantId(db: Db, applicantId: ObjectId) {
  return internshipsCollection(db).find({ applicantId }).sort({ createdAt: 1 }).toArray();
}

export async function replaceInternships(db: Db, applicantId: ObjectId, inputs: SaveInternshipInput[]) {
  const now = new Date();
  const collection = internshipsCollection(db);

  await collection.deleteMany({ applicantId });

  if (inputs.length > 0) {
    await collection.insertMany(
      inputs.map((input) => ({
        applicantId,
        company: input.company,
        durationMonths: input.durationMonths,
        roleDepartment: input.roleDepartment,
        createdAt: now,
        updatedAt: now
      }))
    );
  }

  return findInternshipsByApplicantId(db, applicantId);
}

export async function createInternship(db: Db, applicantId: ObjectId, input: SaveInternshipInput) {
  const now = new Date();
  const result = await internshipsCollection(db).insertOne({
    applicantId,
    company: input.company,
    durationMonths: input.durationMonths,
    roleDepartment: input.roleDepartment,
    createdAt: now,
    updatedAt: now
  });

  const internship = await internshipsCollection(db).findOne({ _id: result.insertedId });

  if (!internship) {
    throw new Error('Internship create failed');
  }

  return internship;
}

export async function updateInternship(
  db: Db,
  applicantId: ObjectId,
  internshipId: ObjectId,
  input: SaveInternshipInput
) {
  await internshipsCollection(db).updateOne(
    { _id: internshipId, applicantId },
    {
      $set: {
        ...input,
        updatedAt: new Date()
      }
    }
  );

  const internship = await internshipsCollection(db).findOne({ _id: internshipId, applicantId });

  if (!internship) {
    throw new Error('Internship not found');
  }

  return internship;
}

export async function deleteInternship(db: Db, applicantId: ObjectId, internshipId: ObjectId) {
  await internshipsCollection(db).deleteOne({ _id: internshipId, applicantId });
}

export function serializeInternship(internship: WithId<InternshipDocument>) {
  return {
    id: internship._id.toString(),
    company: internship.company,
    durationMonths: internship.durationMonths,
    roleDepartment: internship.roleDepartment,
    createdAt: internship.createdAt.toISOString(),
    updatedAt: internship.updatedAt.toISOString()
  };
}
