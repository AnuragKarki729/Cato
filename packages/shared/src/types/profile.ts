import type { Applicant } from './applicant';
import type { EducationProfile, SaveEducationRequest } from './education';
import type { Resume } from './resume';
import type { ApplicantSignal } from './signal';
import type { SoftSkillItem, SoftSkillOutput } from './softSkills';

export type Internship = {
  id: string;
  company: string;
  durationMonths: number;
  roleDepartment: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicantProjectType = 'built_project' | 'research' | 'thesis' | 'video' | 'writing' | 'other';

export type ApplicantProject = {
  id: string;
  title: string;
  type: ApplicantProjectType;
  description: string;
  linkUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicantActivityType =
  | 'profile_viewed'
  | 'resume_opened'
  | 'deeper_signal_opened'
  | 'bookmarked'
  | 'shortlisted'
  | 'interest_sent'
  | 'message_sent';

export type ApplicantActivity = {
  id: string;
  applicantId: string;
  recruiterId?: string;
  type: ApplicantActivityType;
  title: string;
  body: string;
  actorName?: string;
  actorCompanyName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type ApplicantActivityResponse = {
  metrics: {
    profileViews: number;
    resumeOpens: number;
    bookmarks: number;
    shortlists: number;
  };
  recent: ApplicantActivity[];
};

export type SaveInternshipRequest = {
  company: string;
  durationMonths: number;
  roleDepartment: string;
};

export type SaveApplicantProjectRequest = {
  title: string;
  type: ApplicantProjectType;
  description: string;
  linkUrl?: string;
};

export type CompleteProfileRequest = SaveEducationRequest & {
  name: string;
  gpa?: number;
  major?: string;
  minor?: string;
  internships: SaveInternshipRequest[];
};

export type UpdateApplicantRequest = {
  name: string;
};

export type ProfileImageSource = 'ten_second_video' | 'thirty_second_video' | 'uploaded';

export type PrepareProfileImageUploadRequest = {
  contentType: string;
  fileSizeBytes?: number | null;
};

export type PrepareProfileImageUploadResponse = {
  uploadUrl: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
  overwrite: boolean;
  expiresInSeconds: number;
};

export type CompleteProfileImageUploadRequest = {
  cloudinaryPublicId: string;
  secureUrl: string;
  contentType: string;
  fileSizeBytes?: number | null;
};

export type SetProfileImageSourceRequest = {
  source: ProfileImageSource;
};

export type ProfileResponse = {
  applicant: Applicant;
  education: EducationProfile | null;
  internships: Internship[];
  projects: ApplicantProject[];
  resume: Resume | null;
  signal: ApplicantSignal | null;
  softSkills: SoftSkillOutput | null;
  finishProfilePrompt: boolean;
};

export type InternshipResponse = {
  internship: Internship;
};

export type ApplicantProjectResponse = {
  project: ApplicantProject;
};

export type SoftSkillUpdateRequest = {
  items: SoftSkillItem[];
};
