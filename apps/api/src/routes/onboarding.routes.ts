import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireSupabaseUser } from '../auth/supabaseJwt.js';
import { getDatabase } from '../db/mongo.js';
import { findApplicantBySupabaseUserId, updateApplicantOnboardingStatus } from '../repositories/applicants.repo.js';
import { serializeEducationProfile, upsertEducationProfile } from '../repositories/education.repo.js';
import { getNextOnboardingRoute, isAtLeastOnboardingStatus } from '../services/onboarding.service.js';

const educationSchema = z.object({
  universityUnitId: z.string().optional(),
  universityName: z.string().min(1),
  universityMatchedFromEmail: z.boolean(),
  semesterLabel: z.string().min(1),
  semesterNumber: z.number().int().positive()
});

export async function onboardingRoutes(app: FastifyInstance) {
  app.get('/onboarding/status', { preHandler: requireSupabaseUser }, async (request, reply) => {
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
      onboardingStatus: applicant.onboardingStatus,
      nextRoute: getNextOnboardingRoute(applicant.onboardingStatus)
    };
  });

  app.post('/onboarding/education', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const user = request.user;

    if (!user) {
      throw new Error('Authenticated user missing after auth guard');
    }

    const parsed = educationSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid education payload', issues: parsed.error.issues });
    }

    const db = await getDatabase();
    const applicant = await findApplicantBySupabaseUserId(db, user.id);

    if (!applicant) {
      return reply.code(404).send({ error: 'Applicant not found' });
    }

    if (!isAtLeastOnboardingStatus(applicant.onboardingStatus, 'auth_complete')) {
      return reply.code(409).send({ error: 'Complete the previous onboarding step first' });
    }

    const education = await upsertEducationProfile(db, applicant._id, parsed.data);
    await updateApplicantOnboardingStatus(db, user.id, 'education_complete');

    return {
      education: serializeEducationProfile(education)
    };
  });
}
