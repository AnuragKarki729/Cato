import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireSupabaseUser } from '../auth/supabaseJwt.js';
import { getDatabase } from '../db/mongo.js';
import { acceptApplicantConsent, serializeApplicant } from '../repositories/applicants.repo.js';

const consentSchema = z.object({
  resume: z.boolean().optional(),
  video: z.boolean().optional(),
  privacyPolicy: z.boolean().optional()
});

export async function privacyRoutes(app: FastifyInstance) {
  app.post('/privacy/consent', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const user = request.user;

    if (!user) {
      throw new Error('Authenticated user missing after auth guard');
    }

    const parsed = consentSchema.safeParse(request.body);

    if (!parsed.success || !Object.values(parsed.data).some(Boolean)) {
      return reply.code(400).send({ error: 'At least one consent flag is required' });
    }

    const db = await getDatabase();
    const applicant = await acceptApplicantConsent(db, user.id, parsed.data);

    if (!applicant) {
      return reply.code(404).send({ error: 'Applicant not found' });
    }

    return {
      applicant: serializeApplicant(applicant)
    };
  });
}
