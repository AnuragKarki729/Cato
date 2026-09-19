package com.cato.app.core

import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64

object OAuthPkce {
    private const val CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._~"
    private val secureRandom = SecureRandom()

    fun codeVerifier(length: Int = 64): String {
        require(length in 43..128) { "PKCE verifier length must be between 43 and 128 characters." }
        val builder = StringBuilder(length)

        while (builder.length < length) {
            val index = secureRandom.nextInt(CHARSET.length)
            builder.append(CHARSET[index])
        }

        return builder.toString()
    }

    fun codeChallenge(verifier: String): String {
        val digest = MessageDigest.getInstance("SHA-256")
            .digest(verifier.toByteArray(Charsets.UTF_8))
        return Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(digest)
    }
}
