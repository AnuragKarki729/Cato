package com.cato.app.usecase

import com.cato.app.core.ApplicantInterestAction
import com.cato.app.core.ApplicantAccomplishment
import com.cato.app.core.ApplicantAccomplishmentCommand
import com.cato.app.core.ApplicantInternship
import com.cato.app.core.ApplicantInternshipCommand
import com.cato.app.core.ApplicantProfileResponse
import com.cato.app.core.ApplicantProject
import com.cato.app.core.ApplicantProjectCommand
import com.cato.app.core.ApplicantReelUploadCommand
import com.cato.app.core.ApplicantReelVideo
import com.cato.app.core.ApplicantRepository
import com.cato.app.core.PublicDiscoveryRepository
import com.cato.app.core.ApplicantOnboardingEducationCommand
import com.cato.app.core.ApplicantResumeUploadCommand
import com.cato.app.core.ApplicantResumeParseStatus
import com.cato.app.core.ApplicantParsedResumeTextCommand
import com.cato.app.core.ApplicantSignalVideoCompleteCommand
import com.cato.app.core.ApplicantOnboardingProfileCommand
import com.cato.app.core.MatchingDepth
import com.cato.app.state.ApplicantEducationEditorState
import com.cato.app.state.ApplicantHomeState
import com.cato.app.state.ApplicantConversationState
import com.cato.app.state.ApplicantFinalProfileFormState
import com.cato.app.state.ApplicantOnboardingState
import com.cato.app.state.ApplicantReelUploadWizardState
import com.cato.app.state.PublicApplicantVideoFeedState
import com.cato.app.state.ApplicantRequestsState
import com.cato.app.state.PublicApplicantVideoProfileState
import com.cato.app.state.SignalPromptSelectionState

class LoadApplicantHomeUseCase(
    private val repository: ApplicantRepository,
) {
    suspend operator fun invoke(accessToken: String): ApplicantHomeState {
        return ApplicantHomeState(
            profile = repository.profile(accessToken),
            activity = repository.activity(accessToken),
            requests = repository.interestRequests(accessToken),
            resumeResponse = repository.resume(accessToken),
            searchProfile = repository.searchProfile(accessToken),
        )
    }
}

class LoadApplicantManualMatchingStatusUseCase(
    private val repository: ApplicantRepository,
) {
    suspend operator fun invoke(accessToken: String): Boolean {
        val searchProfile = repository.searchProfile(accessToken)
        if (searchProfile != null) return false
        return repository.resume(accessToken).parseStatus != ApplicantResumeParseStatus.READY
    }
}

class LoadApplicantOnboardingUseCase(
    private val repository: ApplicantRepository,
) {
    suspend operator fun invoke(accessToken: String): ApplicantOnboardingState {
        val status = repository.onboardingStatus(accessToken)
        val profile = runCatching { repository.profile(accessToken) }.getOrNull()
        return ApplicantOnboardingState(
            status = status.onboardingStatus,
            profile = profile,
            isLoading = false,
            errorMessage = null,
        )
    }
}

class SignalPromptSelectionUseCase(
    private val repository: ApplicantRepository,
) {
    suspend fun load(accessToken: String): SignalPromptSelectionState {
        val response = repository.signalPrompts(accessToken)
        return SignalPromptSelectionState(
            prompts = response.prompts,
            selectedPromptId = response.prompts.firstOrNull()?.id,
            isLoading = false,
        )
    }

    suspend fun select(accessToken: String, state: SignalPromptSelectionState): SignalPromptSelectionState {
        val promptId = state.selectedPromptId ?: return state.copy(errorMessage = "Choose a prompt first.")
        repository.selectSignalPrompt(accessToken, promptId)
        return state.copy(isWorking = false, errorMessage = null)
    }
}

