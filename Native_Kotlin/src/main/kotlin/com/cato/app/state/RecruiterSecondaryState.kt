package com.cato.app.state

import com.cato.app.core.RecruiterAccount
import com.cato.app.core.RecruiterCandidate
import com.cato.app.core.RecruiterReviewStatus

data class RecruiterBookmarksState(
    val bookmarked: List<RecruiterCandidate> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
) {
    val screenSpec: RecruiterBookmarksScreenSpec
        get() = RecruiterBookmarksScreenSpec(
            title = "Bookmarked",
            loadingMessage = "Loading bookmarks",
            countLabel = countLabel,
            emptyIconName = "bookmark",
            emptyTitle = emptyTitle,
            emptyMessage = emptyMessage,
            rows = rows,
        )

    val countLabel: String
        get() = "${bookmarked.size} bookmarked candidates"

    val emptyTitle: String
        get() = "No bookmarks yet"

    val emptyMessage: String
        get() = "Bookmark candidates from review screens to return to them quickly."

    val rows: List<CandidateResultRowSpec>
        get() = bookmarked.map { it.toResultRowSpec() }
}

data class RecruiterBookmarksScreenSpec(
    val title: String,
    val loadingMessage: String,
    val countLabel: String,
    val emptyIconName: String,
    val emptyTitle: String,
    val emptyMessage: String,
    val rows: List<CandidateResultRowSpec>,
) {
    val isEmpty: Boolean
        get() = rows.isEmpty()
}

data class RecruiterShortlistState(
    val candidates: List<RecruiterCandidate> = emptyList(),
    val selectedIds: Set<String> = emptySet(),
    val isLoading: Boolean = false,
    val isActing: Boolean = false,
    val errorMessage: String? = null,
) {
    val subtitle: String
        get() = "${candidates.size} candidates advanced for deeper comparison."

    val emptyTitle: String
        get() = "No shortlisted candidates"

    val emptyMessage: String
        get() = "Advance candidates from review screens to build a focused shortlist."

    val canCompare: Boolean
        get() = selectedIds.size >= 2

    val compareCandidateIds: List<String>
        get() = selectedIds.take(4)

    fun toggle(candidateId: String): RecruiterShortlistState {
        return if (selectedIds.contains(candidateId)) {
            copy(selectedIds = selectedIds - candidateId)
        } else if (selectedIds.size < 4) {
            copy(selectedIds = selectedIds + candidateId)
        } else {
            this
        }
    }

    fun remove(candidateId: String): RecruiterShortlistState {
        return copy(
            selectedIds = selectedIds - candidateId,
            candidates = candidates.filterNot { it.id == candidateId },
        )
    }
}

data class RecruiterEvidenceQueueState(
    val candidates: List<RecruiterCandidate> = emptyList(),
    val isLoading: Boolean = false,
    val isActing: Boolean = false,
    val actionMessage: String? = null,
    val errorMessage: String? = null,
) {
    val countLabel: String
        get() = "${candidates.size} left"

    val subtitle: String
        get() = "Strong matches awaiting review"

    val emptyTitle: String
        get() = "Evidence queue is clear"

    val emptyMessage: String
        get() = "Candidates that need a closer evidence review will appear here."

    val rows: List<EvidenceQueueRowSpec>
        get() = candidates.map { candidate ->
            EvidenceQueueRowSpec(
                candidateId = candidate.id,
                displayName = candidate.displayName,
                subtitle = candidate.displaySubtitle.ifBlank { "Profile details pending" },
                matchScoreLabel = "${candidate.matchScore}%",
                matchStrengthLabel = candidate.matchStrength.replace("_", " ").replaceFirstChar { it.uppercase() },
                profileStrengthLabel = "Profile ${candidate.profileStrength}%",
                evidenceTitles = candidate.matchEvidence.take(2).map { it.title },
                validationLabel = candidate.needsValidation.firstOrNull()?.let { "Needs validation: ${it.title}" },
            )
        }

    fun afterReviewUpdate(candidateId: String, status: RecruiterReviewStatus): RecruiterEvidenceQueueState {
        val candidateName = candidates.firstOrNull { it.id == candidateId }?.displayName ?: "Candidate"
        return copy(
            candidates = candidates.filterNot { it.id == candidateId },
            actionMessage = "$candidateName marked ${status.wireValue}.",
            isActing = false,
            errorMessage = null,
        )
    }
}

data class EvidenceQueueRowSpec(
    val candidateId: String,
    val displayName: String,
    val subtitle: String,
    val matchScoreLabel: String,
    val matchStrengthLabel: String,
    val profileStrengthLabel: String,
    val evidenceTitles: List<String>,
    val validationLabel: String?,
)

