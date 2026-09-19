import type { Collection, Db, ObjectId, WithId } from 'mongodb';
import { collections } from '../db/collections.js';

export const APPLICANT_EVIDENCE_VIDEO_LIMIT = 10;
export const APPLICANT_REEL_VIDEO_LIMIT = 9;
export const APPLICANT_REEL_MAX_DURATION_SECONDS = 60;
export const APPLICANT_REEL_MAX_FILE_SIZE_BYTES = 80 * 1024 * 1024;

export type ApplicantVideoVisibility = 'public' | 'hidden';
export type ApplicantVideoTranscodeStatus = 'pending' | 'ready' | 'failed';
export type ApplicantVideoLinkTargetType = 'project' | 'internship' | 'accomplishment';
export type ApplicantAccomplishmentVisibility = 'public' | 'recruiter_only' | 'hidden';

export type ApplicantVideoDocument = {
  applicantId: ObjectId;
  caption?: string | null;
  storageProvider: 'cloudinary';
  cloudinaryPublicId: string;
  videoUrl: string;
  optimizedVideoUrl: string;
  thumbnailUrl: string;
  contentType: string;
  fileSizeBytes?: number;
  durationSeconds: number;
  maxResolution: '720p';
  orientation: 'portrait' | 'landscape' | 'square' | 'unknown';
  visibility: ApplicantVideoVisibility;
  transcodeStatus: ApplicantVideoTranscodeStatus;
  likeCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

export type ApplicantVideoLinkDocument = {
  videoId: ObjectId;
  applicantId: ObjectId;
  targetType: ApplicantVideoLinkTargetType;
  targetId: ObjectId;
  createdAt: Date;
};

export type ApplicantAccomplishmentDocument = {
  applicantId: ObjectId;
  title: string;
  description: string;
  categoryFieldIds: string[];
  skillIds: string[];
  linkUrl?: string;
  visibility: ApplicantAccomplishmentVisibility;
  createdAt: Date;
  updatedAt: Date;
};

export type ApplicantVideoLikeDocument = {
  videoId: ObjectId;
  applicantId: ObjectId;
  actorId: ObjectId;
  actorType: 'applicant' | 'recruiter';
  createdAt: Date;
};

export type ApplicantVideoViewDocument = {
  videoId: ObjectId;
  applicantId: ObjectId;
  actorId?: ObjectId;
  actorType?: 'applicant' | 'recruiter';
  sessionId?: string;
  viewedAt: Date;
};

export type SaveApplicantVideoInput = {
  caption?: string | null;
  cloudinaryPublicId: string;
  videoUrl: string;
  contentType: string;
  fileSizeBytes?: number;
  durationSeconds: number;
  orientation?: ApplicantVideoDocument['orientation'];
  links: Array<{
    targetType: ApplicantVideoLinkTargetType;
    targetId: ObjectId;
  }>;
};

export type SaveApplicantAccomplishmentInput = {
  title: string;
  description: string;
  categoryFieldIds?: string[];
  skillIds?: string[];
  linkUrl?: string;
  visibility?: ApplicantAccomplishmentVisibility;
};

export function applicantVideosCollection(db: Db): Collection<ApplicantVideoDocument> {
  return db.collection<ApplicantVideoDocument>(collections.applicantVideos);
}

export function applicantVideoLinksCollection(db: Db): Collection<ApplicantVideoLinkDocument> {
  return db.collection<ApplicantVideoLinkDocument>(collections.applicantVideoLinks);
}

export function applicantAccomplishmentsCollection(db: Db): Collection<ApplicantAccomplishmentDocument> {
  return db.collection<ApplicantAccomplishmentDocument>(collections.applicantAccomplishments);
}

export function applicantVideoLikesCollection(db: Db): Collection<ApplicantVideoLikeDocument> {
  return db.collection<ApplicantVideoLikeDocument>(collections.applicantVideoLikes);
}

export function applicantVideoViewsCollection(db: Db): Collection<ApplicantVideoViewDocument> {
  return db.collection<ApplicantVideoViewDocument>(collections.applicantVideoViews);
}

export async function ensureApplicantVideoIndexes(db: Db) {
  await Promise.all([
    applicantVideosCollection(db).createIndex({ applicantId: 1, createdAt: -1 }),
    applicantVideosCollection(db).createIndex({ applicantId: 1, deletedAt: 1 }),
    applicantVideosCollection(db).createIndex({ visibility: 1, transcodeStatus: 1, createdAt: -1 }),
    applicantVideosCollection(db).createIndex({ cloudinaryPublicId: 1 }, { unique: true }),
    applicantVideoLinksCollection(db).createIndex({ videoId: 1 }),
    applicantVideoLinksCollection(db).createIndex({ applicantId: 1, targetType: 1 }),
    applicantVideoLinksCollection(db).createIndex({ targetType: 1, targetId: 1 }),
    applicantVideoLinksCollection(db).createIndex({ videoId: 1, targetType: 1, targetId: 1 }, { unique: true }),
    applicantAccomplishmentsCollection(db).createIndex({ applicantId: 1, createdAt: -1 }),
    applicantAccomplishmentsCollection(db).createIndex({ applicantId: 1, _id: 1 }),
    applicantAccomplishmentsCollection(db).createIndex({ categoryFieldIds: 1 }),
    applicantAccomplishmentsCollection(db).createIndex({ skillIds: 1 }),
    applicantVideoLikesCollection(db).createIndex({ videoId: 1, actorType: 1, actorId: 1 }, { unique: true }),
    applicantVideoLikesCollection(db).createIndex({ videoId: 1 }),
    applicantVideoViewsCollection(db).createIndex({ videoId: 1, viewedAt: -1 }),
    applicantVideoViewsCollection(db).createIndex({ actorType: 1, actorId: 1, viewedAt: -1 })
  ]);
}

function getOptimizedVideoUrl(videoUrl: string) {
  return videoUrl.replace('/video/upload/', '/video/upload/q_auto:eco,vc_auto,w_720,c_limit/');
}

function getThumbnailUrl(videoUrl: string) {
  return videoUrl.replace('/video/upload/', '/video/upload/so_0,w_480,h_640,c_fill,q_auto:eco/').replace(/\.[^/.]+$/, '.jpg');
}

function normalizeList(values: string[] | undefined, max: number) {
  return Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean))).slice(0, max);
}

