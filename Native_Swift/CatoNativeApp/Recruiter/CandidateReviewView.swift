import AVKit
import SwiftUI
import WebKit
import CatoNativeCore

struct CandidateReviewView: View {
    let candidateId: String
    var runtimeSearchSpec: RuntimeSearchSpec?
    var runtimeMatchScore: RuntimeMatchScore?

    @EnvironmentObject private var auth: AuthViewModel
    @State private var candidate: RecruiterCandidate?
    @State private var profileVideos: [ApplicantReelVideo] = []
    @State private var accomplishments: [ApplicantAccomplishment] = []
    @State private var viewedVideoIds = Set<String>()
    @State private var matchAudit: RuntimeSearchAuditResponse?
    @State private var errorMessage: String?
    @State private var auditErrorMessage: String?
    @State private var isLoading = true
    @State private var isLoadingAudit = false
    @State private var isShowingAuditSheet = false
    @State private var actionMessage: String?
    @State private var isActing = false
    @State private var isDecisionCardVisible = true
    @State private var isPastCompactScrollThreshold = false
    @State private var reviewScrollOffset: CGFloat = 0

    private var displayedMatchScore: Int {
        runtimeMatchScore?.totalScore ?? candidate?.matchScore ?? 0
    }

    var body: some View {
        Group {
            if isLoading {
                CatoLoadingView(message: "Loading candidate")
            } else if let errorMessage {
                RecruiterErrorView(message: errorMessage) {
                    Task { await loadCandidate() }
                }
            } else if let candidate {
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        CandidateReviewScrollOffsetObserver(offset: $reviewScrollOffset)
                            .frame(width: 0, height: 0)

                        CandidateReviewHeaderCard(
                            candidate: candidate,
                            runtimeMatchScore: runtimeMatchScore,
                            displayedMatchScore: displayedMatchScore,
                            reelCount: profileVideos.count
                        )

                        if let actionMessage {
                            Text(actionMessage)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(CatoTheme.purple)
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(CatoTheme.purpleSoft)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }

                        if runtimeSearchSpec != nil {
                            Button {
                                Task { await loadAuditAndShow() }
                            } label: {
                                if isLoadingAudit {
                                    ProgressView().tint(.white).frame(maxWidth: .infinity)
                                } else {
                                    Label("Why this match?", systemImage: "list.bullet.clipboard")
                                        .frame(maxWidth: .infinity)
                                }
                            }
                            .buttonStyle(CatoPrimaryButtonStyle())
                            .disabled(isLoadingAudit)
                        }

                        if let runtimeMatchScore {
                            CandidateReviewSearchReasons(score: runtimeMatchScore)
                        }

                        CandidateReviewActions(
                            candidate: candidate,
                            isActing: isActing,
                            bookmarkCandidate: { Task { await bookmarkCandidate() } },
                            sendInterestRequest: { Task { await sendInterestRequest() } }
                        )

                        CandidateProfileVideoStack(
                            candidate: candidate,
                            reels: profileVideos,
                            markViewed: { video in Task { await markViewed(video) } },
                            sendInterest: { video in Task { await sendInterestRequest(sourceVideo: video) } }
                        )

                        if candidate.hasResume {
                            CandidateReviewResumeSection(candidate: candidate)
                        }

                        if !accomplishments.isEmpty {
                            CandidateAccomplishmentsSection(accomplishments: accomplishments)
                        }

                        if !candidate.projects.isEmpty {
                            CandidateProjectsSection(projects: candidate.projects)
                        }

                        if !candidate.internships.isEmpty {
                            CandidateInternshipsSection(internships: candidate.internships)
                        }

                        if !candidate.matchEvidence.isEmpty {
                            CatoCard {
                                VStack(alignment: .leading, spacing: 12) {
                                    SectionTitle(title: "Match evidence", trailing: "\(candidate.matchEvidence.count) signals")
                                    ForEach(candidate.matchEvidence) { item in
                                        HStack(alignment: .top, spacing: 10) {
                                            Image(systemName: item.strength == "strong" ? "checkmark.circle.fill" : "checkmark.circle")
                                                .foregroundStyle(CatoTheme.purple)
                                                .padding(.top, 1)
                                            VStack(alignment: .leading, spacing: 3) {
                                                Text(item.title)
                                                    .font(.subheadline.weight(.semibold))
                                                Text(item.body)
                                                    .font(.caption)
                                                    .foregroundStyle(CatoTheme.muted)
                                            }
                                        }
                                        if item.id != candidate.matchEvidence.last?.id {
                                            Divider()
                                        }
                                    }
                                }
                            }
                        }

                        if !candidate.needsValidation.isEmpty {
                            CatoCard {
                                VStack(alignment: .leading, spacing: 12) {
                                    SectionTitle(title: "Needs validation", trailing: "Check before advancing")
                                    ForEach(candidate.needsValidation) { item in
                                        HStack(alignment: .top, spacing: 10) {
                                            Image(systemName: "exclamationmark.circle.fill")
                                                .foregroundStyle(.orange)
                                                .padding(.top, 1)
                                            VStack(alignment: .leading, spacing: 3) {
                                                Text(item.title)
                                                    .font(.subheadline.weight(.semibold))
                                                Text(item.body)
                                                    .font(.caption)
                                                    .foregroundStyle(CatoTheme.muted)
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        if !candidate.softSkills.isEmpty {
                            CatoCard {
                                VStack(alignment: .leading, spacing: 12) {
                                    SectionTitle(title: "Soft signals", trailing: "Legacy signal")
                                    ForEach(candidate.softSkills.prefix(4)) { skill in
                                        HStack {
                                            Text(skill.label)
                                                .font(.subheadline.weight(.semibold))
                                            Spacer()
                                            Text(String(format: "%.1f", skill.rating))
                                                .font(.caption.weight(.bold))
                                                .foregroundStyle(CatoTheme.purple)
                                        }
                                    }
                                }
                            }
                        }

                    }
                    .padding(CatoTheme.screenPadding)
                    .padding(.bottom, 104)
                }
                .coordinateSpace(name: "candidateReviewScroll")
                .onPreferenceChange(DecisionCardVisiblePreferenceKey.self) { isVisible in
                    withAnimation(.easeInOut(duration: 0.16)) {
                        isDecisionCardVisible = isVisible && !isPastCompactScrollThreshold
                    }
                }
                .onChange(of: reviewScrollOffset) { offset in
                    let threshold = UIScreen.main.bounds.height * 0.1
                    let pastThreshold = offset > threshold
                    print("[candidate-review-scroll-debug] offset=\(Int(offset)) threshold=\(Int(threshold)) pastThreshold=\(pastThreshold)")
                    withAnimation(.easeInOut(duration: 0.16)) {
                        isPastCompactScrollThreshold = pastThreshold
                        isDecisionCardVisible = !pastThreshold
                    }
                }
                .safeAreaInset(edge: .bottom) {
                    CandidateStickyDecisionBar(
                        status: candidate.reviewStatus,
                        isActing: isActing,
                        isCompact: isPastCompactScrollThreshold,
                        updateStatus: { status in Task { await updateStatus(status) } }
                    )
                    .padding(.horizontal, CatoTheme.screenPadding)
                    .padding(.bottom, 10)
                }
            }
        }
        .background(CatoTheme.background.ignoresSafeArea())
        .navigationTitle("Candidate Review")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if let candidate, !isDecisionCardVisible {
                ToolbarItem(placement: .principal) {
                    CandidateFloatingTopActions(
                        candidate: candidate,
                        isActing: isActing,
                        bookmarkCandidate: { Task { await bookmarkCandidate() } },
                        sendInterestRequest: { Task { await sendInterestRequest() } }
                    )
                    .transition(.opacity.combined(with: .scale(scale: 0.96)))
                }
            }
        }
        .task {
            await loadCandidate()
        }
        .sheet(isPresented: $isShowingAuditSheet) {
            MatchAuditSheet(audit: matchAudit, errorMessage: auditErrorMessage, isLoading: isLoadingAudit) {
                Task { await loadAudit() }
            }
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
            async let candidateResponse = apiClient.getRecruiterCandidate(accessToken: accessToken, candidateId: candidateId)
            async let mediaResponse = apiClient.getRecruiterCandidateProfileMedia(accessToken: accessToken, candidateId: candidateId)
            candidate = try await candidateResponse.candidate
            let media = try await mediaResponse
            profileVideos = media.videos
            accomplishments = media.accomplishments
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    private func loadAuditAndShow() async {
        isShowingAuditSheet = true
        await loadAudit()
    }

    private func loadAudit() async {
        guard let runtimeSearchSpec, let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            auditErrorMessage = "Search context is unavailable for this candidate."
            return
        }

        isLoadingAudit = true
        auditErrorMessage = nil

        do {
            matchAudit = try await apiClient.auditRuntimeMatching(accessToken: accessToken, spec: runtimeSearchSpec, applicantId: candidateId)
        } catch {
            auditErrorMessage = error.localizedDescription
        }

        isLoadingAudit = false
    }

    private func updateStatus(_ status: RecruiterReviewStatus) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }
        isActing = true
        defer { isActing = false }

        do {
            try await apiClient.updateRecruiterCandidateReview(accessToken: accessToken, candidateId: candidateId, status: status)
            actionMessage = "Candidate marked \(status.rawValue)."
            await loadCandidate()
        } catch {
            actionMessage = error.localizedDescription
        }
    }

    private func bookmarkCandidate() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }
        isActing = true
        defer { isActing = false }

        do {
            try await apiClient.bookmarkRecruiterCandidate(accessToken: accessToken, candidateId: candidateId)
            actionMessage = "Profile bookmarked."
            await loadCandidate()
        } catch {
            actionMessage = error.localizedDescription
        }
    }

