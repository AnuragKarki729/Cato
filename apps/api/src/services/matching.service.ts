import { ObjectId } from 'mongodb';
import type { Db, WithId } from 'mongodb';
import type { ApplicantDocument } from '../repositories/applicants.repo.js';
import { applicantsCollection } from '../repositories/applicants.repo.js';
import { findApplicantSearchProfileByApplicantId } from '../repositories/applicantSearchProfiles.repo.js';
import type { MatchRunStats } from '../repositories/matchRuns.repo.js';
import { completeMatchRun, createMatchRun, failMatchRun } from '../repositories/matchRuns.repo.js';
import { upsertMatchProposal } from '../repositories/matchProposals.repo.js';
import { normalizeMatchingOptionKey } from '../repositories/matchingOptions.repo.js';
import { findEducationProfileByApplicantId } from '../repositories/education.repo.js';
import { findInternshipsByApplicantId } from '../repositories/internships.repo.js';
import { findProjectsByApplicantId } from '../repositories/projects.repo.js';
import type { RecruiterJobDocument } from '../repositories/recruiterJobs.repo.js';
import { findRecruiterJobById } from '../repositories/recruiterJobs.repo.js';
import { findResumeParsedTextByApplicantId } from '../repositories/resumeParsedTexts.repo.js';
import { findResumeByApplicantId } from '../repositories/resumes.repo.js';
import { findSignalByApplicantId } from '../repositories/signals.repo.js';
import { findSoftSkillsByApplicantId } from '../repositories/softSkills.repo.js';
import { scoreDocumentsWithBm25 } from './bm25.service.js';
import type { ApplicantScoringContext } from './candidateScoring.service.js';
import { getDeterministicProfileStrength, scoreApplicantForJob } from './candidateScoring.service.js';

export type RuntimeSearchSpec = {
  query?: string;
  roleTitle?: string;
  roleCategory?: string;
  targetMajors?: string[];
  targetCategories?: string[];
  requiredSkills?: string[];
  preferredSkills?: string[];
  desiredDepth?: {
    type: 'skill' | 'category';
    id: string;
  };
  employmentType?: RecruiterJobDocument['employmentType'];
  graduated?: boolean | 'true' | 'false' | 'any';
  internationalStudent?: boolean | 'true' | 'false' | 'any';
  minGpa?: number;
  semesterNumbers?: number[];
  limit?: number;
};

function buildJobQuery(job: WithId<RecruiterJobDocument>) {
  return [
    job.title,
    job.roleCategory,
    job.searchText,
    ...job.targetMajors,
    ...job.targetCategories,
    ...job.requiredSkills,
    ...job.preferredSkills
  ]
    .filter(Boolean)
    .join(' ');
}

const technologySkillKeywords = [
  'python',
  'sql',
  'react',
  'aws',
  'javascript',
  'typescript',
  'java',
  'c++',
  'swift',
  'kotlin',
  'node',
  'api',
  'backend',
  'frontend',
  'mongodb',
  'postgres',
  'docker',
  'cloud'
];

function inferRoleTitle(query: string | undefined, fallback: string | undefined) {
  if (fallback?.trim()) {
    return fallback.trim();
  }

  const normalized = query?.toLowerCase() ?? '';

  if (normalized.includes('software engineer') || normalized.includes('software developer')) {
    return 'Software Engineer';
  }

  if (normalized.includes('data analyst')) {
    return 'Data Analyst';
  }

  if (normalized.includes('designer')) {
    return 'Designer';
  }

  if (normalized.includes('marketing')) {
    return 'Marketing';
  }

  return 'Open Role';
}

function inferRoleCategory(query: string | undefined, fallback: string | undefined) {
  if (fallback?.trim()) {
    return fallback.trim();
  }

  const normalized = query?.toLowerCase() ?? '';

  if (['software', 'developer', 'python', 'react', 'sql', 'aws', 'data', 'backend', 'frontend'].some((term) => normalized.includes(term))) {
    return 'technology';
  }

  if (['finance', 'accounting', 'business', 'marketing', 'sales'].some((term) => normalized.includes(term))) {
    return 'business';
  }

  if (['design', 'media', 'creative'].some((term) => normalized.includes(term))) {
    return 'arts_media';
  }

  return 'general';
}

function normalizeGraduated(value: RuntimeSearchSpec['graduated']) {
  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return 'any';
}

