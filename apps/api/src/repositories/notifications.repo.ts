import type { Collection, Db, WithId } from 'mongodb';
import { collections } from '../db/collections.js';

export type AppNotificationRole = 'applicant' | 'recruiter';
export type AppNotificationBucket = 'requests';

export type AppNotificationDocument = {
  recipientSupabaseUserId: string;
  role: AppNotificationRole;
  bucket: AppNotificationBucket;
  eventName: string;
  payload: Record<string, unknown>;
  readAt?: Date;
  createdAt: Date;
};

export function appNotificationsCollection(db: Db): Collection<AppNotificationDocument> {
  return db.collection<AppNotificationDocument>(collections.appNotifications);
}

export async function ensureNotificationIndexes(db: Db) {
  await Promise.all([
    appNotificationsCollection(db).createIndex({
      recipientSupabaseUserId: 1,
      role: 1,
      bucket: 1,
      readAt: 1,
      createdAt: -1
    }),
    appNotificationsCollection(db).createIndex({ createdAt: -1 })
  ]);
}

export async function createAppNotification(
  db: Db,
  input: {
    bucket: AppNotificationBucket;
    eventName: string;
    payload: Record<string, unknown>;
    recipientSupabaseUserId: string;
    role: AppNotificationRole;
  }
) {
  const notification: AppNotificationDocument = {
    ...input,
    createdAt: new Date()
  };

  const result = await appNotificationsCollection(db).insertOne(notification);
  return { ...notification, _id: result.insertedId };
}

export async function countUnreadNotifications(
  db: Db,
  input: {
    bucket?: AppNotificationBucket;
    recipientSupabaseUserId: string;
    role: AppNotificationRole;
  }
) {
  return appNotificationsCollection(db).countDocuments({
    recipientSupabaseUserId: input.recipientSupabaseUserId,
    role: input.role,
    ...(input.bucket ? { bucket: input.bucket } : {}),
    readAt: { $exists: false }
  });
}

export async function markNotificationsRead(
  db: Db,
  input: {
    bucket: AppNotificationBucket;
    recipientSupabaseUserId: string;
    role: AppNotificationRole;
  }
) {
  await appNotificationsCollection(db).updateMany(
    {
      recipientSupabaseUserId: input.recipientSupabaseUserId,
      role: input.role,
      bucket: input.bucket,
      readAt: { $exists: false }
    },
    {
      $set: {
        readAt: new Date()
      }
    }
  );
}

export function serializeAppNotification(notification: WithId<AppNotificationDocument>) {
  return {
    id: notification._id.toString(),
    recipientSupabaseUserId: notification.recipientSupabaseUserId,
    role: notification.role,
    bucket: notification.bucket,
    eventName: notification.eventName,
    payload: notification.payload,
    readAt: notification.readAt?.toISOString(),
    createdAt: notification.createdAt.toISOString()
  };
}
