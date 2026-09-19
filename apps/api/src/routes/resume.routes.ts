import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireSupabaseUser } from '../auth/supabaseJwt.js';
import { getDatabase } from '../db/mongo.js';
import { findApplicantBySupabaseUserId, updateApplicantOnboardingStatus } from '../repositories/applicants.repo.js';
import {
  deleteResumeParsedTextByApplicantId,
  findResumeParsedTextByApplicantId,
  serializeResumeParsedText,
  upsertResumeParsedText
} from '../repositories/resumeParsedTexts.repo.js';
import {
  deleteResumeByApplicantId,
  findResumeByApplicantId,
  markResumeSkipped,
  saveUploadedResume,
  serializeResume
} from '../repositories/resumes.repo.js';
import { saveDummySoftSkills } from '../repositories/softSkills.repo.js';
import {
  deleteCloudinaryAsset,
  uploadResumeToCloudinary
} from '../services/cloudinary.service.js';
import { isAtLeastOnboardingStatus } from '../services/onboarding.service.js';
import { generateDummySoftSkills } from '../services/softSkillsDummy.service.js';

const maxResumeBytes = 10 * 1024 * 1024;

const uploadResumeSchema = z.object({
  dataUri: z.string().startsWith('data:application/pdf;base64,'),
  originalFileName: z.string().min(1).refine((fileName) => fileName.toLowerCase().endsWith('.pdf'), {
    message: 'Resume must be a PDF file'
  }),
  fileType: z.literal('pdf'),
  fileSizeBytes: z.number().int().positive().max(maxResumeBytes)
});

const parsedResumeTextSchema = z.object({
  text: z.string().trim().min(1).max(200_000),
  parser: z.enum(['client', 'manual', 'unknown']).optional(),
  sourceFileName: z.string().trim().min(1).max(240).optional(),
  extractedSkills: z.array(z.string().trim().min(1).max(80)).max(200).optional()
});

function getResumeParseStatus(resume: Awaited<ReturnType<typeof findResumeByApplicantId>>, hasParsedText: boolean) {
  if (!resume || resume.softSkillGenerationStatus === 'skipped') {
    return 'none';
  }

  return hasParsedText ? 'ready' : 'needs_extraction';
}