function extractSkillsFromQuery(query: string | undefined) {
  const normalized = query?.toLowerCase() ?? '';
  return technologySkillKeywords.filter((skill) => normalized.includes(skill));
}

function normalizeRuntimeSearchSpec(input: RuntimeSearchSpec) {
  const querySkills = extractSkillsFromQuery(input.query);
  const requiredSkills = Array.from(new Set([...(input.requiredSkills ?? []), ...querySkills.slice(0, 1)].map((skill) => skill.trim()).filter(Boolean)));
  const preferredSkills = Array.from(new Set([...(input.preferredSkills ?? []), ...querySkills.slice(1)].map((skill) => skill.trim()).filter(Boolean)));
  const hasRoleCategorySignal = Boolean(input.roleCategory?.trim() || input.query?.trim());
  const roleCategory = hasRoleCategorySignal ? normalizeMatchingOptionKey(inferRoleCategory(input.query, input.roleCategory)) : '';
  const targetCategories = Array.from(
    new Set([
      ...(input.targetCategories ?? []),
      ...(roleCategory ? [roleCategory] : [])
    ].map((category) => normalizeMatchingOptionKey(category)).filter(Boolean))
  );

  return {
    query: input.query?.trim(),
    roleTitle: inferRoleTitle(input.query, input.roleTitle),
    roleCategory: roleCategory || 'general',
    targetMajors: Array.from(new Set((input.targetMajors ?? []).map((major) => major.trim()).filter(Boolean))),
    targetCategories,
    requiredSkills,
    preferredSkills,
    desiredDepth: input.desiredDepth
      ? {
          type: input.desiredDepth.type,
          id: normalizeMatchingOptionKey(input.desiredDepth.id)
        }
      : undefined,
    employmentType: input.employmentType,
    graduated: normalizeGraduated(input.graduated),
    internationalStudent: input.internationalStudent ?? 'any',
    minGpa: input.minGpa,
    semesterNumbers: Array.from(new Set(input.semesterNumbers ?? [])),
    limit: Math.max(1, Math.min(100, input.limit ?? 50))
  };
}

function createSyntheticJobFromSearchSpec(spec: ReturnType<typeof normalizeRuntimeSearchSpec>, recruiterId: ObjectId): WithId<RecruiterJobDocument> {
  const now = new Date();
  const preferredSemesterRange =
    spec.semesterNumbers.length > 0
      ? undefined
      : spec.graduated === true
        ? { min: 100, max: 100 }
        : spec.graduated === false
          ? { min: 1, max: 99 }
          : undefined;

  return {
    _id: new ObjectId(),
    recruiterId,
    title: spec.roleTitle,
    roleCategory: spec.roleCategory,
    targetMajors: spec.targetMajors,
    targetCategories: spec.targetCategories,
    requiredSkills: spec.requiredSkills,
    preferredSkills: spec.preferredSkills,
    ...(spec.desiredDepth ? { desiredDepth: { type: spec.desiredDepth.type, id: normalizeMatchingOptionKey(spec.desiredDepth.id) } } : {}),
    searchText: spec.query,
    employmentType: spec.employmentType ?? 'internship',
    ...(typeof spec.minGpa === 'number' ? { minGpa: spec.minGpa } : {}),
    ...(preferredSemesterRange ? { preferredSemesterRange } : {}),
    capacity: {
      maxShortlist: spec.limit,
      maxAutoProposalsPerRun: spec.limit,
      maxActiveInterestRequests: 25
    },
    status: 'active',
    createdAt: now,
    updatedAt: now
  };
}

function buildSearchableText(context: Omit<ApplicantScoringContext, 'searchableText'>) {
  return [
    context.applicant.name,
    context.education?.universityName,
    context.education?.major,
    context.education?.minor,
    context.education?.majorFieldIds?.join(' '),
    context.education?.minorFieldIds?.join(' '),
    context.searchProfile?.skillIds.join(' '),
    context.searchProfile?.fieldIds.join(' '),
    context.searchProfile?.depth.id,
    context.resumeText,
    context.resumeExtractedSkills.join(' '),
    context.signal?.promptFieldLabel,
    context.signal?.promptTextSnapshot,
    context.signal?.tenSecondElaboration,
    ...(context.softSkills?.items ?? []).map((skill) => `${skill.label} ${skill.evidence}`),
    ...context.projects.map((project) => `${project.title} ${project.type} ${project.description} ${project.linkUrl ?? ''}`),
    ...context.internships.map((internship) => `${internship.company} ${internship.roleDepartment}`)
  ]
    .filter(Boolean)
    .join(' ');
}

