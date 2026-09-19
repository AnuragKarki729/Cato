package com.cato.nativeandroid

object CatoAndroidJson {
    fun firstError(body: String): String {
        return stringValue(body, "error_description")
            ?: stringValue(body, "message")
            ?: stringValue(body, "msg")
            ?: stringValue(body, "error")
            ?: stringValue(body, "code")
            ?: "Request failed."
    }

    fun stringValue(body: String, key: String): String? {
        val pattern = Regex(""""${Regex.escape(key)}"\s*:\s*"((?:\\.|[^"\\])*)"""")
        return pattern.find(body)?.groupValues?.getOrNull(1)?.jsonUnescape()
    }

    fun intValue(body: String, key: String): Int? {
        val pattern = Regex(""""${Regex.escape(key)}"\s*:\s*(-?\d+)""")
        return pattern.find(body)?.groupValues?.getOrNull(1)?.toIntOrNull()
    }

    fun doubleValue(body: String, key: String): Double? {
        val pattern = Regex(""""${Regex.escape(key)}"\s*:\s*(-?\d+(?:\.\d+)?)""")
        return pattern.find(body)?.groupValues?.getOrNull(1)?.toDoubleOrNull()
    }

    fun booleanValue(body: String, key: String): Boolean? {
        val pattern = Regex(""""${Regex.escape(key)}"\s*:\s*(true|false)""")
        return pattern.find(body)?.groupValues?.getOrNull(1)?.toBooleanStrictOrNull()
    }

    fun countArrayItems(body: String, key: String): Int? {
        val startPattern = Regex(""""${Regex.escape(key)}"\s*:\s*\[""")
        val match = startPattern.find(body) ?: return null
        var depth = 0
        var count = 0
        var hasItem = false
        var inString = false
        var escaped = false
        var index = match.range.last
        while (index < body.length) {
            val char = body[index]
            when {
                escaped -> escaped = false
                char == '\\' && inString -> escaped = true
                char == '"' -> inString = !inString
                !inString && char == '[' -> depth += 1
                !inString && char == ']' -> {
                    depth -= 1
                    if (depth == 0) {
                        return if (hasItem) count + 1 else 0
                    }
                }
                !inString && char == ',' && depth == 1 -> {
                    count += 1
                    hasItem = false
                }
                !inString && !char.isWhitespace() && depth == 1 -> hasItem = true
            }
            index += 1
        }
        return null
    }

    fun objectArray(body: String, key: String): List<String> {
        val startPattern = Regex(""""${Regex.escape(key)}"\s*:\s*\[""")
        val match = startPattern.find(body) ?: return if (body.trimStart().startsWith("[")) topLevelObjects(body) else emptyList()
        return objectsFromArray(body, match.range.last)
    }

    fun stringArray(body: String, key: String): List<String> {
        val startPattern = Regex(""""${Regex.escape(key)}"\s*:\s*\[""")
        val match = startPattern.find(body) ?: return emptyList()
        val values = mutableListOf<String>()
        var inString = false
        var escaped = false
        val current = StringBuilder()
        var index = match.range.last + 1
        while (index < body.length) {
            val char = body[index]
            when {
                escaped -> {
                    current.append(char)
                    escaped = false
                }
                inString && char == '\\' -> escaped = true
                char == '"' -> {
                    if (inString) {
                        values += current.toString().jsonUnescape()
                        current.clear()
                    }
                    inString = !inString
                }
                inString -> current.append(char)
                !inString && char == ']' -> return values
            }
            index += 1
        }
        return values
    }

    fun intArray(body: String, key: String): List<Int> {
        val startPattern = Regex(""""${Regex.escape(key)}"\s*:\s*\[""")
        val match = startPattern.find(body) ?: return emptyList()
        val values = mutableListOf<Int>()
        val current = StringBuilder()
        var inString = false
        var escaped = false
        var index = match.range.last + 1
        while (index < body.length) {
            val char = body[index]
            when {
                escaped -> escaped = false
                char == '\\' && inString -> escaped = true
                char == '"' -> inString = !inString
                !inString && (char.isDigit() || char == '-') -> current.append(char)
                !inString && (char == ',' || char == ']') -> {
                    current.toString().toIntOrNull()?.let { values += it }
                    current.clear()
                    if (char == ']') return values
                }
            }
            index += 1
        }
        return values
    }

    fun objectValue(body: String, key: String): String? {
        val startPattern = Regex(""""${Regex.escape(key)}"\s*:\s*\{""")
        val match = startPattern.find(body) ?: return null
        var objectDepth = 0
        var inString = false
        var escaped = false
        var start = -1
        var index = match.range.last
        while (index < body.length) {
            val char = body[index]
            when {
                escaped -> escaped = false
                char == '\\' && inString -> escaped = true
                char == '"' -> inString = !inString
                !inString && char == '{' -> {
                    if (objectDepth == 0) start = index
                    objectDepth += 1
                }
                !inString && char == '}' -> {
                    objectDepth -= 1
                    if (objectDepth == 0 && start >= 0) {
                        return body.substring(start, index + 1)
                    }
                }
            }
            index += 1
        }
        return null
    }

    private fun topLevelObjects(body: String): List<String> {
        val start = body.indexOf('[')
        if (start < 0) return emptyList()
        return objectsFromArray(body, start)
    }

    private fun objectsFromArray(body: String, arrayStartIndex: Int): List<String> {
        val objects = mutableListOf<String>()
        var arrayDepth = 0
        var objectDepth = 0
        var objectStart = -1
        var inString = false
        var escaped = false
        var index = arrayStartIndex
        while (index < body.length) {
            val char = body[index]
            when {
                escaped -> escaped = false
                char == '\\' && inString -> escaped = true
                char == '"' -> inString = !inString
                !inString && char == '[' -> arrayDepth += 1
                !inString && char == ']' -> {
                    arrayDepth -= 1
                    if (arrayDepth == 0) return objects
                }
                !inString && char == '{' && arrayDepth == 1 -> {
                    if (objectDepth == 0) objectStart = index
                    objectDepth += 1
                }
                !inString && char == '}' && arrayDepth == 1 -> {
                    objectDepth -= 1
                    if (objectDepth == 0 && objectStart >= 0) {
                        objects += body.substring(objectStart, index + 1)
                        objectStart = -1
                    }
                }
            }
            index += 1
        }
        return objects
    }

    private fun String.jsonUnescape(): String {
        return replace("\\\"", "\"")
            .replace("\\\\", "\\")
            .replace("\\n", "\n")
            .replace("\\r", "\r")
            .replace("\\t", "\t")
    }
}
