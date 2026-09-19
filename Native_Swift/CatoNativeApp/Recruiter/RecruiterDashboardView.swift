import AVKit
import SwiftUI
import CatoNativeCore

struct RecruiterDashboardView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var dashboard: RecruiterDashboardResponse?
    @State private var requests: [RecruiterInterestRequest] = []
    @State private var quickSearches: [RecruiterSavedFilter] = []
    @State private var errorMessage: String?
    @State private var isLoading = true

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    CatoLoadingView(message: "Loading dashboard")
                } else if let errorMessage {
                    RecruiterErrorView(message: errorMessage) {
                        Task { await loadDashboard() }
                    }
                } else if let dashboard {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 18) {
                            HStack(alignment: .top) {
                                VStack(alignment: .leading, spacing: 5) {
                                    CatoWordmark()
                                    Text("Good morning, \(dashboard.recruiter.name ?? "Recruiter")")
                                        .font(.system(size: 18, weight: .semibold))
                                    Text(dashboard.recruiter.companyName ?? dashboard.recruiter.email)
                                        .font(.subheadline)
                                        .foregroundStyle(CatoTheme.muted)
                                }

                                Spacer()

                                ZStack(alignment: .topTrailing) {
                                    Circle()
                                        .fill(CatoTheme.purpleSoft)
                                        .frame(width: 42, height: 42)
                                        .overlay(Image(systemName: "bell").foregroundStyle(CatoTheme.purple))
                                    Circle()
                                        .fill(CatoTheme.purple)
                                        .frame(width: 9, height: 9)
                                }
                            }

                            NavigationLink {
                                RecruiterSearchView()
                            } label: {
                                RecruiterSearchHero()
                            }
                            .buttonStyle(.plain)

                            HStack(spacing: 10) {
                                MetricCard(value: "\(dashboard.metrics.candidates)", label: "Matches")
                                MetricCard(value: "\(dashboard.metrics.bookmarks)", label: "Bookmarked")
                                MetricCard(value: "\(dashboard.metrics.messages)", label: "Messages")
                            }

                            HStack(spacing: 12) {
                                NavigationLink {
                                    RecruiterEvidenceQueueView()
                                } label: {
                                    RecruiterShortcutCard(title: "Evidence Queue", subtitle: "Review strongest signals", icon: "checkmark.seal", tint: CatoTheme.purple)
                                }

                                NavigationLink {
                                    RecruiterShortlistView()
                                } label: {
                                    RecruiterShortcutCard(title: "Shortlist", subtitle: "Compare finalists", icon: "person.3", tint: CatoTheme.purpleDeep)
                                }
                            }

                            CatoCard {
                                VStack(alignment: .leading, spacing: 12) {
                                    SectionHeader(title: "Quick Search", subtitle: "Saved filters")

                                    if quickSearches.isEmpty {
                                        DashboardEmptyHint(
                                            icon: "slider.horizontal.3",
                                            text: "Saved searches will appear here after you create reusable candidate filters."
                                        )
                                    } else {
                                        ScrollView(.horizontal, showsIndicators: false) {
                                            HStack(spacing: 10) {
                                                ForEach(quickSearches.prefix(10)) { search in
                                                    NavigationLink {
                                                        RecruiterResultsView(title: search.name, filters: search.criteria)
                                                    } label: {
                                                        QuickSearchPill(search: search)
                                                    }
                                                    .buttonStyle(.plain)
                                                }
                                            }
                                        }
                                    }
                                }
                            }

                            CatoCard {
                                VStack(alignment: .leading, spacing: 12) {
                                    SectionHeader(title: "Interest Requests", subtitle: "\(requests.count) sent")

                                    if requests.isEmpty {
                                        DashboardEmptyHint(
                                            icon: "paperplane",
                                            text: "Sent requests will appear here after you contact candidates."
                                        )
                                    } else {
                                        ScrollView(.horizontal, showsIndicators: false) {
                                            HStack(spacing: 12) {
                                                ForEach(requests.prefix(4)) { request in
                                                    NavigationLink {
                                                        CandidateReviewView(candidateId: request.candidateId)
                                                    } label: {
                                                        InterestRequestMiniCard(request: request)
                                                    }
                                                    .buttonStyle(.plain)
                                                }
                                            }
                                        }
                                    }

                                    if requests.count > 10 {
                                        Button("View all requests") {}
                                            .font(.subheadline.weight(.semibold))
                                            .foregroundStyle(CatoTheme.purple)
                                    }
                                }
                            }
                        }
                        .padding(CatoTheme.screenPadding)
                        .padding(.bottom, 96)
                    }
                }
            }
            .background(CatoTheme.background.ignoresSafeArea())
            .task {
                await loadDashboard()
            }
        }
    }

    private func loadDashboard() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to load recruiter dashboard."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            async let dashboardResponse = apiClient.getRecruiterDashboard(accessToken: accessToken)
            async let requestResponse = apiClient.getRecruiterInterestRequests(accessToken: accessToken)
            async let filterResponse = apiClient.getRecruiterSavedFilters(accessToken: accessToken)
            dashboard = try await dashboardResponse
            requests = try await requestResponse.requests
            quickSearches = try await filterResponse.filters
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

