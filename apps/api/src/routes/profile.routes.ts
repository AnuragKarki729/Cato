import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { requireSupabaseUser } from '../auth/supabaseJwt.js';
import { getDatabase } from '../db/mongo.js';
import {
  findApplicantBySupabaseUserId,
  serializeApplicant,
  saveApplicantUploadedProfileImage,
  updateApplicantProfileImageSource,
  updateApplicantName,
  updateApplicantOnboardingStatus
} from '../repositories/applicants.repo.js';
import { findEducationProfileByApplicantId, serializeEducationProfile, upsertEducationProfile } from '../repositories/education.repo.js';
import {
  createInternship,
  deleteInternship,
  findInternshipsByApplicantId,
  replaceInternships,
  serializeInternship,
  updateInternship
} from '../repositories/internships.repo.js';
import { findResumeByApplicantId, serializeResume } from '../repositories/resumes.repo.js';
import { findSignalByApplicantId, serializeSignal } from '../repositories/signals.repo.js';
import { findSoftSkillsByApplicantId, serializeSoftSkills, updateSoftSkillItems } from '../repositories/softSkills.repo.js';
import {
  assertCloudinaryProfileImageBelongsToUser,
  createSignedProfileImageUpload,
  deleteCloudinaryAsset
} from '../services/cloudinary.service.js';
import { isAtLeastOnboardingStatus } from '../services/onboarding.service.js';
import { recalculateSoftSkillsFromSignal } from '../services/softSkillsScoring.service.js';

const applicantUpdateSchema = z.object({
  name: z.string().trim().min(1)
});

const gpaSchema = z
  .number()
  .min(0)
  .max(4)
  .transform((gpa) => Math.round(gpa * 100) / 100);

const internshipSchema = z.object({
  company: z.string().min(1),
  durationMonths: z.number().int().positive(),
  roleDepartment: z.enum([
    'Engineering',
    'Product',
    'Design',
    'Marketing',
    'Sales',
    'Finance',
    'Operations',
    'Data',
    'Research',
    'HR',
    'Legal',
    'Customer Success',
    'Other'
  ])
});

const educationSchema = z.object({
  universityUnitId: z.string().optional(),
  universityName: z.string().min(1),
  universityMatchedFromEmail: z.boolean(),
  semesterLabel: z.string().min(1),
  semesterNumber: z.number().int().positive(),
  gpa: gpaSchema.optional(),
  major: z.string().optional(),
  minor: z.string().optional()
});

const profileSchema = educationSchema.extend({
  name: z.string().trim().min(1),
  internships: z.array(internshipSchema).default([])
});

const softSkillItemSchema = z.object({
  label: z.string().min(1),
  rating: z.number().min(1).max(5),
  evidence: z.string().min(1),
  confidence: z.enum(['low', 'medium', 'high'])
});

const softSkillUpdateSchema = z.object({
  items: z.array(softSkillItemSchema)
});

const prepareProfileImageUploadSchema = z.object({
  contentType: z.string().regex(/^image\/(jpeg|jpg|png|heic|heif|webp)$/i),
  fileSizeBytes: z.number().int().positive().nullish()
});

const completeProfileImageUploadSchema = z.object({
  cloudinaryPublicId: z.string().min(1),
  secureUrl: z.string().url(),
  contentType: z.string().regex(/^image\/(jpeg|jpg|png|heic|heif|webp)$/i),
  fileSizeBytes: z.number().int().positive().nullish()
});

const profileImageSourceSchema = z.object({
  source: z.enum(['ten_second_video', 'thirty_second_video', 'uploaded'])
});

