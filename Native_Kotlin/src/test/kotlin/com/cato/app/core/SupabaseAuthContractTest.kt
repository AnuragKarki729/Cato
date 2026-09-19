package com.cato.app.core

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class SupabaseAuthContractTest {
    @Test
    fun buildsPasswordAndRefreshGrantRequests() {
        val password = SupabaseAuthContract.signInWithPassword("a@example.com", "secret")
        val refresh = SupabaseAuthContract.refreshSession("refresh-token")

        assertEquals("/auth/v1/token?grant_type=password", password.pathWithQuery)
        assertEquals("a@example.com", password.body["email"])
        assertEquals("/auth/v1/token?grant_type=refresh_token", refresh.pathWithQuery)
        assertEquals("refresh-token", refresh.body["refresh_token"])
    }

    @Test
    fun buildsAppleAndPkceGrantRequests() {
        val apple = SupabaseAuthContract.signInWithApple("id-token", "nonce")
        val google = SupabaseAuthContract.signInWithGoogleIdToken("google-id-token", nonce = "google-nonce")
        val googleWithoutNonce = SupabaseAuthContract.signInWithGoogleIdToken("google-id-token")
        val pkce = SupabaseAuthContract.exchangePkceCode("code", "verifier")

        assertEquals("/auth/v1/token?grant_type=id_token", apple.pathWithQuery)
        assertEquals("apple", apple.body["provider"])
        assertEquals("nonce", apple.body["nonce"])
        assertEquals("/auth/v1/token?grant_type=id_token", google.pathWithQuery)
        assertEquals("google", google.body["provider"])
        assertEquals("google-id-token", google.body["id_token"])
        assertEquals("google-nonce", google.body["nonce"])
        assertTrue(!googleWithoutNonce.body.containsKey("nonce"))
        assertEquals("/auth/v1/token?grant_type=pkce", pkce.pathWithQuery)
        assertEquals("code", pkce.body["auth_code"])
    }

    @Test
    fun buildsGoogleAuthorizePathLikeSwift() {
        val path = SupabaseAuthContract.googleAuthorizePath(
            redirectTo = "cato://auth/callback",
            codeChallenge = "challenge",
        )

        assertTrue(path.startsWith("/auth/v1/authorize?"))
        assertTrue(path.contains("provider=google"))
        assertTrue(path.contains("redirect_to=cato%3A%2F%2Fauth%2Fcallback"))
        assertTrue(path.contains("code_challenge=challenge"))
        assertTrue(path.contains("code_challenge_method=s256"))
        assertTrue(path.contains("prompt=select_account"))
    }

    @Test
    fun buildsUserNameUpdateRequest() {
        val request = SupabaseAuthContract.updateUserName("access", "Zoe Chen")

        assertEquals("PUT", request.method)
        assertEquals("/auth/v1/user", request.path)
        assertEquals("access", request.accessToken)
        assertTrue(request.body["data"] is Map<*, *>)
    }

    @Test
    fun parsesGoogleOAuthCallbackLikeSwift() {
        val success = GoogleOAuthCallbackParser.parse("cato://auth/callback?code=abc%20123")
        val providerError = GoogleOAuthCallbackParser.parse("cato://auth/callback?error_description=Access+blocked")
        val missingCode = GoogleOAuthCallbackParser.parse("cato://auth/callback?state=done")

        assertTrue(success is GoogleOAuthCallbackResult.Success)
        assertEquals("abc 123", (success as GoogleOAuthCallbackResult.Success).code)
        assertTrue(providerError is GoogleOAuthCallbackResult.Failure)
        assertEquals("Access blocked", (providerError as GoogleOAuthCallbackResult.Failure).message)
        assertTrue(missingCode is GoogleOAuthCallbackResult.Failure)
        assertEquals("Google sign-in did not return an auth code.", (missingCode as GoogleOAuthCallbackResult.Failure).message)
    }
}
