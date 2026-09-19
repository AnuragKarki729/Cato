package com.cato.app.usecase

import com.cato.app.core.ApplicantReelVideo
import com.cato.app.core.RecruiterCandidate
import com.cato.app.core.RecruiterCandidateProfileMediaResponse
import com.cato.app.core.RecruiterCandidateSearchFilters
import com.cato.app.core.RecruiterInterestCommand
import com.cato.app.core.RecruiterRepository
import com.cato.app.core.RecruiterReviewStatus
import com.cato.app.core.RuntimeSearchSpec
import com.cato.app.state.RecruiterConversationState
import com.cato.app.state.RecruiterDashboardState
import com.cato.app.state.RecruiterComparisonState
import com.cato.app.state.RecruiterBookmarksState
import com.cato.app.state.RecruiterEvidenceQueueState
import com.cato.app.state.RecruiterInterestRequestsListState
import com.cato.app.state.RecruiterReelsState
import com.cato.app.state.RecruiterSettingsState
import com.cato.app.state.RecruiterShortlistState
import com.cato.app.state.CandidateVideoViewerState
import com.cato.app.state.buildRecruiterFeedClips
import com.cato.app.state.countUnreadRecruiterMessages
import com.cato.app.state.groupRecruiterMessages

data class CandidateProfilePayload(
    val candidate: RecruiterCandidate,
    val media: RecruiterCandidateProfileMediaResponse,
)

class LoadRecruiterDashboardUseCase(
    private val repository: RecruiterRepository,
) {
    suspend operator fun invoke(accessToken: String): RecruiterDashboardState {
        return RecruiterDashboardState(
            dashboard = repository.dashboard(accessToken),
            requests = repository.interestRequests(accessToken),
            quickSearches = repository.savedFilters(accessToken),
        )
    }
}

class LoadRecruiterMessagesUseCase(
    private val repository: RecruiterRepository,
) {
    suspend operator fun invoke(accessToken: String) = groupRecruiterMessages(repository.messages(accessToken))
}

class LoadRecruiterUnreadMessageCountUseCase(
    private val repository: RecruiterRepository,
) {
    suspend operator fun invoke(accessToken: String): Int {
        return countUnreadRecruiterMessages(repository.messages(accessToken))
    }
}

class LoadRecruiterInterestRequestsUseCase(
    private val repository: RecruiterRepository,
) {
    suspend operator fun invoke(accessToken: String): RecruiterInterestRequestsListState {
        return RecruiterInterestRequestsListState(requests = repository.interestRequests(accessToken))
    }
}

class LoadRecruiterBookmarksUseCase(
    private val repository: RecruiterRepository,
) {
    suspend operator fun invoke(accessToken: String): RecruiterBookmarksState {
        return RecruiterBookmarksState(
            bookmarked = repository.candidates(
                accessToken = accessToken,
                filters = RecruiterCandidateSearchFilters(bookmarkedOnly = true),
            ),
            isLoading = false,
            errorMessage = null,
        )
    }
}

class LoadRecruiterShortlistUseCase(
    private val repository: RecruiterRepository,
) {
    suspend operator fun invoke(accessToken: String): RecruiterShortlistState {
        return RecruiterShortlistState(
            candidates = repository.candidates(
                accessToken = accessToken,
                filters = RecruiterCandidateSearchFilters(reviewStatus = RecruiterReviewStatus.SHORTLISTED),
            ),
            isLoading = false,
            errorMessage = null,
        )
    }
}

class LoadRecruiterSettingsUseCase(
    private val repository: RecruiterRepository,
) {
    suspend operator fun invoke(accessToken: String, sessionEmail: String? = null): RecruiterSettingsState {
        return RecruiterSettingsState(
            recruiter = repository.dashboard(accessToken).recruiter,
            sessionEmail = sessionEmail,
            isLoading = false,
            errorMessage = null,
        )
    }
}

class LoadRecruiterReelsUseCase(
    private val repository: RecruiterRepository,
) {
    suspend operator fun invoke(accessToken: String): RecruiterReelsState {
        val candidates = repository.candidates(accessToken)
        val reels = repository.videoFeed(accessToken, limit = 50)
        return RecruiterReelsState(clips = buildRecruiterFeedClips(candidates, reels))
    }
}

