package com.cato.app.state

import com.cato.app.core.RuntimeMatchComponentScores
import com.cato.app.core.RuntimeMatchScore
import com.cato.app.core.RuntimeSearchAuditResponse

data class RuntimeMatchAuditState(
    val score: RuntimeMatchScore?,
    val audit: RuntimeSearchAuditResponse? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
) {
    val screenSpec: RuntimeMatchAuditScreenSpec
        get() = RuntimeMatchAuditScreenSpec(
            title = title,
            closeButtonTitle = "Close",
            loadingMessage = "Auditing match",
            error = errorMessage?.let {
                RuntimeMatchAuditErrorSpec(
                    title = "Could not audit this match",
                    message = it,
                    retryTitle = "Try again",
                )
            },
            scoreLabel = scoreLabel,
            strongSignals = RuntimeMatchAuditListSpec(
                title = "Strong signals",
                items = reasonRows,
                emptyText = "No strong signals were produced for this search.",
            ),
            missingSignals = RuntimeMatchAuditListSpec(
                title = "Missing or weaker signals",
                items = blockerRows,
                emptyText = "No hard blockers for this search.",
            ),
            verification = RuntimeMatchAuditListSpec(
                title = "How this was checked",
                items = verificationNotes,
                emptyText = "No verification notes.",
            ),
            componentRows = componentRows,
            diagnosticRows = diagnosticRows,
        )

    private val effectiveScore: RuntimeMatchScore?
        get() = audit?.score ?: score

    val title: String
        get() = "Why this match?"

    val scoreLabel: String
        get() = "${effectiveScore?.totalScore ?: 0}% match"

    val reasonRows: List<String>
        get() = effectiveScore?.reasons.orEmpty()

    val blockerRows: List<String>
        get() = effectiveScore?.blockers.orEmpty()

    val componentRows: List<RuntimeMatchComponentRow>
        get() = effectiveScore?.componentScores?.toRows().orEmpty()

    val diagnosticRows: List<RuntimeMatchDiagnosticRow>
        get() = buildList {
            audit?.eligibility?.let { eligibility ->
                add(RuntimeMatchDiagnosticRow("Runtime pool", if (eligibility.inRuntimePool) "Yes" else "No"))
                add(RuntimeMatchDiagnosticRow("Runtime filters", if (eligibility.passesRuntimeFilters) "Passed" else "Not passed"))
                eligibility.rank?.let { add(RuntimeMatchDiagnosticRow("Rank", "#$it")) }
                add(RuntimeMatchDiagnosticRow("Eligible candidates", eligibility.totalEligibleCandidates.toString()))
                add(RuntimeMatchDiagnosticRow("Ranked candidates", eligibility.totalRankedCandidates.toString()))
            }
            audit?.searchInputsPresent?.let { inputs ->
                add(RuntimeMatchDiagnosticRow("Resume uploaded", if (inputs.resumeUploaded) "Yes" else "No"))
                add(RuntimeMatchDiagnosticRow("Resume searchable", if (inputs.resumeTextReady) "Yes" else "No"))
                add(RuntimeMatchDiagnosticRow("Extracted skills", inputs.resumeExtractedSkillsCount.toString()))
                add(RuntimeMatchDiagnosticRow("Manual fields", inputs.manualFieldCount.toString()))
                add(RuntimeMatchDiagnosticRow("Manual skills", inputs.manualSkillCount.toString()))
                add(RuntimeMatchDiagnosticRow("Projects", inputs.projectCount.toString()))
                add(RuntimeMatchDiagnosticRow("Internships", inputs.internshipCount.toString()))
            }
            audit?.manualSearchContribution?.let { manual ->
                if (manual.skillMatches.isNotEmpty()) add(RuntimeMatchDiagnosticRow("Manual skill matches", manual.skillMatches.joinToString(", ")))
                if (manual.fieldMatches.isNotEmpty()) add(RuntimeMatchDiagnosticRow("Manual field matches", manual.fieldMatches.joinToString(", ")))
                add(RuntimeMatchDiagnosticRow("Depth match", if (manual.depthMatch) "Yes" else "No"))
            }
        }

    val verificationNotes: List<String>
        get() = audit?.verificationNotes.orEmpty()
}

data class RuntimeMatchAuditScreenSpec(
    val title: String,
    val closeButtonTitle: String,
    val loadingMessage: String,
    val error: RuntimeMatchAuditErrorSpec?,
    val scoreLabel: String,
    val strongSignals: RuntimeMatchAuditListSpec,
    val missingSignals: RuntimeMatchAuditListSpec,
    val verification: RuntimeMatchAuditListSpec,
    val componentRows: List<RuntimeMatchComponentRow>,
    val diagnosticRows: List<RuntimeMatchDiagnosticRow>,
)

data class RuntimeMatchAuditErrorSpec(
    val title: String,
    val message: String,
    val retryTitle: String,
)

data class RuntimeMatchAuditListSpec(
    val title: String,
    val items: List<String>,
    val emptyText: String,
) {
    val displayItems: List<String>
        get() = items.ifEmpty { listOf(emptyText) }
}

data class RuntimeMatchComponentRow(
    val label: String,
    val value: Double,
)

data class RuntimeMatchDiagnosticRow(
    val label: String,
    val value: String,
)

fun RuntimeMatchComponentScores.toRows(): List<RuntimeMatchComponentRow> {
    return listOf(
        RuntimeMatchComponentRow("Resume relevance", bm25),
        RuntimeMatchComponentRow("Filter fit", filters),
        RuntimeMatchComponentRow("Profile strength", profileStrength),
        RuntimeMatchComponentRow("Project evidence", projects),
        RuntimeMatchComponentRow("Internship signal", internships),
        RuntimeMatchComponentRow("Soft signal", softSkills),
        RuntimeMatchComponentRow("Freshness", freshness),
    ).filter { it.value > 0.0 }
}
