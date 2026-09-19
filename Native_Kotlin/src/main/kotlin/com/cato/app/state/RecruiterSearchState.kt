package com.cato.app.state

import com.cato.app.core.MatchingDepth
import com.cato.app.core.MatchingOption
import com.cato.app.core.MatchingOptionType
import com.cato.app.core.RecruiterSearchEmploymentType
import com.cato.app.core.RuntimeMatchResult
import com.cato.app.core.RuntimeSearchSpec
import com.cato.app.ui.CatoButtonKind
import com.cato.app.ui.CatoButtonSpec

data class RecruiterSearchState(
    val employmentType: RecruiterSearchEmploymentType? = null,
    val graduationFilter: String = "any",
    val gpaText: String = "",
    val selectedCategories: List<MatchingOption> = emptyList(),
    val selectedSkills: List<MatchingOption> = emptyList(),
    val depthType: MatchingOptionType = MatchingOptionType.SKILL,
    val depthId: String = "",
    val isCollapsed: Boolean = false,
    val hasRunSearch: Boolean = false,
    val editingJobId: String? = null,
    val didNudgeToCategories: Boolean = false,
    val didNudgeToSkills: Boolean = false,
) {
    val selectedDepth: MatchingDepth?
        get() = depthId.takeIf { it.isNotBlank() }?.let { MatchingDepth(depthType, it) }

    val screenSpec: RecruiterSearchScreenSpec
        get() = RecruiterSearchScreenSpec(
            header = RecruiterSearchHeaderSpec(),
            collapsedSummary = if (isCollapsed) {
                CollapsedSearchSpec(
                    title = collapsedTitle,
                    helperText = collapsedHelperText,
                    items = summaryItems,
                    fallbackLabel = collapsedFallbackLabel,
                )
            } else {
                null
            },
            basics = RecruiterSearchBasicsSectionSpec(
                title = "LOOKING FOR",
                resetButton = CatoButtonSpec("Reset", kind = CatoButtonKind.SECONDARY),
                employmentOptions = RecruiterSearchEmploymentOptionSpec.all(selected = employmentType),
                graduationOptions = RecruiterSearchGraduationOptionSpec.all(selected = graduationFilter),
                gpaPlaceholder = "Minimum GPA, optional",
            ),
            categorySection = RecruiterSearchOptionSectionSpec(
                title = "Field / category",
                placeholder = "Search technology, finance, healthcare...",
                selected = selectedCategories,
                maxSelections = 10,
                showsReset = selectedCategories.isNotEmpty(),
                resetButton = CatoButtonSpec("Reset", kind = CatoButtonKind.SECONDARY),
            ),
            skillSection = RecruiterSearchOptionSectionSpec(
                title = "Experience in skills",
                placeholder = "Search Python, SQL, Figma, Excel...",
                selected = selectedSkills,
                maxSelections = 100,
                showsReset = selectedSkills.isNotEmpty(),
                resetButton = CatoButtonSpec("Reset", kind = CatoButtonKind.SECONDARY),
            ),
            depth = RecruiterSearchDepthSectionSpec(
                eyebrow = "MOST FLUENT IN",
                helperText = "Optional depth signal. Pick one selected skill or field.",
                type = depthType,
                selectedDepthId = depthId.ifBlank { null },
                options = depthOptions,
                emptyText = "Select skills or fields above to enable depth.",
                resetButton = depthId.takeIf { it.isNotBlank() }?.let {
                    CatoButtonSpec("Reset", kind = CatoButtonKind.SECONDARY)
                },
            ),
            floatingActions = RecruiterSearchFloatingActionsSpec(
                searchButton = CatoButtonSpec(
                    label = "Search candidates",
                    iconName = "magnifyingglass",
                    kind = CatoButtonKind.ICON,
                ),
                saveButton = CatoButtonSpec(
                    label = saveActionTitle,
                    iconName = "square.and.arrow.down",
                    kind = CatoButtonKind.SECONDARY,
                ),
            ),
        )

    val spec: RuntimeSearchSpec
        get() = RuntimeSearchSpec(
            employmentType = employmentType,
            targetCategories = selectedCategories.map { it.key },
            requiredSkills = selectedSkills.take(1).map { it.label },
            preferredSkills = selectedSkills.drop(1).map { it.label },
            desiredDepth = selectedDepth,
            graduated = graduationFilter,
            minGpa = gpaText.toDoubleOrNull(),
            semesterNumbers = emptyList(),
            limit = 50,
        )

    val summaryItems: List<SearchSummaryItem>
        get() = buildList {
            employmentType?.let { add(SearchSummaryItem("Type", it.label)) }
            if (graduationFilter != "any") add(SearchSummaryItem("Graduation", if (graduationFilter == "true") "Graduated" else "Not graduated"))
            gpaText.takeIf { it.isNotBlank() }?.let { add(SearchSummaryItem("GPA", "Min $it")) }
            addMulti("Fields", selectedCategories.map { it.label })
            addMulti("Skills", selectedSkills.map { it.label })
            selectedDepth?.let { depth ->
                val label = (selectedSkills + selectedCategories).firstOrNull { it.key == depth.id || it.id == depth.id }?.label ?: "Selected"
                add(SearchSummaryItem("Depth", label))
            }
        }

    val shouldPromptToSaveAfterRuntimeSearch: Boolean
        get() = hasRunSearch && !isCollapsed

    val saveActionTitle: String
        get() = if (editingJobId.isNullOrBlank()) "Save job" else "Update Job"

    val saveDialogActionTitle: String
        get() = if (editingJobId.isNullOrBlank()) "Save" else "Update Job"

    val saveDialogModeTitle: String
        get() = if (editingJobId.isNullOrBlank()) "Save this search" else "Update saved search"

    val defaultSaveName: String
        get() {
            val values = listOfNotNull(
                selectedCategories.firstOrNull()?.label,
                selectedSkills.firstOrNull()?.label,
                employmentType?.label,
            )
            return values.joinToString(" ").ifBlank { "Saved candidate search" }
        }

    val collapsedTitle: String
        get() = "Dynamic Search"

    val collapsedHelperText: String
        get() = "Tap to edit criteria"

    val collapsedFallbackLabel: String
        get() = "All candidates"

    val nextNudgeTarget: RecruiterSearchNudgeTarget?
        get() = when {
            employmentType != null && !didNudgeToCategories && !isCollapsed -> RecruiterSearchNudgeTarget.CATEGORIES
            selectedCategories.isNotEmpty() && !didNudgeToSkills && !isCollapsed -> RecruiterSearchNudgeTarget.SKILLS
            else -> null
        }

    val depthOptions: List<MatchingOption>
        get() = when (depthType) {
            MatchingOptionType.SKILL -> selectedSkills
            MatchingOptionType.CATEGORY -> selectedCategories
        }

    fun collapseAfterSearch(): RecruiterSearchState {
        return copy(hasRunSearch = true, isCollapsed = true)
    }

    fun expandForEditing(): RecruiterSearchState {
        return copy(isCollapsed = false)
    }

    fun resetAll(): RecruiterSearchState = RecruiterSearchState()

    fun resetBasics(): RecruiterSearchState {
        return copy(employmentType = null, graduationFilter = "any", gpaText = "")
    }

    fun resetCategories(): RecruiterSearchState {
        val shouldClearDepth = depthType == MatchingOptionType.CATEGORY
        return copy(
            selectedCategories = emptyList(),
            depthId = if (shouldClearDepth) "" else depthId,
            didNudgeToSkills = false,
        )
    }

    fun resetSkills(): RecruiterSearchState {
        val shouldClearDepth = depthType == MatchingOptionType.SKILL
        return copy(
            selectedSkills = emptyList(),
            depthId = if (shouldClearDepth) "" else depthId,
        )
    }

    fun resetDepth(): RecruiterSearchState {
        return copy(depthId = "")
    }

    fun toggleCategory(option: MatchingOption): RecruiterSearchState {
        require(option.type == MatchingOptionType.CATEGORY) { "Expected category option." }
        return copy(
            selectedCategories = selectedCategories.toggleOption(option, maxSelections = 10),
        )
    }

    fun toggleSkill(option: MatchingOption): RecruiterSearchState {
        require(option.type == MatchingOptionType.SKILL) { "Expected skill option." }
        return copy(
            selectedSkills = selectedSkills.toggleOption(option, maxSelections = 100),
        )
    }

    fun markNudged(target: RecruiterSearchNudgeTarget): RecruiterSearchState {
        return when (target) {
            RecruiterSearchNudgeTarget.CATEGORIES -> copy(didNudgeToCategories = true)
            RecruiterSearchNudgeTarget.SKILLS -> copy(didNudgeToSkills = true)
        }
    }

    private fun MutableList<SearchSummaryItem>.addMulti(label: String, values: List<String>) {
        if (values.isEmpty()) return
        add(SearchSummaryItem(label, values.sortedBy { it.lowercase() }))
    }
}

