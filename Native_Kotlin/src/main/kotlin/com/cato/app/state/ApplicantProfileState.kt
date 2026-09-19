package com.cato.app.state

import com.cato.app.core.ApplicantProfileResponse
import com.cato.app.core.ApplicantActivity
import com.cato.app.core.ApplicantActivityMetrics
import com.cato.app.core.ApplicantActivityResponse
import com.cato.app.core.ApplicantInterestRequest
import com.cato.app.core.ApplicantResumeParseStatus
import com.cato.app.core.ApplicantResumeResponse
import com.cato.app.core.ApplicantSearchProfile
import com.cato.app.core.MatchingDepth
import com.cato.app.core.MatchingOption
import com.cato.app.core.MatchingOptionType

data class ApplicantHomeState(
    val profile: ApplicantProfileResponse? = null,
    val activity: ApplicantActivityResponse? = null,
    val requests: List<ApplicantInterestRequest> = emptyList(),
    val resumeResponse: ApplicantResumeResponse? = null,
    val searchProfile: ApplicantSearchProfile? = null,
) {
    val profileStrength: Int
        get() = profile?.profileStrength ?: 0

    val shouldShowSearchRecoveryPrompt: Boolean
        get() = searchProfile == null && resumeResponse?.parseStatus != ApplicantResumeParseStatus.READY

    val searchRecoveryDescription: String
        get() = when (resumeResponse?.parseStatus) {
            ApplicantResumeParseStatus.NEEDS_EXTRACTION ->
                "Your resume is uploaded, but Cato has not extracted searchable text from it. Add your skills and fields manually so recruiter search can still find you."
            ApplicantResumeParseStatus.NONE,
            null ->
                "You do not have searchable resume text yet. Add your skills and fields manually so recruiters can match you while your resume is missing or not parsed."
            ApplicantResumeParseStatus.READY ->
                "Add your skills and fields manually to strengthen matching beyond your resume."
        }

    val readinessItems: List<ApplicantReadinessItem>
        get() {
            val response = profile
            return listOf(
                ApplicantReadinessItem("Resume", response?.resume?.secureUrl?.isNotBlank() == true || response?.resume?.previewUrl?.isNotBlank() == true),
                ApplicantReadinessItem("Short take", response?.signal?.tenSecondVideo != null),
                ApplicantReadinessItem("Deeper signal", response?.signal?.thirtySecondVideo != null),
                ApplicantReadinessItem("Soft skills", response?.softSkills?.items?.isNotEmpty() == true),
            )
        }

    val hasRequestNotification: Boolean
        get() = requests.isNotEmpty()

    val requestPreviewRows: List<ApplicantHomeRequestPreview>
        get() = requests.take(3).map { request ->
            ApplicantHomeRequestPreview(
                requestId = request.id,
                recruiterName = request.recruiterName ?: "Recruiting team",
                company = request.displayCompany,
                reason = request.reason,
                unreadBadge = request.unreadBadge,
                emphasized = request.hasUnreadMessages,
                route = ApplicantRoute.RequestDetail(request.id),
            )
        }

    val activityMetrics: ApplicantActivityMetrics
        get() = activity?.metrics ?: ApplicantActivityMetrics()

    val activityPreviewRows: List<ApplicantHomeActivityPreview>
        get() = activity?.recent.orEmpty().take(4).map { item ->
            ApplicantHomeActivityPreview(
                id = item.id,
                title = item.title,
                body = item.body,
            )
        }

    val requestsEmptyMessage: String
        get() = "Interest requests from recruiters will appear here."

    val activityEmptyMessage: String
        get() = "Recruiter activity will appear here once your profile is discovered."
}

data class ApplicantReadinessItem(
    val title: String,
    val isDone: Boolean,
)

data class ApplicantHomeRequestPreview(
    val requestId: String,
    val recruiterName: String,
    val company: String,
    val reason: String,
    val unreadBadge: String?,
    val emphasized: Boolean,
    val route: ApplicantRoute,
)

