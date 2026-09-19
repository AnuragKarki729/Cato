package com.cato.app.usecase

import com.cato.app.core.CatoAuthRepository
import com.cato.app.core.CatoAuthSession
import com.cato.app.core.CatoRole
import com.cato.app.core.CatoSupabaseUser
import com.cato.app.state.AuthPhase
import com.cato.app.state.AuthState
import kotlin.coroutines.Continuation
import kotlin.coroutines.EmptyCoroutineContext
import kotlin.coroutines.startCoroutine
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class AuthUseCasesTest {
    @Test
    fun bootstrapRefreshesExpiredSessionAndSyncsRole() = runSuspend {
        val store = FakeAuthSessionRepository(
            CatoAuthSession("old", "refresh", expiresAtEpochSeconds = 100, user = CatoSupabaseUser("u", "u@example.com"))
        )
        val supabase = FakeSupabaseSessionRepository(
            CatoAuthSession("new", "refresh2", expiresAtEpochSeconds = 1_000, user = CatoSupabaseUser("u", "u@example.com"))
        )
        val cato = FakeCatoAuthRepository(role = CatoRole.RECRUITER)

        val state = BootstrapAuthUseCase(store, supabase, cato, nowEpochSeconds = { 200 })()

        assertTrue(state.phase is AuthPhase.SignedIn)
        assertEquals("new", (state.phase as AuthPhase.SignedIn).session.accessToken)
        assertEquals(1, supabase.refreshCount)
        assertEquals(listOf(CatoRole.RECRUITER), cato.syncedRoles)
    }

    @Test
    fun bootstrapClearsPersistedSessionWhenBackendRoleIsMissing() = runSuspend {
        val store = FakeAuthSessionRepository(
            CatoAuthSession("access", "refresh", expiresAtEpochSeconds = 1_000, user = CatoSupabaseUser("u", "u@example.com"))
        )
        val supabase = FakeSupabaseSessionRepository(
            CatoAuthSession("new", "refresh2", expiresAtEpochSeconds = 2_000, user = CatoSupabaseUser("u", "u@example.com"))
        )
        val cato = FakeCatoAuthRepository(role = null)

        val state = BootstrapAuthUseCase(store, supabase, cato, nowEpochSeconds = { 200 })()

        assertTrue(store.cleared)
        assertTrue(state.phase is AuthPhase.SignedOut)
        assertEquals(emptyList(), cato.syncedRoles)
    }

    @Test
    fun completeSignInClaimsFallbackRoleWhenMissing() = runSuspend {
        val store = FakeAuthSessionRepository(null)
        val cato = FakeCatoAuthRepository(role = null)
        val session = CatoAuthSession("access", "refresh", 1_000, CatoSupabaseUser("u", "u@example.com"))

        val state = CompleteSignInUseCase(store, cato)(session, CatoRole.APPLICANT)

        assertTrue(state.phase is AuthPhase.SignedIn)
        assertEquals(CatoRole.APPLICANT, (state.phase as AuthPhase.SignedIn).role)
        assertEquals(CatoRole.APPLICANT, cato.claimedRole)
        assertEquals("access", store.saved?.accessToken)
    }

    @Test
    fun signOutClearsSessionAndReturnsSignedOut() = runSuspend {
        val store = FakeAuthSessionRepository(
            CatoAuthSession("access", "refresh", 1_000, CatoSupabaseUser("u"))
        )

        val state = SignOutUseCase(store)(AuthState())

        assertTrue(store.cleared)
        assertTrue(state.phase is AuthPhase.SignedOut)
    }

    @Test
    fun deleteRecruiterClearsSessionAndCallsRepository() = runSuspend {
        val store = FakeAuthSessionRepository(null)
        val cato = FakeCatoAuthRepository(role = CatoRole.RECRUITER)

        val state = DeleteAccountUseCase(store, cato).deleteRecruiter("access", AuthState())

        assertTrue(store.cleared)
        assertEquals("access", cato.deletedRecruiterToken)
        assertTrue(state.phase is AuthPhase.SignedOut)
    }

    @Test
    fun deleteApplicantClearsSessionAndCallsRepository() = runSuspend {
        val store = FakeAuthSessionRepository(null)
        val cato = FakeCatoAuthRepository(role = CatoRole.APPLICANT)

        val state = DeleteAccountUseCase(store, cato).deleteApplicant("access", AuthState())

        assertTrue(store.cleared)
        assertEquals("access", cato.deletedApplicantToken)
        assertTrue(state.phase is AuthPhase.SignedOut)
    }

    @Test
    fun inMemorySessionRepositorySupportsLocalPreviewStorage() = runSuspend {
        val repository = InMemoryAuthSessionRepository()
        val session = CatoAuthSession("access", "refresh", 1_000, CatoSupabaseUser("u"))

        repository.save(session)

        assertEquals(session, repository.load())
        repository.clear()
        assertEquals(null, repository.load())
    }
}

private class FakeAuthSessionRepository(
    private var current: CatoAuthSession?,
) : AuthSessionRepository {
    var saved: CatoAuthSession? = null
    var cleared = false

    override suspend fun load(): CatoAuthSession? = current

    override suspend fun save(session: CatoAuthSession) {
        saved = session
        current = session
    }

    override suspend fun clear() {
        cleared = true
        current = null
    }
}

private class FakeSupabaseSessionRepository(
    private val refreshed: CatoAuthSession,
) : SupabaseSessionRepository {
    var refreshCount = 0

    override suspend fun refresh(refreshToken: String): CatoAuthSession {
        refreshCount += 1
        return refreshed
    }
}

private class FakeCatoAuthRepository(
    private var role: CatoRole?,
) : CatoAuthRepository {
    var claimedRole: CatoRole? = null
    var deletedApplicantToken: String? = null
    var deletedRecruiterToken: String? = null
    val syncedRoles = mutableListOf<CatoRole>()

    override suspend fun getRole(accessToken: String): CatoRole? = role

    override suspend fun claimRole(accessToken: String, role: CatoRole): CatoRole {
        claimedRole = role
        this.role = role
        return role
    }

    override suspend fun syncRole(accessToken: String, role: CatoRole) {
        syncedRoles.add(role)
    }

    override suspend fun deleteApplicantAccount(accessToken: String) {
        deletedApplicantToken = accessToken
    }

    override suspend fun deleteRecruiterAccount(accessToken: String) {
        deletedRecruiterToken = accessToken
    }
}

private fun runSuspend(block: suspend () -> Unit) {
    var failure: Throwable? = null
    block.startCoroutine(
        object : Continuation<Unit> {
            override val context = EmptyCoroutineContext
            override fun resumeWith(resumeResult: kotlin.Result<Unit>) {
                failure = resumeResult.exceptionOrNull()
            }
        }
    )
    failure?.let { throw it }
}
