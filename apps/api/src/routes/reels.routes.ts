import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ObjectId, type Db } from 'mongodb';
import { z } from 'zod';
import { requireSupabaseUser } from '../auth/supabaseJwt.js';
import { getDatabase } from '../db/mongo.js';
import { findApplicantBySupabaseUserId, applicantsCollection } from '../repositories/applicants.repo.js';
import {
  APPLICANT_REEL_MAX_DURATION_SECONDS,
  APPLICANT_REEL_MAX_FILE_SIZE_BYTES,
  APPLICANT_REEL_VIDEO_LIMIT,
  applicantAccomplishmentsCollection,
  applicantVideoLinksCollection,
  countActiveApplicantReelVideos,
  createApplicantAccomplishment,
  createApplicantVideo,
  deleteApplicantAccomplishment,
  findApplicantAccomplishmentsByApplicantId,
  findApplicantVideoById,
  findApplicantVideoLinks,
  findApplicantVideosByApplicantId,
  findPublicVideoFeed,
  serializeApplicantAccomplishment,
  serializeApplicantVideo,
  setApplicantVideoLike,
  softDeleteApplicantVideo,
  updateApplicantVideoCaption,
  updateApplicantAccomplishment,
  addApplicantVideoView
} from '../repositories/applicantVideos.repo.js';
import { internshipsCollection } from '../repositories/internships.repo.js';
import { applicantProjectsCollection } from '../repositories/projects.repo.js';
import { findRecruiterBySupabaseUserId } from '../repositories/recruiters.repo.js';
import { applicantSignalsCollection } from '../repositories/signals.repo.js';
import {
  assertCloudinaryVideoBelongsToUser,
  createSignedApplicantReelVideoUpload,
  deleteCloudinaryAsset
} from '../services/cloudinary.service.js';

const evidenceLinkSchema = z.object({
  targetType: z.enum(['project', 'internship', 'accomplishment']),
  targetId: z.string().min(1)
});

const reelUploadCompleteSchema = z.object({
  caption: z.string().trim().max(2200).nullable().optional(),
  cloudinaryPublicId: z.string().min(1),
  secureUrl: z.string().url(),
  contentType: z.string().min(1),
  fileSizeBytes: z.number().int().positive().optional(),
  durationSeconds: z.number().positive().max(APPLICANT_REEL_MAX_DURATION_SECONDS),
  orientation: z.enum(['portrait', 'landscape', 'square', 'unknown']).optional(),
  links: z.array(evidenceLinkSchema).min(1).max(10)
});

const reelCaptionUpdateSchema = z.object({
  caption: z.string().trim().max(2200).nullable().optional()
});

const accomplishmentSchema = z.object({
  title: z.string().trim().min(1).max(140),
  description: z.string().trim().min(1).max(1000),
  categoryFieldIds: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
  skillIds: z.array(z.string().trim().min(1).max(80)).max(100).optional(),
  linkUrl: z.string().trim().url().max(500).optional().or(z.literal('').transform(() => undefined)),
  visibility: z.enum(['public', 'recruiter_only', 'hidden']).optional()
});

const idParamsSchema = z.object({
  id: z.string().min(1)
});

const feedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

const viewSchema = z.object({
  sessionId: z.string().trim().min(1).max(120).optional()
});

async function getApplicantOrReply(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;

  if (!user) {
    throw new Error('Authenticated user missing after auth guard');
  }

  const db = await getDatabase();
  const applicant = await findApplicantBySupabaseUserId(db, user.id);

  if (!applicant) {
    reply.code(404).send({ error: 'Applicant not found' });
    return null;
  }

  return { db, applicant, user };
}

async function getActorContext(request: FastifyRequest) {
  const user = request.user;

  if (!user) {
    throw new Error('Authenticated user missing after auth guard');
  }

  const db = await getDatabase();
  const [applicant, recruiter] = await Promise.all([
    findApplicantBySupabaseUserId(db, user.id),
    findRecruiterBySupabaseUserId(db, user.id)
  ]);

  if (applicant) {
    return { db, actorId: applicant._id, actorType: 'applicant' as const };
  }

  if (recruiter) {
    return { db, actorId: recruiter._id, actorType: 'recruiter' as const };
  }

  return { db, actorId: undefined, actorType: undefined };
}