data class ApplicantHomeActivityPreview(
    val id: String,
    val title: String,
    val body: String,
)

data class ApplicantSearchProfileEditorState(
    val selectedSkillOptions: List<String> = emptyList(),
    val selectedFieldOptions: List<String> = emptyList(),
    val depthType: String = "skill",
    val depthId: String = "",
) {
    val isComplete: Boolean
        get() = selectedSkillOptions.isNotEmpty() && selectedFieldOptions.isNotEmpty() && depthId.isNotBlank()

    val fieldCountLabel: String
        get() = "${selectedFieldOptions.size}/10"

    val skillCountLabel: String
        get() = "${selectedSkillOptions.size}/100"
}

data class ApplicantSearchProfileEditorV2State(
    val selectedSkills: List<MatchingOption> = emptyList(),
    val selectedFields: List<MatchingOption> = emptyList(),
    val depthType: MatchingOptionType = MatchingOptionType.SKILL,
    val depthId: String = "",
) {
    val fieldCountLabel: String
        get() = "${selectedFields.size}/10"

    val skillCountLabel: String
        get() = "${selectedSkills.size}/100"

    val depthOptions: List<MatchingOption>
        get() = if (depthType == MatchingOptionType.SKILL) {
            selectedSkills.sortedBy { it.label.lowercase() }
        } else {
            selectedFields.sortedBy { it.label.lowercase() }
        }

    val selectedDepth: MatchingDepth?
        get() = depthId.takeIf { id -> depthOptions.any { it.key == id || it.id == id } }?.let { MatchingDepth(depthType, it) }

    val isComplete: Boolean
        get() = selectedSkills.isNotEmpty() && selectedFields.isNotEmpty() && selectedDepth != null

    val blockingMessage: String?
        get() = when {
            selectedFields.isEmpty() -> "Choose at least one field or industry."
            selectedSkills.isEmpty() -> "Choose at least one skill."
            selectedDepth == null -> "Choose the one area you are most fluent in."
            selectedFields.size > 10 -> "Applicants can select at most 10 fields."
            selectedSkills.size > 100 -> "Applicants can select at most 100 skills."
            else -> null
        }

    val skillIdsForSave: List<String>
        get() = selectedSkills.map { it.key }

    val fieldIdsForSave: List<String>
        get() = selectedFields.map { it.key }

    fun select(option: MatchingOption): ApplicantSearchProfileEditorV2State {
        return when (option.type) {
            MatchingOptionType.SKILL -> if (selectedSkills.any { it.key == option.key } || selectedSkills.size >= 100) {
                this
            } else {
                copy(selectedSkills = (selectedSkills + option).sortedBy { it.label.lowercase() })
            }
            MatchingOptionType.CATEGORY -> if (selectedFields.any { it.key == option.key } || selectedFields.size >= 10) {
                this
            } else {
                copy(selectedFields = (selectedFields + option).sortedBy { it.label.lowercase() })
            }
        }.ensureDepthStillValid()
    }

    fun remove(option: MatchingOption): ApplicantSearchProfileEditorV2State {
        return when (option.type) {
            MatchingOptionType.SKILL -> copy(selectedSkills = selectedSkills.filterNot { it.key == option.key })
            MatchingOptionType.CATEGORY -> copy(selectedFields = selectedFields.filterNot { it.key == option.key })
        }.ensureDepthStillValid()
    }

    fun selectDepth(type: MatchingOptionType, optionKey: String): ApplicantSearchProfileEditorV2State {
        return copy(depthType = type, depthId = optionKey).ensureDepthStillValid()
    }

    private fun ensureDepthStillValid(): ApplicantSearchProfileEditorV2State {
        return if (depthId.isNotBlank() && depthOptions.none { it.key == depthId || it.id == depthId }) {
            copy(depthId = "")
        } else {
            this
        }
    }
}