private fun List<MatchingOption>.toggleOption(option: MatchingOption, maxSelections: Int): List<MatchingOption> {
    val withoutExisting = filterNot { it.type == option.type && it.key == option.key }
    val next = if (withoutExisting.size == size) {
        if (size >= maxSelections) this else this + option
    } else {
        withoutExisting
    }
    return next.sortedBy { it.label.lowercase() }
}

data class SearchSummaryItem(
    val label: String,
    val values: List<String>,
) {
    constructor(label: String, value: String) : this(label, listOf(value))

    val displayedValues: List<String>
        get() = values.take(2)

    val remainingCount: Int
        get() = (values.size - 2).coerceAtLeast(0)

    val value: String
        get() {
            val visible = displayedValues.joinToString(", ")
            val suffix = if (remainingCount > 0) " +$remainingCount" else ""
            return visible + suffix
        }
}

enum class RecruiterSearchNudgeTarget {
    CATEGORIES,
    SKILLS,
}

data class RecruiterSearchScreenSpec(
    val header: RecruiterSearchHeaderSpec,
    val collapsedSummary: CollapsedSearchSpec?,
    val basics: RecruiterSearchBasicsSectionSpec,
    val categorySection: RecruiterSearchOptionSectionSpec,
    val skillSection: RecruiterSearchOptionSectionSpec,
    val depth: RecruiterSearchDepthSectionSpec,
    val floatingActions: RecruiterSearchFloatingActionsSpec,
) {
    val isExpanded: Boolean
        get() = collapsedSummary == null
}