class ApplicantOnboardingActionsUseCase(
    private val repository: ApplicantRepository,
) {
    suspend fun saveEducation(accessToken: String, command: ApplicantOnboardingEducationCommand) {
        require(command.universityName.isNotBlank()) { "University is required." }
        repository.saveOnboardingEducation(accessToken, command)
    }

    suspend fun skipResume(accessToken: String) {
        repository.skipResume(accessToken)
    }

    suspend fun uploadResume(accessToken: String, command: ApplicantResumeUploadCommand) {
        require(command.originalFileName.endsWith(".pdf", ignoreCase = true)) { "Only PDF resumes are supported." }
        repository.uploadResume(accessToken, command)
    }

    suspend fun saveParsedResumeText(accessToken: String, command: ApplicantParsedResumeTextCommand) {
        require(command.text.isNotBlank()) { "Parsed resume text cannot be empty." }
        repository.saveParsedResumeText(accessToken, command)
    }

    suspend fun acceptConsent(accessToken: String, resume: Boolean = false, video: Boolean = false, privacyPolicy: Boolean = false) {
        repository.acceptConsent(accessToken, resume = resume, video = video, privacyPolicy = privacyPolicy)
    }

    suspend fun prepareSignalVideoUpload(
        accessToken: String,
        type: String,
        contentType: String,
        fileSizeBytes: Int? = null,
    ) = repository.prepareSignalVideoUpload(accessToken, type, contentType, fileSizeBytes)

    suspend fun completeSignalVideo(accessToken: String, type: String, command: ApplicantSignalVideoCompleteCommand) {
        require(command.durationSeconds > 0) { "Video duration must be available." }
        repository.completeSignalVideoUpload(accessToken, type, command)
    }

    suspend fun markDeeperSignalSeen(accessToken: String, elaboration: String?) {
        repository.markDeeperSignalSeen(accessToken, elaboration)
    }

    suspend fun skipDeeperVideo(accessToken: String) {
        repository.skipDeeperVideo(accessToken)
    }

    suspend fun completeProfile(accessToken: String, command: ApplicantOnboardingProfileCommand) {
        require(command.name.isNotBlank()) { "Name is required." }
        command.gpa?.let { gpa ->
            require(gpa in 0.0..4.0) { "GPA must be between 0.00 and 4.00." }
        }
        repository.completeOnboardingProfile(accessToken, command)
    }
}

class SubmitApplicantFinalProfileUseCase(
    private val repository: ApplicantRepository,
) {
    suspend operator fun invoke(accessToken: String, state: ApplicantFinalProfileFormState): ApplicantFinalProfileFormState {
        val blockingMessage = state.blockingMessage
        if (blockingMessage != null) return state.copy(errorMessage = blockingMessage)

        val command = state.command ?: return state.copy(errorMessage = "Profile details are not ready yet.")
        repository.completeOnboardingProfile(accessToken, command)
        return state.copy(isWorking = false, errorMessage = null)
    }
}

class LoadApplicantRequestsUseCase(
    private val repository: ApplicantRepository,
) {
    suspend operator fun invoke(accessToken: String): ApplicantRequestsState {
        return ApplicantRequestsState(requests = repository.interestRequests(accessToken))
    }
}

class RespondToApplicantRequestUseCase(
    private val repository: ApplicantRepository,
) {
    suspend operator fun invoke(
        state: ApplicantRequestsState,
        accessToken: String,
        requestId: String,
        action: ApplicantInterestAction,
    ): ApplicantRequestsState {
        val updated = repository.respondToInterestRequest(accessToken, requestId, action)
        val message = if (action == ApplicantInterestAction.ACCEPT) "Request accepted." else "Request declined."
        return state.replaceRequest(updated, message)
    }
}

class LoadApplicantConversationUseCase(
    private val repository: ApplicantRepository,
) {
    suspend operator fun invoke(state: ApplicantConversationState, accessToken: String): ApplicantConversationState {
        return state.copy(
            messages = repository.conversationMessages(accessToken, state.request.id),
            isLoading = false,
            errorMessage = null,
        )
    }
}

class SendApplicantConversationMessageUseCase(
    private val repository: ApplicantRepository,
) {
    suspend operator fun invoke(state: ApplicantConversationState, accessToken: String): ApplicantConversationState {
        val body = state.trimmedDraft
        require(body.isNotEmpty()) { "Message cannot be empty." }
        repository.sendConversationMessage(accessToken, state.request.id, body)
        return state.copy(
            draft = "",
            messages = repository.conversationMessages(accessToken, state.request.id),
            isSending = false,
            errorMessage = null,
        )
    }
}

