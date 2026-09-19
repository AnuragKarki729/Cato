package com.cato.app.ui

import com.cato.app.core.RecruiterReviewStatus
import com.cato.app.core.CatoRole
import com.cato.app.state.CandidateReviewChromeState
import com.cato.app.state.ApplicantTab
import com.cato.app.state.CatoRootRoute
import com.cato.app.state.LoginFormState
import com.cato.app.state.RecruiterTab
import com.cato.app.state.ShellChromeState

enum class RootScreenDestination {
    LOADING,
    LOGIN,
    APPLICANT_ONBOARDING,
    RECRUITER_SHELL,
}

data class RootScreenSpec(
    val destination: RootScreenDestination,
    val loadingMessage: String? = null,
)

fun CatoRootRoute.toRootScreenSpec(): RootScreenSpec {
    return when (this) {
        CatoRootRoute.Loading -> RootScreenSpec(
            destination = RootScreenDestination.LOADING,
            loadingMessage = "Connecting to Cato",
        )
        CatoRootRoute.SignedOut -> RootScreenSpec(RootScreenDestination.LOGIN)
        is CatoRootRoute.SignedIn -> when (role) {
            CatoRole.APPLICANT -> RootScreenSpec(RootScreenDestination.APPLICANT_ONBOARDING)
            CatoRole.RECRUITER -> RootScreenSpec(RootScreenDestination.RECRUITER_SHELL)
        }
    }
}

data class LoginScreenSpec(
    val title: String,
    val subtitle: String,
    val footer: String,
    val roleOptions: List<LoginRoleButtonSpec>,
    val emailPlaceholder: String,
    val passwordPlaceholder: String,
    val passwordButton: CatoButtonSpec,
    val appleButton: CatoButtonSpec,
    val googleButton: CatoButtonSpec,
    val errorMessage: String?,
)

data class LoginRoleButtonSpec(
    val label: String,
    val selected: Boolean,
)

fun LoginFormState.toScreenSpec(): LoginScreenSpec {
    return LoginScreenSpec(
        title = "Cato",
        subtitle = "From search to strong shortlists.",
        footer = "Better hires, brighter futures.",
        roleOptions = roleOptions.map { LoginRoleButtonSpec(it.label, it.selected) },
        emailPlaceholder = "Email",
        passwordPlaceholder = "Password",
        passwordButton = CatoButtonSpec(
            label = "Login",
            kind = CatoButtonKind.PRIMARY,
            enabled = canSubmitPassword,
        ),
        appleButton = CatoButtonSpec(
            label = "Continue with Apple",
            kind = CatoButtonKind.PRIMARY,
            enabled = canSubmitOAuth,
        ),
        googleButton = CatoButtonSpec(
            label = "Continue with Google",
            iconName = "g.circle.fill",
            kind = CatoButtonKind.SECONDARY,
            enabled = canSubmitOAuth,
        ),
        errorMessage = errorMessage,
    )
}

data class BottomNavigationSpec(
    val leftItems: List<NavItemSpec>,
    val centerItem: NavItemSpec,
    val rightItems: List<NavItemSpec>,
    val unreadMessageBadge: String? = null,
)

data class ShellScaffoldSpec(
    val selectedKey: String,
    val bottomNavigation: BottomNavigationSpec,
    val showBottomBar: Boolean,
    val contentBottomPaddingDp: Int,
)

data class NavItemSpec(
    val key: String,
    val label: String,
    val iconName: String,
    val selected: Boolean = false,
    val showsWarningBadge: Boolean = false,
)

object CatoNavSpecs {
    fun recruiter(selected: String, unreadMessageBadge: String?): BottomNavigationSpec {
        return BottomNavigationSpec(
            leftItems = listOf(
                NavItemSpec("home", "Home", "house.fill", selected == "home"),
                NavItemSpec("search", "Search", "magnifyingglass", selected == "search"),
            ),
            centerItem = NavItemSpec("reels", "Reels", "film.fill", selected == "reels"),
            rightItems = listOf(
                NavItemSpec("messages", "Messages", "message.fill", selected == "messages"),
                NavItemSpec("settings", "Settings", "gearshape.fill", selected == "settings"),
            ),
            unreadMessageBadge = unreadMessageBadge,
        )
    }

