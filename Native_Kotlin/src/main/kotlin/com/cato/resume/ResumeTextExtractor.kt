package com.cato.resume

import java.io.File
import java.util.zip.ZipFile

class ResumeTextExtractor {
    fun extractPlainText(file: File): String {
        if (!file.exists() || !file.canRead()) throw ResumeParseException.UnreadableFile

        val text = when (file.extension.lowercase()) {
            "txt" -> file.readText()
            "docx" -> extractDocxText(file)
            "pdf" -> throw ResumeParseException.UnsupportedDocumentType(
                "pdf. Android needs a dedicated digital PDF text extractor before production use.",
            )
            else -> throw ResumeParseException.UnsupportedDocumentType(file.extension.ifBlank { "unknown" })
        }

        val normalized = ResumeParser.normalize(text)
        if (normalized.isBlank()) throw ResumeParseException.EmptyText
        return normalized
    }

    private fun extractDocxText(file: File): String {
        ZipFile(file).use { zip ->
            val entry = zip.getEntry("word/document.xml") ?: throw ResumeParseException.UnreadableFile
            val xml = zip.getInputStream(entry).bufferedReader().use { it.readText() }
            return xml
                .replace("</w:p>", "\n")
                .replace("</w:tr>", "\n")
                .replace(Regex("<[^>]+>"), " ")
                .xmlUnescape()
        }
    }

    private fun String.xmlUnescape(): String {
        return replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"")
            .replace("&apos;", "'")
    }
}
