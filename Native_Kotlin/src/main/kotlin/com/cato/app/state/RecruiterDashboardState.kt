package com.cato.app.state

import com.cato.app.core.RecruiterDashboardResponse
import com.cato.app.core.RecruiterInterestRequest
import com.cato.app.core.RecruiterMessage
import com.cato.app.core.RecruiterCandidateSearchFilters
import com.cato.app.core.RecruiterSavedFilter
import com.cato.app.ui.CatoButtonKind
import com.cato.app.ui.CatoButtonSpec

data class RecruiterDashboardState(
    val dashboard: RecruiterDashboardResponse? = null,
    val requests: List<RecruiterInterestRequest> = emptyList(),
    val quickSearches: List<RecruiterSavedFilter> = emptyList(),
) {
    val visibleInterestRequests: List<RecruiterInterestRequest>
        get() = requests.take(4)

    val shouldShowViewAllRequests: Boolean
        get() = requests.size > 10

    val screenSpec: RecruiterDashboardScreenSpec
        get() {
            val dashboardValue = dashboard
            return RecruiterDashboardScreenSpec(
                loadingMessage = "Loading dashboard",
                header = dashboardValue?.let { response ->
                    RecruiterDashboardHeaderSpec(
                        appName = "Cato",
                        greeting = "Good morning, ${response.recruiter.name ?: "Recruiter"}",
                        identity = response.recruiter.companyName ?: response.recruiter.email,
                    )
                },
                searchHero = RecruiterDashboardSearchHeroSpec(),
                metrics = dashboardValue?.metrics?.let { metrics ->
                    listOf(
                        RecruiterDashboardMetricSpec(value = metrics.candidates.toString(), label = "Matches"),
                        RecruiterDashboardMetricSpec(value = metrics.bookmarks.toString(), label = "Bookmarked"),
                        RecruiterDashboardMetricSpec(value = metrics.messages.toString(), label = "Messages"),
                    )
                }.orEmpty(),
                shortcuts = shortcutActions,
                quickSearch = RecruiterDashboardSectionSpec(
                    title = "Quick Search",
                    subtitle = "Saved filters",
                    empty = RecruiterDashboardEmptySpec(
                        iconName = "slider.horizontal.3",
                        text = "Saved searches will appear here after you create reusable candidate filters.",
                    ),
                    actions = quickSearchActions,
                ),
                interestRequests = RecruiterDashboardSectionSpec(
                    title = "Interest Requests",
                    subtitle = "${requests.size} sent",
                    empty = RecruiterDashboardEmptySpec(
                        iconName = "paperplane",
                        text = "Sent requests will appear here after you contact candidates.",
                    ),
                    actions = interestRequestActions,
                    trailingButton = if (shouldShowViewAllRequests) {
                        CatoButtonSpec(
                            label = "View all requests",
                            kind = CatoButtonKind.SECONDARY,
                        )
                    } else {
                        null
                    },
                ),
            )
        }

    val visibleQuickSearches: List<RecruiterSavedFilter>
        get() = quickSearches.take(10)

    val quickSearchActions: List<RecruiterDashboardActionSpec>
        get() = visibleQuickSearches.map { search ->
            RecruiterDashboardActionSpec(
                title = search.name,
                subtitle = search.criteria.summaryLabel,
                route = RecruiterRoute.QuickSearchResults(filterId = search.id, title = search.name),
            )
        }

    val interestRequestActions: List<RecruiterDashboardActionSpec>
        get() = visibleInterestRequests.map { request ->
            RecruiterDashboardActionSpec(
                title = request.candidateName ?: "Candidate",
                subtitle = request.status.wireValue.replaceFirstChar { it.uppercase() },
                route = RecruiterRoute.CandidateReview(request.candidateId),
            )
        }

    val shortcutActions: List<RecruiterDashboardActionSpec>
        get() = listOf(
            RecruiterDashboardActionSpec("Evidence Queue", "Review strongest signals", RecruiterRoute.EvidenceQueue, iconName = "checkmark.seal"),
            RecruiterDashboardActionSpec("Shortlist", "Compare finalists", RecruiterRoute.Shortlist, iconName = "person.3"),
        )
}