    fun applicant(
        selected: String,
        unreadMessageBadge: String?,
        isManualMatchingMissing: Boolean = false,
    ): BottomNavigationSpec {
        return BottomNavigationSpec(
            leftItems = listOf(
                NavItemSpec("home", "Home", "house.fill", selected == "home"),
                NavItemSpec("requests", "Requests", "envelope.fill", selected == "requests"),
            ),
            centerItem = NavItemSpec("reels", "Reels", "film.fill", selected == "reels"),
            rightItems = listOf(
                NavItemSpec(
                    key = "profile",
                    label = "Profile",
                    iconName = "person.crop.circle.fill",
                    selected = selected == "profile",
                    showsWarningBadge = isManualMatchingMissing,
                ),
                NavItemSpec("settings", "Settings", "gearshape.fill", selected == "settings"),
            ),
            unreadMessageBadge = unreadMessageBadge,
        )
    }

    fun recruiterShell(
        selectedTab: RecruiterTab,
        chrome: ShellChromeState,
    ): ShellScaffoldSpec {
        val selectedKey = when (selectedTab) {
            RecruiterTab.HOME -> "home"
            RecruiterTab.SEARCH -> "search"
            RecruiterTab.REELS -> "reels"
            RecruiterTab.MESSAGES -> "messages"
            RecruiterTab.SETTINGS -> "settings"
        }
        return ShellScaffoldSpec(
            selectedKey = selectedKey,
            bottomNavigation = recruiter(selected = selectedKey, unreadMessageBadge = chrome.unreadMessageBadge),
            showBottomBar = chrome.shouldShowBottomBar,
            contentBottomPaddingDp = if (chrome.shouldShowBottomBar) 88 else 0,
        )
    }

    fun applicantShell(
        selectedTab: ApplicantTab,
        chrome: ShellChromeState,
        isManualMatchingMissing: Boolean,
    ): ShellScaffoldSpec {
        val selectedKey = when (selectedTab) {
            ApplicantTab.HOME -> "home"
            ApplicantTab.REQUESTS -> "requests"
            ApplicantTab.REELS -> "reels"
            ApplicantTab.PROFILE -> "profile"
            ApplicantTab.SETTINGS -> "settings"
        }
        return ShellScaffoldSpec(
            selectedKey = selectedKey,
            bottomNavigation = applicant(
                selected = selectedKey,
                unreadMessageBadge = chrome.unreadMessageBadge,
                isManualMatchingMissing = isManualMatchingMissing,
            ),
            showBottomBar = chrome.shouldShowBottomBar,
            contentBottomPaddingDp = if (chrome.shouldShowBottomBar) 88 else 0,
        )
    }
}

data class CandidateReviewActionSpec(
    val showHeaderActions: Boolean,
    val compactBottomActions: Boolean,
    val centerStatusLabel: String,
    val leftButton: CatoButtonSpec,
    val rightButton: CatoButtonSpec,
    val headerActions: List<CatoButtonSpec>,
)

fun CandidateReviewChromeState.toActionSpec(
    interestAlreadySent: Boolean,
    bookmarked: Boolean,
    isActing: Boolean = false,
): CandidateReviewActionSpec {
    return CandidateReviewActionSpec(
        showHeaderActions = shouldShowHeaderActions,
        compactBottomActions = isCompactDecisionBar,
        centerStatusLabel = statusLabel,
        leftButton = decisionButton(leftAction, iconOnly = isCompactDecisionBar, enabled = !isActing),
        rightButton = decisionButton(rightAction, iconOnly = isCompactDecisionBar, enabled = !isActing),
        headerActions = listOf(
            CatoButtonSpec("Interest", "sparkles", CatoButtonKind.PRIMARY, enabled = !isActing && !interestAlreadySent),
            CatoButtonSpec("Bookmark", if (bookmarked) "bookmark.fill" else "bookmark", CatoButtonKind.SECONDARY, enabled = !isActing && !bookmarked),
            CatoButtonSpec("Contact", "paperplane", CatoButtonKind.SECONDARY, enabled = true),
        ),
    )
}

private fun CandidateReviewChromeState.decisionButton(
    status: RecruiterReviewStatus,
    iconOnly: Boolean,
    enabled: Boolean,
): CatoButtonSpec {
    return when (status) {
        RecruiterReviewStatus.PASSED -> CatoButtonSpec("Pass", "xmark", CatoButtonKind.SECONDARY, enabled = enabled, iconOnly = iconOnly)
        RecruiterReviewStatus.SHORTLISTED -> CatoButtonSpec("Shortlist", "checkmark", CatoButtonKind.PRIMARY, enabled = enabled, iconOnly = iconOnly)
        RecruiterReviewStatus.MAYBE,
        RecruiterReviewStatus.NONE -> CatoButtonSpec("Maybe?", "questionmark", CatoButtonKind.SECONDARY, enabled = enabled, iconOnly = iconOnly)
    }
}
