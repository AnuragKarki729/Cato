import type { OnboardingStatus } from '../constants/onboardingStatus';

export type AuthProvider = 'google' | 'email';

export type Applicant = {
  id: string;
  supabaseUserId: string;
  email: string;
  name?: string;
  profileImage?: {
    source: 'ten_second_video' | 'thirty_second_video' | 'uploaded';
    cloudinaryPublicId?: string;
    secureUrl?: string;
    contentType?: string;
    uploadedAt?: string;
  };
  authProvider: AuthProvider;
  onboardingStatus: OnboardingStatus;
  onboardingCompletedAt?: string;
  resumeConsentAcceptedAt?: string;
  videoConsentAcceptedAt?: string;
  privacyPolicyAcknowledgedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type MeResponse = {
  applicant: Applicant;
};
