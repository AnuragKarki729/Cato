import AVFoundation
import AVKit
import Foundation
import PhotosUI
import SwiftUI
import UIKit
import UniformTypeIdentifiers
import CatoNativeCore

struct ShortTakeUploadOnboardingStep: View {
    let onCompleted: () -> Void

    var body: some View {
        ApplicantVideoUploadOnboardingStep(
            title: "Short take",
            subtitle: "Upload a 3-10 second video that answers your selected prompt.",
            cardTitle: "Short take",
            cardMessage: "Record a short clip or choose a longer library video and trim it before upload.",
            uploadButtonTitle: "Upload short take",
            videoType: "10-second",
            maxDurationSeconds: 10,
            onCompleted: onCompleted
        )
    }
}

struct DeeperSignalVideoUploadOnboardingStep: View {
    let onSkip: () async throws -> Void
    let onCompleted: () -> Void

    var body: some View {
        ApplicantVideoUploadOnboardingStep(
            title: "Deeper signal",
            subtitle: "Add an optional deeper video, or skip it and finish the rest of your profile.",
            cardTitle: "Optional deeper signal",
            cardMessage: "Record or upload a clip up to 30 seconds. Longer library videos can be trimmed before upload.",
            uploadButtonTitle: "Upload deeper signal",
            videoType: "30-second",
            maxDurationSeconds: 30,
            skipButtonTitle: "Skip deeper signal",
            onSkip: onSkip,
            onCompleted: onCompleted
        )
    }
}

