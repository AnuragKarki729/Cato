import SwiftUI
import CatoNativeCore

struct ApplicantShellView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var selectedTab: ApplicantShellTab = .home
    @State private var isManualMatchingMissing = false
    @State private var sseClient: CatoSSEClient?
    @StateObject private var keyboard = KeyboardVisibilityObserver()

    var body: some View {
        ZStack(alignment: .bottom) {
            Group {
                switch selectedTab {
                case .home:
                    ApplicantHomeView()
                case .requests:
                    ApplicantRequestsView()
                case .reels:
                    NavigationStack {
                        ApplicantReelsView()
                    }
                case .profile:
                    ApplicantProfileView()
                case .settings:
                    ApplicantSettingsView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(.bottom, keyboard.isKeyboardVisible ? 0 : 88)

            if !keyboard.isKeyboardVisible {
                ApplicantBottomBar(selectedTab: $selectedTab, isManualMatchingMissing: isManualMatchingMissing)
                    .padding(.horizontal, 18)
                    .padding(.bottom, 10)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.easeInOut(duration: 0.18), value: keyboard.isKeyboardVisible)
        .background(CatoTheme.background.ignoresSafeArea())
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .task {
            startEventStream()
            await loadManualMatchingStatus()
        }
        .onDisappear {
            sseClient?.stop()
            sseClient = nil
        }
        .onChange(of: selectedTab) { tab in
            if tab == .profile {
                Task { await loadManualMatchingStatus() }
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .applicantSearchProfileDidChange)) { _ in
            Task { await loadManualMatchingStatus() }
        }
        .onReceive(NotificationCenter.default.publisher(for: .applicantSelectProfileTab)) { _ in
            selectedTab = .profile
            Task { await loadManualMatchingStatus() }
        }
    }

    private func loadManualMatchingStatus() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }
        do {
            async let searchProfileResponse = apiClient.getApplicantSearchProfile(accessToken: accessToken)
            async let resumeResponse = apiClient.getApplicantResume(accessToken: accessToken)
            let searchProfile = try await searchProfileResponse.profile
            let resume = try await resumeResponse
            isManualMatchingMissing = searchProfile == nil && resume.parseStatus != .ready
        } catch {
            isManualMatchingMissing = false
        }
    }

    private func startEventStream() {
        guard sseClient == nil, let accessToken = auth.accessToken else { return }
        do {
            let client = CatoSSEClient(config: try CatoConfig.load(), accessToken: accessToken, role: .applicant)
            sseClient = client
            client.start()
        } catch {
            // SSE is best-effort. Normal REST loading still works if runtime config is unavailable.
        }
    }
}

private enum ApplicantShellTab: CaseIterable {
    case home
    case requests
    case reels
    case profile
    case settings

    var title: String {
        switch self {
        case .home: return "Home"
        case .requests: return "Requests"
        case .reels: return "Reels"
        case .profile: return "Profile"
        case .settings: return "Settings"
        }
    }

    var icon: String {
        switch self {
        case .home: return "house.fill"
        case .requests: return "envelope.fill"
        case .reels: return "film.fill"
        case .profile: return "person.crop.circle.fill"
        case .settings: return "gearshape.fill"
        }
    }
}

private struct ApplicantBottomBar: View {
    @Binding var selectedTab: ApplicantShellTab
    let isManualMatchingMissing: Bool

