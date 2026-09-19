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
  countApplicantActivitiesByType,
  findApplicantActivities,
  serializeApplicantActivity
} from '../repositories/applicantActivities.repo.js';
import {
  createApplicantProject,
  deleteApplicantProject,
  findProjectsByApplicantId,
  serializeApplicantProject,
  updateApplicantProject
} from '../repositories/projects.repo.js';
import {
  countUnreadApplicantMessages,
  createApplicantMessage,
  expireStaleInterestRequests,
  findConversationMessages,
  findInterestRequestById,
  findApplicantInterestRequests,
  markApplicantConversationRead,
  markInterestRequestViewed,
  recruiterAccountsCollection,
  respondToInterestRequest,
  serializeApplicantInterestRequest
} from '../repositories/recruiters.repo.js';
import { createAppNotification } from '../repositories/notifications.repo.js';
import {
  assertCloudinaryProfileImageBelongsToUser,
  createSignedProfileImageUpload,
  deleteCloudinaryAsset
} from '../services/cloudinary.service.js';
import { isAtLeastOnboardingStatus } from '../services/onboarding.service.js';
import { recalculateSoftSkillsFromSignal } from '../services/softSkillsScoring.service.js';
import { attachSseClient, publishRecruiterEvent } from '../services/sse.service.js';

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