export async function countActiveApplicantReelVideos(db: Db, applicantId: ObjectId) {
  return applicantVideosCollection(db).countDocuments({
    applicantId,
    deletedAt: { $exists: false }
  });
}

export async function createApplicantVideo(db: Db, applicantId: ObjectId, input: SaveApplicantVideoInput) {
  const now = new Date();
  const normalizedCaption = input.caption?.trim();
  const result = await applicantVideosCollection(db).insertOne({
    applicantId,
    caption: normalizedCaption ? normalizedCaption : null,
    storageProvider: 'cloudinary',
    cloudinaryPublicId: input.cloudinaryPublicId,
    videoUrl: input.videoUrl,
    optimizedVideoUrl: getOptimizedVideoUrl(input.videoUrl),
    thumbnailUrl: getThumbnailUrl(input.videoUrl),
    contentType: input.contentType,
    ...(input.fileSizeBytes ? { fileSizeBytes: input.fileSizeBytes } : {}),
    durationSeconds: input.durationSeconds,
    maxResolution: '720p',
    orientation: input.orientation ?? 'unknown',
    visibility: 'public',
    transcodeStatus: 'ready',
    likeCount: 0,
    viewCount: 0,
    createdAt: now,
    updatedAt: now
  });

  await applicantVideoLinksCollection(db).insertMany(
    input.links.map((link) => ({
      videoId: result.insertedId,
      applicantId,
      targetType: link.targetType,
      targetId: link.targetId,
      createdAt: now
    }))
  );

  const video = await applicantVideosCollection(db).findOne({ _id: result.insertedId });

  if (!video) {
    throw new Error('Applicant video create failed');
  }

  return video;
}

