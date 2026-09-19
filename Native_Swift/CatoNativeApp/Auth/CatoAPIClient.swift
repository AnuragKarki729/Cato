import Foundation
import CatoNativeCore

final class CatoAPIClient {
    private let baseURL: URL
    private let session: URLSession
    private let decoder = JSONDecoder()

    init(config: CatoConfig, session: URLSession = .shared) {
        self.baseURL = config.apiBaseURL
        self.session = session
    }

    func getRole(accessToken: String) async throws -> CatoRole? {
        let response: AuthRoleResponse = try await request(
            path: "/auth/role",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
        return response.role
    }

    func claimRole(_ role: CatoRole, accessToken: String) async throws -> CatoRole {
        let response: AuthRoleClaimResponse = try await request(
            path: "/auth/role",
            method: "POST",
            accessToken: accessToken,
            body: ["role": role.rawValue]
        )
        return response.role
    }

    func syncRole(_ role: CatoRole, accessToken: String) async throws {
        let path = role == .recruiter ? "/recruiter/auth/sync" : "/auth/sync"
        let _: EmptyAPIResponse = try await request(
            path: path,
            method: "POST",
            accessToken: accessToken,
            body: [:]
        )
    }

    func deleteApplicantAccount(accessToken: String) async throws {
        let _: EmptyAPIResponse = try await request(
            path: "/account",
            method: "DELETE",
            accessToken: accessToken,
            body: nil
        )
    }

    func deleteRecruiterAccount(accessToken: String) async throws {
        let _: EmptyAPIResponse = try await request(
            path: "/recruiter/account",
            method: "DELETE",
            accessToken: accessToken,
            body: nil
        )
    }

    func getRecruiterDashboard(accessToken: String) async throws -> RecruiterDashboardResponse {
        try await request(
            path: "/recruiter/dashboard",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func getRecruiterSavedFilters(accessToken: String) async throws -> RecruiterSavedFiltersResponse {
        try await request(
            path: "/recruiter/saved-filters",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func getRecruiterInterestRequests(accessToken: String) async throws -> RecruiterInterestRequestsResponse {
        try await request(
            path: "/recruiter/interest-requests",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func getRecruiterCandidates(accessToken: String, filters: RecruiterCandidateSearchFilters = RecruiterCandidateSearchFilters()) async throws -> RecruiterCandidatesResponse {
        try await request(
            path: recruiterCandidatesPath(basePath: "/recruiter/candidates", filters: filters),
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func getRecruiterEvidenceQueue(accessToken: String, filters: RecruiterCandidateSearchFilters = RecruiterCandidateSearchFilters()) async throws -> RecruiterEvidenceQueueResponse {
        try await request(
            path: recruiterCandidatesPath(basePath: "/recruiter/evidence-queue", filters: filters),
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func getRecruiterCandidate(accessToken: String, candidateId: String) async throws -> RecruiterCandidateResponse {
        try await request(
            path: "/recruiter/candidates/\(candidateId)",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func getRecruiterCandidateProfileMedia(accessToken: String, candidateId: String) async throws -> RecruiterCandidateProfileMediaResponse {
        try await request(
            path: "/recruiter/candidates/\(candidateId)/profile-media",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func getRecruiterBookmarks(accessToken: String) async throws -> RecruiterBookmarksResponse {
        try await request(
            path: "/recruiter/bookmarks",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func bookmarkRecruiterCandidate(accessToken: String, candidateId: String) async throws {
        let _: EmptyAPIResponse = try await request(
            path: "/recruiter/candidates/\(candidateId)/bookmark",
            method: "POST",
            accessToken: accessToken,
            body: [:]
        )
    }

    func updateRecruiterCandidateReview(accessToken: String, candidateId: String, status: RecruiterReviewStatus) async throws {
        let _: EmptyAPIResponse = try await request(
            path: "/recruiter/candidates/\(candidateId)/review",
            method: "PATCH",
            accessToken: accessToken,
            body: ["status": status.rawValue]
        )
    }

    func sendRecruiterInterestRequest(
        accessToken: String,
        candidateId: String,
        reason: String,
        resend: Bool = false,
        sourceType: String? = nil,
        sourceVideoId: String? = nil,
        sourceProjectId: String? = nil,
        sourceInternshipId: String? = nil,
        sourceAccomplishmentId: String? = nil
    ) async throws {
        var body: [String: Any] = ["reason": reason, "resend": resend]
        if let sourceType { body["sourceType"] = sourceType }
        if let sourceVideoId { body["sourceVideoId"] = sourceVideoId }
        if let sourceProjectId { body["sourceProjectId"] = sourceProjectId }
        if let sourceInternshipId { body["sourceInternshipId"] = sourceInternshipId }
        if let sourceAccomplishmentId { body["sourceAccomplishmentId"] = sourceAccomplishmentId }

        let _: EmptyAPIResponse = try await request(
            path: "/recruiter/candidates/\(candidateId)/interest",
            method: "POST",
            accessToken: accessToken,
            body: body
        )
    }

    func contactRecruiterCandidate(accessToken: String, candidateId: String, body: String) async throws {
        let _: EmptyAPIResponse = try await request(
            path: "/recruiter/candidates/\(candidateId)/contact",
            method: "POST",
            accessToken: accessToken,
            body: ["body": body]
        )
    }

    func getRecruiterMessages(accessToken: String) async throws -> RecruiterMessagesResponse {
        try await request(
            path: "/recruiter/messages",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func getRecruiterCandidateMessages(accessToken: String, candidateId: String) async throws -> RecruiterMessagesResponse {
        try await request(
            path: "/recruiter/candidates/\(candidateId)/messages",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func getMatchingOptions(accessToken: String, type: MatchingOptionType, query: String = "") async throws -> MatchingOptionsResponse {
        var components = URLComponents()
        components.path = "/matching/options"
        var queryItems = [URLQueryItem(name: "type", value: type.rawValue), URLQueryItem(name: "limit", value: "25")]
        if !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            queryItems.append(URLQueryItem(name: "q", value: query))
        }
        components.queryItems = queryItems

        return try await request(
            path: components.string ?? "/matching/options",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func addMatchingOption(accessToken: String, type: MatchingOptionType, label: String) async throws -> MatchingOption {
        let response: MatchingOptionResponse = try await request(
            path: "/matching/options",
            method: "POST",
            accessToken: accessToken,
            body: [
                "type": type.rawValue,
                "label": label
            ]
        )
        return response.option
    }

    func runRuntimeMatching(accessToken: String, spec: RuntimeSearchSpec) async throws -> RuntimeMatchingResponse {
        return try await request(
            path: "/matching/search/run",
            method: "POST",
            accessToken: accessToken,
            body: runtimeSearchBody(spec: spec)
        )
    }

    func auditRuntimeMatching(accessToken: String, spec: RuntimeSearchSpec, applicantId: String) async throws -> RuntimeSearchAuditResponse {
        var body = runtimeSearchBody(spec: spec)
        body["applicantId"] = applicantId

        return try await request(
            path: "/matching/search/audit",
            method: "POST",
            accessToken: accessToken,
            body: body
        )
    }

    func saveRecruiterSearch(accessToken: String, name: String, spec: RuntimeSearchSpec) async throws -> RecruiterJob {
        let response: RecruiterJobResponse = try await request(
            path: "/recruiter/jobs",
            method: "POST",
            accessToken: accessToken,
            body: recruiterJobBody(name: name, spec: spec)
        )
        return response.job
    }

    func updateRecruiterSearch(accessToken: String, jobId: String, name: String, spec: RuntimeSearchSpec) async throws -> RecruiterJob {
        let response: RecruiterJobResponse = try await request(
            path: "/recruiter/jobs/\(jobId)",
            method: "PUT",
            accessToken: accessToken,
            body: recruiterJobBody(name: name, spec: spec)
        )
        return response.job
    }

    func getApplicantProfile(accessToken: String) async throws -> ApplicantProfileResponse {
        try await request(
            path: "/profile",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func prepareApplicantReelUpload(accessToken: String) async throws -> ApplicantVideoUploadPreparation {
        try await request(
            path: "/applicant/reels/upload-url",
            method: "POST",
            accessToken: accessToken,
            body: [:]
        )
    }

    func completeApplicantReelUpload(
        accessToken: String,
        caption: String?,
        cloudinaryPublicId: String,
        secureUrl: String,
        contentType: String,
        fileSizeBytes: Int?,
        durationSeconds: Double,
        orientation: String,
        links: [ApplicantVideoEvidenceLink]
    ) async throws -> ApplicantReelVideo {
        var body: [String: Any] = [
            "cloudinaryPublicId": cloudinaryPublicId,
            "secureUrl": secureUrl,
            "contentType": contentType,
            "durationSeconds": durationSeconds,
            "orientation": orientation,
            "links": links.map { ["targetType": $0.targetType, "targetId": $0.targetId] }
        ]
        if let caption {
            body["caption"] = caption
        } else {
            body["caption"] = NSNull()
        }
        if let fileSizeBytes {
            body["fileSizeBytes"] = fileSizeBytes
        }

        let response: ApplicantReelVideoResponse = try await request(
            path: "/applicant/reels/complete",
            method: "POST",
            accessToken: accessToken,
            body: body
        )
        return response.video
    }

    func updateApplicantReelCaption(accessToken: String, reelId: String, caption: String?) async throws -> ApplicantReelVideo {
        let body: [String: Any] = ["caption": caption ?? NSNull()]
        let response: ApplicantReelVideoResponse = try await request(
            path: "/applicant/reels/\(reelId)",
            method: "PATCH",
            accessToken: accessToken,
            body: body
        )
        return response.video
    }

    func getApplicantReels(accessToken: String) async throws -> ApplicantReelsResponse {
        try await request(
            path: "/applicant/reels",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func deleteApplicantReel(accessToken: String, reelId: String) async throws {
        let _: EmptyAPIResponse = try await request(
            path: "/applicant/reels/\(reelId)",
            method: "DELETE",
            accessToken: accessToken,
            body: nil
        )
    }

    func getApplicantAccomplishments(accessToken: String) async throws -> ApplicantAccomplishmentsResponse {
        try await request(
            path: "/applicant/accomplishments",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func createApplicantAccomplishment(
        accessToken: String,
        title: String,
        description: String,
        categoryFieldIds: [String] = [],
        skillIds: [String] = [],
        linkUrl: String? = nil,
        visibility: String = "public"
    ) async throws -> ApplicantAccomplishment {
        var body: [String: Any] = [
            "title": title,
            "description": description,
            "categoryFieldIds": categoryFieldIds,
            "skillIds": skillIds,
            "visibility": visibility
        ]
        if let linkUrl, !linkUrl.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            body["linkUrl"] = linkUrl
        }

        let response: ApplicantAccomplishmentResponse = try await request(
            path: "/applicant/accomplishments",
            method: "POST",
            accessToken: accessToken,
            body: body
        )
        return response.accomplishment
    }

    func createApplicantProject(
        accessToken: String,
        title: String,
        type: String,
        description: String,
        linkUrl: String? = nil
    ) async throws -> ApplicantProject {
        var body: [String: Any] = [
            "title": title,
            "type": type,
            "description": description
        ]
        if let linkUrl, !linkUrl.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            body["linkUrl"] = linkUrl
        }

        let response: ApplicantProjectResponse = try await request(
            path: "/profile/projects",
            method: "POST",
            accessToken: accessToken,
            body: body
        )
        return response.project
    }

    func updateApplicantProject(
        accessToken: String,
        projectId: String,
        title: String,
        type: String,
        description: String,
        linkUrl: String? = nil
    ) async throws -> ApplicantProject {
        var body: [String: Any] = [
            "title": title,
            "type": type,
            "description": description
        ]
        if let linkUrl {
            body["linkUrl"] = linkUrl
        }

        let response: ApplicantProjectResponse = try await request(
            path: "/profile/projects/\(projectId)",
            method: "PATCH",
            accessToken: accessToken,
            body: body
        )
        return response.project
    }

    func deleteApplicantProject(accessToken: String, projectId: String) async throws {
        let _: EmptyAPIResponse = try await request(
            path: "/profile/projects/\(projectId)",
            method: "DELETE",
            accessToken: accessToken,
            body: nil
        )
    }

    func createApplicantInternship(
        accessToken: String,
        company: String,
        roleDepartment: String,
        durationMonths: Int
    ) async throws -> ApplicantInternship {
        let response: ApplicantInternshipResponse = try await request(
            path: "/profile/internships",
            method: "POST",
            accessToken: accessToken,
            body: [
                "company": company,
                "roleDepartment": roleDepartment,
                "durationMonths": durationMonths
            ]
        )
        return response.internship
    }

    func updateApplicantInternship(
        accessToken: String,
        internshipId: String,
        company: String,
        roleDepartment: String,
        durationMonths: Int
    ) async throws -> ApplicantInternship {
        let response: ApplicantInternshipResponse = try await request(
            path: "/profile/internships/\(internshipId)",
            method: "PATCH",
            accessToken: accessToken,
            body: [
                "company": company,
                "roleDepartment": roleDepartment,
                "durationMonths": durationMonths
            ]
        )
        return response.internship
    }

    func deleteApplicantInternship(accessToken: String, internshipId: String) async throws {
        let _: EmptyAPIResponse = try await request(
            path: "/profile/internships/\(internshipId)",
            method: "DELETE",
            accessToken: accessToken,
            body: nil
        )
    }

    func getVideoFeed(accessToken: String, recruiter: Bool = false, limit: Int = 20, offset: Int = 0) async throws -> VideoFeedResponse {
        try await request(
            path: "\(recruiter ? "/recruiter/videos/feed" : "/videos/feed")?limit=\(limit)&offset=\(offset)",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func markVideoViewed(accessToken: String, videoId: String) async throws {
        let _: EmptyAPIResponse = try await request(
            path: "/videos/\(videoId)/view",
            method: "POST",
            accessToken: accessToken,
            body: [:]
        )
    }

    func setVideoLike(accessToken: String, videoId: String, liked: Bool) async throws {
        let _: EmptyAPIResponse = try await request(
            path: "/videos/\(videoId)/like",
            method: liked ? "POST" : "DELETE",
            accessToken: accessToken,
            body: liked ? [:] : nil
        )
    }

    func getApplicantSearchProfile(accessToken: String) async throws -> ApplicantSearchProfileResponse {
        try await request(
            path: "/applicant/search-profile",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func saveApplicantSearchProfile(
        accessToken: String,
        skillIds: [String],
        fieldIds: [String],
        depth: MatchingDepth
    ) async throws -> ApplicantSearchProfile? {
        let response: ApplicantSearchProfileResponse = try await request(
            path: "/applicant/search-profile",
            method: "PUT",
            accessToken: accessToken,
            body: [
                "skillIds": skillIds,
                "fieldIds": fieldIds,
                "depth": [
                    "type": depth.type.rawValue,
                    "id": depth.id
                ]
            ]
        )
        return response.profile
    }

    func getApplicantInterestRequests(accessToken: String) async throws -> ApplicantInterestRequestsResponse {
        try await request(
            path: "/applicant/interest-requests",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func getApplicantActivity(accessToken: String) async throws -> ApplicantActivityResponse {
        try await request(
            path: "/applicant/activity",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func respondToApplicantInterestRequest(accessToken: String, requestId: String, action: String) async throws -> ApplicantInterestRequest {
        let response: ApplicantInterestRequestResponse = try await request(
            path: "/applicant/interest-requests/\(requestId)/respond",
            method: "POST",
            accessToken: accessToken,
            body: ["action": action]
        )
        return response.request
    }

    func getApplicantConversationMessages(accessToken: String, requestId: String) async throws -> ApplicantConversationMessagesResponse {
        try await request(
            path: "/applicant/interest-requests/\(requestId)/messages",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func sendApplicantConversationMessage(accessToken: String, requestId: String, body: String) async throws {
        let _: EmptyAPIResponse = try await request(
            path: "/applicant/interest-requests/\(requestId)/messages",
            method: "POST",
            accessToken: accessToken,
            body: ["body": body]
        )
    }

    func getApplicantOnboardingStatus(accessToken: String) async throws -> ApplicantOnboardingStatusResponse {
        try await request(
            path: "/onboarding/status",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func saveApplicantEducation(
        accessToken: String,
        universityName: String,
        semesterLabel: String,
        semesterNumber: Int
    ) async throws -> ApplicantEducation {
        let response: ApplicantSaveEducationResponse = try await request(
            path: "/onboarding/education",
            method: "POST",
            accessToken: accessToken,
            body: [
                "universityName": universityName,
                "universityMatchedFromEmail": false,
                "semesterLabel": semesterLabel,
                "semesterNumber": semesterNumber
            ]
        )
        return response.education
    }

    func updateApplicantAccount(accessToken: String, name: String) async throws -> ApplicantAccount {
        let response: ApplicantAccountResponse = try await request(
            path: "/profile/applicant",
            method: "PATCH",
            accessToken: accessToken,
            body: ["name": name]
        )
        return response.applicant
    }

    func updateApplicantEducation(
        accessToken: String,
        universityName: String,
        universityMatchedFromEmail: Bool,
        semesterLabel: String,
        semesterNumber: Int,
        gpa: Double?,
        major: String?,
        minor: String?
    ) async throws -> ApplicantEducation {
        var body: [String: Any] = [
            "universityName": universityName,
            "universityMatchedFromEmail": universityMatchedFromEmail,
            "semesterLabel": semesterLabel,
            "semesterNumber": semesterNumber
        ]
        if let gpa {
            body["gpa"] = gpa
        }
        if let major, !major.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            body["major"] = major
        }
        if let minor, !minor.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            body["minor"] = minor
        }

        let response: ApplicantSaveEducationResponse = try await request(
            path: "/profile/education",
            method: "PATCH",
            accessToken: accessToken,
            body: body
        )
        return response.education
    }

    func skipApplicantResume(accessToken: String) async throws {
        let _: ApplicantResumeResponse = try await request(
            path: "/onboarding/resume/skip",
            method: "POST",
            accessToken: accessToken,
            body: [:]
        )
    }

    func uploadApplicantResume(
        accessToken: String,
        dataUri: String,
        originalFileName: String,
        fileSizeBytes: Int
    ) async throws -> ApplicantResume? {
        let response: ApplicantResumeResponse = try await request(
            path: "/resume/upload",
            method: "POST",
            accessToken: accessToken,
            body: [
                "dataUri": dataUri,
                "originalFileName": originalFileName,
                "fileType": "pdf",
                "fileSizeBytes": fileSizeBytes
            ]
        )
        return response.resume
    }

    func getApplicantResume(accessToken: String) async throws -> ApplicantResumeResponse {
        try await request(
            path: "/resume",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func saveApplicantParsedResumeText(
        accessToken: String,
        text: String,
        sourceFileName: String?,
        extractedSkills: [String]
    ) async throws {
        var body: [String: Any] = [
            "text": text,
            "parser": "client",
            "extractedSkills": extractedSkills
        ]

        if let sourceFileName, !sourceFileName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            body["sourceFileName"] = sourceFileName
        }

        let _: ApplicantResumeParsedTextResponse = try await request(
            path: "/resume/parsed-text",
            method: "POST",
            accessToken: accessToken,
            body: body
        )
    }

    func acceptApplicantConsent(accessToken: String, resume: Bool = false, video: Bool = false, privacyPolicy: Bool = false) async throws {
        var body = [String: Any]()
        if resume { body["resume"] = true }
        if video { body["video"] = true }
        if privacyPolicy { body["privacyPolicy"] = true }

        let _: ApplicantConsentResponse = try await request(
            path: "/privacy/consent",
            method: "POST",
            accessToken: accessToken,
            body: body
        )
    }

    func getSignalPrompts(accessToken: String) async throws -> SignalPromptsResponse {
        try await request(
            path: "/signal-prompts",
            method: "GET",
            accessToken: accessToken,
            body: nil
        )
    }

    func selectSignalPrompt(accessToken: String, promptId: String) async throws {
        let _: ApplicantSignalResponse = try await request(
            path: "/onboarding/signal-prompt",
            method: "POST",
            accessToken: accessToken,
            body: ["promptId": promptId]
        )
    }

    func prepareApplicantVideoUpload(
        accessToken: String,
        type: String,
        contentType: String,
        fileSizeBytes: Int?
    ) async throws -> ApplicantVideoUploadPreparation {
        var body: [String: Any] = ["contentType": contentType]
        if let fileSizeBytes {
            body["fileSizeBytes"] = fileSizeBytes
        }

        return try await request(
            path: "/videos/\(type)/upload-url",
            method: "POST",
            accessToken: accessToken,
            body: body
        )
    }

    func completeApplicantVideoUpload(
        accessToken: String,
        type: String,
        cloudinaryPublicId: String,
        secureUrl: String,
        contentType: String,
        fileSizeBytes: Int?,
        durationSeconds: Double
    ) async throws -> ApplicantSignal? {
        var body: [String: Any] = [
            "cloudinaryPublicId": cloudinaryPublicId,
            "secureUrl": secureUrl,
            "contentType": contentType,
            "durationSeconds": durationSeconds
        ]
        if let fileSizeBytes {
            body["fileSizeBytes"] = fileSizeBytes
        }

        let response: ApplicantSignalResponse = try await request(
            path: "/videos/\(type)/complete",
            method: "POST",
            accessToken: accessToken,
            body: body
        )
        return response.signal
    }

    func markDeeperSignalSeen(accessToken: String, elaboration: String?) async throws {
        var body: [String: Any] = [:]
        if let elaboration, !elaboration.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            body["elaboration"] = elaboration
        }

        let _: ApplicantSignalResponse = try await request(
            path: "/onboarding/deeper-signal/seen",
            method: "POST",
            accessToken: accessToken,
            body: body
        )
    }

    func skipApplicantDeeperVideo(accessToken: String) async throws {
        let _: ApplicantSignalResponse = try await request(
            path: "/onboarding/deeper-video/skip",
            method: "POST",
            accessToken: accessToken,
            body: [:]
        )
    }

    func completeApplicantOnboardingProfile(
        accessToken: String,
        name: String,
        education: ApplicantEducation,
        gpa: Double?,
        major: String?,
        minor: String?
    ) async throws {
        var body: [String: Any] = [
            "name": name,
            "universityName": education.universityName,
            "universityMatchedFromEmail": education.universityMatchedFromEmail,
            "semesterLabel": education.semesterLabel,
            "semesterNumber": education.semesterNumber,
            "internships": []
        ]

        if let universityUnitId = education.universityUnitId {
            body["universityUnitId"] = universityUnitId
        }
        if let gpa {
            body["gpa"] = gpa
        }
        if let major, !major.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            body["major"] = major
        }
        if let minor, !minor.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            body["minor"] = minor
        }

        let _: ApplicantOnboardingCompletionResponse = try await request(
            path: "/onboarding/profile",
            method: "POST",
            accessToken: accessToken,
            body: body
        )
    }

    private func request<Response: Decodable>(
        path: String,
        method: String,
        accessToken: String,
        body: [String: Any]?
    ) async throws -> Response {
        let url = endpoint(path)
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")

        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw CatoAPIError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            if let parsed = try? decoder.decode(APIErrorResponse.self, from: data) {
                throw CatoAPIError.requestFailed(parsed.bestMessage)
            }
            throw CatoAPIError.requestFailed("API request failed: \(httpResponse.statusCode)")
        }

        if Response.self == EmptyAPIResponse.self {
            return EmptyAPIResponse() as! Response
        }

        return try decoder.decode(Response.self, from: data)
    }

    private func endpoint(_ path: String) -> URL {
        let trimmed = path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        return URL(string: trimmed, relativeTo: baseURL.appendingPathComponent("/"))!.absoluteURL
    }

    private func recruiterCandidatesPath(basePath: String, filters: RecruiterCandidateSearchFilters) -> String {
        var components = URLComponents()
        components.path = basePath
        var queryItems = [URLQueryItem]()

        if let q = filters.q, !q.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            queryItems.append(URLQueryItem(name: "q", value: q))
        }

        filters.categoryFieldIds.forEach { queryItems.append(URLQueryItem(name: "categoryFieldIds", value: $0)) }
        filters.universities.forEach { queryItems.append(URLQueryItem(name: "universities", value: $0)) }
        filters.majors.forEach { queryItems.append(URLQueryItem(name: "majors", value: $0)) }
        filters.semesterNumbers.forEach { queryItems.append(URLQueryItem(name: "semesterNumbers", value: String($0))) }

        if let gpaMin = filters.gpaMin {
            queryItems.append(URLQueryItem(name: "gpaMin", value: String(gpaMin)))
        }

        if let hasInternship = filters.hasInternship {
            queryItems.append(URLQueryItem(name: "hasInternship", value: String(hasInternship)))
        }

        if let bookmarkedOnly = filters.bookmarkedOnly {
            queryItems.append(URLQueryItem(name: "bookmarkedOnly", value: String(bookmarkedOnly)))
        }

        if let reviewStatus = filters.reviewStatus {
            queryItems.append(URLQueryItem(name: "reviewStatus", value: reviewStatus.rawValue))
        }

        components.queryItems = queryItems.isEmpty ? nil : queryItems
        return components.string ?? basePath
    }

    private func recruiterJobBody(name: String, spec: RuntimeSearchSpec) -> [String: Any] {
        var body: [String: Any] = [
            "title": name,
            "roleCategory": spec.targetCategories.first ?? "general",
            "targetCategories": spec.targetCategories,
            "requiredSkills": spec.requiredSkills,
            "preferredSkills": spec.preferredSkills,
            "employmentType": (spec.employmentType ?? .internship).rawValue,
            "capacity": [
                "maxShortlist": 30,
                "maxAutoProposalsPerRun": spec.limit,
                "maxActiveInterestRequests": 25
            ],
            "status": "active"
        ]

        if let minGpa = spec.minGpa {
            body["minGpa"] = minGpa
        }

        if let desiredDepth = spec.desiredDepth {
            body["desiredDepth"] = ["type": desiredDepth.type.rawValue, "id": desiredDepth.id]
        }

        if spec.graduated == "true" {
            body["preferredSemesterRange"] = ["min": 100, "max": 100]
        } else if spec.graduated == "false" {
            body["preferredSemesterRange"] = ["min": 1, "max": 99]
        } else if !spec.semesterNumbers.isEmpty, let min = spec.semesterNumbers.min(), let max = spec.semesterNumbers.max() {
            body["preferredSemesterRange"] = ["min": min, "max": max]
        }

        return body
    }

    private func runtimeSearchBody(spec: RuntimeSearchSpec) -> [String: Any] {
        var body: [String: Any] = [
            "targetCategories": spec.targetCategories,
            "requiredSkills": spec.requiredSkills,
            "preferredSkills": spec.preferredSkills,
            "graduated": spec.graduated,
            "semesterNumbers": spec.semesterNumbers,
            "limit": spec.limit
        ]

        if let desiredDepth = spec.desiredDepth {
            body["desiredDepth"] = ["type": desiredDepth.type.rawValue, "id": desiredDepth.id]
        }

        if let employmentType = spec.employmentType {
            body["employmentType"] = employmentType.rawValue
        }

        if let minGpa = spec.minGpa {
            body["minGpa"] = minGpa
        }

        return body
    }
}

struct EmptyAPIResponse: Decodable {}

enum CatoAPIError: LocalizedError {
    case invalidResponse
    case requestFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "Cato API returned an invalid response."
        case .requestFailed(let message):
            return message
        }
    }
}
