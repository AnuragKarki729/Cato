import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { requireSupabaseUser } from '../auth/supabaseJwt.js';
import { getDatabase } from '../db/mongo.js';
import { findApplicantBySupabaseUserId } from '../repositories/applicants.repo.js';
import {
  findApplicantSearchProfileByApplicantId,
  serializeApplicantSearchProfile,
  upsertApplicantSearchProfile
} from '../repositories/applicantSearchProfiles.repo.js';
import {
  findApplicantMatchProposals,
  findMatchProposalsByRunId,
  findRecruiterMatchProposals,
  serializeMatchProposal
} from '../repositories/matchProposals.repo.js';
import { findMatchRunById, serializeMatchRun } from '../repositories/matchRuns.repo.js';
import { normalizeMatchingOptionKey } from '../repositories/matchingOptions.repo.js';
import { findRecruiterBySupabaseUserId } from '../repositories/recruiters.repo.js';
import { addMatchingOption, listMatchingOptions } from '../services/matchingOptions.service.js';
import { auditRuntimeSearchApplicant, runMatchingForJob, runRuntimeSearchMatching } from '../services/matching.service.js';

const idParamsSchema = z.object({
  id: z.string().min(1)
});

const proposalStatusQuerySchema = z.object({
  status: z
    .enum(['suggested', 'queued', 'sent', 'held', 'rejected_by_algorithm', 'accepted_by_applicant', 'declined_by_applicant', 'expired'])
    .optional()
});

const runtimeSearchSchema = z.object({
  query: z.string().trim().min(1).max(500).optional(),
  roleTitle: z.string().trim().min(1).max(120).optional(),
  roleCategory: z.string().trim().min(1).max(80).optional(),
  targetMajors: z.array(z.string().trim().min(1).max(120)).max(30).optional(),
  targetCategories: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
  requiredSkills: z.array(z.string().trim().min(1).max(80)).max(100).optional(),
  preferredSkills: z.array(z.string().trim().min(1).max(80)).max(100).optional(),
  desiredDepth: z
    .object({
      type: z.enum(['skill', 'category']),
      id: z.string().trim().min(1).max(80)
    })
    .optional(),
  employmentType: z.enum(['internship', 'full_time', 'part_time', 'contract']).optional(),
  graduated: z.union([z.boolean(), z.enum(['true', 'false', 'any'])]).optional(),
  internationalStudent: z.union([z.boolean(), z.enum(['true', 'false', 'any'])]).optional(),
  minGpa: z.number().min(0).max(4).optional(),
  semesterNumbers: z.array(z.number().int().min(1).max(100)).max(20).optional(),
  limit: z.number().int().min(1).max(100).optional()
});

const runtimeSearchAuditSchema = runtimeSearchSchema.extend({
  applicantId: z.string().min(1)
});

const matchingOptionsQuerySchema = z.object({
  type: z.enum(['category', 'skill']).optional(),
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});

const createMatchingOptionSchema = z.object({
  type: z.enum(['category', 'skill']),
  label: z.string().trim().min(2).max(80)
});

const applicantSearchProfileSchema = z.object({
  skillIds: z.array(z.string().trim().min(1).max(80)).max(100),
  fieldIds: z.array(z.string().trim().min(1).max(80)).max(10),
  depth: z.object({
    type: z.enum(['skill', 'category']),
    id: z.string().trim().min(1).max(80)
  })
});

async function getRecruiterContext(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;

  if (!user) {
    throw new Error('Authenticated user missing after auth guard');
  }

  const db = await getDatabase();
  const recruiter = await findRecruiterBySupabaseUserId(db, user.id);

  if (!recruiter) {
    reply.code(404).send({ error: 'Recruiter account not found' });
    return null;
  }

  return { db, recruiter };
}

async function getApplicantContext(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;

  if (!user) {
    throw new Error('Authenticated user missing after auth guard');
  }

  const db = await getDatabase();
  const applicant = await findApplicantBySupabaseUserId(db, user.id);

  if (!applicant) {
    reply.code(404).send({ error: 'Applicant account not found' });
    return null;
  }

  return { db, applicant };
}