data class RecruiterComparisonState(
    val candidates: List<RecruiterCandidate> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
) {
    val emptyTitle: String
        get() = "No candidates selected"

    val emptyMessage: String
        get() = "Select two to four shortlisted candidates to compare them."

    val columns: List<ComparisonColumnSpec>
        get() = candidates.map { candidate ->
            ComparisonColumnSpec(
                candidateId = candidate.id,
                displayName = candidate.displayName,
                subtitle = candidate.displaySubtitle.ifBlank { "Profile pending" },
                metrics = listOf(
                    "Match" to "${candidate.matchScore}%",
                    "Strength" to "${candidate.profileStrength}%",
                    "GPA" to (candidate.gpa?.let { "%.2f".format(it) } ?: "Not set"),
                    "Projects" to "${candidate.projects.size}",
                    "Internships" to "${candidate.internships.size}",
                    "Resume" to if (candidate.hasResume) "Yes" else "No",
                ),
                topEvidence = candidate.matchEvidence.take(3).map { it.title },
            )
        }
}

data class ComparisonColumnSpec(
    val candidateId: String,
    val displayName: String,
    val subtitle: String,
    val metrics: List<Pair<String, String>>,
    val topEvidence: List<String>,
)

data class RecruiterSettingsState(
    val recruiter: RecruiterAccount? = null,
    val sessionEmail: String? = null,
    val isLoading: Boolean = false,
    val isWorking: Boolean = false,
    val errorMessage: String? = null,
) {
    val screenSpec: RecruiterSettingsScreenSpec
        get() = RecruiterSettingsScreenSpec(
            title = "Settings",
            loadingMessage = "Loading settings",
            subtitle = "Manage your recruiter account and company profile.",
            profile = RecruiterSettingsProfileSpec(
                displayName = displayName,
                email = displayEmail,
                avatarName = recruiter?.name ?: recruiter?.email ?: "Recruiter",
            ),
            infoRows = infoRows.map { RecruiterSettingsInfoRowSpec(label = it.first, value = it.second) },
            accountSectionTitle = "Account",
            logout = RecruiterSettingsActionSpec(
                title = logoutActionTitle,
                iconName = "rectangle.portrait.and.arrow.right",
                destructive = false,
                enabled = !isWorking,
            ),
            delete = RecruiterSettingsActionSpec(
                title = deleteActionTitle,
                iconName = "trash",
                destructive = true,
                enabled = !isWorking,
            ),
            workingMessage = if (isWorking) "Updating account..." else null,
            logoutConfirmation = RecruiterConfirmationSpec(
                title = "Log out?",
                message = "You will return to the login screen.",
                confirmTitle = "Log out",
            ),
            deleteConfirmation = RecruiterConfirmationSpec(
                title = "Delete recruiter account?",
                message = deleteConfirmationMessage,
                confirmTitle = "Delete account",
            ),
        )

    val displayName: String
        get() = recruiter?.name?.takeIf { it.isNotBlank() } ?: "Recruiter"

    val displayEmail: String
        get() = recruiter?.email ?: sessionEmail ?: "Email unavailable"

    val infoRows: List<Pair<String, String>>
        get() = listOf(
            "Company" to (recruiter?.companyName ?: "Not set"),
            "Plan" to (recruiter?.plan?.replaceFirstChar { it.uppercase() } ?: "Not set"),
            "Account ID" to (recruiter?.id ?: "Unavailable"),
        )

    val logoutActionTitle: String
        get() = "Log out"

    val deleteActionTitle: String
        get() = "Delete account"

    val deleteConfirmationMessage: String
        get() = "This permanently removes your recruiter account, saved filters, bookmarks, reviews, interest requests, and messages."
}

data class RecruiterSettingsScreenSpec(
    val title: String,
    val loadingMessage: String,
    val subtitle: String,
    val profile: RecruiterSettingsProfileSpec,
    val infoRows: List<RecruiterSettingsInfoRowSpec>,
    val accountSectionTitle: String,
    val logout: RecruiterSettingsActionSpec,
    val delete: RecruiterSettingsActionSpec,
    val workingMessage: String?,
    val logoutConfirmation: RecruiterConfirmationSpec,
    val deleteConfirmation: RecruiterConfirmationSpec,
)

data class RecruiterSettingsProfileSpec(
    val displayName: String,
    val email: String,
    val avatarName: String,
)

data class RecruiterSettingsInfoRowSpec(
    val label: String,
    val value: String,
)

data class RecruiterSettingsActionSpec(
    val title: String,
    val iconName: String,
    val destructive: Boolean,
    val enabled: Boolean,
)

data class RecruiterConfirmationSpec(
    val title: String,
    val message: String,
    val confirmTitle: String,
    val cancelTitle: String = "Cancel",
)
