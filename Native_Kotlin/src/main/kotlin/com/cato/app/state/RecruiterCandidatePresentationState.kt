package com.cato.app.state

import com.cato.app.core.ApplicantAccomplishment
import com.cato.app.core.RecruiterCandidate
import com.cato.app.core.RecruiterCandidateProfileMediaResponse

data class RecruiterResultsState(
    val title: String,
    val candidates: List<RecruiterCandidate> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
) {
    val screenSpec: RecruiterResultsScreenSpec
        get() = RecruiterResultsScreenSpec(
            title = title,
            loadingMessage = "Loading candidates",
            countLabel = countLabel,
            helperText = "Ranked by match strength, profile completeness, evidence signals, projects, and recruiter filters.",
            sortLabel = "Sort",
            sortIconName = "arrow.up.arrow.down",
            filterLabel = "Filter",
            filterIconName = "line.3.horizontal.decrease.circle",
            empty = RecruiterResultsEmptySpec(
                iconName = "person.crop.circle.badge.questionmark",
                title = emptyTitle,
                message = emptyMessage,
            ),
            rows = resultRows,
        )

    val countLabel: String
        get() = "${candidates.size} candidates"

    val emptyTitle: String
        get() = "No candidates found"

    val emptyMessage: String
        get() = "Try adjusting the search or clearing filters."

    val resultRows: List<CandidateResultRowSpec>
        get() = candidates.map { it.toResultRowSpec() }
}

data class CandidateResultRowSpec(
    val candidateId: String,
    val displayName: String,
    val subtitle: String,
    val semesterLabel: String,
    val matchScoreLabel: String,
    val matchStrengthLabel: String,
    val tags: List<String>,
    val resumeLabel: String,
    val videoLabel: String,
    val viewProfileLabel: String,
    val route: RecruiterRoute,
    val bookmarked: Boolean,
)

fun RecruiterCandidate.toResultRowSpec(): CandidateResultRowSpec {
    return CandidateResultRowSpec(
        candidateId = id,
        displayName = displayName,
        subtitle = displaySubtitle.ifBlank { "Profile details pending" },
        semesterLabel = semesterLabel ?: "Semester pending",
        matchScoreLabel = "$matchScore%",
        matchStrengthLabel = matchStrength.replace("_", " ").replaceFirstChar { it.uppercase() },
        tags = tags.take(3),
        resumeLabel = if (hasResume) "Resume" else "No resume",
        videoLabel = if (hasDeeperSignal) "Deeper signal" else "Short take",
        viewProfileLabel = "View profile",
        route = RecruiterRoute.CandidateReview(id),
        bookmarked = bookmarked,
    )
}

data class RecruiterResultsScreenSpec(
    val title: String,
    val loadingMessage: String,
    val countLabel: String,
    val helperText: String,
    val sortLabel: String,
    val sortIconName: String,
    val filterLabel: String,
    val filterIconName: String,
    val empty: RecruiterResultsEmptySpec,
    val rows: List<CandidateResultRowSpec>,
) {
    val isEmpty: Boolean
        get() = rows.isEmpty()
}

data class RecruiterResultsEmptySpec(
    val iconName: String,
    val title: String,
    val message: String,
)

enum class CandidateDetailTab(val title: String) {
    ABOUT("About"),
    RESUME("Resume"),
    VIDEO("Video"),
    MORE("More"),
}

data class CandidateDetailState(
    val candidate: RecruiterCandidate,
    val selectedTab: CandidateDetailTab = CandidateDetailTab.ABOUT,
    val profileMedia: RecruiterCandidateProfileMediaResponse = RecruiterCandidateProfileMediaResponse(),
) {
    val header: CandidateDetailHeaderSpec
        get() = CandidateDetailHeaderSpec(
            displayName = candidate.displayName,
            subtitle = candidate.displaySubtitle.ifBlank { "Profile details pending" },
            semesterLabel = candidate.semesterLabel,
            matchScoreLabel = "${candidate.matchScore}%",
            factPills = buildCandidateFactPills(candidate, profileMedia),
        )

    val visibleSections: List<CandidateDetailSection>
        get() = when (selectedTab) {
            CandidateDetailTab.ABOUT -> aboutSections()
            CandidateDetailTab.RESUME -> resumeSections()
            CandidateDetailTab.VIDEO -> videoSections()
            CandidateDetailTab.MORE -> moreSections()
        }

    private fun aboutSections(): List<CandidateDetailSection> {
        return buildList {
            candidate.signalSummary?.takeIf { it.isNotBlank() }?.let {
                add(CandidateDetailSection("Signal", listOf(it)))
            }
            if (candidate.softSkills.isNotEmpty()) {
                add(CandidateDetailSection("Soft signals", candidate.softSkills.take(6).map { "${it.label} ${it.rating}" }))
            }
        }
    }

    private fun resumeSections(): List<CandidateDetailSection> {
        return if (candidate.hasResume) {
            listOf(CandidateDetailSection("Resume", listOf(candidate.resumeFileName ?: "Resume available")))
        } else {
            emptyList()
        }
    }

    private fun videoSections(): List<CandidateDetailSection> {
        return buildList {
            candidate.tenSecondVideoUrl?.takeIf { it.isNotBlank() }?.let { add(CandidateDetailSection("Short take", listOf(it))) }
            candidate.thirtySecondVideoUrl?.takeIf { it.isNotBlank() }?.let { add(CandidateDetailSection("Deeper signal", listOf(it))) }
        }
    }

    private fun moreSections(): List<CandidateDetailSection> {
        return buildList {
            if (candidate.projects.isNotEmpty()) {
                add(CandidateDetailSection("Projects", candidate.projects.map { it.title }))
            }
            if (candidate.internships.isNotEmpty()) {
                add(CandidateDetailSection("Internships", candidate.internships.map { "${it.roleDepartment} at ${it.company}" }))
            }
            if (profileMedia.accomplishments.isNotEmpty()) {
                add(CandidateDetailSection("Accomplishments", profileMedia.accomplishments.map { it.displayRow }))
            }
        }
    }
}

data class CandidateDetailHeaderSpec(
    val displayName: String,
    val subtitle: String,
    val semesterLabel: String?,
    val matchScoreLabel: String,
    val factPills: List<String>,
)

data class CandidateDetailSection(
    val title: String,
    val rows: List<String>,
)

private fun buildCandidateFactPills(
    candidate: RecruiterCandidate,
    profileMedia: RecruiterCandidateProfileMediaResponse,
): List<String> {
    return buildList {
        add("Profile ${candidate.profileStrength}%")
        candidate.gpa?.let { add("GPA %.2f".format(it)) }
        if (candidate.hasResume) add("Resume")
        if (candidate.hasDeeperSignal) add("Deeper signal")
        if (candidate.projects.isNotEmpty()) add("${candidate.projects.size} projects")
        if (candidate.internships.isNotEmpty()) add("${candidate.internships.size} internships")
        if (profileMedia.accomplishments.isNotEmpty()) add("${profileMedia.accomplishments.size} accomplishments")
    }
}

private val ApplicantAccomplishment.displayRow: String
    get() = if (linkUrl.isNullOrBlank()) {
        title
    } else {
        "$title • Link available"
    }
