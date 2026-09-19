package com.cato.app.core

enum class CatoRole(val wireValue: String) {
    APPLICANT("applicant"),
    RECRUITER("recruiter"),
}

enum class RecruiterReviewStatus(val wireValue: String) {
    NONE("none"),
    MAYBE("maybe"),
    SHORTLISTED("shortlisted"),
    PASSED("passed");

    companion object {
        fun fromWireValue(value: String?): RecruiterReviewStatus {
            return entries.firstOrNull { it.wireValue == value } ?: NONE
        }
    }
}

enum class RecruiterInterestRequestStatus(val wireValue: String) {
    SENT("sent"),
    VIEWED("viewed"),
    ACCEPTED("accepted"),
    DECLINED("declined"),
    EXPIRED("expired"),
}

enum class RecruiterSearchEmploymentType(val wireValue: String, val label: String) {
    INTERNSHIP("internship", "Intern"),
    FULL_TIME("full_time", "Full-time"),
    PART_TIME("part_time", "Part-time"),
    CONTRACT("contract", "Contract"),
}

enum class MatchingOptionType(val wireValue: String) {
    CATEGORY("category"),
    SKILL("skill"),
}

data class RecruiterAccount(
    val id: String,
    val email: String,
    val name: String? = null,
    val companyName: String? = null,
    val plan: String? = null,
)

data class RecruiterDashboardMetrics(
    val candidates: Int = 0,
    val bookmarks: Int = 0,
    val messages: Int = 0,
    val interestRequests: Int = 0,
)

data class RecruiterDashboardResponse(
    val recruiter: RecruiterAccount,
    val metrics: RecruiterDashboardMetrics,
    val recentActivity: List<String> = emptyList(),
)

data class RecruiterCandidateSearchFilters(
    val q: String? = null,
    val categoryFieldIds: List<String> = emptyList(),
    val universities: List<String> = emptyList(),
    val majors: List<String> = emptyList(),
    val semesterNumbers: List<Int> = emptyList(),
    val gpaMin: Double? = null,
    val hasInternship: Boolean? = null,
    val bookmarkedOnly: Boolean? = null,
    val reviewStatus: RecruiterReviewStatus? = null,
)

data class RecruiterSavedFilter(
    val id: String,
    val name: String,
    val criteria: RecruiterCandidateSearchFilters,
)

data class RecruiterJobCapacity(
    val maxShortlist: Int,
    val maxAutoProposalsPerRun: Int,
    val maxActiveInterestRequests: Int,
)

data class RecruiterJob(
    val id: String,
    val recruiterId: String,
    val companyName: String? = null,
    val title: String,
    val roleCategory: String,
    val targetMajors: List<String> = emptyList(),
    val targetCategories: List<String> = emptyList(),
    val requiredSkills: List<String> = emptyList(),
    val preferredSkills: List<String> = emptyList(),
    val desiredDepth: MatchingDepth? = null,
    val employmentType: RecruiterSearchEmploymentType,
    val minGpa: Double? = null,
    val capacity: RecruiterJobCapacity,
    val status: String,
    val createdAt: String = "",
    val updatedAt: String = "",
)

data class RecruiterJobResponse(
    val job: RecruiterJob,
)

data class RecruiterJobsResponse(
    val jobs: List<RecruiterJob> = emptyList(),
)

data class RecruiterCandidate(
    val id: String,
    val applicantId: String,
    val name: String? = null,
    val universityName: String? = null,
    val semesterLabel: String? = null,
    val semesterNumber: Int? = null,
    val gpa: Double? = null,
    val major: String? = null,
    val minor: String? = null,
    val profileImageUrl: String? = null,
    val signalSummary: String? = null,
    val tenSecondVideoUrl: String? = null,
    val thirtySecondVideoUrl: String? = null,
    val hasResume: Boolean = false,
    val hasDeeperSignal: Boolean = false,
    val resumeUrl: String? = null,
    val resumePreviewUrl: String? = null,
    val resumeFileName: String? = null,
    val profileStrength: Int = 0,
    val matchScore: Int = 0,
    val matchStrength: String = "none",
    val matchEvidence: List<RecruiterCandidateEvidence> = emptyList(),
    val needsValidation: List<RecruiterCandidateValidation> = emptyList(),
    val softSkills: List<RecruiterSoftSkill> = emptyList(),
    val internships: List<RecruiterInternship> = emptyList(),
    val projects: List<RecruiterProject> = emptyList(),
    val bookmarked: Boolean = false,
    val review: RecruiterCandidateReview? = null,
    val interestRequestStatus: RecruiterInterestRequestStatus? = null,
    val interestRequestExpiresAt: String? = null,
    val interestRequestResendAvailableAt: String? = null,
) {
    val displayName: String
        get() = name?.takeIf { it.isNotBlank() } ?: "Candidate"

    val displaySubtitle: String
        get() = listOfNotNull(major?.takeIf { it.isNotBlank() }, universityName?.takeIf { it.isNotBlank() })
            .joinToString(" • ")

    val reviewStatus: RecruiterReviewStatus
        get() = review?.status ?: RecruiterReviewStatus.NONE

    val tags: List<String>
        get() = buildList {
            major?.takeIf { it.isNotBlank() }?.let { add(it) }
            semesterLabel?.takeIf { it.isNotBlank() }?.let { add(it) }
            addAll(softSkills.take(2).map { it.label })
        }
}

