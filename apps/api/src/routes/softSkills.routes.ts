import type { FastifyInstance } from 'fastify';
import { requireSupabaseUser } from '../auth/supabaseJwt.js';
import { getDatabase } from '../db/mongo.js';
import { findApplicantBySupabaseUserId } from '../repositories/applicants.repo.js';
import { findSoftSkillsByApplicantId, serializeSoftSkills } from '../repositories/softSkills.repo.js';
import { recalculateSoftSkillsFromSignal } from '../services/softSkillsScoring.service.js';

export async function softSkillsRoutes(app: FastifyInstance) {
  app.get('/profile/soft-skills', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const user = request.user;

    if (!user) {
      throw new Error('Authenticated user missing after auth guard');
    }

    const db = await getDatabase();
    const applicant = await findApplicantBySupabaseUserId(db, user.id);

    if (!applicant) {
      return reply.code(404).send({ error: 'Applicant not found' });
    }

    const existingOutput = await findSoftSkillsByApplicantId(db, applicant._id);
    const output =
      !existingOutput || existingOutput.status === 'skipped' || existingOutput.items.length === 0
        ? await recalculateSoftSkillsFromSignal(db, applicant._id, user.id)
        : existingOutput;

    return {
      softSkills: serializeSoftSkills(output)
    };
  });
}
