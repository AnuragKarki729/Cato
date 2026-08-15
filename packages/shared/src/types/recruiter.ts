export type RecruiterAccount = {
  id: string;
  supabaseUserId: string;
  email: string;
  name?: string;
  companyName?: string;
  plan: 'free' | 'professional' | 'team';
  createdAt: string;
  updatedAt: string;
};

export type RecruiterCandidate = {
  id: string;
  applicantId: string;
  name?: string;
  universityName?: string;
  semesterLabel?: string;
  semesterNumber?: number;
  gpa?: number;
  major?: string;
  majorFieldIds?: string[];
  minor?: string;
  minorFieldIds?: string[];
  promptFieldId?: string;
  promptFieldLabel?: string;
  categoryMatch?: {
    fieldId: string;
    label: 'Major match' | 'Minor match' | 'Signal match';
    priority: 1 | 2 | 3;
  };
  profileImageUrl?: string;
  promptTextSnapshot?: string;
  tenSecondElaboration?: string;
  signalSummary?: string;
  tenSecondVideoUrl?: string;
  thirtySecondVideoUrl?: string;
  resumeUrl?: string;
  resumePreviewUrl?: string;
  resumeFileName?: string;
  softSkills: Array<{
    label: string;
    rating: number;
    evidence: string;
    confidence: 'low' | 'medium' | 'high';
  }>;
  internships: Array<{
    id: string;
    company: string;
    durationMonths: number;
    roleDepartment: string;
  }>;
  projects: Array<{
    id: string;
    title: string;
    type: string;
    description: string;
    linkUrl?: string;
  }>;
  bookmarked: boolean;
  review?: RecruiterCandidateReview;
  interestRequestExpiresAt?: string;
  interestRequestResendAvailableAt?: string;
  interestRequestStatus?: RecruiterInterestRequestStatus;
};

export type RecruiterInterestRequestStatus = 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';

export type RecruiterCandidateReviewStatus = 'none' | 'maybe' | 'shortlisted' | 'passed';

export type RecruiterCandidateReview = {
  id: string;
  recruiterId: string;
  candidateId: string;
  status: RecruiterCandidateReviewStatus;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type RecruiterInterestRequest = {
  id: string;
  recruiterId: string;
  candidateId: string;
  candidateName?: string;
  reason: string;
  roleCategory?: string;
  status: RecruiterInterestRequestStatus;
  sentAt: string;
  viewedAt?: string;
  respondedAt?: string;
  expiresAt?: string;
  resendAvailableAt?: string;
  updatedAt: string;
};

export type RecruiterSyncResponse = {
  recruiter: RecruiterAccount;
};

export type RecruiterDashboardResponse = {
  recruiter: RecruiterAccount;
  metrics: {
    candidates: number;
    bookmarks: number;
    messages: number;
    interestRequests: number;
  };
  recentActivity: string[];
};

export type RecruiterCandidatesResponse = {
  candidates: RecruiterCandidate[];
};

export type RecruiterCandidateSearchFilters = {
  q?: string;
  categoryFieldId?: string;
  categoryFieldIds?: string[];
  university?: string;
  universities?: string[];
  major?: string;
  majors?: string[];
  semesterNumber?: number;
  semesterNumbers?: number[];
  gpaMin?: number;
  gpaMax?: number;
  hasInternship?: boolean;
  interestStatus?: RecruiterInterestRequestStatus;
  bookmarkedOnly?: boolean;
  reviewStatus?: RecruiterCandidateReviewStatus;
};

export type RecruiterSavedFilterCriteria = {
  bookmarkedOnly?: boolean;
  categoryFieldIds?: string[];
  gpaMin?: number;
  hasInternship?: boolean;
  majors?: string[];
  q?: string;
  reviewStatus?: RecruiterCandidateReviewStatus;
  semesterNumbers?: number[];
  universities?: string[];
};

export type RecruiterSavedFilter = {
  id: string;
  recruiterId: string;
  name: string;
  criteria: RecruiterSavedFilterCriteria;
  createdAt: string;
  updatedAt: string;
};

export type RecruiterSavedFiltersResponse = {
  filters: RecruiterSavedFilter[];
};

export type CreateRecruiterSavedFilterRequest = {
  name: string;
  criteria: RecruiterSavedFilterCriteria;
};

export type RecruiterSavedFilterResponse = {
  filter: RecruiterSavedFilter;
};

export type UpdateRecruiterCandidateReviewRequest = {
  notes?: string;
  status?: RecruiterCandidateReviewStatus;
  tags?: string[];
};

export type RecruiterCandidateReviewResponse = {
  review: RecruiterCandidateReview;
};

export type RecruiterCandidateResponse = {
  candidate: RecruiterCandidate;
};

export type RecruiterBookmarksResponse = {
  bookmarks: RecruiterCandidate[];
};

export type RecruiterMessagesResponse = {
  messages: Array<{
    id: string;
    candidateId: string;
    candidateName?: string;
    body: string;
    createdAt: string;
  }>;
};

export type RecruiterContactCandidateRequest = {
  body: string;
};

export type RecruiterInterestRequestsResponse = {
  requests: RecruiterInterestRequest[];
};

export type SendRecruiterInterestRequest = {
  reason: string;
  resend?: boolean;
  roleCategory?: string;
};

export type ApplicantInterestRequest = {
  id: string;
  recruiterId: string;
  recruiterName?: string;
  companyName?: string;
  reason: string;
  roleCategory?: string;
  status: RecruiterInterestRequestStatus;
  sentAt: string;
  viewedAt?: string;
  respondedAt?: string;
  expiresAt?: string;
  resendAvailableAt?: string;
  updatedAt: string;
};

export type ApplicantInterestRequestsResponse = {
  requests: ApplicantInterestRequest[];
};

export type RespondToInterestRequest = {
  action: 'accept' | 'decline';
};
