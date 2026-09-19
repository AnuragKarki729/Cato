import { ObjectId } from 'mongodb';
import type { Db, WithId } from 'mongodb';
import type { ApplicantDocument } from '../repositories/applicants.repo.js';
import { applicantsCollection } from '../repositories/applicants.repo.js';
import { academicFields } from '../data/academicFields.js';
import { findEducationProfileByApplicantId } from '../repositories/education.repo.js';
import { findInternshipsByApplicantId, serializeInternship } from '../repositories/internships.repo.js';
import { findResumeByApplicantId } from '../repositories/resumes.repo.js';
import { findSignalByApplicantId } from '../repositories/signals.repo.js';
import { findSoftSkillsByApplicantId } from '../repositories/softSkills.repo.js';
import { findProjectsByApplicantId, serializeApplicantProject } from '../repositories/projects.repo.js';
import {
  findRecruiterCandidateReview,
  findRecruiterInterestRequest,
  getInterestRequestResendAvailableAt,
  isCandidateBookmarked,
  serializeRecruiterCandidateReview
} from '../repositories/recruiters.repo.js';

export type RecruiterCandidateFilters = {
  bookmarkedOnly?: boolean;
  gpaMax?: number;
  gpaMin?: number;
  hasInternship?: boolean;
  interestStatus?: 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  major?: string;
  majors?: string[];
  categoryFieldId?: string;
  categoryFieldIds?: string[];
  query?: string;
  reviewStatus?: 'none' | 'maybe' | 'shortlisted' | 'passed';
  semesterNumber?: number;
  semesterNumbers?: number[];
  university?: string;
  universities?: string[];
};

function getProfileImageUrl(applicant: WithId<ApplicantDocument>, signal: Awaited<ReturnType<typeof findSignalByApplicantId>>) {
  if (applicant.profileImage?.source === 'uploaded') {
    return applicant.profileImage.secureUrl;
  }

  if (applicant.profileImage?.source === 'thirty_second_video') {
    return signal?.thirtySecondVideo?.thumbnailUrl;
  }

  return signal?.tenSecondVideo?.thumbnailUrl;
}

export async function serializeRecruiterCandidate(
  db: Db,
  applicant: WithId<ApplicantDocument>,
  recruiterId: ObjectId,
  options: { includeDetailAssets?: boolean } = {}
) {
  const includeDetailAssets = Boolean(options.includeDetailAssets);
  const [education, internships, projects, resume, signal, softSkills, bookmarked, review, interestRequest] = await Promise.all([
    findEducationProfileByApplicantId(db, applicant._id),
    findInternshipsByApplicantId(db, applicant._id),
    findProjectsByApplicantId(db, applicant._id),
    findResumeByApplicantId(db, applicant._id),
    findSignalByApplicantId(db, applicant._id),
    findSoftSkillsByApplicantId(db, applicant._id),
    isCandidateBookmarked(db, recruiterId, applicant._id),
    findRecruiterCandidateReview(db, recruiterId, applicant._id),
    findRecruiterInterestRequest(db, recruiterId, applicant._id)
  ]);

  return {
    id: applicant._id.toString(),
    applicantId: applicant._id.toString(),
    name: applicant.name,
    universityName: education?.universityName,
    semesterLabel: education?.semesterLabel,
    semesterNumber: education?.semesterNumber,
    gpa: education?.gpa,
    major: education?.major,
    majorFieldIds: education?.majorFieldIds ?? [],
    minor: education?.minor,
    minorFieldIds: education?.minorFieldIds ?? [],
    promptFieldId: signal?.promptFieldId,
    promptFieldLabel: signal?.promptFieldLabel,
    profileImageUrl: getProfileImageUrl(applicant, signal),
    promptTextSnapshot: signal?.promptTextSnapshot,
    tenSecondElaboration: signal?.tenSecondElaboration,
    signalSummary: signal?.tenSecondElaboration,
    tenSecondVideoUrl: signal?.tenSecondVideo?.secureUrl,
    hasResume: Boolean(resume?.secureUrl || resume?.previewUrl),
    hasDeeperSignal: Boolean(signal?.thirtySecondVideo?.secureUrl),
    ...(includeDetailAssets
      ? {
          thirtySecondVideoUrl: signal?.thirtySecondVideo?.secureUrl,
          resumeUrl: resume?.secureUrl,
          resumePreviewUrl: resume?.previewUrl ?? resume?.secureUrl,
          resumeFileName: resume?.originalFileName
        }
      : {}),
    softSkills: softSkills?.items ?? [],
    internships: internships.map((internship) => {
      const serialized = serializeInternship(internship);
      return {
        id: serialized.id,
        company: serialized.company,
        durationMonths: serialized.durationMonths,
        roleDepartment: serialized.roleDepartment
      };
    }),
    projects: projects.map((project) => {
      const serialized = serializeApplicantProject(project);
      return {
        id: serialized.id,
        title: serialized.title,
        type: serialized.type,
        description: serialized.description,
        linkUrl: serialized.linkUrl
      };
    }),
    bookmarked,
    review: review ? serializeRecruiterCandidateReview(review) : undefined,
    interestRequestStatus: interestRequest?.status,
    interestRequestExpiresAt: interestRequest?.expiresAt?.toISOString(),
    interestRequestResendAvailableAt: interestRequest ? getInterestRequestResendAvailableAt(interestRequest)?.toISOString() : undefined
  };
}

