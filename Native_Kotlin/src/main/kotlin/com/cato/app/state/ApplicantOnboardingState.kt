package com.cato.app.state

import com.cato.app.core.ApplicantOnboardingStatus
import com.cato.app.core.ApplicantOnboardingProfileCommand
import com.cato.app.core.ApplicantProfileResponse
import com.cato.app.core.ApplicantResumeParseStatus
import com.cato.app.core.ApplicantResumeResponse
import com.cato.app.core.ApplicantSearchProfile
import com.cato.app.core.SignalPrompt
import kotlin.math.round

enum class ApplicantOnboardingRoute {
    EDUCATION,
    RESUME,
    SIGNAL_PROMPT,
    SHORT_TAKE_UPLOAD,
    DEEPER_SIGNAL,
    DEEPER_VIDEO,
    FINAL_PROFILE,
    APP_SHELL,
}

data class ApplicantOnboardingStepSpec(
    val route: ApplicantOnboardingRoute,
    val title: String,
    val subtitle: String,
    val primaryActionLabel: String?,
)

fun ApplicantOnboardingRoute.toStepSpec(): ApplicantOnboardingStepSpec {
    return when (this) {
        ApplicantOnboardingRoute.EDUCATION -> ApplicantOnboardingStepSpec(
            route = this,
            title = "Your college",
            subtitle = "Start with the basics recruiters use to understand your current stage.",
            primaryActionLabel = "Continue",
        )
        ApplicantOnboardingRoute.RESUME -> ApplicantOnboardingStepSpec(
            route = this,
            title = "Upload your resume",
            subtitle = "Cato accepts PDF resumes only.",
            primaryActionLabel = "Upload resume",
        )
        ApplicantOnboardingRoute.SIGNAL_PROMPT -> ApplicantOnboardingStepSpec(
            route = this,
            title = "What moves you?",
            subtitle = "Choose the prompt your short take will answer.",
            primaryActionLabel = "Use this prompt",
        )
        ApplicantOnboardingRoute.SHORT_TAKE_UPLOAD -> ApplicantOnboardingStepSpec(
            route = this,
            title = "Record your short take",
            subtitle = "Answer your selected prompt in 3 to 10 seconds.",
            primaryActionLabel = "Upload short take",
        )
        ApplicantOnboardingRoute.DEEPER_SIGNAL -> ApplicantOnboardingStepSpec(
            route = this,
            title = "Go deeper",
            subtitle = "Add a short thought after your short take, or skip it for now.",
            primaryActionLabel = "Continue",
        )
        ApplicantOnboardingRoute.DEEPER_VIDEO -> ApplicantOnboardingStepSpec(
            route = this,
            title = "Optional deeper signal",
            subtitle = "Add a longer signal video, or skip it and finish your profile.",
            primaryActionLabel = "Upload deeper signal",
        )
        ApplicantOnboardingRoute.FINAL_PROFILE -> ApplicantOnboardingStepSpec(
            route = this,
            title = "Save your profile",
            subtitle = "Finish the recruiter-facing basics.",
            primaryActionLabel = "Finish profile",
        )
        ApplicantOnboardingRoute.APP_SHELL -> ApplicantOnboardingStepSpec(
            route = this,
            title = "Home",
            subtitle = "Your applicant profile is ready.",
            primaryActionLabel = null,
        )
    }
}

data class ApplicantOnboardingState(
    val status: ApplicantOnboardingStatus? = null,
    val profile: ApplicantProfileResponse? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
) {
    val loadingMessage: String
        get() = "Loading onboarding"

    val route: ApplicantOnboardingRoute
        get() = when (status) {
            null,
            ApplicantOnboardingStatus.AUTH_COMPLETE -> ApplicantOnboardingRoute.EDUCATION
            ApplicantOnboardingStatus.EDUCATION_COMPLETE -> ApplicantOnboardingRoute.RESUME
            ApplicantOnboardingStatus.RESUME_COMPLETE -> ApplicantOnboardingRoute.SIGNAL_PROMPT
            ApplicantOnboardingStatus.SIGNAL_PROMPT_SELECTED -> ApplicantOnboardingRoute.SHORT_TAKE_UPLOAD
            ApplicantOnboardingStatus.SIGNAL_VIDEO_UPLOADED -> ApplicantOnboardingRoute.DEEPER_SIGNAL
            ApplicantOnboardingStatus.DEEPER_SIGNAL_SEEN -> ApplicantOnboardingRoute.DEEPER_VIDEO
            ApplicantOnboardingStatus.DEEPER_VIDEO_SKIPPED,
            ApplicantOnboardingStatus.DEEPER_VIDEO_UPLOADED -> ApplicantOnboardingRoute.FINAL_PROFILE
            ApplicantOnboardingStatus.PROFILE_FORM_COMPLETE,
            ApplicantOnboardingStatus.ONBOARDING_COMPLETE -> ApplicantOnboardingRoute.APP_SHELL
        }

    val stepSpec: ApplicantOnboardingStepSpec
        get() = route.toStepSpec()
}

