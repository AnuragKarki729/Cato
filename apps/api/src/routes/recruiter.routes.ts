import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getSupabaseUserFromToken, requireSupabaseUser } from '../auth/supabaseJwt.js';
import { getDatabase } from '../db/mongo.js';
import { applicantsCollection } from '../repositories/applicants.repo.js';
import {
  addRecruiterBookmark,
  countRecruiterPendingInterestRequests,
  countRecruiterRecentInterestRequests,
  countRecruiterInterestRequests,
  countRecruiterMessages,
  createRecruiterMessage,
  deleteRecruiterBookmark,
  expireStaleInterestRequests,
  findRecruiterInterestRequest,
  findRecruiterInterestRequests,
  findRecruiterBookmarks,
  findRecruiterBySupabaseUserId,
  findRecruiterMessages,
  recruiterBookmarksCollection,
  RECRUITER_DAILY_INTEREST_REQUEST_LIMIT,
  RECRUITER_PENDING_INTEREST_REQUEST_LIMIT,
  serializeRecruiterInterestRequest,
  serializeRecruiterCandidateReview,
  serializeRecruiter,
  syncRecruiterAccount,
  updateRecruiterCandidateReview,
  upsertRecruiterInterestRequest,
  getInterestRequestResendAvailableAt
} from '../repositories/recruiters.repo.js';
import {
  createRecruiterSavedFilter,
  deleteRecruiterSavedFilter,
  findRecruiterSavedFilters,
  serializeRecruiterSavedFilter
} from '../repositories/recruiterSavedFilters.repo.js';
import { createAppNotification } from '../repositories/notifications.repo.js';
import { recordApplicantActivity } from '../repositories/applicantActivities.repo.js';
import { claimAppUserRole } from '../repositories/userRoles.repo.js';
import {
  findRecruiterCandidateById,
  findRecruiterCandidates,
  serializeRecruiterCandidate
} from '../services/recruiterCandidates.service.js';
import { deleteRecruiterAccount } from '../services/accountDeletion.service.js';
import { attachSseClient, publishApplicantEvent } from '../services/sse.service.js';

const recruiterMessageSockets = new Map<string, Set<{ send: (payload: string) => void }>>();

function publishRecruiterMessage(recruiterSupabaseUserId: string, payload: unknown) {
  const sockets = recruiterMessageSockets.get(recruiterSupabaseUserId);

  if (!sockets) {
    return;
  }

  const message = JSON.stringify(payload);
  sockets.forEach((socket) => socket.send(message));
}

const candidateParamsSchema = z.object({
  id: z.string().min(1)
});

const stringArrayFromQuery = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(','));
  }

  if (typeof value === 'string') {
    return value.split(',');
  }

  return value;
}, z.array(z.string().trim().min(1).max(120)).max(30).optional());

const numberArrayFromQuery = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(','));
  }

  if (typeof value === 'string') {
    return value.split(',');
  }

  return value;
}, z.array(z.coerce.number().int().min(1).max(100)).max(30).optional());

const candidatesQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  categoryFieldId: z.string().trim().max(80).optional(),
  categoryFieldIds: stringArrayFromQuery,
  university: z.string().trim().max(120).optional(),
  universities: stringArrayFromQuery,
  major: z.string().trim().max(120).optional(),
  majors: stringArrayFromQuery,
  semesterNumber: z.coerce.number().int().min(1).max(20).optional(),
  semesterNumbers: numberArrayFromQuery,
  gpaMin: z.coerce.number().min(0).max(4).optional(),
  gpaMax: z.coerce.number().min(0).max(4).optional(),
  hasInternship: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  interestStatus: z.enum(['sent', 'viewed', 'accepted', 'declined', 'expired']).optional(),
  bookmarkedOnly: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  reviewStatus: z.enum(['none', 'maybe', 'shortlisted', 'passed']).optional()
});

const contactCandidateSchema = z.object({
  body: z.string().trim().min(1).max(2000)
});

const interestRequestSchema = z.object({
  reason: z.string().trim().min(1).max(500),
  resend: z.boolean().optional(),
  roleCategory: z.string().trim().min(1).max(80).optional()
});

const candidateReviewSchema = z.object({
  notes: z.string().trim().max(2000).optional(),
  status: z.enum(['none', 'maybe', 'shortlisted', 'passed']).optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(12).optional()
});

const candidateActivitySchema = z.object({
  type: z.enum(['resume_opened', 'deeper_signal_opened'])
});

