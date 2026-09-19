package com.cato.app.core

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class OAuthPkceTest {
    @Test
    fun generatesVerifierWithinAllowedCharsetAndLength() {
        val verifier = OAuthPkce.codeVerifier(length = 64)

        assertEquals(64, verifier.length)
        assertTrue(verifier.all { it.isLetterOrDigit() || it in "-._~" })
    }

    @Test
    fun rejectsInvalidVerifierLength() {
        assertFailsWith<IllegalArgumentException> {
            OAuthPkce.codeVerifier(length = 20)
        }
    }

    @Test
    fun buildsBase64UrlSha256Challenge() {
        val challenge = OAuthPkce.codeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")

        assertEquals("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM", challenge)
    }
}
