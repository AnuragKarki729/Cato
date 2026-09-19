import Foundation
import ResumeParser

let arguments = Array(CommandLine.arguments.dropFirst())

guard let path = arguments.first, !path.isEmpty else {
    fputs("Usage: resume-parser-cli /path/to/resume.pdf\n", stderr)
    exit(2)
}

do {
    let url = URL(fileURLWithPath: path)
    let text = try ResumeTextExtractor().extractPlainText(from: url)
    let parsed = try ResumeParser().parse(text: text)

    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    let data = try encoder.encode(parsed)
    FileHandle.standardOutput.write(data)
    FileHandle.standardOutput.write(Data("\n".utf8))
} catch {
    fputs("resume-parser-cli error: \(error.localizedDescription)\n", stderr)
    exit(1)
}