    var body: some View {
        HStack(alignment: .center, spacing: 10) {
            HStack(spacing: 8) {
                ApplicantTabButton(tab: .home, selectedTab: $selectedTab)
                ApplicantTabButton(tab: .requests, selectedTab: $selectedTab)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity)
            .background(.ultraThinMaterial)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(Color.white.opacity(0.58), lineWidth: 1))

            Button {
                selectedTab = .reels
            } label: {
                VStack(spacing: 4) {
                    Image(systemName: ApplicantShellTab.reels.icon)
                        .font(.system(size: 22, weight: .bold))
                    Text(ApplicantShellTab.reels.title)
                        .font(.caption2.weight(.bold))
                }
                .foregroundStyle(.white)
                .frame(width: 72, height: 72)
                .background(
                    Circle()
                        .fill(LinearGradient.catoPurple)
                        .shadow(color: CatoTheme.purple.opacity(0.3), radius: 14, y: 8)
                )
                .overlay(
                    Circle()
                        .stroke(Color.white.opacity(selectedTab == .reels ? 0.85 : 0.45), lineWidth: 2)
                )
                .scaleEffect(selectedTab == .reels ? 1.04 : 1)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Reels")

            HStack(spacing: 8) {
                ApplicantTabButton(tab: .profile, selectedTab: $selectedTab, showsWarning: isManualMatchingMissing)
                ApplicantTabButton(tab: .settings, selectedTab: $selectedTab)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity)
            .background(.ultraThinMaterial)
            .clipShape(Capsule())
            .overlay(Capsule().stroke(Color.white.opacity(0.58), lineWidth: 1))
        }
    }
}

private struct ApplicantTabButton: View {
    let tab: ApplicantShellTab
    @Binding var selectedTab: ApplicantShellTab
    var showsWarning = false

    private var isSelected: Bool {
        selectedTab == tab
    }

    var body: some View {
        Button {
            selectedTab = tab
        } label: {
            ZStack(alignment: .topTrailing) {
                VStack(spacing: 4) {
                    Image(systemName: tab.icon)
                        .font(.system(size: 20, weight: .semibold))
                    Text(tab.title)
                        .font(.caption2.weight(.semibold))
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                }
                .foregroundStyle(isSelected ? CatoTheme.purple : CatoTheme.ink.opacity(0.72))
                .frame(maxWidth: .infinity, minHeight: 50)
                .background(isSelected ? CatoTheme.purpleSoft : Color.clear)
                .clipShape(Capsule())

                if showsWarning {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundStyle(.orange)
                        .offset(x: 6, y: -5)
                        .zIndex(20)
                }
            }
            .zIndex(showsWarning ? 10 : 0)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(tab.title)
        .zIndex(showsWarning ? 10 : 0)
    }
}

struct ApplicantSectionHeader: View {
    let title: String
    let subtitle: String

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.headline.weight(.bold))
                .foregroundStyle(CatoTheme.ink)
            Spacer()
            Text(subtitle)
                .font(.caption.weight(.semibold))
                .foregroundStyle(CatoTheme.muted)
        }
    }
}

struct ApplicantRequestRow: View {
    let request: ApplicantInterestRequest

    var body: some View {
        HStack(alignment: .top, spacing: 11) {
            CandidateAvatar(name: request.companyName ?? request.recruiterName ?? "Recruiter", size: 42)
            VStack(alignment: .leading, spacing: 4) {
                Text(request.displayCompany)
                    .font(.subheadline.weight(.bold))
                    .foregroundStyle(CatoTheme.ink)
                Text(request.reason)
                    .font(.caption)
                    .foregroundStyle(CatoTheme.muted)
                    .lineLimit(2)
                if let roleCategory = request.roleCategory, !roleCategory.isEmpty {
                    Text(roleCategory)
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(CatoTheme.purple)
                }
            }
            Spacer()
            ApplicantRequestStatusBadge(status: request.status)
        }
        .padding(12)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(CatoTheme.border, lineWidth: 1)
        )
    }
}

struct ApplicantRequestStatusBadge: View {
    let status: ApplicantInterestRequestStatus

    var body: some View {
        Text(label)
            .font(.caption2.weight(.bold))
            .foregroundStyle(CatoTheme.purple)
            .padding(.horizontal, 8)
            .padding(.vertical, 5)
            .background(CatoTheme.purpleSoft)
            .clipShape(Capsule())
    }

    private var label: String {
        switch status {
        case .sent, .viewed:
            return "New"
        case .accepted:
            return "Accepted"
        case .declined:
            return "Declined"
        case .expired:
            return "Expired"
        }
    }
}

struct ApplicantErrorView: View {
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
