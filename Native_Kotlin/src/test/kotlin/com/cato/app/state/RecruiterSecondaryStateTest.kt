package com.cato.app.state

import com.cato.app.core.RecruiterAccount
import com.cato.app.core.RecruiterCandidate
import com.cato.app.core.RecruiterCandidateEvidence
import com.cato.app.core.RecruiterCandidateValidation
import com.cato.app.core.RecruiterProject
import com.cato.app.core.RecruiterReviewStatus
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class RecruiterSecondaryStateTest {
    @Test
    fun shortlistToggleCapsComparisonSelectionAtFour() {
        val candidates = (1..5).map { index ->
            RecruiterCandidate(id = "c$index", applicantId = "a$index", name = "Candidate $index")
        }
        val state = candidates.fold(RecruiterShortlistState(candidates = candidates)) { current, candidate ->
            current.toggle(candidate.id)
        }

        assertEquals(4, state.selectedIds.size)
        assertTrue(state.canCompare)
        assertEquals(4, state.compareCandidateIds.size)

        val removed = state.toggle("c1")
        assertFalse("c1" in removed.selectedIds)
    }

    @Test
    fun bookmarksExposeResultRowsAndEmptyCopy() {
        val empty = RecruiterBookmarksState()
        val filled = RecruiterBookmarksState(
            bookmarked = listOf(RecruiterCandidate(id = "c1", applicantId = "a1", name = "Zoe", matchScore = 80))
        )

        assertEquals("No bookmarks yet", empty.emptyTitle)
        assertEquals("Bookmarked", empty.screenSpec.title)
        assertEquals("Loading bookmarks", empty.screenSpec.loadingMessage)
        assertEquals("bookmark", empty.screenSpec.emptyIconName)
        assertTrue(empty.screenSpec.isEmpty)
        assertEquals("1 bookmarked candidates", filled.countLabel)
        assertFalse(filled.screenSpec.isEmpty)
        assertEquals("Zoe", filled.rows.first().displayName)
    }

    @Test
    fun recruiterSettingsRowsMirrorSwiftAccountCard() {
        val state = RecruiterSettingsState(
            recruiter = RecruiterAccount(
                id = "rec1",
                email = "recruiter@example.com",
                name = "",
                companyName = "Acme",
                plan = "professional",
            )
        )

        assertEquals("Recruiter", state.displayName)
        assertEquals("recruiter@example.com", state.displayEmail)
        assertEquals("Acme", state.infoRows.first { it.first == "Company" }.second)
        assertEquals("Professional", state.infoRows.first { it.first == "Plan" }.second)
        assertTrue(state.deleteConfirmationMessage.contains("permanently removes"))

        val spec = state.screenSpec
        assertEquals("Settings", spec.title)
        assertEquals("Loading settings", spec.loadingMessage)
        assertEquals("Manage your recruiter account and company profile.", spec.subtitle)
        assertEquals("Recruiter", spec.profile.displayName)
        assertEquals("recruiter@example.com", spec.profile.email)
        assertEquals("Account", spec.accountSectionTitle)
        assertEquals("Log out", spec.logout.title)
        assertEquals("rectangle.portrait.and.arrow.right", spec.logout.iconName)
        assertFalse(spec.logout.destructive)
        assertEquals("Delete account", spec.delete.title)
        assertEquals("trash", spec.delete.iconName)
        assertTrue(spec.delete.destructive)
        assertEquals("Log out?", spec.logoutConfirmation.title)
        assertEquals("You will return to the login screen.", spec.logoutConfirmation.message)
        assertEquals("Delete recruiter account?", spec.deleteConfirmation.title)
        assertTrue(spec.deleteConfirmation.message.contains("saved filters"))
    }

    @Test
    fun recruiterSettingsScreenDisablesAccountActionsWhileWorking() {
        val spec = RecruiterSettingsState(
            recruiter = RecruiterAccount(id = "rec1", email = "recruiter@example.com"),
            isWorking = true,
        ).screenSpec

        assertFalse(spec.logout.enabled)
        assertFalse(spec.delete.enabled)
        assertEquals("Updating account...", spec.workingMessage)
    }

    @Test
    fun evidenceQueueRowsMirrorSwiftReviewCards() {
        val state = RecruiterEvidenceQueueState(
            candidates = listOf(
                RecruiterCandidate(
                    id = "c1",
                    applicantId = "a1",
                    name = "Zoe",
                    major = "Computer Science",
                    universityName = "Stanford",
                    matchScore = 88,
                    matchStrength = "strong_match",
                    profileStrength = 97,
                    matchEvidence = listOf(
                        RecruiterCandidateEvidence("e1", "resume", "Python evidence", "Built APIs", "strong"),
                        RecruiterCandidateEvidence("e2", "project", "Backend project", "Has services", "strong"),
                        RecruiterCandidateEvidence("e3", "resume", "Extra evidence", "Ignored after two", "weak"),
                    ),
                    needsValidation = listOf(
                        RecruiterCandidateValidation("v1", "Leadership unclear", "Needs closer review")
                    ),
                )
            )
        )

        val row = state.rows.single()

        assertEquals("1 left", state.countLabel)
        assertEquals("Computer Science • Stanford", row.subtitle)
        assertEquals("88%", row.matchScoreLabel)
        assertEquals("Strong match", row.matchStrengthLabel)
        assertEquals(listOf("Python evidence", "Backend project"), row.evidenceTitles)
        assertEquals("Needs validation: Leadership unclear", row.validationLabel)

        val updated = state.afterReviewUpdate("c1", RecruiterReviewStatus.SHORTLISTED)
        assertTrue(updated.candidates.isEmpty())
        assertEquals("Zoe marked shortlisted.", updated.actionMessage)
    }

    @Test
    fun comparisonColumnsExposeSwiftMetricsAndTopEvidence() {
        val state = RecruiterComparisonState(
            candidates = listOf(
                RecruiterCandidate(
                    id = "c1",
                    applicantId = "a1",
                    name = "Zoe",
                    major = "Computer Science",
                    universityName = "Stanford",
                    matchScore = 75,
                    profileStrength = 97,
                    gpa = 3.8,
                    hasResume = true,
                    projects = listOf(RecruiterProject(id = "p1", title = "Portfolio", type = "built", description = "Built app")),
                    matchEvidence = listOf(
                        RecruiterCandidateEvidence("e1", "resume", "Python", "Resume mentions Python", "strong")
                    ),
                )
            )
        )

        val column = state.columns.single()

        assertEquals("Zoe", column.displayName)
        assertEquals("Computer Science • Stanford", column.subtitle)
        assertEquals("75%", column.metrics.first { it.first == "Match" }.second)
        assertEquals("97%", column.metrics.first { it.first == "Strength" }.second)
        assertEquals("3.80", column.metrics.first { it.first == "GPA" }.second)
        assertEquals("Yes", column.metrics.first { it.first == "Resume" }.second)
        assertEquals(listOf("Python"), column.topEvidence)
    }
}
