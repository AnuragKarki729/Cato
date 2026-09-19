import Foundation

private extension KeyedDecodingContainer {
    func decodeFlexibleDouble(forKey key: Key) throws -> Double {
        if let value = try decodeIfPresent(Double.self, forKey: key) {
            return value
        }

        if let value = try decodeIfPresent(Int.self, forKey: key) {
            return Double(value)
        }

        if let value = try decodeIfPresent(String.self, forKey: key), let parsed = Double(value) {
            return parsed
        }

        return 0
    }

    func decodeFlexibleString(forKey key: Key, default defaultValue: String = "") throws -> String {
        if let value = try decodeIfPresent(String.self, forKey: key) {
            return value
        }

        if let value = try decodeIfPresent(Bool.self, forKey: key) {
            return value ? "true" : "false"
        }

        if let value = try decodeIfPresent(Int.self, forKey: key) {
            return String(value)
        }

        return defaultValue
    }
}

public enum CatoRole: String, Codable, Equatable {
    case applicant
    case recruiter
}

public enum RecruiterReviewStatus: String, Codable, Equatable, CaseIterable {
    case none
    case maybe
    case shortlisted
    case passed
}

public struct RecruiterAccount: Codable, Equatable, Identifiable {
    public let id: String
    public let email: String
    public let name: String?
    public let companyName: String?
    public let plan: String?

    public init(id: String, email: String, name: String?, companyName: String?, plan: String?) {
        self.id = id
        self.email = email
        self.name = name
        self.companyName = companyName
        self.plan = plan
    }
}

public struct RecruiterDashboardMetrics: Codable, Equatable {
    public let candidates: Int
    public let bookmarks: Int
    public let messages: Int
    public let interestRequests: Int

    public init(candidates: Int, bookmarks: Int, messages: Int, interestRequests: Int) {
        self.candidates = candidates
        self.bookmarks = bookmarks
        self.messages = messages
        self.interestRequests = interestRequests
    }
}

public struct RecruiterDashboardResponse: Codable, Equatable {
    public let recruiter: RecruiterAccount
    public let metrics: RecruiterDashboardMetrics
    public let recentActivity: [String]

    public init(recruiter: RecruiterAccount, metrics: RecruiterDashboardMetrics, recentActivity: [String]) {
        self.recruiter = recruiter
        self.metrics = metrics
        self.recentActivity = recentActivity
    }
}

public enum RecruiterInterestRequestStatus: String, Codable, Equatable {
    case sent
    case viewed
    case accepted
    case declined
    case expired
}

public struct RecruiterInterestRequest: Codable, Equatable, Identifiable {
    public let id: String
    public let candidateId: String
    public let candidateName: String?
    public let reason: String
    public let roleCategory: String?
    public let status: RecruiterInterestRequestStatus
    public let sentAt: String
    public let respondedAt: String?
    public let expiresAt: String?
    public let resendAvailableAt: String?

    public init(
        id: String,
        candidateId: String,
        candidateName: String?,
        reason: String,
        roleCategory: String?,
        status: RecruiterInterestRequestStatus,
        sentAt: String,
        respondedAt: String?,
        expiresAt: String?,
        resendAvailableAt: String?
    ) {
        self.id = id
        self.candidateId = candidateId
        self.candidateName = candidateName
        self.reason = reason
        self.roleCategory = roleCategory
        self.status = status
        self.sentAt = sentAt
        self.respondedAt = respondedAt
        self.expiresAt = expiresAt
        self.resendAvailableAt = resendAvailableAt
    }
}

public struct RecruiterInterestRequestsResponse: Codable, Equatable {
    public let requests: [RecruiterInterestRequest]

    public init(requests: [RecruiterInterestRequest]) {
        self.requests = requests
    }
}

public struct RecruiterSavedFilter: Codable, Equatable, Identifiable {
    public let id: String
    public let name: String
    public let criteria: RecruiterCandidateSearchFilters

