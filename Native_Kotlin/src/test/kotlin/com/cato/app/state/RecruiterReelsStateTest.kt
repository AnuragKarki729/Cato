package com.cato.app.state

import com.cato.app.core.ApplicantReelVideo
import com.cato.app.core.ApplicantVideoEvidenceLink
import com.cato.app.core.RecruiterCandidate
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class RecruiterReelsStateTest {
    @Test
    fun buildsIntroAndProfileReelFeed() {
        val candidate = RecruiterCandidate(
            id = "candidate-1",
            applicantId = "candidate-1",
            name = "Zoe Chen",
            major = "Computer Science",
            universityName = "Stanford University",
            tenSecondVideoUrl = "https://cdn.example.com/intro.mp4",
            thirtySecondVideoUrl = "https://cdn.example.com/deeper.mp4",
        )
        val reel = ApplicantReelVideo(
            id = "reel-1",
            applicantId = "candidate-1",
            videoUrl = "https://cdn.example.com/reel.mp4",
            thumbnailUrl = "https://cdn.example.com/reel.jpg",
            applicantName = "Zoe Chen",
        )

        val clips = buildRecruiterFeedClips(listOf(candidate), listOf(reel))

        assertEquals(2, clips.size)
        assertEquals(RecruiterFeedClipKind.INTRO, clips[0].kind)
        assertEquals(RecruiterFeedClipKind.REEL, clips[1].kind)
        assertEquals("https://cdn.example.com/deeper.mp4", clips[0].deeperVideoUrl)
    }

    @Test
    fun supportsVerticalAndHorizontalReelNavigation() {
        val clips = listOf(
            RecruiterFeedClip(
                id = "intro-candidate-1",
                candidateId = "candidate-1",
                candidateName = "Zoe Chen",
                candidateSubtitle = "Computer Science",
                title = "Introductory video",
                caption = null,
                videoUrl = "intro.mp4",
                thumbnailUrl = null,
                kind = RecruiterFeedClipKind.INTRO,
                deeperVideoUrl = "deeper.mp4",
                reel = null,
            ),
            RecruiterFeedClip.reel(ApplicantReelVideo(id = "reel-1", applicantId = "candidate-1", videoUrl = "reel.mp4")),
        )

        val state = RecruiterReelsState(clips = clips)

        assertEquals("1 / 2", state.positionText)
        assertTrue(state.showDeeperSignal().isShowingDeeperSignal)
        assertFalse(state.showDeeperSignal().showIntro().isShowingDeeperSignal)
        assertEquals(1, state.next().currentIndex)
        assertEquals(0, state.next().previous().currentIndex)
        assertNotNull(state.currentClip)

        val spec = state.screenSpec
        assertEquals("Reels", spec.title)
        assertEquals("Loading reels", spec.loadingMessage)
        assertFalse(spec.isEmpty)
        assertEquals("Zoe Chen", spec.clip?.candidateName)
        assertEquals("Introductory video", spec.clip?.title)
        assertEquals("1 / 2", spec.clip?.positionText)
        assertTrue(spec.clip?.canSwipeRightToDeeperSignal == true)
        assertFalse(spec.clip?.canLike == true)
        assertTrue(spec.clip?.canOpenCandidateProfile == true)

        val deeperSpec = state.showDeeperSignal().screenSpec.clip
        assertEquals("Deeper signal", deeperSpec?.title)
        assertTrue(deeperSpec?.isShowingDeeperSignal == true)
        assertFalse(deeperSpec?.canSwipeRightToDeeperSignal == true)
    }

    @Test
    fun tapTogglesPlaybackAndNavigationResumesActiveVideo() {
        val clips = listOf(
            RecruiterFeedClip(
                id = "intro-candidate-1",
                candidateId = "candidate-1",
                candidateName = "Zoe Chen",
                candidateSubtitle = "Computer Science",
                title = "Introductory video",
                caption = null,
                videoUrl = "intro.mp4",
                thumbnailUrl = null,
                kind = RecruiterFeedClipKind.INTRO,
                deeperVideoUrl = "deeper.mp4",
                reel = null,
            ),
            RecruiterFeedClip.reel(ApplicantReelVideo(id = "reel-1", applicantId = "candidate-1", videoUrl = "reel.mp4")),
        )

        val paused = RecruiterReelsState(clips = clips).togglePlayback()
        val resumedByTap = paused.togglePlayback()
        val resumedBySwipe = paused.next()
        val deeper = paused.showDeeperSignal()

        assertFalse(paused.shouldPlay)
        assertTrue(paused.showPlayOverlay)
        assertTrue(paused.isChromeVisible)
        assertTrue(resumedByTap.shouldPlay)
        assertFalse(resumedByTap.showPlayOverlay)
        assertTrue(resumedBySwipe.shouldPlay)
        assertFalse(resumedBySwipe.isPausedByUser)
        assertTrue(deeper.shouldPlay)
        assertFalse(deeper.isPausedByUser)
    }

    @Test
    fun likeAndViewInteractionsOnlyApplyToProfileReels() {
        val clips = listOf(
            RecruiterFeedClip(
                id = "intro-candidate-1",
                candidateId = "candidate-1",
                candidateName = "Zoe Chen",
                candidateSubtitle = "Computer Science",
                title = "Introductory video",
                caption = null,
                videoUrl = "intro.mp4",
                thumbnailUrl = null,
                kind = RecruiterFeedClipKind.INTRO,
                deeperVideoUrl = "deeper.mp4",
                reel = null,
            ),
            RecruiterFeedClip.reel(ApplicantReelVideo(id = "reel-1", applicantId = "candidate-1", videoUrl = "reel.mp4")),
        )

        val intro = RecruiterReelsState(clips = clips)
        val deeper = intro.showDeeperSignal()
        val reel = intro.next()
        val interacted = reel.markCurrentViewed().toggleCurrentLike()

        assertFalse(intro.canLikeCurrentClip)
        assertFalse(intro.canMarkCurrentClipViewed)
        assertEquals(null, intro.currentReelVideoIdForInteraction)
        assertEquals(null, deeper.currentReelVideoIdForInteraction)
        assertEquals("reel-1", reel.currentReelVideoIdForInteraction)
        assertTrue(interacted.isCurrentClipViewed)
        assertTrue(interacted.isCurrentClipLiked)
        assertFalse(interacted.toggleCurrentLike().isCurrentClipLiked)

        val reelSpec = interacted.screenSpec.clip
        assertTrue(reelSpec?.canLike == true)
        assertTrue(reelSpec?.isLiked == true)
        assertFalse(reelSpec?.interestSent == true)
        val interestSent = interacted.markInterestSent("reel-1").screenSpec.clip
        assertTrue(interestSent?.interestSent == true)
    }

    @Test
    fun recruiterReelsScreenSpecShowsSwiftEmptyStateCopy() {
        val spec = RecruiterReelsState().screenSpec

        assertTrue(spec.isEmpty)
        assertEquals("film", spec.emptyIconName)
        assertEquals("No applicant videos yet", spec.emptyTitle)
        assertEquals("Intro videos and profile reels will appear here when candidates add them.", spec.emptyMessage)
    }

    @Test
    fun candidateVideoViewerPagesAndTogglesPlayback() {
        val videos = listOf(
            CandidateReviewVideo(
                id = "intro",
                title = "Introductory video",
                caption = null,
                videoUrl = "intro.mp4",
                thumbnailUrl = null,
                sourceReel = null,
            ),
            CandidateReviewVideo(
                id = "reel-1",
                title = "Profile reel",
                caption = "Built a search engine",
                videoUrl = "reel.mp4",
                thumbnailUrl = "thumb.jpg",
                sourceReel = ApplicantReelVideo(id = "reel-1", applicantId = "candidate-1", videoUrl = "reel.mp4"),
            ),
        )

        val state = CandidateVideoViewerState(videos = videos, currentVideoId = "intro")
        val paused = state.togglePlayback()
        val next = paused.next()

        assertEquals("1 / 2", state.positionText)
        assertFalse(paused.shouldPlay)
        assertTrue(paused.showPlayOverlay)
        assertEquals("reel-1", next.currentVideo?.id)
        assertTrue(next.shouldPlay)
        assertFalse(next.showPlayOverlay)
        assertEquals("2 / 2", next.positionText)
        assertEquals("intro", next.previous().currentVideo?.id)

        val introSpec = state.screenSpec.video
        assertEquals("xmark", state.screenSpec.closeButtonIconName)
        assertEquals("intro", introSpec?.videoId)
        assertEquals("Introductory video", introSpec?.title)
        assertEquals("1 / 2", introSpec?.positionText)
        assertFalse(introSpec?.canSendInterest == true)
        assertFalse(introSpec?.canMarkViewed == true)

        val reelSpec = next.markCurrentViewed().screenSpec.video
        assertEquals("reel-1", reelSpec?.videoId)
        assertEquals("Built a search engine", reelSpec?.caption)
        assertTrue(reelSpec?.canSendInterest == true)
        assertTrue(reelSpec?.canMarkViewed == true)
        assertTrue(reelSpec?.isViewed == true)
    }

    @Test
    fun buildsSourceAwareInterestCommandFromCurrentClip() {
        val intro = RecruiterFeedClip(
            id = "intro-candidate-1",
            candidateId = "candidate-1",
            candidateName = "Zoe Chen",
            candidateSubtitle = "Computer Science",
            title = "Introductory video",
            caption = null,
            videoUrl = "intro.mp4",
            thumbnailUrl = null,
            kind = RecruiterFeedClipKind.INTRO,
            deeperVideoUrl = "deeper.mp4",
            reel = null,
        )
        val reel = RecruiterFeedClip.reel(
            ApplicantReelVideo(
                id = "reel-1",
                applicantId = "candidate-1",
                videoUrl = "reel.mp4",
                links = listOf(
                    ApplicantVideoEvidenceLink("project", "project-1"),
                    ApplicantVideoEvidenceLink("accomplishment", "accomplishment-1"),
                ),
            )
        )

        val introCommand = RecruiterReelsState(clips = listOf(intro, reel)).currentInterestCommand()
        val reelCommand = RecruiterReelsState(clips = listOf(intro, reel), currentIndex = 1).currentInterestCommand("Strong reel")

        assertEquals("candidate-1", introCommand?.candidateId)
        assertEquals("profile", introCommand?.sourceType)
        assertEquals(null, introCommand?.sourceVideoId)
        assertEquals("video", reelCommand?.sourceType)
        assertEquals("reel-1", reelCommand?.sourceVideoId)
        assertEquals("project-1", reelCommand?.sourceProjectId)
        assertEquals("accomplishment-1", reelCommand?.sourceAccomplishmentId)
    }
}
