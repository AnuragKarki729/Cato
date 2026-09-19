package com.cato.app.state

import com.cato.app.core.MatchingOption
import com.cato.app.core.MatchingOptionType
import com.cato.app.core.RecruiterSearchEmploymentType
import com.cato.app.core.RuntimeMatchApplicant
import com.cato.app.core.RuntimeMatchResult
import com.cato.app.core.RuntimeMatchScore
import com.cato.app.ui.CatoButtonKind
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class RecruiterSearchStateTest {
    @Test
    fun exposesSwiftAlignedDynamicSearchScreenSpecWhenExpanded() {
        val category = MatchingOption(id = "cat-tech", type = MatchingOptionType.CATEGORY, key = "technology", label = "Technology")
        val skill = MatchingOption(id = "skill-python", type = MatchingOptionType.SKILL, key = "python", label = "Python")
        val state = RecruiterSearchState(
            employmentType = RecruiterSearchEmploymentType.INTERNSHIP,
            graduationFilter = "false",
            selectedCategories = listOf(category),
            selectedSkills = listOf(skill),
            depthType = MatchingOptionType.SKILL,
            depthId = "python",
        )

        val spec = state.screenSpec

        assertTrue(spec.isExpanded)
        assertEquals("Cato", spec.header.appName)
        assertEquals("Dynamic Search", spec.header.title)
        assertTrue(spec.header.subtitle.contains("student readiness signals"))
        assertEquals("LOOKING FOR", spec.basics.title)
        assertEquals("Minimum GPA, optional", spec.basics.gpaPlaceholder)
        assertEquals(listOf("Any", "Intern", "Full-time", "Part-time", "Contract"), spec.basics.employmentOptions.map { it.label })
        assertEquals("Intern", spec.basics.employmentOptions.single { it.selected }.label)
        assertEquals("Not graduated", spec.basics.graduationOptions.single { it.selected }.label)
        assertEquals("Field / category", spec.categorySection.title)
        assertEquals("Search technology, finance, healthcare...", spec.categorySection.placeholder)
        assertEquals(10, spec.categorySection.maxSelections)
        assertTrue(spec.categorySection.showsReset)
        assertEquals("Experience in skills", spec.skillSection.title)
        assertEquals("Search Python, SQL, Figma, Excel...", spec.skillSection.placeholder)
        assertEquals(100, spec.skillSection.maxSelections)
        assertEquals("MOST FLUENT IN", spec.depth.eyebrow)
        assertEquals("Optional depth signal. Pick one selected skill or field.", spec.depth.helperText)
        assertEquals(listOf("Python"), spec.depth.options.map { it.label })
        assertEquals("python", spec.depth.selectedDepthId)
        assertEquals("Search candidates", spec.floatingActions.searchButton.label)
        assertEquals("magnifyingglass", spec.floatingActions.searchButton.iconName)
        assertEquals(CatoButtonKind.ICON, spec.floatingActions.searchButton.kind)
        assertEquals("Save job", spec.floatingActions.saveButton.label)
    }

    @Test
    fun searchScreenSpecShowsCollapsedSummaryAndUpdateJobAction() {
        val state = RecruiterSearchState(
            employmentType = RecruiterSearchEmploymentType.FULL_TIME,
            selectedSkills = listOf(
                MatchingOption(id = "skill-python", type = MatchingOptionType.SKILL, key = "python", label = "Python"),
                MatchingOption(id = "skill-sql", type = MatchingOptionType.SKILL, key = "sql", label = "SQL"),
                MatchingOption(id = "skill-aws", type = MatchingOptionType.SKILL, key = "aws", label = "AWS"),
            ),
            isCollapsed = true,
            editingJobId = "job-1",
        )
        val emptyCollapsed = RecruiterSearchState(isCollapsed = true)

        val spec = state.screenSpec

        assertFalse(spec.isExpanded)
        assertEquals("Dynamic Search", spec.collapsedSummary?.title)
        assertEquals("Tap to edit criteria", spec.collapsedSummary?.helperText)
        assertEquals("Type: Full-time • Skills: AWS, Python +1", spec.collapsedSummary?.displayLabel)
        assertEquals("All candidates", emptyCollapsed.screenSpec.collapsedSummary?.displayLabel)
        assertEquals("Update Job", spec.floatingActions.saveButton.label)
    }

    @Test
    fun buildsRuntimeSearchSpecAndCollapsedSummary() {
        val category = MatchingOption(id = "cat-tech", type = MatchingOptionType.CATEGORY, key = "technology", label = "Technology")
        val skill = MatchingOption(id = "skill-python", type = MatchingOptionType.SKILL, key = "python", label = "Python")
        val preferredSkill = MatchingOption(id = "skill-sql", type = MatchingOptionType.SKILL, key = "sql", label = "SQL")
        val state = RecruiterSearchState(
            employmentType = RecruiterSearchEmploymentType.INTERNSHIP,
            graduationFilter = "false",
            gpaText = "3.5",
            selectedCategories = listOf(category),
            selectedSkills = listOf(skill, preferredSkill),
            depthType = MatchingOptionType.SKILL,
            depthId = "python",
        )

        assertEquals(RecruiterSearchEmploymentType.INTERNSHIP, state.spec.employmentType)
        assertEquals(listOf("technology"), state.spec.targetCategories)
        assertEquals(listOf("Python"), state.spec.requiredSkills)
        assertEquals(listOf("SQL"), state.spec.preferredSkills)
        assertEquals("Not graduated", state.summaryItems.first { it.label == "Graduation" }.value)
        assertEquals("Python", state.summaryItems.first { it.label == "Depth" }.value)
    }

    @Test
    fun collapsedSummaryShowsTwoValuesPlusRemainingAndAllCandidatesFallback() {
        val skills = listOf(
            MatchingOption(id = "skill-python", type = MatchingOptionType.SKILL, key = "python", label = "Python"),
            MatchingOption(id = "skill-sql", type = MatchingOptionType.SKILL, key = "sql", label = "SQL"),
            MatchingOption(id = "skill-aws", type = MatchingOptionType.SKILL, key = "aws", label = "AWS"),
        )
        val state = RecruiterSearchState(selectedSkills = skills)
        val empty = RecruiterSearchState()

        val item = state.summaryItems.single()

        assertEquals(listOf("AWS", "Python"), item.displayedValues)
        assertEquals(1, item.remainingCount)
        assertEquals("AWS, Python +1", item.value)
        assertEquals("All candidates", empty.collapsedFallbackLabel)
        assertEquals(emptyList(), empty.summaryItems)
    }

    @Test
    fun resetsSectionsAndSaveActionTitleMatchesCreateOrUpdateMode() {
        val category = MatchingOption(id = "cat-tech", type = MatchingOptionType.CATEGORY, key = "technology", label = "Technology")
        val skill = MatchingOption(id = "skill-python", type = MatchingOptionType.SKILL, key = "python", label = "Python")
        val state = RecruiterSearchState(
            employmentType = RecruiterSearchEmploymentType.FULL_TIME,
            graduationFilter = "true",
            gpaText = "3.7",
            selectedCategories = listOf(category),
            selectedSkills = listOf(skill),
            depthType = MatchingOptionType.SKILL,
            depthId = "python",
            editingJobId = "job-1",
        )

        assertEquals("Update Job", state.saveActionTitle)
        assertEquals("Save job", state.copy(editingJobId = null).saveActionTitle)
        val basicsReset = state.resetBasics()

        assertNull(basicsReset.employmentType)
        assertEquals("any", basicsReset.graduationFilter)
        assertEquals("", basicsReset.gpaText)
        assertEquals("job-1", basicsReset.editingJobId)
        assertEquals(listOf(category), basicsReset.selectedCategories)
        assertEquals(listOf(skill), basicsReset.selectedSkills)
        assertEquals("", state.resetSkills().depthId)
        assertEquals(listOf(category), state.resetSkills().selectedCategories)
        assertEquals(emptyList(), state.resetCategories().selectedCategories)
        assertEquals("", state.resetDepth().depthId)
    }

    @Test
    fun optionTogglesAreUniqueSortedAndCappedLikeSwift() {
        val accounting = MatchingOption(id = "cat-accounting", type = MatchingOptionType.CATEGORY, key = "accounting", label = "Accounting")
        val technology = MatchingOption(id = "cat-tech", type = MatchingOptionType.CATEGORY, key = "technology", label = "Technology")
        val business = MatchingOption(id = "cat-business", type = MatchingOptionType.CATEGORY, key = "business", label = "Business")
        val tenCategories = (1..10).map {
            MatchingOption(id = "cat-$it", type = MatchingOptionType.CATEGORY, key = "cat-$it", label = "Category $it")
        }
        val full = RecruiterSearchState(selectedCategories = tenCategories)
        val python = MatchingOption(id = "skill-python", type = MatchingOptionType.SKILL, key = "python", label = "Python")
        val sql = MatchingOption(id = "skill-sql", type = MatchingOptionType.SKILL, key = "sql", label = "SQL")

        val selected = RecruiterSearchState()
            .toggleCategory(technology)
            .toggleCategory(accounting)
            .toggleCategory(business)
            .toggleSkill(sql)
            .toggleSkill(python)
        val removed = selected.toggleCategory(accounting).toggleSkill(python)
        val capped = full.toggleCategory(MatchingOption(id = "cat-extra", type = MatchingOptionType.CATEGORY, key = "extra", label = "Extra"))

        assertEquals(listOf("Accounting", "Business", "Technology"), selected.selectedCategories.map { it.label })
        assertEquals(listOf("Python", "SQL"), selected.selectedSkills.map { it.label })
        assertEquals(listOf("Business", "Technology"), removed.selectedCategories.map { it.label })
        assertEquals(listOf("SQL"), removed.selectedSkills.map { it.label })
        assertEquals(10, capped.selectedCategories.size)
        assertEquals(tenCategories.map { it.key }, capped.selectedCategories.map { it.key })
    }

    @Test
    fun saveSearchDialogStateUsesSwiftDefaultNameAndValidation() {
        val category = MatchingOption(id = "cat-tech", type = MatchingOptionType.CATEGORY, key = "technology", label = "Technology")
        val skill = MatchingOption(id = "skill-python", type = MatchingOptionType.SKILL, key = "python", label = "Python")
        val state = RecruiterSearchState(
            employmentType = RecruiterSearchEmploymentType.INTERNSHIP,
            selectedCategories = listOf(category),
            selectedSkills = listOf(skill),
        )
        val createSheet = RecruiterSaveSearchSheetState(name = "  ${state.defaultSaveName}  ")
        val updateSheet = RecruiterSaveSearchSheetState(name = " ", editingJobId = "job-1")

        assertEquals("Technology Python Internship", state.defaultSaveName)
        assertEquals("Saved candidate search", RecruiterSearchState().defaultSaveName)
        assertEquals("Save this search", state.saveDialogModeTitle)
        assertEquals("Save", state.saveDialogActionTitle)
        assertTrue(createSheet.canSave)
        assertEquals("Technology Python Internship", createSheet.trimmedName)
        assertFalse(updateSheet.canSave)
        assertEquals("Update saved search", updateSheet.modeTitle)
        assertEquals("Update Job", updateSheet.actionTitle)
        assertEquals("Name this saved search first.", updateSheet.validationMessage)
    }

    @Test
    fun nudgeTargetsMoveRecruiterThroughOptionalSectionsOnce() {
        val category = MatchingOption(id = "cat-tech", type = MatchingOptionType.CATEGORY, key = "technology", label = "Technology")
        val initial = RecruiterSearchState(employmentType = RecruiterSearchEmploymentType.INTERNSHIP)
        val nudgedToCategories = initial.markNudged(initial.nextNudgeTarget!!)
        val withCategory = nudgedToCategories.copy(selectedCategories = listOf(category))
        val nudgedToSkills = withCategory.markNudged(withCategory.nextNudgeTarget!!)

        assertEquals(RecruiterSearchNudgeTarget.CATEGORIES, initial.nextNudgeTarget)
        assertEquals(RecruiterSearchNudgeTarget.SKILLS, withCategory.nextNudgeTarget)
        assertNull(nudgedToSkills.nextNudgeTarget)
        assertNull(withCategory.copy(isCollapsed = true).nextNudgeTarget)
    }

    @Test
    fun runtimeResultsUseRuntimeApplicantAndScoreReasons() {
        val state = RuntimeSearchResultsState(
            hasRunSearch = true,
            results = listOf(
                RuntimeMatchResult(
                    applicant = RuntimeMatchApplicant(
                        id = "a1",
                        name = "Zoe",
                        major = "Computer Science",
                        universityName = "Stanford",
                        semesterLabel = "Sophomore / Semester 4",
                    ),
                    score = RuntimeMatchScore(
                        totalScore = 75,
                        reasons = listOf("Resume mentions Python", "Project matches backend"),
                        blockers = listOf("No internship evidence"),
                    ),
                )
            )
        )

        val row = state.rows.single()

        assertEquals("1 ranked candidates", state.title)
        assertEquals(1, row.rank)
        assertEquals("a1", row.applicantId)
        assertEquals("Zoe", row.displayName)
        assertEquals("Computer Science • Stanford • Sophomore / Semester 4", row.subtitle)
        assertEquals("75%", row.scoreLabel)
        assertEquals(listOf("Resume mentions Python", "Project matches backend"), row.reasonPreview)
        assertEquals(listOf("No internship evidence"), row.blockerPreview)
    }
}