type RecruiterCandidateBase = Awaited<ReturnType<typeof serializeRecruiterCandidate>>;
type RecruiterCandidateEvidence = {
  id: string;
  type: 'education' | 'resume' | 'signal' | 'soft_skill' | 'project' | 'internship' | 'filter';
  title: string;
  body: string;
  strength: 'strong' | 'moderate' | 'light';
};

type RecruiterCandidateValidation = {
  id: string;
  title: string;
  body: string;
};

function includesNormalized(value: string | undefined, query: string | undefined) {
  const normalizedQuery = query?.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return Boolean(value?.toLowerCase().includes(normalizedQuery));
}

function includesAnyNormalized(value: string | undefined, queries: string[] | undefined) {
  const normalizedQueries = (queries ?? []).map((query) => query.trim().toLowerCase()).filter(Boolean);

  if (normalizedQueries.length === 0) {
    return true;
  }

  const normalizedValue = value?.toLowerCase() ?? '';
  return normalizedQueries.some((query) => normalizedValue.includes(query));
}

function getCategoryFieldIds(filters: Pick<RecruiterCandidateFilters, 'categoryFieldId' | 'categoryFieldIds'>) {
  return Array.from(new Set([...(filters.categoryFieldIds ?? []), filters.categoryFieldId].filter((value): value is string => Boolean(value))));
}

