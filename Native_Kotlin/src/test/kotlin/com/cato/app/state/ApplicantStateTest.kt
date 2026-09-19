package com.cato.app.state

import com.cato.app.core.ApplicantAccount
import com.cato.app.core.ApplicantAccomplishment
import com.cato.app.core.ApplicantActivity
import com.cato.app.core.ApplicantActivityMetrics
import com.cato.app.core.ApplicantActivityResponse
import com.cato.app.core.ApplicantConversationMessage
import com.cato.app.core.ApplicantInterestRequest
import com.cato.app.core.ApplicantInterestRequestStatus
import com.cato.app.core.ApplicantProfileResponse
import com.cato.app.core.ApplicantEducation
import com.cato.app.core.ApplicantInternship
import com.cato.app.core.ApplicantMediaAsset
import com.cato.app.core.ApplicantResumeParseStatus
import com.cato.app.core.ApplicantResumeResponse
import com.cato.app.core.ApplicantResume
import com.cato.app.core.ApplicantReelVideo
import com.cato.app.core.ApplicantSearchProfile
import com.cato.app.core.ApplicantSignal
import com.cato.app.core.ApplicantVideoEvidenceLink
import com.cato.app.core.ApplicantProject
import com.cato.app.core.ApplicantOnboardingStatus
import com.cato.app.core.MatchingDepth
import com.cato.app.core.SignalPrompt
import com.cato.app.core.MatchingOption
import com.cato.app.core.MatchingOptionType
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class ApplicantStateTest {
    @Test
    fun showsSearchRecoveryWhenResumeIsNotParsedAndManualProfileMissing() {
        val state = ApplicantHomeState(
            profile = ApplicantProfileResponse(
                applicant = ApplicantAccount(id = "a", supabaseUserId = "s", email = "a@example.com", name = "A"),
            ),
            resumeResponse = ApplicantResumeResponse(parseStatus = ApplicantResumeParseStatus.NEEDS_EXTRACTION),
            searchProfile = null,
        )

        assertTrue(state.shouldShowSearchRecoveryPrompt)
        assertTrue(state.searchRecoveryDescription.contains("not extracted searchable text"))
    }

    @Test
    fun hidesSearchRecoveryWhenSearchProfileExists() {
        val state = ApplicantHomeState(
            resumeResponse = ApplicantResumeResponse(parseStatus = ApplicantResumeParseStatus.NEEDS_EXTRACTION),
            searchProfile = com.cato.app.core.ApplicantSearchProfile(
                id = "p",
                applicantId = "a",
                depth = com.cato.app.core.MatchingDepth(com.cato.app.core.MatchingOptionType.SKILL, "kotlin"),
                source = "manual",
            ),
        )

        assertFalse(state.shouldShowSearchRecoveryPrompt)
    }

    @Test
    fun applicantHomeShowsRequestAndVisibilityPreviewsLikeSwiftDashboard() {
        val requests = (1..4).map { index ->
            ApplicantInterestRequest(
                id = "req-$index",
                recruiterId = "rec-$index",
                recruiterName = "Recruiter $index",
                companyName = "Company $index",
                reason = "Strong match $index",
                status = ApplicantInterestRequestStatus.ACCEPTED,
                sentAt = "2026-01-0$index",
                unreadMessageCount = if (index == 1) 12 else 0,
            )
        }
        val activity = ApplicantActivityResponse(
            metrics = ApplicantActivityMetrics(profileViews = 8, bookmarks = 2, shortlists = 1),
            recent = (1..5).map { index ->
                ApplicantActivity(
                    id = "act-$index",
                    applicantId = "app",
                    type = "profile_view",
                    title = "Viewed $index",
                    body = "Recruiter viewed profile $index",
                )
            },
        )
        val state = ApplicantHomeState(
            activity = activity,
            requests = requests,
        )

        assertTrue(state.hasRequestNotification)
        assertEquals(3, state.requestPreviewRows.size)
        assertEquals("9+", state.requestPreviewRows.first().unreadBadge)
        assertTrue(state.requestPreviewRows.first().emphasized)
        assertEquals(ApplicantRoute.RequestDetail("req-1"), state.requestPreviewRows.first().route)
        assertEquals(8, state.activityMetrics.profileViews)
        assertEquals(4, state.activityPreviewRows.size)
        assertEquals("Viewed 1", state.activityPreviewRows.first().title)
    }

    @Test
    fun typedSearchProfileEditorRequiresFieldsSkillsAndDepth() {
        val field = MatchingOption(id = "cat-tech", type = MatchingOptionType.CATEGORY, key = "technology", label = "Technology")
        val accounting = MatchingOption(id = "cat-accounting", type = MatchingOptionType.CATEGORY, key = "accounting", label = "Accounting")
        val skill = MatchingOption(id = "skill-kotlin", type = MatchingOptionType.SKILL, key = "kotlin", label = "Kotlin")
        val aws = MatchingOption(id = "skill-aws", type = MatchingOptionType.SKILL, key = "aws", label = "AWS")

        val withSelections = ApplicantSearchProfileEditorV2State()
            .select(field)
            .select(accounting)
            .select(skill)
            .select(aws)

        assertFalse(withSelections.isComplete)
        assertEquals("Choose the one area you are most fluent in.", withSelections.blockingMessage)
        assertEquals(listOf("Accounting", "Technology"), withSelections.selectedFields.map { it.label })
        assertEquals(listOf("AWS", "Kotlin"), withSelections.selectedSkills.map { it.label })

        val complete = withSelections.selectDepth(MatchingOptionType.SKILL, "kotlin")

        assertTrue(complete.isComplete)
        assertEquals(listOf("accounting", "technology"), complete.fieldIdsForSave)
        assertEquals(listOf("aws", "kotlin"), complete.skillIdsForSave)
        assertEquals("kotlin", complete.selectedDepth?.id)
    }

    @Test
    fun onboardingStepSpecsMirrorSwiftTitlesAndActions() {
        val education = ApplicantOnboardingState(ApplicantOnboardingStatus.AUTH_COMPLETE)
        val prompt = ApplicantOnboardingState(ApplicantOnboardingStatus.RESUME_COMPLETE)
        val finalProfile = ApplicantOnboardingState(ApplicantOnboardingStatus.DEEPER_VIDEO_UPLOADED)

        assertEquals("Loading onboarding", education.loadingMessage)
        assertEquals(ApplicantOnboardingRoute.EDUCATION, education.route)
        assertEquals("Your college", education.stepSpec.title)
        assertEquals("Start with the basics recruiters use to understand your current stage.", education.stepSpec.subtitle)
        assertEquals("Continue", education.stepSpec.primaryActionLabel)

        assertEquals(ApplicantOnboardingRoute.SIGNAL_PROMPT, prompt.route)
        assertEquals("What moves you?", prompt.stepSpec.title)
        assertEquals("Use this prompt", prompt.stepSpec.primaryActionLabel)

        assertEquals(ApplicantOnboardingRoute.FINAL_PROFILE, finalProfile.route)
        assertEquals("Save your profile", finalProfile.stepSpec.title)
        assertEquals("Finish profile", finalProfile.stepSpec.primaryActionLabel)
    }

    @Test
    fun onboardingCompletedRoutesToShellSpec() {
        val state = ApplicantOnboardingState(ApplicantOnboardingStatus.ONBOARDING_COMPLETE)

        assertEquals(ApplicantOnboardingRoute.APP_SHELL, state.route)
        assertEquals("Home", state.stepSpec.title)
        assertEquals(null, state.stepSpec.primaryActionLabel)
    }

    @Test
    fun finalProfileFormShowsManualMatchingRecoveryWhenResumeParsingIsMissing() {
        val state = ApplicantFinalProfileFormState(
            profile = ApplicantProfileResponse(
                applicant = ApplicantAccount(id = "a", supabaseUserId = "s", email = "a@example.com", name = "Zoe"),
                education = ApplicantEducation(
                    universityName = "Stanford",
                    semesterLabel = "Sophomore / Semester 4",
                    semesterNumber = 4,
                ),
            ),
            resumeResponse = ApplicantResumeResponse(parseStatus = ApplicantResumeParseStatus.NEEDS_EXTRACTION),
            searchProfile = null,
        )

        assertTrue(state.shouldShowSearchProfileRecovery)
        assertTrue(state.searchProfileRecoveryDescription.contains("searchable text is not ready yet"))

        val configured = state.copy(
            searchProfile = ApplicantSearchProfile(
                id = "profile",
                applicantId = "a",
                depth = MatchingDepth(MatchingOptionType.SKILL, "kotlin"),
                source = "manual",
            )
        )
        assertFalse(configured.shouldShowSearchProfileRecovery)
    }

    @Test
    fun finalProfileFormBuildsRoundedCommandAndValidatesGpa() {
        val profile = ApplicantProfileResponse(
            applicant = ApplicantAccount(id = "a", supabaseUserId = "s", email = "a@example.com", name = "Zoe"),
            education = ApplicantEducation(
                universityName = "Stanford",
                semesterLabel = "Sophomore / Semester 4",
                semesterNumber = 4,
                major = "Computer Science",
            ),
        )
        val state = ApplicantFinalProfileFormState(
            profile = profile,
            name = "  Zoe Chen  ",
            gpa = "3.856",
            major = " Computer Science ",
            minor = " Finance ",
        )
        val invalid = state.copy(gpa = "4.5")

        assertTrue(state.canFinish)
        assertEquals(3.86, state.roundedGpa)
        assertEquals("Zoe Chen", state.command?.name)
        assertEquals("Computer Science", state.command?.major)
        assertEquals("Finance", state.command?.minor)
        assertEquals("GPA must be between 0.00 and 4.00.", invalid.gpaError)
        assertFalse(invalid.canFinish)
    }

    @Test
    fun typedSearchProfileEditorEnforcesFieldAndSkillCaps() {
        val overFields = (1..11).fold(ApplicantSearchProfileEditorV2State()) { state, index ->
            state.select(MatchingOption(id = "f$index", type = MatchingOptionType.CATEGORY, key = "field-$index", label = "Field $index"))
        }
        val overSkills = (1..101).fold(ApplicantSearchProfileEditorV2State()) { state, index ->
            state.select(MatchingOption(id = "s$index", type = MatchingOptionType.SKILL, key = "skill-$index", label = "Skill $index"))
        }

        assertEquals(10, overFields.selectedFields.size)
        assertEquals("10/10", overFields.fieldCountLabel)
        assertEquals(100, overSkills.selectedSkills.size)
        assertEquals("100/100", overSkills.skillCountLabel)
    }

    @Test
    fun requestCardSpecEmphasizesUnreadRequests() {
        val request = ApplicantInterestRequest(
            id = "r",
            recruiterId = "rec",
            companyName = "Acme",
            reason = "Strong profile",
            status = ApplicantInterestRequestStatus.SENT,
            sentAt = "2026-01-01",
            unreadMessageCount = 12,
        )

        val spec = request.toCardSpec()

        assertEquals("Acme", spec.company)
        assertEquals("9+", spec.unreadBadge)
        assertTrue(spec.emphasized)
        assertTrue(spec.showDecisionActions)

        val list = ApplicantRequestsState(
            requests = listOf(request),
            workingRequestId = "r",
            actionMessage = "Request accepted.",
        ).screenSpec

        assertEquals("Requests", list.title)
        assertEquals("Loading requests", list.loadingMessage)
        assertEquals("envelope.badge", list.emptyIconName)
        assertEquals("No requests yet", list.emptyTitle)
        assertEquals("Recruiters who are interested in your profile will appear here.", list.emptyMessage)
        assertEquals("Request accepted.", list.actionMessage)
        assertEquals(1, list.unreadCount)
        assertTrue(list.cards.single().isWorking)
        assertEquals("Accept", list.cards.single().acceptLabel)
        assertEquals("Decline", list.cards.single().declineLabel)
    }

    @Test
    fun reelProfileStateBuildsGridItemsAndCapacity() {
        val state = ApplicantReelsProfileState(
            profile = ApplicantProfileResponse(
                applicant = ApplicantAccount(id = "a", supabaseUserId = "s", email = "a@example.com", name = "Zoe Chen"),
            ),
            reels = listOf(
                ApplicantReelVideo(
                    id = "r1",
                    applicantId = "a",
                    caption = "Backend API",
                    videoUrl = "https://cdn.example.com/r1.mp4",
                    thumbnailUrl = "https://cdn.example.com/r1.jpg",
                    viewCount = 12,
                )
            ),
        )

        assertEquals("Zoe Chen", state.displayName)
        assertEquals("Z", state.avatarLetter)
        assertEquals("1/9", state.reelCountLabel)
        assertTrue(state.canAddReel)
        assertEquals("Backend API", state.gridItems.first().caption)

        val spec = state.screenSpec
        assertEquals("Profile reels", spec.title)
        assertEquals("Loading reels", spec.loadingMessage)
        assertEquals("Zoe Chen", spec.displayName)
        assertEquals("Z", spec.avatarLetter)
        assertEquals("1/9", spec.countLabel)
        assertEquals("Add reel", spec.addButtonTitle)
        assertEquals("plus", spec.addButtonIconName)
        assertFalse(spec.isEmpty)
        assertEquals("Add proof videos linked to your work.", spec.emptyTitle)
        assertEquals("Each reel must connect to a project, internship, or accomplishment.", spec.emptyMessage)
    }

    @Test
    fun publicApplicantProfileOnlyShowsPublicVideoEvidenceSections() {
        val state = PublicApplicantVideoProfileState(
            displayName = "Zoe Chen",
            educationLine = "Computer Science • Stanford",
            reels = listOf(ApplicantReelVideo(id = "r1", applicantId = "a", videoUrl = "video.mp4", viewCount = 12)),
            publicProjects = listOf(ApplicantProject(id = "p1", title = "Portfolio", type = "built", description = "Built app")),
            publicAccomplishments = listOf(ApplicantAccomplishment(id = "a1", title = "Published research", description = "Presented work")),
        )

        assertEquals("Z", state.avatarLetter)
        assertEquals("12 views", state.gridItems.single().metricLabel)
        assertEquals(listOf("Projects", "Accomplishments"), state.visibleSections.map { it.title })
        assertTrue(state.visibleSections.none { it.title.contains("Resume", ignoreCase = true) })
    }

    @Test
    fun publicApplicantVideoFeedSupportsPlaybackPagingAndLikeViewState() {
        val state = PublicApplicantVideoFeedState(
            videos = listOf(
                ApplicantReelVideo(id = "r1", applicantId = "a1", videoUrl = "video-1.mp4", viewCount = 12),
                ApplicantReelVideo(id = "r2", applicantId = "a2", videoUrl = "video-2.mp4", optimizedVideoUrl = "optimized-2.mp4"),
            )
        )

        val paused = state.togglePlayback()
        val interacted = paused.togglePlayback().markCurrentViewed().toggleCurrentLike()
        val next = interacted.next()

        assertEquals("video-1.mp4", state.currentVideoUrl)
        assertTrue(state.shouldPlay)
        assertFalse(paused.shouldPlay)
        assertTrue(paused.showPlayOverlay)
        assertTrue(interacted.isCurrentVideoViewed)
        assertTrue(interacted.isCurrentVideoLiked)
        assertEquals("optimized-2.mp4", next.currentVideoUrl)
        assertTrue(next.shouldPlay)
        assertEquals("2 / 2", next.positionText)
    }

    @Test
    fun projectEditorBuildsTrimmedCommandAndDefaultsType() {
        val state = ApplicantProjectEditorState(
            title = " Portfolio ",
            type = " ",
            description = " Built a hiring app ",
            linkUrl = " https://example.com ",
        )

        assertTrue(state.canSave)
        assertEquals("Portfolio", state.command.title)
        assertEquals("project", state.command.type)
        assertEquals("Built a hiring app", state.command.description)
        assertEquals("https://example.com", state.command.linkUrl)
    }

    @Test
    fun internshipEditorValidatesRequiredFieldsAndDuration() {
        val invalid = ApplicantInternshipEditorState(company = "Acme", roleDepartment = "", durationMonthsText = "0")
        val valid = ApplicantInternshipEditorState(company = " Acme ", roleDepartment = " Engineering ", durationMonthsText = "3")

        assertFalse(invalid.canSave)
        assertEquals("Role or department is required.", invalid.validationMessage)
        assertTrue(valid.canSave)
        assertEquals("Acme", valid.command.company)
        assertEquals("Engineering", valid.command.roleDepartment)
        assertEquals(3, valid.command.durationMonths)
    }

    @Test
    fun reelUploadWizardRequiresVideoAndEvidenceBeforePublish() {
        val initial = ApplicantReelUploadWizardState()

        assertFalse(initial.canPublish)
        assertEquals("Choose or record a video before publishing.", initial.blockingMessage)

        val ready = initial
            .copy(selectedVideoUri = "file:///tmp/reel.mp4", selectedDurationSeconds = 20.0)
            .toggleLink(ApplicantVideoEvidenceLink("project", "p1"))
            .withCaption("A short proof video")

        assertTrue(ready.canPublish)
        assertTrue(ready.publishButtonVisible)
        assertEquals("20/250", ready.captionCountLabel)
        assertEquals("A short proof video", ready.normalizedCaption)

        val spec = ready.screenSpec
        assertEquals("Publish reel", spec.title)
        assertEquals("Video", spec.videoSectionTitle)
        assertEquals("Replace video", spec.chooseVideoTitle)
        assertEquals("Record video", spec.recordVideoTitle)
        assertEquals("Caption", spec.captionTitle)
        assertEquals("Add a caption, optional", spec.captionPlaceholder)
        assertEquals("20/250", spec.captionCountLabel)
        assertEquals("Link evidence", spec.evidenceTitle)
        assertTrue(spec.evidenceHelperText.contains("project, internship, or accomplishment"))
        assertEquals("Publish reel", spec.publishButtonTitle)
        assertEquals("paperplane.fill", spec.publishButtonIconName)
        assertTrue(spec.publishButtonVisible)
        assertEquals(null, spec.blockingMessage)
    }

    @Test
    fun reelUploadWizardExpandsOneEvidenceSectionAtATime() {
        val project = ApplicantProject(id = "p1", title = "Portfolio", type = "built_project", description = "Built app")
        val internship = com.cato.app.core.ApplicantInternship(id = "i1", company = "Acme", durationMonths = 3, roleDepartment = "Engineering")
        val accomplishment = ApplicantAccomplishment(id = "a1", title = "Published paper", description = "Research")
        val state = ApplicantReelUploadWizardState(
            availableProjects = listOf(project),
            availableInternships = listOf(internship),
            availableAccomplishments = listOf(accomplishment),
        )

        val internshipExpanded = state.expandEvidence(ApplicantReelEvidenceType.INTERNSHIP)
        val accomplishmentExpanded = internshipExpanded.expandEvidence(ApplicantReelEvidenceType.ACCOMPLISHMENT)

        assertEquals(ApplicantReelEvidenceType.PROJECT, state.selectedEvidenceSection.type)
        assertEquals("Portfolio", state.selectedEvidenceSection.items.single().title)
        assertEquals(
            listOf("Projects", "Internships", "Accomplishments"),
            state.screenSpec.sectionTabs.map { it.title },
        )
        assertEquals(ApplicantReelEvidenceType.PROJECT, state.screenSpec.sectionTabs.single { it.selected }.type)
        assertEquals(1, state.screenSpec.sectionTabs.first { it.type == ApplicantReelEvidenceType.PROJECT }.count)
        assertEquals(ApplicantReelEvidenceType.INTERNSHIP, internshipExpanded.selectedEvidenceSection.type)
        assertEquals("Engineering at Acme", internshipExpanded.selectedEvidenceSection.items.single().title)
        assertEquals(ApplicantReelEvidenceType.ACCOMPLISHMENT, accomplishmentExpanded.selectedEvidenceSection.type)
        assertEquals("Published paper", accomplishmentExpanded.selectedEvidenceSection.items.single().title)
    }

    @Test
    fun reelUploadWizardBlocksLongVideosAndFullCapacity() {
        val longVideo = ApplicantReelUploadWizardState(
            selectedVideoUri = "file:///tmp/reel.mp4",
            selectedDurationSeconds = 61.0,
            selectedLinks = setOf(ApplicantVideoEvidenceLink("project", "p1")),
        )
        val full = longVideo.copy(selectedDurationSeconds = 30.0, existingReelCount = 9)

        assertFalse(longVideo.canPublish)
        assertEquals("Profile reels can be up to 60 seconds.", longVideo.blockingMessage)
        assertFalse(full.canPublish)
        assertEquals("You have reached the 9 reel limit.", full.blockingMessage)
    }

    @Test
    fun reelUploadWizardCanCreateEvidenceAndSelectItImmediately() {
        val projectDraft = ApplicantReelNewProjectDraft(
            title = " Search tool ",
            type = "",
            description = " Built candidate search ",
            linkUrl = " https://example.com ",
        )
        val internshipDraft = ApplicantReelNewInternshipDraft(
            company = " Acme ",
            roleDepartment = " Platform ",
            durationMonthsText = "4",
        )
        val accomplishmentDraft = ApplicantReelNewAccomplishmentDraft(
            title = " Published thesis ",
            description = " Resume parsing research ",
            linkUrl = "",
        )
        val initial = ApplicantReelUploadWizardState(
            newProjectDraft = projectDraft,
            newInternshipDraft = internshipDraft,
            newAccomplishmentDraft = accomplishmentDraft,
        )

        assertTrue(projectDraft.canCreate)
        assertEquals("Search tool", projectDraft.command.title)
        assertEquals("built_project", projectDraft.command.type)
        assertEquals("https://example.com", projectDraft.command.linkUrl)
        assertTrue(internshipDraft.canCreate)
        assertEquals(4, internshipDraft.command.durationMonths)
        assertTrue(accomplishmentDraft.canCreate)

        val withProject = initial.afterProjectCreated(
            ApplicantProject(id = "p1", title = "Search tool", type = "built_project", description = "Built search")
        )
        val withInternship = withProject.afterInternshipCreated(
            ApplicantInternship(id = "i1", company = "Acme", roleDepartment = "Platform", durationMonths = 4)
        )
        val withAccomplishment = withInternship.afterAccomplishmentCreated(
            ApplicantAccomplishment(id = "a1", title = "Published thesis", description = "Research")
        )

        assertEquals(ApplicantReelEvidenceType.PROJECT, withProject.expandedEvidenceType)
        assertTrue(ApplicantVideoEvidenceLink("project", "p1") in withProject.selectedLinks)
        assertEquals("", withProject.newProjectDraft.title)
        assertEquals(ApplicantReelEvidenceType.INTERNSHIP, withInternship.expandedEvidenceType)
        assertTrue(ApplicantVideoEvidenceLink("internship", "i1") in withInternship.selectedLinks)
        assertEquals(ApplicantReelEvidenceType.ACCOMPLISHMENT, withAccomplishment.expandedEvidenceType)
        assertTrue(ApplicantVideoEvidenceLink("accomplishment", "a1") in withAccomplishment.selectedLinks)
        assertEquals(3, withAccomplishment.selectedLinks.size)
    }

    @Test
    fun conversationStateInsertsUnreadDividerAndMarksMine() {
        val request = ApplicantInterestRequest(
            id = "req",
            recruiterId = "rec",
            companyName = "Acme",
            reason = "Strong match",
            status = ApplicantInterestRequestStatus.ACCEPTED,
            sentAt = "2026-01-01",
        )
        val state = ApplicantConversationState(
            request = request,
            messages = listOf(
                ApplicantConversationMessage(
                    id = "m1",
                    requestId = "req",
                    recruiterId = "rec",
                    applicantId = "app",
                    senderRole = "recruiter",
                    isUnreadForViewer = true,
                    body = "Hello",
                    createdAt = "2026-01-01",
                ),
                ApplicantConversationMessage(
                    id = "m2",
                    requestId = "req",
                    recruiterId = "rec",
                    applicantId = "app",
                    senderRole = "applicant",
                    body = "Hi",
                    createdAt = "2026-01-01",
                ),
            ),
            draft = "  Reply  ",
        )

        assertEquals("m1", state.firstUnreadMessageId)
        assertTrue(state.canSend)
        assertTrue(state.rows.first() is ApplicantConversationRow.UnreadDivider)
        val last = state.rows.last() as ApplicantConversationRow.Message
        assertTrue(last.spec.isMine)

        val spec = state.screenSpec
        assertEquals("Acme", spec.title)
        assertEquals("Recruiting team", spec.subtitle)
        assertEquals("Loading conversation", spec.loadingMessage)
        assertEquals("Send", spec.sendButtonTitle)
        assertTrue(spec.canSend)
        assertEquals("m1", spec.firstUnreadMessageId)
    }

    @Test
    fun conversationStateUpsertsIncomingMessagesForSameRequestOnly() {
        val request = ApplicantInterestRequest(
            id = "req",
            recruiterId = "rec",
            companyName = "Acme",
            reason = "Strong match",
            status = ApplicantInterestRequestStatus.ACCEPTED,
            sentAt = "2026-01-01",
        )
        val state = ApplicantConversationState(
            request = request,
            messages = listOf(
                ApplicantConversationMessage(
                    id = "m1",
                    requestId = "req",
                    recruiterId = "rec",
                    applicantId = "app",
                    senderRole = "recruiter",
                    body = "Old",
                    createdAt = "2026-01-02",
                ),
            ),
        )

        val ignored = state.withIncomingMessage(
            ApplicantConversationMessage(
                id = "other",
                requestId = "another",
                recruiterId = "rec",
                applicantId = "app",
                senderRole = "recruiter",
                body = "Ignore",
                createdAt = "2026-01-01",
            )
        )
        val updated = state.withIncomingMessage(
            ApplicantConversationMessage(
                id = "m1",
                requestId = "req",
                recruiterId = "rec",
                applicantId = "app",
                senderRole = "recruiter",
                body = "Updated",
                createdAt = "2026-01-03",
            )
        ).withIncomingMessage(
            ApplicantConversationMessage(
                id = "m2",
                requestId = "req",
                recruiterId = "rec",
                applicantId = "app",
                senderRole = "applicant",
                body = "Earlier",
                createdAt = "2026-01-01",
            )
        )

        assertEquals(listOf("m1"), ignored.messages.map { it.id })
        assertEquals(listOf("m2", "m1"), updated.messages.map { it.id })
        assertEquals("Updated", updated.messages.last().body)
    }

    @Test
    fun applicantProfileActionsExposeMissingRecruiterPreviewTasks() {
        val state = ApplicantProfileActionState(
            profile = ApplicantProfileResponse(
                applicant = ApplicantAccount(id = "a", supabaseUserId = "s", email = "a@example.com", name = "A"),
            ),
            reelsCount = 0,
            searchProfileConfigured = false,
        )

        val targets = state.missingRecruiterPreviewActions.map { it.target }

        assertTrue(ApplicantActionTarget.ResumeUpload in targets)
        assertTrue(ApplicantActionTarget.ShortTakeUpload in targets)
        assertTrue(ApplicantActionTarget.DeeperSignalUpload in targets)
        assertTrue(ApplicantActionTarget.ProjectsManager in targets)
        assertEquals("Missing", state.recruiterVisibleRows.first { it.title == "Resume" }.value)
        assertEquals("0/9", state.recruiterVisibleRows.first { it.title == "Profile reels" }.value)
        assertTrue(state.cardActions.any { it.target == ApplicantActionTarget.SearchProfileEditor && it.isPrimary })

        val spec = state.screenSpec
        assertEquals("Profile", spec.title)
        assertEquals("Loading profile", spec.loadingMessage)
        assertEquals("A", spec.identity.displayName)
        assertEquals("a@example.com", spec.identity.email)
        assertEquals(0, spec.recruiterPreview.strengthPercent)
        assertEquals("Recruiter preview", spec.recruiterPreview.action.title)
        assertTrue(spec.prioritizeManualMatching)
        assertEquals(ApplicantActionTarget.SearchProfileEditor, spec.manualMatchingAction.target)
        assertTrue(spec.reels.isEmpty)
        assertEquals("Add proof videos linked to your work.", spec.reels.emptyTitle)
        assertEquals("Each reel must connect to a project, internship, or accomplishment.", spec.reels.emptyMessage)
        assertEquals("Soft skills", spec.softSkillsTitle)
        assertEquals("Soft skills will appear after your signal profile is complete.", spec.softSkillsEmptyMessage)
    }

    @Test
    fun applicantProfileActionTargetsMapToConcreteNativeRoutes() {
        val routePairs = listOf(
            ApplicantActionTarget.RecruiterPreview to ApplicantRoute.RecruiterPreview,
            ApplicantActionTarget.ResumeUpload to ApplicantRoute.ResumeUpload,
            ApplicantActionTarget.ShortTakeUpload to ApplicantRoute.ShortTakeUpload,
            ApplicantActionTarget.DeeperSignalUpload to ApplicantRoute.DeeperSignalUpload,
            ApplicantActionTarget.ProjectsManager to ApplicantRoute.ProjectsManager,
            ApplicantActionTarget.InternshipsManager to ApplicantRoute.InternshipsManager,
            ApplicantActionTarget.ReelsProfile to ApplicantRoute.Reels,
            ApplicantActionTarget.SearchProfileEditor to ApplicantRoute.SearchProfileEditor,
            ApplicantActionTarget.EducationEditor to ApplicantRoute.EducationEditor,
        )

        routePairs.forEach { (target, route) ->
            assertEquals(route, target.toRoute())
        }
    }

    @Test
    fun applicantSettingsStateExposesAccountRowsAndConfirmationCopy() {
        val state = ApplicantSettingsActionState(
            profile = ApplicantProfileResponse(
                applicant = ApplicantAccount(id = "a", supabaseUserId = "s", email = "a@example.com", name = "Zoe Chen"),
                education = ApplicantEducation(
                    universityName = "Stanford University",
                    semesterLabel = "Sophomore / Semester 4",
                    semesterNumber = 4,
                    gpa = 3.82,
                    major = "Computer Science",
                ),
            ),
            isWorking = true,
        )

        assertEquals("Zoe Chen", state.displayName)
        assertEquals("a@example.com", state.displayEmail)
        assertEquals("Stanford University", state.infoRows.first { it.first == "University" }.second)
        assertEquals("3.82", state.infoRows.first { it.first == "GPA" }.second)
        assertEquals("Log out?", state.logoutConfirmationTitle)
        assertEquals("You will return to the Cato sign-in screen.", state.logoutConfirmationMessage)
        assertEquals("Delete account?", state.deleteConfirmationTitle)
        assertEquals("This permanently removes your Cato applicant account and cannot be undone.", state.deleteConfirmationMessage)
        assertFalse(state.actionsEnabled)

        val spec = state.screenSpec
        assertEquals("Settings", spec.title)
        assertEquals("Loading settings", spec.loadingMessage)
        assertEquals("Manage your applicant account.", spec.subtitle)
        assertEquals("Zoe Chen", spec.profile.displayName)
        assertEquals("a@example.com", spec.profile.email)
        assertEquals(ApplicantActionTarget.EducationEditor, spec.educationAction.target)
        assertEquals("Account", spec.accountSectionTitle)
        assertEquals("Log out", spec.logout.title)
        assertEquals("rectangle.portrait.and.arrow.right", spec.logout.iconName)
        assertFalse(spec.logout.enabled)
        assertEquals("Delete account", spec.delete.title)
        assertEquals("trash", spec.delete.iconName)
        assertTrue(spec.delete.destructive)
        assertFalse(spec.delete.enabled)
        assertEquals("Updating account...", spec.workingMessage)
        assertEquals("Log out?", spec.logoutConfirmation.title)
        assertEquals("Delete account?", spec.deleteConfirmation.title)
    }

    @Test
    fun applicantProfileActionsDoNotShowProjectMissingWhenProjectsExist() {
        val state = ApplicantProfileActionState(
            profile = ApplicantProfileResponse(
                applicant = ApplicantAccount(id = "a", supabaseUserId = "s", email = "a@example.com", name = "A"),
                resume = ApplicantResume(secureUrl = "https://cdn.example.com/resume.pdf", originalFileName = "resume.pdf"),
                signal = ApplicantSignal(
                    tenSecondVideo = ApplicantMediaAsset(secureUrl = "https://cdn.example.com/intro.mp4"),
                    thirtySecondVideo = ApplicantMediaAsset(secureUrl = "https://cdn.example.com/deeper.mp4"),
                ),
                projects = listOf(ApplicantProject(id = "p", title = "App", type = "built_project", description = "Built app")),
            ),
            reelsCount = 2,
            searchProfileConfigured = true,
        )

        assertFalse(state.missingRecruiterPreviewActions.any { it.target == ApplicantActionTarget.ProjectsManager })
        assertEquals("2/9 proof videos", state.cardActions.first { it.target == ApplicantActionTarget.ReelsProfile }.subtitle)
        assertEquals("resume.pdf", state.recruiterVisibleRows.first { it.title == "Resume" }.value)
        assertTrue(state.coreRecruiterProfileReady)
        assertTrue(state.recruiterPreviewCompletionMessage?.contains("core recruiter profile") == true)
        assertFalse(state.cardActions.first { it.target == ApplicantActionTarget.SearchProfileEditor }.isPrimary)
        assertFalse(state.screenSpec.prioritizeManualMatching)
        assertFalse(state.screenSpec.reels.isEmpty)
        assertEquals("2/9 proof videos", state.screenSpec.reels.action.subtitle)
    }

    @Test
    fun educationEditorMapsProfileAndValidatesGpa() {
        val profile = ApplicantProfileResponse(
            applicant = ApplicantAccount(id = "a", supabaseUserId = "s", email = "a@example.com", name = "Zoe"),
            education = ApplicantEducation(
                universityName = "Stanford University",
                semesterLabel = "Sophomore / Semester 4",
                semesterNumber = 4,
                gpa = 3.8,
                major = "Computer Science",
                minor = "Finance",
            ),
        )

        val state = ApplicantEducationEditorState.fromProfile(profile)
        val invalid = state.copy(gpa = "4.5")

        assertEquals("Zoe", state.name)
        assertEquals("Sophomore / Semester 4", state.selectedSemester.label)
        assertEquals("3.80", state.gpa)
        assertTrue(state.canSave)
        assertEquals("GPA must be between 0 and 4.", invalid.gpaError)
        assertFalse(invalid.canSave)
    }

    @Test
    fun educationEditorClearsOnlyOptionalDegreeFields() {
        val state = ApplicantEducationEditorState(
            name = "Zoe",
            universityName = "Stanford",
            selectedSemester = ApplicantSettingsSemester.options.first(),
            gpa = "3.5",
            major = "CS",
            minor = "Finance",
        )

        val cleared = state.clearOptionalFields()

        assertEquals("Zoe", cleared.name)
        assertEquals("Stanford", cleared.universityName)
        assertEquals("", cleared.gpa)
        assertEquals("", cleared.major)
        assertEquals("", cleared.minor)
        assertTrue(cleared.canSave)
    }

    @Test
    fun onboardingStatusMapsToNativeRoutes() {
        assertEquals(ApplicantOnboardingRoute.EDUCATION, ApplicantOnboardingState(status = null).route)
        assertEquals(ApplicantOnboardingRoute.RESUME, ApplicantOnboardingState(status = ApplicantOnboardingStatus.EDUCATION_COMPLETE).route)
        assertEquals(ApplicantOnboardingRoute.SIGNAL_PROMPT, ApplicantOnboardingState(status = ApplicantOnboardingStatus.RESUME_COMPLETE).route)
        assertEquals(ApplicantOnboardingRoute.SHORT_TAKE_UPLOAD, ApplicantOnboardingState(status = ApplicantOnboardingStatus.SIGNAL_PROMPT_SELECTED).route)
        assertEquals(ApplicantOnboardingRoute.DEEPER_SIGNAL, ApplicantOnboardingState(status = ApplicantOnboardingStatus.SIGNAL_VIDEO_UPLOADED).route)
        assertEquals(ApplicantOnboardingRoute.DEEPER_VIDEO, ApplicantOnboardingState(status = ApplicantOnboardingStatus.DEEPER_SIGNAL_SEEN).route)
        assertEquals(ApplicantOnboardingRoute.FINAL_PROFILE, ApplicantOnboardingState(status = ApplicantOnboardingStatus.DEEPER_VIDEO_UPLOADED).route)
        assertEquals(ApplicantOnboardingRoute.APP_SHELL, ApplicantOnboardingState(status = ApplicantOnboardingStatus.ONBOARDING_COMPLETE).route)
    }

    @Test
    fun signalPromptSelectionDefaultsToFirstPromptAndShowsEight() {
        val prompts = (1..10).map { index ->
            SignalPrompt(
                id = "p$index",
                fieldId = "technology",
                fieldLabel = "Technology",
                text = "Prompt $index",
                active = true,
                sortOrder = index,
            )
        }
        val state = SignalPromptSelectionState(prompts = prompts)

        assertEquals("p1", state.selectedPromptId)
        assertEquals(8, state.visiblePrompts.size)
        assertTrue(state.canContinue)
        assertEquals("p4", state.select("p4").selectedPromptId)
    }
}
