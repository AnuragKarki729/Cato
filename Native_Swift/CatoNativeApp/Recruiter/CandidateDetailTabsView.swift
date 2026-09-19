import AVKit
import SwiftUI
import WebKit
import CatoNativeCore

struct CandidateDetailTabsView: View {
    let candidateId: String

    @EnvironmentObject private var auth: AuthViewModel
    @State private var candidate: RecruiterCandidate?
    @State private var errorMessage: String?
    @State private var isLoading = true
    @State private var selectedTab: CandidateDetailTab = .about

    var body: some View {
        Group {
            if isLoading {
                CatoLoadingView(message: "Loading profile")
            } else if let errorMessage {
                RecruiterErrorView(message: errorMessage) {
                    Task { await loadCandidate() }
                }
            } else if let candidate {
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        CandidateProfileHeaderCard(candidate: candidate)

                        Picker("Candidate section", selection: $selectedTab) {
                            ForEach(CandidateDetailTab.allCases) { tab in
                                Text(tab.title).tag(tab)
                            }
                        }
                        .pickerStyle(.segmented)

                        switch selectedTab {
                        case .about:
                            CandidateAboutSection(candidate: candidate)
                        case .resume:
                            CandidateResumeSection(candidate: candidate)
                        case .video:
                            CandidateVideoSection(candidate: candidate)
                        case .more:
                            CandidateMoreSection(candidate: candidate)
                        }
                    }
                    .padding(CatoTheme.screenPadding)
                }
                .background(CatoTheme.background.ignoresSafeArea())
            }
        }
        .navigationTitle("Candidate")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadCandidate()
        }
    }

    private func loadCandidate() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to load candidate."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            candidate = try await apiClient.getRecruiterCandidate(accessToken: accessToken, candidateId: candidateId).candidate
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

private enum CandidateDetailTab: String, CaseIterable, Identifiable {
    case about
    case resume
    case video
    case more

    var id: String { rawValue }

    var title: String {
        switch self {
        case .about: return "About"
        case .resume: return "Resume"
        case .video: return "Video"
        case .more: return "More"
        }
    }
}

private struct CandidateProfileHeaderCard: View {
    let candidate: RecruiterCandidate

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .top, spacing: 12) {
                    CandidateAvatar(name: candidate.displayName, size: 58)
                    VStack(alignment: .leading, spacing: 5) {
                        Text(candidate.displayName)
                            .font(.system(size: 20, weight: .heavy))
                            .foregroundStyle(CatoTheme.ink)
                            .lineLimit(1)
                            .minimumScaleFactor(0.82)
                        Text(candidate.displaySubtitle.isEmpty ? "Profile details pending" : candidate.displaySubtitle)
                            .font(CatoTheme.small)
                            .foregroundStyle(CatoTheme.muted)
                            .lineLimit(2)
                        if let semesterLabel = candidate.semesterLabel, !semesterLabel.isEmpty {
                            Text(semesterLabel)
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(CatoTheme.muted)
                        }
                    }
                    Spacer()
                    MatchScoreBadge(score: candidate.matchScore)
                }

                LazyVGrid(columns: [GridItem(.adaptive(minimum: 112), spacing: 8)], spacing: 8) {
                    ProfileFactPill(label: "Profile \(candidate.profileStrength)%", icon: "chart.pie")
                    if let gpa = candidate.gpa {
                        ProfileFactPill(label: String(format: "GPA %.2f", gpa), icon: "graduationcap")
                    }
                    if candidate.hasResume {
                        ProfileFactPill(label: "Resume", icon: "doc.text")
                    }
                    if candidate.hasDeeperSignal {
                        ProfileFactPill(label: "Deeper signal", icon: "play.rectangle")
                    }
                    if !candidate.projects.isEmpty {
                        ProfileFactPill(label: "\(candidate.projects.count) projects", icon: "hammer")
                    }
                    if !candidate.internships.isEmpty {
                        ProfileFactPill(label: "\(candidate.internships.count) internships", icon: "briefcase")
                    }
                }
            }
        }
    }
}

private struct ProfileFactPill: View {
    let label: String
    let icon: String

    var body: some View {
        Label(label, systemImage: icon)
            .font(.caption.weight(.semibold))
            .foregroundStyle(CatoTheme.purple)
            .lineLimit(1)
            .minimumScaleFactor(0.75)
            .padding(.horizontal, 8)
            .padding(.vertical, 7)
            .frame(maxWidth: .infinity)
            .background(CatoTheme.purpleSoft)
            .clipShape(Capsule())
    }
}

private struct CandidateDetailEmptyCard: View {
    let title: String
    let message: String

    var body: some View {
        CatoCard {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "tray")
                    .font(.headline)
                    .foregroundStyle(CatoTheme.purple)
                    .frame(width: 38, height: 38)
                    .background(CatoTheme.purpleSoft)
                    .clipShape(Circle())
                VStack(alignment: .leading, spacing: 5) {
                    Text(title)
                        .font(CatoTheme.cardTitle)
                        .foregroundStyle(CatoTheme.ink)
                    Text(message)
                        .font(CatoTheme.small)
                        .foregroundStyle(CatoTheme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }
}

private struct CandidateAboutSection: View {
    let candidate: RecruiterCandidate

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if let signalSummary = candidate.signalSummary, !signalSummary.isEmpty {
                CatoCard {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Signal")
                            .font(CatoTheme.cardTitle)
                        Text(signalSummary)
                            .font(CatoTheme.body)
                            .foregroundStyle(CatoTheme.muted)
                    }
                }
            }

            if !candidate.softSkills.isEmpty {
                CatoCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Soft signals")
                            .font(CatoTheme.cardTitle)
                        ForEach(candidate.softSkills.prefix(6)) { skill in
                            HStack {
                                Text(skill.label)
                                    .font(.system(size: 13, weight: .semibold))
                                Spacer()
                                Text(String(format: "%.1f", skill.rating))
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(CatoTheme.purple)
                            }
                        }
                    }
                }
            }

            if candidate.signalSummary?.isEmpty != false && candidate.softSkills.isEmpty {
                CandidateDetailEmptyCard(title: "Profile context pending", message: "This candidate has not added additional profile context yet.")
            }
        }
    }
}