function candidateMatchesQuery(candidate: Awaited<ReturnType<typeof serializeRecruiterCandidate>>, query?: string) {
  const normalizedQuery = query?.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const haystack = [
    candidate.name,
    candidate.universityName,
    candidate.semesterLabel,
    candidate.major,
    candidate.minor,
    candidate.promptTextSnapshot,
    candidate.tenSecondElaboration,
    candidate.signalSummary,
    ...candidate.softSkills.map((skill) => `${skill.label} ${skill.rating}`),
    ...candidate.projects.map((project) => [project.title, project.type, project.description, project.linkUrl].filter(Boolean).join(' ')),
    ...candidate.internships.map((internship) =>
      [internship.company, internship.roleDepartment, String(internship.durationMonths)].filter(Boolean).join(' ')
    )
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(normalizedQuery);
}

function candidateMatchesFilters(candidate: Awaited<ReturnType<typeof serializeRecruiterCandidate>>, filters: RecruiterCandidateFilters) {
  if (!candidateMatchesQuery(candidate, filters.query)) {
    return false;
  }

  if (!includesNormalized(candidate.universityName, filters.university) || !includesAnyNormalized(candidate.universityName, filters.universities)) {
    return false;
  }

  if (!includesNormalized(candidate.major, filters.major) || !includesAnyNormalized(candidate.major, filters.majors)) {
    return false;
  }

  const categoryFieldIds = getCategoryFieldIds(filters);
  if (
    categoryFieldIds.length > 0 &&
    !categoryFieldIds.some(
      (categoryFieldId) =>
        candidate.majorFieldIds.includes(categoryFieldId) ||
        candidate.minorFieldIds.includes(categoryFieldId) ||
        candidate.promptFieldId === categoryFieldId
    )
  ) {
    return false;
  }

  if (filters.semesterNumber && candidate.semesterNumber !== filters.semesterNumber) {
    return false;
  }

  if (
    filters.semesterNumbers &&
    filters.semesterNumbers.length > 0 &&
    (!candidate.semesterNumber || !filters.semesterNumbers.includes(candidate.semesterNumber))
  ) {
    return false;
  }

  if (typeof filters.gpaMin === 'number' && (typeof candidate.gpa !== 'number' || candidate.gpa < filters.gpaMin)) {
    return false;
  }

  if (typeof filters.gpaMax === 'number' && (typeof candidate.gpa !== 'number' || candidate.gpa > filters.gpaMax)) {
    return false;
  }

  if (typeof filters.hasInternship === 'boolean' && (candidate.internships.length > 0) !== filters.hasInternship) {
    return false;
  }

  if (filters.interestStatus && candidate.interestRequestStatus !== filters.interestStatus) {
    return false;
  }

  if (filters.bookmarkedOnly && !candidate.bookmarked) {
    return false;
  }

  if (filters.reviewStatus && (candidate.review?.status ?? 'none') !== filters.reviewStatus) {
    return false;
  }

  return true;
}

export async function findRecruiterCandidates(db: Db, recruiterId: ObjectId, filters: RecruiterCandidateFilters = {}) {
  const applicants = await applicantsCollection(db)
    .find({ onboardingStatus: 'onboarding_complete' })
    .sort({ updatedAt: -1 })
    .limit(200)
    .toArray();

  const candidates = await Promise.all(applicants.map((applicant) => serializeRecruiterCandidate(db, applicant, recruiterId)));
  const categoryFieldIds = getCategoryFieldIds(filters);

  return candidates
    .filter((candidate) => candidateMatchesFilters(candidate, filters))
    .sort((left, right) => compareRecruiterCandidates(left, right, categoryFieldIds))
    .map((candidate) => enrichCandidateForRecruiter(candidate, filters))
    .slice(0, 50);
}

export async function findRecruiterEvidenceQueue(db: Db, recruiterId: ObjectId, filters: RecruiterCandidateFilters = {}) {
  const queue = await findRecruiterCandidates(db, recruiterId, filters);

  return queue
    .filter((candidate) => candidate.matchEvidence.length > 0)
    .sort(
      (left, right) =>
        right.matchScore - left.matchScore ||
        right.profileStrength - left.profileStrength ||
        right.matchEvidence.length - left.matchEvidence.length
    )
    .slice(0, 25);
}

function compareRecruiterCandidates(left: RecruiterCandidateBase, right: RecruiterCandidateBase, categoryFieldIds: string[]) {
  return (
    getProfileStrength(right) - getProfileStrength(left) ||
    getCategoryRank(right, categoryFieldIds) - getCategoryRank(left, categoryFieldIds) ||
    Math.min(right.projects.length, 3) - Math.min(left.projects.length, 3) ||
    Math.min(right.internships.length, 1) - Math.min(left.internships.length, 1)
  );
}

function getProfileCompletenessScore(candidate: RecruiterCandidateBase) {
  let score = 0;

  if (candidate.name) score += 1;
  if (candidate.universityName) score += 1;
  if (candidate.major) score += 1;
  if (typeof candidate.gpa === 'number') score += 1;
  if (candidate.hasResume) score += 1;
  if (candidate.tenSecondVideoUrl) score += 2;
  if (candidate.hasDeeperSignal) score += 2;
  if (candidate.tenSecondElaboration?.trim()) score += 1;
  if (candidate.softSkills.length > 0) score += 1;
  if (candidate.internships.length > 0) score += 1;
  if (candidate.projects.length > 0) score += 1;

  return score;
}

function getProfileStrength(candidate: RecruiterCandidateBase) {
  const coreSignals =
    (candidate.hasResume ? 20 : 0) +
    (candidate.tenSecondVideoUrl ? 20 : 0) +
    (candidate.hasDeeperSignal ? 15 : 0) +
    (candidate.tenSecondElaboration?.trim() ? 10 : 0) +
    (candidate.softSkills.length > 0 ? 5 : 0);
  const projectSignals = Math.min(candidate.projects.length, 3) === 0 ? 0 : candidate.projects.length === 1 ? 10 : candidate.projects.length === 2 ? 17 : 20;
  const internshipSignals = candidate.internships.length > 0 ? 10 : 0;

  return Math.min(100, coreSignals + projectSignals + internshipSignals);
}

function getCategoryRank(candidate: RecruiterCandidateBase, categoryFieldIds: string[]) {
  if (categoryFieldIds.length === 0) {
    return 0;
  }

  if (categoryFieldIds.some((categoryFieldId) => candidate.majorFieldIds.includes(categoryFieldId))) {
    return 3;
  }

  if (categoryFieldIds.some((categoryFieldId) => candidate.minorFieldIds.includes(categoryFieldId))) {
    return 2;
  }

  if (categoryFieldIds.some((categoryFieldId) => candidate.promptFieldId === categoryFieldId)) {
    return 1;
  }

  return 0;
}

function getCategoryMatch(candidate: RecruiterCandidateBase, categoryFieldIds: string[]) {
  if (categoryFieldIds.length === 0) {
    return undefined;
  }

  const majorMatch = categoryFieldIds.find((categoryFieldId) => candidate.majorFieldIds.includes(categoryFieldId));

  if (majorMatch) {
    return {
      fieldId: majorMatch,
      label: 'Major match' as const,
      priority: 3 as const
    };
  }

  const minorMatch = categoryFieldIds.find((categoryFieldId) => candidate.minorFieldIds.includes(categoryFieldId));

  if (minorMatch) {
    return {
      fieldId: minorMatch,
      label: 'Minor match' as const,
      priority: 2 as const
    };
  }

  const signalMatch = categoryFieldIds.find((categoryFieldId) => candidate.promptFieldId === categoryFieldId);

  if (signalMatch) {
    return {
      fieldId: signalMatch,
      label: 'Signal match' as const,
      priority: 1 as const
    };
  }

  return undefined;
}

function getFieldLabel(fieldId: string) {
  return academicFields.find((field) => field.id === fieldId)?.label ?? fieldId;
}

function getFilterCriteriaScore(candidate: RecruiterCandidateBase, filters: RecruiterCandidateFilters) {
  const checks: boolean[] = [];
  const categoryFieldIds = getCategoryFieldIds(filters);

  if (categoryFieldIds.length > 0) {
    checks.push(getCategoryRank(candidate, categoryFieldIds) > 0);
  }

  if (filters.university || (filters.universities?.length ?? 0) > 0) {
    checks.push(includesNormalized(candidate.universityName, filters.university) && includesAnyNormalized(candidate.universityName, filters.universities));
  }

  if (filters.major || (filters.majors?.length ?? 0) > 0) {
    checks.push(includesNormalized(candidate.major, filters.major) && includesAnyNormalized(candidate.major, filters.majors));
  }

  if (filters.semesterNumber || (filters.semesterNumbers?.length ?? 0) > 0) {
    checks.push(
      Boolean(
        (filters.semesterNumber && candidate.semesterNumber === filters.semesterNumber) ||
          (filters.semesterNumbers && candidate.semesterNumber && filters.semesterNumbers.includes(candidate.semesterNumber))
      )
    );
  }

  if (typeof filters.gpaMin === 'number') {
    checks.push(typeof candidate.gpa === 'number' && candidate.gpa >= filters.gpaMin);
  }

  if (typeof filters.gpaMax === 'number') {
    checks.push(typeof candidate.gpa === 'number' && candidate.gpa <= filters.gpaMax);
  }

  if (typeof filters.hasInternship === 'boolean') {
    checks.push((candidate.internships.length > 0) === filters.hasInternship);
  }

  if (filters.query?.trim()) {
    checks.push(candidateMatchesQuery(candidate, filters.query));
  }

  if (checks.length === 0) {
    return 72;
  }

  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function getMatchStrength(matchScore: number) {
  if (matchScore >= 88) {
    return 'strong_match' as const;
  }

  if (matchScore >= 76) {
    return 'good_match' as const;
  }

  if (matchScore >= 62) {
    return 'potential_match' as const;
  }

  return 'needs_review' as const;
}

function createEvidence(candidate: RecruiterCandidateBase, filters: RecruiterCandidateFilters): RecruiterCandidateEvidence[] {
  const evidence: RecruiterCandidateEvidence[] = [];
  const categoryFieldIds = getCategoryFieldIds(filters);
  const categoryMatch = getCategoryMatch(candidate, categoryFieldIds);

  if (categoryMatch) {
    evidence.push({
      id: 'category-match',
      type: 'education',
      title: categoryMatch.label,
      body: `Matches ${getFieldLabel(categoryMatch.fieldId)} through ${categoryMatch.label.toLowerCase()}.`,
      strength: categoryMatch.priority === 3 ? 'strong' : categoryMatch.priority === 2 ? 'moderate' : 'light'
    });
  }

  if (typeof filters.gpaMin === 'number' && typeof candidate.gpa === 'number' && candidate.gpa >= filters.gpaMin) {
    evidence.push({
      id: 'gpa-match',
      type: 'education',
      title: 'GPA meets criteria',
      body: `GPA ${candidate.gpa.toFixed(2)} meets the minimum ${filters.gpaMin.toFixed(2)} filter.`,
      strength: candidate.gpa >= Math.min(4, filters.gpaMin + 0.3) ? 'strong' : 'moderate'
    });
  }

  if (candidate.projects.length > 0) {
    const firstProject = candidate.projects[0];
    evidence.push({
      id: 'project-signal',
      type: 'project',
      title: `${candidate.projects.length} project${candidate.projects.length === 1 ? '' : 's'} listed`,
      body: firstProject ? `Includes "${firstProject.title}" as direct work evidence.` : 'Includes direct work evidence.',
      strength: candidate.projects.length >= 3 ? 'strong' : candidate.projects.length === 2 ? 'moderate' : 'light'
    });
  }

  if (candidate.internships.length > 0) {
    const firstInternship = candidate.internships[0];
    evidence.push({
      id: 'internship-signal',
      type: 'internship',
      title: 'Internship experience',
      body: firstInternship ? `${firstInternship.roleDepartment} experience at ${firstInternship.company}.` : 'Has internship experience.',
      strength: 'moderate'
    });
  }

  if (candidate.tenSecondVideoUrl) {
    evidence.push({
      id: 'short-take',
      type: 'signal',
      title: 'Short take available',
      body: candidate.tenSecondElaboration?.trim() ? 'Includes a short response and written signal context.' : 'Includes a short video signal.',
      strength: candidate.tenSecondElaboration?.trim() ? 'strong' : 'moderate'
    });
  }

  if (candidate.hasDeeperSignal) {
    evidence.push({
      id: 'deeper-signal',
      type: 'signal',
      title: 'Deeper signal available',
      body: 'Candidate completed the deeper signal section.',
      strength: 'strong'
    });
  }

  if (candidate.hasResume) {
    evidence.push({
      id: 'resume-available',
      type: 'resume',
      title: 'Resume available',
      body: 'Resume is available for recruiter review.',
      strength: 'moderate'
    });
  }

  const strongSoftSkill = [...candidate.softSkills].sort((left, right) => right.rating - left.rating)[0];
  if (strongSoftSkill) {
    evidence.push({
      id: 'soft-skill',
      type: 'soft_skill',
      title: `${strongSoftSkill.label} signal`,
      body: `${strongSoftSkill.rating}/5 rating with profile-derived evidence.`,
      strength: strongSoftSkill.rating >= 4.5 ? 'strong' : strongSoftSkill.rating >= 4 ? 'moderate' : 'light'
    });
  }

  return evidence.slice(0, 8);
}

function createValidationNotes(candidate: RecruiterCandidateBase, filters: RecruiterCandidateFilters): RecruiterCandidateValidation[] {
  const notes: RecruiterCandidateValidation[] = [];

  if (!candidate.hasResume) {
    notes.push({
      id: 'resume-missing',
      title: 'Resume missing',
      body: 'Confirm experience from profile sections because no resume is available.'
    });
  }

  if (!candidate.hasDeeperSignal) {
    notes.push({
      id: 'deeper-signal-missing',
      title: 'Deeper signal missing',
      body: 'Use the short take first; deeper context has not been recorded.'
    });
  }

  if (filters.query?.trim() && candidateMatchesQuery(candidate, filters.query)) {
    notes.push({
      id: 'keyword-context',
      title: 'Keyword context',
      body: 'Keyword search matched profile text; validate depth during review.'
    });
  }

  if (candidate.projects.length === 0 && candidate.internships.length === 0) {
    notes.push({
      id: 'experience-context',
      title: 'Experience context unclear',
      body: 'No projects or internships are listed yet.'
    });
  }

  return notes.slice(0, 4);
}

export function enrichCandidateForRecruiter(candidate: RecruiterCandidateBase, filters: RecruiterCandidateFilters = {}) {
  const categoryFieldIds = getCategoryFieldIds(filters);
  const profileStrength = getProfileStrength(candidate);
  const criteriaScore = getFilterCriteriaScore(candidate, filters);
  const categoryRank = getCategoryRank(candidate, categoryFieldIds);
  const categoryBoost = categoryFieldIds.length > 0 ? categoryRank * 4 : 0;
  const evidence = createEvidence(candidate, filters);
  const matchScore = Math.max(1, Math.min(99, Math.round(profileStrength * 0.55 + criteriaScore * 0.35 + categoryBoost + Math.min(evidence.length, 6))));

  return {
    ...candidate,
    categoryMatch: getCategoryMatch(candidate, categoryFieldIds),
    profileStrength,
    matchScore,
    matchStrength: getMatchStrength(matchScore),
    matchEvidence: evidence,
    needsValidation: createValidationNotes(candidate, filters)
  };
}

export async function findRecruiterCandidateById(db: Db, recruiterId: ObjectId, applicantId: string) {
  if (!ObjectId.isValid(applicantId)) {
    return null;
  }

  const applicant = await applicantsCollection(db).findOne({
    _id: new ObjectId(applicantId),
    onboardingStatus: 'onboarding_complete'
  });

  if (!applicant) {
    return null;
  }

  const candidate = await serializeRecruiterCandidate(db, applicant, recruiterId, { includeDetailAssets: true });
  return enrichCandidateForRecruiter(candidate);
}