    public init(id: String, name: String, criteria: RecruiterCandidateSearchFilters) {
        self.id = id
        self.name = name
        self.criteria = criteria
    }
}

public struct RecruiterSavedFiltersResponse: Codable, Equatable {
    public let filters: [RecruiterSavedFilter]

    public init(filters: [RecruiterSavedFilter]) {
        self.filters = filters
    }
}

public struct RecruiterCandidateSearchFilters: Codable, Equatable {
    public var q: String?
    public var categoryFieldIds: [String]
    public var universities: [String]
    public var majors: [String]
    public var semesterNumbers: [Int]
    public var gpaMin: Double?
    public var hasInternship: Bool?
    public var bookmarkedOnly: Bool?
    public var reviewStatus: RecruiterReviewStatus?

    public init(
        q: String? = nil,
        categoryFieldIds: [String] = [],
        universities: [String] = [],
        majors: [String] = [],
        semesterNumbers: [Int] = [],
        gpaMin: Double? = nil,
        hasInternship: Bool? = nil,
        bookmarkedOnly: Bool? = nil,
        reviewStatus: RecruiterReviewStatus? = nil
    ) {
        self.q = q
        self.categoryFieldIds = categoryFieldIds
        self.universities = universities
        self.majors = majors
        self.semesterNumbers = semesterNumbers
        self.gpaMin = gpaMin
        self.hasInternship = hasInternship
        self.bookmarkedOnly = bookmarkedOnly
        self.reviewStatus = reviewStatus
    }
}

public struct RecruiterCandidate: Codable, Equatable, Identifiable {
    public let id: String
    public let applicantId: String
    public let name: String?
    public let universityName: String?
    public let semesterLabel: String?
    public let semesterNumber: Int?
    public let gpa: Double?
    public let major: String?
    public let minor: String?
    public let profileImageUrl: String?
    public let signalSummary: String?
    public let tenSecondVideoUrl: String?
    public let thirtySecondVideoUrl: String?
    public let hasResume: Bool
    public let hasDeeperSignal: Bool
    public let resumeUrl: String?
    public let resumePreviewUrl: String?
    public let resumeFileName: String?
    public let profileStrength: Int
    public let matchScore: Int
    public let matchStrength: String
    public let matchEvidence: [RecruiterCandidateEvidence]
    public let needsValidation: [RecruiterCandidateValidation]
    public let softSkills: [RecruiterSoftSkill]
    public let internships: [RecruiterInternship]
    public let projects: [RecruiterProject]
    public let bookmarked: Bool
    public let review: RecruiterCandidateReview?
    public let interestRequestStatus: RecruiterInterestRequestStatus?
    public let interestRequestExpiresAt: String?
    public let interestRequestResendAvailableAt: String?

    public var displayName: String {
        name?.isEmpty == false ? name! : "Candidate"
    }

    public var displaySubtitle: String {
        [major, universityName].compactMap { value in
            guard let value, !value.isEmpty else { return nil }
            return value
        }.joined(separator: " • ")
    }

    public var reviewStatus: RecruiterReviewStatus {
        review?.status ?? .none
    }

    public var tags: [String] {
        var values = [String]()
        if let major, !major.isEmpty { values.append(major) }
        if let semesterLabel, !semesterLabel.isEmpty { values.append(semesterLabel) }
        values.append(contentsOf: softSkills.prefix(2).map(\.label))
        return values
    }
}

public struct RecruiterCandidatesResponse: Codable, Equatable {
    public let candidates: [RecruiterCandidate]

    public init(candidates: [RecruiterCandidate]) {
        self.candidates = candidates
    }
}

public struct RecruiterCandidateResponse: Codable, Equatable {
    public let candidate: RecruiterCandidate

    public init(candidate: RecruiterCandidate) {
        self.candidate = candidate
    }
}

public struct RecruiterCandidateProfileMediaResponse: Codable, Equatable {
    public let videos: [ApplicantReelVideo]
    public let accomplishments: [ApplicantAccomplishment]
}

