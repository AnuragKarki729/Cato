package com.cato.app.state

import com.cato.app.core.ApplicantReelVideo
import com.cato.app.core.RecruiterCandidate
import com.cato.app.core.RecruiterCandidateProfileMediaResponse
import com.cato.app.core.RecruiterReviewStatus
import com.cato.app.core.RuntimeMatchScore
import kotlin.math.max

data class CandidateReviewVideo(
    val id: String,
    val title: String,
    val caption: String?,
    val videoUrl: String,
    val thumbnailUrl: String?,
    val sourceReel: ApplicantReelVideo?,
)

data class CandidateReviewHeaderState(
    val candidate: RecruiterCandidate,
    val runtimeMatchScore: RuntimeMatchScore? = null,
    val reelCount: Int = 0,
) {
    val displayedMatchScore: Int
        get() = runtimeMatchScore?.totalScore ?: candidate.matchScore

    val matchScoreLabel: String
        get() = "$displayedMatchScore%"

    val matchSourceLabel: String
        get() = if (runtimeMatchScore == null) {
            candidate.matchStrength.replace("_", " ").replaceFirstChar { it.uppercase() }
        } else {
            "Runtime match"
        }

    val reasonRows: List<String>
        get() = runtimeMatchScore?.reasons.orEmpty()

    val blockerRows: List<String>
        get() = runtimeMatchScore?.blockers.orEmpty()

    val factPills: List<String>
        get() = buildList {
            add("Profile ${candidate.profileStrength}%")
            if (candidate.hasResume) add("Resume")
            if (candidate.hasDeeperSignal) add("Deeper signal")
            if (candidate.projects.isNotEmpty()) add("${candidate.projects.size} projects")
            if (candidate.internships.isNotEmpty()) add("${candidate.internships.size} internships")
            if (reelCount > 0) add("$reelCount reels")
        }

    val shouldShowRuntimeReasons: Boolean
        get() = runtimeMatchScore != null && (reasonRows.isNotEmpty() || blockerRows.isNotEmpty())
}

data class CandidateReviewScreenSpec(
    val title: String,
    val loadingMessage: String,
    val header: CandidateReviewHeaderState,
    val actionMessage: String?,
    val auditButtonTitle: String?,
    val searchFit: CandidateReviewSearchFitSpec?,
    val videoLayout: CandidateReviewVideoLayout,
    val resume: CandidateResumeActionState?,
    val sections: List<CandidateReviewSectionSpec>,
)

data class CandidateReviewSearchFitSpec(
    val title: String = "Search fit",
    val scoreLabel: String,
    val reasons: List<String>,
    val blockers: List<String>,
)

data class CandidateReviewSectionSpec(
    val title: String,
    val trailing: String? = null,
    val rows: List<String>,
)

fun buildCandidateReviewScreenSpec(
    candidate: RecruiterCandidate,
    reels: List<ApplicantReelVideo> = emptyList(),
    profileMedia: RecruiterCandidateProfileMediaResponse = RecruiterCandidateProfileMediaResponse(),
    runtimeMatchScore: RuntimeMatchScore? = null,
    hasRuntimeSearchContext: Boolean = false,
    actionMessage: String? = null,
): CandidateReviewScreenSpec {
    val header = CandidateReviewHeaderState(
        candidate = candidate,
        runtimeMatchScore = runtimeMatchScore,
        reelCount = reels.size,
    )
    val videoLayout = buildCandidateReviewVideoLayout(candidate, reels)

    return CandidateReviewScreenSpec(
        title = "Candidate Review",
        loadingMessage = "Loading candidate",
        header = header,
        actionMessage = actionMessage,
        auditButtonTitle = if (hasRuntimeSearchContext) "Why this match?" else null,
        searchFit = runtimeMatchScore?.takeIf { it.reasons.isNotEmpty() || it.blockers.isNotEmpty() }?.let { score ->
            CandidateReviewSearchFitSpec(
                scoreLabel = "${score.totalScore}%",
                reasons = score.reasons.take(4),
                blockers = score.blockers.take(2),
            )
        },
        videoLayout = videoLayout,
        resume = candidate.toResumeActionState().takeIf { candidate.hasResume && it.canOpen },
        sections = buildCandidateReviewSections(candidate, profileMedia),
    )
}

private fun buildCandidateReviewSections(
    candidate: RecruiterCandidate,
    profileMedia: RecruiterCandidateProfileMediaResponse,
): List<CandidateReviewSectionSpec> {
    return buildList {
        if (profileMedia.accomplishments.isNotEmpty()) {
            add(
                CandidateReviewSectionSpec(
                    title = "Accomplishments",
                    trailing = profileMedia.accomplishments.size.toString(),
                    rows = profileMedia.accomplishments.map { accomplishment ->
                        accomplishment.title
                    },
                )
            )
        }

        if (candidate.projects.isNotEmpty()) {
            add(
                CandidateReviewSectionSpec(
                    title = "Projects",
                    trailing = candidate.projects.size.toString(),
                    rows = candidate.projects.map { project -> project.title },
                )
            )
        }

        if (candidate.internships.isNotEmpty()) {
            add(
                CandidateReviewSectionSpec(
                    title = "Internships",
                    trailing = candidate.internships.size.toString(),
                    rows = candidate.internships.map { internship ->
                        "${internship.roleDepartment} at ${internship.company}"
                    },
                )
            )
        }

        if (candidate.matchEvidence.isNotEmpty()) {
            add(
                CandidateReviewSectionSpec(
                    title = "Match evidence",
                    trailing = "${candidate.matchEvidence.size} signals",
                    rows = candidate.matchEvidence.map { evidence -> "${evidence.title}: ${evidence.body}" },
                )
            )
        }

        if (candidate.needsValidation.isNotEmpty()) {
            add(
                CandidateReviewSectionSpec(
                    title = "Needs validation",
                    trailing = "Check before advancing",
                    rows = candidate.needsValidation.map { validation -> "${validation.title}: ${validation.body}" },
                )
            )
        }

        if (candidate.softSkills.isNotEmpty()) {
            add(
                CandidateReviewSectionSpec(
                    title = "Soft signals",
                    trailing = "Legacy signal",
                    rows = candidate.softSkills.take(4).map { skill -> "${skill.label} %.1f".format(skill.rating) },
                )
            )
        }
    }
}