    private func sendInterestRequest() async {
        await sendInterestRequest(sourceVideo: nil)
    }

    private func sendInterestRequest(sourceVideo: ApplicantReelVideo?) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }
        isActing = true
        defer { isActing = false }

        do {
            let projectId = sourceVideo?.links.first { $0.targetType == "project" }?.targetId
            let internshipId = sourceVideo?.links.first { $0.targetType == "internship" }?.targetId
            let accomplishmentId = sourceVideo?.links.first { $0.targetType == "accomplishment" }?.targetId
            try await apiClient.sendRecruiterInterestRequest(
                accessToken: accessToken,
                candidateId: candidateId,
                reason: sourceVideo == nil
                    ? "Your profile stood out for this opportunity."
                    : "Your video stood out. I would like to learn more about your experience.",
                sourceType: sourceVideo == nil ? nil : "video",
                sourceVideoId: sourceVideo?.id,
                sourceProjectId: projectId,
                sourceInternshipId: internshipId,
                sourceAccomplishmentId: accomplishmentId
            )
            actionMessage = "Interest request sent."
            await loadCandidate()
        } catch {
            actionMessage = error.localizedDescription
        }
    }

    private func markViewed(_ video: ApplicantReelVideo) async {
        guard !viewedVideoIds.contains(video.id),
              let apiClient = auth.catoAPIClient,
              let accessToken = auth.accessToken else { return }

        viewedVideoIds.insert(video.id)
        try? await apiClient.markVideoViewed(accessToken: accessToken, videoId: video.id)
    }
}

private struct SectionTitle: View {
    let title: String
    let trailing: String

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.headline)
                .foregroundStyle(CatoTheme.ink)
            Spacer()
            Text(trailing)
                .font(.caption.weight(.bold))
                .foregroundStyle(CatoTheme.muted)
        }
    }
}

private struct ReviewScoreRing: View {
    let score: Int

    var body: some View {
        ZStack {
            Circle()
                .stroke(CatoTheme.purpleSoft, lineWidth: 9)
                .frame(width: 72, height: 72)
            Circle()
                .trim(from: 0, to: CGFloat(min(max(score, 0), 100)) / 100)
                .stroke(CatoTheme.purple, style: StrokeStyle(lineWidth: 9, lineCap: .round))
                .frame(width: 72, height: 72)
                .rotationEffect(.degrees(-90))
            VStack(spacing: 0) {
                Text("\(score)%")
                    .font(.headline.weight(.bold))
                Text("match")
                    .font(.caption2.weight(.bold))
            }
            .foregroundStyle(CatoTheme.purple)
        }
    }
}

