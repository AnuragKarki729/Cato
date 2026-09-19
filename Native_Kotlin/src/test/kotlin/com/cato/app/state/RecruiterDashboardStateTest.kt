package com.cato.app.state

import com.cato.app.core.RecruiterCandidateSearchFilters
import com.cato.app.core.RecruiterAccount
import com.cato.app.core.RecruiterDashboardMetrics
import com.cato.app.core.RecruiterDashboardResponse
import com.cato.app.core.RecruiterInterestRequest
import com.cato.app.core.RecruiterInterestRequestStatus
import com.cato.app.core.RecruiterMessage
import com.cato.app.core.RecruiterSavedFilter
import com.cato.app.ui.CatoButtonKind
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class RecruiterDashboardStateTest {
    @Test
    fun exposesSwiftAlignedDashboardScreenSpec() {
        val state = RecruiterDashboardState(
            dashboard = RecruiterDashboardResponse(
                recruiter = RecruiterAccount(
                    id = "recruiter-1",
                    email = "recruiter@acme.com",
                    name = "Alex",
                    companyName = "Acme Corp",
                ),
                metrics = RecruiterDashboardMetrics(
                    candidates = 128,
                    bookmarks = 36,
                    messages = 12,
                ),
            ),
            quickSearches = listOf(
                RecruiterSavedFilter(
                    id = "filter-1",
                    name = "Backend interns",
                    criteria = RecruiterCandidateSearchFilters(categoryFieldIds = listOf("technology")),
                )
            ),
        )

        val spec = state.screenSpec

        assertEquals("Loading dashboard", spec.loadingMessage)
        assertEquals("Cato", spec.header?.appName)
        assertEquals("Good morning, Alex", spec.header?.greeting)
        assertEquals("Acme Corp", spec.header?.identity)
        assertEquals("SEARCH", spec.searchHero.eyebrow)
        assertEquals("Dynamic Search", spec.searchHero.title)
        assertEquals(RecruiterRoute.Search, spec.searchHero.route)
        assertTrue(spec.searchHero.body.contains("deterministic match ranking"))
        assertEquals(listOf("Matches", "Bookmarked", "Messages"), spec.metrics.map { it.label })
        assertEquals(listOf("128", "36", "12"), spec.metrics.map { it.value })
        assertFalse(spec.quickSearch.isEmpty)
        assertEquals("Quick Search", spec.quickSearch.title)
        assertEquals("Saved filters", spec.quickSearch.subtitle)
        assertEquals("Interest Requests", spec.interestRequests.title)
        assertEquals("0 sent", spec.interestRequests.subtitle)
        assertTrue(spec.interestRequests.isEmpty)
        assertNull(spec.interestRequests.trailingButton)
    }

    @Test
    fun dashboardSpecFallsBackToRecruiterAndEmailAndShowsViewAllRequestActionOnlyAfterTen() {
        val requests = (1..11).map { index ->
            RecruiterInterestRequest(
                id = "request-$index",
                candidateId = "candidate-$index",
                candidateName = "Candidate $index",
                reason = "Strong profile",
                status = RecruiterInterestRequestStatus.SENT,
                sentAt = "2026-01-${index.toString().padStart(2, '0')}",
            )
        }
        val state = RecruiterDashboardState(
            dashboard = RecruiterDashboardResponse(
                recruiter = RecruiterAccount(id = "recruiter-1", email = "recruiter@acme.com"),
                metrics = RecruiterDashboardMetrics(),
            ),
            requests = requests,
        )

        val spec = state.screenSpec

        assertEquals("Good morning, Recruiter", spec.header?.greeting)
        assertEquals("recruiter@acme.com", spec.header?.identity)
        assertEquals(4, spec.interestRequests.actions.size)
        assertEquals("11 sent", spec.interestRequests.subtitle)
        assertEquals("View all requests", spec.interestRequests.trailingButton?.label)
        assertEquals(CatoButtonKind.SECONDARY, spec.interestRequests.trailingButton?.kind)
    }

    @Test
    fun exposesDashboardCardRoutesForQuickSearchesRequestsAndShortcuts() {
        val state = RecruiterDashboardState(
            quickSearches = listOf(
                RecruiterSavedFilter(
                    id = "filter-1",
                    name = "Tech interns",
                    criteria = RecruiterCandidateSearchFilters(
                        q = "backend",
                        categoryFieldIds = listOf("technology"),
                        universities = listOf("Stanford"),
                    ),
                )
            ),
            requests = listOf(
                RecruiterInterestRequest(
                    id = "request-1",
                    candidateId = "candidate-1",
                    candidateName = "Zoe Chen",
                    reason = "Strong profile",
                    status = RecruiterInterestRequestStatus.SENT,
                    sentAt = "2026-01-01",
                )
            )
        )

        assertEquals(RecruiterRoute.QuickSearchResults("filter-1", "Tech interns"), state.quickSearchActions.single().route)
        assertEquals("backend • technology • Stanford", state.quickSearchActions.single().subtitle)
        assertEquals(RecruiterRoute.CandidateReview("candidate-1"), state.interestRequestActions.single().route)
        assertTrue(state.shortcutActions.any { it.route == RecruiterRoute.EvidenceQueue })
        assertTrue(state.shortcutActions.any { it.route == RecruiterRoute.Shortlist })
    }

    @Test
    fun allInterestRequestsListSortsNewestFirstAndRoutesToReview() {
        val state = RecruiterInterestRequestsListState(
            requests = listOf(
                RecruiterInterestRequest(
                    id = "old",
                    candidateId = "candidate-old",
                    candidateName = "Old Candidate",
                    reason = "Profile",
                    status = RecruiterInterestRequestStatus.SENT,
                    sentAt = "2026-01-01T10:00:00Z",
                ),
                RecruiterInterestRequest(
                    id = "new",
                    candidateId = "candidate-new",
                    candidateName = "New Candidate",
                    reason = "Video",
                    status = RecruiterInterestRequestStatus.ACCEPTED,
                    sentAt = "2026-01-02T10:00:00Z",
                ),
            )
        )

        assertEquals("2 sent", state.countLabel)
        assertEquals("New Candidate", state.rows.first().title)
        assertEquals("Accepted • 2026-01-02T10:00:00Z", state.rows.first().subtitle)
        assertEquals(RecruiterRoute.CandidateReview("candidate-new"), state.rows.first().route)
    }

    @Test
    fun groupsMessagesByCandidateWithLatestFirst() {
        val messages = listOf(
            RecruiterMessage(id = "1", candidateId = "a", candidateName = "Alex", senderRole = "applicant", isUnreadForViewer = true, body = "old", createdAt = "2026-01-01T10:00:00Z"),
            RecruiterMessage(id = "2", candidateId = "b", candidateName = "Blair", senderRole = "applicant", isUnreadForViewer = false, body = "newest", createdAt = "2026-01-03T10:00:00Z"),
            RecruiterMessage(id = "3", candidateId = "a", candidateName = "Alex", senderRole = "recruiter", isUnreadForViewer = false, body = "latest a", createdAt = "2026-01-02T10:00:00Z"),
        )

        val threads = groupRecruiterMessages(messages)

        assertEquals("b", threads[0].candidateId)
        assertEquals("a", threads[1].candidateId)
        assertEquals("latest a", threads[1].latestMessage.body)
        assertEquals("1", threads[1].unreadBadge)
        assertEquals(1, countUnreadRecruiterMessages(messages))
    }
}
