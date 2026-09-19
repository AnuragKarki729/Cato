package com.cato.app.core

import kotlin.test.Test
import kotlin.test.assertEquals

class JsonBodyWriterTest {
    @Test
    fun writesNestedPayloadsWithEscapingAndNulls() {
        val json = JsonBodyWriter.write(
            mapOf(
                "caption" to null,
                "title" to "Line \"one\"\nLine two",
                "links" to listOf(
                    mapOf("targetType" to "project", "targetId" to "p1"),
                    mapOf("targetType" to "skill", "targetId" to "kotlin"),
                ),
                "active" to true,
                "score" to 82,
            )
        )

        assertEquals(
            "{\"caption\":null,\"title\":\"Line \\\"one\\\"\\nLine two\",\"links\":[{\"targetType\":\"project\",\"targetId\":\"p1\"},{\"targetType\":\"skill\",\"targetId\":\"kotlin\"}],\"active\":true,\"score\":82}",
            json,
        )
    }
}