private struct CandidateReviewHeaderCard: View {
    let candidate: RecruiterCandidate
    let runtimeMatchScore: RuntimeMatchScore?
    let displayedMatchScore: Int
    let reelCount: Int

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 16) {
                HStack(alignment: .top, spacing: 12) {
                    CandidateAvatar(name: candidate.displayName, size: 66)

                    VStack(alignment: .leading, spacing: 6) {
                        Text(runtimeMatchScore == nil ? candidate.matchStrength.replacingOccurrences(of: "_", with: " ").capitalized : "Runtime match")
                            .font(.caption.weight(.heavy))
                            .foregroundStyle(CatoTheme.purple)
                        Text(candidate.displayName)
                            .font(.system(size: 20, weight: .heavy))
                            .foregroundStyle(CatoTheme.ink)
                            .lineLimit(1)
                            .minimumScaleFactor(0.82)
                        Text(candidate.displaySubtitle.isEmpty ? "Profile details pending" : candidate.displaySubtitle)
                            .font(CatoTheme.small)
                            .foregroundStyle(CatoTheme.muted)
                            .lineLimit(2)
                    }

                    Spacer()

                    ReviewScoreRing(score: displayedMatchScore)
                }

                LazyVGrid(columns: [GridItem(.adaptive(minimum: 112), spacing: 8)], spacing: 8) {
                    ReviewBadge(label: "Profile \(candidate.profileStrength)%", icon: "chart.pie")
                    ReviewBadge(label: "\(reelCount) reels", icon: "film")
                    if candidate.hasResume {
                        ReviewBadge(label: "Resume", icon: "doc.text")
                    }
                    if candidate.hasDeeperSignal {
                        ReviewBadge(label: "Deeper signal", icon: "play.rectangle")
                    }
                    if !candidate.projects.isEmpty {
                        ReviewBadge(label: "\(candidate.projects.count) projects", icon: "hammer")
                    }
                    if !candidate.internships.isEmpty {
                        ReviewBadge(label: "\(candidate.internships.count) internships", icon: "briefcase")
                    }
                }

                if let componentScores = runtimeMatchScore?.componentScores {
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Score breakdown")
                            .font(.caption.weight(.heavy))
                            .foregroundStyle(CatoTheme.muted)
                        HStack(spacing: 8) {
                            CandidateScoreMetric(label: "Relevance", value: componentScores.bm25)
                            CandidateScoreMetric(label: "Fit", value: componentScores.filters)
                            CandidateScoreMetric(label: "Profile", value: componentScores.profileStrength)
                        }
                    }
                }
            }
        }
    }
}

private struct CandidateScoreMetric: View {
    let label: String
    let value: Double

    var body: some View {
        VStack(spacing: 4) {
            Text("\(Int(value.rounded()))")
                .font(.subheadline.weight(.heavy))
                .foregroundStyle(CatoTheme.ink)
            Text(label)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(CatoTheme.muted)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 9)
        .background(Color.white.opacity(0.72))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .stroke(CatoTheme.border, lineWidth: 1)
        )
    }
}

private struct CandidateReviewSearchReasons: View {
    let score: RuntimeMatchScore

    var body: some View {
        if !score.reasons.isEmpty || !score.blockers.isEmpty {
            CatoCard {
                VStack(alignment: .leading, spacing: 12) {
                    SectionTitle(title: "Search fit", trailing: "\(score.totalScore)%")

                    ForEach(score.reasons.prefix(4), id: \.self) { reason in
                        Label(reason, systemImage: "checkmark.circle.fill")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(CatoTheme.muted)
                            .lineLimit(3)
                    }

                    if !score.blockers.isEmpty {
                        Divider()
                        ForEach(score.blockers.prefix(2), id: \.self) { blocker in
                            Label(blocker, systemImage: "exclamationmark.triangle.fill")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.orange)
                                .lineLimit(3)
                        }
                    }
                }
            }
        }
    }
}

private struct CandidateProfileVideoStack: View {
    let candidate: RecruiterCandidate
    let reels: [ApplicantReelVideo]
    let markViewed: (ApplicantReelVideo) -> Void
    let sendInterest: (ApplicantReelVideo) -> Void
    @State private var selectedVideo: CandidateProfileVideo?

    private var featuredVideos: [CandidateProfileVideo] {
        var videos = [CandidateProfileVideo]()
        if let introUrl = candidate.tenSecondVideoUrl, !introUrl.isEmpty {
            videos.append(CandidateProfileVideo(id: "intro", title: "Introductory video", caption: candidate.signalSummary, urlString: introUrl, thumbnailUrl: nil, sourceReel: nil))
        }
        if let deeperUrl = candidate.thirtySecondVideoUrl, !deeperUrl.isEmpty {
            videos.append(CandidateProfileVideo(id: "deeper", title: "Deeper signal", caption: nil, urlString: deeperUrl, thumbnailUrl: nil, sourceReel: nil))
        }
        return videos
    }

    private var reelVideos: [CandidateProfileVideo] {
        reels.map { reel in
            CandidateProfileVideo(
                id: reel.id,
                title: "Profile reel",
                caption: reel.caption,
                urlString: reel.optimizedVideoUrl.isEmpty ? reel.videoUrl : reel.optimizedVideoUrl,
                thumbnailUrl: reel.thumbnailUrl,
                sourceReel: reel
            )
        }
    }

    private var allVideos: [CandidateProfileVideo] {
        featuredVideos + reelVideos
    }

    var body: some View {
        if !allVideos.isEmpty {
            VStack(alignment: .leading, spacing: 14) {
                ForEach(featuredVideos) { video in
                    CandidateProfileVideoCard(
                        video: video,
                        markViewed: markViewed,
                        sendInterest: sendInterest,
                        openFullScreen: { selectedVideo = video }
                    )
                }

                if !reelVideos.isEmpty {
                    CandidateReelThumbnailGrid(
                        videos: reelVideos,
                        openVideo: { selectedVideo = $0 }
                    )
                }
            }
            .fullScreenCover(item: $selectedVideo) { video in
                CandidateVideoReelViewer(
                    videos: allVideos,
                    initialVideoId: video.id,
                    markViewed: markViewed,
                    sendInterest: sendInterest
                )
            }
        }
    }
}

private struct CandidateProfileVideo: Identifiable {
    let id: String
    let title: String
    let caption: String?
    let urlString: String
    let thumbnailUrl: String?
    let sourceReel: ApplicantReelVideo?
}

private struct CandidateProfileVideoCard: View {
    let video: CandidateProfileVideo
    let markViewed: (ApplicantReelVideo) -> Void
    let sendInterest: (ApplicantReelVideo) -> Void
    let openFullScreen: () -> Void

    @State private var player: AVPlayer?