data class RecruiterSearchHeaderSpec(
    val appName: String = "Cato",
    val title: String = "Dynamic Search",
    val subtitle: String = "Build a structured candidate search from role type, field, skills, and student readiness signals.",
    val resetButton: CatoButtonSpec = CatoButtonSpec(
        label = "Reset",
        iconName = "arrow.counterclockwise",
        kind = CatoButtonKind.SECONDARY,
    ),
)

data class CollapsedSearchSpec(
    val title: String,
    val helperText: String,
    val items: List<SearchSummaryItem>,
    val fallbackLabel: String,
) {
    val displayLabel: String
        get() = items.joinToString(" • ") { "${it.label}: ${it.value}" }.ifBlank { fallbackLabel }
}

data class RecruiterSearchBasicsSectionSpec(
    val title: String,
    val resetButton: CatoButtonSpec,
    val employmentOptions: List<RecruiterSearchEmploymentOptionSpec>,
    val graduationOptions: List<RecruiterSearchGraduationOptionSpec>,
    val gpaPlaceholder: String,
)

data class RecruiterSearchEmploymentOptionSpec(
    val value: RecruiterSearchEmploymentType?,
    val label: String,
    val selected: Boolean,
) {
    companion object {
        fun all(selected: RecruiterSearchEmploymentType?): List<RecruiterSearchEmploymentOptionSpec> {
            return listOf(
                RecruiterSearchEmploymentOptionSpec(null, "Any", selected == null),
                RecruiterSearchEmploymentOptionSpec(RecruiterSearchEmploymentType.INTERNSHIP, RecruiterSearchEmploymentType.INTERNSHIP.label, selected == RecruiterSearchEmploymentType.INTERNSHIP),
                RecruiterSearchEmploymentOptionSpec(RecruiterSearchEmploymentType.FULL_TIME, RecruiterSearchEmploymentType.FULL_TIME.label, selected == RecruiterSearchEmploymentType.FULL_TIME),
                RecruiterSearchEmploymentOptionSpec(RecruiterSearchEmploymentType.PART_TIME, RecruiterSearchEmploymentType.PART_TIME.label, selected == RecruiterSearchEmploymentType.PART_TIME),
                RecruiterSearchEmploymentOptionSpec(RecruiterSearchEmploymentType.CONTRACT, RecruiterSearchEmploymentType.CONTRACT.label, selected == RecruiterSearchEmploymentType.CONTRACT),
            )
        }
    }
}

