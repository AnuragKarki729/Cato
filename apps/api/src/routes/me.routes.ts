import type { FastifyInstance } from 'fastify';
import { requireSupabaseUser } from '../auth/supabaseJwt.js';
import { getDatabase } from '../db/mongo.js';
import { findApplicantBySupabaseUserId, serializeApplicant } from '../repositories/applicants.repo.js';

export async function meRoutes(app: FastifyInstance) {
  app.get('/me', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const user = request.user;

    if (!user) {
      throw new Error('Authenticated user missing after auth guard');
    }

    const db = await getDatabase();
    const applicant = await findApplicantBySupabaseUserId(db, user.id);

    if (!applicant) {
      return reply.code(404).send({ error: 'Applicant not found' });
    }

    return {
      applicant: serializeApplicant(applicant)
    };
  });
}
