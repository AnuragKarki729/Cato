import SwiftUI
import CatoNativeCore

struct RecruiterMessagesView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var messages: [RecruiterMessage] = []
    @State private var errorMessage: String?
    @State private var isLoading = true

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    CatoLoadingView(message: "Loading messages")
                } else if let errorMessage {
                    RecruiterErrorView(message: errorMessage) {
                        Task { await loadMessages() }
                    }
                } else if conversationSummaries.isEmpty {
                    RecruiterEmptyStateView(
                        icon: "message",
                        title: "Messages",
                        message: "Messaging opens after an accepted interest request."
                    )
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 14) {
                            ForEach(conversationSummaries) { summary in
                                NavigationLink {
                                    RecruiterConversationView(candidateId: summary.candidateId, candidateName: summary.candidateName)
                                } label: {
                                    CatoCard {
                                        HStack(alignment: .top, spacing: 12) {
                                            CandidateAvatar(name: summary.candidateName ?? "Candidate", size: 50)
                                            VStack(alignment: .leading, spacing: 6) {
                                                HStack(alignment: .firstTextBaseline) {
                                                    Text(summary.candidateName ?? "Candidate")
                                                        .font(.headline.weight(summary.hasUnread ? .heavy : .bold))
                                                        .foregroundStyle(CatoTheme.ink)
                                                        .lineLimit(1)
                                                    Spacer()
                                                    Text(CatoDateText.chatTimestamp(summary.latestMessage.createdAt))
                                                        .font(.caption2.weight(.semibold))
                                                        .foregroundStyle(summary.hasUnread ? CatoTheme.purple : CatoTheme.muted)
                                                }

                                                Text(summary.latestMessage.senderRole == "applicant" ? "Candidate replied" : "You")
                                                    .font(.caption.weight(.bold))
                                                    .foregroundStyle(CatoTheme.purple)

                                                Text(summary.latestMessage.body)
                                                    .font(.subheadline.weight(.bold))
                                                    .foregroundStyle(summary.hasUnread ? CatoTheme.ink : CatoTheme.muted)
                                                    .lineLimit(2)
                                            }

                                            if summary.hasUnread {
                                                Circle()
                                                    .fill(CatoTheme.purple)
                                                    .frame(width: 10, height: 10)
                                                    .padding(.top, 4)
                                            }
                                        }
                                    }
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(CatoTheme.screenPadding)
                    }
                    .background(CatoTheme.background.ignoresSafeArea())
                }
            }
            .navigationTitle("Messages")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                await loadMessages()
            }
            .onReceive(NotificationCenter.default.publisher(for: .catoMessageEventReceived)) { _ in
                Task { await loadMessages(showLoading: false) }
            }
            .onReceive(NotificationCenter.default.publisher(for: .catoInterestRequestEventReceived)) { _ in
                Task { await loadMessages(showLoading: false) }
            }
            .onReceive(NotificationCenter.default.publisher(for: .catoMessageReadStateDidChange)) { _ in
                Task { await loadMessages(showLoading: false) }
            }
        }
    }

    private var conversationSummaries: [RecruiterConversationSummary] {
        var seen = Set<String>()
        var summaries: [RecruiterConversationSummary] = []

        for message in messages {
            if let index = summaries.firstIndex(where: { $0.candidateId == message.candidateId }) {
                if message.isUnreadForViewer == true {
                    summaries[index].hasUnread = true
                }
                continue
            }

            guard !seen.contains(message.candidateId) else { continue }
            seen.insert(message.candidateId)

            let hasUnread = messages.contains {
                $0.candidateId == message.candidateId && $0.isUnreadForViewer == true
            }
            summaries.append(
                RecruiterConversationSummary(
                    candidateId: message.candidateId,
                    candidateName: message.candidateName,
                    latestMessage: message,
                    hasUnread: hasUnread
                )
            )
        }

        return summaries
    }

    private func loadMessages(showLoading: Bool = true) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to load messages."
            isLoading = false
            return
        }

        if showLoading {
            isLoading = true
        }
        errorMessage = nil

        do {
            messages = try await apiClient.getRecruiterMessages(accessToken: accessToken).messages
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

private struct RecruiterConversationSummary: Identifiable {
    var id: String { candidateId }
    let candidateId: String
    let candidateName: String?
    let latestMessage: RecruiterMessage
    var hasUnread: Bool
}
