import type { Collection, Db, WithId } from 'mongodb';
import { collections } from '../db/collections.js';

export type AppUserRole = 'applicant' | 'recruiter';

export type AppUserRoleDocument = {
  supabaseUserId: string;
  email: string;
  role: AppUserRole;
  createdAt: Date;
  updatedAt: Date;
};

export function appUserRolesCollection(db: Db): Collection<AppUserRoleDocument> {
  return db.collection<AppUserRoleDocument>(collections.appUserRoles);
}

export async function ensureAppUserRoleIndexes(db: Db) {
  await appUserRolesCollection(db).createIndex({ supabaseUserId: 1 }, { unique: true });
}

export async function findAppUserRole(db: Db, supabaseUserId: string) {
  return appUserRolesCollection(db).findOne({ supabaseUserId });
}

export async function claimAppUserRole(db: Db, input: { supabaseUserId: string; email: string; role: AppUserRole }) {
  await ensureAppUserRoleIndexes(db);
  const existing = await findAppUserRole(db, input.supabaseUserId);

  if (existing && existing.role !== input.role) {
    throw new Error(`Account is already registered as ${existing.role}`);
  }

  const now = new Date();

  await appUserRolesCollection(db).updateOne(
    { supabaseUserId: input.supabaseUserId },
    {
      $setOnInsert: {
        supabaseUserId: input.supabaseUserId,
        role: input.role,
        createdAt: now
      },
      $set: {
        email: input.email,
        updatedAt: now
      }
    },
    { upsert: true }
  );

  const role = await findAppUserRole(db, input.supabaseUserId);

  if (!role) {
    throw new Error('Role claim failed');
  }

  return role;
}

export function serializeAppUserRole(role: WithId<AppUserRoleDocument>) {
  return {
    role: role.role,
    email: role.email,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString()
  };
}
