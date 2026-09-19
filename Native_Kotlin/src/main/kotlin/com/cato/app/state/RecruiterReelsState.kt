package com.cato.app.state

import com.cato.app.core.ApplicantReelVideo
import com.cato.app.core.RecruiterCandidate
import com.cato.app.core.RecruiterInterestCommand

enum class RecruiterFeedClipKind {
    INTRO,
    REEL,
}

data class RecruiterFeedClip(
    val id: String,
    val candidateId: String,
    val candidateName: String,
    val candidateSubtitle: String,
    val title: String,
    val caption: String?,
    val videoUrl: String,
    val thumbnailUrl: String?,
    val kind: RecruiterFeedClipKind,
    val deeperVideoUrl: String?,
    val reel: ApplicantReelVideo?,
) {
    val activeVideoUrl: String
        get() = videoUrl

    companion object {
        fun intro(candidate: RecruiterCandidate): RecruiterFeedClip? {
            val introUrl = candidate.tenSecondVideoUrl?.takeIf { it.isNotBlank() } ?: return null
            return RecruiterFeedClip(
                id = "intro-${candidate.id}",
                candidateId = candidate.id,
                candidateName = candidate.displayName,
                candidateSubtitle = candidate.displaySubtitle,
                title = "Introductory video",
                caption = candidate.signalSummary,
                videoUrl = introUrl,
                thumbnailUrl = null,
                kind = RecruiterFeedClipKind.INTRO,
                deeperVideoUrl = candidate.thirtySecondVideoUrl?.takeIf { it.isNotBlank() },
                reel = null,
            )
        }

        fun reel(video: ApplicantReelVideo): RecruiterFeedClip {
            return RecruiterFeedClip(
                id = "reel-${video.id}",
                candidateId = video.applicantId,
                candidateName = video.applicantName ?: "Applicant",
                candidateSubtitle = "${video.viewCount} views • ${video.likeCount} likes",
                title = "Profile reel",
                caption = video.caption,
                videoUrl = video.optimizedVideoUrl.ifBlank { video.videoUrl },
                thumbnailUrl = video.thumbnailUrl.takeIf { it.isNotBlank() },
                kind = RecruiterFeedClipKind.REEL,
                deeperVideoUrl = null,
                reel = video,
            )
        }
    }
}