async function signalFeedVideos(db: Db) {
  const signals = await applicantSignalsCollection(db)
    .find({
      $or: [
        { 'tenSecondVideo.secureUrl': { $exists: true, $ne: '' } },
        { 'thirtySecondVideo.secureUrl': { $exists: true, $ne: '' } }
      ]
    })
    .toArray();

  return signals.flatMap((signal) => {
    const rows = [];
    if (signal.tenSecondVideo?.secureUrl) {
      rows.push({
        id: `intro-${signal.applicantId.toString()}`,
        applicantId: signal.applicantId.toString(),
        caption: signal.promptTextSnapshot ?? 'Introductory reel',
        videoUrl: signal.tenSecondVideo.secureUrl,
        optimizedVideoUrl: signal.tenSecondVideo.secureUrl,
        thumbnailUrl: signal.tenSecondVideo.thumbnailUrl,
        contentType: signal.tenSecondVideo.contentType,
        fileSizeBytes: signal.tenSecondVideo.fileSizeBytes,
        durationSeconds: signal.tenSecondVideo.durationSeconds,
        maxResolution: signal.tenSecondVideo.maxResolution,
        orientation: signal.tenSecondVideo.orientation,
        visibility: 'public',
        transcodeStatus: 'ready',
        sourceType: 'intro_video',
        likeCount: 0,
        viewCount: 0,
        links: [],
        createdAt: signal.tenSecondVideo.uploadedAt.toISOString(),
        updatedAt: signal.updatedAt.toISOString()
      });
    }
    if (signal.thirtySecondVideo?.secureUrl) {
      rows.push({
        id: `deeper-${signal.applicantId.toString()}`,
        applicantId: signal.applicantId.toString(),
        caption: signal.promptTextSnapshot ?? 'Deeper signal',
        videoUrl: signal.thirtySecondVideo.secureUrl,
        optimizedVideoUrl: signal.thirtySecondVideo.secureUrl,
        thumbnailUrl: signal.thirtySecondVideo.thumbnailUrl,
        contentType: signal.thirtySecondVideo.contentType,
        fileSizeBytes: signal.thirtySecondVideo.fileSizeBytes,
        durationSeconds: signal.thirtySecondVideo.durationSeconds,
        maxResolution: signal.thirtySecondVideo.maxResolution,
        orientation: signal.thirtySecondVideo.orientation,
        visibility: 'public',
        transcodeStatus: 'ready',
        sourceType: 'deeper_signal',
        likeCount: 0,
        viewCount: 0,
        links: [],
        createdAt: signal.thirtySecondVideo.uploadedAt.toISOString(),
        updatedAt: signal.updatedAt.toISOString()
      });
    }
    return rows;
  });
}

async function getRecruiterOrReply(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;

  if (!user) {
    throw new Error('Authenticated user missing after auth guard');
  }

  const db = await getDatabase();
  const recruiter = await findRecruiterBySupabaseUserId(db, user.id);

  if (!recruiter) {
    reply.code(404).send({ error: 'Recruiter account not found' });
    return null;
  }

  return { db, recruiter, user };
}

function assertApplicantCanUseVideo(context: NonNullable<Awaited<ReturnType<typeof getApplicantOrReply>>>, reply: FastifyReply) {
  if (!context.applicant.videoConsentAcceptedAt || !context.applicant.privacyPolicyAcknowledgedAt) {
    reply.code(403).send({ error: 'Video upload requires video consent and privacy acknowledgement' });
    return false;
  }

  return true;
}

function parseObjectId(id: string) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

function dedupeLinks(links: Array<{ targetType: 'project' | 'internship' | 'accomplishment'; targetId: string }>) {
  const seen = new Set<string>();
  return links.flatMap((link) => {
    const targetId = parseObjectId(link.targetId);

    if (!targetId) {
      return [];
    }

    const key = `${link.targetType}:${targetId.toString()}`;

    if (seen.has(key)) {
      return [];
    }

    seen.add(key);
    return [{ targetType: link.targetType, targetId }];
  });
}