class SaveApplicantSearchProfileUseCase(
    private val repository: ApplicantRepository,
) {
    suspend operator fun invoke(
        accessToken: String,
        skillIds: List<String>,
        fieldIds: List<String>,
        depth: MatchingDepth,
    ) {
        require(skillIds.size <= 100) { "Applicants can select at most 100 skills." }
        require(fieldIds.size <= 10) { "Applicants can select at most 10 fields." }
        repository.saveSearchProfile(accessToken, skillIds, fieldIds, depth)
    }
}

class SaveApplicantEducationUseCase(
    private val repository: ApplicantRepository,
) {
    suspend operator fun invoke(accessToken: String, state: ApplicantEducationEditorState): ApplicantEducationEditorState {
        state.gpaError?.let { return state.copy(errorMessage = it) }
        if (state.name.trim().isEmpty()) return state.copy(errorMessage = "Name is required.")
        if (state.universityName.trim().isEmpty()) return state.copy(errorMessage = "University is required.")

        repository.updateAccount(accessToken, state.name.trim())
        repository.updateEducation(accessToken, state.educationCommand)
        return state.copy(isSaving = false, errorMessage = null)
    }
}

class LoadApplicantReelsProfileUseCase(
    private val repository: ApplicantRepository,
) {
    suspend operator fun invoke(accessToken: String): ApplicantReelsProfileData {
        return ApplicantReelsProfileData(
            profile = repository.profile(accessToken),
            reels = repository.reels(accessToken),
            accomplishments = repository.accomplishments(accessToken),
        )
    }
}

class LoadPublicApplicantVideoProfileUseCase(
    private val repository: PublicDiscoveryRepository,
) {
    suspend operator fun invoke(accessToken: String, applicantId: String): PublicApplicantVideoProfileState {
        val response = repository.publicApplicantProfile(accessToken, applicantId)
        return PublicApplicantVideoProfileState(
            displayName = response.displayName,
            educationLine = response.educationLine,
            reels = response.videos,
            publicProjects = response.projects,
            publicAccomplishments = response.accomplishments,
        )
    }
}

class LoadPublicApplicantVideoFeedUseCase(
    private val repository: PublicDiscoveryRepository,
) {
    suspend operator fun invoke(accessToken: String, limit: Int = 20, offset: Int = 0): PublicApplicantVideoFeedState {
        return PublicApplicantVideoFeedState(videos = repository.videoFeed(accessToken, limit = limit, offset = offset))
    }
}

class PublicApplicantVideoInteractionUseCase(
    private val repository: PublicDiscoveryRepository,
) {
    suspend fun markCurrentViewed(accessToken: String, state: PublicApplicantVideoFeedState): PublicApplicantVideoFeedState {
        val video = state.currentVideo ?: return state
        if (state.isCurrentVideoViewed) return state
        repository.markVideoViewed(accessToken, video.id)
        return state.markCurrentViewed()
    }

    suspend fun toggleCurrentLike(accessToken: String, state: PublicApplicantVideoFeedState): PublicApplicantVideoFeedState {
        val video = state.currentVideo ?: return state
        val nextValue = !state.isCurrentVideoLiked
        repository.setVideoLiked(accessToken, video.id, nextValue)
        return state.toggleCurrentLike()
    }
}

data class ApplicantReelsProfileData(
    val profile: ApplicantProfileResponse,
    val reels: List<ApplicantReelVideo>,
    val accomplishments: List<ApplicantAccomplishment>,
)

class PublishApplicantReelUseCase(
    private val repository: ApplicantRepository,
) {
    suspend operator fun invoke(accessToken: String, command: ApplicantReelUploadCommand): ApplicantReelVideo {
        require(command.links.isNotEmpty()) { "A reel must be linked to at least one project, internship, or accomplishment." }
        require((command.caption?.length ?: 0) <= 250) { "Caption must be 250 characters or fewer." }
        require(command.durationSeconds <= 60.0) { "Profile reels can be up to 60 seconds." }
        return repository.completeReelUpload(accessToken, command)
    }
}