data class RecruiterReelsState(
    val clips: List<RecruiterFeedClip> = emptyList(),
    val currentIndex: Int = 0,
    val isShowingDeeperSignal: Boolean = false,
    val isPausedByUser: Boolean = false,
    val isChromeVisible: Boolean = true,
    val likedVideoIds: Set<String> = emptySet(),
    val viewedVideoIds: Set<String> = emptySet(),
    val sentInterestIds: Set<String> = emptySet(),
) {
    val screenSpec: RecruiterReelsScreenSpec
        get() = RecruiterReelsScreenSpec(
            title = "Reels",
            loadingMessage = "Loading reels",
            emptyIconName = "film",
            emptyTitle = "No applicant videos yet",
            emptyMessage = "Intro videos and profile reels will appear here when candidates add them.",
            clip = currentClip?.let { clip ->
                RecruiterReelsClipSpec(
                    clipId = clip.id,
                    candidateId = clip.candidateId,
                    candidateName = clip.candidateName,
                    candidateSubtitle = clip.candidateSubtitle,
                    title = activeTitle,
                    caption = clip.caption,
                    videoUrl = activeVideoUrl.orEmpty(),
                    thumbnailUrl = clip.thumbnailUrl,
                    positionText = positionText,
                    isShowingDeeperSignal = isShowingDeeperSignal,
                    shouldPlay = shouldPlay,
                    showPlayOverlay = showPlayOverlay,
                    chromeVisible = isChromeVisible,
                    canSwipeRightToDeeperSignal = clip.kind == RecruiterFeedClipKind.INTRO && !clip.deeperVideoUrl.isNullOrBlank() && !isShowingDeeperSignal,
                    canLike = canLikeCurrentClip,
                    isLiked = isCurrentClipLiked,
                    interestSent = interestSentForCurrentClip,
                    canOpenCandidateProfile = true,
                )
            },
        )

    val currentClip: RecruiterFeedClip?
        get() = clips.getOrNull(currentIndex)

    val activeVideoUrl: String?
        get() {
            val clip = currentClip ?: return null
            return if (isShowingDeeperSignal) clip.deeperVideoUrl ?: clip.videoUrl else clip.videoUrl
        }

    val activeTitle: String
        get() = if (isShowingDeeperSignal) "Deeper signal" else currentClip?.title.orEmpty()

    val shouldPlay: Boolean
        get() = currentClip != null && !isPausedByUser

    val showPlayOverlay: Boolean
        get() = currentClip != null && isPausedByUser

    val currentReelVideoIdForInteraction: String?
        get() = currentClip?.reel?.id?.takeUnless { isShowingDeeperSignal }

    val canLikeCurrentClip: Boolean
        get() = currentReelVideoIdForInteraction != null

    val canMarkCurrentClipViewed: Boolean
        get() = currentReelVideoIdForInteraction != null

    val isCurrentClipLiked: Boolean
        get() = currentReelVideoIdForInteraction?.let { it in likedVideoIds } ?: false

    val isCurrentClipViewed: Boolean
        get() = currentReelVideoIdForInteraction?.let { it in viewedVideoIds } ?: false

    val positionText: String
        get() = if (clips.isEmpty()) "0 / 0" else "${currentIndex + 1} / ${clips.size}"

    val interestSentForCurrentClip: Boolean
        get() {
            val clip = currentClip ?: return false
            return when {
                clip.reel != null -> clip.reel.id in sentInterestIds
                else -> clip.candidateId in sentInterestIds
            }
        }

    fun next(): RecruiterReelsState {
        if (currentIndex >= clips.lastIndex) return this
        return copy(
            currentIndex = currentIndex + 1,
            isShowingDeeperSignal = false,
            isPausedByUser = false,
            isChromeVisible = true,
        )
    }

    fun previous(): RecruiterReelsState {
        if (currentIndex <= 0) return this
        return copy(
            currentIndex = currentIndex - 1,
            isShowingDeeperSignal = false,
            isPausedByUser = false,
            isChromeVisible = true,
        )
    }

    fun showDeeperSignal(): RecruiterReelsState {
        val clip = currentClip ?: return this
        if (clip.kind != RecruiterFeedClipKind.INTRO || clip.deeperVideoUrl.isNullOrBlank()) return this
        return copy(isShowingDeeperSignal = true, isPausedByUser = false, isChromeVisible = true)
    }

    fun showIntro(): RecruiterReelsState {
        return if (isShowingDeeperSignal) {
            copy(isShowingDeeperSignal = false, isPausedByUser = false, isChromeVisible = true)
        } else {
            this
        }
    }

    fun togglePlayback(): RecruiterReelsState {
        return if (currentClip == null) {
            this
        } else {
            copy(isPausedByUser = !isPausedByUser, isChromeVisible = true)
        }
    }

    fun setChromeVisible(visible: Boolean): RecruiterReelsState {
        return if (isChromeVisible == visible) this else copy(isChromeVisible = visible)
    }

    fun markViewed(videoId: String): RecruiterReelsState {
        return copy(viewedVideoIds = viewedVideoIds + videoId)
    }

    fun markCurrentViewed(): RecruiterReelsState {
        val videoId = currentReelVideoIdForInteraction ?: return this
        return markViewed(videoId)
    }

    fun setLiked(videoId: String, liked: Boolean): RecruiterReelsState {
        return copy(likedVideoIds = if (liked) likedVideoIds + videoId else likedVideoIds - videoId)
    }

    fun toggleCurrentLike(): RecruiterReelsState {
        val videoId = currentReelVideoIdForInteraction ?: return this
        return setLiked(videoId, liked = videoId !in likedVideoIds)
    }

    fun markInterestSent(id: String): RecruiterReelsState {
        return copy(sentInterestIds = sentInterestIds + id)
    }

    fun currentInterestCommand(reason: String = "Interested after reviewing your video."): RecruiterInterestCommand? {
        val clip = currentClip ?: return null
        val reel = clip.reel
        return RecruiterInterestCommand(
            candidateId = clip.candidateId,
            reason = reason,
            sourceType = if (reel == null) "profile" else "video",
            sourceVideoId = reel?.id,
            sourceProjectId = reel?.links?.firstOrNull { it.targetType == "project" }?.targetId,
            sourceInternshipId = reel?.links?.firstOrNull { it.targetType == "internship" }?.targetId,
            sourceAccomplishmentId = reel?.links?.firstOrNull { it.targetType == "accomplishment" }?.targetId,
        )
    }
}

data class RecruiterReelsScreenSpec(
    val title: String,
    val loadingMessage: String,
    val emptyIconName: String,
    val emptyTitle: String,
    val emptyMessage: String,
    val clip: RecruiterReelsClipSpec?,
) {
    val isEmpty: Boolean
        get() = clip == null
}

