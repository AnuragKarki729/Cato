package com.cato.app.usecase

import com.cato.app.core.CatoAuthRepository
import com.cato.app.core.CatoAuthSession
import com.cato.app.core.CatoRole
import com.cato.app.state.AuthEvent
import com.cato.app.state.AuthSession
import com.cato.app.state.AuthState
import com.cato.app.state.reduce

interface AuthSessionRepository {
    suspend fun load(): CatoAuthSession?
    suspend fun save(session: CatoAuthSession)
    suspend fun clear()
}

interface SupabaseSessionRepository {
    suspend fun refresh(refreshToken: String): CatoAuthSession
}

class BootstrapAuthUseCase(
    private val sessionRepository: AuthSessionRepository,
    private val supabaseRepository: SupabaseSessionRepository,
    private val catoAuthRepository: CatoAuthRepository,
    private val nowEpochSeconds: () -> Long,
) {
    suspend operator fun invoke(initialState: AuthState = AuthState()): AuthState {
        var state = initialState.reduce(AuthEvent.StartWork)

        try {
            var persisted = sessionRepository.load()
            if (persisted == null) {
                return state.reduce(AuthEvent.NoSession)
            }

            if (persisted.isExpired(nowEpochSeconds())) {
                persisted = supabaseRepository.refresh(persisted.refreshToken)
                sessionRepository.save(persisted)
            }

            val accessToken = persisted.accessToken
            val role = catoAuthRepository.getRole(accessToken)
            if (role == null) {
                sessionRepository.clear()
                return state.reduce(AuthEvent.NoSession)
            }
            catoAuthRepository.syncRole(accessToken, role)

            state = state.reduce(AuthEvent.SessionResolved(role, persisted.toUiSession()))
        } catch (error: Throwable) {
            sessionRepository.clear()
            state = state.reduce(AuthEvent.Fail(error.message ?: "Authentication failed."))
                .copy(phase = com.cato.app.state.AuthPhase.SignedOut)
        }

        return state
    }
}

class CompleteSignInUseCase(
    private val sessionRepository: AuthSessionRepository,
    private val catoAuthRepository: CatoAuthRepository,
) {
    suspend operator fun invoke(
        session: CatoAuthSession,
        selectedRole: CatoRole,
        initialState: AuthState = AuthState(),
    ): AuthState {
        sessionRepository.save(session)
        var role = catoAuthRepository.getRole(session.accessToken)
        if (role == null) {
            role = catoAuthRepository.claimRole(session.accessToken, selectedRole)
        }
        catoAuthRepository.syncRole(session.accessToken, role)
        return initialState.reduce(AuthEvent.SessionResolved(role, session.toUiSession()))
    }
}

class SignOutUseCase(
    private val sessionRepository: AuthSessionRepository,
) {
    suspend operator fun invoke(initialState: AuthState): AuthState {
        sessionRepository.clear()
        return initialState.reduce(AuthEvent.SignOut)
    }
}

class DeleteAccountUseCase(
    private val sessionRepository: AuthSessionRepository,
    private val catoAuthRepository: CatoAuthRepository,
) {
    suspend fun deleteApplicant(accessToken: String, initialState: AuthState): AuthState {
        catoAuthRepository.deleteApplicantAccount(accessToken)
        sessionRepository.clear()
        return initialState.reduce(AuthEvent.SignOut)
    }

    suspend fun deleteRecruiter(accessToken: String, initialState: AuthState): AuthState {
        catoAuthRepository.deleteRecruiterAccount(accessToken)
        sessionRepository.clear()
        return initialState.reduce(AuthEvent.SignOut)
    }
}

private fun CatoAuthSession.toUiSession(): AuthSession {
    return AuthSession(
        accessToken = accessToken,
        refreshToken = refreshToken,
        userId = user.id,
        email = user.email,
    )
}