async function assertEvidenceLinksBelongToApplicant(
  db: Awaited<ReturnType<typeof getDatabase>>,
  applicantId: ObjectId,
  links: Array<{ targetType: 'project' | 'internship' | 'accomplishment'; targetId: ObjectId }>
) {
  const [projectIds, internshipIds, accomplishmentIds] = [
    links.filter((link) => link.targetType === 'project').map((link) => link.targetId),
    links.filter((link) => link.targetType === 'internship').map((link) => link.targetId),
    links.filter((link) => link.targetType === 'accomplishment').map((link) => link.targetId)
  ];

  const [projectCount, internshipCount, accomplishmentCount] = await Promise.all([
    projectIds.length === 0 ? 0 : applicantProjectsCollection(db).countDocuments({ applicantId, _id: { $in: projectIds } }),
    internshipIds.length === 0 ? 0 : internshipsCollection(db).countDocuments({ applicantId, _id: { $in: internshipIds } }),
    accomplishmentIds.length === 0
      ? 0
      : applicantAccomplishmentsCollection(db).countDocuments({ applicantId, _id: { $in: accomplishmentIds }, visibility: { $ne: 'hidden' } })
  ]);

  return projectCount === projectIds.length && internshipCount === internshipIds.length && accomplishmentCount === accomplishmentIds.length;
}

async function serializeVideosWithLinks(db: Awaited<ReturnType<typeof getDatabase>>, videos: Awaited<ReturnType<typeof findApplicantVideosByApplicantId>>) {
  const links = await findApplicantVideoLinks(
    db,
    videos.map((video) => video._id)
  );

  return videos.map((video) => serializeApplicantVideo(video, links));
}