private struct SectionHeader: View {
    let title: String
    let subtitle: String

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.headline)
            Spacer()
            Text(subtitle)
                .font(.caption.weight(.semibold))
                .foregroundStyle(CatoTheme.muted)
        }
    }
}

private struct RecruiterSearchHero: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 5) {
                    Text("SEARCH")
                        .font(.caption.weight(.heavy))
                        .foregroundStyle(.white.opacity(0.68))
                    Text("Dynamic Search")
                        .font(.system(size: 22, weight: .heavy))
                        .foregroundStyle(.white)
                }

                Spacer()

                Image(systemName: "arrow.right")
                    .font(.system(size: 21, weight: .heavy))
                    .foregroundStyle(CatoTheme.purple)
                    .frame(width: 48, height: 48)
                    .background(.white)
                    .clipShape(Circle())
            }

            Text("Build a role-specific candidate pool from filters, skills, field depth, and deterministic match ranking.")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white.opacity(0.82))
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(18)
        .background(LinearGradient.catoPurple)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .shadow(color: CatoTheme.purple.opacity(0.16), radius: 16, x: 0, y: 8)
    }
}

private struct DashboardEmptyHint: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .font(.subheadline.weight(.bold))
                .foregroundStyle(CatoTheme.purple)
                .frame(width: 30, height: 30)
                .background(CatoTheme.purpleSoft)
                .clipShape(Circle())
            Text(text)
                .font(CatoTheme.small)
                .foregroundStyle(CatoTheme.muted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(CatoTheme.background)
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

private struct QuickSearchPill: View {
    let search: RecruiterSavedFilter

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "slider.horizontal.3")
            Text(search.name)
                .lineLimit(1)
        }
        .font(.subheadline.weight(.heavy))
        .foregroundStyle(CatoTheme.purple)
        .padding(.horizontal, 13)
        .padding(.vertical, 10)
        .background(CatoTheme.purpleSoft)
        .clipShape(Capsule())
        .overlay(
            Capsule()
                .stroke(CatoTheme.purple.opacity(0.12), lineWidth: 1)
        )
    }
}

private struct MetricCard: View {
    let value: String
    let label: String

    var body: some View {
        CatoCard {
            VStack(spacing: 5) {
                Text(value)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(CatoTheme.purple)
                Text(label)
                    .font(.caption.weight(.medium))
                    .lineLimit(1)
                    .minimumScaleFactor(0.75)
                    .foregroundStyle(CatoTheme.muted)
            }
            .frame(maxWidth: .infinity)
        }
    }
}

struct RecruiterErrorView: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(spacing: 14) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 34))
                .foregroundStyle(CatoTheme.purple)
            Text("Something went wrong")
                .font(.system(size: 19, weight: .bold))
            Text(message)
                .font(.subheadline)
                .foregroundStyle(CatoTheme.muted)
                .multilineTextAlignment(.center)
            Button("Try again", action: retry)
                .buttonStyle(CatoPrimaryButtonStyle())
                .padding(.top, 8)
        }
        .padding(CatoTheme.screenPadding)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(CatoTheme.background.ignoresSafeArea())
    }
}

