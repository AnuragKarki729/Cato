package com.cato.app.state

import com.cato.app.core.ApplicantReelVideo
import com.cato.app.core.ApplicantAccomplishment
import com.cato.app.core.RecruiterCandidate
import com.cato.app.core.RecruiterCandidateEvidence
import com.cato.app.core.RecruiterCandidateProfileMediaResponse
import com.cato.app.core.RecruiterCandidateValidation
import com.cato.app.core.RecruiterInternship
import com.cato.app.core.RecruiterProject
import com.cato.app.core.RecruiterReviewStatus
import com.cato.app.core.RecruiterSoftSkill
import com.cato.app.core.RuntimeMatchScore
import com.cato.app.ui.toActionSpec
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class CandidateReviewStateTest {
    @Test
    fun screenSpecAggregatesCandidateReviewSectionsLikeSwift() {
        val candidate = RecruiterCandidate(
            id = "candidate-1",
            applicantId = "candidate-1",
            name = "Zoe Chen",
            major = "Computer Science",
            universityName = "Stanford University",
            profileStrength = 97,
            hasResume = true,
            resumeFileName = "Zoe.pdf",
            resumeUrl = "resume.pdf",
            tenSecondVideoUrl = "intro.mp4",
            thirtySecondVideoUrl = "deeper.mp4",
            hasDeeperSignal = true,
            projects = listOf(RecruiterProject(id = "project-1", title = "Portfolio", type = "built_project", description = "Built app")),
            internships = listOf(RecruiterInternship(id = "internship-1", company = "Acme", roleDepartment = "Engineering", durationMonths = 3)),
            matchEvidence = listOf(RecruiterCandidateEvidence(id = "evidence-1", type = "resume", title = "Python", body = "Resume mentions Python", strength = "strong")),
            needsValidation = listOf(RecruiterCandidateValidation(id = "validation-1", title = "Availability", body = "Confirm start date")),
            softSkills = listOf(RecruiterSoftSkill(label = "Clarity", rating = 4.2, evidence = "Clear answer", confidence = "high")),
        )
        val reels = listOf(ApplicantReelVideo(id = "reel-1", applicantId = "candidate-1", videoUrl = "reel.mp4"))
        val media = RecruiterCandidateProfileMediaResponse(
            accomplishments = listOf(ApplicantAccomplishment(id = "acc-1", title = "Published research", description = "Campus paper"))
        )
        val score = RuntimeMatchScore(
            totalScore = 82,
            reasons = listOf("Resume mentions Python", "Project matches backend", "Relevant field"),
            blockers = listOf("No AWS evidence"),
        )

        val spec = buildCandidateReviewScreenSpec(
            candidate = candidate,
            reels = reels,
            profileMedia = media,
            runtimeMatchScore = score,
            hasRuntimeSearchContext = true,
            actionMessage = "Profile bookmarked.",
        )

        assertEquals("Candidate Review", spec.title)
        assertEquals("Loading candidate", spec.loadingMessage)
        assertEquals("Profile bookmarked.", spec.actionMessage)
        assertEquals("Why this match?", spec.auditButtonTitle)
        assertEquals("Runtime match", spec.header.matchSourceLabel)
        assertEquals("82%", spec.searchFit?.scoreLabel)
        assertEquals(listOf("Resume mentions Python", "Project matches backend", "Relevant field"), spec.searchFit?.reasons)
        assertEquals(listOf("No AWS evidence"), spec.searchFit?.blockers)
        assertEquals(2, spec.videoLayout.featuredVideos.size)
        assertEquals(1, spec.videoLayout.reelThumbnails.size)
        assertEquals("Zoe.pdf", spec.resume?.title)
        assertEquals(
            listOf("Accomplishments", "Projects", "Internships", "Match evidence", "Needs validation", "Soft signals"),
            spec.sections.map { it.title },
        )
    }

    @Test
    fun screenSpecOmitsUnavailableResumeVideoAndOptionalSections() {
        val spec = buildCandidateReviewScreenSpec(
            candidate = RecruiterCandidate(
                id = "candidate-1",
                applicantId = "candidate-1",
                hasResume = false,
                tenSecondVideoUrl = null,
                thirtySecondVideoUrl = null,
            ),
        )

        assertEquals(null, spec.auditButtonTitle)
        assertEquals(null, spec.searchFit)
        assertFalse(spec.videoLayout.hasVideos)
        assertEquals(null, spec.resume)
        assertEquals(emptyList(), spec.sections)
    }

    @Test
    fun headerUsesRuntimeMatchScoreWhenOpenedFromDynamicSearch() {
        val candidate = RecruiterCandidate(
            id = "candidate-1",
            applicantId = "candidate-1",
            matchScore = 41,
            matchStrength = "profile_match",
            profileStrength = 97,
            resumeUrl = "resume.pdf",
        )
        val state = CandidateReviewHeaderState(
            candidate = candidate,
            runtimeMatchScore = RuntimeMatchScore(
                totalScore = 75,
                reasons = listOf("Matched Kotlin and backend APIs"),
                blockers = listOf("No AWS evidence"),
            ),
            reelCount = 3,
        )

        assertEquals(75, state.displayedMatchScore)
        assertEquals("75%", state.matchScoreLabel)
        assertEquals("Runtime match", state.matchSourceLabel)
        assertEquals(listOf("Matched Kotlin and backend APIs"), state.reasonRows)
        assertEquals(listOf("No AWS evidence"), state.blockerRows)
        assertTrue(state.shouldShowRuntimeReasons)
        assertTrue("Profile 97%" in state.factPills)
        assertTrue("3 reels" in state.factPills)
    }

    @Test
    fun headerFallsBackToPersistedCandidateScoreWithoutRuntimeSearch() {
        val state = CandidateReviewHeaderState(
            candidate = RecruiterCandidate(
                id = "candidate-1",
                applicantId = "candidate-1",
                matchScore = 64,
                matchStrength = "strong_match",
            )
        )

        assertEquals(64, state.displayedMatchScore)
        assertEquals("Strong match", state.matchSourceLabel)
        assertFalse(state.shouldShowRuntimeReasons)
    }

    @Test
    fun separatesFeaturedVideosFromReelThumbnails() {
        val candidate = RecruiterCandidate(
            id = "candidate-1",
            applicantId = "candidate-1",
            tenSecondVideoUrl = "intro.mp4",
            thirtySecondVideoUrl = "deeper.mp4",
        )
        val reels = listOf(
            ApplicantReelVideo(id = "reel-1", applicantId = "candidate-1", videoUrl = "reel-1.mp4"),
            ApplicantReelVideo(id = "reel-2", applicantId = "candidate-1", videoUrl = "reel-2.mp4"),
        )

        val layout = buildCandidateReviewVideoLayout(candidate, reels)

        assertEquals(2, layout.featuredVideos.size)
        assertEquals(2, layout.reelThumbnails.size)
        assertEquals(4, layout.allVideos.size)
        assertTrue(layout.hasVideos)
    }

    @Test
    fun reelThumbnailsAreGroupedIntoThreeColumnRows() {
        val reels = (1..7).map { index ->
            ApplicantReelVideo(id = "reel-$index", applicantId = "candidate-1", videoUrl = "reel-$index.mp4")
        }

        val layout = buildCandidateReviewVideoLayout(
            candidate = RecruiterCandidate(id = "candidate-1", applicantId = "candidate-1"),
            reels = reels,
        )

        assertEquals(listOf(3, 3, 1), layout.thumbnailGridRows.map { it.size })
    }

    @Test
    fun resumeActionPrefersPreviewUrlAndFallsBackToResumeUrl() {
        val preview = RecruiterCandidate(
            id = "candidate-1",
            applicantId = "candidate-1",
            resumeFileName = "Zoe.pdf",
            resumeUrl = "https://cdn.example.com/raw.pdf",
            resumePreviewUrl = "https://cdn.example.com/preview.pdf",
        ).toResumeActionState()
        val fallback = preview.copy(resumePreviewUrl = null)

        assertTrue(preview.canOpen)
        assertEquals("Zoe.pdf", preview.title)
        assertEquals("https://cdn.example.com/preview.pdf", preview.effectiveUrl)
        assertEquals("https://cdn.example.com/raw.pdf", fallback.effectiveUrl)
    }

    @Test
    fun compactsDecisionControlsAfterTenPercentScroll() {
        val top = CandidateReviewChromeState(
            reviewStatus = RecruiterReviewStatus.NONE,
            scrollOffsetPx = 50f,
            screenHeightPx = 1000f,
        )
        val scrolled = top.copy(scrollOffsetPx = 110f)

        assertFalse(top.isCompactDecisionBar)
        assertFalse(top.shouldShowHeaderActions)
        assertTrue(scrolled.isCompactDecisionBar)
        assertTrue(scrolled.shouldShowHeaderActions)
        assertEquals(RecruiterReviewStatus.PASSED, top.leftAction)
        assertEquals(RecruiterReviewStatus.SHORTLISTED, top.rightAction)
        assertEquals("Maybe", top.statusLabel)

        val topSpec = top.toActionSpec(interestAlreadySent = false, bookmarked = false)
        val scrolledSpec = scrolled.toActionSpec(interestAlreadySent = false, bookmarked = false)
        assertFalse(topSpec.leftButton.iconOnly)
        assertTrue(scrolledSpec.leftButton.iconOnly)
        assertTrue(scrolledSpec.showHeaderActions)
    }

    @Test
    fun actionSpecDisablesMutatingButtonsWhileActingLikeSwift() {
        val spec = CandidateReviewChromeState(
            reviewStatus = RecruiterReviewStatus.MAYBE,
            scrollOffsetPx = 120f,
            screenHeightPx = 1000f,
        ).toActionSpec(
            interestAlreadySent = false,
            bookmarked = false,
            isActing = true,
        )

        assertFalse(spec.leftButton.enabled)
        assertFalse(spec.rightButton.enabled)
        assertFalse(spec.headerActions.first { it.label == "Interest" }.enabled)
        assertFalse(spec.headerActions.first { it.label == "Bookmark" }.enabled)
        assertTrue(spec.headerActions.first { it.label == "Contact" }.enabled)
    }

    @Test
    fun selectedDecisionSideBecomesMaybe() {
        val passed = CandidateReviewChromeState(reviewStatus = RecruiterReviewStatus.PASSED)
        val shortlisted = CandidateReviewChromeState(reviewStatus = RecruiterReviewStatus.SHORTLISTED)

        assertEquals(RecruiterReviewStatus.MAYBE, passed.leftAction)
        assertEquals(RecruiterReviewStatus.MAYBE, shortlisted.rightAction)
        assertEquals("Maybe?", passed.labelFor(passed.leftAction))
    }
}
