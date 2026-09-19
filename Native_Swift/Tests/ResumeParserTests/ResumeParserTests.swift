import XCTest
@testable import ResumeParser

final class ResumeParserTests: XCTestCase {
    func testParsesCoreResumeSignals() throws {
        let text = """
        Anurag Karki
        anurag@example.com
        +1 555 123 4567
        linkedin.com/in/anurag

        Education
        Harvard University
        GPA: 3.85

        Projects
        Built an iOS app with Swift and React.

        Skills
        Swift, Kotlin, React, SQL
        """

        let parsed = try ResumeParser().parse(text: text)

        XCTAssertEqual(parsed.contact.email, "anurag@example.com")
        XCTAssertEqual(parsed.gpa, "3.85")
        XCTAssertTrue(parsed.contact.urls.contains("linkedin.com/in/anurag"))
        XCTAssertTrue(parsed.skills.contains("swift"))
        XCTAssertTrue(parsed.skills.contains("kotlin"))
        XCTAssertTrue(parsed.sections.contains(where: { $0.kind == .education }))
        XCTAssertGreaterThan(parsed.confidence, 0.7)
    }

    func testRejectsEmptyText() {
        XCTAssertThrowsError(try ResumeParser().parse(text: "   \n\n  "))
    }

    func testParsedResumeEncodesToJson() throws {
        let parsed = try ResumeParser().parse(text: """
        Candidate
        candidate@example.com
        Skills
        Swift, SQL
        """)

        let data = try JSONEncoder().encode(parsed)
        let json = String(decoding: data, as: UTF8.self)

        XCTAssertTrue(json.contains("candidate@example.com"))
        XCTAssertTrue(json.contains("swift"))
    }

    func testExtractsPlainTextFile() throws {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString)
            .appendingPathExtension("txt")
        defer { try? FileManager.default.removeItem(at: url) }

        try "Candidate\ncandidate@example.com\nSkills\nSwift".write(to: url, atomically: true, encoding: .utf8)

        let extracted = try ResumeTextExtractor().extractPlainText(from: url)

        XCTAssertTrue(extracted.contains("candidate@example.com"))
        XCTAssertTrue(extracted.contains("Swift"))
    }

    func testRejectsUnsupportedDocxUntilSwiftZipReaderIsAdded() {
        let url = URL(fileURLWithPath: "/tmp/resume.docx")

        XCTAssertThrowsError(try ResumeTextExtractor().extractPlainText(from: url)) { error in
            XCTAssertEqual(
                error as? ResumeParseError,
                .unsupportedDocumentType("DOCX extraction needs ZIP/XML support on Swift before production use.")
            )
        }
    }
}