private struct RecruiterShortcutCard: View {
    let title: String
    let subtitle: String
    let icon: String
    let tint: Color

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Image(systemName: icon)
                        .font(.headline)
                        .foregroundStyle(tint)
                        .frame(width: 34, height: 34)
                        .background(CatoTheme.purpleSoft)
                        .clipShape(Circle())
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(CatoTheme.muted)
                }
                Text(title)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(CatoTheme.ink)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(CatoTheme.muted)
                    .lineLimit(2)
            }
        }
    }
}

private struct InterestRequestMiniCard: View {
    let request: RecruiterInterestRequest

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                CandidateAvatar(name: request.candidateName ?? "Candidate", size: 42)
                Spacer()
                Text(request.status.rawValue.capitalized)
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(CatoTheme.purple)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(CatoTheme.purpleSoft)
                    .clipShape(Capsule())
            }
            Text(request.candidateName ?? "Candidate")
                .font(.subheadline.weight(.bold))
                .foregroundStyle(CatoTheme.ink)
                .lineLimit(1)
            Text(request.reason.isEmpty ? "Open candidate review" : request.reason)
                .font(.caption)
                .foregroundStyle(CatoTheme.muted)
                .lineLimit(2)
            Text("Sent \(shortDate(request.sentAt))")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(CatoTheme.muted.opacity(0.82))
        }
        .padding(14)
        .frame(width: 196, alignment: .leading)
        .background(CatoTheme.card)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(CatoTheme.border, lineWidth: 1)
        )
    }

    private func shortDate(_ value: String) -> String {
        String(value.prefix(10))
    }
}