public struct RecruiterBookmarksResponse: Codable, Equatable {
    public let bookmarks: [RecruiterCandidate]

    public init(bookmarks: [RecruiterCandidate]) {
        self.bookmarks = bookmarks
    }
}

public struct RecruiterEvidenceQueueResponse: Codable, Equatable {
    public let queue: [RecruiterCandidate]

    public init(queue: [RecruiterCandidate]) {
        self.queue = queue
    }
}

public struct RecruiterCandidateReview: Codable, Equatable, Identifiable {
    public let id: String
    public let status: RecruiterReviewStatus
    public let notes: String?
    public let tags: [String]
}

public struct RecruiterCandidateEvidence: Codable, Equatable, Identifiable {
    public let id: String
    public let type: String
    public let title: String
    public let body: String
    public let strength: String

    public init(id: String, type: String, title: String, body: String, strength: String) {
        self.id = id
        self.type = type
        self.title = title
        self.body = body
        self.strength = strength
    }
}

public struct RecruiterCandidateValidation: Codable, Equatable, Identifiable {
    public let id: String
    public let title: String
    public let body: String
}

public struct RecruiterSoftSkill: Codable, Equatable, Identifiable {
    public var id: String { label }

    public let label: String
    public let rating: Double
    public let evidence: String
    public let confidence: String
}

public struct RecruiterInternship: Codable, Equatable, Identifiable {
    public let id: String
    public let company: String
    public let durationMonths: Int
    public let roleDepartment: String
}

public struct RecruiterProject: Codable, Equatable, Identifiable {
    public let id: String
    public let title: String
    public let type: String
    public let description: String
    public let linkUrl: String?
}

public struct RecruiterMessage: Codable, Equatable, Identifiable {
    public let id: String
    public let candidateId: String
    public let candidateName: String?
    public let senderRole: String?
    public let isUnreadForViewer: Bool?
    public let body: String
    public let createdAt: String
}

public struct RecruiterMessagesResponse: Codable, Equatable {
    public let messages: [RecruiterMessage]
    public let unreadCount: Int?
}

public enum RecruiterSearchEmploymentType: String, Codable, Equatable, CaseIterable {
    case internship
    case fullTime = "full_time"
    case partTime = "part_time"
    case contract

    public var label: String {
        switch self {
        case .internship: return "Intern"
        case .fullTime: return "Full-time"
        case .partTime: return "Part-time"
        case .contract: return "Contract"
        }
    }
}

public enum MatchingOptionType: String, Codable, Equatable {
    case category
    case skill
}

public struct MatchingOption: Codable, Equatable, Identifiable {
    public let id: String
    public let type: MatchingOptionType
    public let key: String
    public let label: String
    public let builtin: Bool?
    public let usageCount: Int?

    public init(id: String, type: MatchingOptionType, key: String, label: String, builtin: Bool?, usageCount: Int?) {
        self.id = id
        self.type = type
        self.key = key
        self.label = label
        self.builtin = builtin
        self.usageCount = usageCount
    }
}

public struct MatchingOptionsResponse: Codable, Equatable {
    public let options: [MatchingOption]
}

public struct MatchingOptionResponse: Codable, Equatable {
    public let option: MatchingOption
}

public struct MatchingDepth: Codable, Equatable {
    public let type: MatchingOptionType
    public let id: String

    public init(type: MatchingOptionType, id: String) {
        self.type = type
        self.id = id
    }
}

public struct RuntimeSearchSpec: Codable, Equatable {
    public var employmentType: RecruiterSearchEmploymentType?
    public var targetCategories: [String]
    public var requiredSkills: [String]
    public var preferredSkills: [String]
    public var desiredDepth: MatchingDepth?
    public var graduated: String
    public var minGpa: Double?
    public var semesterNumbers: [Int]
    public var limit: Int