export async function matchingRoutes(app: FastifyInstance) {
  app.get('/matching/options', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsedQuery = matchingOptionsQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return reply.code(400).send({ error: 'Invalid matching options query', issues: parsedQuery.error.issues });
    }

    const db = await getDatabase();
    const options = await listMatchingOptions(db, parsedQuery.data);

    return { options };
  });

  app.post('/matching/options', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = createMatchingOptionSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid matching option payload', issues: parsed.error.issues });
    }

    const db = await getDatabase();
    const recruiter = request.user ? await findRecruiterBySupabaseUserId(db, request.user.id) : null;

    const option = await addMatchingOption(db, {
      ...parsed.data,
      ...(recruiter ? { recruiterId: recruiter._id } : {})
    });

    return { option };
  });

  app.get('/applicant/search-profile', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    const profile = await findApplicantSearchProfileByApplicantId(context.db, context.applicant._id);

    return {
      profile: profile ? serializeApplicantSearchProfile(profile) : null
    };
  });

  app.put('/applicant/search-profile', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = applicantSearchProfileSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid applicant search profile payload', issues: parsed.error.issues });
    }

    const depthId = normalizeMatchingOptionKey(parsed.data.depth.id);
    const selectedIds = parsed.data.depth.type === 'skill' ? parsed.data.skillIds : parsed.data.fieldIds;

    if (!selectedIds.some((id) => normalizeMatchingOptionKey(id) === depthId)) {
      return reply.code(400).send({ error: 'Depth must be one of the selected skills or fields' });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    const profile = await upsertApplicantSearchProfile(context.db, {
      applicantId: context.applicant._id,
      skillIds: parsed.data.skillIds,
      fieldIds: parsed.data.fieldIds,
      depth: parsed.data.depth,
      source: 'manual'
    });

    return {
      profile: serializeApplicantSearchProfile(profile)
    };
  });

  app.post('/matching/search/run', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = runtimeSearchSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid runtime search payload', issues: parsed.error.issues });
    }

    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    try {
      const result = await runRuntimeSearchMatching(context.db, context.recruiter._id, parsed.data);

      return {
        run: serializeMatchRun(result.run),
        searchSpec: result.searchSpec,
        results: result.results
      };
    } catch (error) {
      return reply.code(409).send({ error: error instanceof Error ? error.message : 'Runtime search matching failed' });
    }
  });

  app.post('/matching/search/audit', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsed = runtimeSearchAuditSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid runtime search audit payload', issues: parsed.error.issues });
    }

    if (!ObjectId.isValid(parsed.data.applicantId)) {
      return reply.code(400).send({ error: 'Invalid applicant id' });
    }

    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    const { applicantId, ...searchSpec } = parsed.data;

    try {
      return await auditRuntimeSearchApplicant(context.db, context.recruiter._id, searchSpec, new ObjectId(applicantId));
    } catch (error) {
      return reply.code(409).send({ error: error instanceof Error ? error.message : 'Runtime search audit failed' });
    }
  });

  app.post('/matching/jobs/:id/run', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);

    if (!params.success || !ObjectId.isValid(params.data.id)) {
      return reply.code(400).send({ error: 'Invalid job id' });
    }

    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    try {
      const result = await runMatchingForJob(context.db, new ObjectId(params.data.id), context.recruiter._id);

      return {
        run: serializeMatchRun(result.run),
        proposals: result.proposals.map(serializeMatchProposal)
      };
    } catch (error) {
      return reply.code(409).send({ error: error instanceof Error ? error.message : 'Matching run failed' });
    }
  });

  app.get('/matching/runs/:id', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const params = idParamsSchema.safeParse(request.params);

    if (!params.success || !ObjectId.isValid(params.data.id)) {
      return reply.code(400).send({ error: 'Invalid run id' });
    }

    const db = await getDatabase();
    const runId = new ObjectId(params.data.id);
    const [run, proposals] = await Promise.all([findMatchRunById(db, runId), findMatchProposalsByRunId(db, runId)]);

    if (!run) {
      return reply.code(404).send({ error: 'Match run not found' });
    }

    return {
      run: serializeMatchRun(run),
      proposals: proposals.map(serializeMatchProposal)
    };
  });

  app.get('/recruiter/matches', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsedQuery = proposalStatusQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return reply.code(400).send({ error: 'Invalid match query' });
    }

    const context = await getRecruiterContext(request, reply);

    if (!context) {
      return;
    }

    const proposals = await findRecruiterMatchProposals(context.db, context.recruiter._id, parsedQuery.data.status);
    return {
      matches: proposals.map(serializeMatchProposal)
    };
  });

  app.get('/applicant/matches', { preHandler: requireSupabaseUser }, async (request, reply) => {
    const parsedQuery = proposalStatusQuerySchema.safeParse(request.query);

    if (!parsedQuery.success) {
      return reply.code(400).send({ error: 'Invalid match query' });
    }

    const context = await getApplicantContext(request, reply);

    if (!context) {
      return;
    }

    const proposals = await findApplicantMatchProposals(context.db, context.applicant._id, parsedQuery.data.status);
    return {
      matches: proposals.map(serializeMatchProposal)
    };
  });
}
