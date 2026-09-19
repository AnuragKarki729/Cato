package com.cato.app.usecase

import com.cato.app.core.ApplicantAccomplishment
import com.cato.app.core.ApplicantAccomplishmentCommand
import com.cato.app.core.ApplicantActivityResponse
import com.cato.app.core.ApplicantConversationMessage
import com.cato.app.core.ApplicantEducation
import com.cato.app.core.ApplicantEducationCommand
import com.cato.app.core.ApplicantInternship
import com.cato.app.core.ApplicantInternshipCommand
import com.cato.app.core.ApplicantInterestAction
import com.cato.app.core.ApplicantInterestRequest
import com.cato.app.core.ApplicantOnboardingEducationCommand
import com.cato.app.core.ApplicantOnboardingProfileCommand
import com.cato.app.core.ApplicantOnboardingStatusResponse
import com.cato.app.core.ApplicantParsedResumeTextCommand
import com.cato.app.core.ApplicantProfileResponse
import com.cato.app.core.ApplicantProject
import com.cato.app.core.ApplicantProjectCommand
import com.cato.app.core.ApplicantReelUploadCommand
import com.cato.app.core.ApplicantReelVideo
import com.cato.app.core.ApplicantRepository
import com.cato.app.core.ApplicantResumeResponse
import com.cato.app.core.ApplicantResumeParseStatus
import com.cato.app.core.ApplicantResumeUploadCommand
import com.cato.app.core.ApplicantSearchProfile
import com.cato.app.core.ApplicantSignal
import com.cato.app.core.ApplicantSignalVideoCompleteCommand
import com.cato.app.core.ApplicantVideoEvidenceLink
import com.cato.app.core.ApplicantVideoUploadPreparation
import com.cato.app.core.MatchingDepth
import com.cato.app.core.SignalPromptsResponse
import com.cato.app.state.ApplicantReelEvidenceType
import com.cato.app.state.ApplicantFinalProfileFormState
import com.cato.app.state.ApplicantReelNewAccomplishmentDraft
import com.cato.app.state.ApplicantReelNewInternshipDraft
import com.cato.app.state.ApplicantReelNewProjectDraft
import com.cato.app.state.ApplicantReelUploadWizardState
import kotlin.coroutines.Continuation
import kotlin.coroutines.EmptyCoroutineContext
import kotlin.coroutines.startCoroutine
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class ApplicantReelEvidenceCreationUseCaseTest {
    @Test
    fun createsProjectAndSelectsItForTheReelWizard() = runSuspend {
        val repository = FakeApplicantRepository()
        val state = ApplicantReelUploadWizardState(
            newProjectDraft = ApplicantReelNewProjectDraft(
                title = "Portfolio",
                type = "built_project",
                description = "Built a hiring app",
            )
        )

        val updated = ApplicantReelEvidenceCreationUseCase(repository).createProject("token", state)

        assertEquals("Portfolio", repository.createdProjectCommand?.title)
        assertEquals(ApplicantReelEvidenceType.PROJECT, updated.expandedEvidenceType)
        assertTrue(ApplicantVideoEvidenceLink("project", "project-created") in updated.selectedLinks)
        assertEquals("", updated.newProjectDraft.title)
    }

    @Test
    fun createsInternshipAndAccomplishmentAndSelectsThem() = runSuspend {
        val repository = FakeApplicantRepository()
        val useCase = ApplicantReelEvidenceCreationUseCase(repository)
        val state = ApplicantReelUploadWizardState(
            newInternshipDraft = ApplicantReelNewInternshipDraft(
                company = "Acme",
                roleDepartment = "Engineering",
                durationMonthsText = "3",
            ),
            newAccomplishmentDraft = ApplicantReelNewAccomplishmentDraft(
                title = "Published thesis",
                description = "Resume parser research",
            ),
        )

        val withInternship = useCase.createInternship("token", state)
        val withAccomplishment = useCase.createAccomplishment("token", withInternship)

        assertEquals("Acme", repository.createdInternshipCommand?.company)
        assertEquals(3, repository.createdInternshipCommand?.durationMonths)
        assertTrue(ApplicantVideoEvidenceLink("internship", "internship-created") in withInternship.selectedLinks)
        assertEquals("Published thesis", repository.createdAccomplishmentCommand?.title)
        assertEquals(ApplicantReelEvidenceType.ACCOMPLISHMENT, withAccomplishment.expandedEvidenceType)
        assertTrue(ApplicantVideoEvidenceLink("accomplishment", "accomplishment-created") in withAccomplishment.selectedLinks)
    }

    @Test
    fun manualMatchingStatusMatchesApplicantShellWarningLogic() = runSuspend {
        val repository = FakeApplicantRepository(
            resumeResponse = ApplicantResumeResponse(parseStatus = ApplicantResumeParseStatus.NEEDS_EXTRACTION),
            searchProfile = null,
        )
        val useCase = LoadApplicantManualMatchingStatusUseCase(repository)

        assertTrue(useCase("token"))

        repository.searchProfile = ApplicantSearchProfile(
            id = "profile",
            applicantId = "applicant",
            depth = MatchingDepth(com.cato.app.core.MatchingOptionType.SKILL, "kotlin"),
            source = "manual",
        )
        assertEquals(false, useCase("token"))

        repository.searchProfile = null
        repository.resumeResponse = ApplicantResumeResponse(parseStatus = ApplicantResumeParseStatus.READY)
        assertEquals(false, useCase("token"))
    }

    @Test
    fun preparesProfileReelUploadBeforeClientUploadsVideo() = runSuspend {
        val repository = FakeApplicantRepository()

        val preparation = PrepareApplicantReelUploadUseCase(repository)("token")

        assertEquals("https://upload.example.com", preparation.uploadUrl)
        assertEquals("cato-cloud", preparation.cloudName)
        assertEquals("folder", preparation.folder)
        assertEquals("token", repository.preparedReelUploadToken)
    }

    @Test
    fun preparesOnboardingSignalVideoUploadBeforeClientUploadsVideo() = runSuspend {
        val repository = FakeApplicantRepository()

        val preparation = ApplicantOnboardingActionsUseCase(repository)
            .prepareSignalVideoUpload("token", type = "signal", contentType = "video/mp4", fileSizeBytes = 2_000)

        assertEquals("signal", repository.preparedSignalType)
        assertEquals("video/mp4", repository.preparedSignalContentType)
        assertEquals(2_000, repository.preparedSignalFileSizeBytes)
        assertEquals("public-id", preparation.publicId)
    }

    @Test
    fun completeOnboardingProfileValidatesGpaLikeSwiftFinalStep() = runSuspend {
        val repository = FakeApplicantRepository()
        val valid = ApplicantOnboardingProfileCommand(
            name = "Zoe",
            education = ApplicantEducation(
                universityName = "Stanford",
                semesterLabel = "Sophomore / Semester 4",
                semesterNumber = 4,
            ),
            gpa = 3.9,
        )
        val invalid = valid.copy(gpa = 4.5)
        val useCase = ApplicantOnboardingActionsUseCase(repository)

        useCase.completeProfile("token", valid)

        assertEquals("Zoe", repository.completedProfileCommand?.name)
        val error = assertFailsWith<IllegalArgumentException> {
            runSuspend { useCase.completeProfile("token", invalid) }
        }
        assertEquals("GPA must be between 0.00 and 4.00.", error.message)
    }

    @Test
    fun submitFinalProfileFormUsesValidatedStateCommand() = runSuspend {
        val repository = FakeApplicantRepository()
        val profile = ApplicantProfileResponse(
            applicant = com.cato.app.core.ApplicantAccount(id = "a", supabaseUserId = "s", email = "a@example.com", name = "Zoe"),
            education = ApplicantEducation(
                universityName = "Stanford",
                semesterLabel = "Sophomore / Semester 4",
                semesterNumber = 4,
            ),
        )
        val valid = ApplicantFinalProfileFormState(profile = profile, name = " Zoe Chen ", gpa = "3.856")
        val invalid = valid.copy(gpa = "4.5")
        val useCase = SubmitApplicantFinalProfileUseCase(repository)

        val submitted = useCase("token", valid)
        val rejected = useCase("token", invalid)

        assertEquals(null, submitted.errorMessage)
        assertEquals("Zoe Chen", repository.completedProfileCommand?.name)
        assertEquals(3.86, repository.completedProfileCommand?.gpa)
        assertEquals("GPA must be between 0.00 and 4.00.", rejected.errorMessage)
    }
}