    enum CodingKeys: String, CodingKey {
        case employmentType
        case targetCategories
        case requiredSkills
        case preferredSkills
        case desiredDepth
        case graduated
        case minGpa
        case semesterNumbers
        case limit
    }

    public init(
        employmentType: RecruiterSearchEmploymentType? = nil,
        targetCategories: [String] = [],
        requiredSkills: [String] = [],
        preferredSkills: [String] = [],
        desiredDepth: MatchingDepth? = nil,
        graduated: String = "any",
        minGpa: Double? = nil,
        semesterNumbers: [Int] = [],
        limit: Int = 50
    ) {
        self.employmentType = employmentType
        self.targetCategories = targetCategories
        self.requiredSkills = requiredSkills
        self.preferredSkills = preferredSkills
        self.desiredDepth = desiredDepth
        self.graduated = graduated
        self.minGpa = minGpa
        self.semesterNumbers = semesterNumbers
        self.limit = limit
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        employmentType = try container.decodeIfPresent(RecruiterSearchEmploymentType.self, forKey: .employmentType)
        targetCategories = try container.decodeIfPresent([String].self, forKey: .targetCategories) ?? []
        requiredSkills = try container.decodeIfPresent([String].self, forKey: .requiredSkills) ?? []
        preferredSkills = try container.decodeIfPresent([String].self, forKey: .preferredSkills) ?? []
        desiredDepth = try container.decodeIfPresent(MatchingDepth.self, forKey: .desiredDepth)
        graduated = try container.decodeFlexibleString(forKey: .graduated, default: "any")
        minGpa = try container.decodeIfPresent(Double.self, forKey: .minGpa)
        semesterNumbers = try container.decodeIfPresent([Int].self, forKey: .semesterNumbers) ?? []
        limit = try container.decodeIfPresent(Int.self, forKey: .limit) ?? 50
    }
}

public struct RuntimeMatchRun: Codable, Equatable, Identifiable {
    public let id: String
    public let status: String
}

public struct RuntimeMatchScore: Codable, Equatable {
    public let totalScore: Int
    public let componentScores: RuntimeMatchComponentScores?
    public let reasons: [String]
    public let blockers: [String]

    enum CodingKeys: String, CodingKey {
        case totalScore
        case componentScores
        case reasons
        case blockers
    }

    public init(totalScore: Int, componentScores: RuntimeMatchComponentScores?, reasons: [String], blockers: [String]) {
        self.totalScore = totalScore
        self.componentScores = componentScores
        self.reasons = reasons
        self.blockers = blockers
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        totalScore = try container.decodeIfPresent(Int.self, forKey: .totalScore) ?? 0
        componentScores = try container.decodeIfPresent(RuntimeMatchComponentScores.self, forKey: .componentScores)
        reasons = try container.decodeIfPresent([String].self, forKey: .reasons) ?? []
        blockers = try container.decodeIfPresent([String].self, forKey: .blockers) ?? []
    }
}

public struct RuntimeMatchComponentScores: Codable, Equatable {
    public let bm25: Double
    public let filters: Double
    public let profileStrength: Double
    public let projects: Double
    public let internships: Double
    public let softSkills: Double
    public let freshness: Double

    enum CodingKeys: String, CodingKey {
        case bm25
        case filters
        case profileStrength
        case projects
        case internships
        case softSkills
        case freshness
    }

    public init(
        bm25: Double,
        filters: Double,
        profileStrength: Double,
        projects: Double,
        internships: Double,
        softSkills: Double,
        freshness: Double
    ) {
        self.bm25 = bm25
        self.filters = filters
        self.profileStrength = profileStrength
        self.projects = projects
        self.internships = internships
        self.softSkills = softSkills
        self.freshness = freshness
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        bm25 = try container.decodeFlexibleDouble(forKey: .bm25)
        filters = try container.decodeFlexibleDouble(forKey: .filters)
        profileStrength = try container.decodeFlexibleDouble(forKey: .profileStrength)
        projects = try container.decodeFlexibleDouble(forKey: .projects)
        internships = try container.decodeFlexibleDouble(forKey: .internships)
        softSkills = try container.decodeFlexibleDouble(forKey: .softSkills)
        freshness = try container.decodeFlexibleDouble(forKey: .freshness)
    }
}

