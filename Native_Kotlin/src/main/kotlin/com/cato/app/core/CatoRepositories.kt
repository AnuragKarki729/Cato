package com.cato.app.core

interface CatoAuthRepository {
    suspend fun getRole(accessToken: String): CatoRole?
    suspend fun claimRole(accessToken: String, role: CatoRole): CatoRole
    suspend fun syncRole(accessToken: String, role: CatoRole)
    suspend fun deleteApplicantAccount(accessToken: String)
    suspend fun deleteRecruiterAccount(accessToken: String)
}

interface RecruiterRepository {
    suspend fun dashboard(accessToken: String): RecruiterDashboardResponse
    suspend fun savedFilters(accessToken: String): List<RecruiterSavedFilter>
    suspend fun interestRequests(accessToken: String): List<RecruiterInterestRequest>
    suspend fun candidates(accessToken: String, filters: RecruiterCandidateSearchFilters = RecruiterCandidateSearchFilters()): List<RecruiterCandidate>
    suspend fun evidenceQueue(accessToken: String, filters: RecruiterCandidateSearchFilters = RecruiterCandidateSearchFilters()): List<RecruiterCandidate>
    suspend fun candidate(accessToken: String, candidateId: String): RecruiterCandidate
    suspend fun candidateProfileMedia(accessToken: String, candidateId: String): RecruiterCandidateProfileMediaResponse
    suspend fun bookmarkCandidate(accessToken: String, candidateId: String)
    suspend fun updateCandidateReview(accessToken: String, candidateId: String, status: RecruiterReviewStatus)
    suspend fun sendInterest(accessToken: String, request: RecruiterInterestCommand)
    suspend fun contactCandidate(accessToken: String, candidateId: String, body: String)
    suspend fun messages(accessToken: String): List<RecruiterMessage>
    suspend fun candidateMessages(accessToken: String, candidateId: String): List<RecruiterMessage>
    suspend fun runtimeSearch(accessToken: String, spec: RuntimeSearchSpec): List<RuntimeMatchResult>
    suspend fun auditRuntimeSearch(accessToken: String, spec: RuntimeSearchSpec, applicantId: String): RuntimeSearchAuditResponse
    suspend fun saveRecruiterSearch(accessToken: String, name: String, spec: RuntimeSearchSpec): RecruiterJob
    suspend fun updateRecruiterSearch(accessToken: String, jobId: String, name: String, spec: RuntimeSearchSpec): RecruiterJob
    suspend fun videoFeed(accessToken: String, limit: Int = 50, offset: Int = 0): List<ApplicantReelVideo>
    suspend fun markVideoViewed(accessToken: String, videoId: String)
    suspend fun setVideoLiked(accessToken: String, videoId: String, liked: Boolean)
}

interface MatchingOptionRepository {
    suspend fun options(accessToken: String, type: MatchingOptionType, query: String = ""): List<MatchingOption>
    suspend fun addOption(accessToken: String, type: MatchingOptionType, label: String): MatchingOption
}

interface PublicDiscoveryRepository {
    suspend fun videoFeed(accessToken: String, limit: Int = 20, offset: Int = 0): List<ApplicantReelVideo>
    suspend fun publicApplicantProfile(accessToken: String, applicantId: String): PublicApplicantProfileResponse
    suspend fun markVideoViewed(accessToken: String, videoId: String)
    suspend fun setVideoLiked(accessToken: String, videoId: String, liked: Boolean)
}

data class RecruiterInterestCommand(
    val candidateId: String,
    val reason: String,
    val resend: Boolean = false,
    val sourceType: String? = null,
    val sourceVideoId: String? = null,
    val sourceProjectId: String? = null,
    val sourceInternshipId: String? = null,
    val sourceAccomplishmentId: String? = null,
)

interface ApplicantRepository {
    suspend fun profile(accessToken: String): ApplicantProfileResponse
    suspend fun activity(accessToken: String): ApplicantActivityResponse
    suspend fun interestRequests(accessToken: String): List<ApplicantInterestRequest>
    suspend fun onboardingStatus(accessToken: String): ApplicantOnboardingStatusResponse
    suspend fun saveOnboardingEducation(accessToken: String, command: ApplicantOnboardingEducationCommand): ApplicantEducation
    suspend fun skipResume(accessToken: String)
    suspend fun uploadResume(accessToken: String, command: ApplicantResumeUploadCommand): ApplicantResume?
    suspend fun resume(accessToken: String): ApplicantResumeResponse
    suspend fun saveParsedResumeText(accessToken: String, command: ApplicantParsedResumeTextCommand)
    suspend fun acceptConsent(accessToken: String, resume: Boolean = false, video: Boolean = false, privacyPolicy: Boolean = false)
    suspend fun signalPrompts(accessToken: String): SignalPromptsResponse
    suspend fun selectSignalPrompt(accessToken: String, promptId: String)
    suspend fun prepareSignalVideoUpload(accessToken: String, type: String, contentType: String, fileSizeBytes: Int? = null): ApplicantVideoUploadPreparation
    suspend fun completeSignalVideoUpload(accessToken: String, type: String, command: ApplicantSignalVideoCompleteCommand): ApplicantSignal?
    suspend fun markDeeperSignalSeen(accessToken: String, elaboration: String?)
    suspend fun skipDeeperVideo(accessToken: String)
    suspend fun completeOnboardingProfile(accessToken: String, command: ApplicantOnboardingProfileCommand)
    suspend fun searchProfile(accessToken: String): ApplicantSearchProfile?
    suspend fun saveSearchProfile(accessToken: String, skillIds: List<String>, fieldIds: List<String>, depth: MatchingDepth)
    suspend fun updateAccount(accessToken: String, name: String): ApplicantAccount
    suspend fun updateEducation(accessToken: String, command: ApplicantEducationCommand): ApplicantEducation
    suspend fun reels(accessToken: String): List<ApplicantReelVideo>
    suspend fun accomplishments(accessToken: String): List<ApplicantAccomplishment>
    suspend fun respondToInterestRequest(accessToken: String, requestId: String, action: ApplicantInterestAction): ApplicantInterestRequest
    suspend fun conversationMessages(accessToken: String, requestId: String): List<ApplicantConversationMessage>
    suspend fun sendConversationMessage(accessToken: String, requestId: String, body: String)
    suspend fun prepareReelUpload(accessToken: String): ApplicantVideoUploadPreparation
    suspend fun completeReelUpload(accessToken: String, command: ApplicantReelUploadCommand): ApplicantReelVideo
    suspend fun updateReelCaption(accessToken: String, reelId: String, caption: String?): ApplicantReelVideo
    suspend fun deleteReel(accessToken: String, reelId: String)
    suspend fun createAccomplishment(accessToken: String, command: ApplicantAccomplishmentCommand): ApplicantAccomplishment
    suspend fun createProject(accessToken: String, command: ApplicantProjectCommand): ApplicantProject
    suspend fun updateProject(accessToken: String, projectId: String, command: ApplicantProjectCommand): ApplicantProject
    suspend fun deleteProject(accessToken: String, projectId: String)
    suspend fun createInternship(accessToken: String, command: ApplicantInternshipCommand): ApplicantInternship
    suspend fun updateInternship(accessToken: String, internshipId: String, command: ApplicantInternshipCommand): ApplicantInternship
    suspend fun deleteInternship(accessToken: String, internshipId: String)
}

enum class ApplicantInterestAction(val wireValue: String) {
    ACCEPT("accept"),
    DECLINE("decline"),
}