async function getApplicantContext(request: FastifyRequest, reply: FastifyReply) {
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

export async function profileRoutes(app: FastifyInstance) {
  app.get('/profile', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    const [education, internships, resume, signal, existingSoftSkills] = await Promise.all([
      findEducationProfileByApplicantId(context.db, context.applicant._id),
      findInternshipsByApplicantId(context.db, context.applicant._id),
      findResumeByApplicantId(context.db, context.applicant._id),
      findSignalByApplicantId(context.db, context.applicant._id),
      findSoftSkillsByApplicantId(context.db, context.applicant._id)
    ]);
    const softSkills =
      !existingSoftSkills || existingSoftSkills.status === 'skipped' || existingSoftSkills.items.length === 0
        ? await recalculateSoftSkillsFromSignal(context.db, context.applicant._id, context.user.id)
        : existingSoftSkills;

    return {
      applicant: serializeApplicant(context.applicant),
      education: education ? serializeEducationProfile(education) : null,
      internships: internships.map(serializeInternship),
      resume: resume ? serializeResume(resume) : null,
      signal: signal ? serializeSignal(signal) : null,
      softSkills: softSkills ? serializeSoftSkills(softSkills) : null,
      finishProfilePrompt: Boolean(signal?.thirtySecondVideoSkipped)
    };
  });

  app.patch('/profile/applicant', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = applicantUpdateSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid applicant payload', issues: parsed.error.issues });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    await updateApplicantName(context.db, context.user.id, parsed.data.name);
    const applicant = await findApplicantBySupabaseUserId(context.db, context.user.id);

    if (!applicant) {
      return reply.code(404).send({ error: 'Applicant not found' });
    }

    return {
      applicant: serializeApplicant(applicant)
    };
  });

  app.post('/profile/image/upload-url', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = prepareProfileImageUploadSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid profile image upload request', issues: parsed.error.issues });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    return createSignedProfileImageUpload({
      supabaseUserId: context.user.id
    });
  });

  app.post('/profile/image/complete', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = completeProfileImageUploadSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid profile image completion payload', issues: parsed.error.issues });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    try {
      assertCloudinaryProfileImageBelongsToUser(parsed.data.cloudinaryPublicId, context.user.id);
    } catch {
      return reply.code(400).send({ error: 'Invalid profile image public id' });
    }

    if (context.applicant.profileImage?.cloudinaryPublicId) {
      await deleteCloudinaryAsset(context.applicant.profileImage.cloudinaryPublicId, 'image');
    }

    const applicant = await saveApplicantUploadedProfileImage(context.db, context.user.id, {
      cloudinaryPublicId: parsed.data.cloudinaryPublicId,
      secureUrl: parsed.data.secureUrl,
      contentType: parsed.data.contentType,
      fileSizeBytes: parsed.data.fileSizeBytes ?? undefined
    });

    if (!applicant) {
      return reply.code(404).send({ error: 'Applicant not found' });
    }

    return {
      applicant: serializeApplicant(applicant)
    };
  });

  app.patch('/profile/image/source', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = profileImageSourceSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid profile image source payload', issues: parsed.error.issues });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    const applicant = await updateApplicantProfileImageSource(context.db, context.user.id, parsed.data.source);

    if (!applicant) {
      return reply.code(404).send({ error: 'Applicant not found' });
    }

    return {
      applicant: serializeApplicant(applicant)
    };
  });

  app.post('/onboarding/profile', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = profileSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid profile payload', issues: parsed.error.issues });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    if (!isAtLeastOnboardingStatus(context.applicant.onboardingStatus, 'deeper_video_skipped')) {
      return reply.code(409).send({ error: 'Complete or skip the 30-second video before finishing profile' });
    }

    await upsertEducationProfile(context.db, context.applicant._id, parsed.data);
    await replaceInternships(context.db, context.applicant._id, parsed.data.internships);
    await updateApplicantName(context.db, context.user.id, parsed.data.name);
    await updateApplicantOnboardingStatus(context.db, context.user.id, 'onboarding_complete');

    return {
      onboardingStatus: 'onboarding_complete',
      nextRoute: '/(tabs)/home'
    };
  });

  app.patch('/profile/education', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = educationSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid education payload', issues: parsed.error.issues });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    const education = await upsertEducationProfile(context.db, context.applicant._id, parsed.data);

    return {
      education: serializeEducationProfile(education)
    };
  });

  app.post('/profile/internships', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = internshipSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid internship payload', issues: parsed.error.issues });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    const internship = await createInternship(context.db, context.applicant._id, parsed.data);

    return {
      internship: serializeInternship(internship)
    };
  });

  app.patch('/profile/internships/:id', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = internshipSchema.safeParse(request.body);
    const params = z.object({ id: z.string().min(1) }).safeParse(request.params);

    if (!parsed.success || !params.success || !ObjectId.isValid(params.data.id)) {
      return reply.code(400).send({ error: 'Invalid internship update payload' });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    const internship = await updateInternship(
      context.db,
      context.applicant._id,
      new ObjectId(params.data.id),
      parsed.data
    );

    return {
      internship: serializeInternship(internship)
    };
  });

  app.delete('/profile/internships/:id', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).safeParse(request.params);

    if (!params.success || !ObjectId.isValid(params.data.id)) {
      return reply.code(400).send({ error: 'Invalid internship id' });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    await deleteInternship(context.db, context.applicant._id, new ObjectId(params.data.id));

    return {
      deleted: true
    };
  });

  app.patch('/profile/soft-skills', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = softSkillUpdateSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid soft-skill payload', issues: parsed.error.issues });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    const output = await updateSoftSkillItems(context.db, context.applicant._id, parsed.data.items);

    return {
      softSkills: serializeSoftSkills(output)
    };
  });
}