function contextMatchesRuntimeFilters(context: ApplicantScoringContext, spec: ReturnType<typeof normalizeRuntimeSearchSpec>) {
  if (spec.semesterNumbers.length > 0 && (!context.education?.semesterNumber || !spec.semesterNumbers.includes(context.education.semesterNumber))) {
    return false;
  }

  if (spec.graduated === true && context.education?.semesterNumber !== 100) {
    return false;
  }

  if (spec.graduated === false && context.education?.semesterNumber === 100) {
    return false;
  }

  return true;
}

async function buildApplicantScoringContext(db: Db, typedApplicant: WithId<ApplicantDocument>) {
  const [education, resume, parsedResume, signal, softSkills, projects, internships, searchProfile] = await Promise.all([
    findEducationProfileByApplicantId(db, typedApplicant._id),
    findResumeByApplicantId(db, typedApplicant._id),
    findResumeParsedTextByApplicantId(db, typedApplicant._id),
    findSignalByApplicantId(db, typedApplicant._id),
    findSoftSkillsByApplicantId(db, typedApplicant._id),
    findProjectsByApplicantId(db, typedApplicant._id),
    findInternshipsByApplicantId(db, typedApplicant._id),
    findApplicantSearchProfileByApplicantId(db, typedApplicant._id)
  ]);
  const partialContext = {
    applicant: typedApplicant,
    education,
    resume,
    resumeText: parsedResume?.text,
    resumeExtractedSkills: parsedResume?.extractedSkills ?? [],
    signal,
    softSkills,
    projects,
    internships,
    searchProfile
  };

  return {
    ...partialContext,
    searchableText: buildSearchableText(partialContext)
  };
}

function compareScoredApplicants(
  left: { context: ApplicantScoringContext; score: ReturnType<typeof scoreApplicantForJob> },
  right: { context: ApplicantScoringContext; score: ReturnType<typeof scoreApplicantForJob> }
) {
  return (
    right.score.totalScore - left.score.totalScore ||
    getDeterministicProfileStrength(right.context) - getDeterministicProfileStrength(left.context) ||
    right.score.componentScores.projects - left.score.componentScores.projects ||
    right.context.applicant.updatedAt.getTime() - left.context.applicant.updatedAt.getTime()
  );
}

export async function runMatchingForJob(db: Db, jobId: ObjectId, recruiterId?: ObjectId) {
  const run = await createMatchRun(db, { scope: 'job', targetId: jobId });

  try {
    const job = await findRecruiterJobById(db, jobId, recruiterId);

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status !== 'active') {
      throw new Error('Only active jobs can be matched');
    }

    const applicants = await applicantsCollection(db)
      .find({ onboardingStatus: 'onboarding_complete' })
      .sort({ updatedAt: -1 })
      .limit(500)
      .toArray();
    const contexts = await Promise.all(applicants.map((applicant) => buildApplicantScoringContext(db, applicant)));
    const bm25Scores = scoreDocumentsWithBm25(
      buildJobQuery(job),
      contexts.map((context) => ({
        id: context.applicant._id.toString(),
        text: context.searchableText
      }))
    );
    const scoredApplicants = contexts
      .map((context) => ({
        context,
        score: scoreApplicantForJob(context, job, {
          bm25Score: bm25Scores.get(context.applicant._id.toString()) ?? 0
        })
      }))
      .filter((result) => result.score.blockers.length === 0)
      .sort(compareScoredApplicants);
    const selectedApplicants = scoredApplicants.slice(0, job.capacity.maxAutoProposalsPerRun);
    const proposals = await Promise.all(
      selectedApplicants.map((result, index) =>
        upsertMatchProposal(db, {
          jobId: job._id,
          recruiterId: job.recruiterId,
          applicantId: result.context.applicant._id,
          status: 'suggested',
          score: result.score,
          rankForJob: index + 1,
          rankForApplicant: index + 1,
          runId: run._id
        })
      )
    );
    const stats: MatchRunStats = {
      jobsProcessed: 1,
      applicantsConsidered: applicants.length,
      proposalsCreated: proposals.length,
      proposalsHeld: 0,
      proposalsRejected: scoredApplicants.length - selectedApplicants.length
    };
    const completedRun = await completeMatchRun(db, run._id, stats);

    return {
      run: completedRun ?? run,
      proposals
    };
  } catch (error) {
    await failMatchRun(db, run._id, error instanceof Error ? error.message : 'Matching run failed');
    throw error;
  }
}