data class RecruiterSearchGraduationOptionSpec(
    val value: String,
    val label: String,
    val selected: Boolean,
) {
    companion object {
        fun all(selected: String): List<RecruiterSearchGraduationOptionSpec> {
            return listOf(
                RecruiterSearchGraduationOptionSpec("any", "Any", selected == "any"),
                RecruiterSearchGraduationOptionSpec("false", "Not graduated", selected == "false"),
                RecruiterSearchGraduationOptionSpec("true", "Graduated", selected == "true"),
            )
        }
    }
}

data class RecruiterSearchOptionSectionSpec(
    val title: String,
    val placeholder: String,
    val selected: List<MatchingOption>,
    val maxSelections: Int,
    val showsReset: Boolean,
    val resetButton: CatoButtonSpec,
)

data class RecruiterSearchDepthSectionSpec(
    val eyebrow: String,
    val helperText: String,
    val type: MatchingOptionType,
    val selectedDepthId: String?,
    val options: List<MatchingOption>,
    val emptyText: String,
    val resetButton: CatoButtonSpec?,
)

data class RecruiterSearchFloatingActionsSpec(
    val searchButton: CatoButtonSpec,
    val saveButton: CatoButtonSpec,
)

data class RecruiterSaveSearchSheetState(
    val name: String,
    val isSaving: Boolean = false,
    val editingJobId: String? = null,
) {
    val trimmedName: String
        get() = name.trim()

    val canSave: Boolean
        get() = trimmedName.isNotEmpty() && !isSaving

    val validationMessage: String?
        get() = if (trimmedName.isEmpty()) "Name this saved search first." else null

    val modeTitle: String
        get() = if (editingJobId.isNullOrBlank()) "Save this search" else "Update saved search"

    val actionTitle: String
        get() = if (editingJobId.isNullOrBlank()) "Save" else "Update Job"

    val helperText: String
        get() = "Name this search so you can reuse it as a role."
}

data class RuntimeSearchResultsState(
    val results: List<RuntimeMatchResult> = emptyList(),
    val hasRunSearch: Boolean = false,
    val errorMessage: String? = null,
    val isRunningSearch: Boolean = false,
) {
    val title: String
        get() = "${results.size} ranked candidates"

    val helperText: String
        get() = "Ranked by match strength, profile completeness, evidence signals, projects, and recruiter filters."

    val emptyTitle: String
        get() = if (hasRunSearch) "No candidates found" else "Search candidates"

    val emptyMessage: String
        get() = if (hasRunSearch) {
            "Try adjusting the search or clearing filters."
        } else {
            "Choose any filters you care about, or search with no filters to view all ranked candidates."
        }

    val rows: List<RuntimeResultRowSpec>
        get() = results.mapIndexed { index, result ->
            RuntimeResultRowSpec(
                rank = index + 1,
                applicantId = result.applicant.id,
                displayName = result.applicant.displayName,
                subtitle = result.applicant.displaySubtitle.ifBlank { "Profile details pending" },
                scoreLabel = "${result.score.totalScore}%",
                reasonPreview = result.score.reasons.take(2),
                blockerPreview = result.score.blockers.take(1),
            )
        }
}

data class RuntimeResultRowSpec(
    val rank: Int,
    val applicantId: String,
    val displayName: String,
    val subtitle: String,
    val scoreLabel: String,
    val reasonPreview: List<String>,
    val blockerPreview: List<String>,
)