public struct RuntimeMatchApplicant: Codable, Equatable {
    public let id: String
    public let name: String?
    public let email: String?
    public let universityName: String?
    public let semesterLabel: String?
    public let semesterNumber: Int?
    public let gpa: Double?
    public let major: String?
    public let minor: String?

    public var displayName: String {
        name?.isEmpty == false ? name! : "Candidate"
    }

    public var displaySubtitle: String {
        [major, universityName, semesterLabel].compactMap { value in
            guard let value, !value.isEmpty else { return nil }
            return value
        }.joined(separator: " • ")
    }
}

public struct RuntimeMatchResult: Codable, Equatable, Identifiable {
    public var id: String { applicant.id }

    public let applicant: RuntimeMatchApplicant
    public let score: RuntimeMatchScore
}

public struct RuntimeMatchingResponse: Codable, Equatable {
    public let run: RuntimeMatchRun
    public let results: [RuntimeMatchResult]
}

public struct RuntimeSearchAuditEligibility: Codable, Equatable {
    public let inRuntimePool: Bool
    public let passesRuntimeFilters: Bool
    public let hasScoreBlockers: Bool
    public let includedInRankedResults: Bool
    public let rank: Int?
    public let totalEligibleCandidates: Int
    public let totalRankedCandidates: Int
}

public struct RuntimeSearchAuditInputsPresent: Codable, Equatable {
    public let resumeUploaded: Bool
    public let resumeTextReady: Bool
    public let resumeExtractedSkillsCount: Int
    public let manualSearchProfileReady: Bool
    public let manualSkillCount: Int
    public let manualFieldCount: Int
    public let depthReady: Bool
    public let projectCount: Int
    public let internshipCount: Int
    public let softSkillCount: Int
}

public struct RuntimeSearchAuditManualContribution: Codable, Equatable {
    public let skillMatches: [String]
    public let fieldMatches: [String]
    public let depthMatch: Bool
    public let contributesToSearchText: Bool
}

public struct RuntimeSearchAuditResponse: Codable, Equatable {
    public let searchSpec: RuntimeSearchSpec
    public let applicant: RuntimeMatchApplicant
    public let eligibility: RuntimeSearchAuditEligibility
    public let searchInputsPresent: RuntimeSearchAuditInputsPresent
    public let manualSearchContribution: RuntimeSearchAuditManualContribution
    public let score: RuntimeMatchScore
    public let verificationNotes: [String]
}

public struct RecruiterJobCapacity: Codable, Equatable {
    public let maxShortlist: Int
    public let maxAutoProposalsPerRun: Int
    public let maxActiveInterestRequests: Int
}

public struct RecruiterJob: Codable, Equatable, Identifiable {
    public let id: String
    public let recruiterId: String
    public let companyName: String?
    public let title: String
    public let roleCategory: String
    public let targetMajors: [String]
    public let targetCategories: [String]
    public let requiredSkills: [String]
    public let preferredSkills: [String]
    public let desiredDepth: MatchingDepth?
    public let employmentType: RecruiterSearchEmploymentType
    public let minGpa: Double?
    public let capacity: RecruiterJobCapacity
    public let status: String
    public let createdAt: String
    public let updatedAt: String
}

public struct RecruiterJobResponse: Codable, Equatable {
    public let job: RecruiterJob
}

public struct RecruiterJobsResponse: Codable, Equatable {
    public let jobs: [RecruiterJob]
}

public struct ApplicantSearchProfile: Codable, Equatable {
    public let id: String
    public let applicantId: String
    public let skillIds: [String]
    public let fieldIds: [String]
    public let depth: MatchingDepth
    public let source: String
    public let createdAt: String
    public let updatedAt: String
}

