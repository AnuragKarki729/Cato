import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { requireSupabaseUser } from '../auth/supabaseJwt.js';
import { getDatabase } from '../db/mongo.js';
import { findApplicantBySupabaseUserId, updateApplicantOnboardingStatus } from '../repositories/applicants.repo.js';
import {
  deleteSignalVideo,
  findSignalByApplicantId,
  saveSignalVideo,
  saveTenSecondElaboration,
  selectSignalPrompt,
  serializeSignal,
  skipThirtySecondVideo
} from '../repositories/signals.repo.js';
import {
  assertCloudinaryVideoBelongsToUser,
  createSignedVideoUpload,
  deleteCloudinaryAsset
} from '../services/cloudinary.service.js';
import { isAtLeastOnboardingStatus } from '../services/onboarding.service.js';
import { findSignalPromptById } from '../services/prompts.service.js';
import { recalculateSoftSkillsFromSignal } from '../services/softSkillsScoring.service.js';

const selectPromptSchema = z.object({
  promptId: z.string().min(1)
});

const uploadVideoSchema = z.object({
  cloudinaryPublicId: z.string().min(1),
  secureUrl: z.string().url(),
  contentType: z.string().min(1),
  fileSizeBytes: z.number().int().positive().nullish(),
  durationSeconds: z.number().positive()
});

const prepareVideoUploadSchema = z.object({
  contentType: z.string().min(1),
  fileSizeBytes: z.number().int().positive().nullish()
});

const tenSecondElaborationSchema = z.object({
  elaboration: z.string().trim().max(500).optional(),
  skipped: z.boolean().optional()
});

const videoTypeParamsSchema = z.object({
  type: z.enum(['10-second', '30-second'])
});

function toInternalVideoType(type: '10-second' | '30-second') {
  return type === '10-second' ? '10_sec' : '30_sec';
}

function toSignalVideoKey(type: '10-second' | '30-second') {
  return type === '10-second' ? 'tenSecondVideo' : 'thirtySecondVideo';
}

function maxDurationForVideoType(type: '10-second' | '30-second') {
  return type === '10-second' ? 10 : 30;
}

function getVideoThumbnailUrl(secureUrl: string) {
  return secureUrl.replace('/video/upload/', '/video/upload/so_0,w_480,h_480,c_fill/').replace(/\.[^/.]+$/, '.jpg');
}

async function assertCanUploadVideo(
  context: NonNullable<Awaited<ReturnType<typeof getApplicantOrReply>>>,
  reply: FastifyReply,
  type: '10-second' | '30-second'
) {
  if (type === '10-second' && !isAtLeastOnboardingStatus(context.applicant.onboardingStatus, 'signal_prompt_selected')) {
    reply.code(409).send({ error: 'Select a signal prompt before uploading the 10-second video' });
    return false;
  }

  if (type === '30-second' && !isAtLeastOnboardingStatus(context.applicant.onboardingStatus, 'deeper_signal_seen')) {
    reply.code(409).send({ error: 'View deeper signal before uploading the 30-second video' });
    return false;
  }

  if (!context.applicant.videoConsentAcceptedAt || !context.applicant.privacyPolicyAcknowledgedAt) {
    reply.code(403).send({ error: 'Video upload requires video consent and privacy acknowledgement' });
    return false;
  }

  return true;
}

async function deleteStoredVideoAsset(asset?: {
  cloudinaryPublicId?: string;
}) {
  if (asset?.cloudinaryPublicId) {
    await deleteCloudinaryAsset(asset.cloudinaryPublicId, 'video');
  }
}