private struct ApplicantVideoUploadOnboardingStep: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var selectedItem: PhotosPickerItem?
    @State private var selectedVideo: LocalApplicantVideo?
    @State private var pendingTrimVideo: TrimCandidateVideo?
    @State private var isShowingCamera = false
    @State private var isLoadingVideo = false
    @State private var isUploading = false
    @State private var errorMessage: String?
    let title: String
    let subtitle: String
    let cardTitle: String
    let cardMessage: String
    let uploadButtonTitle: String
    let videoType: String
    let maxDurationSeconds: Double
    var skipButtonTitle: String?
    var onSkip: (() async throws -> Void)?
    let onCompleted: () -> Void

    var body: some View {
        ApplicantOnboardingContainer(
            title: title,
            subtitle: subtitle
        ) {
            VStack(alignment: .leading, spacing: 16) {
                CatoCard {
                    VStack(alignment: .leading, spacing: 10) {
                        Label(cardTitle, systemImage: "video.badge.plus")
                            .font(.headline.weight(.bold))
                        Text(cardMessage)
                            .font(.subheadline)
                            .foregroundStyle(CatoTheme.muted)
                    }
                }

                HStack(spacing: 10) {
                    Button {
                        if UIImagePickerController.isSourceTypeAvailable(.camera) {
                            isShowingCamera = true
                        } else {
                            errorMessage = "Camera recording is not available on this device. Choose a video from your library."
                        }
                    } label: {
                        Label("Record", systemImage: "camera.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(CatoPrimaryButtonStyle())
                    .disabled(isLoadingVideo || isUploading)

                    PhotosPicker(selection: $selectedItem, matching: .videos, photoLibrary: .shared()) {
                        Label("Upload", systemImage: "photo.on.rectangle")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(CatoSecondaryButtonStyle())
                    .disabled(isLoadingVideo || isUploading)
                    .onChange(of: selectedItem) { newItem in
                        Task { await loadSelectedVideo(newItem) }
                    }
                }

                if isLoadingVideo {
                    HStack(spacing: 10) {
                        ProgressView()
                        Text("Reading video")
                            .font(.subheadline.weight(.semibold))
                    }
                    .foregroundStyle(CatoTheme.muted)
                }

                if let selectedVideo {
                    CatoCard {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Selected clip")
                                .font(.headline.weight(.bold))
                            Text("\(selectedVideo.durationSeconds, specifier: "%.1f") seconds")
                                .font(.subheadline)
                                .foregroundStyle(CatoTheme.muted)
                            if let fileSizeBytes = selectedVideo.fileSizeBytes {
                                Text(ByteCountFormatter.string(fromByteCount: Int64(fileSizeBytes), countStyle: .file))
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(CatoTheme.muted)
                            }
                        }
                    }
                }

                ApplicantStepError(errorMessage)

                Button {
                    Task { await upload() }
                } label: {
                    if isUploading {
                        ProgressView().tint(.white).frame(maxWidth: .infinity)
                    } else {
                        Text(uploadButtonTitle).frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(CatoPrimaryButtonStyle())
                .disabled(selectedVideo == nil || isLoadingVideo || isUploading)

                if let skipButtonTitle, onSkip != nil {
                    Button {
                        Task { await skip() }
                    } label: {
                        Text(skipButtonTitle).frame(maxWidth: .infinity)
                    }
                    .buttonStyle(CatoSecondaryButtonStyle())
                    .disabled(isLoadingVideo || isUploading)
                }
            }
        }
        .sheet(isPresented: $isShowingCamera) {
            ApplicantCameraRecorder(maxDurationSeconds: maxDurationSeconds) { url in
                Task { await loadRecordedVideo(url) }
            }
            .ignoresSafeArea()
        }
        .sheet(item: $pendingTrimVideo) { video in
            ApplicantVideoTrimView(video: video, maxDurationSeconds: maxDurationSeconds) { trimmedURL in
                Task { await loadTrimmedVideo(trimmedURL) }
            }
        }
    }

    private func loadSelectedVideo(_ item: PhotosPickerItem?) async {
        guard let item else { return }
        isLoadingVideo = true
        errorMessage = nil
        selectedVideo = nil

        do {
            guard let picked = try await item.loadTransferable(type: PickedApplicantVideo.self) else {
                throw ApplicantVideoUploadError.unreadableVideo
            }

            let duration = try await videoDurationSeconds(for: picked.url)
            guard duration >= 3 else {
                throw ApplicantVideoUploadError.tooShort
            }
            if duration > maxDurationSeconds {
                pendingTrimVideo = TrimCandidateVideo(url: picked.url, durationSeconds: duration)
            } else {
                selectedVideo = localVideo(from: picked.url, durationSeconds: duration)
            }
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoadingVideo = false
    }

    private func loadTrimmedVideo(_ url: URL) async {
        isLoadingVideo = true
        errorMessage = nil
        selectedVideo = nil

        do {
            selectedVideo = try await validatedLocalVideo(from: url, maxDurationSeconds: maxDurationSeconds)
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoadingVideo = false
    }

    private func loadRecordedVideo(_ url: URL) async {
        isLoadingVideo = true
        errorMessage = nil
        selectedVideo = nil

        do {
            selectedVideo = try await validatedLocalVideo(
                from: copyVideoToTemporaryLocation(url),
                maxDurationSeconds: maxDurationSeconds
            )
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoadingVideo = false
    }

    private func upload() async {
        guard let video = selectedVideo, let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Choose a video before uploading."
            return
        }

        isUploading = true
        errorMessage = nil

        do {
            try await apiClient.acceptApplicantConsent(accessToken: accessToken, video: true, privacyPolicy: true)
            let prepared = try await apiClient.prepareApplicantVideoUpload(
                accessToken: accessToken,
                type: videoType,
                contentType: video.contentType,
                fileSizeBytes: video.fileSizeBytes
            )
            let uploaded = try await ApplicantVideoCloudinaryUploader.upload(video: video, preparation: prepared)
            _ = try await apiClient.completeApplicantVideoUpload(
                accessToken: accessToken,
                type: videoType,
                cloudinaryPublicId: uploaded.publicId,
                secureUrl: uploaded.secureUrl,
                contentType: video.contentType,
                fileSizeBytes: uploaded.bytes ?? video.fileSizeBytes,
                durationSeconds: video.durationSeconds
            )
            onCompleted()
        } catch {
            errorMessage = error.localizedDescription
        }

        isUploading = false
    }

    private func skip() async {
        guard let onSkip else { return }
        isUploading = true
        errorMessage = nil

        do {
            try await onSkip()
            onCompleted()
        } catch {
            errorMessage = error.localizedDescription
        }

        isUploading = false
    }
}

struct LocalApplicantVideo {
    let url: URL
    let contentType: String
    let durationSeconds: Double
    let fileSizeBytes: Int?
}

private struct TrimCandidateVideo: Identifiable {
    let id = UUID()
    let url: URL
    let durationSeconds: Double
}

struct PickedApplicantVideo: Transferable {
    let url: URL

    static var transferRepresentation: some TransferRepresentation {
        FileRepresentation(contentType: .movie) { video in
            SentTransferredFile(video.url)
        } importing: { received in
            let fileExtension = received.file.pathExtension.isEmpty ? "mov" : received.file.pathExtension
            let copyURL = FileManager.default.temporaryDirectory
                .appendingPathComponent("cato-\(UUID().uuidString)")
                .appendingPathExtension(fileExtension)
            if FileManager.default.fileExists(atPath: copyURL.path) {
                try FileManager.default.removeItem(at: copyURL)
            }
            try FileManager.default.copyItem(at: received.file, to: copyURL)
            return PickedApplicantVideo(url: copyURL)
        }
    }
}

private struct ApplicantCameraRecorder: UIViewControllerRepresentable {
    let maxDurationSeconds: Double
    let onVideo: (URL) -> Void

    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.mediaTypes = [UTType.movie.identifier]
        picker.cameraCaptureMode = .video
        picker.videoMaximumDuration = maxDurationSeconds
        picker.videoQuality = .typeHigh
        picker.allowsEditing = false
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onVideo: onVideo) {
            dismiss()
        }
    }

    final class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let onVideo: (URL) -> Void
        let onDismiss: () -> Void

        init(onVideo: @escaping (URL) -> Void, onDismiss: @escaping () -> Void) {
            self.onVideo = onVideo
            self.onDismiss = onDismiss
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let url = info[.mediaURL] as? URL {
                onVideo(url)
            }
            onDismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            onDismiss()
        }
    }
}

private struct ApplicantVideoTrimView: View {
    let video: TrimCandidateVideo
    let maxDurationSeconds: Double
    let onTrimmed: (URL) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var startSeconds = 0.0
    @State private var clipLength: Double
    @State private var isExporting = false
    @State private var errorMessage: String?

    init(video: TrimCandidateVideo, maxDurationSeconds: Double, onTrimmed: @escaping (URL) -> Void) {
        self.video = video
        self.maxDurationSeconds = maxDurationSeconds
        self.onTrimmed = onTrimmed
        _clipLength = State(initialValue: min(maxDurationSeconds, max(3, video.durationSeconds)))
    }

    private var maxStart: Double {
        max(0, video.durationSeconds - clipLength)
    }

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                VideoPlayer(player: AVPlayer(url: video.url))
                    .frame(height: 220)
                    .clipShape(RoundedRectangle(cornerRadius: 18))
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .stroke(CatoTheme.border, lineWidth: 1)
                    )

                VStack(alignment: .leading, spacing: 8) {
                    Text("Trim selection")
                        .font(.headline.weight(.bold))
                    Text("\(startSeconds, specifier: "%.1f")s to \(startSeconds + clipLength, specifier: "%.1f")s")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(CatoTheme.purple)
                }

                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Text("Start")
                            .font(.subheadline.weight(.bold))
                        Spacer()
                        Text("\(startSeconds, specifier: "%.1f")s")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(CatoTheme.muted)
                    }
                    Slider(value: $startSeconds, in: 0...max(0.1, maxStart))
                }

                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        Text("Length")
                            .font(.subheadline.weight(.bold))
                        Spacer()
                        Text("\(clipLength, specifier: "%.1f")s")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(CatoTheme.muted)
                    }
                    Slider(value: $clipLength, in: 3...maxDurationSeconds, step: 0.5)
                        .onChange(of: clipLength) { _ in
                            startSeconds = min(startSeconds, maxStart)
                        }
                }

                ApplicantStepError(errorMessage)

                Spacer(minLength: 0)

                Button {
                    Task { await exportTrimmedVideo() }
                } label: {
                    if isExporting {
                        ProgressView().tint(.white).frame(maxWidth: .infinity)
                    } else {
                        Text("Use trimmed clip").frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(CatoPrimaryButtonStyle())
                .disabled(isExporting)
            }
            .padding(CatoTheme.screenPadding)
            .background(CatoTheme.background.ignoresSafeArea())
            .navigationTitle("Trim video")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func exportTrimmedVideo() async {
        isExporting = true
        errorMessage = nil

        do {
            let outputURL = try await trimVideo(
                sourceURL: video.url,
                startSeconds: startSeconds,
                durationSeconds: clipLength
            )
            onTrimmed(outputURL)
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }

        isExporting = false
    }
}