data class CandidateReviewVideoLayout(
    val featuredVideos: List<CandidateReviewVideo>,
    val reelThumbnails: List<CandidateReviewVideo>,
) {
    val allVideos: List<CandidateReviewVideo>
        get() = featuredVideos + reelThumbnails

    val thumbnailGridRows: List<List<CandidateReviewVideo>>
        get() = reelThumbnails.chunked(3)

    val hasVideos: Boolean
        get() = allVideos.isNotEmpty()
}

fun buildCandidateReviewVideoLayout(
    candidate: RecruiterCandidate,
    reels: List<ApplicantReelVideo>,
): CandidateReviewVideoLayout {
    val featured = buildList {
        candidate.tenSecondVideoUrl?.takeIf { it.isNotBlank() }?.let { introUrl ->
            add(
                CandidateReviewVideo(
                    id = "intro",
                    title = "Introductory video",
                    caption = candidate.signalSummary,
                    videoUrl = introUrl,
                    thumbnailUrl = null,
                    sourceReel = null,
                )
            )
        }

        candidate.thirtySecondVideoUrl?.takeIf { it.isNotBlank() }?.let { deeperUrl ->
            add(
                CandidateReviewVideo(
                    id = "deeper",
                    title = "Deeper signal",
                    caption = null,
                    videoUrl = deeperUrl,
                    thumbnailUrl = null,
                    sourceReel = null,
                )
            )
        }
    }

    val thumbnails = reels.map { reel ->
        CandidateReviewVideo(
            id = reel.id,
            title = "Profile reel",
            caption = reel.caption,
            videoUrl = reel.optimizedVideoUrl.ifBlank { reel.videoUrl },
            thumbnailUrl = reel.thumbnailUrl.takeIf { it.isNotBlank() },
            sourceReel = reel,
        )
    }

    return CandidateReviewVideoLayout(featuredVideos = featured, reelThumbnails = thumbnails)
}

data class CandidateResumeActionState(
    val fileName: String?,
    val resumeUrl: String?,
    val resumePreviewUrl: String?,
) {
    val effectiveUrl: String?
        get() = resumePreviewUrl?.takeIf { it.isNotBlank() } ?: resumeUrl?.takeIf { it.isNotBlank() }

    val canOpen: Boolean
        get() = !effectiveUrl.isNullOrBlank()

    val title: String
        get() = fileName?.takeIf { it.isNotBlank() } ?: "Resume"

    val buttonLabel: String
        get() = "Open resume"
}

fun RecruiterCandidate.toResumeActionState(): CandidateResumeActionState {
    return CandidateResumeActionState(
        fileName = resumeFileName,
        resumeUrl = resumeUrl,
        resumePreviewUrl = resumePreviewUrl,
    )
}

data class CandidateReviewChromeState(
    val reviewStatus: RecruiterReviewStatus = RecruiterReviewStatus.NONE,
    val scrollOffsetPx: Float = 0f,
    val screenHeightPx: Float = 1f,
) {
    private val compactThreshold: Float
        get() = max(1f, screenHeightPx * 0.10f)

    val isCompactDecisionBar: Boolean
        get() = scrollOffsetPx > compactThreshold

    val shouldShowHeaderActions: Boolean
        get() = isCompactDecisionBar

    val statusLabel: String
        get() = when (reviewStatus) {
            RecruiterReviewStatus.PASSED -> "Passed"
            RecruiterReviewStatus.SHORTLISTED -> "Shortlisted"
            RecruiterReviewStatus.MAYBE,
            RecruiterReviewStatus.NONE -> "Maybe"
        }

    val leftAction: RecruiterReviewStatus
        get() = if (reviewStatus == RecruiterReviewStatus.PASSED) {
            RecruiterReviewStatus.MAYBE
        } else {
            RecruiterReviewStatus.PASSED
        }

    val rightAction: RecruiterReviewStatus
        get() = if (reviewStatus == RecruiterReviewStatus.SHORTLISTED) {
            RecruiterReviewStatus.MAYBE
        } else {
            RecruiterReviewStatus.SHORTLISTED
        }

    fun labelFor(status: RecruiterReviewStatus): String {
        return when (status) {
            RecruiterReviewStatus.PASSED -> "Pass"
            RecruiterReviewStatus.SHORTLISTED -> "Shortlist"
            RecruiterReviewStatus.MAYBE,
            RecruiterReviewStatus.NONE -> "Maybe?"
        }
    }
}
