import type { WithId } from 'mongodb';
import type { ApplicantDocument } from '../repositories/applicants.repo.js';
import type { ApplicantSearchProfileDocument } from '../repositories/applicantSearchProfiles.repo.js';
import type { EducationProfileDocument } from '../repositories/education.repo.js';
import type { InternshipDocument } from '../repositories/internships.repo.js';
import { normalizeMatchingOptionKey } from '../repositories/matchingOptions.repo.js';
import type { ApplicantJobScore } from '../repositories/matchProposals.repo.js';
import type { ApplicantProjectDocument } from '../repositories/projects.repo.js';
import type { RecruiterJobDocument } from '../repositories/recruiterJobs.repo.js';
import type { ResumeDocument } from '../repositories/resumes.repo.js';
import type { ApplicantSignalDocument } from '../repositories/signals.repo.js';
import type { SoftSkillOutputDocument } from '../repositories/softSkills.repo.js';
import { tokenizeSearchText } from './bm25.service.js';

export type ApplicantScoringContext = {
  applicant: WithId<ApplicantDocument>;
  education?: WithId<EducationProfileDocument> | null;
  resume?: WithId<ResumeDocument> | null;
  resumeText?: string;
  resumeExtractedSkills: string[];
  signal?: WithId<ApplicantSignalDocument> | null;
  softSkills?: WithId<SoftSkillOutputDocument> | null;
  projects: Array<WithId<ApplicantProjectDocument>>;
  internships: Array<WithId<InternshipDocument>>;
  searchProfile?: WithId<ApplicantSearchProfileDocument> | null;
  searchableText: string;
};