public struct ApplicantSearchProfileResponse: Codable, Equatable {
    public let profile: ApplicantSearchProfile?
}

public struct ApplicantProfileResponse: Codable, Equatable {
    public let applicant: ApplicantAccount
    public let education: ApplicantEducation?
    public let internships: [ApplicantInternship]
    public let projects: [ApplicantProject]
    public let resume: ApplicantResume?
    public let signal: ApplicantSignal?
    public let softSkills: ApplicantSoftSkills?
    public let finishProfilePrompt: Bool

    public var profileStrength: Int {
        var score = 0
        if resume?.secureUrl?.isEmpty == false || resume?.previewUrl?.isEmpty == false { score += 18 }
        if signal?.tenSecondVideo?.secureUrl.isEmpty == false { score += 18 }
        if signal?.thirtySecondVideo?.secureUrl.isEmpty == false { score += 17 }
        if softSkills?.items.isEmpty == false { score += 17 }

        switch projects.count {
        case 0: break
        case 1: score += 10
        case 2: score += 17
        default: score += 20
        }

        if !internships.isEmpty { score += 10 }
        return min(score, 100)
    }
}

public struct ApplicantAccount: Codable, Equatable, Identifiable {
    public let id: String
    public let supabaseUserId: String
    public let email: String
    public let name: String
    public let profileImage: ApplicantProfileImage?
    public let authProvider: String
    public let onboardingStatus: String
    public let onboardingCompletedAt: String?
    public let createdAt: String
    public let updatedAt: String

    public var displayName: String {
        name.isEmpty ? "Applicant" : name
    }
}

public struct ApplicantAccountResponse: Codable, Equatable {
    public let applicant: ApplicantAccount
}

public struct ApplicantProfileImage: Codable, Equatable {
    public let source: String
    public let secureUrl: String?
}

public struct ApplicantEducation: Codable, Equatable {
    public let universityUnitId: String?
    public let universityName: String
    public let universityMatchedFromEmail: Bool
    public let semesterLabel: String
    public let semesterNumber: Int
    public let gpa: Double?
    public let major: String?
    public let majorFieldIds: [String]
    public let minor: String?
    public let minorFieldIds: [String]
    public let updatedAt: String

    public var summary: String {
        [major, semesterLabel, universityName]
            .compactMap { $0 }
            .filter { !$0.isEmpty }
            .joined(separator: " • ")
    }
}

public struct ApplicantInternship: Codable, Equatable, Identifiable {
    public let id: String
    public let company: String
    public let durationMonths: Int
    public let roleDepartment: String
    public let createdAt: String
    public let updatedAt: String
}

public struct ApplicantProject: Codable, Equatable, Identifiable {
    public let id: String
    public let title: String
    public let type: String
    public let description: String
    public let linkUrl: String?
    public let createdAt: String
    public let updatedAt: String
}

public struct ApplicantProjectResponse: Codable, Equatable {
    public let project: ApplicantProject
}

public struct ApplicantInternshipResponse: Codable, Equatable {
    public let internship: ApplicantInternship
}

public struct ApplicantResume: Codable, Equatable {
    public let secureUrl: String?
    public let previewUrl: String?
    public let originalFileName: String?
    public let fileType: String?
    public let fileSizeBytes: Int?
    public let softSkillGenerationStatus: String
    public let uploadedAt: String?
}

public struct ApplicantSignal: Codable, Equatable {
    public let promptId: String?
    public let promptFieldId: String?
    public let promptFieldLabel: String?
    public let promptTextSnapshot: String?
    public let tenSecondElaboration: String?
    public let tenSecondElaborationSkipped: Bool
    public let tenSecondVideo: ApplicantMediaAsset?
    public let thirtySecondVideo: ApplicantMediaAsset?
    public let thirtySecondVideoSkipped: Bool
    public let updatedAt: String
}

