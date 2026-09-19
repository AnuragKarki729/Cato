package com.cato.resume

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class ResumeParserTest {
    @Test
    fun parsesCoreResumeSignals() {
        val text = """
            Anurag Karki
            anurag@example.com
            +1 555 123 4567
            linkedin.com/in/anurag

            Education
            Harvard University
            GPA: 3.85

            Projects
            Built an Android app with Kotlin and React.

            Skills
            Swift, Kotlin, React, SQL
        """.trimIndent()

        val parsed = ResumeParser().parse(text)

        assertEquals("anurag@example.com", parsed.contact.email)
        assertEquals("3.85", parsed.gpa)
        assertTrue(parsed.contact.urls.contains("linkedin.com/in/anurag"))
        assertTrue(parsed.skills.contains("swift"))
        assertTrue(parsed.skills.contains("kotlin"))
        assertTrue(parsed.sections.any { it.kind == ResumeSectionKind.EDUCATION })
        assertTrue(parsed.confidence > 0.7)
    }

    @Test
    fun rejectsEmptyText() {
        assertFailsWith<ResumeParseException.EmptyText> {
            ResumeParser().parse("   \n\n  ")
        }
    }

    @Test
    fun extractsSymbolSkillsWithoutPartialFalseMatches() {
        val parser = ResumeParser(skillDictionary = setOf("c", "c++", "ui/ux", "go", "sql"))

        val parsed = parser.parse(
            """
            Skills
            C++, UI/UX, SQL.
            Experience
            Built catalog pages and negotiated research plans.
            """.trimIndent()
        )

        assertTrue(parsed.skills.contains("c++"))
        assertTrue(parsed.skills.contains("ui/ux"))
        assertTrue(parsed.skills.contains("sql"))
        assertTrue(!parsed.skills.contains("go"))
        assertTrue(!parsed.skills.contains("c"))
    }
}
