package com.cato.app.core

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class AppleNonceTest {
    @Test
    fun generatesNonceUsingSwiftAllowedCharacterSet() {
        val nonce = AppleNonce.randomString(length = 64)
        val allowed = "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._".toSet()

        assertEquals(64, nonce.length)
        assertTrue(nonce.all { it in allowed })
    }

    @Test
    fun rejectsNonPositiveLength() {
        assertFailsWith<IllegalArgumentException> {
            AppleNonce.randomString(length = 0)
        }
    }

    @Test
    fun hashesNonceWithSha256Hex() {
        assertEquals(
            "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
            AppleNonce.sha256("hello"),
        )
    }
}
