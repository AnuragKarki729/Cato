package com.cato.nativeandroid

import android.content.Context
import com.cato.app.core.CatoAuthSession
import com.cato.app.core.ApiRequestSpec
import com.cato.app.core.CatoConfig
import com.cato.app.core.CatoRawHttpClient
import com.cato.app.core.CatoRole
import com.cato.app.core.CatoSseEvent
import com.cato.app.core.CatoSseParser
import com.cato.app.core.CatoSupabaseUser
import com.cato.app.core.RawApiResponse
import com.cato.app.core.SupabaseAuthContract
import com.cato.app.core.SupabaseRawHttpClient
import com.cato.app.usecase.AuthSessionRepository
import java.io.BufferedReader
import java.io.ByteArrayOutputStream
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

class CatoAndroidRuntime(context: Context) {
    val sessionStore: CatoAndroidSessionStore = CatoAndroidSessionStore(context)

    fun loadConfig(): Result<CatoConfig> {
        return runCatching {
            CatoConfig.fromValues(
                mapOf(
                    CatoConfig.SUPABASE_URL_KEY to BuildConfig.CATO_SUPABASE_URL,
                    CatoConfig.SUPABASE_ANON_KEY to BuildConfig.CATO_SUPABASE_ANON_KEY,
                    CatoConfig.API_BASE_URL_KEY to BuildConfig.CATO_API_BASE_URL,
                ),
            )
        }
    }

    fun catoClient(): Result<CatoRawHttpClient> {
        return loadConfig().map { config -> CatoRawHttpClient(config.apiBaseUrl) }
    }

    fun supabaseClient(): Result<SupabaseRawHttpClient> {
        return loadConfig().map { config -> SupabaseRawHttpClient(config.supabaseUrl, config.supabaseAnonKey) }
    }
}

class CatoAndroidSessionStore(context: Context) : AuthSessionRepository {
    private val preferences = context.getSharedPreferences("cato_auth_session", Context.MODE_PRIVATE)

    override suspend fun load(): CatoAuthSession? {
        val accessToken = preferences.getString(KEY_ACCESS_TOKEN, null)?.takeIf { it.isNotBlank() } ?: return null
        val refreshToken = preferences.getString(KEY_REFRESH_TOKEN, null)?.takeIf { it.isNotBlank() } ?: return null
        val userId = preferences.getString(KEY_USER_ID, null)?.takeIf { it.isNotBlank() } ?: return null
        val expiresAt = preferences.getLong(KEY_EXPIRES_AT, 0L).takeIf { it > 0L } ?: return null
        val email = preferences.getString(KEY_EMAIL, null)

        return CatoAuthSession(
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresAtEpochSeconds = expiresAt,
            user = CatoSupabaseUser(id = userId, email = email),
        )
    }

    override suspend fun save(session: CatoAuthSession) {
        preferences.edit()
            .putString(KEY_ACCESS_TOKEN, session.accessToken)
            .putString(KEY_REFRESH_TOKEN, session.refreshToken)
            .putLong(KEY_EXPIRES_AT, session.expiresAtEpochSeconds)
            .putString(KEY_USER_ID, session.user.id)
            .putString(KEY_EMAIL, session.user.email)
            .apply()
    }

    override suspend fun clear() {
        preferences.edit().clear().apply()
    }

    fun clearSynchronously() {
        preferences.edit().clear().apply()
    }

    fun saveSynchronously(session: CatoAuthSession) {
        preferences.edit()
            .putString(KEY_ACCESS_TOKEN, session.accessToken)
            .putString(KEY_REFRESH_TOKEN, session.refreshToken)
            .putLong(KEY_EXPIRES_AT, session.expiresAtEpochSeconds)
            .putString(KEY_USER_ID, session.user.id)
            .putString(KEY_EMAIL, session.user.email)
            .apply()
    }

    fun accessTokenSynchronously(): String? {
        return preferences.getString(KEY_ACCESS_TOKEN, null)?.takeIf { it.isNotBlank() }
    }

    fun refreshTokenSynchronously(): String? {
        return preferences.getString(KEY_REFRESH_TOKEN, null)?.takeIf { it.isNotBlank() }
    }

    fun isExpiredSynchronously(): Boolean {
        val expiresAt = preferences.getLong(KEY_EXPIRES_AT, 0L)
        if (expiresAt <= 0L) return true
        val now = System.currentTimeMillis() / 1000L
        return now + 60 >= expiresAt
    }

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_EXPIRES_AT = "expires_at"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_EMAIL = "email"
    }
}

