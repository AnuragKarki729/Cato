package com.cato.resume

class ResumeParser(
    skillDictionary: Set<String> = defaultSkillDictionary,
) {
    private val skills = skillDictionary.map { it.lowercase() }.toSet()

    fun parse(text: String): ParsedResume {
        val normalized = normalize(text)
        if (normalized.isBlank()) throw ResumeParseException.EmptyText

        val contact = ContactInfo(
            email = firstMatch(EMAIL_PATTERN, normalized),
            phone = firstMatch(PHONE_PATTERN, normalized),
            urls = matches(URL_PATTERN, normalized),
        )
        val gpa = firstMatch(GPA_PATTERN, normalized)
        val sections = splitSections(normalized)
        val extractedSkills = extractSkills(normalized)
        val unparsedLines = normalized
            .lines()
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .filter { line -> sections.none { it.title == line || it.body.contains(line) } }
            .take(40)

        return ParsedResume(
            rawText = normalized,
            contact = contact,
            gpa = gpa,
            sections = sections,
            skills = extractedSkills,
            confidence = confidence(contact, sections, extractedSkills, gpa),
            unparsedLines = unparsedLines,
        )
    }

    private fun splitSections(text: String): List<ResumeSection> {
        val sections = mutableListOf<ResumeSection>()
        var currentTitle = "Summary"
        var currentKind = ResumeSectionKind.SUMMARY
        val currentBody = mutableListOf<String>()

        fun flush() {
            val body = currentBody.joinToString("\n").trim()
            if (body.isNotBlank()) {
                sections += ResumeSection(currentKind, currentTitle, body)
            }
            currentBody.clear()
        }

        text.lines().forEach { rawLine ->
            val line = rawLine.trim()
            if (line.isBlank()) return@forEach

            val kind = sectionKind(line)
            if (kind != null) {
                flush()
                currentTitle = line
                currentKind = kind
            } else {
                currentBody += line
            }
        }

        flush()
        return sections
    }

    private fun extractSkills(text: String): List<String> {
        val lower = text.lowercase()
        return skills
            .filter { skill -> lower.containsWholeSkill(skill) }
            .sorted()
    }

    private fun confidence(
        contact: ContactInfo,
        sections: List<ResumeSection>,
        skills: List<String>,
        gpa: String?,
    ): Double {
        var score = 0.15
        if (contact.email != null) score += 0.15
        if (contact.phone != null) score += 0.10
        if (contact.urls.isNotEmpty()) score += 0.10
        if (sections.any { it.kind == ResumeSectionKind.EDUCATION }) score += 0.15
        if (sections.any { it.kind == ResumeSectionKind.EXPERIENCE || it.kind == ResumeSectionKind.PROJECTS }) score += 0.20
        if (skills.isNotEmpty()) score += 0.15
        if (gpa != null) score += 0.05
        return score.coerceAtMost(1.0)
    }

    private fun firstMatch(pattern: Regex, text: String): String? {
        val match = pattern.find(text) ?: return null
        return if (match.groupValues.size > 1 && match.groupValues[1].isNotBlank()) {
            match.groupValues[1]
        } else {
            match.value
        }
    }

    private fun matches(pattern: Regex, text: String): List<String> {
        return pattern.findAll(text).map { it.value }.toList()
    }

    private fun sectionKind(line: String): ResumeSectionKind? {
        return when (line.lowercase().trim(':', ' ')) {
            "education", "academic background" -> ResumeSectionKind.EDUCATION
            "experience", "work experience", "professional experience", "internships", "employment" -> ResumeSectionKind.EXPERIENCE
            "projects", "selected projects", "what i built" -> ResumeSectionKind.PROJECTS
            "skills", "technical skills", "core skills" -> ResumeSectionKind.SKILLS
            "certifications", "licenses", "awards" -> ResumeSectionKind.CERTIFICATIONS
            "summary", "profile", "objective" -> ResumeSectionKind.SUMMARY
            else -> null
        }
    }

    companion object {
        private val EMAIL_PATTERN = Regex("[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}", RegexOption.IGNORE_CASE)
        private val PHONE_PATTERN = Regex("(\\+?\\d[\\d\\s().-]{7,}\\d)")
        private val URL_PATTERN = Regex("https?://[^\\s]+|(?:linkedin|github)\\.com/[^\\s]+", RegexOption.IGNORE_CASE)
        private val GPA_PATTERN = Regex("\\bGPA\\s*[:\\-]?\\s*([0-4](?:\\.\\d{1,2})?)\\b", RegexOption.IGNORE_CASE)

        fun normalize(text: String): String {
            return text
                .replace("\r\n", "\n")
                .replace("\r", "\n")
                .lines()
                .map { Regex("\\s+").replace(it, " ").trim() }
                .filter { it.isNotBlank() }
                .joinToString("\n")
        }

        val defaultSkillDictionary = setOf(
            "accounting", "android", "aws", "business analysis", "c", "c++", "cloud", "collaboration",
            "communication", "css", "data analysis", "excel", "figma", "finance", "git", "html",
            "ios", "java", "javascript", "kotlin", "leadership", "marketing", "mongodb", "node",
            "operations", "postgresql", "product management", "python", "react", "research", "sales",
            "sql", "swift", "typescript", "ui design", "ux research",
        )
    }
}

private fun String.containsWholeSkill(skill: String): Boolean {
    return indices
        .filter { index -> regionMatches(index, skill, 0, skill.length, ignoreCase = true) }
        .any { index ->
            val before = getOrNull(index - 1)
            val after = getOrNull(index + skill.length)
            !before.isSkillBoundaryBlocked() && !after.isSkillBoundaryBlocked()
        }
}

private fun Char?.isSkillBoundaryBlocked(): Boolean {
    return this != null && (isLetterOrDigit() || this == '+' || this == '#' || this == '/')
}
