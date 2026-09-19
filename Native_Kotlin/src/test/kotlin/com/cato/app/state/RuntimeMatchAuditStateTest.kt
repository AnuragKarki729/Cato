package com.cato.app.state

import com.cato.app.core.RuntimeMatchComponentScores
import com.cato.app.core.RuntimeMatchApplicant
import com.cato.app.core.RuntimeMatchScore
import com.cato.app.core.RuntimeSearchAuditEligibility
import com.cato.app.core.RuntimeSearchAuditInputsPresent
import com.cato.app.core.RuntimeSearchAuditManualContribution
import com.cato.app.core.RuntimeSearchAuditResponse
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse

class RuntimeMatchAuditStateTest {
    @Test
    fun componentRowsUseRecruiterFriendlyLabels() {
        val state = RuntimeMatchAuditState(
            score = RuntimeMatchScore(
                totalScore = 82,
                componentScores = RuntimeMatchComponentScores(
                    bm25 = 0.8,
                    filters = 1.0,
                    profileStrength = 0.7,
                ),
                reasons = listOf("Resume mentions Python"),
            )
        )

        assertEquals("82% match", state.scoreLabel)
        assertEquals("Resume relevance", state.componentRows.first().label)
        assertFalse(state.componentRows.any { it.label.contains("BM25", ignoreCase = true) })
        assertEquals(listOf("Resume mentions Python"), state.reasonRows)

        val spec = state.screenSpec
        assertEquals("Why this match?", spec.title)
        assertEquals("Close", spec.closeButtonTitle)
        assertEquals("Auditing match", spec.loadingMessage)
        assertEquals("82% match", spec.scoreLabel)
        assertEquals("Strong signals", spec.strongSignals.title)
        assertEquals(listOf("Resume mentions Python"), spec.strongSignals.displayItems)
        assertEquals("Missing or weaker signals", spec.missingSignals.title)
        assertEquals(listOf("No hard blockers for this search."), spec.missingSignals.displayItems)
    }

    @Test
    fun auditResponseAddsRecruiterReadableDiagnostics() {
        val state = RuntimeMatchAuditState(
            score = null,
            audit = RuntimeSearchAuditResponse(
                applicant = RuntimeMatchApplicant(id = "a1", name = "Zoe"),
                eligibility = RuntimeSearchAuditEligibility(
                    inRuntimePool = true,
                    passesRuntimeFilters = true,
                    includedInRankedResults = true,
                    rank = 3,
                    totalEligibleCandidates = 21,
                    totalRankedCandidates = 12,
                ),
                searchInputsPresent = RuntimeSearchAuditInputsPresent(
                    resumeUploaded = true,
                    resumeTextReady = true,
                    resumeExtractedSkillsCount = 6,
                    manualFieldCount = 2,
                    manualSkillCount = 5,
                    projectCount = 1,
                    internshipCount = 0,
                ),
                manualSearchContribution = RuntimeSearchAuditManualContribution(
                    skillMatches = listOf("python", "sql"),
                    fieldMatches = listOf("technology"),
                    depthMatch = true,
                ),
                score = RuntimeMatchScore(totalScore = 75),
                verificationNotes = listOf("Manual skills contributed to this search."),
            )
        )

        assertEquals("75% match", state.scoreLabel)
        assertEquals("#3", state.diagnosticRows.first { it.label == "Rank" }.value)
        assertEquals("6", state.diagnosticRows.first { it.label == "Extracted skills" }.value)
        assertEquals("python, sql", state.diagnosticRows.first { it.label == "Manual skill matches" }.value)
        assertEquals(listOf("Manual skills contributed to this search."), state.verificationNotes)
    }

    @Test
    fun auditScreenSpecShowsSwiftErrorAndRetryCopy() {
        val state = RuntimeMatchAuditState(
            score = null,
            errorMessage = "The data could not be read because it is not in the correct format.",
        )

        val error = state.screenSpec.error

        assertEquals("Could not audit this match", error?.title)
        assertEquals("Try again", error?.retryTitle)
        assertEquals("The data could not be read because it is not in the correct format.", error?.message)
        assertEquals(listOf("No verification notes."), state.screenSpec.verification.displayItems)
    }
}
