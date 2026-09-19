package com.cato.app.ui

import com.cato.app.state.ShellChromeState
import com.cato.app.state.ApplicantTab
import com.cato.app.state.RecruiterTab
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class NavigationSpecTest {
    @Test
    fun recruiterBottomNavUsesCenteredReelsAndMessageBadge() {
        val spec = CatoNavSpecs.recruiter(selected = "reels", unreadMessageBadge = "9+")

        assertEquals(listOf("Home", "Search"), spec.leftItems.map { it.label })
        assertEquals("Reels", spec.centerItem.label)
        assertTrue(spec.centerItem.selected)
        assertEquals(listOf("Messages", "Settings"), spec.rightItems.map { it.label })
        assertEquals("9+", spec.unreadMessageBadge)
    }

    @Test
    fun applicantBottomNavUsesRequestsProfileAndCenteredReels() {
        val spec = CatoNavSpecs.applicant(
            selected = "profile",
            unreadMessageBadge = null,
            isManualMatchingMissing = true,
        )

        assertEquals(listOf("Home", "Requests"), spec.leftItems.map { it.label })
        assertEquals("Reels", spec.centerItem.label)
        assertEquals(listOf("Profile", "Settings"), spec.rightItems.map { it.label })
        assertTrue(spec.rightItems.first { it.key == "profile" }.selected)
        assertTrue(spec.rightItems.first { it.key == "profile" }.showsWarningBadge)
        assertFalse(spec.rightItems.first { it.key == "settings" }.showsWarningBadge)
    }

    @Test
    fun shellChromeHidesBottomBarWhenKeyboardIsVisibleAndCapsUnreadBadge() {
        val hidden = ShellChromeState(isKeyboardVisible = true, unreadMessageCount = 12)
        val clear = ShellChromeState(isKeyboardVisible = false, unreadMessageCount = 0)

        assertFalse(hidden.shouldShowBottomBar)
        assertEquals("9+", hidden.unreadMessageBadge)
        assertTrue(clear.shouldShowBottomBar)
        assertNull(clear.unreadMessageBadge)
    }

    @Test
    fun shellScaffoldSpecMirrorsSwiftBottomPaddingAndKeyboardBehavior() {
        val recruiter = CatoNavSpecs.recruiterShell(
            selectedTab = RecruiterTab.MESSAGES,
            chrome = ShellChromeState(isKeyboardVisible = false, unreadMessageCount = 12),
        )
        val applicantKeyboard = CatoNavSpecs.applicantShell(
            selectedTab = ApplicantTab.PROFILE,
            chrome = ShellChromeState(isKeyboardVisible = true, unreadMessageCount = 0),
            isManualMatchingMissing = true,
        )

        assertEquals("messages", recruiter.selectedKey)
        assertTrue(recruiter.showBottomBar)
        assertEquals(88, recruiter.contentBottomPaddingDp)
        assertEquals("9+", recruiter.bottomNavigation.unreadMessageBadge)
        assertEquals("profile", applicantKeyboard.selectedKey)
        assertFalse(applicantKeyboard.showBottomBar)
        assertEquals(0, applicantKeyboard.contentBottomPaddingDp)
        assertTrue(applicantKeyboard.bottomNavigation.rightItems.first { it.key == "profile" }.showsWarningBadge)
    }
}
