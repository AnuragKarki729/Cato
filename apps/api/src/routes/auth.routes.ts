import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireSupabaseUser } from '../auth/supabaseJwt.js';
import { getDatabase } from '../db/mongo.js';
import { serializeApplicant, syncApplicant } from '../repositories/applicants.repo.js';
import {
  claimAppUserRole,
  findAppUserRole,
  serializeAppUserRole
} from '../repositories/userRoles.repo.js';

const claimRoleSchema = z.object({
  role: z.enum(['applicant', 'recruiter'])
});

export async function authRoutes(app: FastifyInstance) {
  app.get('/auth/role', { preHandler: requireSupabaseUser }, async (request) => {
    const user = request.user;

    if (!user) {
      throw new Error('Authenticated user missing after auth guard');
    }

    const db = await getDatabase();
    const role = await findAppUserRole(db, user.id);

    return {
      role: role ? serializeAppUserRole(role).role : null
    };
  });

  app.post('/auth/role', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = claimRoleSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid role payload', issues: parsed.error.issues });
    }

    const user = request.user;

    if (!user) {
      throw new Error('Authenticated user missing after auth guard');
    }

    const db = await getDatabase();

    try {
      const role = await claimAppUserRole(db, {
        supabaseUserId: user.id,
        email: user.email,
        role: parsed.data.role
      });

      return serializeAppUserRole(role);
    } catch (error) {
      return reply.code(409).send({ error: error instanceof Error ? error.message : 'Unable to claim role' });
    }
  });

  app.post('/auth/sync', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const user = request.user;

    if (!user) {
      throw new Error('Authenticated user missing after auth guard');
    }

    const db = await getDatabase();
    try {
      await claimAppUserRole(db, {
        supabaseUserId: user.id,
        email: user.email,
        role: 'applicant'
      });
    } catch (error) {
      return reply.code(409).send({ error: error instanceof Error ? error.message : 'Unable to claim applicant role' });
    }
    const applicant = await syncApplicant(db, {
      supabaseUserId: user.id,
      email: user.email,
      name: user.name,
      authProvider: user.authProvider
    });

    return {
      applicant: serializeApplicant(applicant)
    };
  });
}
