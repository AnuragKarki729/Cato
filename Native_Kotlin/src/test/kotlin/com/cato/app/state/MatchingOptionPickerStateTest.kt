package com.cato.app.state

import com.cato.app.core.MatchingOption
import com.cato.app.core.MatchingOptionType
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class MatchingOptionPickerStateTest {
    @Test
    fun showsAddResultWhenQueryHasNoOptionsOrExactSelection() {
        val state = MatchingOptionPickerState(
            title = "Skills",
            query = "Python",
            selected = emptyList(),
            options = emptyList(),
            maxSelections = 100,
            optionType = MatchingOptionType.SKILL,
        )

        assertTrue(state.shouldShowAddResult)
        assertEquals("Add skill: Python", state.addResultTitle)
        assertEquals("Skills", state.screenSpec.title)
        assertEquals("0/100", state.screenSpec.limitText)
        assertEquals("Add skill: Python", state.screenSpec.addResultTitle)
        assertNull(state.screenSpec.emptyResultText)
    }

    @Test
    fun hidesAddResultWhenExistingOptionsOrSelectedExactMatchExists() {
        val python = MatchingOption("skill:python", MatchingOptionType.SKILL, "python", "Python")
        val withOptions = MatchingOptionPickerState(
            title = "Skills",
            query = "Python",
            options = listOf(python),
            maxSelections = 100,
            optionType = MatchingOptionType.SKILL,
        )
        val selectedExact = withOptions.copy(options = emptyList(), selected = listOf(python))

        assertFalse(withOptions.shouldShowAddResult)
        assertNull(withOptions.addResultTitle)
        assertFalse(selectedExact.shouldShowAddResult)
        assertEquals(listOf("Python"), withOptions.screenSpec.visibleOptions.map { it.label })
        assertEquals("No available options.", selectedExact.screenSpec.emptyResultText)
    }

    @Test
    fun selectHonorsLimitAndSortsSelectedChipsAlphabetically() {
        val kotlin = MatchingOption("skill:kotlin", MatchingOptionType.SKILL, "kotlin", "Kotlin")
        val accounting = MatchingOption("skill:accounting", MatchingOptionType.SKILL, "accounting", "Accounting")
        val state = MatchingOptionPickerState(
            title = "Skills",
            maxSelections = 1,
            optionType = MatchingOptionType.SKILL,
        ).select(kotlin).select(accounting)

        assertEquals(listOf("Kotlin"), state.selected.map { it.label })
        assertEquals(listOf("Kotlin"), state.selectedChips.map { it.label })

        val sorted = state.copy(maxSelections = 2).select(accounting)
        assertEquals(listOf("Accounting", "Kotlin"), sorted.selectedChips.map { it.label })
        assertEquals(listOf("Accounting", "Kotlin"), sorted.screenSpec.selectedChips.map { it.label })
        assertEquals("2/2", sorted.screenSpec.limitText)
        assertTrue(sorted.screenSpec.isAtLimit)
    }

    @Test
    fun pickerScreenSpecPromptsForLongerSearchBeforeShowingAddResult() {
        val state = MatchingOptionPickerState(
            title = "Fields",
            query = "A",
            maxSelections = 10,
            optionType = MatchingOptionType.CATEGORY,
        )

        assertFalse(state.shouldShowAddResult)
        assertEquals("Type at least 2 characters to search or add.", state.screenSpec.emptyResultText)
    }
}