export async function updateApplicantVideoCaption(
  db: Db,
  applicantId: ObjectId,
  videoId: ObjectId,
  caption: string | null | undefined
) {
  const normalizedCaption = caption?.trim();
  const now = new Date();
  await applicantVideosCollection(db).updateOne(
    { _id: videoId, applicantId, deletedAt: { $exists: false } },
    {
      $set: {
        caption: normalizedCaption ? normalizedCaption : null,
        updatedAt: now
      }
    }
  );

  return applicantVideosCollection(db).findOne({ _id: videoId, applicantId, deletedAt: { $exists: false } });
}

export async function findApplicantVideosByApplicantId(db: Db, applicantId: ObjectId, includeHidden = true) {
  return applicantVideosCollection(db)
    .find({
      applicantId,
      deletedAt: { $exists: false },
      ...(includeHidden ? {} : { visibility: 'public' })
    })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function findApplicantVideoById(db: Db, videoId: ObjectId) {
  return applicantVideosCollection(db).findOne({ _id: videoId, deletedAt: { $exists: false } });
}

export async function findApplicantVideoLinks(db: Db, videoIds: ObjectId[]) {
  if (videoIds.length === 0) {
    return [];
  }

  return applicantVideoLinksCollection(db).find({ videoId: { $in: videoIds } }).toArray();
}

export async function softDeleteApplicantVideo(db: Db, applicantId: ObjectId, videoId: ObjectId) {
  const now = new Date();
  await applicantVideosCollection(db).updateOne(
    { _id: videoId, applicantId, deletedAt: { $exists: false } },
    {
      $set: {
        visibility: 'hidden',
        deletedAt: now,
        updatedAt: now
      }
    }
  );
}

export async function createApplicantAccomplishment(db: Db, applicantId: ObjectId, input: SaveApplicantAccomplishmentInput) {
  const now = new Date();
  const result = await applicantAccomplishmentsCollection(db).insertOne({
    applicantId,
    title: input.title.trim(),
    description: input.description.trim(),
    categoryFieldIds: normalizeList(input.categoryFieldIds, 10),
    skillIds: normalizeList(input.skillIds, 100),
    ...(input.linkUrl ? { linkUrl: input.linkUrl } : {}),
    visibility: input.visibility ?? 'public',
    createdAt: now,
    updatedAt: now
  });

  const accomplishment = await applicantAccomplishmentsCollection(db).findOne({ _id: result.insertedId });

  if (!accomplishment) {
    throw new Error('Accomplishment create failed');
  }

  return accomplishment;
}

export async function updateApplicantAccomplishment(
  db: Db,
  applicantId: ObjectId,
  accomplishmentId: ObjectId,
  input: SaveApplicantAccomplishmentInput
) {
  await applicantAccomplishmentsCollection(db).updateOne(
    { _id: accomplishmentId, applicantId },
    {
      $set: {
        title: input.title.trim(),
        description: input.description.trim(),
        categoryFieldIds: normalizeList(input.categoryFieldIds, 10),
        skillIds: normalizeList(input.skillIds, 100),
        visibility: input.visibility ?? 'public',
        updatedAt: new Date()
      },
      $unset: input.linkUrl ? {} : { linkUrl: '' }
    }
  );

  if (input.linkUrl) {
    await applicantAccomplishmentsCollection(db).updateOne(
      { _id: accomplishmentId, applicantId },
      { $set: { linkUrl: input.linkUrl, updatedAt: new Date() } }
    );
  }

  return applicantAccomplishmentsCollection(db).findOne({ _id: accomplishmentId, applicantId });
}

export async function deleteApplicantAccomplishment(db: Db, applicantId: ObjectId, accomplishmentId: ObjectId) {
  await applicantAccomplishmentsCollection(db).deleteOne({ _id: accomplishmentId, applicantId });
}

export async function findApplicantAccomplishmentsByApplicantId(db: Db, applicantId: ObjectId, includeHidden = true) {
  return applicantAccomplishmentsCollection(db)
    .find({
      applicantId,
      ...(includeHidden ? {} : { visibility: { $ne: 'hidden' } })
    })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function addApplicantVideoView(
  db: Db,
  video: WithId<ApplicantVideoDocument>,
  input: {
    actorId?: ObjectId;
    actorType?: 'applicant' | 'recruiter';
    sessionId?: string;
  }
) {
  const now = new Date();
  await applicantVideoViewsCollection(db).insertOne({
    videoId: video._id,
    applicantId: video.applicantId,
    ...(input.actorId ? { actorId: input.actorId } : {}),
    ...(input.actorType ? { actorType: input.actorType } : {}),
    ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    viewedAt: now
  });
  await applicantVideosCollection(db).updateOne({ _id: video._id }, { $inc: { viewCount: 1 }, $set: { updatedAt: now } });
}

export async function setApplicantVideoLike(
  db: Db,
  video: WithId<ApplicantVideoDocument>,
  input: {
    actorId: ObjectId;
    actorType: 'applicant' | 'recruiter';
    liked: boolean;
  }
) {
  const filter = {
    videoId: video._id,
    actorType: input.actorType,
    actorId: input.actorId
  };
  const existing = await applicantVideoLikesCollection(db).findOne(filter);

  if (input.liked && !existing) {
    await applicantVideoLikesCollection(db).insertOne({
      ...filter,
      applicantId: video.applicantId,
      createdAt: new Date()
    });
    await applicantVideosCollection(db).updateOne({ _id: video._id }, { $inc: { likeCount: 1 }, $set: { updatedAt: new Date() } });
  }

  if (!input.liked && existing) {
    await applicantVideoLikesCollection(db).deleteOne(filter);
    await applicantVideosCollection(db).updateOne({ _id: video._id }, { $inc: { likeCount: -1 }, $set: { updatedAt: new Date() } });
  }
}

export async function findPublicVideoFeed(db: Db, limit = 20, offset = 0) {
  return applicantVideosCollection(db)
    .find({
      visibility: 'public',
      transcodeStatus: 'ready',
      deletedAt: { $exists: false }
    })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .toArray();
}

export function serializeApplicantAccomplishment(accomplishment: WithId<ApplicantAccomplishmentDocument>) {
  return {
    id: accomplishment._id.toString(),
    title: accomplishment.title,
    description: accomplishment.description,
    categoryFieldIds: accomplishment.categoryFieldIds,
    skillIds: accomplishment.skillIds,
    linkUrl: accomplishment.linkUrl,
    visibility: accomplishment.visibility,
    createdAt: accomplishment.createdAt.toISOString(),
    updatedAt: accomplishment.updatedAt.toISOString()
  };
}

export function serializeApplicantVideo(
  video: WithId<ApplicantVideoDocument>,
  links: Array<WithId<ApplicantVideoLinkDocument>> = []
) {
  return {
    id: video._id.toString(),
    applicantId: video.applicantId.toString(),
    caption: video.caption ?? null,
    videoUrl: video.videoUrl,
    optimizedVideoUrl: video.optimizedVideoUrl,
    thumbnailUrl: video.thumbnailUrl,
    contentType: video.contentType,
    fileSizeBytes: video.fileSizeBytes,
    durationSeconds: video.durationSeconds,
    maxResolution: video.maxResolution,
    orientation: video.orientation,
    visibility: video.visibility,
    transcodeStatus: video.transcodeStatus,
    likeCount: Math.max(0, video.likeCount),
    viewCount: Math.max(0, video.viewCount),
    links: links
      .filter((link) => link.videoId.equals(video._id))
      .map((link) => ({
        targetType: link.targetType,
        targetId: link.targetId.toString()
      })),
    createdAt: video.createdAt.toISOString(),
    updatedAt: video.updatedAt.toISOString()
  };
}
