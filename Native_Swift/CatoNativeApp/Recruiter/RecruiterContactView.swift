import SwiftUI
import CatoNativeCore

enum RecruiterContactMode {
    case request
    case message
}

struct RecruiterContactView: View {
    let candidateId: String
    var mode: RecruiterContactMode

    @EnvironmentObject private var auth: AuthViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var candidate: RecruiterCandidate?
    @State private var bodyText = "Your profile stood out for this opportunity."
    @State private var errorMessage: String?
    @State private var isLoading = true
    @State private var isSending = false

    var body: some View {
        Group {
            if isLoading {
                CatoLoadingView(message: "Loading contact flow")
            } else if let errorMessage, candidate == nil {
                RecruiterErrorView(message: errorMessage) {
                    Task { await loadCandidate() }
                }
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        if let candidate {
                            CatoCard {
                                HStack(spacing: 12) {
                                    CandidateAvatar(name: candidate.displayName, size: 54)
                                    VStack(alignment: .leading, spacing: 4) {
                                        Text(candidate.displayName)
                                            .font(CatoTheme.cardTitle)
                                        Text(candidate.displaySubtitle.isEmpty ? "Profile details pending" : candidate.displaySubtitle)
                                            .font(CatoTheme.small)
                                            .foregroundStyle(CatoTheme.muted)
                                    }
                                    Spacer()
                                    MatchScoreBadge(score: candidate.matchScore)
                                }
                            }
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text(mode == .message ? "Message Candidate" : "Send Interest Request")
                                .font(CatoTheme.screenTitle)
                            Text(mode == .message ? "Messaging is available after the applicant accepts your request." : "This protects applicants from spam. Messaging opens only after acceptance.")
                                .font(CatoTheme.body)
                                .foregroundStyle(CatoTheme.muted)
                        }

                        TextEditor(text: $bodyText)
                            .frame(minHeight: 180)
                            .padding(12)
                            .background(CatoTheme.card)
                            .clipShape(RoundedRectangle(cornerRadius: CatoTheme.corner))
                            .overlay(
                                RoundedRectangle(cornerRadius: CatoTheme.corner)
                                    .stroke(CatoTheme.border, lineWidth: 1)
                            )

                        Button(isSending ? "Sending..." : mode == .message ? "Send Message" : "Send Interest Request") {
                            Task { await send() }
                        }
                        .buttonStyle(CatoPrimaryButtonStyle())
                        .disabled(isSending || bodyText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                        if let errorMessage {
                            Text(errorMessage)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(.red)
                        }
                    }
                    .padding(CatoTheme.screenPadding)
                }
                .background(CatoTheme.background.ignoresSafeArea())
            }
        }
        .navigationTitle("Contact")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadCandidate()
        }
    }

    private func loadCandidate() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to contact candidates."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            candidate = try await apiClient.getRecruiterCandidate(accessToken: accessToken, candidateId: candidateId).candidate
            if mode == .message {
                bodyText = "Hi, I would love to connect about an opportunity."
            }
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    private func send() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }
        isSending = true
        errorMessage = nil
        defer { isSending = false }

        do {
            if mode == .message {
                try await apiClient.contactRecruiterCandidate(accessToken: accessToken, candidateId: candidateId, body: bodyText)
            } else {
                try await apiClient.sendRecruiterInterestRequest(accessToken: accessToken, candidateId: candidateId, reason: bodyText)
            }
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct RecruiterConversationView: View {
    let candidateId: String
    let candidateName: String?

    @EnvironmentObject private var auth: AuthViewModel
    @State private var messages: [RecruiterMessage] = []
    @State private var draft = ""
    @State private var isLoading = true
    @State private var isSending = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            Group {
                if isLoading {
                    CatoLoadingView(message: "Loading conversation")
                } else if let errorMessage, messages.isEmpty {
                    RecruiterErrorView(message: errorMessage) {
                        Task { await load() }
                    }
                } else {
                    ScrollViewReader { proxy in
                        ScrollView {
                            VStack(alignment: .leading, spacing: 12) {
                                if messages.isEmpty {
                                    RecruiterEmptyStateView(
                                        icon: "message",
                                        title: "No messages yet",
                                        message: "Send a message to start the conversation."
                                    )
                                } else {
                                    let firstUnreadId = messages.first(where: { $0.isUnreadForViewer == true })?.id
                                    ForEach(messages) { message in
                                        if message.id == firstUnreadId {
                                            ConversationUnreadDivider()
                                        }
                                        RecruiterMessageBubble(message: message)
                                            .id(message.id)
                                    }
                                    Color.clear
                                        .frame(height: 1)
                                        .id("recruiter-conversation-bottom")
                                }

                                if let errorMessage {
                                    Text(errorMessage)
                                        .font(.caption.weight(.semibold))
                                        .foregroundStyle(.red)
                                        .padding(12)
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                        .background(Color.red.opacity(0.08))
                                        .clipShape(RoundedRectangle(cornerRadius: 12))
                                }
                            }
                            .padding(CatoTheme.screenPadding)
                        }
                        .onAppear {
                            scrollRecruiterConversationToBottom(proxy)
                        }
                        .onChange(of: messages.count) { _ in
                            scrollRecruiterConversationToBottom(proxy)
                        }
                    }
                }
            }

            Divider()

            HStack(alignment: .bottom, spacing: 8) {
                TextField("Write a message", text: $draft, axis: .vertical)
                    .lineLimit(1...4)
                    .padding(12)
                    .background(CatoTheme.card)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(CatoTheme.border, lineWidth: 1))

                Button {
                    Task { await send() }
                } label: {
                    if isSending {
                        ProgressView()
                            .tint(.white)
                            .frame(width: 22, height: 22)
                    } else {
                        Image(systemName: "paperplane.fill")
                            .frame(width: 22, height: 22)
                    }
                }
                .foregroundStyle(.white)
                .padding(12)
                .background(CatoTheme.purple)
                .clipShape(Circle())
                .disabled(isSending || draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .padding(.horizontal, CatoTheme.screenPadding)
            .padding(.vertical, 10)
            .background(CatoTheme.background)
        }
        .background(CatoTheme.background.ignoresSafeArea())
        .navigationTitle(candidateName ?? "Conversation")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await load()
        }
        .onReceive(NotificationCenter.default.publisher(for: .catoMessageEventReceived)) { _ in
            Task { await load(showLoading: false) }
        }
    }

    private func load(showLoading: Bool = true) async {
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
            messages = try await apiClient.getRecruiterCandidateMessages(accessToken: accessToken, candidateId: candidateId).messages
            NotificationCenter.default.post(name: .catoMessageReadStateDidChange, object: nil)
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    private func send() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to send a message."
            return
        }

        let body = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !body.isEmpty else { return }

        isSending = true
        errorMessage = nil

        do {
            try await apiClient.contactRecruiterCandidate(accessToken: accessToken, candidateId: candidateId, body: body)
            draft = ""
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }

        isSending = false
    }

    private func scrollRecruiterConversationToBottom(_ proxy: ScrollViewProxy) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
            withAnimation(.easeOut(duration: 0.22)) {
                proxy.scrollTo("recruiter-conversation-bottom", anchor: .bottom)
            }
        }
    }
}