export async function reelsRoutes(app: FastifyInstance) {
  app.post('/applicant/reels/upload-url', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    if (!assertApplicantCanUseVideo(context, reply)) {
      return;
    }

    const activeReelCount = await countActiveApplicantReelVideos(context.db, context.applicant._id);

    if (activeReelCount >= APPLICANT_REEL_VIDEO_LIMIT) {
      return reply.code(409).send({ error: `Reel video limit reached. You can have up to ${APPLICANT_REEL_VIDEO_LIMIT} reel videos.` });
    }

    return createSignedApplicantReelVideoUpload({ supabaseUserId: context.user.id });
  });

  app.post('/applicant/reels/complete', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = reelUploadCompleteSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid reel completion payload', issues: parsed.error.issues });
    }

    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    if (!assertApplicantCanUseVideo(context, reply)) {
      return;
    }

    if (!parsed.data.contentType.toLowerCase().startsWith('video/')) {
      return reply.code(400).send({ error: 'Reel upload must be a video file' });
    }

    if ((parsed.data.fileSizeBytes ?? 0) > APPLICANT_REEL_MAX_FILE_SIZE_BYTES) {
      return reply.code(400).send({ error: 'Reel video file is too large. Compress the video and try again.' });
    }

    try {
      assertCloudinaryVideoBelongsToUser(parsed.data.cloudinaryPublicId, context.user.id);
    } catch {
      return reply.code(400).send({ error: 'Invalid video public id' });
    }

    if (!parsed.data.cloudinaryPublicId.startsWith(`${context.user.id}/video/reels/`)) {
      return reply.code(400).send({ error: 'Reel video must use the reel upload URL' });
    }

    const activeReelCount = await countActiveApplicantReelVideos(context.db, context.applicant._id);

    if (activeReelCount >= APPLICANT_REEL_VIDEO_LIMIT) {
      await deleteCloudinaryAsset(parsed.data.cloudinaryPublicId, 'video');
      return reply.code(409).send({ error: `Reel video limit reached. You can have up to ${APPLICANT_REEL_VIDEO_LIMIT} reel videos.` });
    }

    const links = dedupeLinks(parsed.data.links);

    if (links.length === 0) {
      return reply.code(400).send({ error: 'A reel must be linked to at least one project, internship, or accomplishment' });
    }

    const linksAreValid = await assertEvidenceLinksBelongToApplicant(context.db, context.applicant._id, links);

    if (!linksAreValid) {
      return reply.code(400).send({ error: 'Every reel link must belong to this applicant' });
    }

    const video = await createApplicantVideo(context.db, context.applicant._id, {
      caption: parsed.data.caption,
      cloudinaryPublicId: parsed.data.cloudinaryPublicId,
      videoUrl: parsed.data.secureUrl,
      contentType: parsed.data.contentType,
      fileSizeBytes: parsed.data.fileSizeBytes,
      durationSeconds: parsed.data.durationSeconds,
      orientation: parsed.data.orientation,
      links
    });

    const [serialized] = await serializeVideosWithLinks(context.db, [video]);

    return { video: serialized };
  });

  app.patch('/applicant/reels/:id', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);
    const parsed = reelCaptionUpdateSchema.safeParse(request.body);

    if (!params.success || !ObjectId.isValid(params.data.id) || !parsed.success) {
      return reply.code(400).send({ error: 'Invalid reel update payload' });
    }

    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    const video = await updateApplicantVideoCaption(
      context.db,
      context.applicant._id,
      new ObjectId(params.data.id),
      parsed.data.caption
    );

    if (!video) {
      return reply.code(404).send({ error: 'Reel not found' });
    }

    const [serialized] = await serializeVideosWithLinks(context.db, [video]);

    return { video: serialized };
  });

  app.get('/applicant/reels', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    const videos = await findApplicantVideosByApplicantId(context.db, context.applicant._id);

    return {
      limit: APPLICANT_REEL_VIDEO_LIMIT,
      used: videos.length,
      videos: await serializeVideosWithLinks(context.db, videos)
    };
  });

  app.delete('/applicant/reels/:id', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);

    if (!params.success || !ObjectId.isValid(params.data.id)) {
      return reply.code(400).send({ error: 'Invalid reel id' });
    }

    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    const video = await findApplicantVideoById(context.db, new ObjectId(params.data.id));

    if (!video || !video.applicantId.equals(context.applicant._id)) {
      return reply.code(404).send({ error: 'Reel not found' });
    }

    await softDeleteApplicantVideo(context.db, context.applicant._id, video._id);
    await deleteCloudinaryAsset(video.cloudinaryPublicId, 'video');

    return { ok: true };
  });

  app.get('/applicant/accomplishments', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    const accomplishments = await findApplicantAccomplishmentsByApplicantId(context.db, context.applicant._id);

    return {
      accomplishments: accomplishments.map(serializeApplicantAccomplishment)
    };
  });

  app.post('/applicant/accomplishments', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = accomplishmentSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid accomplishment payload', issues: parsed.error.issues });
    }

    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    const accomplishment = await createApplicantAccomplishment(context.db, context.applicant._id, parsed.data);

    return { accomplishment: serializeApplicantAccomplishment(accomplishment) };
  });

  app.put('/applicant/accomplishments/:id', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);
    const parsed = accomplishmentSchema.safeParse(request.body);

    if (!params.success || !parsed.success || !ObjectId.isValid(params.data.id)) {
      return reply.code(400).send({ error: 'Invalid accomplishment update payload' });
    }

    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    const accomplishment = await updateApplicantAccomplishment(context.db, context.applicant._id, new ObjectId(params.data.id), parsed.data);

    if (!accomplishment) {
      return reply.code(404).send({ error: 'Accomplishment not found' });
    }

    return { accomplishment: serializeApplicantAccomplishment(accomplishment) };
  });

  app.delete('/applicant/accomplishments/:id', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);

    if (!params.success || !ObjectId.isValid(params.data.id)) {
      return reply.code(400).send({ error: 'Invalid accomplishment id' });
    }

    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    const accomplishmentId = new ObjectId(params.data.id);
    const linkedVideoCount = await applicantVideoLinksCollection(context.db).countDocuments({
      applicantId: context.applicant._id,
      targetType: 'accomplishment',
      targetId: accomplishmentId
    });

    if (linkedVideoCount > 0) {
      return reply.code(409).send({ error: 'Remove or relink videos before deleting this accomplishment' });
    }

    await deleteApplicantAccomplishment(context.db, context.applicant._id, accomplishmentId);

    return { ok: true };
  });

  app.get('/videos/feed', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = feedQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid feed query' });
    }

    const db = await getDatabase();
    const videos = await findPublicVideoFeed(db, parsed.data.limit ?? 20, parsed.data.offset ?? 0);
    const signalVideos = await signalFeedVideos(db);
    const links = await findApplicantVideoLinks(db, videos.map((video) => video._id));
    const applicants = await applicantsCollection(db)
      .find({ _id: { $in: [...videos.map((video) => video.applicantId), ...signalVideos.map((video) => new ObjectId(video.applicantId))] } })
      .toArray();
    const applicantsById = new Map(applicants.map((applicant) => [applicant._id.toString(), applicant]));

    return {
      videos: [
        ...signalVideos,
        ...videos.map((video) => serializeApplicantVideo(video, links))
      ]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, parsed.data.limit ?? 20)
        .map((video) => ({
          ...video,
          applicantName: applicantsById.get(video.applicantId)?.name
        }))
    };
  });

  app.get('/recruiter/videos/feed', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getRecruiterOrReply(request, reply);

    if (!context) {
      return;
    }

    const parsed = feedQuerySchema.safeParse(request.query);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid feed query' });
    }

    const videos = await findPublicVideoFeed(context.db, parsed.data.limit ?? 20, parsed.data.offset ?? 0);
    const signalVideos = await signalFeedVideos(context.db);
    const links = await findApplicantVideoLinks(context.db, videos.map((video) => video._id));
    const applicants = await applicantsCollection(context.db)
      .find({ _id: { $in: [...videos.map((video) => video.applicantId), ...signalVideos.map((video) => new ObjectId(video.applicantId))] } })
      .toArray();
    const applicantsById = new Map(applicants.map((applicant) => [applicant._id.toString(), applicant]));

    return {
      videos: [
        ...signalVideos,
        ...videos.map((video) => serializeApplicantVideo(video, links))
      ]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, parsed.data.limit ?? 20)
        .map((video) => ({
          ...video,
          applicantName: applicantsById.get(video.applicantId)?.name
        }))
    };
  });

  app.post('/videos/:id/view', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);
    const parsed = viewSchema.safeParse(request.body ?? {});

    if (!params.success || !ObjectId.isValid(params.data.id) || !parsed.success) {
      return reply.code(400).send({ error: 'Invalid video view payload' });
    }

    const context = await getActorContext(request);
    const video = await findApplicantVideoById(context.db, new ObjectId(params.data.id));

    if (!video || video.visibility !== 'public') {
      return reply.code(404).send({ error: 'Video not found' });
    }

    await addApplicantVideoView(context.db, video, {
      actorId: context.actorId,
      actorType: context.actorType,
      sessionId: parsed.data.sessionId
    });

    return { ok: true };
  });

  app.post('/videos/:id/like', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);

    if (!params.success || !ObjectId.isValid(params.data.id)) {
      return reply.code(400).send({ error: 'Invalid video id' });
    }

    const context = await getActorContext(request);

    if (!context.actorId || !context.actorType) {
      return reply.code(404).send({ error: 'Actor not found' });
    }

    const video = await findApplicantVideoById(context.db, new ObjectId(params.data.id));

    if (!video || video.visibility !== 'public') {
      return reply.code(404).send({ error: 'Video not found' });
    }

    await setApplicantVideoLike(context.db, video, {
      actorId: context.actorId,
      actorType: context.actorType,
      liked: true
    });

    return { ok: true };
  });

  app.delete('/videos/:id/like', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);

    if (!params.success || !ObjectId.isValid(params.data.id)) {
      return reply.code(400).send({ error: 'Invalid video id' });
    }

    const context = await getActorContext(request);

    if (!context.actorId || !context.actorType) {
      return reply.code(404).send({ error: 'Actor not found' });
    }

    const video = await findApplicantVideoById(context.db, new ObjectId(params.data.id));

    if (!video || video.visibility !== 'public') {
      return reply.code(404).send({ error: 'Video not found' });
    }

    await setApplicantVideoLike(context.db, video, {
      actorId: context.actorId,
      actorType: context.actorType,
      liked: false
    });

    return { ok: true };
  });
}
