import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireSupabaseUser } from '../auth/supabaseJwt.js';
import { getDatabase } from '../db/mongo.js';
import { findApplicantBySupabaseUserId, updateApplicantOnboardingStatus } from '../repositories/applicants.repo.js';
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
  uploadResumePreviewPdfToCloudinary,
  uploadResumeToCloudinary
} from '../services/cloudinary.service.js';
import { isAtLeastOnboardingStatus } from '../services/onboarding.service.js';
import { convertResumeDataUriToPdfDataUri } from '../services/resumeConversion.service.js';
import { generateDummySoftSkills } from '../services/softSkillsDummy.service.js';

const maxResumeBytes = 10 * 1024 * 1024;

const uploadResumeSchema = z.object({
  dataUri: z.string().min(1),
  originalFileName: z.string().min(1),
  fileType: z.enum(['pdf', 'doc', 'docx']),
  fileSizeBytes: z.number().int().positive().max(maxResumeBytes)
});

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
    let previewUpload: Awaited<ReturnType<typeof uploadResumePreviewPdfToCloudinary>> | null = null;

    try {
      previewUpload =
        parsed.data.fileType === 'pdf'
          ? null
          : await uploadResumePreviewPdfToCloudinary({
              dataUri: await convertResumeDataUriToPdfDataUri(parsed.data.dataUri, parsed.data.fileType),
              publicId: `${upload.public_id.split('/').pop() ?? 'resume'}_preview`,
              supabaseUserId: user.id
            });
    } catch (conversionError) {
      await deleteCloudinaryAsset(upload.public_id, 'raw');
      throw conversionError;
    }

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
      previewCloudinaryPublicId: previewUpload?.public_id ?? upload.public_id,
      previewUrl: previewUpload?.secure_url ?? upload.secure_url,
      previewFileType: 'pdf',
      originalFileName: parsed.data.originalFileName,
      fileType: parsed.data.fileType,
      fileSizeBytes: parsed.data.fileSizeBytes
    });
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

    const resume = await findResumeByApplicantId(db, applicant._id);

    return {
      resume: resume ? serializeResume(resume) : null
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
    await saveDummySoftSkills(db, applicant._id, generateDummySoftSkills(`${user.id}:resume-deleted`));

    return {
      deleted: true
    };
  });
}