export async function runRuntimeSearchMatching(db: Db, recruiterId: ObjectId, input: RuntimeSearchSpec) {
  const spec = normalizeRuntimeSearchSpec(input);
  const run = await createMatchRun(db, { scope: 'recruiter', targetId: recruiterId });

  try {
    const syntheticJob = createSyntheticJobFromSearchSpec(spec, recruiterId);
    const applicants = await applicantsCollection(db)
      .find({ onboardingStatus: 'onboarding_complete' })
      .sort({ updatedAt: -1 })
      .limit(500)
      .toArray();
    const contexts = (await Promise.all(applicants.map((applicant) => buildApplicantScoringContext(db, applicant)))).filter((context) =>
      contextMatchesRuntimeFilters(context, spec)
    );
    const bm25Scores = scoreDocumentsWithBm25(
      buildJobQuery(syntheticJob),
      contexts.map((context) => ({
        id: context.applicant._id.toString(),
        text: context.searchableText
      }))
    );
    const ranked = contexts
      .map((context) => ({
        applicant: {
          id: context.applicant._id.toString(),
          name: context.applicant.name,
          email: context.applicant.email,
          universityName: context.education?.universityName,
          semesterLabel: context.education?.semesterLabel,
          semesterNumber: context.education?.semesterNumber,
          gpa: context.education?.gpa,
          major: context.education?.major,
          minor: context.education?.minor
        },
        score: scoreApplicantForJob(context, syntheticJob, {
          bm25Score: bm25Scores.get(context.applicant._id.toString()) ?? 0
        })
      }))
      .filter((result) => result.score.blockers.length === 0)
      .sort((left, right) => right.score.totalScore - left.score.totalScore)
      .slice(0, spec.limit);
    const stats: MatchRunStats = {
      jobsProcessed: 0,
      applicantsConsidered: applicants.length,
      proposalsCreated: 0,
      proposalsHeld: 0,
      proposalsRejected: contexts.length - ranked.length
    };
    const completedRun = await completeMatchRun(db, run._id, stats);

    return {
      run: completedRun ?? run,
      searchSpec: spec,
      results: ranked
    };
  } catch (error) {
    await failMatchRun(db, run._id, error instanceof Error ? error.message : 'Runtime search matching failed');
    throw error;
  }
}