struct ApplicantVideoCloudinaryUploader {
    static func upload(video: LocalApplicantVideo, preparation: ApplicantVideoUploadPreparation) async throws -> CloudinaryVideoUploadResponse {
        guard let uploadURL = URL(string: preparation.uploadUrl) else {
            throw ApplicantVideoUploadError.invalidUploadURL
        }

        let boundary = "Boundary-\(UUID().uuidString)"
        var request = URLRequest(url: uploadURL)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        let body = try multipartBody(
            video: video,
            preparation: preparation,
            boundary: boundary
        )

        let (data, response) = try await URLSession.shared.upload(for: request, from: body)
        guard let httpResponse = response as? HTTPURLResponse, (200..<300).contains(httpResponse.statusCode) else {
            throw ApplicantVideoUploadError.cloudinaryFailed
        }

        return try JSONDecoder().decode(CloudinaryVideoUploadResponse.self, from: data)
    }

    private static func multipartBody(
        video: LocalApplicantVideo,
        preparation: ApplicantVideoUploadPreparation,
        boundary: String
    ) throws -> Data {
        var data = Data()
        let fields = [
            "api_key": preparation.apiKey,
            "timestamp": String(preparation.timestamp),
            "signature": preparation.signature,
            "folder": preparation.folder,
            "public_id": preparation.publicId
        ]

        for (name, value) in fields {
            data.append("--\(boundary)\r\n")
            data.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n")
            data.append("\(value)\r\n")
        }

        data.append("--\(boundary)\r\n")
        data.append("Content-Disposition: form-data; name=\"file\"; filename=\"short-take.\(video.url.pathExtension)\"\r\n")
        data.append("Content-Type: \(video.contentType)\r\n\r\n")
        data.append(try Data(contentsOf: video.url))
        data.append("\r\n")
        data.append("--\(boundary)--\r\n")

        return data
    }
}

