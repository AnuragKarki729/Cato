package com.cato.app.core

data class ApiRequestSpec(
    val method: String,
    val path: String,
    val body: Map<String, Any?> = emptyMap(),
)

data class EventStreamRequestSpec(
    val method: String,
    val path: String,
    val headers: Map<String, String>,
    val infiniteTimeout: Boolean = true,
)

object CatoApiContract {
    fun getRole(): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.AUTH_ROLE)
    }

    fun claimRole(role: CatoRole): ApiRequestSpec {
        return ApiRequestSpec("POST", CatoApiRoutes.AUTH_ROLE, mapOf("role" to role.wireValue))
    }

    fun syncRole(role: CatoRole): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = if (role == CatoRole.RECRUITER) CatoApiRoutes.RECRUITER_AUTH_SYNC else CatoApiRoutes.APPLICANT_AUTH_SYNC,
        )
    }

    fun deleteApplicantAccount(): ApiRequestSpec {
        return ApiRequestSpec("DELETE", CatoApiRoutes.APPLICANT_ACCOUNT)
    }

    fun deleteRecruiterAccount(): ApiRequestSpec {
        return ApiRequestSpec("DELETE", CatoApiRoutes.RECRUITER_ACCOUNT)
    }

    fun eventStream(role: CatoRole, accessToken: String): EventStreamRequestSpec {
        return EventStreamRequestSpec(
            method = "GET",
            path = CatoApiRoutes.eventStream(role),
            headers = mapOf(
                "Authorization" to "Bearer $accessToken",
                "Accept" to "text/event-stream",
            ),
        )
    }

    fun recruiterDashboard(): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.RECRUITER_DASHBOARD)
    }

    fun recruiterSavedFilters(): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.RECRUITER_SAVED_FILTERS)
    }

    fun recruiterInterestRequests(): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.RECRUITER_INTEREST_REQUESTS)
    }

    fun recruiterCandidates(filters: RecruiterCandidateSearchFilters = RecruiterCandidateSearchFilters()): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.recruiterCandidates(filters))
    }

    fun recruiterEvidenceQueue(filters: RecruiterCandidateSearchFilters = RecruiterCandidateSearchFilters()): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.recruiterEvidenceQueue(filters))
    }

    fun recruiterCandidate(candidateId: String): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.recruiterCandidate(candidateId))
    }

    fun recruiterCandidateProfileMedia(candidateId: String): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.recruiterCandidateProfileMedia(candidateId))
    }

    fun recruiterBookmarks(): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.RECRUITER_BOOKMARKS)
    }

    fun updateRecruiterReview(candidateId: String, status: RecruiterReviewStatus): ApiRequestSpec {
        return ApiRequestSpec(
            method = "PATCH",
            path = CatoApiRoutes.recruiterCandidateReview(candidateId),
            body = mapOf("status" to status.wireValue),
        )
    }

    fun bookmarkRecruiterCandidate(candidateId: String): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.recruiterCandidateBookmark(candidateId),
        )
    }

    fun removeRecruiterCandidateBookmark(candidateId: String): ApiRequestSpec {
        return ApiRequestSpec(
            method = "DELETE",
            path = CatoApiRoutes.recruiterCandidateBookmark(candidateId),
        )
    }

    fun recordRecruiterCandidateActivity(candidateId: String, type: String): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.recruiterCandidateActivity(candidateId),
            body = mapOf("type" to type),
        )
    }

    fun sendRecruiterInterest(
        candidateId: String,
        reason: String,
        resend: Boolean = false,
        sourceType: String? = null,
        sourceVideoId: String? = null,
        sourceProjectId: String? = null,
        sourceInternshipId: String? = null,
        sourceAccomplishmentId: String? = null,
    ): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.recruiterCandidateInterest(candidateId),
            body = buildMap {
                put("reason", reason)
                put("resend", resend)
                sourceType?.let { put("sourceType", it) }
                sourceVideoId?.let { put("sourceVideoId", it) }
                sourceProjectId?.let { put("sourceProjectId", it) }
                sourceInternshipId?.let { put("sourceInternshipId", it) }
                sourceAccomplishmentId?.let { put("sourceAccomplishmentId", it) }
            },
        )
    }

    fun contactCandidate(candidateId: String, body: String): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.recruiterCandidateContact(candidateId),
            body = mapOf("body" to body),
        )
    }

    fun recruiterMessages(): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.RECRUITER_MESSAGES)
    }

    fun recruiterCandidateMessages(candidateId: String): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.recruiterCandidateMessages(candidateId))
    }

    fun matchingOptions(type: MatchingOptionType, query: String = ""): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.matchingOptions(type = type, query = query))
    }

    fun addMatchingOption(type: MatchingOptionType, label: String): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.MATCHING_OPTIONS,
            body = mapOf(
                "type" to type.wireValue,
                "label" to label.trim(),
            ),
        )
    }

    fun applicantProfile(): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.APPLICANT_PROFILE)
    }

    fun applicantResume(): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.APPLICANT_RESUME)
    }

    fun applicantReels(): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.APPLICANT_REELS)
    }

    fun applicantAccomplishments(): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.APPLICANT_ACCOMPLISHMENTS)
    }

    fun applicantSearchProfile(): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.APPLICANT_SEARCH_PROFILE)
    }

    fun applicantInterestRequests(): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.APPLICANT_INTEREST_REQUESTS)
    }

    fun applicantActivity(): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.APPLICANT_ACTIVITY)
    }

    fun applicantConversationMessages(requestId: String): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.applicantInterestRequestMessages(requestId))
    }

    fun applicantOnboardingStatus(): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.APPLICANT_ONBOARDING_STATUS)
    }

    fun signalPrompts(): ApiRequestSpec {
        return ApiRequestSpec("GET", CatoApiRoutes.SIGNAL_PROMPTS)
    }

    fun markVideoViewed(videoId: String): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.videoView(videoId),
        )
    }

    fun videoFeed(recruiter: Boolean, limit: Int = 20, offset: Int = 0): ApiRequestSpec {
        return ApiRequestSpec(
            method = "GET",
            path = CatoApiRoutes.videoFeed(recruiter = recruiter, limit = limit, offset = offset),
        )
    }

    fun publicApplicantProfile(applicantId: String): ApiRequestSpec {
        return ApiRequestSpec(
            method = "GET",
            path = CatoApiRoutes.applicantPublicProfile(applicantId),
        )
    }

    fun setVideoLike(videoId: String, liked: Boolean): ApiRequestSpec {
        return ApiRequestSpec(
            method = if (liked) "POST" else "DELETE",
            path = CatoApiRoutes.videoLike(videoId),
        )
    }

    fun saveRecruiterSearch(name: String, spec: RuntimeSearchSpec): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.RECRUITER_JOBS,
            body = recruiterJobBody(name, spec),
        )
    }

    fun updateRecruiterSearch(jobId: String, name: String, spec: RuntimeSearchSpec): ApiRequestSpec {
        return ApiRequestSpec(
            method = "PUT",
            path = CatoApiRoutes.recruiterJob(jobId),
            body = recruiterJobBody(name, spec),
        )
    }

    fun runtimeMatching(spec: RuntimeSearchSpec): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.RUNTIME_MATCHING,
            body = runtimeSpecBody(spec),
        )
    }

    fun auditRuntimeMatching(spec: RuntimeSearchSpec, applicantId: String): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.RUNTIME_MATCHING_AUDIT,
            body = runtimeSpecBody(spec) + mapOf("applicantId" to applicantId),
        )
    }

    fun saveApplicantSearchProfile(
        skillIds: List<String>,
        fieldIds: List<String>,
        depth: MatchingDepth,
    ): ApiRequestSpec {
        return ApiRequestSpec(
            method = "PUT",
            path = CatoApiRoutes.APPLICANT_SEARCH_PROFILE,
            body = mapOf(
                "skillIds" to skillIds,
                "fieldIds" to fieldIds,
                "depth" to mapOf("type" to depth.type.wireValue, "id" to depth.id),
            ),
        )
    }

    fun updateApplicantAccount(name: String): ApiRequestSpec {
        return ApiRequestSpec(
            method = "PATCH",
            path = CatoApiRoutes.APPLICANT_PROFILE_ACCOUNT,
            body = mapOf("name" to name.trim()),
        )
    }

    fun updateApplicantEducation(command: ApplicantEducationCommand): ApiRequestSpec {
        return ApiRequestSpec(
            method = "PATCH",
            path = CatoApiRoutes.APPLICANT_PROFILE_EDUCATION,
            body = buildMap {
                put("universityName", command.universityName.trim())
                put("universityMatchedFromEmail", command.universityMatchedFromEmail)
                put("semesterLabel", command.semesterLabel)
                put("semesterNumber", command.semesterNumber)
                command.gpa?.let { put("gpa", it) }
                command.major?.trim()?.takeIf { it.isNotBlank() }?.let { put("major", it) }
                command.minor?.trim()?.takeIf { it.isNotBlank() }?.let { put("minor", it) }
            },
        )
    }

    fun saveApplicantOnboardingEducation(command: ApplicantOnboardingEducationCommand): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.APPLICANT_ONBOARDING_EDUCATION,
            body = mapOf(
                "universityName" to command.universityName.trim(),
                "universityMatchedFromEmail" to false,
                "semesterLabel" to command.semesterLabel,
                "semesterNumber" to command.semesterNumber,
            ),
        )
    }

    fun skipApplicantResume(): ApiRequestSpec {
        return ApiRequestSpec("POST", CatoApiRoutes.APPLICANT_ONBOARDING_RESUME_SKIP)
    }

    fun uploadApplicantResume(command: ApplicantResumeUploadCommand): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.APPLICANT_RESUME_UPLOAD,
            body = mapOf(
                "dataUri" to command.dataUri,
                "originalFileName" to command.originalFileName,
                "fileType" to "pdf",
                "fileSizeBytes" to command.fileSizeBytes,
            ),
        )
    }

    fun saveApplicantParsedResumeText(command: ApplicantParsedResumeTextCommand): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.APPLICANT_RESUME_PARSED_TEXT,
            body = buildMap {
                put("text", command.text)
                put("parser", "client")
                put("extractedSkills", command.extractedSkills)
                command.sourceFileName?.trim()?.takeIf { it.isNotBlank() }?.let { put("sourceFileName", it) }
            },
        )
    }

    fun acceptApplicantConsent(resume: Boolean = false, video: Boolean = false, privacyPolicy: Boolean = false): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.APPLICANT_PRIVACY_CONSENT,
            body = buildMap {
                if (resume) put("resume", true)
                if (video) put("video", true)
                if (privacyPolicy) put("privacyPolicy", true)
            },
        )
    }

    fun selectSignalPrompt(promptId: String): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.APPLICANT_SIGNAL_PROMPT,
            body = mapOf("promptId" to promptId),
        )
    }

    fun prepareApplicantVideoUpload(type: String, contentType: String, fileSizeBytes: Int? = null): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.applicantVideoUploadUrl(type),
            body = buildMap {
                put("contentType", contentType)
                fileSizeBytes?.let { put("fileSizeBytes", it) }
            },
        )
    }

    fun completeApplicantVideoUpload(type: String, command: ApplicantSignalVideoCompleteCommand): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.applicantVideoComplete(type),
            body = buildMap {
                put("cloudinaryPublicId", command.cloudinaryPublicId)
                put("secureUrl", command.secureUrl)
                put("contentType", command.contentType)
                put("durationSeconds", command.durationSeconds)
                command.fileSizeBytes?.let { put("fileSizeBytes", it) }
            },
        )
    }

    fun markDeeperSignalSeen(elaboration: String?): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.APPLICANT_DEEPER_SIGNAL_SEEN,
            body = buildMap {
                elaboration?.trim()?.takeIf { it.isNotBlank() }?.let { put("elaboration", it) }
            },
        )
    }

    fun skipApplicantDeeperVideo(): ApiRequestSpec {
        return ApiRequestSpec("POST", CatoApiRoutes.APPLICANT_DEEPER_VIDEO_SKIP)
    }

    fun completeApplicantOnboardingProfile(command: ApplicantOnboardingProfileCommand): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.APPLICANT_ONBOARDING_PROFILE,
            body = buildMap {
                put("name", command.name.trim())
                put("universityName", command.education.universityName)
                put("universityMatchedFromEmail", command.education.universityMatchedFromEmail)
                put("semesterLabel", command.education.semesterLabel)
                put("semesterNumber", command.education.semesterNumber)
                put("internships", emptyList<Map<String, String>>())
                command.education.universityUnitId?.let { put("universityUnitId", it) }
                command.gpa?.let { put("gpa", it) }
                command.major?.trim()?.takeIf { it.isNotBlank() }?.let { put("major", it) }
                command.minor?.trim()?.takeIf { it.isNotBlank() }?.let { put("minor", it) }
            },
        )
    }

    fun respondToApplicantInterestRequest(requestId: String, action: ApplicantInterestAction): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.applicantInterestRequestResponse(requestId),
            body = mapOf("action" to action.wireValue),
        )
    }

    fun sendApplicantConversationMessage(requestId: String, body: String): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.applicantInterestRequestMessages(requestId),
            body = mapOf("body" to body),
        )
    }

    fun prepareApplicantReelUpload(): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.APPLICANT_REEL_UPLOAD_URL,
        )
    }

    fun completeApplicantReelUpload(command: ApplicantReelUploadCommand): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.APPLICANT_REEL_COMPLETE,
            body = buildMap {
                put("cloudinaryPublicId", command.cloudinaryPublicId)
                put("secureUrl", command.secureUrl)
                put("contentType", command.contentType)
                put("durationSeconds", command.durationSeconds)
                put("orientation", command.orientation)
                put("caption", command.caption?.takeIf { it.isNotBlank() })
                put("links", command.links.map { mapOf("targetType" to it.targetType, "targetId" to it.targetId) })
                command.fileSizeBytes?.let { put("fileSizeBytes", it) }
            },
        )
    }

    fun updateApplicantReelCaption(reelId: String, caption: String?): ApiRequestSpec {
        return ApiRequestSpec(
            method = "PATCH",
            path = CatoApiRoutes.applicantReel(reelId),
            body = mapOf("caption" to caption?.takeIf { it.isNotBlank() }),
        )
    }

    fun deleteApplicantReel(reelId: String): ApiRequestSpec {
        return ApiRequestSpec(
            method = "DELETE",
            path = CatoApiRoutes.applicantReel(reelId),
        )
    }

    fun createApplicantProject(command: ApplicantProjectCommand): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.APPLICANT_PROJECTS,
            body = applicantProjectBody(command, includeBlankLink = false),
        )
    }

    fun updateApplicantProject(projectId: String, command: ApplicantProjectCommand): ApiRequestSpec {
        return ApiRequestSpec(
            method = "PATCH",
            path = CatoApiRoutes.applicantProject(projectId),
            body = applicantProjectBody(command, includeBlankLink = true),
        )
    }

    fun deleteApplicantProject(projectId: String): ApiRequestSpec {
        return ApiRequestSpec(
            method = "DELETE",
            path = CatoApiRoutes.applicantProject(projectId),
        )
    }

    fun createApplicantInternship(command: ApplicantInternshipCommand): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.APPLICANT_INTERNSHIPS,
            body = applicantInternshipBody(command),
        )
    }

    fun updateApplicantInternship(internshipId: String, command: ApplicantInternshipCommand): ApiRequestSpec {
        return ApiRequestSpec(
            method = "PATCH",
            path = CatoApiRoutes.applicantInternship(internshipId),
            body = applicantInternshipBody(command),
        )
    }

    fun deleteApplicantInternship(internshipId: String): ApiRequestSpec {
        return ApiRequestSpec(
            method = "DELETE",
            path = CatoApiRoutes.applicantInternship(internshipId),
        )
    }

    fun createApplicantAccomplishment(command: ApplicantAccomplishmentCommand): ApiRequestSpec {
        return ApiRequestSpec(
            method = "POST",
            path = CatoApiRoutes.APPLICANT_ACCOMPLISHMENTS,
            body = buildMap {
                put("title", command.title)
                put("description", command.description)
                put("categoryFieldIds", command.categoryFieldIds)
                put("skillIds", command.skillIds)
                put("visibility", command.visibility)
                command.linkUrl?.takeIf { it.isNotBlank() }?.let { put("linkUrl", it) }
            },
        )
    }

    private fun runtimeSpecBody(spec: RuntimeSearchSpec): Map<String, Any?> {
        return buildMap {
            put("employmentType", spec.employmentType?.wireValue)
            put("targetCategories", spec.targetCategories)
            put("requiredSkills", spec.requiredSkills)
            put("preferredSkills", spec.preferredSkills)
            put("graduated", spec.graduated)
            put("minGpa", spec.minGpa)
            put("semesterNumbers", spec.semesterNumbers)
            put("limit", spec.limit)
            spec.desiredDepth?.let { put("desiredDepth", mapOf("type" to it.type.wireValue, "id" to it.id)) }
        }.filterValues { it != null }
    }

    private fun applicantProjectBody(command: ApplicantProjectCommand, includeBlankLink: Boolean): Map<String, Any?> {
        return buildMap {
            put("title", command.title)
            put("type", command.type)
            put("description", command.description)
            val link = command.linkUrl
            if (includeBlankLink) {
                put("linkUrl", link)
            } else if (!link.isNullOrBlank()) {
                put("linkUrl", link)
            }
        }
    }

    private fun applicantInternshipBody(command: ApplicantInternshipCommand): Map<String, Any?> {
        return mapOf(
            "company" to command.company,
            "roleDepartment" to command.roleDepartment,
            "durationMonths" to command.durationMonths,
        )
    }

    private fun recruiterJobBody(name: String, spec: RuntimeSearchSpec): Map<String, Any?> {
        return buildMap {
            put("title", name)
            put("roleCategory", spec.targetCategories.firstOrNull() ?: "general")
            put("targetCategories", spec.targetCategories)
            put("requiredSkills", spec.requiredSkills)
            put("preferredSkills", spec.preferredSkills)
            put("employmentType", (spec.employmentType ?: RecruiterSearchEmploymentType.INTERNSHIP).wireValue)
            put(
                "capacity",
                mapOf(
                    "maxShortlist" to 30,
                    "maxAutoProposalsPerRun" to spec.limit,
                    "maxActiveInterestRequests" to 25,
                )
            )
            put("status", "active")
            spec.minGpa?.let { put("minGpa", it) }
            spec.desiredDepth?.let { put("desiredDepth", mapOf("type" to it.type.wireValue, "id" to it.id)) }
            preferredSemesterRange(spec)?.let { put("preferredSemesterRange", it) }
        }
    }

    private fun preferredSemesterRange(spec: RuntimeSearchSpec): Map<String, Int>? {
        return when {
            spec.graduated == "true" -> mapOf("min" to 100, "max" to 100)
            spec.graduated == "false" -> mapOf("min" to 1, "max" to 99)
            spec.semesterNumbers.isNotEmpty() -> mapOf(
                "min" to spec.semesterNumbers.min(),
                "max" to spec.semesterNumbers.max(),
            )
            else -> null
        }
    }
}