class PrepareApplicantReelUploadUseCase(
    private val repository: ApplicantRepository,
) {
    suspend operator fun invoke(accessToken: String) = repository.prepareReelUpload(accessToken)
}

class UpdateApplicantReelCaptionUseCase(
    private val repository: ApplicantRepository,
) {
    suspend operator fun invoke(accessToken: String, reelId: String, caption: String?): ApplicantReelVideo {
        require((caption?.length ?: 0) <= 250) { "Caption must be 250 characters or fewer." }
        return repository.updateReelCaption(accessToken, reelId, caption?.trim()?.takeIf { it.isNotBlank() })
    }
}

class DeleteApplicantReelUseCase(
    private val repository: ApplicantRepository,
) {
    suspend operator fun invoke(accessToken: String, reelId: String) {
        repository.deleteReel(accessToken, reelId)
    }
}

class ApplicantReelEvidenceCreationUseCase(
    private val repository: ApplicantRepository,
) {
    suspend fun createProject(accessToken: String, state: ApplicantReelUploadWizardState): ApplicantReelUploadWizardState {
        val draft = state.newProjectDraft
        require(draft.canCreate) { draft.validationMessage ?: "Project cannot be created." }
        val created = repository.createProject(accessToken, draft.command)
        return state.afterProjectCreated(created)
    }

    suspend fun createInternship(accessToken: String, state: ApplicantReelUploadWizardState): ApplicantReelUploadWizardState {
        val draft = state.newInternshipDraft
        require(draft.canCreate) { draft.validationMessage ?: "Internship cannot be created." }
        val created = repository.createInternship(accessToken, draft.command)
        return state.afterInternshipCreated(created)
    }

    suspend fun createAccomplishment(accessToken: String, state: ApplicantReelUploadWizardState): ApplicantReelUploadWizardState {
        val draft = state.newAccomplishmentDraft
        require(draft.canCreate) { draft.validationMessage ?: "Accomplishment cannot be created." }
        val created = repository.createAccomplishment(accessToken, draft.command)
        return state.afterAccomplishmentCreated(created)
    }
}

class UpsertApplicantProjectUseCase(
    private val repository: ApplicantRepository,
) {
    suspend fun create(accessToken: String, command: ApplicantProjectCommand): ApplicantProject {
        validate(command)
        return repository.createProject(accessToken, command)
    }

    suspend fun update(accessToken: String, projectId: String, command: ApplicantProjectCommand): ApplicantProject {
        validate(command)
        return repository.updateProject(accessToken, projectId, command)
    }

    suspend fun delete(accessToken: String, projectId: String) {
        repository.deleteProject(accessToken, projectId)
    }

    private fun validate(command: ApplicantProjectCommand) {
        require(command.title.isNotBlank()) { "Project title is required." }
        require(command.description.isNotBlank()) { "Project description is required." }
    }
}

class UpsertApplicantInternshipUseCase(
    private val repository: ApplicantRepository,
) {
    suspend fun create(accessToken: String, command: ApplicantInternshipCommand): ApplicantInternship {
        validate(command)
        return repository.createInternship(accessToken, command)
    }

    suspend fun update(accessToken: String, internshipId: String, command: ApplicantInternshipCommand): ApplicantInternship {
        validate(command)
        return repository.updateInternship(accessToken, internshipId, command)
    }

    suspend fun delete(accessToken: String, internshipId: String) {
        repository.deleteInternship(accessToken, internshipId)
    }

    private fun validate(command: ApplicantInternshipCommand) {
        require(command.company.isNotBlank()) { "Company is required." }
        require(command.roleDepartment.isNotBlank()) { "Role or department is required." }
        require(command.durationMonths > 0) { "Duration must be at least one month." }
    }
}

class CreateApplicantAccomplishmentUseCase(
    private val repository: ApplicantRepository,
) {
    suspend operator fun invoke(accessToken: String, command: ApplicantAccomplishmentCommand): ApplicantAccomplishment {
        require(command.title.isNotBlank()) { "Accomplishment title is required." }
        require(command.description.isNotBlank()) { "Accomplishment description is required." }
        return repository.createAccomplishment(accessToken, command)
    }
}
