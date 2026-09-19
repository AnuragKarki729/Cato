package com.cato.app.usecase

import com.cato.app.core.MatchingOptionRepository
import com.cato.app.core.MatchingOptionType
import com.cato.app.state.MatchingOptionPickerState

class LoadMatchingOptionsUseCase(
    private val repository: MatchingOptionRepository,
) {
    suspend operator fun invoke(
        accessToken: String,
        state: MatchingOptionPickerState,
    ): MatchingOptionPickerState {
        val options = repository.options(accessToken, state.optionType, state.trimmedQuery)
        return state.copy(options = options)
    }
}

class AddMatchingOptionUseCase(
    private val repository: MatchingOptionRepository,
) {
    suspend operator fun invoke(
        accessToken: String,
        type: MatchingOptionType,
        label: String,
    ) = repository.addOption(accessToken, type, label.trim())
}