struct RecruiterVideoFeedView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var clips: [RecruiterFeedClip] = []
    @State private var currentIndex = 0
    @State private var isShowingDeeperSignal = false
    @State private var viewedVideoIds = Set<String>()
    @State private var likedVideoIds = Set<String>()
    @State private var sentInterestVideoIds = Set<String>()
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        ZStack {
            CatoTheme.background.ignoresSafeArea()

            if isLoading {
                CatoLoadingView(message: "Loading reels")
            } else if let errorMessage {
                RecruiterErrorView(message: errorMessage) {
                    Task { await loadVideos() }
                }
            } else if clips.isEmpty {
                RecruiterEmptyStateView(
                    icon: "film",
                    title: "No applicant videos yet",
                    message: "Intro videos and profile reels will appear here when candidates add them."
                )
                .padding(CatoTheme.screenPadding)
            } else {
                RecruiterReelPlayer(
                    clip: currentClip,
                    isShowingDeeperSignal: isShowingDeeperSignal,
                    clipPositionText: "\(currentIndex + 1) / \(clips.count)",
                    isLiked: currentClip.reel.map { likedVideoIds.contains($0.id) } ?? false,
                    interestSent: currentClip.reel.map { sentInterestVideoIds.contains($0.id) } ?? sentInterestVideoIds.contains(currentClip.candidateId),
                    onSwipeUp: showNextClip,
                    onSwipeDown: showPreviousClip,
                    onSwipeRight: showDeeperSignalIfAvailable,
                    onSwipeLeft: hideDeeperSignal,
                    onLike: { Task { await toggleLikeCurrentClip() } },
                    onInterest: { Task { await sendInterestCurrentClip() } }
                )
                .id(currentClip.id + "\(isShowingDeeperSignal)")
                .transition(.opacity)
            }
        }
        .navigationTitle("Reels")
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadVideos() }
        .onChange(of: currentIndex) { _ in
            isShowingDeeperSignal = false
            markCurrentViewed()
        }
        .onChange(of: isShowingDeeperSignal) { _ in
            markCurrentViewed()
        }
    }

    private var currentClip: RecruiterFeedClip {
        clips[min(max(currentIndex, 0), max(clips.count - 1, 0))]
    }

    private func loadVideos() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to load reels."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil
        do {
            async let candidateResponse = apiClient.getRecruiterCandidates(accessToken: accessToken)
            async let videoResponse = apiClient.getVideoFeed(accessToken: accessToken, recruiter: true, limit: 50)
            let candidates = try await candidateResponse.candidates
            let reels = try await videoResponse.videos

            clips = buildFeedClips(candidates: candidates, reels: reels)
            currentIndex = min(currentIndex, max(clips.count - 1, 0))
            markCurrentViewed()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func buildFeedClips(candidates: [RecruiterCandidate], reels: [ApplicantReelVideo]) -> [RecruiterFeedClip] {
        var output = [RecruiterFeedClip]()
        var includedReelIds = Set<String>()

        for candidate in candidates {
            if let introUrl = candidate.tenSecondVideoUrl, !introUrl.isEmpty {
                output.append(
                    RecruiterFeedClip(
                        id: "intro-\(candidate.id)",
                        candidateId: candidate.id,
                        candidateName: candidate.displayName,
                        candidateSubtitle: candidate.displaySubtitle,
                        title: "Introductory video",
                        caption: candidate.signalSummary,
                        videoUrl: introUrl,
                        thumbnailUrl: nil,
                        kind: .intro,
                        deeperVideoUrl: candidate.thirtySecondVideoUrl?.isEmpty == false ? candidate.thirtySecondVideoUrl : nil,
                        reel: nil
                    )
                )
            }
        }

        for reel in reels {
            includedReelIds.insert(reel.id)
            output.append(RecruiterFeedClip(reel: reel))
        }

        return output.filter { !$0.videoUrl.isEmpty }
    }

    private func showNextClip() {
        guard currentIndex < clips.count - 1 else { return }
        withAnimation(.easeInOut(duration: 0.18)) {
            currentIndex += 1
            isShowingDeeperSignal = false
        }
    }

    private func showPreviousClip() {
        guard currentIndex > 0 else { return }
        withAnimation(.easeInOut(duration: 0.18)) {
            currentIndex -= 1
            isShowingDeeperSignal = false
        }
    }

    private func showDeeperSignalIfAvailable() {
        guard currentClip.kind == .intro, currentClip.deeperVideoUrl != nil else { return }
        withAnimation(.easeInOut(duration: 0.18)) {
            isShowingDeeperSignal = true
        }
    }

    private func hideDeeperSignal() {
        guard isShowingDeeperSignal else { return }
        withAnimation(.easeInOut(duration: 0.18)) {
            isShowingDeeperSignal = false
        }
    }

    private func markCurrentViewed() {
        guard let reel = currentClip.reel, !isShowingDeeperSignal else { return }
        Task { await markViewed(reel) }
    }

    private func markViewed(_ video: ApplicantReelVideo) async {
        guard !viewedVideoIds.contains(video.id),
              let apiClient = auth.catoAPIClient,
              let accessToken = auth.accessToken else { return }
        viewedVideoIds.insert(video.id)
        try? await apiClient.markVideoViewed(accessToken: accessToken, videoId: video.id)
    }

    private func toggleLikeCurrentClip() async {
        guard let reel = currentClip.reel, !isShowingDeeperSignal else { return }
        await toggleLike(reel)
    }

    private func toggleLike(_ video: ApplicantReelVideo) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }
        let nextValue = !likedVideoIds.contains(video.id)
        do {
            try await apiClient.setVideoLike(accessToken: accessToken, videoId: video.id, liked: nextValue)
            if nextValue {
                likedVideoIds.insert(video.id)
            } else {
                likedVideoIds.remove(video.id)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func sendInterestCurrentClip() async {
        if let reel = currentClip.reel, !isShowingDeeperSignal {
            await sendInterest(reel)
            return
        }

        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }
        do {
            try await apiClient.sendRecruiterInterestRequest(
                accessToken: accessToken,
                candidateId: currentClip.candidateId,
                reason: "Your profile video stood out. I would like to learn more about your experience.",
                sourceType: nil,
                sourceVideoId: nil,
                sourceProjectId: nil,
                sourceInternshipId: nil,
                sourceAccomplishmentId: nil
            )
            sentInterestVideoIds.insert(currentClip.candidateId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func sendInterest(_ video: ApplicantReelVideo) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }

        let projectId = video.links.first { $0.targetType == "project" }?.targetId
        let internshipId = video.links.first { $0.targetType == "internship" }?.targetId
        let accomplishmentId = video.links.first { $0.targetType == "accomplishment" }?.targetId

        do {
            try await apiClient.sendRecruiterInterestRequest(
                accessToken: accessToken,
                candidateId: video.applicantId,
                reason: "Your video stood out. I would like to learn more about your experience.",
                sourceType: "video",
                sourceVideoId: video.id,
                sourceProjectId: projectId,
                sourceInternshipId: internshipId,
                sourceAccomplishmentId: accomplishmentId
            )
            sentInterestVideoIds.insert(video.id)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private enum RecruiterFeedClipKind {
    case intro
    case reel
}

private struct RecruiterFeedClip: Identifiable, Equatable {
    let id: String
    let candidateId: String
    let candidateName: String
    let candidateSubtitle: String
    let title: String
    let caption: String?
    let videoUrl: String
    let thumbnailUrl: String?
    let kind: RecruiterFeedClipKind
    let deeperVideoUrl: String?
    let reel: ApplicantReelVideo?

    init(
        id: String,
        candidateId: String,
        candidateName: String,
        candidateSubtitle: String,
        title: String,
        caption: String?,
        videoUrl: String,
        thumbnailUrl: String?,
        kind: RecruiterFeedClipKind,
        deeperVideoUrl: String?,
        reel: ApplicantReelVideo?
    ) {
        self.id = id
        self.candidateId = candidateId
        self.candidateName = candidateName
        self.candidateSubtitle = candidateSubtitle
        self.title = title
        self.caption = caption
        self.videoUrl = videoUrl
        self.thumbnailUrl = thumbnailUrl
        self.kind = kind
        self.deeperVideoUrl = deeperVideoUrl
        self.reel = reel
    }

    init(reel: ApplicantReelVideo) {
        self.id = "reel-\(reel.id)"
        self.candidateId = reel.applicantId
        self.candidateName = reel.applicantName ?? "Applicant"
        self.candidateSubtitle = "\(reel.viewCount) views • \(reel.likeCount) likes"
        self.title = "Profile reel"
        self.caption = reel.caption
        self.videoUrl = reel.optimizedVideoUrl.isEmpty ? reel.videoUrl : reel.optimizedVideoUrl
        self.thumbnailUrl = reel.thumbnailUrl
        self.kind = .reel
        self.deeperVideoUrl = nil
        self.reel = reel
    }
}

private struct RecruiterReelPlayer: View {
    let clip: RecruiterFeedClip
    let isShowingDeeperSignal: Bool
    let clipPositionText: String
    let isLiked: Bool
    let interestSent: Bool
    let onSwipeUp: () -> Void
    let onSwipeDown: () -> Void
    let onSwipeRight: () -> Void
    let onSwipeLeft: () -> Void
    let onLike: () -> Void
    let onInterest: () -> Void

    @State private var player: AVPlayer?
    @State private var isPlaying = false

    private var activeVideoUrl: String {
        if isShowingDeeperSignal, let deeperVideoUrl = clip.deeperVideoUrl {
            return deeperVideoUrl
        }
        return clip.videoUrl
    }

    private var activeTitle: String {
        isShowingDeeperSignal ? "Deeper signal" : clip.title
    }

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                Color.black.ignoresSafeArea()

                if let player {
                    VideoPlayer(player: player)
                        .ignoresSafeArea()
                        .onTapGesture {
                            togglePlayback()
                        }
                } else if let thumbnailUrl = clip.thumbnailUrl {
                    AsyncImage(url: URL(string: thumbnailUrl)) { image in
                        image
                            .resizable()
                            .scaledToFill()
                    } placeholder: {
                        Rectangle().fill(Color.black)
                    }
                    .ignoresSafeArea()
                }

                LinearGradient(
                    colors: [.black.opacity(0.72), .clear, .black.opacity(0.78)],
                    startPoint: .top,
                    endPoint: .bottom
                )
                .ignoresSafeArea()

                VStack {
                    HStack {
                        Text("Applicant reels")
                            .font(.headline.weight(.heavy))
                            .foregroundStyle(.white)
                        Spacer()
                        Text(clipPositionText)
                            .font(.caption.weight(.heavy))
                            .foregroundStyle(.white.opacity(0.85))
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(.white.opacity(0.16))
                            .clipShape(Capsule())
                    }
                    .padding(.horizontal, 18)
                    .padding(.top, 10)

                    Spacer()

                    if !isPlaying {
                        Button(action: togglePlayback) {
                            Image(systemName: "play.fill")
                                .font(.system(size: 34, weight: .heavy))
                                .foregroundStyle(CatoTheme.purple)
                                .frame(width: 78, height: 78)
                                .background(.white.opacity(0.93))
                                .clipShape(Circle())
                        }
                        .buttonStyle(.plain)
                    }

                    Spacer()

                    HStack(alignment: .bottom, spacing: 14) {
                        VStack(alignment: .leading, spacing: 8) {
                            NavigationLink {
                                CandidateReviewView(candidateId: clip.candidateId)
                            } label: {
                                HStack(spacing: 9) {
                                    CandidateAvatar(name: clip.candidateName, size: 42)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text(clip.candidateName)
                                            .font(.headline.weight(.heavy))
                                            .foregroundStyle(.white)
                                            .lineLimit(1)
                                        if !clip.candidateSubtitle.isEmpty {
                                            Text(clip.candidateSubtitle)
                                                .font(.caption.weight(.semibold))
                                                .foregroundStyle(.white.opacity(0.78))
                                                .lineLimit(1)
                                        }
                                    }
                                }
                            }
                            .buttonStyle(.plain)

                            HStack(spacing: 8) {
                                Text(activeTitle)
                                    .font(.caption.weight(.heavy))
                                    .foregroundStyle(.white)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 6)
                                    .background(.white.opacity(0.17))
                                    .clipShape(Capsule())

                                if clip.kind == .intro, clip.deeperVideoUrl != nil {
                                    Text(isShowingDeeperSignal ? "Swipe left for intro" : "Swipe right for deeper signal")
                                        .font(.caption2.weight(.bold))
                                        .foregroundStyle(.white.opacity(0.8))
                                        .lineLimit(1)
                                }
                            }

                            if let caption = clip.caption, !caption.isEmpty, !isShowingDeeperSignal {
                                Text(caption)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(.white)
                                    .lineLimit(3)
                            }
                        }

                        Spacer()

                        VStack(spacing: 18) {
                            if clip.reel != nil && !isShowingDeeperSignal {
                                Button(action: onLike) {
                                    VStack(spacing: 4) {
                                        Image(systemName: isLiked ? "heart.fill" : "heart")
                                            .font(.title2.weight(.heavy))
                                        Text(isLiked ? "Liked" : "Like")
                                            .font(.caption2.weight(.bold))
                                    }
                                }
                                .foregroundStyle(.white)
                                .buttonStyle(.plain)
                            }

                            Button(action: onInterest) {
                                VStack(spacing: 4) {
                                    Image(systemName: "paperplane.fill")
                                        .font(.title2.weight(.heavy))
                                    Text(interestSent ? "Sent" : "Interested")
                                        .font(.caption2.weight(.bold))
                                }
                            }
                            .foregroundStyle(interestSent ? .white.opacity(0.5) : .white)
                            .buttonStyle(.plain)
                            .disabled(interestSent)

                            NavigationLink {
                                CandidateReviewView(candidateId: clip.candidateId)
                            } label: {
                                VStack(spacing: 4) {
                                    Image(systemName: "person.crop.circle.badge.checkmark")
                                        .font(.title2.weight(.heavy))
                                    Text("Profile")
                                        .font(.caption2.weight(.bold))
                                }
                            }
                            .foregroundStyle(.white)
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 18)
                    .padding(.bottom, max(geometry.safeAreaInsets.bottom + 102, 124))
                }
            }
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 34)
                    .onEnded { value in
                        if abs(value.translation.height) > abs(value.translation.width) {
                            value.translation.height < 0 ? onSwipeUp() : onSwipeDown()
                        } else {
                            value.translation.width > 0 ? onSwipeRight() : onSwipeLeft()
                        }
                    }
            )
            .onAppear(perform: configurePlayer)
            .onChange(of: activeVideoUrl) { _ in configurePlayer() }
            .onDisappear {
                player?.pause()
            }
        }
    }

    private func configurePlayer() {
        guard let url = URL(string: activeVideoUrl) else {
            player = nil
            isPlaying = false
            return
        }

        let nextPlayer = AVPlayer(url: url)
        player = nextPlayer
        isPlaying = false
    }

    private func togglePlayback() {
        guard let player else { return }
        if isPlaying {
            player.pause()
        } else {
            player.play()
        }
        isPlaying.toggle()
    }
}
