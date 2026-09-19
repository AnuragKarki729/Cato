package com.cato.app.ui

import java.time.Clock
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

data class CatoColorTokens(
    val ink: Long = 0xFF0D0D2E,
    val muted: Long = 0xFF6B6E8C,
    val purple: Long = 0xFF5A2EC2,
    val purpleDeep: Long = 0xFF301A7A,
    val purpleSoft: Long = 0xFFF0E8FF,
    val lavender: Long = 0xFFF7F2FF,
    val background: Long = 0xFFF7FAFF,
    val card: Long = 0xFFFFFFFF,
    val border: Long = 0xFFE0E0F0,
)

data class CatoSpacingTokens(
    val screenPaddingDp: Int = 16,
    val cardPaddingDp: Int = 14,
    val cornerRadiusDp: Int = 16,
    val compactRadiusDp: Int = 12,
)

data class CatoTypographyTokens(
    val screenTitleSp: Int = 28,
    val sectionTitleSp: Int = 16,
    val cardTitleSp: Int = 15,
    val bodySp: Int = 14,
    val smallSp: Int = 12,
)

object CatoDesignTokens {
    val colors = CatoColorTokens()
    val spacing = CatoSpacingTokens()
    val typography = CatoTypographyTokens()
}

enum class CatoButtonKind {
    PRIMARY,
    SECONDARY,
    DANGER,
    ICON,
}

data class CatoButtonSpec(
    val label: String,
    val iconName: String? = null,
    val kind: CatoButtonKind = CatoButtonKind.PRIMARY,
    val enabled: Boolean = true,
    val iconOnly: Boolean = false,
)

object CatoDateText {
    private val timeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("h:mm a", Locale.US)
    private val shortDateFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("MMM d", Locale.US)

    fun chatTimestamp(
        value: String,
        clock: Clock = Clock.systemDefaultZone(),
        zoneId: ZoneId = clock.zone,
    ): String {
        val instant = runCatching { Instant.parse(value) }.getOrNull()
            ?: return value.take(10)
        val dateTime = ZonedDateTime.ofInstant(instant, zoneId)
        val today = LocalDate.now(clock.withZone(zoneId))
        val date = dateTime.toLocalDate()
        val time = dateTime.format(timeFormatter)

        return when (date) {
            today -> "Today, $time"
            today.minusDays(1) -> "Yesterday, $time"
            else -> "${dateTime.format(shortDateFormatter)}, $time"
        }
    }
}
