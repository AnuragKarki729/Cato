package com.cato.app.state

import com.cato.app.core.MatchingOption
import com.cato.app.core.MatchingOptionType

data class MatchingOptionPickerState(
    val title: String,
    val query: String = "",
    val selected: List<MatchingOption> = emptyList(),
    val options: List<MatchingOption> = emptyList(),
    val maxSelections: Int,
    val optionType: MatchingOptionType,
) {
    val screenSpec: MatchingOptionPickerScreenSpec
        get() = MatchingOptionPickerScreenSpec(
            title = title,
            query = query,
            limitText = limitText,
            selectedChips = selectedChips,
            visibleOptions = visibleOptions,
            addResultTitle = addResultTitle,
            isAtLimit = isAtLimit,
            emptyResultText = if (trimmedQuery.length < 2) {
                "Type at least 2 characters to search or add."
            } else if (visibleOptions.isEmpty() && addResultTitle == null) {
                "No available options."
            } else {
                null
            },
        )

    val limitText: String
        get() = "${selected.size}/$maxSelections"

    val isAtLimit: Boolean
        get() = selected.size >= maxSelections

    val selectedChips: List<MatchingOption>
        get() = selected.sortedBy { it.label.lowercase() }

    val visibleOptions: List<MatchingOption>
        get() = options
            .filterNot { option -> selected.any { it.key == option.key && it.type == option.type } }
            .take(10)

    val trimmedQuery: String
        get() = query.trim()

    val shouldShowAddResult: Boolean
        get() {
            if (trimmedQuery.length < 2 || options.isNotEmpty()) return false
            return selected.none { it.label.equals(trimmedQuery, ignoreCase = true) }
        }

    val addResultTitle: String?
        get() {
            if (!shouldShowAddResult) return null
            val singular = if (optionType == MatchingOptionType.SKILL) "skill" else "field"
            return "Add $singular: $trimmedQuery"
        }

    fun select(option: MatchingOption): MatchingOptionPickerState {
        if (selected.any { it.key == option.key && it.type == option.type }) return this
        if (isAtLimit) return this
        return copy(selected = selected + option)
    }

    fun remove(option: MatchingOption): MatchingOptionPickerState {
        return copy(selected = selected.filterNot { it.key == option.key && it.type == option.type })
    }
}

data class MatchingOptionPickerScreenSpec(
    val title: String,
    val query: String,
    val limitText: String,
    val selectedChips: List<MatchingOption>,
    val visibleOptions: List<MatchingOption>,
    val addResultTitle: String?,
    val isAtLimit: Boolean,
    val emptyResultText: String?,
)
