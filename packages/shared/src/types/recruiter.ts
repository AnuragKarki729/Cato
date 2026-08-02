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
  email: string;
  universityName?: string;
  semesterLabel?: string;
  semesterNumber?: number;
  gpa?: number;
  major?: string;
  minor?: string;
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
  bookmarked: boolean;
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
  };
  recentActivity: string[];
};

export type RecruiterCandidatesResponse = {
  candidates: RecruiterCandidate[];
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