class RecruiterVideoInteractionUseCase(
    private val repository: RecruiterRepository,
) {
    suspend fun markCurrentViewed(accessToken: String, state: RecruiterReelsState): RecruiterReelsState {
        val videoId = state.currentReelVideoIdForInteraction ?: return state
        if (state.isCurrentClipViewed) return state
        repository.markVideoViewed(accessToken, videoId)
        return state.markCurrentViewed()
    }

    suspend fun toggleCurrentLike(accessToken: String, state: RecruiterReelsState): RecruiterReelsState {
        val videoId = state.currentReelVideoIdForInteraction ?: return state
        val nextValue = !state.isCurrentClipLiked
        repository.setVideoLiked(accessToken, videoId, nextValue)
        return state.toggleCurrentLike()
    }
}

class CandidateReviewVideoInteractionUseCase(
    private val repository: RecruiterRepository,
) {
    suspend fun markCurrentViewed(accessToken: String, state: CandidateVideoViewerState): CandidateVideoViewerState {
        val videoId = state.currentSourceReelVideoId ?: return state
        if (state.isCurrentVideoViewed) return state
        repository.markVideoViewed(accessToken, videoId)
        return state.markCurrentViewed()
    }
}

class RuntimeSearchUseCase(
    private val repository: RecruiterRepository,
) {
    suspend operator fun invoke(accessToken: String, spec: RuntimeSearchSpec) = repository.runtimeSearch(accessToken, spec)

    suspend fun audit(accessToken: String, spec: RuntimeSearchSpec, applicantId: String) = repository.auditRuntimeSearch(accessToken, spec, applicantId)
}

class SaveRecruiterSearchUseCase(
    private val repository: RecruiterRepository,
) {
    suspend fun create(accessToken: String, name: String, spec: RuntimeSearchSpec) = repository.saveRecruiterSearch(accessToken, name.trim(), spec)

    suspend fun update(accessToken: String, jobId: String, name: String, spec: RuntimeSearchSpec) = repository.updateRecruiterSearch(accessToken, jobId, name.trim(), spec)
}

class CandidateReviewUseCase(
    private val repository: RecruiterRepository,
) {
    suspend fun loadCandidate(accessToken: String, candidateId: String): Pair<RecruiterCandidate, List<ApplicantReelVideo>> {
        val candidate = repository.candidate(accessToken, candidateId)
        val media = repository.candidateProfileMedia(accessToken, candidateId)
        return candidate to media.videos
    }

    suspend fun loadCandidateProfile(accessToken: String, candidateId: String): CandidateProfilePayload {
        val candidate = repository.candidate(accessToken, candidateId)
        val media = repository.candidateProfileMedia(accessToken, candidateId)
        return CandidateProfilePayload(candidate = candidate, media = media)
    }

    suspend fun updateStatus(accessToken: String, candidateId: String, status: RecruiterReviewStatus) {
        repository.updateCandidateReview(accessToken, candidateId, status)
    }

    suspend fun bookmark(accessToken: String, candidateId: String) {
        repository.bookmarkCandidate(accessToken, candidateId)
    }

    suspend fun sendInterest(accessToken: String, command: RecruiterInterestCommand) {
        repository.sendInterest(accessToken, command)
    }
}

class RecruiterEvidenceQueueUseCase(
    private val repository: RecruiterRepository,
) {
    suspend fun load(accessToken: String): RecruiterEvidenceQueueState {
        return RecruiterEvidenceQueueState(candidates = repository.evidenceQueue(accessToken))
    }

    suspend fun updateStatus(
        accessToken: String,
        state: RecruiterEvidenceQueueState,
        candidateId: String,
        status: RecruiterReviewStatus,
    ): RecruiterEvidenceQueueState {
        repository.updateCandidateReview(accessToken, candidateId, status)
        return state.afterReviewUpdate(candidateId, status)
    }
}

class RecruiterComparisonUseCase(
    private val repository: RecruiterRepository,
) {
    suspend fun load(accessToken: String, candidateIds: List<String>): RecruiterComparisonState {
        val candidates = candidateIds.take(4).map { candidateId ->
            repository.candidate(accessToken, candidateId)
        }
        return RecruiterComparisonState(candidates = candidates)
    }
}

class RecruiterConversationUseCase(
    private val repository: RecruiterRepository,
) {
    suspend fun load(accessToken: String, state: RecruiterConversationState): RecruiterConversationState {
        return state.copy(
            messages = repository.candidateMessages(accessToken, state.candidateId),
            isLoading = false,
            errorMessage = null,
        )
    }

    suspend fun send(accessToken: String, state: RecruiterConversationState): RecruiterConversationState {
        val body = state.trimmedDraft
        require(body.isNotEmpty()) { "Message cannot be empty." }
        repository.contactCandidate(accessToken, state.candidateId, body)
        return state.copy(
            draft = "",
            messages = repository.candidateMessages(accessToken, state.candidateId),
            isSending = false,
            errorMessage = null,
        )
    }
}