export async function auditRuntimeSearchApplicant(db: Db, recruiterId: ObjectId, input: RuntimeSearchSpec, applicantId: ObjectId) {
  const spec = normalizeRuntimeSearchSpec(input);
  const syntheticJob = createSyntheticJobFromSearchSpec(spec, recruiterId);
  const applicant = await applicantsCollection(db).findOne({ _id: applicantId });

  if (!applicant) {
    throw new Error('Applicant not found');
  }

  const applicants = await applicantsCollection(db)
    .find({ onboardingStatus: 'onboarding_complete' })
    .sort({ updatedAt: -1 })
    .limit(500)
    .toArray();
  const applicantIsInPool = applicants.some((candidate) => candidate._id.equals(applicantId));
  const pool = applicantIsInPool ? applicants : [applicant, ...applicants];
  const contexts = await Promise.all(pool.map((candidate) => buildApplicantScoringContext(db, candidate)));
  const targetContext = contexts.find((context) => context.applicant._id.equals(applicantId));

  if (!targetContext) {
    throw new Error('Applicant context could not be built');
  }

  const filterEligible = contextMatchesRuntimeFilters(targetContext, spec);
  const eligibleContexts = contexts.filter((context) => contextMatchesRuntimeFilters(context, spec));
  const bm25Scores = scoreDocumentsWithBm25(
    buildJobQuery(syntheticJob),
    eligibleContexts.map((context) => ({
      id: context.applicant._id.toString(),
      text: context.searchableText
    }))
  );
  const ranked = eligibleContexts
    .map((context) => ({
      context,
      score: scoreApplicantForJob(context, syntheticJob, {
        bm25Score: bm25Scores.get(context.applicant._id.toString()) ?? 0
      })
    }))
    .filter((result) => result.score.blockers.length === 0)
    .sort(compareScoredApplicants);
  const rankedIndex = ranked.findIndex((result) => result.context.applicant._id.equals(applicantId));
  const targetScore =
    rankedIndex >= 0
      ? ranked[rankedIndex].score
      : scoreApplicantForJob(targetContext, syntheticJob, {
          bm25Score: filterEligible ? (bm25Scores.get(applicantId.toString()) ?? 0) : 0
        });
  const targetCategories = syntheticJob.targetCategories.map(normalizeMatchingOptionKey).filter(Boolean);
  const desiredSkillIds = [...syntheticJob.requiredSkills, ...syntheticJob.preferredSkills].map(normalizeMatchingOptionKey).filter(Boolean);
  const manualSkillIds = targetContext.searchProfile?.skillIds ?? [];
  const manualFieldIds = targetContext.searchProfile?.fieldIds ?? [];
  const manualSkillMatches = manualSkillIds.filter((skillId) => desiredSkillIds.includes(skillId));
  const manualFieldMatches = manualFieldIds.filter((fieldId) => targetCategories.includes(fieldId));
  const depth = targetContext.searchProfile?.depth;
  const desiredDepth = syntheticJob.desiredDepth;
  const depthMatch =
    Boolean(depth && desiredDepth && depth.type === desiredDepth.type && normalizeMatchingOptionKey(depth.id) === normalizeMatchingOptionKey(desiredDepth.id));

  return {
    searchSpec: spec,
    applicant: {
      id: targetContext.applicant._id.toString(),
      name: targetContext.applicant.name,
      email: targetContext.applicant.email,
      onboardingStatus: targetContext.applicant.onboardingStatus,
      universityName: targetContext.education?.universityName,
      semesterLabel: targetContext.education?.semesterLabel,
      semesterNumber: targetContext.education?.semesterNumber,
      gpa: targetContext.education?.gpa,
      major: targetContext.education?.major,
      minor: targetContext.education?.minor
    },
    eligibility: {
      inRuntimePool: applicantIsInPool,
      passesRuntimeFilters: filterEligible,
      hasScoreBlockers: targetScore.blockers.length > 0,
      includedInRankedResults: rankedIndex >= 0,
      rank: rankedIndex >= 0 ? rankedIndex + 1 : null,
      totalEligibleCandidates: eligibleContexts.length,
      totalRankedCandidates: ranked.length
    },
    searchInputsPresent: {
      resumeUploaded: Boolean(targetContext.resume?.secureUrl || targetContext.resume?.previewUrl),
      resumeTextReady: Boolean(targetContext.resumeText?.trim()),
      resumeExtractedSkillsCount: targetContext.resumeExtractedSkills.length,
      manualSearchProfileReady: Boolean(targetContext.searchProfile),
      manualSkillCount: manualSkillIds.length,
      manualFieldCount: manualFieldIds.length,
      depthReady: Boolean(depth),
      projectCount: targetContext.projects.length,
      internshipCount: targetContext.internships.length,
      softSkillCount: targetContext.softSkills?.items.length ?? 0
    },
    manualSearchContribution: {
      skillMatches: manualSkillMatches,
      fieldMatches: manualFieldMatches,
      depthMatch,
      contributesToSearchText: manualSkillIds.length > 0 || manualFieldIds.length > 0 || Boolean(depth?.id)
    },
    score: targetScore,
    verificationNotes: [
      ...(targetContext.searchProfile ? ['Manual search profile is loaded into applicant scoring context'] : ['Manual search profile is missing']),
      ...(manualSkillMatches.length > 0 ? ['Manual skills matched runtime search skills'] : []),
      ...(manualFieldMatches.length > 0 ? ['Manual fields matched runtime target categories'] : []),
      ...(depthMatch ? ['Applicant depth matched recruiter desired depth'] : []),
      ...(targetContext.resumeText?.trim() ? ['Parsed resume text is available for resume relevance scoring'] : ['Parsed resume text is missing']),
      ...(rankedIndex >= 0 ? ['Applicant appears in ranked runtime search results'] : ['Applicant does not appear in ranked runtime search results'])
    ]
  };
}