private struct RecruiterMessageBubble: View {
    let message: RecruiterMessage

    private var isMine: Bool {
        (message.senderRole ?? "recruiter") == "recruiter"
    }

    var body: some View {
        HStack {
            if isMine {
                Spacer(minLength: 40)
            }
            VStack(alignment: isMine ? .trailing : .leading, spacing: 4) {
                Text(message.body)
                    .font(.subheadline)
                    .foregroundStyle(isMine ? .white : CatoTheme.ink)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 9)
                    .background(isMine ? CatoTheme.purple : CatoTheme.purpleSoft)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                Text(CatoDateText.chatTimestamp(message.createdAt))
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(CatoTheme.muted)
            }
            if !isMine {
                Spacer(minLength: 40)
            }
        }
    }
}

private struct ConversationUnreadDivider: View {
    var body: some View {
        HStack(spacing: 10) {
            Rectangle()
                .fill(CatoTheme.border)
                .frame(height: 1)
            Text("New messages")
                .font(.caption2.weight(.heavy))
                .foregroundStyle(CatoTheme.purple)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(CatoTheme.purpleSoft)
                .clipShape(Capsule())
            Rectangle()
                .fill(CatoTheme.border)
                .frame(height: 1)
        }
        .padding(.vertical, 4)
    }
}
