package com.cato.app.usecase

import com.cato.app.core.ApplicantReelVideo
import com.cato.app.core.RecruiterAccount
import com.cato.app.core.RecruiterCandidate
import com.cato.app.core.RecruiterCandidateProfileMediaResponse
import com.cato.app.core.RecruiterCandidateSearchFilters
import com.cato.app.core.RecruiterDashboardMetrics
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
import kotlin.coroutines.Continuation
import kotlin.coroutines.EmptyCoroutineContext
import kotlin.coroutines.startCoroutine
import kotlin.test.Test
import kotlin.test.assertEquals

class RecruiterSecondaryUseCasesTest {
    @Test
    fun loadsBookmarksWithBookmarkedOnlyFilter() = runSuspend {
        val repository = SecondaryFakeRecruiterRepository(
            candidatesResult = listOf(RecruiterCandidate(id = "c1", applicantId = "a1", name = "Zoe")),
        )

        val state = LoadRecruiterBookmarksUseCase(repository)("token")

        assertEquals(true, repository.lastCandidateFilters?.bookmarkedOnly)
        assertEquals("Zoe", state.bookmarked.single().displayName)
        assertEquals(false, state.isLoading)
    }

    @Test
    fun loadsShortlistWithShortlistedReviewFilter() = runSuspend {
        val repository = SecondaryFakeRecruiterRepository(
            candidatesResult = listOf(RecruiterCandidate(id = "c1", applicantId = "a1", name = "Zoe")),
        )

        val state = LoadRecruiterShortlistUseCase(repository)("token")

        assertEquals(RecruiterReviewStatus.SHORTLISTED, repository.lastCandidateFilters?.reviewStatus)
        assertEquals("Zoe", state.candidates.single().displayName)
        assertEquals(false, state.isLoading)
    }

    @Test
    fun loadsRecruiterSettingsFromDashboardRecruiterAccount() = runSuspend {
        val repository = SecondaryFakeRecruiterRepository(
            dashboardResult = RecruiterDashboardResponse(
                recruiter = RecruiterAccount(
                    id = "rec1",
                    email = "recruiter@example.com",
                    name = "Alex",
                    companyName = "Acme",
                ),
                metrics = RecruiterDashboardMetrics(),
            ),
        )

        val state = LoadRecruiterSettingsUseCase(repository)("token", sessionEmail = "session@example.com")

        assertEquals("Alex", state.displayName)
        assertEquals("recruiter@example.com", state.displayEmail)
        assertEquals("Acme", state.infoRows.first { it.first == "Company" }.second)
        assertEquals(false, state.isLoading)
    }
}

private class SecondaryFakeRecruiterRepository(
    private val dashboardResult: RecruiterDashboardResponse = RecruiterDashboardResponse(
        recruiter = RecruiterAccount(id = "rec1", email = "recruiter@example.com"),
        metrics = RecruiterDashboardMetrics(),
    ),
    private val candidatesResult: List<RecruiterCandidate> = emptyList(),
) : RecruiterRepository {
    var lastCandidateFilters: RecruiterCandidateSearchFilters? = null

    override suspend fun dashboard(accessToken: String): RecruiterDashboardResponse = dashboardResult
    override suspend fun candidates(accessToken: String, filters: RecruiterCandidateSearchFilters): List<RecruiterCandidate> {
        lastCandidateFilters = filters
        return candidatesResult
    }

    override suspend fun savedFilters(accessToken: String): List<RecruiterSavedFilter> = error("not used")
    override suspend fun interestRequests(accessToken: String): List<RecruiterInterestRequest> = error("not used")
    override suspend fun evidenceQueue(accessToken: String, filters: RecruiterCandidateSearchFilters): List<RecruiterCandidate> = error("not used")
    override suspend fun candidate(accessToken: String, candidateId: String): RecruiterCandidate = error("not used")
    override suspend fun candidateProfileMedia(accessToken: String, candidateId: String): RecruiterCandidateProfileMediaResponse = error("not used")
    override suspend fun bookmarkCandidate(accessToken: String, candidateId: String) = error("not used")
    override suspend fun updateCandidateReview(accessToken: String, candidateId: String, status: RecruiterReviewStatus) = error("not used")
    override suspend fun sendInterest(accessToken: String, request: RecruiterInterestCommand) = error("not used")
    override suspend fun contactCandidate(accessToken: String, candidateId: String, body: String) = error("not used")
    override suspend fun messages(accessToken: String): List<RecruiterMessage> = error("not used")
    override suspend fun candidateMessages(accessToken: String, candidateId: String): List<RecruiterMessage> = error("not used")
    override suspend fun runtimeSearch(accessToken: String, spec: RuntimeSearchSpec): List<RuntimeMatchResult> = error("not used")
    override suspend fun auditRuntimeSearch(accessToken: String, spec: RuntimeSearchSpec, applicantId: String): RuntimeSearchAuditResponse = error("not used")
    override suspend fun saveRecruiterSearch(accessToken: String, name: String, spec: RuntimeSearchSpec): RecruiterJob = error("not used")
    override suspend fun updateRecruiterSearch(accessToken: String, jobId: String, name: String, spec: RuntimeSearchSpec): RecruiterJob = error("not used")
    override suspend fun videoFeed(accessToken: String, limit: Int, offset: Int): List<ApplicantReelVideo> = error("not used")
    override suspend fun markVideoViewed(accessToken: String, videoId: String) = error("not used")
    override suspend fun setVideoLiked(accessToken: String, videoId: String, liked: Boolean) = error("not used")
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
