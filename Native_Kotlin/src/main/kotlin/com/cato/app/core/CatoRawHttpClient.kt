package com.cato.app.core

import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

data class RawApiResponse(
    val statusCode: Int,
    val body: String,
) {
    val isSuccessful: Boolean
        get() = statusCode in 200..299
}

class CatoRawHttpClient(
    private val baseUrl: String,
) {
    fun execute(accessToken: String, request: ApiRequestSpec): RawApiResponse {
        val url = URL(baseUrl.trimEnd('/') + request.path)
        val connection = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = request.method
            connectTimeout = 15_000
            readTimeout = 30_000
            setRequestProperty("Authorization", "Bearer $accessToken")
            setRequestProperty("Accept", "application/json")
        }

        if (request.method != "GET" && request.method != "DELETE") {
            val body = JsonBodyWriter.write(request.body)
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
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