data class RecruiterCandidateReview(
    val id: String,
    val status: RecruiterReviewStatus,
    val notes: String? = null,
    val tags: List<String> = emptyList(),
)

data class RecruiterCandidateEvidence(
    val id: String,
    val type: String,
    val title: String,
    val body: String,
    val strength: String,
)

data class RecruiterCandidateValidation(
    val id: String,
    val title: String,
    val body: String,
)

data class RecruiterSoftSkill(
    val label: String,
    val rating: Double,
    val evidence: String,
    val confidence: String,
)

data class RecruiterInternship(
    val id: String,
    val company: String,
    val durationMonths: Int,
    val roleDepartment: String,
)

data class RecruiterProject(
    val id: String,
    val title: String,
    val type: String,
    val description: String,
    val linkUrl: String? = null,
)

data class RecruiterInterestRequest(
    val id: String,
    val candidateId: String,
    val candidateName: String? = null,
    val reason: String,
    val roleCategory: String? = null,
    val status: RecruiterInterestRequestStatus,
    val sentAt: String,
    val respondedAt: String? = null,
    val expiresAt: String? = null,
    val resendAvailableAt: String? = null,
)

data class RecruiterInterestRequestsResponse(
    val requests: List<RecruiterInterestRequest> = emptyList(),
)

data class RecruiterSavedFiltersResponse(
    val filters: List<RecruiterSavedFilter> = emptyList(),
)

data class RecruiterCandidatesResponse(
    val candidates: List<RecruiterCandidate> = emptyList(),
)

data class RecruiterCandidateResponse(
    val candidate: RecruiterCandidate,
)

data class RecruiterBookmarksResponse(
    val bookmarks: List<RecruiterCandidate> = emptyList(),
)

data class RecruiterEvidenceQueueResponse(
    val queue: List<RecruiterCandidate> = emptyList(),
)

data class RecruiterMessage(
    val id: String,
    val candidateId: String,
    val candidateName: String? = null,
    val senderRole: String? = null,
    val isUnreadForViewer: Boolean? = null,
    val body: String,
    val createdAt: String,
)

data class RecruiterMessagesResponse(
    val messages: List<RecruiterMessage> = emptyList(),
    val unreadCount: Int? = null,
)

data class MatchingOption(
    val id: String,
    val type: MatchingOptionType,
    val key: String,
    val label: String,
    val builtin: Boolean? = null,
    val usageCount: Int? = null,
)

data class MatchingOptionsResponse(
    val options: List<MatchingOption> = emptyList(),
)

data class MatchingOptionResponse(
    val option: MatchingOption,
)

data class MatchingDepth(
    val type: MatchingOptionType,
    val id: String,
)

data class RuntimeSearchSpec(
    val employmentType: RecruiterSearchEmploymentType? = null,
    val targetCategories: List<String> = emptyList(),
    val requiredSkills: List<String> = emptyList(),
    val preferredSkills: List<String> = emptyList(),
    val desiredDepth: MatchingDepth? = null,
    val graduated: String = "any",
    val minGpa: Double? = null,
    val semesterNumbers: List<Int> = emptyList(),
    val limit: Int = 50,
)

data class RuntimeMatchScore(
    val totalScore: Int = 0,
    val componentScores: RuntimeMatchComponentScores? = null,
    val reasons: List<String> = emptyList(),
    val blockers: List<String> = emptyList(),
)