data class SignalPromptSelectionState(
    val prompts: List<SignalPrompt> = emptyList(),
    val selectedPromptId: String? = prompts.firstOrNull()?.id,
    val isLoading: Boolean = false,
    val isWorking: Boolean = false,
    val errorMessage: String? = null,
) {
    val visiblePrompts: List<SignalPrompt>
        get() = prompts.take(8)

    val canContinue: Boolean
        get() = !isWorking && selectedPromptId != null

    fun select(promptId: String): SignalPromptSelectionState {
        return copy(selectedPromptId = promptId)
    }
}

data class DeeperSignalState(
    val elaboration: String = "",
    val isWorking: Boolean = false,
    val errorMessage: String? = null,
) {
    val normalizedElaboration: String?
        get() = elaboration.trim().takeIf { it.isNotBlank() }
}

data class ApplicantFinalProfileFormState(
    val profile: ApplicantProfileResponse?,
    val resumeResponse: ApplicantResumeResponse? = null,
    val searchProfile: ApplicantSearchProfile? = null,
    val isLoadingSearchStatus: Boolean = false,
    val name: String = profile?.applicant?.displayName.orEmpty(),
    val gpa: String = profile?.education?.gpa?.let { "%.2f".format(it) }.orEmpty(),
    val major: String = profile?.education?.major.orEmpty(),
    val minor: String = profile?.education?.minor.orEmpty(),
    val isWorking: Boolean = false,
    val errorMessage: String? = null,
) {
    val parsedGpa: Double?
        get() = gpa.trim().takeIf { it.isNotBlank() }?.toDoubleOrNull()

    val roundedGpa: Double?
        get() = parsedGpa?.let { round(it * 100) / 100 }

    val gpaError: String?
        get() {
            val value = parsedGpa ?: return if (gpa.trim().isBlank()) null else "GPA must be between 0.00 and 4.00."
            return if (value in 0.0..4.0) null else "GPA must be between 0.00 and 4.00."
        }

    val shouldShowSearchProfileRecovery: Boolean
        get() {
            if (isLoadingSearchStatus) return false
            if (searchProfile != null) return false
            return resumeResponse?.parseStatus != ApplicantResumeParseStatus.READY
        }

    val searchProfileRecoveryDescription: String
        get() = when (resumeResponse?.parseStatus) {
            ApplicantResumeParseStatus.NEEDS_EXTRACTION ->
                "Your resume is uploaded, but searchable text is not ready yet. You can still finish onboarding, or add skills and fields manually so recruiter search can find you."
            ApplicantResumeParseStatus.READY ->
                "Add your skills and fields manually to strengthen matching beyond your resume."
            ApplicantResumeParseStatus.NONE,
            null ->
                "You do not have searchable resume text yet. You can still finish onboarding, or add your skills and fields manually now."
        }

    val canFinish: Boolean
        get() = !isWorking && name.trim().isNotEmpty() && profile?.education != null && gpaError == null

    val blockingMessage: String?
        get() = when {
            name.trim().isEmpty() -> "Name is required."
            profile?.education == null -> "Profile details are not ready yet."
            gpaError != null -> gpaError
            else -> null
        }

    val command: ApplicantOnboardingProfileCommand?
        get() {
            val education = profile?.education ?: return null
            return ApplicantOnboardingProfileCommand(
                name = name.trim(),
                education = education,
                gpa = roundedGpa,
                major = major.trim().takeIf { it.isNotBlank() },
                minor = minor.trim().takeIf { it.isNotBlank() },
            )
        }
}