private struct CandidateResumeSection: View {
    let candidate: RecruiterCandidate
    @State private var isPreviewingResume = false

    private var resumeURL: URL? {
        guard let urlString = candidate.resumePreviewUrl ?? candidate.resumeUrl else { return nil }
        return URL(string: urlString)
    }

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 14) {
                Text("Resume")
                    .font(CatoTheme.cardTitle)
                if candidate.hasResume {
                    Label(candidate.resumeFileName ?? "Resume available", systemImage: "doc.text.fill")
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(CatoTheme.ink)
                    if resumeURL != nil {
                        Button("Preview resume") {
                            isPreviewingResume = true
                        }
                        .buttonStyle(CatoPrimaryButtonStyle())
                    } else {
                        Text("Resume preview link is not available.")
                            .font(CatoTheme.body)
                            .foregroundStyle(CatoTheme.muted)
                    }
                    if let resumeURL {
                        Link("Open externally", destination: resumeURL)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(CatoTheme.purple)
                    }
                } else {
                    Text("This candidate has not uploaded a resume yet.")
                        .font(CatoTheme.body)
                        .foregroundStyle(CatoTheme.muted)
                }
            }
        }
        .sheet(isPresented: $isPreviewingResume) {
            if let resumeURL {
                ResumePreviewSheet(url: resumeURL, title: candidate.resumeFileName ?? "Resume")
            }
        }
    }
}

private struct ResumePreviewSheet: View {
    let url: URL
    let title: String

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ResumeWebView(url: url)
                .ignoresSafeArea(edges: .bottom)
                .navigationTitle(title)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("Close") {
                            dismiss()
                        }
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        ShareLink(item: url) {
                            Image(systemName: "square.and.arrow.up")
                        }
                    }
                }
        }
    }
}

private struct ResumeWebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.backgroundColor = .systemBackground
        webView.scrollView.backgroundColor = .systemBackground
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if webView.url != url {
            webView.load(URLRequest(url: url))
        }
    }
}

private struct CandidateVideoSection: View {
    let candidate: RecruiterCandidate

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if candidate.tenSecondVideoUrl?.isEmpty == false {
                CandidateVideoPlayer(title: "Short take", urlString: candidate.tenSecondVideoUrl)
            }
            if candidate.thirtySecondVideoUrl?.isEmpty == false {
                CandidateVideoPlayer(title: "Deeper signal", urlString: candidate.thirtySecondVideoUrl)
            }
            if candidate.tenSecondVideoUrl?.isEmpty != false && candidate.thirtySecondVideoUrl?.isEmpty != false {
                CandidateDetailEmptyCard(title: "No videos available", message: "This profile does not have recruiter-visible videos yet.")
            }
        }
    }
}

private struct CandidateVideoPlayer: View {
    let title: String
    let urlString: String?

    @State private var player: AVPlayer?

    private var url: URL? {
        guard let urlString else { return nil }
        return URL(string: urlString)
    }

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text(title)
                        .font(CatoTheme.cardTitle)
                    Spacer()
                    if player != nil {
                        Label("Video", systemImage: "play.circle.fill")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(CatoTheme.purple)
                    }
                }

                if let player {
                    VideoPlayer(player: player)
                        .frame(height: 196)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14, style: .continuous)
                                .stroke(CatoTheme.border, lineWidth: 1)
                        )
                } else {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(CatoTheme.border.opacity(0.45))
                        .frame(height: 190)
                        .overlay(
                            VStack(spacing: 8) {
                                Image(systemName: url == nil ? "video.slash" : "play.slash")
                                    .font(.system(size: 42))
                                Text(url == nil ? "\(title) not available" : "Unable to load video")
                                    .font(.caption.weight(.semibold))
                            }
                            .foregroundStyle(CatoTheme.muted)
                        )
                }
            }
        }
        .onAppear {
            guard player == nil, let url else { return }
            player = AVPlayer(url: url)
        }
        .onDisappear {
            player?.pause()
        }
    }
}

private struct CandidateMoreSection: View {
    let candidate: RecruiterCandidate

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if !candidate.projects.isEmpty {
                CatoCard {
                    VStack(alignment: .leading, spacing: 12) {
                       Text("Projects")
                            .font(CatoTheme.cardTitle)
                        ForEach(candidate.projects) { project in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(project.title)
                                    .font(.system(size: 13, weight: .semibold))
                                Text(project.description)
                                    .font(.caption)
                                    .foregroundStyle(CatoTheme.muted)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            if project.id != candidate.projects.last?.id {
                                Divider()
                            }
                        }
                    }
                }
            }

            if !candidate.internships.isEmpty {
                CatoCard {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Internships")
                            .font(CatoTheme.cardTitle)
                        ForEach(candidate.internships) { internship in
                            Text("\(internship.roleDepartment) at \(internship.company)")
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundStyle(CatoTheme.ink)
                            if internship.id != candidate.internships.last?.id {
                                Divider()
                            }
                        }
                    }
                }
            }

            if candidate.projects.isEmpty && candidate.internships.isEmpty {
                CandidateDetailEmptyCard(title: "No added evidence yet", message: "Projects and internships will appear here when available.")
            }
        }
    }
}
