package com.cato.app.ui

import java.time.Clock
import java.time.Instant
import java.time.ZoneId
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class CatoDesignTokensTest {
    @Test
    fun colorTokensUseAndroidArgbValuesMatchingSwiftTheme() {
        val colors = CatoDesignTokens.colors

        assertEquals(0xFF0D0D2E, colors.ink)
        assertEquals(0xFF6B6E8C, colors.muted)
        assertEquals(0xFF5A2EC2, colors.purple)
        assertEquals(0xFF301A7A, colors.purpleDeep)
        assertEquals(0xFFF0E8FF, colors.purpleSoft)
        assertEquals(0xFFF7F2FF, colors.lavender)
        assertEquals(0xFFF7FAFF, colors.background)
        assertEquals(0xFFFFFFFF, colors.card)
        assertEquals(0xFFE0E0F0, colors.border)
        assertTrue(colors.ink <= 0xFFFFFFFF)
        assertTrue(colors.purpleSoft <= 0xFFFFFFFF)
    }

    @Test
    fun spacingAndTypographyTokensMirrorSwiftTheme() {
        val spacing = CatoDesignTokens.spacing
        val typography = CatoDesignTokens.typography

        assertEquals(16, spacing.screenPaddingDp)
        assertEquals(14, spacing.cardPaddingDp)
        assertEquals(16, spacing.cornerRadiusDp)
        assertEquals(12, spacing.compactRadiusDp)
        assertEquals(28, typography.screenTitleSp)
        assertEquals(16, typography.sectionTitleSp)
        assertEquals(15, typography.cardTitleSp)
        assertEquals(14, typography.bodySp)
        assertEquals(12, typography.smallSp)
    }

    @Test
    fun chatTimestampMatchesSwiftTodayYesterdayAndFallbackSemantics() {
        val zone = ZoneId.of("UTC")
        val clock = Clock.fixed(Instant.parse("2026-09-17T12:00:00Z"), zone)

        assertEquals("Today, 9:30 AM", CatoDateText.chatTimestamp("2026-09-17T09:30:00Z", clock, zone))
        assertEquals("Today, 9:30 AM", CatoDateText.chatTimestamp("2026-09-17T09:30:00.123Z", clock, zone))
        assertEquals("Yesterday, 11:15 PM", CatoDateText.chatTimestamp("2026-09-16T23:15:00Z", clock, zone))
        assertEquals("Sep 10, 8:00 AM", CatoDateText.chatTimestamp("2026-09-10T08:00:00Z", clock, zone))
        assertEquals("not-a-date", CatoDateText.chatTimestamp("not-a-date", clock, zone))
    }
}
