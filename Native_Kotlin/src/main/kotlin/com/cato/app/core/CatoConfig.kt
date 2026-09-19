package com.cato.app.core

data class CatoConfig(
    val supabaseUrl: String,
    val supabaseAnonKey: String,
    val apiBaseUrl: String,
) {
    fun validate() {
        requireValidUrl("CATO_SUPABASE_URL", supabaseUrl)
        require(supabaseAnonKey.isNotBlank()) { "Missing CATO_SUPABASE_ANON_KEY. Add it to the native Android build configuration." }
        requireValidUrl("CATO_API_BASE_URL", apiBaseUrl)
    }

    companion object {
        const val SUPABASE_URL_KEY = "CATO_SUPABASE_URL"
        const val SUPABASE_ANON_KEY = "CATO_SUPABASE_ANON_KEY"
        const val API_BASE_URL_KEY = "CATO_API_BASE_URL"

        fun fromValues(values: Map<String, String?>): CatoConfig {
            val config = CatoConfig(
                supabaseUrl = values[SUPABASE_URL_KEY].orEmpty().trim(),
                supabaseAnonKey = values[SUPABASE_ANON_KEY].orEmpty().trim(),
                apiBaseUrl = values[API_BASE_URL_KEY].orEmpty().trim(),
            )
            config.validate()
            return config
        }
    }
}

private fun requireValidUrl(key: String, value: String) {
    require(value.isNotBlank()) { "Missing $key. Add it to the native Android build configuration." }
    require(value.startsWith("http://") || value.startsWith("https://")) { "$key must be a valid URL." }
}

data class CatoAuthSession(
    val accessToken: String,
    val refreshToken: String,
    val expiresAtEpochSeconds: Long,
    val user: CatoSupabaseUser,
) {
    fun isExpired(nowEpochSeconds: Long): Boolean {
        return nowEpochSeconds + 60 >= expiresAtEpochSeconds
    }
}

data class CatoSupabaseUser(
    val id: String,
    val email: String? = null,
)

data class SupabaseAuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val expiresInSeconds: Int,
    val user: CatoSupabaseUser,
) {
    fun session(nowEpochSeconds: Long): CatoAuthSession {
        return CatoAuthSession(
            accessToken = accessToken,
            refreshToken = refreshToken,
            expiresAtEpochSeconds = nowEpochSeconds + expiresInSeconds,
            user = user,
        )
    }
}

data class SupabaseErrorResponse(
    val error: String? = null,
    val errorDescription: String? = null,
    val msg: String? = null,
    val message: String? = null,
    val code: String? = null,
) {
    val bestMessage: String
        get() = errorDescription ?: message ?: msg ?: error ?: code ?: "Supabase request failed"
}

data class ApiErrorResponse(
    val error: String? = null,
    val message: String? = null,
) {
    val bestMessage: String
        get() = error ?: message ?: "API request failed"
}
