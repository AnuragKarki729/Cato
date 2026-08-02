import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { getSupabaseUserFromToken, requireSupabaseUser } from '../auth/supabaseJwt.js';
import { getDatabase } from '../db/mongo.js';
import { applicantsCollection } from '../repositories/applicants.repo.js';
import {
  addRecruiterBookmark,
  countRecruiterMessages,
  createRecruiterMessage,
  deleteRecruiterBookmark,
  ensureRecruiterIndexes,
  findRecruiterBookmarks,
  findRecruiterBySupabaseUserId,
  findRecruiterMessages,
  recruiterBookmarksCollection,
  serializeRecruiter,
  syncRecruiterAccount
} from '../repositories/recruiters.repo.js';
import { claimAppUserRole } from '../repositories/userRoles.repo.js';
import {
  findRecruiterCandidateById,
  findRecruiterCandidates,
  serializeRecruiterCandidate
} from '../services/recruiterCandidates.service.js';
import { deleteRecruiterAccount } from '../services/accountDeletion.service.js';

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

const contactCandidateSchema = z.object({
  body: z.string().trim().min(1).max(2000)
});

async function getRecruiterContext(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;

  if (!user) {
    throw new Error('Authenticated user missing after auth guard');
  }

  const db = await getDatabase();
  await ensureRecruiterIndexes(db);
  const recruiter = await findRecruiterBySupabaseUserId(db, user.id);

  if (!recruiter) {
    reply.code(404).send({ error: 'Recruiter account not found' });
    return null;
  }

  return { db, recruiter, user };
}

export async function recruiterRoutes(app: FastifyInstance) {
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
    await ensureRecruiterIndexes(db);
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

    const [candidates, bookmarks, messages, latestMessages] = await Promise.all([
      applicantsCollection(context.db).countDocuments({ onboardingStatus: 'onboarding_complete' }),
      recruiterBookmarksCollection(context.db).countDocuments({ recruiterId: context.recruiter._id }),
      countRecruiterMessages(context.db, context.recruiter._id),
      findRecruiterMessages(context.db, context.recruiter._id)
    ]);
    const recentActivity = [
      `${candidates} completed applicant profiles available`,
      `${bookmarks} candidates bookmarked`,
      `${messages} candidate messages sent`,
      ...latestMessages.slice(0, 2).map((message) => `Message sent on ${message.createdAt.toISOString().slice(0, 10)}`)
    ];

    return {
      recruiter: serializeRecruiter(context.recruiter),
      metrics: {
        candidates,
        bookmarks,
        messages
      },
      recentActivity
    };
  });

  app.get('/recruiter/candidates', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    return {
      candidates: await findRecruiterCandidates(context.db, context.recruiter._id)
    };
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

    const candidate = await findRecruiterCandidateById(context.db, context.recruiter._id, params.data.id);

    if (!candidate) {
      return reply.code(404).send({ error: 'Candidate not found' });
    }

    return { candidate };
  });

  app.get('/recruiter/bookmarks', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    const bookmarks = await findRecruiterBookmarks(context.db, context.recruiter._id);
    const candidates = await Promise.all(
      bookmarks.map(async (bookmark) => {
        const applicant = await applicantsCollection(context.db).findOne({ _id: bookmark.applicantId });
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

    await addRecruiterBookmark(context.db, context.recruiter._id, new ObjectId(params.data.id));
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

    await createRecruiterMessage(context.db, context.recruiter._id, new ObjectId(params.data.id), parsed.data.body);
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