public struct ApplicantMediaAsset: Codable, Equatable {
    public let secureUrl: String
    public let thumbnailUrl: String?
    public let contentType: String
    public let fileSizeBytes: Int
    public let durationSeconds: Double
    public let uploadedAt: String
}

public struct ApplicantSoftSkills: Codable, Equatable {
    public let source: String
    public let provider: String
    public let status: String
    public let items: [ApplicantSoftSkill]
    public let editableByApplicant: Bool
    public let generatedAt: String?
    public let updatedAt: String
}

public struct ApplicantSoftSkill: Codable, Equatable, Identifiable {
    public var id: String { label }

    public let label: String
    public let rating: Double
    public let evidence: String
    public let confidence: String
}

public enum ApplicantInterestRequestStatus: String, Codable, Equatable {
    case sent
    case viewed
    case accepted
    case declined
    case expired
}

public struct ApplicantInterestRequest: Codable, Equatable, Identifiable {
    public let id: String
    public let recruiterId: String
    public let recruiterName: String?
    public let companyName: String?
    public let reason: String
    public let roleCategory: String?
    public let status: ApplicantInterestRequestStatus
    public let sentAt: String
    public let viewedAt: String?
    public let respondedAt: String?
    public let expiresAt: String?
    public let resendAvailableAt: String?
    public let updatedAt: String
    public let unreadMessageCount: Int?

    public var displayCompany: String {
        companyName?.isEmpty == false ? companyName! : "Recruiter"
    }
}

public struct ApplicantInterestRequestsResponse: Codable, Equatable {
    public let requests: [ApplicantInterestRequest]
}

public struct ApplicantInterestRequestResponse: Codable, Equatable {
    public let request: ApplicantInterestRequest
}

public struct ApplicantConversationMessage: Codable, Equatable, Identifiable {
    public let id: String
    public let requestId: String
    public let recruiterId: String
    public let applicantId: String
    public let senderRole: String
    public let isUnreadForViewer: Bool?
    public let body: String
    public let createdAt: String
}

public struct ApplicantConversationMessagesResponse: Codable, Equatable {
    public let messages: [ApplicantConversationMessage]
}

public struct ApplicantActivityMetrics: Codable, Equatable {
    public let profileViews: Int
    public let resumeOpens: Int
    public let bookmarks: Int
    public let shortlists: Int
}

public struct ApplicantActivity: Codable, Equatable, Identifiable {
    public let id: String
    public let applicantId: String
    public let recruiterId: String?
    public let type: String
    public let title: String
    public let body: String
    public let actorName: String?
    public let actorCompanyName: String?
    public let createdAt: String
}

public struct ApplicantActivityResponse: Codable, Equatable {
    public let metrics: ApplicantActivityMetrics
    public let recent: [ApplicantActivity]
}

public enum ApplicantOnboardingStatus: String, Codable, Equatable {
    case authComplete = "auth_complete"
    case educationComplete = "education_complete"
    case resumeComplete = "resume_complete"
    case signalPromptSelected = "signal_prompt_selected"
    case signalVideoUploaded = "signal_video_uploaded"
    case deeperSignalSeen = "deeper_signal_seen"
    case deeperVideoSkipped = "deeper_video_skipped"
    case deeperVideoUploaded = "deeper_video_uploaded"
    case profileFormComplete = "profile_form_complete"
    case onboardingComplete = "onboarding_complete"
}

public struct ApplicantOnboardingStatusResponse: Codable, Equatable {
    public let onboardingStatus: ApplicantOnboardingStatus
    public let nextRoute: String
}

public struct ApplicantSaveEducationResponse: Codable, Equatable {
    public let education: ApplicantEducation
}

public struct ApplicantResumeResponse: Codable, Equatable {
    public let resume: ApplicantResume?
    public let parseStatus: ApplicantResumeParseStatus?
    public let parsedTextUpdatedAt: String?
}

