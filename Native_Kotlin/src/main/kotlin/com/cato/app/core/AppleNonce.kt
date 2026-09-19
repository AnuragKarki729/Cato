package com.cato.app.core

import java.security.MessageDigest
import java.security.SecureRandom

object AppleNonce {
    private const val CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._"
    private val secureRandom = SecureRandom()

    fun randomString(length: Int = 32): String {
        require(length > 0) { "Nonce length must be positive." }
        return buildString(length) {
            repeat(length) {
                append(CHARSET[secureRandom.nextInt(CHARSET.length)])
            }
        }
    }

    fun sha256(input: String): String {
        val digest = MessageDigest.getInstance("SHA-256").digest(input.toByteArray(Charsets.UTF_8))
        return digest.joinToString("") { byte -> "%02x".format(byte.toInt() and 0xff) }
    }
}