    private var url: URL? {
        URL(string: video.urlString)
    }

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text(video.title)
                        .font(.headline)
                    Spacer()
                    if let reel = video.sourceReel {
                        Text("\(reel.viewCount) views • \(reel.likeCount) likes")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(CatoTheme.muted)
                    }
                }

                if let player {
                    VideoPlayer(player: player)
                        .frame(height: 360)
                        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        .overlay(
                            RoundedRectangle(cornerRadius: 18, style: .continuous)
                                .stroke(CatoTheme.border, lineWidth: 1)
                        )
                        .overlay(alignment: .bottomTrailing) {
                            Button(action: openFullScreen) {
                                Label("Full screen", systemImage: "arrow.up.left.and.arrow.down.right")
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(.white)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 8)
                                    .background(.black.opacity(0.62))
                                    .clipShape(Capsule())
                            }
                            .padding(12)
                        }
                }

                if let caption = video.caption, !caption.isEmpty {
                    Text(caption)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(CatoTheme.ink)
                }

                if let reel = video.sourceReel {
                    HStack {
                        Text("\(reel.links.count) linked evidence")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(CatoTheme.purple)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(CatoTheme.purpleSoft)
                            .clipShape(Capsule())
                        Spacer()
                        Button(action: openFullScreen) {
                            Label("Watch", systemImage: "play.fill")
                        }
                        .font(.caption.weight(.bold))
                        .foregroundStyle(CatoTheme.purple)
                        Button {
                            sendInterest(reel)
                        } label: {
                            Label("Interested", systemImage: "paperplane.fill")
                        }
                        .font(.caption.weight(.bold))
                        .foregroundStyle(CatoTheme.purple)
                    }
                }
            }
        }
        .onAppear {
            if player == nil, let url {
                player = AVPlayer(url: url)
            }
        }
        .onDisappear {
            player?.pause()
        }
    }
}

private struct CandidateReelThumbnailGrid: View {
    let videos: [CandidateProfileVideo]
    let openVideo: (CandidateProfileVideo) -> Void

    private let columns = [
        GridItem(.flexible(), spacing: 8),
        GridItem(.flexible(), spacing: 8),
        GridItem(.flexible(), spacing: 8)
    ]

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                SectionTitle(title: "Profile reels", trailing: "\(videos.count)")

                LazyVGrid(columns: columns, spacing: 8) {
                    ForEach(videos) { video in
                        Button {
                            openVideo(video)
                        } label: {
                            ZStack(alignment: .bottomLeading) {
                                if let thumbnailUrl = video.thumbnailUrl, !thumbnailUrl.isEmpty {
                                    AsyncImage(url: URL(string: thumbnailUrl)) { image in
                                        image
                                            .resizable()
                                            .scaledToFill()
                                    } placeholder: {
                                        Rectangle().fill(CatoTheme.purpleSoft)
                                    }
                                } else {
                                    Rectangle().fill(CatoTheme.purpleSoft)
                                }

                                LinearGradient(
                                    colors: [.clear, .black.opacity(0.62)],
                                    startPoint: .center,
                                    endPoint: .bottom
                                )

                                Image(systemName: "play.fill")
                                    .font(.caption.weight(.heavy))
                                    .foregroundStyle(.white)
                                    .padding(7)
                            }
                            .aspectRatio(9 / 16, contentMode: .fit)
                            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                            .overlay(
                                RoundedRectangle(cornerRadius: 10, style: .continuous)
                                    .stroke(CatoTheme.border, lineWidth: 1)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
}

private struct CandidateVideoReelViewer: View {
    let videos: [CandidateProfileVideo]
    let initialVideoId: String
    let markViewed: (ApplicantReelVideo) -> Void
    let sendInterest: (ApplicantReelVideo) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var currentVideoId: String

    init(
        videos: [CandidateProfileVideo],
        initialVideoId: String,
        markViewed: @escaping (ApplicantReelVideo) -> Void,
        sendInterest: @escaping (ApplicantReelVideo) -> Void
    ) {
        self.videos = videos
        self.initialVideoId = initialVideoId
        self.markViewed = markViewed
        self.sendInterest = sendInterest
        _currentVideoId = State(initialValue: initialVideoId)
    }

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Color.black.ignoresSafeArea()

            CandidateVerticalReelPager(
                videos: videos,
                currentVideoId: $currentVideoId,
                sendInterest: sendInterest
            )
            .ignoresSafeArea()
            .onAppear {
                markCurrentVideoViewed()
            }
            .onChange(of: currentVideoId) { _ in
                markCurrentVideoViewed()
            }

            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.headline.weight(.bold))
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(.black.opacity(0.48))
                    .clipShape(Circle())
            }
            .padding(.top, 56)
            .padding(.trailing, 18)
        }
    }

    private func markCurrentVideoViewed() {
        guard let reel = videos.first(where: { $0.id == currentVideoId })?.sourceReel else { return }
        markViewed(reel)
    }
}

private struct CandidateVerticalReelPager: UIViewControllerRepresentable {
    let videos: [CandidateProfileVideo]
    @Binding var currentVideoId: String
    let sendInterest: (ApplicantReelVideo) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeUIViewController(context: Context) -> UIPageViewController {
        let controller = UIPageViewController(
            transitionStyle: .scroll,
            navigationOrientation: .vertical,
            options: nil
        )
        controller.dataSource = context.coordinator
        controller.delegate = context.coordinator
        context.coordinator.rebuildControllers(parent: self)
        if let current = context.coordinator.controller(for: currentVideoId) ?? context.coordinator.controllers.first {
            controller.setViewControllers([current], direction: .forward, animated: false)
        }
        return controller
    }

    func updateUIViewController(_ pageViewController: UIPageViewController, context: Context) {
        context.coordinator.rebuildControllers(parent: self)
        guard let target = context.coordinator.controller(for: currentVideoId) else { return }
        let visible = pageViewController.viewControllers?.first
        if visible !== target {
            pageViewController.setViewControllers([target], direction: .forward, animated: false)
        }
    }

    final class Coordinator: NSObject, UIPageViewControllerDataSource, UIPageViewControllerDelegate {
        var parent: CandidateVerticalReelPager
        var controllers = [UIHostingController<CandidateVideoReelPage>]()

        init(parent: CandidateVerticalReelPager) {
            self.parent = parent
        }

        func rebuildControllers(parent: CandidateVerticalReelPager) {
            self.parent = parent
            controllers = parent.videos.map { video in
                UIHostingController(
                    rootView: CandidateVideoReelPage(
                        video: video,
                        isActive: parent.currentVideoId == video.id,
                        sendInterest: parent.sendInterest
                    )
                )
            }
            controllers.forEach { controller in
                controller.view.backgroundColor = .black
            }
        }

        func controller(for videoId: String) -> UIHostingController<CandidateVideoReelPage>? {
            guard let index = parent.videos.firstIndex(where: { $0.id == videoId }) else { return nil }
            return controllers.indices.contains(index) ? controllers[index] : nil
        }

        func pageViewController(
            _ pageViewController: UIPageViewController,
            viewControllerBefore viewController: UIViewController
        ) -> UIViewController? {
            guard let index = controllers.firstIndex(where: { $0 === viewController }), index > 0 else { return nil }
            return controllers[index - 1]
        }