data class RuntimeMatchComponentScores(
    val bm25: Double = 0.0,
    val filters: Double = 0.0,
    val profileStrength: Double = 0.0,
    val projects: Double = 0.0,
    val internships: Double = 0.0,
    val softSkills: Double = 0.0,
    val freshness: Double = 0.0,
)

data class RuntimeMatchRun(
    val id: String,
    val status: String,
)

data class RuntimeMatchApplicant(
    val id: String,
    val name: String? = null,
    val email: String? = null,
    val universityName: String? = null,
    val semesterLabel: String? = null,
    val semesterNumber: Int? = null,
    val gpa: Double? = null,
    val major: String? = null,
    val minor: String? = null,
) {
    val displayName: String
        get() = name?.takeIf { it.isNotBlank() } ?: "Candidate"

    val displaySubtitle: String
        get() = listOfNotNull(
            major?.takeIf { it.isNotBlank() },
            universityName?.takeIf { it.isNotBlank() },
            semesterLabel?.takeIf { it.isNotBlank() },
        ).joinToString(" • ")
}

data class RuntimeMatchResult(
    val applicant: RuntimeMatchApplicant,
    val score: RuntimeMatchScore,
) {
    val id: String
        get() = applicant.id
}

data class RuntimeSearchAuditResponse(
    val searchSpec: RuntimeSearchSpec? = null,
    val applicant: RuntimeMatchApplicant? = null,
    val eligibility: RuntimeSearchAuditEligibility? = null,
    val searchInputsPresent: RuntimeSearchAuditInputsPresent? = null,
    val manualSearchContribution: RuntimeSearchAuditManualContribution? = null,
    val score: RuntimeMatchScore,
    val verificationNotes: List<String> = emptyList(),
)

data class RuntimeMatchingResponse(
    val run: RuntimeMatchRun? = null,
    val results: List<RuntimeMatchResult> = emptyList(),
)

data class RuntimeSearchAuditEligibility(
    val inRuntimePool: Boolean = false,
    val passesRuntimeFilters: Boolean = false,
    val hasScoreBlockers: Boolean = false,
    val includedInRankedResults: Boolean = false,
    val rank: Int? = null,
    val totalEligibleCandidates: Int = 0,
    val totalRankedCandidates: Int = 0,
)

data class RuntimeSearchAuditInputsPresent(
    val resumeUploaded: Boolean = false,
    val resumeTextReady: Boolean = false,
    val resumeExtractedSkillsCount: Int = 0,
    val manualSearchProfileReady: Boolean = false,
    val manualSkillCount: Int = 0,
    val manualFieldCount: Int = 0,
    val depthReady: Boolean = false,
    val projectCount: Int = 0,
    val internshipCount: Int = 0,
    val softSkillCount: Int = 0,
)

data class RuntimeSearchAuditManualContribution(
    val skillMatches: List<String> = emptyList(),
    val fieldMatches: List<String> = emptyList(),
    val depthMatch: Boolean = false,
    val contributesToSearchText: Boolean = false,
)

data class ApplicantVideoEvidenceLink(
    val targetType: String,
    val targetId: String,
) {
    val id: String
        get() = "$targetType:$targetId"
}

data class ApplicantVideoUploadPreparation(
    val uploadUrl: String,
    val cloudName: String,
    val apiKey: String,
    val timestamp: Int,
    val signature: String,
    val folder: String,
    val publicId: String,
    val maxDurationSeconds: Int? = null,
    val maxFileSizeBytes: Int? = null,
    val recommendedMaxResolution: String? = null,
    val recommendedVideoBitrateKbps: Int? = null,
    val recommendedAudioBitrateKbps: Int? = null,
    val deliveryTransformation: String? = null,
    val expiresInSeconds: Int,
)

data class ApplicantReelVideo(
    val id: String,
    val applicantId: String,
    val caption: String? = null,
    val videoUrl: String,
    val optimizedVideoUrl: String = "",
    val thumbnailUrl: String = "",
    val contentType: String = "",
    val fileSizeBytes: Int? = null,
    val durationSeconds: Double = 0.0,
    val maxResolution: String = "",
    val orientation: String = "",
    val visibility: String = "public",
    val transcodeStatus: String = "",
    val likeCount: Int = 0,
    val viewCount: Int = 0,
    val links: List<ApplicantVideoEvidenceLink> = emptyList(),
    val createdAt: String = "",
    val updatedAt: String = "",
    val applicantName: String? = null,
)