const savedFilterCriteriaSchema = z.object({
  q: z.string().trim().max(120).optional(),
  categoryFieldIds: z.array(z.string().trim().min(1).max(80)).max(12).optional(),
  universities: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  majors: z.array(z.string().trim().min(1).max(120)).max(20).optional(),
  semesterNumbers: z.array(z.number().int().min(1).max(100)).max(12).optional(),
  gpaMin: z.number().min(0).max(4).optional(),
  hasInternship: z.boolean().optional(),
  bookmarkedOnly: z.boolean().optional(),
  reviewStatus: z.enum(['none', 'maybe', 'shortlisted', 'passed']).optional()
});

const savedFilterSchema = z.object({
  name: z.string().trim().min(1).max(60),
  criteria: savedFilterCriteriaSchema
});

const savedFilterParamsSchema = z.object({
  id: z.string().min(1)
});

function normalizeReviewTags(tags: string[] | undefined) {
  if (!tags) {
    return undefined;
  }

  return Array.from(new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))).slice(0, 12);
}

async function findCompletedCandidateById(db: Awaited<ReturnType<typeof getDatabase>>, candidateId: string) {
  if (!ObjectId.isValid(candidateId)) {
    return null;
  }

  return applicantsCollection(db).findOne({
    _id: new ObjectId(candidateId),
    onboardingStatus: 'onboarding_complete'
  });
}