class CatoAndroidApiGateway(
    private val runtime: CatoAndroidRuntime,
) {
    @Volatile
    private var isEventStreamConnecting = false

    fun signInWithPassword(
        email: String,
        password: String,
        selectedRole: CatoRole,
        onResult: (Result<CatoRole>) -> Unit,
    ) {
        if (email.isBlank() || password.isBlank()) {
            onResult(Result.failure(IllegalArgumentException("Email and password are required.")))
            return
        }

        Thread {
            val result = runCatching {
                val supabase = runtime.supabaseClient().getOrThrow()
                val response = supabase.execute(SupabaseAuthContract.signInWithPassword(email.trim(), password))
                if (!response.isSuccessful) {
                    throw IllegalStateException(CatoAndroidJson.firstError(response.body))
                }
                val session = sessionFromSupabaseBody(response.body)
                runtime.sessionStore.saveSynchronously(session)
                val role = resolveRole(session.accessToken, selectedRole)
                role
            }
            onResult(result)
        }.start()
    }

    fun exchangeGooglePkceCode(
        code: String,
        codeVerifier: String,
        selectedRole: CatoRole,
        onResult: (Result<CatoRole>) -> Unit,
    ) {
        if (code.isBlank() || codeVerifier.isBlank()) {
            onResult(Result.failure(IllegalArgumentException("Google sign-in callback was incomplete.")))
            return
        }

        Thread {
            val result = runCatching {
                val supabase = runtime.supabaseClient().getOrThrow()
                val response = supabase.execute(SupabaseAuthContract.exchangePkceCode(code, codeVerifier))
                if (!response.isSuccessful) {
                    throw IllegalStateException(CatoAndroidJson.firstError(response.body))
                }
                val session = sessionFromSupabaseBody(response.body)
                runtime.sessionStore.saveSynchronously(session)
                resolveRole(session.accessToken, selectedRole)
            }
            onResult(result)
        }.start()
    }

    fun signInWithGoogleIdToken(
        idToken: String,
        selectedRole: CatoRole,
        onResult: (Result<CatoRole>) -> Unit,
    ) {
        if (idToken.isBlank()) {
            onResult(Result.failure(IllegalArgumentException("Google did not return an ID token.")))
            return
        }

        Thread {
            val result = runCatching {
                val supabase = runtime.supabaseClient().getOrThrow()
                val response = supabase.execute(SupabaseAuthContract.signInWithGoogleIdToken(idToken))
                if (!response.isSuccessful) {
                    throw IllegalStateException(CatoAndroidJson.firstError(response.body))
                }
                val session = sessionFromSupabaseBody(response.body)
                runtime.sessionStore.saveSynchronously(session)
                resolveRole(session.accessToken, selectedRole)
            }
            onResult(result)
        }.start()
    }

    fun executeCato(
        request: ApiRequestSpec,
        onResult: (Result<RawApiResponse>) -> Unit,
    ) {
        val accessToken = runtime.sessionStore.accessTokenSynchronously()
        if (accessToken == null) {
            onResult(Result.failure(IllegalStateException("No local session exists yet.")))
            return
        }

        Thread {
            val result = runCatching {
                val client = runtime.catoClient().getOrThrow()
                client.execute(accessToken = accessToken, request = request)
            }
            onResult(result)
        }.start()
    }

    fun uploadCloudinaryVideo(
        preparationBody: String,
        videoBytes: ByteArray,
        contentType: String,
        fileName: String,
        onResult: (Result<CatoAndroidCloudinaryUploadResult>) -> Unit,
    ) {
        Thread {
            val result = runCatching {
                val uploadUrl = CatoAndroidJson.stringValue(preparationBody, "uploadUrl")
                    ?: throw IllegalStateException("Upload URL was missing.")
                val fields = linkedMapOf(
                    "api_key" to requirePreparationField(preparationBody, "apiKey"),
                    "timestamp" to requirePreparationField(preparationBody, "timestamp"),
                    "signature" to requirePreparationField(preparationBody, "signature"),
                    "folder" to requirePreparationField(preparationBody, "folder"),
                    "public_id" to requirePreparationField(preparationBody, "publicId"),
                )
                val boundary = "Boundary-${UUID.randomUUID()}"
                val body = ByteArrayOutputStream().use { output ->
                    fields.forEach { (name, value) ->
                        output.write("--$boundary\r\n".toByteArray())
                        output.write("Content-Disposition: form-data; name=\"$name\"\r\n\r\n".toByteArray())
                        output.write("$value\r\n".toByteArray())
                    }
                    output.write("--$boundary\r\n".toByteArray())
                    output.write("Content-Disposition: form-data; name=\"file\"; filename=\"$fileName\"\r\n".toByteArray())
                    output.write("Content-Type: $contentType\r\n\r\n".toByteArray())
                    output.write(videoBytes)
                    output.write("\r\n--$boundary--\r\n".toByteArray())
                    output.toByteArray()
                }

                val connection = (URL(uploadUrl).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    doOutput = true
                    connectTimeout = 30_000
                    readTimeout = 60_000
                    setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
                    setRequestProperty("Content-Length", body.size.toString())
                }
                connection.outputStream.use { it.write(body) }
                val responseBody = if (connection.responseCode in 200..299) {
                    connection.inputStream.bufferedReader().use { it.readText() }
                } else {
                    connection.errorStream?.bufferedReader()?.use { it.readText() }.orEmpty()
                }
                if (connection.responseCode !in 200..299) {
                    throw IllegalStateException(CatoAndroidJson.firstError(responseBody))
                }
                connection.disconnect()
                CatoAndroidCloudinaryUploadResult(
                    publicId = CatoAndroidJson.stringValue(responseBody, "public_id")
                        ?: CatoAndroidJson.stringValue(responseBody, "publicId")
                        ?: requirePreparationField(preparationBody, "publicId"),
                    secureUrl = CatoAndroidJson.stringValue(responseBody, "secure_url")
                        ?: CatoAndroidJson.stringValue(responseBody, "secureUrl")
                        ?: throw IllegalStateException("Cloudinary secure URL was missing."),
                    bytes = CatoAndroidJson.intValue(responseBody, "bytes"),
                )
            }
            onResult(result)
        }.start()
    }

    fun refreshStoredSession(onResult: (Result<Unit>) -> Unit) {
        val refreshToken = runtime.sessionStore.refreshTokenSynchronously()
        if (refreshToken == null) {
            onResult(Result.failure(IllegalStateException("No refresh token exists.")))
            return
        }

        Thread {
            val result = runCatching {
                val supabase = runtime.supabaseClient().getOrThrow()
                val response = supabase.execute(SupabaseAuthContract.refreshSession(refreshToken))
                if (!response.isSuccessful) {
                    throw IllegalStateException(CatoAndroidJson.firstError(response.body))
                }
                runtime.sessionStore.saveSynchronously(sessionFromSupabaseBody(response.body))
            }
            onResult(result)
        }.start()
    }

    fun connectEvents(
        role: CatoRole,
        onEvent: (CatoSseEvent) -> Unit,
        onError: (Throwable) -> Unit,
    ) {
        if (isEventStreamConnecting) return
        val accessToken = runtime.sessionStore.accessTokenSynchronously()
        if (accessToken == null) {
            onError(IllegalStateException("No local session exists yet."))
            return
        }
        isEventStreamConnecting = true
        Thread {
            try {
                val config = runtime.loadConfig().getOrThrow()
                val request = com.cato.app.core.CatoApiContract.eventStream(role, accessToken)
                val connection = (URL(config.apiBaseUrl.trimEnd('/') + request.path).openConnection() as HttpURLConnection).apply {
                    requestMethod = request.method
                    connectTimeout = 15_000
                    readTimeout = 0
                    request.headers.forEach { (key, value) -> setRequestProperty(key, value) }
                }
                val parser = CatoSseParser()
                connection.inputStream.use { input ->
                    BufferedReader(InputStreamReader(input, Charsets.UTF_8)).forEachLine { line ->
                        parser.receive("$line\n").forEach(onEvent)
                    }
                }
                connection.disconnect()
            } catch (error: Throwable) {
                onError(error)
            } finally {
                isEventStreamConnecting = false
            }
        }.start()
    }

    private fun resolveRole(accessToken: String, selectedRole: CatoRole): CatoRole {
        val client = runtime.catoClient().getOrThrow()
        val roleResponse = client.execute(accessToken, com.cato.app.core.CatoApiContract.getRole())
        val existingRole = if (roleResponse.isSuccessful) {
            CatoRole.entries.firstOrNull { it.wireValue == CatoAndroidJson.stringValue(roleResponse.body, "role") }
        } else {
            null
        }
        val role = existingRole ?: selectedRole
        if (existingRole == null) {
            val claim = client.execute(accessToken, com.cato.app.core.CatoApiContract.claimRole(role))
            if (!claim.isSuccessful) {
                throw IllegalStateException(CatoAndroidJson.firstError(claim.body))
            }
        }
        val sync = client.execute(accessToken, com.cato.app.core.CatoApiContract.syncRole(role))
        if (!sync.isSuccessful) {
            throw IllegalStateException(CatoAndroidJson.firstError(sync.body))
        }
        return role
    }

    private fun requirePreparationField(body: String, key: String): String {
        return CatoAndroidJson.stringValue(body, key)
            ?: CatoAndroidJson.intValue(body, key)?.toString()
            ?: throw IllegalStateException("$key was missing from upload preparation.")
    }

    private fun sessionFromSupabaseBody(body: String): CatoAuthSession {
        val accessToken = CatoAndroidJson.stringValue(body, "access_token")
            ?: throw IllegalStateException("Supabase did not return an access token.")
        val refreshToken = CatoAndroidJson.stringValue(body, "refresh_token")
            ?: throw IllegalStateException("Supabase did not return a refresh token.")
        val expiresIn = CatoAndroidJson.intValue(body, "expires_in") ?: 3600
        val userBody = CatoAndroidJson.objectValue(body, "user") ?: body
        val userId = CatoAndroidJson.stringValue(userBody, "id")
            ?: CatoAndroidJson.stringValue(body, "user_id")
            ?: throw IllegalStateException("Supabase did not return a user id.")
        val userEmail = CatoAndroidJson.stringValue(userBody, "email")
            ?: CatoAndroidJson.stringValue(body, "email")
        val now = System.currentTimeMillis() / 1000L
        return CatoAuthSession(
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresAtEpochSeconds = now + expiresIn,
            user = CatoSupabaseUser(id = userId, email = userEmail),
        )
    }
}

data class CatoAndroidCloudinaryUploadResult(
    val publicId: String,
    val secureUrl: String,
    val bytes: Int?,
)