        func pageViewController(
            _ pageViewController: UIPageViewController,
            viewControllerAfter viewController: UIViewController
        ) -> UIViewController? {
            guard let index = controllers.firstIndex(where: { $0 === viewController }), index + 1 < controllers.count else { return nil }
            return controllers[index + 1]
        }

        func pageViewController(
            _ pageViewController: UIPageViewController,
            didFinishAnimating finished: Bool,
            previousViewControllers: [UIViewController],
            transitionCompleted completed: Bool
        ) {
            guard completed,
                  let visible = pageViewController.viewControllers?.first,
                  let index = controllers.firstIndex(where: { $0 === visible }) else { return }
            parent.currentVideoId = parent.videos[index].id
        }
    }
}

private struct CandidateVideoReelPage: View {
    let video: CandidateProfileVideo
    let isActive: Bool
    let sendInterest: (ApplicantReelVideo) -> Void

    @State private var player: AVPlayer?
    @State private var isPausedByUser = false
    @State private var isChromeVisible = true

    private var url: URL? {
        URL(string: video.urlString)
    }

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .bottomLeading) {
                if let player {
                    ReelPlayerLayerView(player: player)
                        .frame(width: proxy.size.width, height: proxy.size.height)
                        .background(Color.black)
                } else {
                    Color.black
                        .overlay {
                            ProgressView()
                                .tint(.white)
                        }
                }

                Color.clear
                    .contentShape(Rectangle())
                    .onTapGesture {
                        guard isActive else { return }
                        isPausedByUser.toggle()
                        isChromeVisible = true
                        applyPlayback()
                    }

                if isChromeVisible {
                    LinearGradient(
                        colors: [.clear, .black.opacity(0.78)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                    .frame(height: proxy.size.height * 0.46)
                    .frame(maxHeight: .infinity, alignment: .bottom)
                    .allowsHitTesting(false)

                    VStack(alignment: .leading, spacing: 12) {
                        Text(video.title)
                            .font(.headline.weight(.bold))
                            .foregroundStyle(.white)

                        if let caption = video.caption, !caption.isEmpty {
                            Text(caption)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.white.opacity(0.92))
                                .lineLimit(4)
                        }

                        if let reel = video.sourceReel {
                            HStack(spacing: 10) {
                                Label("\(reel.viewCount)", systemImage: "eye")
                                Label("\(reel.likeCount)", systemImage: "heart")
                                Text("\(reel.links.count) linked")
                            }
                            .font(.caption.weight(.bold))
                            .foregroundStyle(.white.opacity(0.82))

                            Button {
                                sendInterest(reel)
                            } label: {
                                Label("Interested in this video", systemImage: "paperplane.fill")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(CatoPrimaryButtonStyle())
                            .padding(.top, 4)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 54)
                }

                if isPausedByUser {
                    Image(systemName: "play.fill")
                        .font(.system(size: 30, weight: .bold))
                        .foregroundStyle(.white)
                        .frame(width: 76, height: 76)
                        .background(.black.opacity(0.48))
                        .clipShape(Circle())
                        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
                        .allowsHitTesting(false)
                }
            }
            .ignoresSafeArea()
        }
        .onAppear {
            if player == nil, let url {
                player = AVPlayer(url: url)
            }
            applyPlayback()
        }
        .onDisappear {
            player?.pause()
        }
        .onChange(of: isActive) { active in
            if active {
                player?.seek(to: .zero)
                isPausedByUser = false
                isChromeVisible = true
                applyPlayback()
            } else {
                player?.pause()
            }
        }
    }

    private func applyPlayback() {
        guard isActive else {
            player?.pause()
            return
        }

        if isPausedByUser {
            player?.pause()
        } else {
            player?.play()
        }
    }
}

private struct ReelPlayerLayerView: UIViewRepresentable {
    let player: AVPlayer

    func makeUIView(context: Context) -> PlayerLayerContainerView {
        let view = PlayerLayerContainerView()
        view.playerLayer.videoGravity = .resizeAspectFill
        view.playerLayer.player = player
        return view
    }

    func updateUIView(_ view: PlayerLayerContainerView, context: Context) {
        view.playerLayer.player = player
    }
}

private final class PlayerLayerContainerView: UIView {
    override static var layerClass: AnyClass {
        AVPlayerLayer.self
    }

    var playerLayer: AVPlayerLayer {
        layer as! AVPlayerLayer
    }
}

private struct CandidateReviewResumeSection: View {
    let candidate: RecruiterCandidate
    @State private var isPreviewingResume = false

    private var resumeURL: URL? {
        guard let urlString = candidate.resumePreviewUrl ?? candidate.resumeUrl else { return nil }
        return URL(string: urlString)
    }

    var body: some View {
        if let resumeURL {
            CatoCard {
                VStack(alignment: .leading, spacing: 12) {
                    SectionTitle(title: "Resume", trailing: candidate.resumeFileName ?? "PDF")
                    Button {
                        isPreviewingResume = true
                    } label: {
                        Label("Open resume", systemImage: "doc.text.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(CatoPrimaryButtonStyle())
                }
            }
            .sheet(isPresented: $isPreviewingResume) {
                CandidateResumePreviewSheet(url: resumeURL, title: candidate.resumeFileName ?? "Resume")
            }
        }
    }
}

private struct CandidateResumePreviewSheet: View {
    let url: URL
    let title: String
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            CandidateResumeWebView(url: url)
                .ignoresSafeArea(edges: .bottom)
                .navigationTitle(title)
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button("Close") { dismiss() }
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

private struct CandidateResumeWebView: UIViewRepresentable {
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

private struct CandidateAccomplishmentsSection: View {
    let accomplishments: [ApplicantAccomplishment]

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                SectionTitle(title: "Accomplishments", trailing: "\(accomplishments.count)")
                ForEach(accomplishments) { accomplishment in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(accomplishment.title)
                            .font(.subheadline.weight(.bold))
                        Text(accomplishment.description)
                            .font(.caption)
                            .foregroundStyle(CatoTheme.muted)
                        if let linkUrl = accomplishment.linkUrl, let url = URL(string: linkUrl) {
                            Link("Open link", destination: url)
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(CatoTheme.purple)
                        }
                    }
                    if accomplishment.id != accomplishments.last?.id {
                        Divider()
                    }
                }
            }
        }
    }
}

