import Foundation
import PDFKit
import SwiftUI
import UIKit
import UniformTypeIdentifiers
import CatoNativeCore

struct ApplicantResumeUploadOnboardingStep: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var isPickingPDF = false
    @State private var isWorking = false
    @State private var errorMessage: String?
    @State private var selectedResume: LocalApplicantResume?
    let onCompleted: () -> Void

    var body: some View {
        ApplicantOnboardingContainer(
            title: "Resume",
            subtitle: "Upload a PDF resume, or continue without one and add it later."
        ) {
            VStack(alignment: .leading, spacing: 16) {
                CatoCard {
                    VStack(alignment: .leading, spacing: 10) {
                        Label("PDF only", systemImage: "doc.text.fill")
                            .font(.headline.weight(.bold))
                            .foregroundStyle(CatoTheme.ink)
                        Text("Cato stores your resume securely and uses it to complete the recruiter-facing profile.")
                            .font(.subheadline)
                            .foregroundStyle(CatoTheme.muted)
                    }
                }

                if let selectedResume {
                    CatoCard {
                        VStack(alignment: .leading, spacing: 8) {
                            Text(selectedResume.fileName)
                                .font(.headline.weight(.bold))
                                .foregroundStyle(CatoTheme.ink)
                                .lineLimit(2)
                            Text(ByteCountFormatter.string(fromByteCount: Int64(selectedResume.fileSizeBytes), countStyle: .file))
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(CatoTheme.muted)
                        }
                    }
                }

                ApplicantStepError(errorMessage)

                Button {
                    isPickingPDF = true
                } label: {
                    Label(selectedResume == nil ? "Choose PDF" : "Choose another PDF", systemImage: "doc.badge.plus")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(CatoSecondaryButtonStyle())
                .disabled(isWorking)

                Button {
                    Task { await uploadResume() }
                } label: {
                    if isWorking {
                        ProgressView().tint(.white).frame(maxWidth: .infinity)
                    } else {
                        Text("Upload resume").frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(CatoPrimaryButtonStyle())
                .disabled(isWorking || selectedResume == nil)

                Button {
                    Task { await skipResume() }
                } label: {
                    Text("Continue with no resume").frame(maxWidth: .infinity)
                }
                .buttonStyle(CatoSecondaryButtonStyle())
                .disabled(isWorking)
            }
        }
        .sheet(isPresented: $isPickingPDF) {
            ApplicantPDFDocumentPicker { url in
                loadResume(from: url)
            }
        }
    }

    private func loadResume(from url: URL) {
        errorMessage = nil

        do {
            selectedResume = try LocalApplicantResume(url: url)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func uploadResume() async {
        guard let selectedResume, let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Choose a PDF resume before uploading."
            return
        }

        isWorking = true
        errorMessage = nil

        do {
            try await apiClient.acceptApplicantConsent(accessToken: accessToken, resume: true, privacyPolicy: true)
            _ = try await apiClient.uploadApplicantResume(
                accessToken: accessToken,
                dataUri: selectedResume.dataUri,
                originalFileName: selectedResume.fileName,
                fileSizeBytes: selectedResume.fileSizeBytes
            )
            try? await saveParsedResumeText(
                apiClient: apiClient,
                accessToken: accessToken,
                text: ResumeTextExtractor.extractText(from: selectedResume.pdfData),
                sourceFileName: selectedResume.fileName
            )
            onCompleted()
        } catch {
            errorMessage = error.localizedDescription
        }

        isWorking = false
    }

    private func skipResume() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to continue."
            return
        }

        isWorking = true
        errorMessage = nil

        do {
            try await apiClient.skipApplicantResume(accessToken: accessToken)
            onCompleted()
        } catch {
            errorMessage = error.localizedDescription
        }

        isWorking = false
    }
}

struct LocalApplicantResume {
    static let maxBytes = 10 * 1024 * 1024

    let fileName: String
    let fileSizeBytes: Int
    let dataUri: String
    let pdfData: Data

    init(url: URL) throws {
        let didAccess = url.startAccessingSecurityScopedResource()
        defer {
            if didAccess {
                url.stopAccessingSecurityScopedResource()
            }
        }

        guard url.pathExtension.lowercased() == "pdf" else {
            throw ApplicantResumeUploadError.notPDF
        }

        let data = try Data(contentsOf: url)
        guard !data.isEmpty else {
            throw ApplicantResumeUploadError.emptyFile
        }
        guard data.count <= Self.maxBytes else {
            throw ApplicantResumeUploadError.tooLarge
        }

        self.fileName = url.lastPathComponent.isEmpty ? "resume.pdf" : url.lastPathComponent
        self.fileSizeBytes = data.count
        self.dataUri = "data:application/pdf;base64,\(data.base64EncodedString())"
        self.pdfData = data
    }
}

enum ResumeTextExtractionError: LocalizedError {
    case unreadablePDF
    case emptyText
    case lowQualityText

    var errorDescription: String? {
        switch self {
        case .unreadablePDF:
            return "Cato could not read text from this PDF."
        case .emptyText:
            return "Cato could not find searchable text in this PDF. Try uploading a text-based PDF instead of a scanned image."
        case .lowQualityText:
            return "Cato could not extract reliable text from this PDF. It may be scanned, image-based, or encoded in a way that cannot be searched."
        }
    }
}

struct ResumeTextExtractor {
    static func extractText(from data: Data) throws -> String {
        guard let document = PDFDocument(data: data) else {
            throw ResumeTextExtractionError.unreadablePDF
        }

        let text = (0..<document.pageCount)
            .compactMap { document.page(at: $0)?.string }
            .joined(separator: "\n")
            .trimmingCharacters(in: .whitespacesAndNewlines)

        guard !text.isEmpty else {
            throw ResumeTextExtractionError.emptyText
        }
        guard isSearchableTextQualityAcceptable(text) else {
            throw ResumeTextExtractionError.lowQualityText
        }

        return text
    }

    private static func isSearchableTextQualityAcceptable(_ text: String) -> Bool {
        let scalars = text.unicodeScalars.filter { !$0.properties.isWhitespace }
        guard scalars.count >= 40 else { return false }

        let usefulCount = scalars.filter { scalar in
            CharacterSet.alphanumerics.contains(scalar) || CharacterSet.punctuationCharacters.contains(scalar)
        }.count
        let letterCount = scalars.filter { CharacterSet.letters.contains($0) }.count

        return Double(usefulCount) / Double(scalars.count) >= 0.82 && Double(letterCount) / Double(scalars.count) >= 0.35
    }

    static func extractSkills(from text: String) -> [String] {
        let normalized = text.lowercased()
        let skillCandidates = [
            "aws", "azure", "c", "c++", "css", "docker", "excel", "figma", "firebase",
            "git", "go", "html", "java", "javascript", "kotlin", "mongodb", "node",
            "postgresql", "python", "react", "sql", "swift", "typescript", "ui/ux"
        ]

        return skillCandidates
            .filter { skill in
                let escaped = NSRegularExpression.escapedPattern(for: skill.lowercased())
                return normalized.range(of: #"(?<![a-z0-9+#])\#(escaped)(?![a-z0-9+#])"#, options: .regularExpression) != nil
            }
            .sorted()
    }
}

func saveParsedResumeText(apiClient: CatoAPIClient, accessToken: String, text: String, sourceFileName: String?) async throws {
    try await apiClient.saveApplicantParsedResumeText(
        accessToken: accessToken,
        text: text,
        sourceFileName: sourceFileName,
        extractedSkills: ResumeTextExtractor.extractSkills(from: text)
    )
}

private struct ApplicantPDFDocumentPicker: UIViewControllerRepresentable {
    let onPicked: (URL) -> Void
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [.pdf], asCopy: true)
        picker.allowsMultipleSelection = false
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onPicked: onPicked) {
            dismiss()
        }
    }

    final class Coordinator: NSObject, UIDocumentPickerDelegate {
        let onPicked: (URL) -> Void
        let onDismiss: () -> Void

        init(onPicked: @escaping (URL) -> Void, onDismiss: @escaping () -> Void) {
            self.onPicked = onPicked
            self.onDismiss = onDismiss
        }

        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            if let url = urls.first {
                onPicked(url)
            }
            onDismiss()
        }

        func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
            onDismiss()
        }
    }
}

private enum ApplicantResumeUploadError: LocalizedError {
    case notPDF
    case emptyFile
    case tooLarge

    var errorDescription: String? {
        switch self {
        case .notPDF:
            return "Please choose a PDF resume."
        case .emptyFile:
            return "This PDF appears to be empty."
        case .tooLarge:
            return "Resume must be 10 MB or smaller."
        }
    }
}
