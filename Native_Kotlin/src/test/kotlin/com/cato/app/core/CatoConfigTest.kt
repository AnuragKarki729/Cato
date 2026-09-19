package com.cato.app.core

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class CatoConfigTest {
    @Test
    fun buildsConfigFromNativeKeys() {
        val config = CatoConfig.fromValues(
            mapOf(
                CatoConfig.SUPABASE_URL_KEY to "https://example.supabase.co",
                CatoConfig.SUPABASE_ANON_KEY to "anon",
                CatoConfig.API_BASE_URL_KEY to "http://192.168.1.75:4000",
            )
        )

        assertEquals("https://example.supabase.co", config.supabaseUrl)
        assertEquals("anon", config.supabaseAnonKey)
        assertEquals("http://192.168.1.75:4000", config.apiBaseUrl)
    }

    @Test
    fun rejectsMissingOrInvalidConfigValues() {
        val error = assertFailsWith<IllegalArgumentException> {
            CatoConfig.fromValues(
                mapOf(
                    CatoConfig.SUPABASE_URL_KEY to "not-a-url",
                    CatoConfig.SUPABASE_ANON_KEY to "anon",
                    CatoConfig.API_BASE_URL_KEY to "https://api.example.com",
                )
            )
        }

        assertTrue(error.message.orEmpty().contains("CATO_SUPABASE_URL"))
    }

    @Test
    fun authSessionExpiresWithSixtySecondLeeway() {
        val session = CatoAuthSession(
            accessToken = "access",
            refreshToken = "refresh",
            expiresAtEpochSeconds = 1_000,
            user = CatoSupabaseUser(id = "u", email = "u@example.com"),
        )

        assertFalse(session.isExpired(nowEpochSeconds = 900))
        assertTrue(session.isExpired(nowEpochSeconds = 940))
    }

    @Test
    fun supabaseAuthResponseConvertsExpiresInToAbsoluteSessionExpiryLikeSwift() {
        val response = SupabaseAuthResponse(
            accessToken = "access",
            refreshToken = "refresh",
            expiresInSeconds = 3_600,
            user = CatoSupabaseUser(id = "u", email = "u@example.com"),
        )

        val session = response.session(nowEpochSeconds = 10_000)

        assertEquals("access", session.accessToken)
        assertEquals("refresh", session.refreshToken)
        assertEquals(13_600, session.expiresAtEpochSeconds)
        assertEquals("u@example.com", session.user.email)
    }

    @Test
    fun errorResponsesChooseBestMessageLikeSwiftClients() {
        assertEquals(
            "Provider blocked",
            SupabaseErrorResponse(
                error = "invalid_request",
                errorDescription = "Provider blocked",
                message = "Message fallback",
                msg = "Msg fallback",
                code = "400",
            ).bestMessage,
        )
        assertEquals("Message fallback", SupabaseErrorResponse(message = "Message fallback", error = "error").bestMessage)
        assertEquals("Msg fallback", SupabaseErrorResponse(msg = "Msg fallback", error = "error").bestMessage)
        assertEquals("error", SupabaseErrorResponse(error = "error", code = "400").bestMessage)
        assertEquals("400", SupabaseErrorResponse(code = "400").bestMessage)
        assertEquals("Supabase request failed", SupabaseErrorResponse().bestMessage)

        assertEquals("Bad request", ApiErrorResponse(error = "Bad request", message = "Fallback").bestMessage)
        assertEquals("Fallback", ApiErrorResponse(message = "Fallback").bestMessage)
        assertEquals("API request failed", ApiErrorResponse().bestMessage)
    }
}