async function getRecruiterContext(request: FastifyRequest, reply: FastifyReply) {
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

export async function recruiterRoutes(app: FastifyInstance) {
  app.get('/recruiter/events', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    attachSseClient(reply, context.user.id, 'recruiter');
  });

  app.get('/recruiter/messages/ws', { websocket: true }, async (connection, request) => {
    const token = (request.query as { token?: string }).token;

    if (!token) {
      connection.socket.close();
      return;
    }

    const user = await getSupabaseUserFromToken(token);

    if (!user) {
      connection.socket.close();
      return;
    }

    const sockets = recruiterMessageSockets.get(user.id) ?? new Set();
    sockets.add(connection.socket);
    recruiterMessageSockets.set(user.id, sockets);
    connection.socket.send(JSON.stringify({ type: 'connected' }));
    connection.socket.on('close', () => {
      sockets.delete(connection.socket);
      if (sockets.size === 0) {
        recruiterMessageSockets.delete(user.id);
      }
    });
  });

  app.post('/recruiter/auth/sync', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const user = request.user;

    if (!user) {
      throw new Error('Authenticated user missing after auth guard');
    }

    const db = await getDatabase();
    try {
      await claimAppUserRole(db, {
        supabaseUserId: user.id,
        email: user.email,
        role: 'recruiter'
      });
    } catch (error) {
      return reply.code(409).send({ error: error instanceof Error ? error.message : 'Unable to claim recruiter role' });
    }
    const recruiter = await syncRecruiterAccount(db, {
      supabaseUserId: user.id,
      email: user.email,
      name: user.name
    });

    return {
      recruiter: serializeRecruiter(recruiter)
    };
  });

  app.get('/recruiter/me', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    return {
      recruiter: serializeRecruiter(context.recruiter)
    };
  });

  app.delete('/recruiter/account', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    await deleteRecruiterAccount(context.db, context.recruiter._id, context.user.id);

    return {
      deleted: true
    };
  });

  app.get('/recruiter/dashboard', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    const [candidates, bookmarks, messages, interestRequests, latestMessages] = await Promise.all([
      applicantsCollection(context.db).countDocuments({ onboardingStatus: 'onboarding_complete' }),
      recruiterBookmarksCollection(context.db).countDocuments({ recruiterId: context.recruiter._id }),
      countRecruiterMessages(context.db, context.recruiter._id),
      countRecruiterInterestRequests(context.db, context.recruiter._id),
      findRecruiterMessages(context.db, context.recruiter._id)
    ]);
    const recentActivity = [
      `${candidates} completed applicant profiles available`,
      `${bookmarks} candidates bookmarked`,
      `${interestRequests} interest requests sent`,
      `${messages} candidate messages sent`,
      ...latestMessages.slice(0, 2).map((message) => `Message sent on ${message.createdAt.toISOString().slice(0, 10)}`)
    ];

    return {
      recruiter: serializeRecruiter(context.recruiter),
      metrics: {
        candidates,
        bookmarks,
        messages,
        interestRequests
      },
      recentActivity
    };
  });

  app.get('/recruiter/interest-requests', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    await expireStaleInterestRequests(context.db);
    const requests = await findRecruiterInterestRequests(context.db, context.recruiter._id);
    const serialized = await Promise.all(
      requests.map(async (interestRequest) => {
        const applicant = await applicantsCollection(context.db).findOne({ _id: interestRequest.applicantId });
        return serializeRecruiterInterestRequest(interestRequest, applicant?.name);
      })
    );

    return { requests: serialized };
  });

  app.get('/recruiter/candidates', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsedQuery = candidatesQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return reply.code(400).send({ error: 'Invalid candidate search query' });
    }

    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    await expireStaleInterestRequests(context.db);
    return {
      candidates: await findRecruiterCandidates(context.db, context.recruiter._id, {
        query: parsedQuery.data.q,
        categoryFieldId: parsedQuery.data.categoryFieldId,
        categoryFieldIds: parsedQuery.data.categoryFieldIds,
        university: parsedQuery.data.university,
        universities: parsedQuery.data.universities,
        major: parsedQuery.data.major,
        majors: parsedQuery.data.majors,
        semesterNumber: parsedQuery.data.semesterNumber,
        semesterNumbers: parsedQuery.data.semesterNumbers,
        gpaMin: parsedQuery.data.gpaMin,
        gpaMax: parsedQuery.data.gpaMax,
        hasInternship: parsedQuery.data.hasInternship,
        interestStatus: parsedQuery.data.interestStatus,
        bookmarkedOnly: parsedQuery.data.bookmarkedOnly,
        reviewStatus: parsedQuery.data.reviewStatus
      })
    };
  });

  app.get('/recruiter/saved-filters', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    const filters = await findRecruiterSavedFilters(context.db, context.recruiter._id);
    return {
      filters: filters.map(serializeRecruiterSavedFilter)
    };
  });

  app.post('/recruiter/saved-filters', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = savedFilterSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid saved filter payload' });
    }

    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    try {
      const filter = await createRecruiterSavedFilter(context.db, context.recruiter._id, parsed.data);
      return {
        filter: serializeRecruiterSavedFilter(filter)
      };
    } catch (error) {
      if (error instanceof Error && (error.name === 'DuplicateSavedFilterError' || error.name === 'SavedFilterLimitError')) {
        return reply.code(409).send({ error: error.message });
      }

      throw error;
    }
  });

  app.delete('/recruiter/saved-filters/:id', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = savedFilterParamsSchema.safeParse(request.params);

    if (!params.success || !ObjectId.isValid(params.data.id)) {
      return reply.code(400).send({ error: 'Invalid saved filter id' });
    }

    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    const deleted = await deleteRecruiterSavedFilter(context.db, context.recruiter._id, new ObjectId(params.data.id));

    if (!deleted) {
      return reply.code(404).send({ error: 'Saved filter not found' });
    }

    return { deleted: true };
  });

  app.get('/recruiter/candidates/:id', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = candidateParamsSchema.safeParse(request.params);

    if (!params.success) {
      return reply.code(400).send({ error: 'Invalid candidate id' });
    }

    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    await expireStaleInterestRequests(context.db);
    const candidate = await findRecruiterCandidateById(context.db, context.recruiter._id, params.data.id);

    if (!candidate) {
      return reply.code(404).send({ error: 'Candidate not found' });
    }

    await recordApplicantActivity(context.db, {
      applicantId: new ObjectId(params.data.id),
      recruiter: context.recruiter,
      type: 'profile_viewed',
      title: 'Profile viewed',
      body: `${context.recruiter.companyName ?? context.recruiter.name ?? 'A recruiter'} viewed your profile.`,
      dedupeHours: 24
    });

    return { candidate };
  });

  app.get('/recruiter/bookmarks', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    await expireStaleInterestRequests(context.db);
    const bookmarks = await findRecruiterBookmarks(context.db, context.recruiter._id);
    const candidates = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const applicant = await applicantsCollection(context.db).findOne({
          _id: bookmark.applicantId,
          onboardingStatus: 'onboarding_complete'
        });
        return applicant ? serializeRecruiterCandidate(context.db, applicant, context.recruiter._id) : null;
      })
    );

    return {
      bookmarks: candidates.filter((candidate) => candidate !== null)
    };
  });

  app.post('/recruiter/candidates/:id/bookmark', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = candidateParamsSchema.safeParse(request.params);

    if (!params.success || !ObjectId.isValid(params.data.id)) {
      return reply.code(400).send({ error: 'Invalid candidate id' });
    }

    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    const applicant = await findCompletedCandidateById(context.db, params.data.id);

    if (!applicant) {
      return reply.code(404).send({ error: 'Candidate not found' });
    }

    await addRecruiterBookmark(context.db, context.recruiter._id, new ObjectId(params.data.id));
    await recordApplicantActivity(context.db, {
      applicantId: applicant._id,
      recruiter: context.recruiter,
      type: 'bookmarked',
      title: 'Profile saved',
      body: `${context.recruiter.companyName ?? context.recruiter.name ?? 'A recruiter'} saved your profile.`,
      dedupeHours: 24
    });
    return { bookmarked: true };
  });

  app.delete('/recruiter/candidates/:id/bookmark', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = candidateParamsSchema.safeParse(request.params);

    if (!params.success || !ObjectId.isValid(params.data.id)) {
      return reply.code(400).send({ error: 'Invalid candidate id' });
    }

    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    await deleteRecruiterBookmark(context.db, context.recruiter._id, new ObjectId(params.data.id));
    return { bookmarked: false };
  });

  app.patch('/recruiter/candidates/:id/review', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = candidateParamsSchema.safeParse(request.params);
    const parsed = candidateReviewSchema.safeParse(request.body);

    if (!params.success || !ObjectId.isValid(params.data.id) || !parsed.success) {
      return reply.code(400).send({ error: 'Invalid candidate review payload' });
    }

    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    const applicant = await findCompletedCandidateById(context.db, params.data.id);

    if (!applicant) {
      return reply.code(404).send({ error: 'Candidate not found' });
    }

    const review = await updateRecruiterCandidateReview(context.db, context.recruiter._id, applicant._id, {
      notes: parsed.data.notes,
      status: parsed.data.status,
      tags: normalizeReviewTags(parsed.data.tags)
    });

    if (review.status === 'shortlisted') {
      await recordApplicantActivity(context.db, {
        applicantId: applicant._id,
        recruiter: context.recruiter,
        type: 'shortlisted',
        title: 'Shortlisted',
        body: `${context.recruiter.companyName ?? context.recruiter.name ?? 'A recruiter'} shortlisted your profile.`,
        dedupeHours: 24
      });
    }

    return {
      review: serializeRecruiterCandidateReview(review)
    };
  });

  app.post('/recruiter/candidates/:id/activity', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = candidateParamsSchema.safeParse(request.params);
    const parsed = candidateActivitySchema.safeParse(request.body);

    if (!params.success || !ObjectId.isValid(params.data.id) || !parsed.success) {
      return reply.code(400).send({ error: 'Invalid candidate activity payload' });
    }

    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    const applicant = await findCompletedCandidateById(context.db, params.data.id);

    if (!applicant) {
      return reply.code(404).send({ error: 'Candidate not found' });
    }

    const isResume = parsed.data.type === 'resume_opened';
    await recordApplicantActivity(context.db, {
      applicantId: applicant._id,
      recruiter: context.recruiter,
      type: parsed.data.type,
      title: isResume ? 'Resume opened' : 'Deeper signal watched',
      body: `${context.recruiter.companyName ?? context.recruiter.name ?? 'A recruiter'} ${
        isResume ? 'opened your resume.' : 'opened your deeper signal.'
      }`,
      dedupeHours: 12
    });

    return { recorded: true };
  });

  app.post('/recruiter/candidates/:id/interest', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = candidateParamsSchema.safeParse(request.params);
    const parsed = interestRequestSchema.safeParse(request.body);

    if (!params.success || !ObjectId.isValid(params.data.id) || !parsed.success) {
      return reply.code(400).send({ error: 'Invalid interest request payload' });
    }

    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    const applicant = await findCompletedCandidateById(context.db, params.data.id);

    if (!applicant) {
      return reply.code(404).send({ error: 'Candidate not found' });
    }

    await expireStaleInterestRequests(context.db);
    const existingRequest = await findRecruiterInterestRequest(context.db, context.recruiter._id, applicant._id);

    if (existingRequest?.status === 'accepted') {
      return reply.code(409).send({ error: 'Candidate already accepted your interest request' });
    }

    if (existingRequest?.status === 'sent' || existingRequest?.status === 'viewed') {
      return reply.code(409).send({ error: 'Interest request is already pending' });
    }

    if (existingRequest?.status === 'declined') {
      const resendAvailableAt = getInterestRequestResendAvailableAt(existingRequest);

      if (!parsed.data.resend || (resendAvailableAt && resendAvailableAt > new Date())) {
        return reply.code(409).send({
          error: 'Candidate declined this request. You can explicitly re-request after the cooldown period.',
          resendAvailableAt: resendAvailableAt?.toISOString()
        });
      }
    }

    if (existingRequest?.status === 'expired' && !parsed.data.resend) {
      return reply.code(409).send({ error: 'Interest request expired. Confirm that you want to send a new request.' });
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [pendingRequestCount, recentRequestCount] = await Promise.all([
      countRecruiterPendingInterestRequests(context.db, context.recruiter._id),
      countRecruiterRecentInterestRequests(context.db, context.recruiter._id, dayAgo)
    ]);

    if (pendingRequestCount >= RECRUITER_PENDING_INTEREST_REQUEST_LIMIT) {
      return reply.code(429).send({ error: 'Pending interest request limit reached. Wait for applicants to respond first.' });
    }

    if (recentRequestCount >= RECRUITER_DAILY_INTEREST_REQUEST_LIMIT) {
      return reply.code(429).send({ error: 'Daily interest request limit reached. Try again later.' });
    }

    const interestRequest = await upsertRecruiterInterestRequest(
      context.db,
      context.recruiter._id,
      new ObjectId(params.data.id),
      parsed.data
    );
    const notificationPayload = {
      requestId: interestRequest._id.toString(),
      recruiterId: context.recruiter._id.toString(),
      recruiterName: context.recruiter.name,
      companyName: context.recruiter.companyName,
      reason: interestRequest.reason,
      roleCategory: interestRequest.roleCategory,
      status: interestRequest.status,
      sentAt: interestRequest.sentAt.toISOString()
    };
    await createAppNotification(context.db, {
      recipientSupabaseUserId: applicant.supabaseUserId,
      role: 'applicant',
      bucket: 'requests',
      eventName: 'interest_request_sent',
      payload: notificationPayload
    });
    await recordApplicantActivity(context.db, {
      applicantId: applicant._id,
      recruiter: context.recruiter,
      type: 'interest_sent',
      title: 'Interest request',
      body: `${context.recruiter.companyName ?? context.recruiter.name ?? 'A recruiter'} sent you an interest request.`,
      metadata: { requestId: interestRequest._id.toString() }
    });
    publishApplicantEvent(applicant.supabaseUserId, 'interest_request_sent', notificationPayload);

    return {
      request: serializeRecruiterInterestRequest(interestRequest, applicant.name)
    };
  });

  app.post('/recruiter/candidates/:id/contact', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = candidateParamsSchema.safeParse(request.params);
    const parsed = contactCandidateSchema.safeParse(request.body);

    if (!params.success || !ObjectId.isValid(params.data.id) || !parsed.success) {
      return reply.code(400).send({ error: 'Invalid contact payload' });
    }

    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    const applicant = await findCompletedCandidateById(context.db, params.data.id);

    if (!applicant) {
      return reply.code(404).send({ error: 'Candidate not found' });
    }

    const interestRequest = await findRecruiterInterestRequest(context.db, context.recruiter._id, applicant._id);

    if (interestRequest?.status !== 'accepted') {
      return reply.code(409).send({ error: 'Candidate must accept your interest request before messaging opens' });
    }

    await createRecruiterMessage(context.db, context.recruiter._id, new ObjectId(params.data.id), parsed.data.body);
    await recordApplicantActivity(context.db, {
      applicantId: applicant._id,
      recruiter: context.recruiter,
      type: 'message_sent',
      title: 'New message',
      body: `${context.recruiter.companyName ?? context.recruiter.name ?? 'A recruiter'} sent you a message.`,
      dedupeHours: 1
    });
    publishRecruiterMessage(context.user.id, {
      type: 'message_sent',
      candidateId: params.data.id,
      body: parsed.data.body,
      createdAt: new Date().toISOString()
    });
    return { sent: true };
  });

  app.get('/recruiter/messages', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    const messages = await findRecruiterMessages(context.db, context.recruiter._id);
    const serialized = await Promise.all(
      messages.map(async (message) => {
        const applicant = await applicantsCollection(context.db).findOne({ _id: message.applicantId });
        return {
          id: message._id.toString(),
          candidateId: message.applicantId.toString(),
          candidateName: applicant?.name,
          body: message.body,
          createdAt: message.createdAt.toISOString()
        };
      })
    );

    return {
      messages: serialized
    };
  });
}
