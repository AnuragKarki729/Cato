import type { FastifyInstance } from 'fastify';
import { requireSupabaseUser } from '../auth/supabaseJwt.js';
import { getDatabase } from '../db/mongo.js';
import { findApplicantBySupabaseUserId } from '../repositories/applicants.repo.js';
import { deleteApplicantAccount } from '../services/accountDeletion.service.js';

export async function accountRoutes(app: FastifyInstance) {
  app.delete('/account', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const user = request.user;

    if (!user) {
      throw new Error('Authenticated user missing after auth guard');
    }

    const db = await getDatabase();
    const applicant = await findApplicantBySupabaseUserId(db, user.id);

    if (!applicant) {
      return reply.code(404).send({ error: 'Applicant not found' });
    }

    await deleteApplicantAccount(db, applicant._id, user.id);

    return {
      deleted: true
    };
  });
}