data class ApplicantAccomplishment(
    val id: String,
    val title: String,
    val description: String,
    val categoryFieldIds: List<String> = emptyList(),
    val skillIds: List<String> = emptyList(),
    val linkUrl: String? = null,
    val visibility: String = "public",
    val createdAt: String = "",
    val updatedAt: String = "",
)

data class RecruiterCandidateProfileMediaResponse(
    val videos: List<ApplicantReelVideo> = emptyList(),
    val accomplishments: List<ApplicantAccomplishment> = emptyList(),
)

data class ApplicantReelsResponse(
    val limit: Int? = null,
    val used: Int? = null,
    val videos: List<ApplicantReelVideo> = emptyList(),
)

data class ApplicantReelVideoResponse(
    val video: ApplicantReelVideo,
)

data class ApplicantAccomplishmentsResponse(
    val accomplishments: List<ApplicantAccomplishment> = emptyList(),
)

data class ApplicantAccomplishmentResponse(
    val accomplishment: ApplicantAccomplishment,
)

data class ApplicantProjectResponse(
    val project: ApplicantProject,
)

data class ApplicantInternshipResponse(
    val internship: ApplicantInternship,
)

data class VideoFeedResponse(
    val videos: List<ApplicantReelVideo> = emptyList(),
)

data class ApplicantProfileResponse(
    val applicant: ApplicantAccount,
    val education: ApplicantEducation? = null,
    val internships: List<ApplicantInternship> = emptyList(),
    val projects: List<ApplicantProject> = emptyList(),
    val resume: ApplicantResume? = null,
    val signal: ApplicantSignal? = null,
    val softSkills: ApplicantSoftSkills? = null,
    val finishProfilePrompt: Boolean = false,
) {
    val profileStrength: Int
        get() {
            var score = 0
            if (!resume?.secureUrl.isNullOrBlank() || !resume?.previewUrl.isNullOrBlank()) score += 18
            if (!signal?.tenSecondVideo?.secureUrl.isNullOrBlank()) score += 18
            if (!signal?.thirtySecondVideo?.secureUrl.isNullOrBlank()) score += 17
            if (softSkills?.items?.isNotEmpty() == true) score += 17
            score += when (projects.size) {
                0 -> 0
                1 -> 10
                2 -> 17
                else -> 20
            }
            if (internships.isNotEmpty()) score += 10
            return minOf(score, 100)
        }
}

data class PublicApplicantProfileResponse(
    val applicantId: String,
    val displayName: String,
    val educationLine: String = "",
    val videos: List<ApplicantReelVideo> = emptyList(),
    val projects: List<ApplicantProject> = emptyList(),
    val accomplishments: List<ApplicantAccomplishment> = emptyList(),
)

data class ApplicantAccountResponse(
    val applicant: ApplicantAccount,
)

data class ApplicantSaveEducationResponse(
    val education: ApplicantEducation,
)

data class ApplicantAccount(
    val id: String,
    val supabaseUserId: String,
    val email: String,
    val name: String,
    val profileImage: ApplicantProfileImage? = null,
    val authProvider: String = "",
    val onboardingStatus: String = "",
    val onboardingCompletedAt: String? = null,
    val createdAt: String = "",
    val updatedAt: String = "",
) {
    val displayName: String
        get() = name.ifBlank { "Applicant" }
}

data class ApplicantProfileImage(
    val source: String,
    val secureUrl: String? = null,
)

data class ApplicantEducation(
    val universityUnitId: String? = null,
    val universityName: String,
    val universityMatchedFromEmail: Boolean = false,
    val semesterLabel: String,
    val semesterNumber: Int,
    val gpa: Double? = null,
    val major: String? = null,
    val majorFieldIds: List<String> = emptyList(),
    val minor: String? = null,
    val minorFieldIds: List<String> = emptyList(),
    val updatedAt: String = "",
) {
    val summary: String
        get() = listOfNotNull(major?.takeIf { it.isNotBlank() }, semesterLabel, universityName)
            .joinToString(" • ")
}

data class ApplicantInternship(
    val id: String,
    val company: String,
    val durationMonths: Int,
    val roleDepartment: String,
    val createdAt: String = "",
    val updatedAt: String = "",
)

data class ApplicantProject(
    val id: String,
    val title: String,
    val type: String,
    val description: String,
    val linkUrl: String? = null,
    val createdAt: String = "",
    val updatedAt: String = "",
)

