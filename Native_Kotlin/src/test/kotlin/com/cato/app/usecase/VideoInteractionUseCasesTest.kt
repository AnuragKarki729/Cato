package com.cato.app.usecase

import com.cato.app.core.ApplicantReelVideo
import com.cato.app.core.PublicApplicantProfileResponse
import com.cato.app.core.PublicDiscoveryRepository
import com.cato.app.core.RecruiterCandidate
import com.cato.app.core.RecruiterCandidateProfileMediaResponse
import com.cato.app.core.RecruiterCandidateSearchFilters
import com.cato.app.core.RecruiterDashboardResponse
import com.cato.app.core.RecruiterInterestCommand
import com.cato.app.core.RecruiterInterestRequest
import com.cato.app.core.RecruiterJob
import com.cato.app.core.RecruiterMessage
import com.cato.app.core.RecruiterRepository
import com.cato.app.core.RecruiterReviewStatus
import com.cato.app.core.RecruiterSavedFilter
import com.cato.app.core.RuntimeMatchResult
import com.cato.app.core.RuntimeSearchAuditResponse
import com.cato.app.core.RuntimeSearchSpec
import com.cato.app.state.CandidateReviewVideo
import com.cato.app.state.CandidateVideoViewerState
import com.cato.app.state.PublicApplicantVideoFeedState
import com.cato.app.state.RecruiterFeedClip
import com.cato.app.state.RecruiterFeedClipKind
import com.cato.app.state.RecruiterReelsState
import kotlin.coroutines.Continuation
import kotlin.coroutines.EmptyCoroutineContext
import kotlin.coroutines.startCoroutine
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class VideoInteractionUseCasesTest {
    @Test
    fun recruiterVideoInteractionsSkipIntroAndAvoidDuplicateViews() = runSuspend {
        val repository = FakeRecruiterVideoRepository()
        val useCase = RecruiterVideoInteractionUseCase(repository)
        val intro = RecruiterReelsState(
            clips = listOf(
                RecruiterFeedClip(
                    id = "intro-a",
                    candidateId = "a",
                    candidateName = "A",
                    candidateSubtitle = "",
                    title = "Introductory video",
                    caption = null,
                    videoUrl = "intro.mp4",
                    thumbnailUrl = null,
                    kind = RecruiterFeedClipKind.INTRO,
                    deeperVideoUrl = null,
                    reel = null,
                ),
                RecruiterFeedClip.reel(ApplicantReelVideo(id = "reel-1", applicantId = "a", videoUrl = "reel.mp4")),
            )
        )

        val afterIntro = useCase.markCurrentViewed("token", intro)
        val viewed = useCase.markCurrentViewed("token", intro.next())
        val viewedAgain = useCase.markCurrentViewed("token", viewed)
        val liked = useCase.toggleCurrentLike("token", viewed)

        assertEquals(intro, afterIntro)
        assertEquals(listOf("reel-1"), repository.viewedVideoIds)
        assertEquals(viewed, viewedAgain)
        assertTrue(viewed.isCurrentClipViewed)
        assertTrue(liked.isCurrentClipLiked)
        assertEquals(listOf("reel-1" to true), repository.likeCalls)
    }

    @Test
    fun publicApplicantVideoInteractionsUpdateStateAfterRepositoryCalls() = runSuspend {
        val repository = FakePublicVideoRepository()
        val useCase = PublicApplicantVideoInteractionUseCase(repository)
        val state = PublicApplicantVideoFeedState(
            videos = listOf(ApplicantReelVideo(id = "reel-1", applicantId = "a", videoUrl = "reel.mp4")),
        )

        val viewed = useCase.markCurrentViewed("token", state)
        val viewedAgain = useCase.markCurrentViewed("token", viewed)
        val liked = useCase.toggleCurrentLike("token", viewed)
        val unliked = useCase.toggleCurrentLike("token", liked)

        assertTrue(viewed.isCurrentVideoViewed)
        assertEquals(viewed, viewedAgain)
        assertEquals(listOf("reel-1"), repository.viewedVideoIds)
        assertTrue(liked.isCurrentVideoLiked)
        assertFalse(unliked.isCurrentVideoLiked)
        assertEquals(listOf("reel-1" to true, "reel-1" to false), repository.likeCalls)
    }

    @Test
    fun candidateReviewVideoInteractionsOnlyMarkSourceReelsViewed() = runSuspend {
        val repository = FakeRecruiterVideoRepository()
        val useCase = CandidateReviewVideoInteractionUseCase(repository)
        val state = CandidateVideoViewerState(
            videos = listOf(
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
                    caption = null,
                    videoUrl = "reel.mp4",
                    thumbnailUrl = null,
                    sourceReel = ApplicantReelVideo(id = "reel-1", applicantId = "a", videoUrl = "reel.mp4"),
                ),
            ),
            currentVideoId = "intro",
        )

        val intro = useCase.markCurrentViewed("token", state)
        val viewed = useCase.markCurrentViewed("token", state.next())
        val viewedAgain = useCase.markCurrentViewed("token", viewed)

        assertEquals(state, intro)
        assertTrue(viewed.isCurrentVideoViewed)
        assertEquals(viewed, viewedAgain)
        assertEquals(listOf("reel-1"), repository.viewedVideoIds)
    }
}