const projectSchema = z.object({
  title: z.string().trim().min(1).max(120),
  type: z.enum(['built_project', 'research', 'thesis', 'video', 'writing', 'other']),
  description: z.string().trim().min(1).max(800),
  linkUrl: z.string().trim().url().max(500).optional().or(z.literal('').transform(() => undefined))
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

const interestRequestParamsSchema = z.object({
  id: z.string().min(1)
});

const interestRequestResponseSchema = z.object({
  action: z.enum(['accept', 'decline'])
});

const applicantMessageSchema = z.object({
  body: z.string().trim().min(1).max(1200)
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
  app.get('/applicant/events', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    attachSseClient(reply, context.user.id, 'applicant');
  });

  app.get('/applicant/interest-requests', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    await expireStaleInterestRequests(context.db);
    const interestRequests = await findApplicantInterestRequests(context.db, context.applicant._id);
    await Promise.all(
      interestRequests
        .filter((interestRequest) => interestRequest.status === 'sent')
        .map((interestRequest) => markInterestRequestViewed(context.db, interestRequest._id))
    );

    const serialized = await Promise.all(
      interestRequests.map(async (interestRequest) => {
        const recruiter = await recruiterAccountsCollection(context.db).findOne({ _id: interestRequest.recruiterId });
        const unreadMessageCount = await countUnreadApplicantMessages(context.db, context.applicant._id, interestRequest.recruiterId);
        return {
          ...serializeApplicantInterestRequest(
            {
              ...interestRequest,
              status: interestRequest.status === 'sent' ? 'viewed' : interestRequest.status,
              viewedAt: interestRequest.viewedAt ?? (interestRequest.status === 'sent' ? new Date() : undefined)
            },
            recruiter
          ),
          unreadMessageCount
        };
      })
    );

    return { requests: serialized };
  });

  app.get('/applicant/activity', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    const [recent, profileViews, resumeOpens, bookmarks, shortlists] = await Promise.all([
      findApplicantActivities(context.db, context.applicant._id, 8),
      countApplicantActivitiesByType(context.db, context.applicant._id, 'profile_viewed'),
      countApplicantActivitiesByType(context.db, context.applicant._id, 'resume_opened'),
      countApplicantActivitiesByType(context.db, context.applicant._id, 'bookmarked'),
      countApplicantActivitiesByType(context.db, context.applicant._id, 'shortlisted')
    ]);

    return {
      metrics: {
        profileViews,
        resumeOpens,
        bookmarks,
        shortlists
      },
      recent: recent.map(serializeApplicantActivity)
    };
  });

  app.post('/applicant/interest-requests/:id/respond', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = interestRequestParamsSchema.safeParse(request.params);
    const parsed = interestRequestResponseSchema.safeParse(request.body);

    if (!params.success || !ObjectId.isValid(params.data.id) || !parsed.success) {
      return reply.code(400).send({ error: 'Invalid interest request response' });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    const interestRequest = await respondToInterestRequest(
      context.db,
      new ObjectId(params.data.id),
      context.applicant._id,
      parsed.data.action
    );

    if (!interestRequest) {
      return reply.code(404).send({ error: 'Interest request not found' });
    }

    const recruiter = await recruiterAccountsCollection(context.db).findOne({ _id: interestRequest.recruiterId });
    if (recruiter) {
      const notificationPayload = {
        requestId: interestRequest._id.toString(),
        applicantId: context.applicant._id.toString(),
        applicantName: context.applicant.name,
        status: interestRequest.status,
        respondedAt: interestRequest.respondedAt?.toISOString()
      };
      await createAppNotification(context.db, {
        recipientSupabaseUserId: recruiter.supabaseUserId,
        role: 'recruiter',
        bucket: 'requests',
        eventName: 'interest_request_responded',
        payload: notificationPayload
      });
      publishRecruiterEvent(recruiter.supabaseUserId, 'interest_request_responded', notificationPayload);
    }

    return {
      request: serializeApplicantInterestRequest(interestRequest, recruiter)
    };
  });

  app.get('/applicant/interest-requests/:id/messages', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = interestRequestParamsSchema.safeParse(request.params);

    if (!params.success || !ObjectId.isValid(params.data.id)) {
      return reply.code(400).send({ error: 'Invalid interest request id' });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    const interestRequest = await findInterestRequestById(context.db, new ObjectId(params.data.id));

    if (!interestRequest || !interestRequest.applicantId.equals(context.applicant._id)) {
      return reply.code(404).send({ error: 'Interest request not found' });
    }

    if (interestRequest.status !== 'accepted') {
      return reply.code(409).send({ error: 'Accept the interest request before messaging opens' });
    }

    const messages = await findConversationMessages(context.db, interestRequest.recruiterId, context.applicant._id);
    await markApplicantConversationRead(context.db, interestRequest.recruiterId, context.applicant._id);

    return {
      messages: messages.map((message) => ({
        id: message._id.toString(),
        requestId: interestRequest._id.toString(),
        recruiterId: message.recruiterId.toString(),
        applicantId: message.applicantId.toString(),
        senderRole: message.senderRole ?? 'recruiter',
        isUnreadForViewer:
          (message.senderRole === 'recruiter' || !message.senderRole) &&
          !message.readByApplicantAt,
        body: message.body,
        createdAt: message.createdAt.toISOString()
      }))
    };
  });

  app.post('/applicant/interest-requests/:id/messages', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = interestRequestParamsSchema.safeParse(request.params);
    const parsed = applicantMessageSchema.safeParse(request.body);

    if (!params.success || !ObjectId.isValid(params.data.id)) {
      return reply.code(400).send({ error: 'Invalid interest request id' });
    }

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid message payload' });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    const interestRequest = await findInterestRequestById(context.db, new ObjectId(params.data.id));

    if (!interestRequest || !interestRequest.applicantId.equals(context.applicant._id)) {
      return reply.code(404).send({ error: 'Interest request not found' });
    }

    if (interestRequest.status !== 'accepted') {
      return reply.code(409).send({ error: 'Accept the interest request before messaging opens' });
    }

    await createApplicantMessage(context.db, interestRequest.recruiterId, context.applicant._id, parsed.data.body);
    const recruiter = await recruiterAccountsCollection(context.db).findOne({ _id: interestRequest.recruiterId });

    if (recruiter) {
      publishRecruiterEvent(recruiter.supabaseUserId, 'message_sent', {
        type: 'message_sent',
        requestId: interestRequest._id.toString(),
        applicantId: context.applicant._id.toString(),
        body: parsed.data.body,
        createdAt: new Date().toISOString()
      });
    }

    return { sent: true };
  });

  app.get('/profile', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    const [education, internships, projects, resume, signal, existingSoftSkills] = await Promise.all([
      findEducationProfileByApplicantId(context.db, context.applicant._id),
      findInternshipsByApplicantId(context.db, context.applicant._id),
      findProjectsByApplicantId(context.db, context.applicant._id),
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
      projects: projects.map(serializeApplicantProject),
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

  app.post('/profile/projects', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = projectSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid project payload', issues: parsed.error.issues });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    const project = await createApplicantProject(context.db, context.applicant._id, parsed.data);

    return {
      project: serializeApplicantProject(project)
    };
  });

  app.patch('/profile/projects/:id', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = projectSchema.safeParse(request.body);
    const params = z.object({ id: z.string().min(1) }).safeParse(request.params);

    if (!parsed.success || !params.success || !ObjectId.isValid(params.data.id)) {
      return reply.code(400).send({ error: 'Invalid project update payload' });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    const project = await updateApplicantProject(
      context.db,
      context.applicant._id,
      new ObjectId(params.data.id),
      parsed.data
    );

    return {
      project: serializeApplicantProject(project)
    };
  });

  app.delete('/profile/projects/:id', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).safeParse(request.params);

    if (!params.success || !ObjectId.isValid(params.data.id)) {
      return reply.code(400).send({ error: 'Invalid project id' });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    await deleteApplicantProject(context.db, context.applicant._id, new ObjectId(params.data.id));

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
