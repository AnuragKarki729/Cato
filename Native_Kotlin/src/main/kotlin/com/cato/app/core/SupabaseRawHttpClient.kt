package com.cato.app.core

import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

class SupabaseRawHttpClient(
    private val supabaseUrl: String,
    private val anonKey: String,
) {
    fun execute(request: SupabaseRequestSpec): RawApiResponse {
        val url = URL(supabaseUrl.trimEnd('/') + request.pathWithQuery)
        val bearer = request.accessToken ?: anonKey
        val connection = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = request.method
            connectTimeout = 15_000
            readTimeout = 30_000
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "application/json")
            setRequestProperty("apikey", anonKey)
            setRequestProperty("Authorization", "Bearer $bearer")
        }

        if (request.method != "GET" && request.method != "DELETE") {
            val body = JsonBodyWriter.write(request.body)
            connection.doOutput = true
            connection.outputStream.use { output ->
                output.write(body.toByteArray(Charsets.UTF_8))
            }
        }

        val status = connection.responseCode
        val stream = if (status in 200..299) connection.inputStream else connection.errorStream
        val body = stream?.use { input ->
            BufferedReader(InputStreamReader(input, Charsets.UTF_8)).readText()
        }.orEmpty()
        connection.disconnect()
        return RawApiResponse(statusCode = status, body = body)
    }
}