export async function resumeRoutes(app: FastifyInstance) {
  app.post('/onboarding/resume/skip', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const user = request.user;

    if (!user) {
      throw new Error('Authenticated user missing after auth guard');
    }

    const db = await getDatabase();
    const applicant = await findApplicantBySupabaseUserId(db, user.id);

    if (!applicant) {
      return reply.code(404).send({ error: 'Applicant not found' });
    }

    if (!isAtLeastOnboardingStatus(applicant.onboardingStatus, 'education_complete')) {
      return reply.code(409).send({ error: 'Complete education before resume' });
    }

    const resume = await markResumeSkipped(db, applicant._id);
    const dummyItems = generateDummySoftSkills(`${user.id}:no-resume`);

    await saveDummySoftSkills(db, applicant._id, dummyItems);
    await updateApplicantOnboardingStatus(db, user.id, 'resume_complete');

    return {
      resume: serializeResume(resume)
    };
  });

  app.post('/resume/upload', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const user = request.user;

    if (!user) {
      throw new Error('Authenticated user missing after auth guard');
    }

    const parsed = uploadResumeSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid resume payload', issues: parsed.error.issues });
    }

    const db = await getDatabase();
    const applicant = await findApplicantBySupabaseUserId(db, user.id);

    if (!applicant) {
      return reply.code(404).send({ error: 'Applicant not found' });
    }

    if (!isAtLeastOnboardingStatus(applicant.onboardingStatus, 'education_complete')) {
      return reply.code(409).send({ error: 'Complete education before resume' });
    }

    if (!applicant.resumeConsentAcceptedAt || !applicant.privacyPolicyAcknowledgedAt) {
      return reply.code(403).send({ error: 'Resume upload requires resume consent and privacy acknowledgement' });
    }

    const existingResume = await findResumeByApplicantId(db, applicant._id);
    const upload = await uploadResumeToCloudinary({
      dataUri: parsed.data.dataUri,
      supabaseUserId: user.id
    });
    if (existingResume?.cloudinaryPublicId) {
      await deleteCloudinaryAsset(existingResume.cloudinaryPublicId, 'raw');
    }

    if (
      existingResume?.previewCloudinaryPublicId &&
      existingResume.previewCloudinaryPublicId !== existingResume.cloudinaryPublicId
    ) {
      await deleteCloudinaryAsset(existingResume.previewCloudinaryPublicId, 'raw');
    }

    const resume = await saveUploadedResume(db, {
      applicantId: applicant._id,
      cloudinaryPublicId: upload.public_id,
      secureUrl: upload.secure_url,
      previewCloudinaryPublicId: upload.public_id,
      previewUrl: upload.secure_url,
      previewFileType: 'pdf',
      originalFileName: parsed.data.originalFileName,
      fileType: parsed.data.fileType,
      fileSizeBytes: parsed.data.fileSizeBytes
    });
    await deleteResumeParsedTextByApplicantId(db, applicant._id);
    const dummyItems = generateDummySoftSkills(`${user.id}:${parsed.data.originalFileName}`);

    await saveDummySoftSkills(db, applicant._id, dummyItems);
    await updateApplicantOnboardingStatus(db, user.id, 'resume_complete');

    return {
      resume: serializeResume(resume)
    };
  });

  app.get('/resume', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const user = request.user;

    if (!user) {
      throw new Error('Authenticated user missing after auth guard');
    }

    const db = await getDatabase();
    const applicant = await findApplicantBySupabaseUserId(db, user.id);

    if (!applicant) {
      return reply.code(404).send({ error: 'Applicant not found' });
    }

    const [resume, parsedText] = await Promise.all([
      findResumeByApplicantId(db, applicant._id),
      findResumeParsedTextByApplicantId(db, applicant._id)
    ]);

    return {
      resume: resume ? serializeResume(resume) : null,
      parseStatus: getResumeParseStatus(resume, Boolean(parsedText)),
      parsedTextUpdatedAt: parsedText?.updatedAt.toISOString()
    };
  });

  app.post('/resume/parsed-text', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const user = request.user;

    if (!user) {
      throw new Error('Authenticated user missing after auth guard');
    }

    const parsed = parsedResumeTextSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid parsed resume text payload', issues: parsed.error.issues });
    }

    const db = await getDatabase();
    const applicant = await findApplicantBySupabaseUserId(db, user.id);

    if (!applicant) {
      return reply.code(404).send({ error: 'Applicant not found' });
    }

    const resume = await findResumeByApplicantId(db, applicant._id);

    if (!resume) {
      return reply.code(409).send({ error: 'Upload a resume before saving parsed text' });
    }

    const parsedText = await upsertResumeParsedText(db, {
      applicantId: applicant._id,
      resumeId: resume._id,
      text: parsed.data.text,
      parser: parsed.data.parser ?? 'client',
      sourceFileName: parsed.data.sourceFileName ?? resume.originalFileName,
      extractedSkills: Array.from(new Set((parsed.data.extractedSkills ?? []).map((skill) => skill.trim()).filter(Boolean)))
    });

    return {
      parsedText: serializeResumeParsedText(parsedText)
    };
  });

  app.delete('/resume', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const user = request.user;

    if (!user) {
      throw new Error('Authenticated user missing after auth guard');
    }

    const db = await getDatabase();
    const applicant = await findApplicantBySupabaseUserId(db, user.id);

    if (!applicant) {
      return reply.code(404).send({ error: 'Applicant not found' });
    }

    const resume = await findResumeByApplicantId(db, applicant._id);

    if (resume?.cloudinaryPublicId) {
      await deleteCloudinaryAsset(resume.cloudinaryPublicId, 'raw');
    }

    if (resume?.previewCloudinaryPublicId && resume.previewCloudinaryPublicId !== resume.cloudinaryPublicId) {
      await deleteCloudinaryAsset(resume.previewCloudinaryPublicId, 'raw');
    }

    await deleteResumeByApplicantId(db, applicant._id);
    await deleteResumeParsedTextByApplicantId(db, applicant._id);
    await saveDummySoftSkills(db, applicant._id, generateDummySoftSkills(`${user.id}:resume-deleted`));

    return {
      deleted: true
    };
  });
}
