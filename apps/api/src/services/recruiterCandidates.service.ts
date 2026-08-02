import { ObjectId } from 'mongodb';
import type { Db, WithId } from 'mongodb';
import type { ApplicantDocument } from '../repositories/applicants.repo.js';
import { applicantsCollection } from '../repositories/applicants.repo.js';
import { findEducationProfileByApplicantId } from '../repositories/education.repo.js';
import { findInternshipsByApplicantId, serializeInternship } from '../repositories/internships.repo.js';
import { findResumeByApplicantId } from '../repositories/resumes.repo.js';
import { findSignalByApplicantId } from '../repositories/signals.repo.js';
import { findSoftSkillsByApplicantId } from '../repositories/softSkills.repo.js';
import { isCandidateBookmarked } from '../repositories/recruiters.repo.js';

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
  recruiterId: ObjectId
) {
  const [education, internships, resume, signal, softSkills, bookmarked] = await Promise.all([
    findEducationProfileByApplicantId(db, applicant._id),
    findInternshipsByApplicantId(db, applicant._id),
    findResumeByApplicantId(db, applicant._id),
    findSignalByApplicantId(db, applicant._id),
    findSoftSkillsByApplicantId(db, applicant._id),
    isCandidateBookmarked(db, recruiterId, applicant._id)
  ]);

  return {
    id: applicant._id.toString(),
    applicantId: applicant._id.toString(),
    name: applicant.name,
    email: applicant.email,
    universityName: education?.universityName,
    semesterLabel: education?.semesterLabel,
    semesterNumber: education?.semesterNumber,
    gpa: education?.gpa,
    major: education?.major,
    minor: education?.minor,
    profileImageUrl: getProfileImageUrl(applicant, signal),
    promptTextSnapshot: signal?.promptTextSnapshot,
    tenSecondElaboration: signal?.tenSecondElaboration,
    signalSummary: signal?.tenSecondElaboration,
    tenSecondVideoUrl: signal?.tenSecondVideo?.secureUrl,
    thirtySecondVideoUrl: signal?.thirtySecondVideo?.secureUrl,
    resumeUrl: resume?.secureUrl,
    resumePreviewUrl: resume?.previewUrl ?? resume?.secureUrl,
    resumeFileName: resume?.originalFileName,
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
    bookmarked
  };
}

export async function findRecruiterCandidates(db: Db, recruiterId: ObjectId) {
  const applicants = await applicantsCollection(db)
    .find({ onboardingStatus: 'onboarding_complete' })
    .sort({ updatedAt: -1 })
    .limit(50)
    .toArray();

  return Promise.all(applicants.map((applicant) => serializeRecruiterCandidate(db, applicant, recruiterId)));
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

  return serializeRecruiterCandidate(db, applicant, recruiterId);
}
