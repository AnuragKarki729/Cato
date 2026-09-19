import Foundation

public enum CatoFixtures {
    public static let dashboard = RecruiterDashboardResponse(
        recruiter: RecruiterAccount(id: "recruiter_1", email: "recruiter@company.com", name: "Alex", companyName: "Acme Corp", plan: "free"),
        metrics: RecruiterDashboardMetrics(candidates: 128, bookmarks: 36, messages: 12, interestRequests: 6),
        recentActivity: ["128 completed applicant profiles available", "36 candidates bookmarked"]
    )

    public static let interestRequests: [RecruiterInterestRequest] = [
        RecruiterInterestRequest(
            id: "ir_1",
            candidateId: "cand_1",
            candidateName: "Hira Riaz",
            reason: "Strong fit for the design role.",
            roleCategory: nil,
            status: .sent,
            sentAt: "2026-08-02T05:00:00.000Z",
            respondedAt: nil,
            expiresAt: nil,
            resendAvailableAt: nil
        )
    ]

    public static let quickSearches: [RecruiterSavedFilter] = [
        RecruiterSavedFilter(
            id: "search_1",
            name: "Senior Python",
            criteria: RecruiterCandidateSearchFilters(majors: ["Computer Science"], gpaMin: 3.4)
        )
    ]

    public static let candidates: [RecruiterCandidate] = [
        RecruiterCandidate(
            id: "cand_1",
            applicantId: "cand_1",
            name: "Hira Riaz",
            universityName: "UC Berkeley",
            semesterLabel: "Senior / Sem 8",
            semesterNumber: 8,
            gpa: 3.8,
            major: "UX Design",
            minor: nil,
            profileImageUrl: nil,
            signalSummary: "Clear, evidence-led product thinker.",
            tenSecondVideoUrl: nil,
            thirtySecondVideoUrl: nil,
            hasResume: true,
            hasDeeperSignal: true,
            resumeUrl: nil,
            resumePreviewUrl: nil,
            resumeFileName: nil,
            profileStrength: 92,
            matchScore: 92,
            matchStrength: "strong_match",
            matchEvidence: evidence,
            needsValidation: [],
            softSkills: [],
            internships: [],
            projects: [],
            bookmarked: false,
            review: nil,
            interestRequestStatus: nil,
            interestRequestExpiresAt: nil,
            interestRequestResendAvailableAt: nil
        ),
        RecruiterCandidate(
            id: "cand_2",
            applicantId: "cand_2",
            name: "Marcus Lee",
            universityName: "UCLA",
            semesterLabel: "Junior / Sem 6",
            semesterNumber: 6,
            gpa: 3.7,
            major: "Software Engineering",
            minor: nil,
            profileImageUrl: nil,
            signalSummary: "Structured engineering profile with practical projects.",
            tenSecondVideoUrl: nil,
            thirtySecondVideoUrl: nil,
            hasResume: true,
            hasDeeperSignal: false,
            resumeUrl: nil,
            resumePreviewUrl: nil,
            resumeFileName: nil,
            profileStrength: 86,
            matchScore: 88,
            matchStrength: "strong_match",
            matchEvidence: evidence,
            needsValidation: [],
            softSkills: [],
            internships: [],
            projects: [],
            bookmarked: true,
            review: RecruiterCandidateReview(id: "review_1", status: .maybe, notes: nil, tags: []),
            interestRequestStatus: nil,
            interestRequestExpiresAt: nil,
            interestRequestResendAvailableAt: nil
        )
    ]

    public static let evidence: [RecruiterCandidateEvidence] = [
        RecruiterCandidateEvidence(
            id: "ev_1",
            type: "resume",
            title: "Led migration of a healthcare platform",
            body: "Resume mentions platform work serving a large user base.",
            strength: "strong"
        ),
        RecruiterCandidateEvidence(
            id: "ev_2",
            type: "project",
            title: "Clear project ownership",
            body: "Project section shows design, implementation, and iteration.",
            strength: "moderate"
        )
    ]
}