data class ApplicantResume(
    val secureUrl: String? = null,
    val previewUrl: String? = null,
    val originalFileName: String? = null,
    val fileType: String? = null,
    val fileSizeBytes: Int? = null,
    val softSkillGenerationStatus: String = "",
    val uploadedAt: String? = null,
)

data class ApplicantSignal(
    val promptId: String? = null,
    val promptFieldId: String? = null,
    val promptFieldLabel: String? = null,
    val promptTextSnapshot: String? = null,
    val tenSecondElaboration: String? = null,
    val tenSecondElaborationSkipped: Boolean = false,
    val tenSecondVideo: ApplicantMediaAsset? = null,
    val thirtySecondVideo: ApplicantMediaAsset? = null,
    val thirtySecondVideoSkipped: Boolean = false,
    val updatedAt: String = "",
)

data class ApplicantMediaAsset(
    val secureUrl: String,
    val thumbnailUrl: String? = null,
    val contentType: String = "",
    val fileSizeBytes: Int = 0,
    val durationSeconds: Double = 0.0,
    val uploadedAt: String = "",
)

data class ApplicantSoftSkills(
    val source: String,
    val provider: String,
    val status: String,
    val items: List<ApplicantSoftSkill> = emptyList(),
    val editableByApplicant: Boolean = false,
    val generatedAt: String? = null,
    val updatedAt: String = "",
)

data class ApplicantSoftSkill(
    val label: String,
    val rating: Double,
    val evidence: String,
    val confidence: String,
)

enum class ApplicantResumeParseStatus(val wireValue: String) {
    NONE("none"),
    NEEDS_EXTRACTION("needs_extraction"),
    READY("ready"),
}

data class ApplicantResumeResponse(
    val resume: ApplicantResume? = null,
    val parseStatus: ApplicantResumeParseStatus? = null,
    val parsedTextUpdatedAt: String? = null,
)

enum class ApplicantOnboardingStatus(val wireValue: String) {
    AUTH_COMPLETE("auth_complete"),
    EDUCATION_COMPLETE("education_complete"),
    RESUME_COMPLETE("resume_complete"),
    SIGNAL_PROMPT_SELECTED("signal_prompt_selected"),
    SIGNAL_VIDEO_UPLOADED("signal_video_uploaded"),
    DEEPER_SIGNAL_SEEN("deeper_signal_seen"),
    DEEPER_VIDEO_SKIPPED("deeper_video_skipped"),
    DEEPER_VIDEO_UPLOADED("deeper_video_uploaded"),
    PROFILE_FORM_COMPLETE("profile_form_complete"),
    ONBOARDING_COMPLETE("onboarding_complete"),
}

data class ApplicantOnboardingStatusResponse(
    val onboardingStatus: ApplicantOnboardingStatus,
    val nextRoute: String,
)

data class ApplicantResumeParsedText(
    val applicantId: String,
    val resumeId: String? = null,
    val text: String,
    val parser: String,
    val sourceFileName: String? = null,
    val extractedSkills: List<String> = emptyList(),
    val createdAt: String = "",
    val updatedAt: String = "",
)

data class ApplicantResumeParsedTextResponse(
    val parsedText: ApplicantResumeParsedText,
)

data class ApplicantConsentResponse(
    val applicant: ApplicantAccount,
)

data class SignalPromptCategory(
    val fieldId: String,
    val label: String,
) {
    val id: String
        get() = fieldId
}

data class SignalPrompt(
    val id: String,
    val fieldId: String,
    val fieldLabel: String,
    val text: String,
    val active: Boolean,
    val sortOrder: Int,
)

data class SignalPromptsResponse(
    val categories: List<SignalPromptCategory> = emptyList(),
    val prompts: List<SignalPrompt> = emptyList(),
)

data class ApplicantSignalResponse(
    val signal: ApplicantSignal? = null,
)

data class ApplicantOnboardingCompletionResponse(
    val onboardingStatus: ApplicantOnboardingStatus,
    val nextRoute: String,
)

data class ApplicantSearchProfile(
    val id: String,
    val applicantId: String,
    val skillIds: List<String> = emptyList(),
    val fieldIds: List<String> = emptyList(),
    val depth: MatchingDepth,
    val source: String,
    val createdAt: String = "",
    val updatedAt: String = "",
)

data class ApplicantSearchProfileResponse(
    val profile: ApplicantSearchProfile? = null,
)

