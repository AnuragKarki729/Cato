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

export type SaveInternshipRequest = {
  company: string;
  durationMonths: number;
  roleDepartment: string;
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
  resume: Resume | null;
  signal: ApplicantSignal | null;
  softSkills: SoftSkillOutput | null;
  finishProfilePrompt: boolean;
};

export type InternshipResponse = {
  internship: Internship;
};

export type SoftSkillUpdateRequest = {
  items: SoftSkillItem[];
};
