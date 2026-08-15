import { ObjectId } from 'mongodb';
import type { Db, WithId } from 'mongodb';
import type { ApplicantDocument } from '../repositories/applicants.repo.js';
import { applicantsCollection } from '../repositories/applicants.repo.js';
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
    includeDetailAssets ? findResumeByApplicantId(db, applicant._id) : Promise.resolve(null),
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
    .map((candidate) => ({
      ...candidate,
      categoryMatch: getCategoryMatch(candidate, categoryFieldIds)
    }))
    .slice(0, 50);
}

function compareRecruiterCandidates(
  left: Awaited<ReturnType<typeof serializeRecruiterCandidate>>,
  right: Awaited<ReturnType<typeof serializeRecruiterCandidate>>,
  categoryFieldIds: string[]
) {
  return (
    getProfileCompletenessScore(right) - getProfileCompletenessScore(left) ||
    getCategoryRank(right, categoryFieldIds) - getCategoryRank(left, categoryFieldIds) ||
    right.internships.length - left.internships.length ||
    right.projects.length - left.projects.length
  );
}

function getProfileCompletenessScore(candidate: Awaited<ReturnType<typeof serializeRecruiterCandidate>>) {
  let score = 0;

  if (candidate.name) score += 1;
  if (candidate.universityName) score += 1;
  if (candidate.major) score += 1;
  if (typeof candidate.gpa === 'number') score += 1;
  if (candidate.resumeUrl || candidate.resumePreviewUrl) score += 1;
  if (candidate.tenSecondVideoUrl) score += 2;
  if (candidate.thirtySecondVideoUrl) score += 2;
  if (candidate.tenSecondElaboration?.trim()) score += 1;
  if (candidate.softSkills.length > 0) score += 1;
  if (candidate.internships.length > 0) score += 1;
  if (candidate.projects.length > 0) score += 1;

  return score;
}

function getCategoryRank(candidate: Awaited<ReturnType<typeof serializeRecruiterCandidate>>, categoryFieldIds: string[]) {
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

function getCategoryMatch(candidate: Awaited<ReturnType<typeof serializeRecruiterCandidate>>, categoryFieldIds: string[]) {
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

  return serializeRecruiterCandidate(db, applicant, recruiterId, { includeDetailAssets: true });
}