struct CloudinaryVideoUploadResponse: Decodable {
    let publicId: String
    let secureUrl: String
    let bytes: Int?

    enum CodingKeys: String, CodingKey {
        case publicId = "public_id"
        case secureUrl = "secure_url"
        case bytes
    }
}

enum ApplicantVideoUploadError: LocalizedError {
    case unreadableVideo
    case tooShort
    case tooLong(maxSeconds: Int)
    case invalidUploadURL
    case cloudinaryFailed
    case exportCancelled
    case exportFailed

    var errorDescription: String? {
        switch self {
        case .unreadableVideo:
            return "Could not read this video. Choose a local video from your library."
        case .tooShort:
            return "The short take must be at least 3 seconds."
        case .tooLong(let maxSeconds):
            return "This clip is too long. Choose a video up to \(maxSeconds) seconds for now."
        case .invalidUploadURL:
            return "The upload link was invalid. Try again."
        case .cloudinaryFailed:
            return "Video upload failed. Try again with a smaller local clip."
        case .exportCancelled:
            return "Video trimming was cancelled."
        case .exportFailed:
            return "Could not trim this video. Try a different local clip."
        }
    }
}

func videoDurationSeconds(for url: URL) async throws -> Double {
    let asset = AVURLAsset(url: url)
    let duration = try await asset.load(.duration)
    return CMTimeGetSeconds(duration)
}

