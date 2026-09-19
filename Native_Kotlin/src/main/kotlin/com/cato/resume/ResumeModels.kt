package com.cato.resume

data class ParsedResume(
    val rawText: String,
    val contact: ContactInfo,
    val gpa: String?,
    val sections: List<ResumeSection>,
    val skills: List<String>,
    val confidence: Double,
    val unparsedLines: List<String>,
)

data class ContactInfo(
    val email: String?,
    val phone: String?,
    val urls: List<String>,
)

data class ResumeSection(
    val kind: ResumeSectionKind,
    val title: String,
    val body: String,
)

enum class ResumeSectionKind {
    EDUCATION,
    EXPERIENCE,
    PROJECTS,
    SKILLS,
    CERTIFICATIONS,
    SUMMARY,
    UNKNOWN,
}

sealed class ResumeParseException(message: String) : Exception(message) {
    data object UnreadableFile : ResumeParseException("The resume file could not be read.")
    data object EmptyText : ResumeParseException("No readable text was found in the resume.")
    class UnsupportedDocumentType(type: String) : ResumeParseException("Unsupported resume document type: $type")
}
