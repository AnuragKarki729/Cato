import SwiftUI

struct RecruiterShellView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var selectedTab: RecruiterShellTab = .home
    @State private var sseClient: CatoSSEClient?
    @State private var unreadMessageCount = 0
    @StateObject private var keyboard = KeyboardVisibilityObserver()

    var body: some View {
        ZStack(alignment: .bottom) {
            Group {
                switch selectedTab {
                case .home:
                    RecruiterDashboardView()
                case .search:
                    NavigationStack {
                        RecruiterSearchView()
                    }
                case .reels:
                    NavigationStack {
                        RecruiterVideoFeedView()
                    }
                case .messages:
                    RecruiterMessagesView()
                case .settings:
                    RecruiterSettingsView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .padding(.bottom, keyboard.isKeyboardVisible ? 0 : 88)

            if !keyboard.isKeyboardVisible {
                RecruiterBottomBar(
                    selectedTab: $selectedTab,
                    unreadMessageCount: unreadMessageCount
                )
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
            await loadUnreadMessageCount()
        }
        .onReceive(NotificationCenter.default.publisher(for: .catoMessageEventReceived)) { _ in
            Task { await loadUnreadMessageCount() }
        }
        .onReceive(NotificationCenter.default.publisher(for: .catoMessageReadStateDidChange)) { _ in
            Task { await loadUnreadMessageCount() }
        }
        .onDisappear {
            sseClient?.stop()
            sseClient = nil
        }
    }

    private func startEventStream() {
        guard sseClient == nil, let accessToken = auth.accessToken else { return }
        do {
            let client = CatoSSEClient(config: try CatoConfig.load(), accessToken: accessToken, role: .recruiter)
            sseClient = client
            client.start()
        } catch {
            // SSE is best-effort. Normal REST loading still works if runtime config is unavailable.
        }
    }

    private func loadUnreadMessageCount() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            unreadMessageCount = 0
            return
        }

        do {
            unreadMessageCount = try await apiClient.getRecruiterMessages(accessToken: accessToken).unreadCount ?? 0
        } catch {
            unreadMessageCount = 0
        }
    }
}

private enum RecruiterShellTab: CaseIterable {
    case home
    case search
    case reels
    case messages
    case settings

    var title: String {
        switch self {
        case .home: return "Home"
        case .search: return "Search"
        case .reels: return "Reels"
        case .messages: return "Messages"
        case .settings: return "Settings"
        }
    }

    var icon: String {
        switch self {
        case .home: return "house.fill"
        case .search: return "magnifyingglass"
        case .reels: return "film.fill"
        case .messages: return "message.fill"
        case .settings: return "gearshape.fill"
        }
    }
}

private struct RecruiterBottomBar: View {
    @Binding var selectedTab: RecruiterShellTab
    let unreadMessageCount: Int

    var body: some View {
        HStack(alignment: .center, spacing: 10) {
            HStack(spacing: 8) {
                RecruiterTabButton(tab: .home, selectedTab: $selectedTab)
                RecruiterTabButton(tab: .search, selectedTab: $selectedTab)
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
                    Image(systemName: RecruiterShellTab.reels.icon)
                        .font(.system(size: 22, weight: .bold))
                    Text(RecruiterShellTab.reels.title)
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
                RecruiterTabButton(
                    tab: .messages,
                    selectedTab: $selectedTab,
                    badgeCount: unreadMessageCount
                )
                RecruiterTabButton(tab: .settings, selectedTab: $selectedTab)
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

private struct RecruiterTabButton: View {
    let tab: RecruiterShellTab
    @Binding var selectedTab: RecruiterShellTab
    var badgeCount = 0

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
                        .minimumScaleFactor(0.72)
                }
                .foregroundStyle(isSelected ? CatoTheme.purple : CatoTheme.ink.opacity(0.72))
                .frame(maxWidth: .infinity, minHeight: 50)
                .background(isSelected ? CatoTheme.purpleSoft : Color.clear)
                .clipShape(Capsule())

                if badgeCount > 0 {
                    Text(badgeCount > 9 ? "9+" : "\(badgeCount)")
                        .font(.caption2.weight(.heavy))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(Color.red)
                        .clipShape(Capsule())
                        .offset(x: 7, y: -5)
                        .zIndex(20)
                }
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(tab.title)
    }
}