data class RecruiterReelsClipSpec(
    val clipId: String,
    val candidateId: String,
    val candidateName: String,
    val candidateSubtitle: String,
    val title: String,
    val caption: String?,
    val videoUrl: String,
    val thumbnailUrl: String?,
    val positionText: String,
    val isShowingDeeperSignal: Boolean,
    val shouldPlay: Boolean,
    val showPlayOverlay: Boolean,
    val chromeVisible: Boolean,
    val canSwipeRightToDeeperSignal: Boolean,
    val canLike: Boolean,
    val isLiked: Boolean,
    val interestSent: Boolean,
    val canOpenCandidateProfile: Boolean,
)

data class CandidateVideoViewerState(
    val videos: List<CandidateReviewVideo>,
    val currentVideoId: String?,
    val isPausedByUser: Boolean = false,
    val isChromeVisible: Boolean = true,
    val viewedVideoIds: Set<String> = emptySet(),
) {
    val screenSpec: CandidateVideoViewerScreenSpec
        get() = CandidateVideoViewerScreenSpec(
            closeButtonIconName = "xmark",
            video = currentVideo?.let { video ->
                CandidateVideoViewerVideoSpec(
                    videoId = video.id,
                    title = video.title,
                    caption = video.caption,
                    videoUrl = video.videoUrl,
                    thumbnailUrl = video.thumbnailUrl,
                    positionText = positionText,
                    shouldPlay = shouldPlay,
                    showPlayOverlay = showPlayOverlay,
                    chromeVisible = isChromeVisible,
                    canSendInterest = video.sourceReel != null,
                    canMarkViewed = canMarkCurrentViewed,
                    isViewed = isCurrentVideoViewed,
                )
            },
        )

    val currentIndex: Int
        get() = videos.indexOfFirst { it.id == currentVideoId }.takeIf { it >= 0 } ?: 0

    val currentVideo: CandidateReviewVideo?
        get() = videos.getOrNull(currentIndex)

    val shouldPlay: Boolean
        get() = currentVideo != null && !isPausedByUser

    val showPlayOverlay: Boolean
        get() = currentVideo != null && isPausedByUser

    val currentSourceReelVideoId: String?
        get() = currentVideo?.sourceReel?.id

    val canMarkCurrentViewed: Boolean
        get() = currentSourceReelVideoId != null

    val isCurrentVideoViewed: Boolean
        get() = currentSourceReelVideoId?.let { it in viewedVideoIds } ?: false

    val positionText: String
        get() = if (videos.isEmpty()) "0 / 0" else "${currentIndex + 1} / ${videos.size}"

    fun togglePlayback(): CandidateVideoViewerState {
        return if (currentVideo == null) {
            this
        } else {
            copy(isPausedByUser = !isPausedByUser, isChromeVisible = true)
        }
    }

    fun pageTo(videoId: String): CandidateVideoViewerState {
        if (videos.none { it.id == videoId }) return this
        return copy(currentVideoId = videoId, isPausedByUser = false, isChromeVisible = true)
    }

    fun next(): CandidateVideoViewerState {
        val nextVideo = videos.getOrNull(currentIndex + 1) ?: return this
        return pageTo(nextVideo.id)
    }

    fun previous(): CandidateVideoViewerState {
        val previousVideo = videos.getOrNull(currentIndex - 1) ?: return this
        return pageTo(previousVideo.id)
    }

    fun markCurrentViewed(): CandidateVideoViewerState {
        val videoId = currentSourceReelVideoId ?: return this
        return copy(viewedVideoIds = viewedVideoIds + videoId)
    }
}

data class CandidateVideoViewerScreenSpec(
    val closeButtonIconName: String,
    val video: CandidateVideoViewerVideoSpec?,
) {
    val isEmpty: Boolean
        get() = video == null
}

data class CandidateVideoViewerVideoSpec(
    val videoId: String,
    val title: String,
    val caption: String?,
    val videoUrl: String,
    val thumbnailUrl: String?,
    val positionText: String,
    val shouldPlay: Boolean,
    val showPlayOverlay: Boolean,
    val chromeVisible: Boolean,
    val canSendInterest: Boolean,
    val canMarkViewed: Boolean,
    val isViewed: Boolean,
)

fun buildRecruiterFeedClips(
    candidates: List<RecruiterCandidate>,
    reels: List<ApplicantReelVideo>,
): List<RecruiterFeedClip> {
    return buildList {
        candidates.mapNotNullTo(this) { RecruiterFeedClip.intro(it) }
        reels.mapTo(this) { RecruiterFeedClip.reel(it) }
    }.filter { it.videoUrl.isNotBlank() }
}
