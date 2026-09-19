package com.cato.app.core

object JsonBodyWriter {
    fun write(value: Any?): String {
        return when (value) {
            null -> "null"
            is String -> "\"${escape(value)}\""
            is Number -> value.toString()
            is Boolean -> value.toString()
            is Map<*, *> -> value.entries.joinToString(prefix = "{", postfix = "}") { (key, entryValue) ->
                "\"${escape(key.toString())}\":${write(entryValue)}"
            }
            is Iterable<*> -> value.joinToString(prefix = "[", postfix = "]") { write(it) }
            else -> "\"${escape(value.toString())}\""
        }
    }

    private fun escape(value: String): String {
        return buildString {
            value.forEach { char ->
                when (char) {
                    '\\' -> append("\\\\")
                    '"' -> append("\\\"")
                    '\n' -> append("\\n")
                    '\r' -> append("\\r")
                    '\t' -> append("\\t")
                    else -> append(char)
                }
            }
        }
    }
}
