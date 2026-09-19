package com.cato.app.usecase

import com.cato.app.core.MatchingOption
import com.cato.app.core.MatchingOptionRepository
import com.cato.app.core.MatchingOptionType
import com.cato.app.state.MatchingOptionPickerState
import kotlin.coroutines.Continuation
import kotlin.coroutines.EmptyCoroutineContext
import kotlin.coroutines.startCoroutine
import kotlin.test.Test
import kotlin.test.assertEquals

class MatchingOptionUseCasesTest {
    @Test
    fun loadOptionsUsesTrimmedQueryAndUpdatesPickerState() = runSuspend {
        val repository = FakeMatchingOptionRepository(
            options = listOf(MatchingOption("skill:kotlin", MatchingOptionType.SKILL, "kotlin", "Kotlin"))
        )
        val state = MatchingOptionPickerState(
            title = "Skills",
            query = "  kot  ",
            maxSelections = 100,
            optionType = MatchingOptionType.SKILL,
        )

        val updated = LoadMatchingOptionsUseCase(repository)("token", state)

        assertEquals("token", repository.lastOptionsToken)
        assertEquals(MatchingOptionType.SKILL, repository.lastOptionsType)
        assertEquals("kot", repository.lastOptionsQuery)
        assertEquals(listOf("Kotlin"), updated.options.map { it.label })
    }

    @Test
    fun addOptionTrimsLabelBeforeCallingRepository() = runSuspend {
        val repository = FakeMatchingOptionRepository()

        val option = AddMatchingOptionUseCase(repository)("token", MatchingOptionType.CATEGORY, "  Medicine  ")

        assertEquals("Medicine", repository.lastAddedLabel)
        assertEquals(MatchingOptionType.CATEGORY, repository.lastAddedType)
        assertEquals("Medicine", option.label)
    }
}

private class FakeMatchingOptionRepository(
    private val options: List<MatchingOption> = emptyList(),
) : MatchingOptionRepository {
    var lastOptionsToken: String? = null
    var lastOptionsType: MatchingOptionType? = null
    var lastOptionsQuery: String? = null
    var lastAddedType: MatchingOptionType? = null
    var lastAddedLabel: String? = null

    override suspend fun options(accessToken: String, type: MatchingOptionType, query: String): List<MatchingOption> {
        lastOptionsToken = accessToken
        lastOptionsType = type
        lastOptionsQuery = query
        return options
    }

    override suspend fun addOption(accessToken: String, type: MatchingOptionType, label: String): MatchingOption {
        lastAddedType = type
        lastAddedLabel = label
        return MatchingOption("${type.wireValue}:${label.lowercase()}", type, label.lowercase(), label)
    }
}

private fun runSuspend(block: suspend () -> Unit) {
    var failure: Throwable? = null
    block.startCoroutine(
        object : Continuation<Unit> {
            override val context = EmptyCoroutineContext
            override fun resumeWith(result: Result<Unit>) {
                failure = result.exceptionOrNull()
            }
        }
    )
    failure?.let { throw it }
}