private struct CandidateProjectsSection: View {
    let projects: [RecruiterProject]

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                SectionTitle(title: "Projects", trailing: "\(projects.count)")
                ForEach(projects) { project in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(project.title)
                            .font(.subheadline.weight(.bold))
                        Text(project.description)
                            .font(.caption)
                            .foregroundStyle(CatoTheme.muted)
                        if let linkUrl = project.linkUrl, let url = URL(string: linkUrl) {
                            Link("Open project", destination: url)
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(CatoTheme.purple)
                        }
                    }
                    if project.id != projects.last?.id {
                        Divider()
                    }
                }
            }
        }
    }
}

private struct CandidateInternshipsSection: View {
    let internships: [RecruiterInternship]

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                SectionTitle(title: "Internships", trailing: "\(internships.count)")
                ForEach(internships) { internship in
                    HStack {
                        VStack(alignment: .leading, spacing: 3) {
                            Text(internship.roleDepartment)
                                .font(.subheadline.weight(.bold))
                            Text(internship.company)
                                .font(.caption)
                                .foregroundStyle(CatoTheme.muted)
                        }
                        Spacer()
                        Text("\(internship.durationMonths)m")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(CatoTheme.purple)
                    }
                    if internship.id != internships.last?.id {
                        Divider()
                    }
                }
            }
        }
    }
}

private struct CandidateSignalPreview: View {
    let candidate: RecruiterCandidate

    @State private var player: AVPlayer?

    private var url: URL? {
        guard let urlString = candidate.tenSecondVideoUrl else { return nil }
        return URL(string: urlString)
    }

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text("Candidate signal")
                        .font(.headline)
                    Spacer()
                    Text("10s")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(.black.opacity(0.7))
                        .clipShape(Capsule())
                }

                if let player {
                    VideoPlayer(player: player)
                        .frame(height: 190)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                } else {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(.black.opacity(0.82))
                        .frame(height: 190)
                        .overlay(
                            VStack(spacing: 8) {
                                Image(systemName: url == nil ? "video.slash" : "play.slash")
                                    .font(.system(size: 48))
                                Text(candidate.signalSummary ?? "Meet the person behind the profile.")
                                    .font(.caption.weight(.semibold))
                                    .multilineTextAlignment(.center)
                                    .padding(.horizontal)
                            }
                            .foregroundStyle(.white)
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

private struct MatchAuditSheet: View {
    let audit: RuntimeSearchAuditResponse?
    let errorMessage: String?
    let isLoading: Bool
    let retry: () -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if isLoading {
                        ProgressView("Auditing match")
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 32)
                    } else if let errorMessage {
                        CatoCard {
                            VStack(alignment: .leading, spacing: 12) {
                                Text("Could not audit this match")
                                    .font(CatoTheme.cardTitle)
                                Text(errorMessage)
                                    .font(CatoTheme.body)
                                    .foregroundStyle(CatoTheme.muted)
                                Button("Try again", action: retry)
                                    .buttonStyle(CatoPrimaryButtonStyle())
                            }
                        }
                    } else if let audit {
                        auditSummary(audit)
                        auditScore(audit.score)
                        auditList(title: "Strong signals", items: audit.score.reasons, emptyText: "No strong signals were produced for this search.")
                        auditManualContribution(audit.manualSearchContribution)
                        auditInputs(audit.searchInputsPresent)
                        auditList(title: "Missing or weaker signals", items: audit.score.blockers, emptyText: "No hard blockers for this search.")
                        auditList(title: "How this was checked", items: audit.verificationNotes, emptyText: "No verification notes.")
                    }
                }
                .padding(CatoTheme.screenPadding)
            }
            .background(CatoTheme.background.ignoresSafeArea())
            .navigationTitle("Why this match?")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private func auditSummary(_ audit: RuntimeSearchAuditResponse) -> some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(audit.applicant.displayName)
                            .font(CatoTheme.cardTitle)
                        Text(audit.applicant.displaySubtitle.isEmpty ? "Candidate profile" : audit.applicant.displaySubtitle)
                            .font(CatoTheme.small)
                            .foregroundStyle(CatoTheme.muted)
                    }
                    Spacer()
                    Text("\(audit.score.totalScore)%")
                        .font(.system(size: 26, weight: .bold))
                        .foregroundStyle(CatoTheme.purple)
                }

                HStack(spacing: 8) {
                    AuditStatusPill(
                        label: audit.eligibility.includedInRankedResults ? "Rank \(audit.eligibility.rank ?? 0)" : "Not ranked",
                        isPositive: audit.eligibility.includedInRankedResults
                    )
                    AuditStatusPill(
                        label: audit.eligibility.passesRuntimeFilters ? "Filters pass" : "Filtered out",
                        isPositive: audit.eligibility.passesRuntimeFilters
                    )
                }

                Text("\(audit.eligibility.totalRankedCandidates) ranked from \(audit.eligibility.totalEligibleCandidates) candidates who passed hard filters.")
                    .font(.caption)
                    .foregroundStyle(CatoTheme.muted)
            }
        }
    }

    private func auditInputs(_ inputs: RuntimeSearchAuditInputsPresent) -> some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("Profile evidence used")
                    .font(CatoTheme.cardTitle)
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                    AuditStatusPill(label: inputs.resumeUploaded ? "Resume uploaded" : "No resume", isPositive: inputs.resumeUploaded)
                    AuditStatusPill(label: inputs.resumeTextReady ? "Resume text ready" : "No parsed text", isPositive: inputs.resumeTextReady)
                    AuditStatusPill(label: "\(inputs.manualSkillCount) skills", isPositive: inputs.manualSkillCount > 0)
                    AuditStatusPill(label: "\(inputs.manualFieldCount) fields", isPositive: inputs.manualFieldCount > 0)
                    AuditStatusPill(label: inputs.depthReady ? "Depth ready" : "No depth", isPositive: inputs.depthReady)
                    AuditStatusPill(label: "\(inputs.projectCount) projects", isPositive: inputs.projectCount > 0)
                    AuditStatusPill(label: "\(inputs.internshipCount) internships", isPositive: inputs.internshipCount > 0)
                }
            }
        }
    }

    private func auditManualContribution(_ contribution: RuntimeSearchAuditManualContribution) -> some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("Selected skills and fields")
                    .font(CatoTheme.cardTitle)
                AuditStatusPill(
                    label: contribution.contributesToSearchText ? "Used in ranking" : "No manual profile signal",
                    isPositive: contribution.contributesToSearchText
                )
                AuditStatusPill(
                    label: contribution.depthMatch ? "Primary depth matched" : "Primary depth not matched",
                    isPositive: contribution.depthMatch
                )
                auditInlineValues(title: "Skill matches", values: contribution.skillMatches)
                auditInlineValues(title: "Field matches", values: contribution.fieldMatches)
            }
        }
    }

    private func auditScore(_ score: RuntimeMatchScore) -> some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("What drove the score")
                    .font(CatoTheme.cardTitle)
                if let componentScores = score.componentScores {
                    AuditScoreRow(label: "Resume relevance", value: componentScores.bm25)
                    AuditScoreRow(label: "Search fit", value: componentScores.filters)
                    AuditScoreRow(label: "Profile completeness", value: componentScores.profileStrength)
                    AuditScoreRow(label: "Project evidence", value: componentScores.projects)
                    AuditScoreRow(label: "Internship evidence", value: componentScores.internships)
                    AuditScoreRow(label: "Recent activity", value: componentScores.freshness)
                } else {
                    Text("Component scores are unavailable.")
                        .font(CatoTheme.body)
                        .foregroundStyle(CatoTheme.muted)
                }
            }
        }
    }

    private func auditList(title: String, items: [String], emptyText: String) -> some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 10) {
                Text(title)
                    .font(CatoTheme.cardTitle)
                if items.isEmpty {
                    Text(emptyText)
                        .font(CatoTheme.body)
                        .foregroundStyle(CatoTheme.muted)
                } else {
                    ForEach(items, id: \.self) { item in
                        Label(item, systemImage: "checkmark.circle")
                            .font(CatoTheme.small)
                            .foregroundStyle(CatoTheme.ink)
                    }
                }
            }
        }
    }

    private func auditInlineValues(title: String, values: [String]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title.uppercased())
                .font(.caption.weight(.bold))
                .foregroundStyle(CatoTheme.muted)
            if values.isEmpty {
                Text("None")
                    .font(CatoTheme.small)
                    .foregroundStyle(CatoTheme.muted)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(values, id: \.self) { value in
                            Text(value.replacingOccurrences(of: "_", with: " "))
                                .font(.caption.weight(.bold))
                                .foregroundStyle(CatoTheme.purple)
                                .padding(.horizontal, 9)
                                .padding(.vertical, 6)
                                .background(CatoTheme.purpleSoft)
                                .clipShape(Capsule())
                        }
                    }
                }
            }
        }
    }
}