public enum ApplicantResumeParseStatus: String, Codable, Equatable {
    case none
    case needsExtraction = "needs_extraction"
    case ready
}

public struct ApplicantResumeParsedTextResponse: Codable, Equatable {
    public let parsedText: ApplicantResumeParsedText
}

public struct ApplicantResumeParsedText: Codable, Equatable {
    public let applicantId: String
    public let resumeId: String?
    public let text: String
    public let parser: String
    public let sourceFileName: String?
    public let extractedSkills: [String]
    public let createdAt: String
    public let updatedAt: String
}

public struct ApplicantConsentResponse: Codable, Equatable {
    public let applicant: ApplicantAccount
}

public struct SignalPromptCategory: Codable, Equatable, Identifiable {
    public var id: String { fieldId }

    public let fieldId: String
    public let label: String
}

public struct SignalPrompt: Codable, Equatable, Identifiable {
    public let id: String
    public let fieldId: String
    public let fieldLabel: String
    public let text: String
    public let active: Bool
    public let sortOrder: Int
}

public struct SignalPromptsResponse: Codable, Equatable {
    public let categories: [SignalPromptCategory]
    public let prompts: [SignalPrompt]
}

public struct ApplicantSignalResponse: Codable, Equatable {
    public let signal: ApplicantSignal?
}

public struct ApplicantVideoUploadPreparation: Codable, Equatable {
    public let uploadUrl: String
    public let cloudName: String
    public let apiKey: String
    public let timestamp: Int
    public let signature: String
    public let folder: String
    public let publicId: String
    public let maxDurationSeconds: Int?
    public let maxFileSizeBytes: Int?
    public let recommendedMaxResolution: String?
    public let recommendedVideoBitrateKbps: Int?
    public let recommendedAudioBitrateKbps: Int?
    public let deliveryTransformation: String?
    public let expiresInSeconds: Int
}

public struct ApplicantVideoEvidenceLink: Codable, Equatable, Identifiable, Hashable {
    public var id: String { "\(targetType):\(targetId)" }

    public let targetType: String
    public let targetId: String

    public init(targetType: String, targetId: String) {
        self.targetType = targetType
        self.targetId = targetId
    }
}

public struct ApplicantReelVideo: Codable, Equatable, Identifiable {
    public let id: String
    public let applicantId: String
    public let caption: String?
    public let videoUrl: String
    public let optimizedVideoUrl: String
    public let thumbnailUrl: String
    public let contentType: String
    public let fileSizeBytes: Int?
    public let durationSeconds: Double
    public let maxResolution: String
    public let orientation: String
    public let visibility: String
    public let transcodeStatus: String
    public let likeCount: Int
    public let viewCount: Int
    public let links: [ApplicantVideoEvidenceLink]
    public let createdAt: String
    public let updatedAt: String
    public let applicantName: String?
}

public struct ApplicantReelsResponse: Codable, Equatable {
    public let limit: Int?
    public let used: Int?
    public let videos: [ApplicantReelVideo]
}

public struct ApplicantReelVideoResponse: Codable, Equatable {
    public let video: ApplicantReelVideo
}

public struct ApplicantAccomplishment: Codable, Equatable, Identifiable {
    public let id: String
    public let title: String
    public let description: String
    public let categoryFieldIds: [String]
    public let skillIds: [String]
    public let linkUrl: String?
    public let visibility: String
    public let createdAt: String
    public let updatedAt: String
}

public struct ApplicantAccomplishmentsResponse: Codable, Equatable {
    public let accomplishments: [ApplicantAccomplishment]
}

public struct ApplicantAccomplishmentResponse: Codable, Equatable {
    public let accomplishment: ApplicantAccomplishment
}

public struct VideoFeedResponse: Codable, Equatable {
    public let videos: [ApplicantReelVideo]
}

public struct ApplicantOnboardingCompletionResponse: Codable, Equatable {
    public let onboardingStatus: ApplicantOnboardingStatus
    public let nextRoute: String
}
