import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';

export type ApplicantProjectType = 'built_project' | 'research' | 'thesis' | 'video' | 'writing' | 'other';

export type ApplicantProjectDocument = {
  applicantId: ObjectId;
  title: string;
  type: ApplicantProjectType;
  description: string;
  linkUrl?: string;
  createdAt: Date;
  updatedAt: Date;
};

type SaveApplicantProjectInput = {
  description: string;
  linkUrl?: string;
  title: string;
  type: ApplicantProjectType;
};

export function applicantProjectsCollection(db: Db): Collection<ApplicantProjectDocument> {
  return db.collection<ApplicantProjectDocument>(collections.applicantProjects);
}

export async function ensureApplicantProjectIndexes(db: Db) {
  await Promise.all([
    applicantProjectsCollection(db).createIndex({ applicantId: 1, createdAt: 1 }),
    applicantProjectsCollection(db).createIndex({ applicantId: 1, _id: 1 }),
    applicantProjectsCollection(db).createIndex({ type: 1 }),
    applicantProjectsCollection(db).createIndex({ updatedAt: -1 })
  ]);
}

export async function findProjectsByApplicantId(db: Db, applicantId: ObjectId) {
  return applicantProjectsCollection(db).find({ applicantId }).sort({ createdAt: 1 }).toArray();
}

export async function createApplicantProject(db: Db, applicantId: ObjectId, input: SaveApplicantProjectInput) {
  const now = new Date();
  const result = await applicantProjectsCollection(db).insertOne({
    applicantId,
    title: input.title,
    type: input.type,
    description: input.description,
    ...(input.linkUrl ? { linkUrl: input.linkUrl } : {}),
    createdAt: now,
    updatedAt: now
  });

  const project = await applicantProjectsCollection(db).findOne({ _id: result.insertedId });

  if (!project) {
    throw new Error('Project create failed');
  }

  return project;
}

export async function updateApplicantProject(
  db: Db,
  applicantId: ObjectId,
  projectId: ObjectId,
  input: SaveApplicantProjectInput
) {
  await applicantProjectsCollection(db).updateOne(
    { _id: projectId, applicantId },
    {
      $set: {
        title: input.title,
        type: input.type,
        description: input.description,
        updatedAt: new Date()
      },
      $unset: input.linkUrl ? {} : { linkUrl: '' }
    }
  );

  if (input.linkUrl) {
    await applicantProjectsCollection(db).updateOne(
      { _id: projectId, applicantId },
      {
        $set: {
          linkUrl: input.linkUrl,
          updatedAt: new Date()
        }
      }
    );
  }

  const project = await applicantProjectsCollection(db).findOne({ _id: projectId, applicantId });

  if (!project) {
    throw new Error('Project not found');
  }

  return project;
}

export async function deleteApplicantProject(db: Db, applicantId: ObjectId, projectId: ObjectId) {
  await applicantProjectsCollection(db).deleteOne({ _id: projectId, applicantId });
}

export function serializeApplicantProject(project: WithId<ApplicantProjectDocument>) {
  return {
    id: project._id.toString(),
    title: project.title,
    type: project.type,
    description: project.description,
    linkUrl: project.linkUrl,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString()
  };
}