private struct AuditStatusPill: View {
    let label: String
    let isPositive: Bool

    var body: some View {
        Text(label)
            .font(.caption.weight(.bold))
            .foregroundStyle(isPositive ? CatoTheme.purple : CatoTheme.muted)
            .lineLimit(1)
            .minimumScaleFactor(0.75)
            .padding(.horizontal, 9)
            .padding(.vertical, 6)
            .background(isPositive ? CatoTheme.purpleSoft : CatoTheme.background)
            .clipShape(Capsule())
    }
}

private struct AuditScoreRow: View {
    let label: String
    let value: Double

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack {
                Text(label)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(CatoTheme.ink)
                Spacer()
                Text("\(Int(value.rounded()))")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(CatoTheme.purple)
            }
            ProgressView(value: max(0, min(value, 100)), total: 100)
                .tint(CatoTheme.purple)
        }
    }
}

private struct CandidateReviewActions: View {
    let candidate: RecruiterCandidate
    let isActing: Bool
    let bookmarkCandidate: () -> Void
    let sendInterestRequest: () -> Void

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .firstTextBaseline) {
                    Text("Recruiter decision")
                        .font(CatoTheme.cardTitle)
                        .foregroundStyle(CatoTheme.ink)
                    Spacer()
                    Text(candidate.reviewStatus.rawValue.replacingOccurrences(of: "_", with: " ").capitalized)
                        .font(.caption.weight(.heavy))
                        .foregroundStyle(CatoTheme.purple)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(CatoTheme.purpleSoft)
                        .clipShape(Capsule())
                }

                Text("Keep the shortlist clean: pass quickly, hold uncertain profiles for another look, or advance candidates with strong evidence.")
                    .font(.caption)
                    .foregroundStyle(CatoTheme.muted)

                HStack(spacing: 9) {
                    Button {
                        sendInterestRequest()
                    } label: {
                        Label(candidate.interestRequestStatus == nil ? "Send interest" : "Interest sent", systemImage: "sparkles")
                            .font(.caption.weight(.heavy))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                    }
                    .foregroundStyle(.white)
                    .background(CatoTheme.purple)
                    .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
                    .disabled(isActing || candidate.interestRequestStatus == .sent || candidate.interestRequestStatus == .viewed)

                    Button {
                        bookmarkCandidate()
                    } label: {
                        Image(systemName: candidate.bookmarked ? "bookmark.fill" : "bookmark")
                            .font(.headline.weight(.heavy))
                            .frame(width: 46)
                            .padding(.vertical, 12)
                    }
                    .foregroundStyle(candidate.bookmarked ? CatoTheme.muted : CatoTheme.purple)
                    .background(candidate.bookmarked ? CatoTheme.background : CatoTheme.purpleSoft)
                    .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
                    .disabled(candidate.bookmarked || isActing)

                    NavigationLink {
                        RecruiterContactView(candidateId: candidate.id, mode: .request)
                    } label: {
                        Label("Contact", systemImage: "paperplane")
                            .font(.caption.weight(.heavy))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                    }
                    .foregroundStyle(CatoTheme.purple)
                    .background(CatoTheme.purpleSoft)
                    .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
                }
            }
        }
        .background(
            GeometryReader { proxy in
                Color.clear.preference(
                    key: DecisionCardVisiblePreferenceKey.self,
                    value: proxy.frame(in: .named("candidateReviewScroll")).maxY > 52
                )
            }
        )
    }
}

private struct DecisionCardVisiblePreferenceKey: PreferenceKey {
    static var defaultValue = true

    static func reduce(value: inout Bool, nextValue: () -> Bool) {
        value = nextValue()
    }
}

private struct CandidateReviewScrollOffsetObserver: UIViewRepresentable {
    @Binding var offset: CGFloat