enum class ApplicantInterestRequestStatus(val wireValue: String) {
    SENT("sent"),
    VIEWED("viewed"),
    ACCEPTED("accepted"),
    DECLINED("declined"),
    EXPIRED("expired"),
}

data class ApplicantInterestRequest(
    val id: String,
    val recruiterId: String,
    val recruiterName: String? = null,
    val companyName: String? = null,
    val reason: String,
    val roleCategory: String? = null,
    val status: ApplicantInterestRequestStatus,
    val sentAt: String,
    val viewedAt: String? = null,
    val respondedAt: String? = null,
    val expiresAt: String? = null,
    val resendAvailableAt: String? = null,
    val updatedAt: String = "",
    val unreadMessageCount: Int? = null,
) {
    val displayCompany: String
        get() = companyName?.takeIf { it.isNotBlank() } ?: "Recruiter"

    val hasUnreadMessages: Boolean
        get() = (unreadMessageCount ?: 0) > 0

    val unreadBadge: String?
        get() {
            val count = unreadMessageCount ?: 0
            return when {
                count <= 0 -> null
                count > 9 -> "9+"
                else -> count.toString()
            }
        }
}

data class ApplicantInterestRequestsResponse(
    val requests: List<ApplicantInterestRequest> = emptyList(),
)

data class ApplicantInterestRequestResponse(
    val request: ApplicantInterestRequest,
)

data class ApplicantConversationMessage(
    val id: String,
    val requestId: String,
    val recruiterId: String,
    val applicantId: String,
    val senderRole: String,
    val isUnreadForViewer: Boolean? = null,
    val body: String,
    val createdAt: String,
) {
    val isMineForApplicant: Boolean
        get() = senderRole == "applicant"
}

data class ApplicantConversationMessagesResponse(
    val messages: List<ApplicantConversationMessage> = emptyList(),
)

data class CatoSseEvent(
    val name: String,
    val data: String,
) {
    val category: CatoSseEventCategory
        get() = when (name) {
            "message_sent" -> CatoSseEventCategory.MESSAGE
            "interest_request_sent", "interest_request_responded" -> CatoSseEventCategory.INTEREST_REQUEST
            else -> CatoSseEventCategory.GENERAL
        }
}

enum class CatoSseEventCategory {
    MESSAGE,
    INTEREST_REQUEST,
    GENERAL,
}

class CatoSseParser {
    private var currentEventName: String? = null
    private val currentDataLines = mutableListOf<String>()
    private val buffer = StringBuilder()

    fun receive(chunk: String): List<CatoSseEvent> {
        buffer.append(chunk)
        val events = mutableListOf<CatoSseEvent>()

        while (true) {
            val newlineIndex = buffer.indexOf("\n")
            if (newlineIndex < 0) break

            val rawLine = buffer.substring(0, newlineIndex).trimEnd('\r')
            buffer.delete(0, newlineIndex + 1)
            processLine(rawLine)?.let { events.add(it) }
        }

        return events
    }

    fun reset() {
        currentEventName = null
        currentDataLines.clear()
        buffer.clear()
    }

    private fun processLine(line: String): CatoSseEvent? {
        if (line.isEmpty()) return flushEvent()
        if (line.startsWith(":")) return null

        if (line.startsWith("event:")) {
            currentEventName = line.removePrefix("event:").trim()
            return null
        }

        if (line.startsWith("data:")) {
            currentDataLines.add(line.removePrefix("data:").trim())
        }

        return null
    }

    private fun flushEvent(): CatoSseEvent? {
        val eventName = currentEventName
        val event = if (eventName != null && currentDataLines.isNotEmpty()) {
            CatoSseEvent(name = eventName, data = currentDataLines.joinToString(separator = "\n"))
        } else {
            null
        }
        currentEventName = null
        currentDataLines.clear()
        return event
    }
}

data class ApplicantActivityMetrics(
    val profileViews: Int = 0,
    val resumeOpens: Int = 0,
    val bookmarks: Int = 0,
    val shortlists: Int = 0,
)

data class ApplicantActivity(
    val id: String,
    val applicantId: String,
    val recruiterId: String? = null,
    val type: String,
    val title: String,
    val body: String,
    val actorName: String? = null,
    val actorCompanyName: String? = null,
    val createdAt: String = "",
)

data class ApplicantActivityResponse(
    val metrics: ApplicantActivityMetrics = ApplicantActivityMetrics(),
    val recent: List<ApplicantActivity> = emptyList(),
)