func validatedLocalVideo(from url: URL, maxDurationSeconds: Double) async throws -> LocalApplicantVideo {
    let duration = try await videoDurationSeconds(for: url)
    guard duration >= 3 else {
        throw ApplicantVideoUploadError.tooShort
    }
    guard duration <= maxDurationSeconds else {
        throw ApplicantVideoUploadError.tooLong(maxSeconds: Int(maxDurationSeconds))
    }

    return localVideo(from: url, durationSeconds: duration)
}

func localVideo(from url: URL, durationSeconds: Double) -> LocalApplicantVideo {
    LocalApplicantVideo(
        url: url,
        contentType: contentType(for: url),
        durationSeconds: durationSeconds,
        fileSizeBytes: fileSizeBytes(for: url)
    )
}

private func trimVideo(sourceURL: URL, startSeconds: Double, durationSeconds: Double) async throws -> URL {
    let asset = AVURLAsset(url: sourceURL)
    guard let exportSession = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetHighestQuality) else {
        throw ApplicantVideoUploadError.exportFailed
    }

    let outputURL = FileManager.default.temporaryDirectory
        .appendingPathComponent("cato-trimmed-\(UUID().uuidString)")
        .appendingPathExtension("mp4")
    if FileManager.default.fileExists(atPath: outputURL.path) {
        try FileManager.default.removeItem(at: outputURL)
    }

    exportSession.outputURL = outputURL
    exportSession.outputFileType = .mp4
    exportSession.timeRange = CMTimeRange(
        start: CMTime(seconds: startSeconds, preferredTimescale: 600),
        duration: CMTime(seconds: durationSeconds, preferredTimescale: 600)
    )
    exportSession.shouldOptimizeForNetworkUse = true

    await exportSession.export()

    switch exportSession.status {
    case .completed:
        return outputURL
    case .failed:
        throw exportSession.error ?? ApplicantVideoUploadError.exportFailed
    case .cancelled:
        throw ApplicantVideoUploadError.exportCancelled
    default:
        throw ApplicantVideoUploadError.exportFailed
    }
}

private func copyVideoToTemporaryLocation(_ url: URL) throws -> URL {
    let fileExtension = url.pathExtension.isEmpty ? "mov" : url.pathExtension
    let copyURL = FileManager.default.temporaryDirectory
        .appendingPathComponent("cato-recorded-\(UUID().uuidString)")
        .appendingPathExtension(fileExtension)
    if FileManager.default.fileExists(atPath: copyURL.path) {
        try FileManager.default.removeItem(at: copyURL)
    }
    try FileManager.default.copyItem(at: url, to: copyURL)
    return copyURL
}

func fileSizeBytes(for url: URL) -> Int? {
    guard let size = try? FileManager.default.attributesOfItem(atPath: url.path)[.size] as? NSNumber else {
        return nil
    }
    return size.intValue
}

func contentType(for url: URL) -> String {
    guard let type = UTType(filenameExtension: url.pathExtension), let mimeType = type.preferredMIMEType else {
        return "video/quicktime"
    }
    return mimeType
}

private extension Data {
    mutating func append(_ string: String) {
        append(Data(string.utf8))
    }
}
