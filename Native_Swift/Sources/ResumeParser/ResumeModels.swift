import Foundation

public struct ParsedResume: Equatable, Codable {
    public let rawText: String
    public let contact: ContactInfo
    public let gpa: String?
    public let sections: [ResumeSection]
    public let skills: [String]
    public let confidence: Double
    public let unparsedLines: [String]

    public init(
        rawText: String,
        contact: ContactInfo,
        gpa: String?,
        sections: [ResumeSection],
        skills: [String],
        confidence: Double,
        unparsedLines: [String]
    ) {
        self.rawText = rawText
        self.contact = contact
        self.gpa = gpa
        self.sections = sections
        self.skills = skills
        self.confidence = confidence
        self.unparsedLines = unparsedLines
    }
}

public struct ContactInfo: Equatable, Codable {
    public let email: String?
    public let phone: String?
    public let urls: [String]

    public init(email: String?, phone: String?, urls: [String]) {
        self.email = email
        self.phone = phone
        self.urls = urls
    }
}

public struct ResumeSection: Equatable, Codable {
    public let kind: ResumeSectionKind
    public let title: String
    public let body: String

    public init(kind: ResumeSectionKind, title: String, body: String) {
        self.kind = kind
        self.title = title
        self.body = body
    }
}

public enum ResumeSectionKind: String, Equatable, Codable, CaseIterable {
    case education
    case experience
    case projects
    case skills
    case certifications
    case summary
    case unknown
}

public enum ResumeParseError: Error, Equatable, LocalizedError {
    case unreadableFile
    case unsupportedDocumentType(String)
    case emptyText

    public var errorDescription: String? {
        switch self {
        case .unreadableFile:
            return "The resume file could not be read."
        case .unsupportedDocumentType(let type):
            return "Unsupported resume document type: \(type)"
        case .emptyText:
            return "No readable text was found in the resume."
        }
    }
}