    func makeCoordinator() -> Coordinator {
        Coordinator(offset: $offset)
    }

    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)
        view.backgroundColor = .clear
        DispatchQueue.main.async {
            context.coordinator.attachWhenAvailable(from: view)
        }
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        DispatchQueue.main.async {
            context.coordinator.attachWhenAvailable(from: uiView)
        }
    }

    final class Coordinator: NSObject {
        @Binding private var offset: CGFloat
        private weak var scrollView: UIScrollView?
        private var observation: NSKeyValueObservation?
        private var retryCount = 0

        init(offset: Binding<CGFloat>) {
            _offset = offset
        }

        func attachWhenAvailable(from view: UIView) {
            if let scrollView = view.enclosingScrollView {
                print("[candidate-review-scroll-debug] attached scrollView=\(type(of: scrollView)) contentOffset=\(Int(scrollView.contentOffset.y))")
                attach(to: scrollView)
                retryCount = 0
                return
            }

            guard retryCount < 20 else { return }
            retryCount += 1
            if retryCount == 1 || retryCount == 10 || retryCount == 20 {
                print("[candidate-review-scroll-debug] waiting for enclosing scrollView retry=\(retryCount)")
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) { [weak self, weak view] in
                guard let self, let view else { return }
                self.attachWhenAvailable(from: view)
            }
        }

        func attach(to scrollView: UIScrollView?) {
            guard let scrollView, self.scrollView !== scrollView else { return }
            self.scrollView = scrollView
            offset = scrollView.contentOffset.y
            observation = scrollView.observe(\.contentOffset, options: [.new]) { [weak self] scrollView, _ in
                DispatchQueue.main.async {
                    print("[candidate-review-scroll-debug] observed contentOffset=\(Int(scrollView.contentOffset.y))")
                    self?.offset = max(0, scrollView.contentOffset.y)
                }
            }
        }
    }
}

private extension UIView {
    var enclosingScrollView: UIScrollView? {
        var current = superview
        while let view = current {
            if let scrollView = view as? UIScrollView {
                return scrollView
            }
            current = view.superview
        }
        return nil
    }
}

private struct CandidateFloatingTopActions: View {
    let candidate: RecruiterCandidate
    let isActing: Bool
    let bookmarkCandidate: () -> Void
    let sendInterestRequest: () -> Void

    var body: some View {
        HStack(spacing: 7) {
            Button(action: sendInterestRequest) {
                FloatingActionIcon(icon: "sparkles", label: "Interest", isPrimary: true)
            }
            .disabled(isActing || candidate.interestRequestStatus == .sent || candidate.interestRequestStatus == .viewed)

            Button(action: bookmarkCandidate) {
                FloatingActionIcon(icon: candidate.bookmarked ? "bookmark.fill" : "bookmark", label: "Bookmark", isPrimary: false)
            }
            .disabled(candidate.bookmarked || isActing)

            NavigationLink {
                RecruiterContactView(candidateId: candidate.id, mode: .request)
            } label: {
                FloatingActionIcon(icon: "paperplane", label: "Contact", isPrimary: false)
            }
        }
        .padding(5)
        .background(.ultraThinMaterial)
        .clipShape(Capsule())
        .overlay(Capsule().stroke(Color.white.opacity(0.58), lineWidth: 1))
        .shadow(color: Color.black.opacity(0.08), radius: 10, y: 5)
    }
}

private struct FloatingActionIcon: View {
    let icon: String
    let label: String
    let isPrimary: Bool

    var body: some View {
        VStack(spacing: 3) {
            Image(systemName: icon)
                .font(.caption.weight(.heavy))
            Text(label)
                .font(.system(size: 9, weight: .heavy))
        }
        .foregroundStyle(isPrimary ? .white : CatoTheme.purple)
        .frame(width: 78, height: 36)
        .background(isPrimary ? CatoTheme.purple : CatoTheme.purpleSoft)
        .clipShape(Capsule())
    }
}

private struct CandidateStickyDecisionBar: View {
    let status: RecruiterReviewStatus
    let isActing: Bool
    let isCompact: Bool
    let updateStatus: (RecruiterReviewStatus) -> Void

    private var leftAction: RecruiterReviewStatus {
        status == .passed ? .maybe : .passed
    }

    private var rightAction: RecruiterReviewStatus {
        status == .shortlisted ? .maybe : .shortlisted
    }

    var body: some View {
        HStack(spacing: 10) {
            ReviewDecisionButton(title: title(for: leftAction), icon: icon(for: leftAction), isProminent: false, isCompact: isCompact, isDisabled: isActing) {
                updateStatus(leftAction)
            }

            Text(statusLabel)
                .font(.caption.weight(.heavy))
                .foregroundStyle(CatoTheme.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.75)
                .frame(width: 86)
                .padding(.vertical, 12)
                .background(CatoTheme.card.opacity(0.94))
                .clipShape(RoundedRectangle(cornerRadius: 15, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 15, style: .continuous)
                        .stroke(CatoTheme.border, lineWidth: 1)
                )
                .shadow(color: Color.black.opacity(0.08), radius: 10, y: 5)

            ReviewDecisionButton(title: title(for: rightAction), icon: icon(for: rightAction), isProminent: rightAction == .shortlisted, isCompact: isCompact, isDisabled: isActing) {
                updateStatus(rightAction)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private var statusLabel: String {
        switch status {
        case .passed: return "Passed"
        case .shortlisted: return "Shortlisted"
        case .maybe, .none: return "Maybe"
        }
    }

    private func title(for status: RecruiterReviewStatus) -> String {
        switch status {
        case .passed: return "Pass"
        case .shortlisted: return "Shortlist"
        case .maybe, .none: return "Maybe?"
        }
    }

    private func icon(for status: RecruiterReviewStatus) -> String {
        switch status {
        case .passed: return "xmark"
        case .shortlisted: return "checkmark"
        case .maybe, .none: return "questionmark"
        }
    }
}

private struct ReviewDecisionButton: View {
    let title: String
    let icon: String
    let isProminent: Bool
    let isCompact: Bool
    let isDisabled: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: isCompact ? 0 : 7) {
                Image(systemName: icon)
                    .font(.headline.weight(.heavy))
                if !isCompact {
                    Text(title)
                        .font(.caption.weight(.heavy))
                        .lineLimit(1)
                        .minimumScaleFactor(0.78)
                }
            }
            .frame(maxWidth: isCompact ? 58 : .infinity)
            .frame(height: 46)
            .contentShape(Rectangle())
        }
        .foregroundStyle(isProminent ? .white : CatoTheme.purple)
        .background(isProminent ? CatoTheme.purple : CatoTheme.purpleSoft)
        .clipShape(Capsule())
        .overlay(
            Capsule()
                .stroke(isProminent ? Color.clear : CatoTheme.purple.opacity(0.14), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.07), radius: 10, y: 5)
        .disabled(isDisabled)
        .opacity(isDisabled ? 0.45 : 1)
    }
}

private struct ReviewBadge: View {
    let label: String
    let icon: String

    var body: some View {
        Label(label, systemImage: icon)
            .font(.caption.weight(.semibold))
            .foregroundStyle(CatoTheme.purple)
            .lineLimit(1)
            .minimumScaleFactor(0.75)
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(CatoTheme.purpleSoft)
            .clipShape(Capsule())
    }
}
