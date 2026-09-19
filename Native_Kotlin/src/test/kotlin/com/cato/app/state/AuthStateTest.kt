package com.cato.app.state

import com.cato.app.core.CatoRole
import com.cato.app.state.CatoRootRoute
import com.cato.app.ui.RootScreenDestination
import com.cato.app.ui.toRootScreenSpec
import com.cato.app.ui.toScreenSpec
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class AuthStateTest {
    @Test
    fun loginFormDefaultsToRecruiterAndTrimsEmail() {
        val state = LoginFormState(
            email = "  recruiter@example.com ",
            password = "secret",
        )

        assertEquals(CatoRole.RECRUITER, state.selectedRole)
        assertEquals(0, state.selectedRoleIndex)
        assertEquals("recruiter@example.com", state.trimmedEmail)
        assertTrue(state.canSubmitPassword)
        assertTrue(state.canSubmitOAuth)
        assertTrue(state.roleOptions.first { it.role == CatoRole.RECRUITER }.selected)
    }

    @Test
    fun loginFormRoleSelectionAndWorkingStateMirrorNativeLogin() {
        val applicant = LoginFormState(email = "a@example.com", password = "secret")
            .selectRole(CatoRole.APPLICANT)
        val working = applicant.copy(isWorking = true)

        assertEquals(CatoRole.APPLICANT, applicant.selectedRole)
        assertEquals(1, applicant.selectedRoleIndex)
        assertFalse(working.canSubmitPassword)
        assertFalse(working.canSubmitOAuth)
    }

    @Test
    fun loginScreenSpecMirrorsNativeSwiftLoginCopyAndButtons() {
        val spec = LoginFormState(
            email = "recruiter@example.com",
            password = "secret",
            errorMessage = "Invalid credentials",
        ).toScreenSpec()

        assertEquals("Cato", spec.title)
        assertEquals("From search to strong shortlists.", spec.subtitle)
        assertEquals("Better hires, brighter futures.", spec.footer)
        assertEquals(listOf("Recruiter", "Applicant"), spec.roleOptions.map { it.label })
        assertTrue(spec.roleOptions.first().selected)
        assertEquals("Email", spec.emailPlaceholder)
        assertEquals("Password", spec.passwordPlaceholder)
        assertTrue(spec.passwordButton.enabled)
        assertEquals("Login", spec.passwordButton.label)
        assertTrue(spec.appleButton.enabled)
        assertEquals("Continue with Google", spec.googleButton.label)
        assertEquals("g.circle.fill", spec.googleButton.iconName)
        assertEquals("Invalid credentials", spec.errorMessage)
    }

    @Test
    fun loginScreenSpecDisablesAuthButtonsWhileWorking() {
        val spec = LoginFormState(
            email = "recruiter@example.com",
            password = "secret",
            isWorking = true,
        ).toScreenSpec()

        assertFalse(spec.passwordButton.enabled)
        assertFalse(spec.appleButton.enabled)
        assertFalse(spec.googleButton.enabled)
    }

    @Test
    fun rootScreenSpecMirrorsSwiftRootRouting() {
        val loading = CatoRootRoute.Loading.toRootScreenSpec()
        val signedOut = CatoRootRoute.SignedOut.toRootScreenSpec()
        val applicant = CatoRootRoute.SignedIn(CatoRole.APPLICANT).toRootScreenSpec()
        val recruiter = CatoRootRoute.SignedIn(CatoRole.RECRUITER).toRootScreenSpec()

        assertEquals(RootScreenDestination.LOADING, loading.destination)
        assertEquals("Connecting to Cato", loading.loadingMessage)
        assertEquals(RootScreenDestination.LOGIN, signedOut.destination)
        assertEquals(RootScreenDestination.APPLICANT_ONBOARDING, applicant.destination)
        assertEquals(RootScreenDestination.RECRUITER_SHELL, recruiter.destination)
    }
}
