package com.cato.app.core

import java.net.URLEncoder
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

data class SupabaseRequestSpec(
    val method: String,
    val path: String,
    val query: Map<String, String> = emptyMap(),
    val body: Map<String, Any?> = emptyMap(),
    val accessToken: String? = null,
) {
    val pathWithQuery: String
        get() {
            if (query.isEmpty()) return path
            return path + "?" + query.entries.joinToString("&") { (key, value) ->
                "${key.urlQuery()}=${value.urlQuery()}"
            }
        }
}

object SupabaseAuthContract {
    const val TOKEN_PATH = "/auth/v1/token"
    const val AUTHORIZE_PATH = "/auth/v1/authorize"
    const val USER_PATH = "/auth/v1/user"

    fun signInWithPassword(email: String, password: String): SupabaseRequestSpec {
        return SupabaseRequestSpec(
            method = "POST",
            path = TOKEN_PATH,
            query = mapOf("grant_type" to "password"),
            body = mapOf("email" to email, "password" to password),
        )
    }

    fun signInWithApple(identityToken: String, rawNonce: String): SupabaseRequestSpec {
        return SupabaseRequestSpec(
            method = "POST",
            path = TOKEN_PATH,
            query = mapOf("grant_type" to "id_token"),
            body = mapOf(
                "provider" to "apple",
                "id_token" to identityToken,
                "nonce" to rawNonce,
            ),
        )
    }

    fun signInWithGoogleIdToken(idToken: String, nonce: String? = null): SupabaseRequestSpec {
        return SupabaseRequestSpec(
            method = "POST",
            path = TOKEN_PATH,
            query = mapOf("grant_type" to "id_token"),
            body = buildMap {
                put("provider", "google")
                put("id_token", idToken)
                nonce?.takeIf { it.isNotBlank() }?.let { put("nonce", it) }
            },
        )
    }

    fun googleAuthorizePath(redirectTo: String, codeChallenge: String): String {
        return SupabaseRequestSpec(
            method = "GET",
            path = AUTHORIZE_PATH,
            query = linkedMapOf(
                "provider" to "google",
                "redirect_to" to redirectTo,
                "code_challenge" to codeChallenge,
                "code_challenge_method" to "s256",
                "prompt" to "select_account",
            ),
        ).pathWithQuery
    }

    fun exchangePkceCode(code: String, codeVerifier: String): SupabaseRequestSpec {
        return SupabaseRequestSpec(
            method = "POST",
            path = TOKEN_PATH,
            query = mapOf("grant_type" to "pkce"),
            body = mapOf("auth_code" to code, "code_verifier" to codeVerifier),
        )
    }

    fun refreshSession(refreshToken: String): SupabaseRequestSpec {
        return SupabaseRequestSpec(
            method = "POST",
            path = TOKEN_PATH,
            query = mapOf("grant_type" to "refresh_token"),
            body = mapOf("refresh_token" to refreshToken),
        )
    }

    fun updateUserName(accessToken: String, fullName: String): SupabaseRequestSpec {
        return SupabaseRequestSpec(
            method = "PUT",
            path = USER_PATH,
            body = mapOf(
                "data" to mapOf(
                    "full_name" to fullName,
                    "name" to fullName,
                ),
            ),
            accessToken = accessToken,
        )
    }
}

sealed class GoogleOAuthCallbackResult {
    data class Success(val code: String) : GoogleOAuthCallbackResult()
    data class Failure(val message: String) : GoogleOAuthCallbackResult()
}

object GoogleOAuthCallbackParser {
    fun parse(callbackUrl: String): GoogleOAuthCallbackResult {
        val query = callbackUrl.substringAfter("?", missingDelimiterValue = "")
            .substringBefore("#")
        val values = query.split("&")
            .filter { it.isNotBlank() }
            .mapNotNull { item ->
                val key = item.substringBefore("=", missingDelimiterValue = "").takeIf { it.isNotBlank() } ?: return@mapNotNull null
                val value = item.substringAfter("=", missingDelimiterValue = "")
                key.urlDecode() to value.urlDecode()
            }
            .toMap()

        values["error_description"]?.takeIf { it.isNotBlank() }?.let {
            return GoogleOAuthCallbackResult.Failure(it)
        }

        val code = values["code"]?.takeIf { it.isNotBlank() }
            ?: return GoogleOAuthCallbackResult.Failure("Google sign-in did not return an auth code.")
        return GoogleOAuthCallbackResult.Success(code)
    }
}

private fun String.urlQuery(): String = URLEncoder.encode(this, StandardCharsets.UTF_8.toString())

private fun String.urlDecode(): String = URLDecoder.decode(this, StandardCharsets.UTF_8.toString())