data class RecruiterDashboardActionSpec(
    val title: String,
    val subtitle: String,
    val route: RecruiterRoute,
    val iconName: String? = null,
)

data class RecruiterDashboardScreenSpec(
    val loadingMessage: String,
    val header: RecruiterDashboardHeaderSpec?,
    val searchHero: RecruiterDashboardSearchHeroSpec,
    val metrics: List<RecruiterDashboardMetricSpec>,
    val shortcuts: List<RecruiterDashboardActionSpec>,
    val quickSearch: RecruiterDashboardSectionSpec,
    val interestRequests: RecruiterDashboardSectionSpec,
)

data class RecruiterDashboardHeaderSpec(
    val appName: String,
    val greeting: String,
    val identity: String,
    val notificationIconName: String = "bell",
    val showsNotificationDot: Boolean = true,
)

data class RecruiterDashboardSearchHeroSpec(
    val eyebrow: String = "SEARCH",
    val title: String = "Dynamic Search",
    val body: String = "Build a role-specific candidate pool from filters, skills, field depth, and deterministic match ranking.",
    val route: RecruiterRoute = RecruiterRoute.DynamicSearch,
    val iconName: String = "arrow.right",
)

data class RecruiterDashboardMetricSpec(
    val value: String,
    val label: String,
)

data class RecruiterDashboardSectionSpec(
    val title: String,
    val subtitle: String,
    val empty: RecruiterDashboardEmptySpec,
    val actions: List<RecruiterDashboardActionSpec>,
    val trailingButton: CatoButtonSpec? = null,
) {
    val isEmpty: Boolean
        get() = actions.isEmpty()
}

data class RecruiterDashboardEmptySpec(
    val iconName: String,
    val text: String,
)

data class RecruiterInterestRequestsListState(
    val requests: List<RecruiterInterestRequest> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
) {
    val title: String
        get() = "Interest Requests"

    val countLabel: String
        get() = "${requests.size} sent"

    val emptyTitle: String
        get() = "No interest requests yet"

    val emptyMessage: String
        get() = "Requests you send to candidates will appear here."

    val rows: List<RecruiterDashboardActionSpec>
        get() = requests.sortedByDescending { it.sentAt }.map { request ->
            RecruiterDashboardActionSpec(
                title = request.candidateName ?: "Candidate",
                subtitle = listOfNotNull(
                    request.status.wireValue.replaceFirstChar { it.uppercase() },
                    request.sentAt.takeIf { it.isNotBlank() },
                ).joinToString(" • "),
                route = RecruiterRoute.CandidateReview(request.candidateId),
            )
        }
}

private val RecruiterCandidateSearchFilters.summaryLabel: String
    get() {
        val parts = buildList {
            q?.takeIf { it.isNotBlank() }?.let { add(it) }
            addAll(categoryFieldIds.take(2))
            universities.firstOrNull()?.let { add(it) }
            majors.firstOrNull()?.let { add(it) }
            gpaMin?.let { add("GPA ${it}+") }
        }
        return parts.joinToString(" • ").ifBlank { "Reusable candidate filter" }
    }

data class RecruiterMessageThread(
    val candidateId: String,
    val candidateName: String,
    val latestMessage: RecruiterMessage,
    val unreadCount: Int,
) {
    val unreadBadge: String?
        get() = when {
            unreadCount <= 0 -> null
            unreadCount > 9 -> "9+"
            else -> unreadCount.toString()
        }
}

fun groupRecruiterMessages(messages: List<RecruiterMessage>): List<RecruiterMessageThread> {
    return messages
        .groupBy { it.candidateId }
        .map { (candidateId, threadMessages) ->
            val sorted = threadMessages.sortedByDescending { it.createdAt }
            val latest = sorted.first()
            RecruiterMessageThread(
                candidateId = candidateId,
                candidateName = latest.candidateName ?: "Candidate",
                latestMessage = latest,
                unreadCount = sorted.count { it.isUnreadForViewer == true },
            )
        }
        .sortedByDescending { it.latestMessage.createdAt }
}

fun countUnreadRecruiterMessages(messages: List<RecruiterMessage>): Int {
    return messages.count { it.isUnreadForViewer == true }
}