private class FakeRecruiterVideoRepository : RecruiterRepository {
    val viewedVideoIds = mutableListOf<String>()
    val likeCalls = mutableListOf<Pair<String, Boolean>>()

    override suspend fun markVideoViewed(accessToken: String, videoId: String) {
        viewedVideoIds.add(videoId)
    }

    override suspend fun setVideoLiked(accessToken: String, videoId: String, liked: Boolean) {
        likeCalls.add(videoId to liked)
    }

    override suspend fun dashboard(accessToken: String): RecruiterDashboardResponse = TODO("not used")
    override suspend fun savedFilters(accessToken: String): List<RecruiterSavedFilter> = TODO("not used")
    override suspend fun interestRequests(accessToken: String): List<RecruiterInterestRequest> = TODO("not used")
    override suspend fun candidates(accessToken: String, filters: RecruiterCandidateSearchFilters): List<RecruiterCandidate> = TODO("not used")
    override suspend fun evidenceQueue(accessToken: String, filters: RecruiterCandidateSearchFilters): List<RecruiterCandidate> = TODO("not used")
    override suspend fun candidate(accessToken: String, candidateId: String): RecruiterCandidate = TODO("not used")
    override suspend fun candidateProfileMedia(accessToken: String, candidateId: String): RecruiterCandidateProfileMediaResponse = TODO("not used")
    override suspend fun bookmarkCandidate(accessToken: String, candidateId: String) = TODO("not used")
    override suspend fun updateCandidateReview(accessToken: String, candidateId: String, status: RecruiterReviewStatus) = TODO("not used")
    override suspend fun sendInterest(accessToken: String, request: RecruiterInterestCommand) = TODO("not used")
    override suspend fun contactCandidate(accessToken: String, candidateId: String, body: String) = TODO("not used")
    override suspend fun messages(accessToken: String): List<RecruiterMessage> = TODO("not used")
    override suspend fun candidateMessages(accessToken: String, candidateId: String): List<RecruiterMessage> = TODO("not used")
    override suspend fun runtimeSearch(accessToken: String, spec: RuntimeSearchSpec): List<RuntimeMatchResult> = TODO("not used")
    override suspend fun auditRuntimeSearch(accessToken: String, spec: RuntimeSearchSpec, applicantId: String): RuntimeSearchAuditResponse = TODO("not used")
    override suspend fun saveRecruiterSearch(accessToken: String, name: String, spec: RuntimeSearchSpec): RecruiterJob = TODO("not used")
    override suspend fun updateRecruiterSearch(accessToken: String, jobId: String, name: String, spec: RuntimeSearchSpec): RecruiterJob = TODO("not used")
    override suspend fun videoFeed(accessToken: String, limit: Int, offset: Int): List<ApplicantReelVideo> = TODO("not used")
}

private class FakePublicVideoRepository : PublicDiscoveryRepository {
    val viewedVideoIds = mutableListOf<String>()
    val likeCalls = mutableListOf<Pair<String, Boolean>>()

    override suspend fun markVideoViewed(accessToken: String, videoId: String) {
        viewedVideoIds.add(videoId)
    }

    override suspend fun setVideoLiked(accessToken: String, videoId: String, liked: Boolean) {
        likeCalls.add(videoId to liked)
    }

    override suspend fun videoFeed(accessToken: String, limit: Int, offset: Int): List<ApplicantReelVideo> = TODO("not used")
    override suspend fun publicApplicantProfile(accessToken: String, applicantId: String): PublicApplicantProfileResponse = TODO("not used")
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