function normalize(value: string | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function containsAny(haystack: string | undefined, needles: string[]) {
  const normalizedHaystack = normalize(haystack);
  return needles.some((needle) => normalizedHaystack.includes(normalize(needle)));
}

function getCategoryRank(context: ApplicantScoringContext, job: WithId<RecruiterJobDocument>) {
  const targetCategories = job.targetCategories.map(normalizeMatchingOptionKey).filter(Boolean);

  if (targetCategories.length === 0) {
    return 0;
  }

  const majorFieldIds = context.education?.majorFieldIds ?? [];
  const minorFieldIds = context.education?.minorFieldIds ?? [];
  const manualFieldIds = context.searchProfile?.fieldIds ?? [];
  const promptFieldId = context.signal?.promptFieldId;

  if (targetCategories.some((category) => majorFieldIds.map(normalizeMatchingOptionKey).includes(category))) {
    return 3;
  }

  if (targetCategories.some((category) => minorFieldIds.map(normalizeMatchingOptionKey).includes(category) || manualFieldIds.includes(category))) {
    return 2;
  }

  if (promptFieldId && targetCategories.includes(normalizeMatchingOptionKey(promptFieldId))) {
    return 1;
  }

  return 0;
}

function getMajorRank(context: ApplicantScoringContext, job: WithId<RecruiterJobDocument>) {
  if (job.targetMajors.length === 0) {
    return 0;
  }

  if (containsAny(context.education?.major, job.targetMajors)) {
    return 2;
  }

  if (containsAny(context.education?.minor, job.targetMajors)) {
    return 1;
  }

  return 0;
}

function getSelectedSkillMatches(context: ApplicantScoringContext, job: WithId<RecruiterJobDocument>) {
  const selectedSkills = Array.from(
    new Set([...job.requiredSkills, ...job.preferredSkills].map(normalizeMatchingOptionKey).filter(Boolean))
  );

  if (selectedSkills.length === 0) {
    return {
      selectedCount: 0,
      matchedCount: 0
    };
  }

  const profileSkillIds = new Set([
    ...(context.searchProfile?.skillIds ?? []),
    ...context.resumeExtractedSkills.map(normalizeMatchingOptionKey)
  ]);
  const searchableText = normalize(context.searchableText);
  const matchedCount = selectedSkills.filter((skill) => {
    const phrase = skill.replace(/_/g, ' ');
    return profileSkillIds.has(skill) || (phrase.length > 1 && searchableText.includes(phrase));
  }).length;

  return {
    selectedCount: selectedSkills.length,
    matchedCount
  };
}

export function getDeterministicProfileStrength(context: ApplicantScoringContext) {
  const coreSignals =
    (context.resume?.secureUrl || context.resume?.previewUrl ? 20 : 0) +
    (context.signal?.tenSecondVideo?.secureUrl ? 20 : 0) +
    (context.signal?.thirtySecondVideo?.secureUrl ? 15 : 0) +
    (context.signal?.tenSecondElaboration?.trim() ? 10 : 0) +
    ((context.softSkills?.items.length ?? 0) > 0 ? 5 : 0);
  const projectSignals = context.projects.length === 0 ? 0 : context.projects.length === 1 ? 10 : context.projects.length === 2 ? 17 : 20;
  const internshipSignals = context.internships.length > 0 ? 10 : 0;

  return Math.min(100, coreSignals + projectSignals + internshipSignals);
}

function getFilterScore(context: ApplicantScoringContext, job: WithId<RecruiterJobDocument>, blockers: string[], reasons: string[]) {
  const checks: boolean[] = [];
  const categoryRank = getCategoryRank(context, job);
  const majorRank = getMajorRank(context, job);
  const skillMatches = getSelectedSkillMatches(context, job);

  if (job.targetCategories.length > 0) {
    checks.push(categoryRank > 0);
    if (categoryRank > 0) {
      reasons.push('Education, manual profile, or signal category fits this role');
    }
  }

  if (job.targetMajors.length > 0) {
    checks.push(majorRank > 0);
    if (majorRank > 0) {
      reasons.push(majorRank === 2 ? 'Major matches target major' : 'Minor matches target major');
    }
  }

  if (skillMatches.selectedCount > 0) {
    checks.push(skillMatches.matchedCount > 0);
    if (skillMatches.matchedCount > 0) {
      reasons.push(
        `${skillMatches.matchedCount} selected skill${skillMatches.matchedCount === 1 ? '' : 's'} match the applicant profile`
      );
    }
  }

  if (typeof job.minGpa === 'number') {
    const meetsGpa = typeof context.education?.gpa === 'number' && context.education.gpa >= job.minGpa;
    checks.push(meetsGpa);
    if (meetsGpa) {
      reasons.push(`GPA ${context.education?.gpa?.toFixed(2)} meets the minimum ${job.minGpa.toFixed(2)}`);
    } else {
      blockers.push(`GPA does not meet the minimum ${job.minGpa.toFixed(2)}`);
    }
  }

  if (job.preferredSemesterRange) {
    const semester = context.education?.semesterNumber;
    const min = job.preferredSemesterRange.min ?? Number.NEGATIVE_INFINITY;
    const max = job.preferredSemesterRange.max ?? Number.POSITIVE_INFINITY;
    const inRange = typeof semester === 'number' && semester >= min && semester <= max;
    checks.push(inRange);
    if (inRange) {
      reasons.push('Semester is inside the preferred range');
    } else {
      blockers.push('Semester is outside the preferred range');
    }
  }

  if (checks.length === 0) {
    return 72;
  }

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function getProjectScore(context: ApplicantScoringContext, job: WithId<RecruiterJobDocument>, reasons: string[]) {
  if (context.projects.length === 0) {
    return 0;
  }

  const roleTerms = tokenizeSearchText([job.title, job.roleCategory, ...job.requiredSkills, ...job.preferredSkills].join(' '));
  const matchingProjects = context.projects.filter((project) =>
    roleTerms.some((term) => tokenizeSearchText([project.title, project.type, project.description].join(' ')).includes(term))
  );
  const countScore = context.projects.length === 1 ? 45 : context.projects.length === 2 ? 70 : 85;
  const linkBoost = context.projects.some((project) => project.linkUrl) ? 10 : 0;
  const matchBoost = Math.min(15, matchingProjects.length * 8);

  reasons.push(`${context.projects.length} project${context.projects.length === 1 ? '' : 's'} listed`);

  if (matchingProjects.length > 0) {
    reasons.push(`${matchingProjects.length} project${matchingProjects.length === 1 ? '' : 's'} contain role-relevant keywords`);
  }

  return Math.min(100, countScore + linkBoost + matchBoost);
}

function getInternshipScore(context: ApplicantScoringContext, job: WithId<RecruiterJobDocument>, reasons: string[]) {
  if (context.internships.length === 0) {
    return 0;
  }

  const roleTerms = tokenizeSearchText([job.title, job.roleCategory, ...job.requiredSkills, ...job.preferredSkills].join(' '));
  const matchingInternships = context.internships.filter((internship) =>
    roleTerms.some((term) => tokenizeSearchText([internship.company, internship.roleDepartment].join(' ')).includes(term))
  );

  reasons.push('Internship experience is present');

  if (matchingInternships.length > 0) {
    reasons.push('Internship role/department overlaps with role keywords');
  }

  return Math.min(100, 70 + Math.min(20, matchingInternships.length * 10));
}

function getSoftSkillScore(context: ApplicantScoringContext, reasons: string[]) {
  const items = context.softSkills?.items ?? [];

  if (items.length === 0) {
    return 0;
  }

  const average = items.reduce((total, item) => total + item.rating, 0) / items.length;
  const strongest = [...items].sort((left, right) => right.rating - left.rating)[0];

  if (strongest) {
    reasons.push(`${strongest.label} is the strongest soft-skill signal`);
  }

  return Math.round(Math.max(0, Math.min(100, (average / 5) * 100)));
}

function getDepthScore(context: ApplicantScoringContext, job: WithId<RecruiterJobDocument>, reasons: string[]) {
  if (!job.desiredDepth || !context.searchProfile?.depth) {
    return 0;
  }

  const jobDepthId = normalizeMatchingOptionKey(job.desiredDepth.id);
  const applicantDepth = context.searchProfile.depth;

  if (applicantDepth.type === job.desiredDepth.type && applicantDepth.id === jobDepthId) {
    reasons.push('Primary depth matches what the recruiter is looking for');
    return 100;
  }

  const applicantHasSelectedSignal =
    job.desiredDepth.type === 'skill'
      ? context.searchProfile.skillIds.includes(jobDepthId)
      : context.searchProfile.fieldIds.includes(jobDepthId);

  if (applicantHasSelectedSignal) {
    reasons.push('Applicant has the requested depth area in their broader profile');
    return 55;
  }

  return 0;
}

function getFreshnessScore(context: ApplicantScoringContext, reasons: string[]) {
  const ageDays = Math.max(0, (Date.now() - context.applicant.updatedAt.getTime()) / (24 * 60 * 60 * 1000));

  if (ageDays <= 14) {
    reasons.push('Profile was updated recently');
    return 100;
  }

  if (ageDays <= 45) {
    return 70;
  }

  if (ageDays <= 90) {
    return 45;
  }

  return 20;
}

export function scoreApplicantForJob(
  context: ApplicantScoringContext,
  job: WithId<RecruiterJobDocument>,
  input: {
    bm25Score: number;
  }
): ApplicantJobScore {
  const reasons: string[] = [];
  const blockers: string[] = [];
  const filters = getFilterScore(context, job, blockers, reasons);
  const profileStrength = getDeterministicProfileStrength(context);
  const projects = getProjectScore(context, job, reasons);
  const internships = getInternshipScore(context, job, reasons);
  const softSkills = getSoftSkillScore(context, reasons);
  const depth = getDepthScore(context, job, reasons);
  const freshness = getFreshnessScore(context, reasons);

  if (input.bm25Score > 0) {
    reasons.push('Resume/profile text overlaps with role keywords');
  }

  if (profileStrength >= 70) {
    reasons.push('Profile includes the core application signals');
  }

  const totalScore = Math.round(
    input.bm25Score * 0.26 +
      filters * 0.24 +
      profileStrength * 0.22 +
      projects * 0.13 +
      internships * 0.05 +
      softSkills * 0.05 +
      freshness * 0.03 +
      depth * 0.02
  );

  return {
    applicantId: context.applicant._id.toString(),
    jobId: job._id.toString(),
    totalScore: Math.max(0, Math.min(100, totalScore)),
    componentScores: {
      bm25: input.bm25Score,
      filters,
      profileStrength,
      projects,
      internships,
      softSkills,
      freshness
    },
    reasons: Array.from(new Set(reasons)).slice(0, 8),
    blockers: Array.from(new Set(blockers))
  };
}
