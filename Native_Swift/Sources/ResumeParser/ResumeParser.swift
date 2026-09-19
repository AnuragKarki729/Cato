import Foundation

public final class ResumeParser {
    private let skillDictionary: Set<String>

    public init(skillDictionary: Set<String> = ResumeParser.defaultSkillDictionary) {
        self.skillDictionary = Set(skillDictionary.map { $0.lowercased() })
    }

    public func parse(text: String) throws -> ParsedResume {
        let normalized = Self.normalize(text)
        guard !normalized.isEmpty else {
            throw ResumeParseError.emptyText
        }

        let contact = ContactInfo(
            email: firstMatch(#"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}"#, in: normalized),
            phone: firstMatch(#"(\+?\d[\d\s().-]{7,}\d)"#, in: normalized),
            urls: matches(#"https?://[^\s]+|(?:linkedin|github)\.com/[^\s]+"#, in: normalized)
        )

        let gpa = firstMatch(#"\bGPA\s*[:\-]?\s*([0-4](?:\.\d{1,2})?)\b"#, in: normalized)
        let sections = splitSections(normalized)
        let skills = extractSkills(from: normalized)
        let unparsedLines = normalized
            .components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .filter { line in !sections.contains { $0.body.contains(line) || $0.title == line } }

        return ParsedResume(
            rawText: normalized,
            contact: contact,
            gpa: gpa,
            sections: sections,
            skills: skills,
            confidence: confidence(contact: contact, sections: sections, skills: skills, gpa: gpa),
            unparsedLines: Array(unparsedLines.prefix(40))
        )
    }

    private func splitSections(_ text: String) -> [ResumeSection] {
        let lines = text.components(separatedBy: .newlines)
        var sections: [ResumeSection] = []
        var currentTitle = "Summary"
        var currentKind: ResumeSectionKind = .summary
        var currentBody: [String] = []

        func flush() {
            let body = currentBody.joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
            if !body.isEmpty {
                sections.append(ResumeSection(kind: currentKind, title: currentTitle, body: body))
            }
            currentBody.removeAll()
        }

        for rawLine in lines {
            let line = rawLine.trimmingCharacters(in: .whitespacesAndNewlines)
            guard !line.isEmpty else { continue }

            if let kind = Self.sectionKind(for: line) {
                flush()
                currentTitle = line
                currentKind = kind
            } else {
                currentBody.append(line)
            }
        }

        flush()
        return sections
    }

    private func extractSkills(from text: String) -> [String] {
        let lower = text.lowercased()
        return skillDictionary
            .filter { skill in lower.range(of: "\\b\(NSRegularExpression.escapedPattern(for: skill))\\b", options: .regularExpression) != nil }
            .sorted()
    }

    private func confidence(contact: ContactInfo, sections: [ResumeSection], skills: [String], gpa: String?) -> Double {
        var score = 0.15
        if contact.email != nil { score += 0.15 }
        if contact.phone != nil { score += 0.10 }
        if !contact.urls.isEmpty { score += 0.10 }
        if sections.contains(where: { $0.kind == .education }) { score += 0.15 }
        if sections.contains(where: { $0.kind == .experience || $0.kind == .projects }) { score += 0.20 }
        if !skills.isEmpty { score += 0.15 }
        if gpa != nil { score += 0.05 }
        return min(1.0, score)
    }

    private func firstMatch(_ pattern: String, in text: String) -> String? {
        matches(pattern, in: text).first
    }

    private func matches(_ pattern: String, in text: String) -> [String] {
        guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else {
            return []
        }

        let nsText = text as NSString
        return regex.matches(in: text, range: NSRange(location: 0, length: nsText.length)).map { result in
            if result.numberOfRanges > 1, result.range(at: 1).location != NSNotFound {
                return nsText.substring(with: result.range(at: 1))
            }
            return nsText.substring(with: result.range)
        }
    }

    public static func normalize(_ text: String) -> String {
        text
            .replacingOccurrences(of: "\r\n", with: "\n")
            .replacingOccurrences(of: "\r", with: "\n")
            .components(separatedBy: .newlines)
            .map { $0.replacingOccurrences(of: #"\s+"#, with: " ", options: .regularExpression).trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
            .joined(separator: "\n")
    }

    private static func sectionKind(for line: String) -> ResumeSectionKind? {
        let key = line.lowercased().trimmingCharacters(in: CharacterSet(charactersIn: ": "))
        switch key {
        case "education", "academic background":
            return .education
        case "experience", "work experience", "professional experience", "internships", "employment":
            return .experience
        case "projects", "selected projects", "what i built":
            return .projects
        case "skills", "technical skills", "core skills":
            return .skills
        case "certifications", "licenses", "awards":
            return .certifications
        case "summary", "profile", "objective":
            return .summary
        default:
            return nil
        }
    }

    public static let defaultSkillDictionary: Set<String> = [
        "accounting", "android", "aws", "business analysis", "c", "c++", "cloud", "collaboration",
        "communication", "css", "data analysis", "excel", "figma", "finance", "git", "html",
        "ios", "java", "javascript", "kotlin", "leadership", "marketing", "mongodb", "node",
        "operations", "postgresql", "product management", "python", "react", "research", "sales",
        "sql", "swift", "typescript", "ui design", "ux research"
    ]
}
