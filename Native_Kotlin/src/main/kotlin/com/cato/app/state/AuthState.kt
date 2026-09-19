package com.cato.app.state

import com.cato.app.core.CatoRole

data class AuthSession(
    val accessToken: String,
    val refreshToken: String? = null,
    val userId: String,
    val email: String? = null,
)

sealed interface AuthPhase {
    data object Loading : AuthPhase
    data object SignedOut : AuthPhase
    data class SignedIn(val role: CatoRole, val session: AuthSession) : AuthPhase
}

data class AuthState(
    val phase: AuthPhase = AuthPhase.Loading,
    val isWorking: Boolean = false,
    val errorMessage: String? = null,
) {
    val rootRoute: CatoRootRoute
        get() = when (val current = phase) {
            AuthPhase.Loading -> CatoRootRoute.Loading
            AuthPhase.SignedOut -> CatoRootRoute.SignedOut
            is AuthPhase.SignedIn -> CatoRootRoute.SignedIn(current.role)
        }
}

data class LoginFormState(
    val email: String = "",
    val password: String = "",
    val selectedRole: CatoRole = CatoRole.RECRUITER,
    val isWorking: Boolean = false,
    val errorMessage: String? = null,
) {
    val trimmedEmail: String
        get() = email.trim()

    val canSubmitPassword: Boolean
        get() = !isWorking && trimmedEmail.isNotEmpty() && password.isNotEmpty()

    val canSubmitOAuth: Boolean
        get() = !isWorking

    val selectedRoleIndex: Int
        get() = if (selectedRole == CatoRole.RECRUITER) 0 else 1

    val roleOptions: List<LoginRoleOption>
        get() = listOf(
            LoginRoleOption(CatoRole.RECRUITER, "Recruiter", selectedRole == CatoRole.RECRUITER),
            LoginRoleOption(CatoRole.APPLICANT, "Applicant", selectedRole == CatoRole.APPLICANT),
        )

    fun selectRole(role: CatoRole): LoginFormState {
        return copy(selectedRole = role)
    }
}

data class LoginRoleOption(
    val role: CatoRole,
    val label: String,
    val selected: Boolean,
)

sealed interface AuthEvent {
    data object StartWork : AuthEvent
    data object SignOut : AuthEvent
    data class Fail(val message: String) : AuthEvent
    data class SessionResolved(val role: CatoRole, val session: AuthSession) : AuthEvent
    data object NoSession : AuthEvent
}

fun AuthState.reduce(event: AuthEvent): AuthState {
    return when (event) {
        AuthEvent.StartWork -> copy(isWorking = true, errorMessage = null)
        AuthEvent.SignOut -> copy(phase = AuthPhase.SignedOut, isWorking = false, errorMessage = null)
        is AuthEvent.Fail -> copy(isWorking = false, errorMessage = event.message)
        is AuthEvent.SessionResolved -> copy(phase = AuthPhase.SignedIn(event.role, event.session), isWorking = false, errorMessage = null)
        AuthEvent.NoSession -> copy(phase = AuthPhase.SignedOut, isWorking = false, errorMessage = null)
    }
}