data class ApplicantReelUploadCommand(
    val caption: String? = null,
    val cloudinaryPublicId: String,
    val secureUrl: String,
    val contentType: String,
    val fileSizeBytes: Int? = null,
    val durationSeconds: Double,
    val orientation: String,
    val links: List<ApplicantVideoEvidenceLink>,
)

data class ApplicantProjectCommand(
    val title: String,
    val type: String,
    val description: String,
    val linkUrl: String? = null,
)

data class ApplicantInternshipCommand(
    val company: String,
    val roleDepartment: String,
    val durationMonths: Int,
)

data class ApplicantAccomplishmentCommand(
    val title: String,
    val description: String,
    val categoryFieldIds: List<String> = emptyList(),
    val skillIds: List<String> = emptyList(),
    val linkUrl: String? = null,
    val visibility: String = "public",
)

data class ApplicantEducationCommand(
    val universityName: String,
    val universityMatchedFromEmail: Boolean,
    val semesterLabel: String,
    val semesterNumber: Int,
    val gpa: Double? = null,
    val major: String? = null,
    val minor: String? = null,
)

data class ApplicantOnboardingEducationCommand(
    val universityName: String,
    val semesterLabel: String,
    val semesterNumber: Int,
)

data class ApplicantResumeUploadCommand(
    val dataUri: String,
    val originalFileName: String,
    val fileSizeBytes: Int,
)

data class ApplicantParsedResumeTextCommand(
    val text: String,
    val sourceFileName: String? = null,
    val extractedSkills: List<String> = emptyList(),
)

data class ApplicantSignalVideoCompleteCommand(
    val cloudinaryPublicId: String,
    val secureUrl: String,
    val contentType: String,
    val fileSizeBytes: Int? = null,
    val durationSeconds: Double,
)

data class ApplicantOnboardingProfileCommand(
    val name: String,
    val education: ApplicantEducation,
    val gpa: Double? = null,
    val major: String? = null,
    val minor: String? = null,
)