private class FakeApplicantRepository(
    var resumeResponse: ApplicantResumeResponse = ApplicantResumeResponse(),
    var searchProfile: ApplicantSearchProfile? = null,
) : ApplicantRepository {
    var createdProjectCommand: ApplicantProjectCommand? = null
    var createdInternshipCommand: ApplicantInternshipCommand? = null
    var createdAccomplishmentCommand: ApplicantAccomplishmentCommand? = null
    var preparedReelUploadToken: String? = null
    var preparedSignalType: String? = null
    var preparedSignalContentType: String? = null
    var preparedSignalFileSizeBytes: Int? = null
    var completedProfileCommand: ApplicantOnboardingProfileCommand? = null

    override suspend fun createProject(accessToken: String, command: ApplicantProjectCommand): ApplicantProject {
        createdProjectCommand = command
        return ApplicantProject(id = "project-created", title = command.title, type = command.type, description = command.description)
    }

    override suspend fun createInternship(accessToken: String, command: ApplicantInternshipCommand): ApplicantInternship {
        createdInternshipCommand = command
        return ApplicantInternship(id = "internship-created", company = command.company, roleDepartment = command.roleDepartment, durationMonths = command.durationMonths)
    }

    override suspend fun createAccomplishment(
        accessToken: String,
        command: ApplicantAccomplishmentCommand,
    ): ApplicantAccomplishment {
        createdAccomplishmentCommand = command
        return ApplicantAccomplishment(id = "accomplishment-created", title = command.title, description = command.description)
    }

    override suspend fun profile(accessToken: String): ApplicantProfileResponse = TODO("not used")
    override suspend fun activity(accessToken: String): ApplicantActivityResponse = TODO("not used")
    override suspend fun interestRequests(accessToken: String): List<ApplicantInterestRequest> = TODO("not used")
    override suspend fun onboardingStatus(accessToken: String): ApplicantOnboardingStatusResponse = TODO("not used")
    override suspend fun saveOnboardingEducation(accessToken: String, command: ApplicantOnboardingEducationCommand): ApplicantEducation = TODO("not used")
    override suspend fun skipResume(accessToken: String) = TODO("not used")
    override suspend fun uploadResume(accessToken: String, command: ApplicantResumeUploadCommand) = TODO("not used")
    override suspend fun resume(accessToken: String): ApplicantResumeResponse = resumeResponse
    override suspend fun saveParsedResumeText(accessToken: String, command: ApplicantParsedResumeTextCommand) = TODO("not used")
    override suspend fun acceptConsent(accessToken: String, resume: Boolean, video: Boolean, privacyPolicy: Boolean) = TODO("not used")
    override suspend fun signalPrompts(accessToken: String): SignalPromptsResponse = TODO("not used")
    override suspend fun selectSignalPrompt(accessToken: String, promptId: String) = TODO("not used")
    override suspend fun prepareSignalVideoUpload(
        accessToken: String,
        type: String,
        contentType: String,
        fileSizeBytes: Int?,
    ): ApplicantVideoUploadPreparation {
        preparedSignalType = type
        preparedSignalContentType = contentType
        preparedSignalFileSizeBytes = fileSizeBytes
        return uploadPreparation()
    }
    override suspend fun completeSignalVideoUpload(accessToken: String, type: String, command: ApplicantSignalVideoCompleteCommand): ApplicantSignal? = TODO("not used")
    override suspend fun markDeeperSignalSeen(accessToken: String, elaboration: String?) = TODO("not used")
    override suspend fun skipDeeperVideo(accessToken: String) = TODO("not used")
    override suspend fun completeOnboardingProfile(accessToken: String, command: ApplicantOnboardingProfileCommand) {
        completedProfileCommand = command
    }
    override suspend fun searchProfile(accessToken: String): ApplicantSearchProfile? = searchProfile
    override suspend fun saveSearchProfile(accessToken: String, skillIds: List<String>, fieldIds: List<String>, depth: MatchingDepth) = TODO("not used")
    override suspend fun updateAccount(accessToken: String, name: String) = TODO("not used")
    override suspend fun updateEducation(accessToken: String, command: ApplicantEducationCommand): ApplicantEducation = TODO("not used")
    override suspend fun reels(accessToken: String): List<ApplicantReelVideo> = TODO("not used")
    override suspend fun accomplishments(accessToken: String): List<ApplicantAccomplishment> = TODO("not used")
    override suspend fun respondToInterestRequest(accessToken: String, requestId: String, action: ApplicantInterestAction): ApplicantInterestRequest = TODO("not used")
    override suspend fun conversationMessages(accessToken: String, requestId: String): List<ApplicantConversationMessage> = TODO("not used")
    override suspend fun sendConversationMessage(accessToken: String, requestId: String, body: String) = TODO("not used")
    override suspend fun prepareReelUpload(accessToken: String): ApplicantVideoUploadPreparation {
        preparedReelUploadToken = accessToken
        return uploadPreparation()
    }

    private fun uploadPreparation(): ApplicantVideoUploadPreparation {
        return ApplicantVideoUploadPreparation(
            uploadUrl = "https://upload.example.com",
            cloudName = "cato-cloud",
            apiKey = "api-key",
            timestamp = 123,
            signature = "signature",
            folder = "folder",
            publicId = "public-id",
            maxFileSizeBytes = 25_000_000,
            expiresInSeconds = 3600,
        )
    }
    override suspend fun completeReelUpload(accessToken: String, command: ApplicantReelUploadCommand): ApplicantReelVideo = TODO("not used")
    override suspend fun updateReelCaption(accessToken: String, reelId: String, caption: String?): ApplicantReelVideo = TODO("not used")
    override suspend fun deleteReel(accessToken: String, reelId: String) = TODO("not used")
    override suspend fun updateProject(accessToken: String, projectId: String, command: ApplicantProjectCommand): ApplicantProject = TODO("not used")
    override suspend fun deleteProject(accessToken: String, projectId: String) = TODO("not used")
    override suspend fun updateInternship(accessToken: String, internshipId: String, command: ApplicantInternshipCommand): ApplicantInternship = TODO("not used")
    override suspend fun deleteInternship(accessToken: String, internshipId: String) = TODO("not used")
}

private fun runSuspend(block: suspend () -> Unit) {
    var failure: Throwable? = null
    block.startCoroutine(
        object : Continuation<Unit> {
            override val context = EmptyCoroutineContext
            override fun resumeWith(result: Result<Unit>) {
                failure = result.exceptionOrNull()
            }
        }
    )
    failure?.let { throw it }
}