async function getApplicantOrReply(
  request: FastifyRequest,
  reply: FastifyReply
) {
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

export async function signalsRoutes(app: FastifyInstance) {
  app.get('/signal', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    const signal = await findSignalByApplicantId(context.db, context.applicant._id);

    if (!signal) {
      return {
        signal: {
          thirtySecondVideoSkipped: false,
          updatedAt: new Date().toISOString()
        }
      };
    }

    return {
      signal: serializeSignal(signal)
    };
  });

  app.get('/videos', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    const signal = await findSignalByApplicantId(context.db, context.applicant._id);

    return {
      videos: {
        tenSecondVideo: signal?.tenSecondVideo,
        thirtySecondVideo: signal?.thirtySecondVideo,
        thirtySecondVideoSkipped: signal?.thirtySecondVideoSkipped ?? false
      }
    };
  });

  app.post('/onboarding/signal-prompt', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = selectPromptSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid signal prompt payload', issues: parsed.error.issues });
    }

    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    if (!isAtLeastOnboardingStatus(context.applicant.onboardingStatus, 'resume_complete')) {
      return reply.code(409).send({ error: 'Complete resume before selecting a signal prompt' });
    }

    const prompt = findSignalPromptById(parsed.data.promptId);

    if (!prompt) {
      return reply.code(400).send({ error: 'Signal prompt is not active' });
    }

    const signal = await selectSignalPrompt(
      context.db,
      context.applicant._id,
      prompt.id,
      prompt.text
    );

    await updateApplicantOnboardingStatus(context.db, context.user.id, 'signal_prompt_selected');

    return {
      signal: serializeSignal(signal)
    };
  });

  app.post('/videos/:type/upload-url', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = videoTypeParamsSchema.safeParse(request.params);
    const parsed = prepareVideoUploadSchema.safeParse(request.body);

    if (!params.success || !parsed.success) {
      return reply.code(400).send({
        error: 'Invalid video upload request',
        issues: [...(params.success ? [] : params.error.issues), ...(parsed.success ? [] : parsed.error.issues)]
      });
    }

    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    if (!(await assertCanUploadVideo(context, reply, params.data.type))) {
      return;
    }

    const upload = createSignedVideoUpload({
      supabaseUserId: context.user.id,
      videoType: toInternalVideoType(params.data.type)
    });

    return upload;
  });

  app.post('/videos/:type/complete', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = videoTypeParamsSchema.safeParse(request.params);
    const parsed = uploadVideoSchema.safeParse(request.body);

    if (!params.success || !parsed.success || parsed.data.durationSeconds > maxDurationForVideoType(params.data.type)) {
      return reply.code(400).send({ error: 'Invalid video completion payload' });
    }

    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    if (!(await assertCanUploadVideo(context, reply, params.data.type))) {
      return;
    }

    try {
      assertCloudinaryVideoBelongsToUser(parsed.data.cloudinaryPublicId, context.user.id);
    } catch {
      return reply.code(400).send({ error: 'Invalid video public id' });
    }

    const videoKey = toSignalVideoKey(params.data.type);
    const existingSignal = await findSignalByApplicantId(context.db, context.applicant._id);

    await deleteStoredVideoAsset(existingSignal?.[videoKey]);

    const signal = await saveSignalVideo(context.db, context.applicant._id, videoKey, {
      storageProvider: 'cloudinary',
      cloudinaryPublicId: parsed.data.cloudinaryPublicId,
      secureUrl: parsed.data.secureUrl,
      thumbnailUrl: getVideoThumbnailUrl(parsed.data.secureUrl),
      contentType: parsed.data.contentType,
      fileSizeBytes: parsed.data.fileSizeBytes ?? undefined,
      durationSeconds: parsed.data.durationSeconds,
      maxResolution: '1080p',
      orientation: 'portrait',
      uploadedAt: new Date()
    });

    await updateApplicantOnboardingStatus(
      context.db,
      context.user.id,
      params.data.type === '10-second' ? 'signal_video_uploaded' : 'deeper_video_uploaded'
    );
    await recalculateSoftSkillsFromSignal(context.db, context.applicant._id, context.user.id);

    return {
      signal: serializeSignal(signal)
    };
  });

  app.delete('/videos/:type', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = videoTypeParamsSchema.safeParse(request.params);

    if (!params.success) {
      return reply.code(400).send({ error: 'Invalid video type' });
    }

    if (params.data.type === '10-second') {
      return reply.code(409).send({ error: 'The mandatory 10-second signal video can be retaken, not deleted' });
    }

    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    const signal = await findSignalByApplicantId(context.db, context.applicant._id);
    const videoKey = 'thirtySecondVideo';
    const existingVideo = signal?.[videoKey];

    await deleteStoredVideoAsset(existingVideo);

    const updatedSignal = await deleteSignalVideo(context.db, context.applicant._id, videoKey);
    await recalculateSoftSkillsFromSignal(context.db, context.applicant._id, context.user.id);

    return {
      signal: updatedSignal ? serializeSignal(updatedSignal) : null
    };
  });

  app.post('/onboarding/deeper-signal/seen', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = tenSecondElaborationSchema.safeParse(request.body ?? {});

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid 10-second elaboration payload', issues: parsed.error.issues });
    }

    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    if (!isAtLeastOnboardingStatus(context.applicant.onboardingStatus, 'signal_video_uploaded')) {
      return reply.code(409).send({ error: 'Upload the 10-second video before deeper signal' });
    }

    const elaboration = parsed.data.elaboration?.trim();
    const skipped = parsed.data.skipped === true || !elaboration;
    const signal = await saveTenSecondElaboration(context.db, context.applicant._id, {
      elaboration,
      skipped
    });

    await updateApplicantOnboardingStatus(context.db, context.user.id, 'deeper_signal_seen');
    await recalculateSoftSkillsFromSignal(context.db, context.applicant._id, context.user.id);

    return {
      signal: serializeSignal(signal)
    };
  });

  app.post('/onboarding/deeper-video/skip', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getApplicantOrReply(request, reply);

    if (!context) {
      return;
    }

    if (!isAtLeastOnboardingStatus(context.applicant.onboardingStatus, 'deeper_signal_seen')) {
      return reply.code(409).send({ error: 'View deeper signal before skipping the 30-second video' });
    }

    const signal = await skipThirtySecondVideo(context.db, context.applicant._id);
    await updateApplicantOnboardingStatus(context.db, context.user.id, 'deeper_video_skipped');
    await recalculateSoftSkillsFromSignal(context.db, context.applicant._id, context.user.id);

    return {
      signal: serializeSignal(signal)
    };
  });
}
