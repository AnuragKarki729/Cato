import Foundation

#if canImport(PDFKit)
import PDFKit
#endif

public final class ResumeTextExtractor {
    public init() {}

    public func extractPlainText(from url: URL) throws -> String {
        let ext = url.pathExtension.lowercased()
        switch ext {
        case "txt":
            let text = try String(contentsOf: url, encoding: .utf8)
            return try requireText(text)
        case "pdf":
            return try extractPdfText(from: url)
        case "docx":
            throw ResumeParseError.unsupportedDocumentType("DOCX extraction needs ZIP/XML support on Swift before production use.")
        default:
            throw ResumeParseError.unsupportedDocumentType(ext.isEmpty ? "unknown" : ext)
        }
    }

    private func extractPdfText(from url: URL) throws -> String {
        #if canImport(PDFKit)
        guard let document = PDFDocument(url: url) else {
            throw ResumeParseError.unreadableFile
        }

        var pages: [String] = []
        for index in 0..<document.pageCount {
            if let pageText = document.page(at: index)?.string {
                pages.append(pageText)
            }
        }

        return try requireText(pages.joined(separator: "\n"))
        #else
        throw ResumeParseError.unsupportedDocumentType("PDFKit is unavailable on this platform.")
        #endif
    }

    private func requireText(_ text: String) throws -> String {
        let normalized = ResumeParser.normalize(text)
        guard !normalized.isEmpty else {
            throw ResumeParseError.emptyText
        }
        return normalized
    }
}
