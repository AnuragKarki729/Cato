import SwiftUI
import CatoNativeCore

struct ApplicantRequestsView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var requests: [ApplicantInterestRequest] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var actionMessage: String?
    @State private var workingRequestId: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    CatoLoadingView(message: "Loading requests")
                } else if let errorMessage {
                    ApplicantErrorView(message: errorMessage) {
                        Task { await loadRequests() }
                    }
                } else if requests.isEmpty {
                    RecruiterEmptyStateView(
                        icon: "envelope.badge",
                        title: "No requests yet",
                        message: "Recruiters who are interested in your profile will appear here."
                    )
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 14) {
                            if let actionMessage {
                                Text(actionMessage)
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(CatoTheme.purple)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(CatoTheme.purpleSoft)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            }

                            ForEach(requests) { request in
                                NavigationLink {
                                    ApplicantRequestDetailView(request: request) { updatedRequest in
                                        requests = requests.map { $0.id == updatedRequest.id ? updatedRequest : $0 }
                                    }
                                } label: {
                                    requestCard(request)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(CatoTheme.screenPadding)
                    }
                }
            }
            .navigationTitle("Requests")
            .navigationBarTitleDisplayMode(.inline)
            .background(CatoTheme.background.ignoresSafeArea())
            .task {
                await loadRequests()
            }
            .onReceive(NotificationCenter.default.publisher(for: .catoInterestRequestEventReceived)) { _ in
                Task { await loadRequests() }
            }
            .onReceive(NotificationCenter.default.publisher(for: .catoMessageEventReceived)) { _ in
                Task { await loadRequests() }
            }
            .onReceive(NotificationCenter.default.publisher(for: .catoMessageReadStateDidChange)) { _ in
                Task { await loadRequests() }
            }
        }
    }

    private func requestCard(_ request: ApplicantInterestRequest) -> some View {
        let unreadCount = request.unreadMessageCount ?? 0
        let hasUnreadMessages = unreadCount > 0

        return CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top, spacing: 12) {
                    CandidateAvatar(name: request.companyName ?? request.recruiterName ?? "Recruiter", size: 48)
                    VStack(alignment: .leading, spacing: 3) {
                        Text(request.displayCompany)
                            .font(.headline.weight(hasUnreadMessages ? .heavy : .bold))
                        Text(request.recruiterName ?? "Recruiting team")
                            .font(.caption.weight(hasUnreadMessages ? .bold : .regular))
                            .foregroundStyle(hasUnreadMessages ? CatoTheme.ink : CatoTheme.muted)
                    }
                    Spacer()
                    if hasUnreadMessages {
                        Text(unreadCount > 9 ? "9+" : "\(unreadCount)")
                            .font(.caption2.weight(.heavy))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 4)
                            .background(CatoTheme.purple)
                            .clipShape(Capsule())
                    }
                    ApplicantRequestStatusBadge(status: request.status)
                }

                Text(request.reason)
                    .font(.subheadline.weight(hasUnreadMessages ? .bold : .regular))
                    .foregroundStyle(CatoTheme.ink)

                if request.status == .sent || request.status == .viewed {
                    HStack(spacing: 10) {
                        Button {
                            Task { await respond(to: request, action: "decline") }
                        } label: {
                            Text("Decline")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .disabled(workingRequestId != nil)

                        Button {
                            Task { await respond(to: request, action: "accept") }
                        } label: {
                            if workingRequestId == request.id {
                                ProgressView()
                                    .tint(.white)
                                    .frame(maxWidth: .infinity)
                            } else {
                                Text("Accept")
                                    .frame(maxWidth: .infinity)
                            }
                        }
                        .buttonStyle(CatoPrimaryButtonStyle())
                        .disabled(workingRequestId != nil)
                    }
                } else if request.status == .accepted {
                    HStack(spacing: 8) {
                        Image(systemName: "message.fill")
                            .foregroundStyle(CatoTheme.purple)
                        Text("Tap to view the conversation status.")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(CatoTheme.muted)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(CatoTheme.muted)
                    }
                }
            }
        }
    }

    private func loadRequests() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to load requests."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            requests = try await apiClient.getApplicantInterestRequests(accessToken: accessToken).requests
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    private func respond(to request: ApplicantInterestRequest, action: String) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to respond."
            return
        }

        workingRequestId = request.id
        actionMessage = nil

        do {
            let updated = try await apiClient.respondToApplicantInterestRequest(
                accessToken: accessToken,
                requestId: request.id,
                action: action
            )
            requests = requests.map { $0.id == updated.id ? updated : $0 }
            actionMessage = action == "accept" ? "Request accepted." : "Request declined."
        } catch {
            errorMessage = error.localizedDescription
        }

        workingRequestId = nil
    }
}

struct ApplicantRequestDetailView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var request: ApplicantInterestRequest
    @State private var isWorking = false
    @State private var errorMessage: String?
    @State private var statusMessage: String?
    var onUpdated: ((ApplicantInterestRequest) -> Void)?

    init(request: ApplicantInterestRequest, onUpdated: ((ApplicantInterestRequest) -> Void)? = nil) {
        _request = State(initialValue: request)
        self.onUpdated = onUpdated
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                headerCard
                requestBodyCard
                stateCard

                if let errorMessage {
                    ApplicantRequestInlineError(message: errorMessage)
                }

                if let statusMessage {
                    Text(statusMessage)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(CatoTheme.purple)
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(CatoTheme.purpleSoft)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }
            .padding(CatoTheme.screenPadding)
        }
        .navigationTitle("Request")
        .navigationBarTitleDisplayMode(.inline)
        .background(CatoTheme.background.ignoresSafeArea())
    }

    private var headerCard: some View {
        CatoCard {
            HStack(alignment: .top, spacing: 12) {
                CandidateAvatar(name: request.companyName ?? request.recruiterName ?? "Recruiter", size: 58)
                VStack(alignment: .leading, spacing: 5) {
                    Text(request.displayCompany)
                        .font(.title3.weight(.bold))
                    Text(request.recruiterName ?? "Recruiting team")
                        .font(.subheadline)
                        .foregroundStyle(CatoTheme.muted)
                    if let roleCategory = request.roleCategory, !roleCategory.isEmpty {
                        Text(roleCategory)
                            .font(.caption.weight(.bold))
                            .foregroundStyle(CatoTheme.purple)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 5)
                            .background(CatoTheme.purpleSoft)
                            .clipShape(Capsule())
                    }
                }
                Spacer()
                ApplicantRequestStatusBadge(status: request.status)
            }
        }
    }

    private var requestBodyCard: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                ApplicantSectionHeader(title: "Why they reached out", subtitle: formattedDate(request.sentAt))
                Text(request.reason)
                    .font(.body)
                    .foregroundStyle(CatoTheme.ink)
                    .fixedSize(horizontal: false, vertical: true)

                if let expiresAt = request.expiresAt, request.status == .sent || request.status == .viewed {
                    Text("Expires \(formattedDate(expiresAt))")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.orange)
                }
            }
        }
    }

    @ViewBuilder
    private var stateCard: some View {
        switch request.status {
        case .sent, .viewed:
            CatoCard {
                VStack(alignment: .leading, spacing: 12) {
                    ApplicantSectionHeader(title: "Respond", subtitle: "Protects your inbox")
                    Text("Accepting tells the recruiter they can continue. Declining closes this request.")
                        .font(.subheadline)
                        .foregroundStyle(CatoTheme.muted)

                    HStack(spacing: 10) {
                        Button {
                            Task { await respond(action: "decline") }
                        } label: {
                            Text("Decline")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .disabled(isWorking)

                        Button {
                            Task { await respond(action: "accept") }
                        } label: {
                            if isWorking {
                                ProgressView()
                                    .tint(.white)
                                    .frame(maxWidth: .infinity)
                            } else {
                                Text("Accept")
                                    .frame(maxWidth: .infinity)
                            }
                        }
                        .buttonStyle(CatoPrimaryButtonStyle())
                        .disabled(isWorking)
                    }
                }
            }
        case .accepted:
            ApplicantConversationCard(request: request)
        case .declined:
            terminalCard(title: "Declined", message: "This request is closed. The recruiter cannot message you from this request.")
        case .expired:
            terminalCard(title: "Expired", message: "This request expired before you responded.")
        }
    }

    private func terminalCard(title: String, message: String) -> some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 8) {
                ApplicantSectionHeader(title: title, subtitle: "")
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(CatoTheme.muted)
            }
        }
    }

    private func respond(action: String) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to respond."
            return
        }

        isWorking = true
        errorMessage = nil
        statusMessage = nil

        do {
            let updated = try await apiClient.respondToApplicantInterestRequest(
                accessToken: accessToken,
                requestId: request.id,
                action: action
            )
            request = updated
            onUpdated?(updated)
            statusMessage = action == "accept" ? "Request accepted." : "Request declined."
        } catch {
            errorMessage = error.localizedDescription
        }

        isWorking = false
    }

    private func formattedDate(_ value: String) -> String {
        String(value.prefix(10))
    }
}

private struct ApplicantConversationCard: View {
    @EnvironmentObject private var auth: AuthViewModel
    let request: ApplicantInterestRequest
    @State private var messages: [ApplicantConversationMessage] = []
    @State private var draft = ""
    @State private var isLoading = true
    @State private var isSending = false
    @State private var errorMessage: String?

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                ApplicantSectionHeader(title: "Conversation", subtitle: "Accepted")

                if isLoading {
                    HStack(spacing: 10) {
                        ProgressView()
                        Text("Loading messages")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(CatoTheme.muted)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                } else if messages.isEmpty {
                    Text("No messages yet. Send a short reply to start the conversation.")
                        .font(.subheadline)
                        .foregroundStyle(CatoTheme.muted)
                } else {
                    ScrollViewReader { proxy in
                        ScrollView {
                            VStack(spacing: 8) {
                                let firstUnreadId = messages.first(where: { $0.isUnreadForViewer == true })?.id
                                ForEach(messages) { message in
                                    if message.id == firstUnreadId {
                                        ConversationUnreadDivider()
                                    }
                                    ApplicantMessageBubble(message: message)
                                        .id(message.id)
                                }
                                Color.clear
                                    .frame(height: 1)
                                    .id("applicant-conversation-bottom")
                            }
                        }
                        .frame(maxHeight: 320)
                        .onAppear {
                            scrollApplicantConversationToBottom(proxy)
                        }
                        .onChange(of: messages.count) { _ in
                            scrollApplicantConversationToBottom(proxy)
                        }
                    }
                }

                if let errorMessage {
                    ApplicantRequestInlineError(message: errorMessage)
                }

                HStack(alignment: .bottom, spacing: 8) {
                    TextField("Write a message", text: $draft, axis: .vertical)
                        .lineLimit(1...4)
                        .padding(12)
                        .background(CatoTheme.background)
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
            }
        }
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
            messages = try await apiClient.getApplicantConversationMessages(accessToken: accessToken, requestId: request.id).messages
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
            try await apiClient.sendApplicantConversationMessage(accessToken: accessToken, requestId: request.id, body: body)
            draft = ""
            await load()
        } catch {
            errorMessage = error.localizedDescription
        }

        isSending = false
    }

    private func scrollApplicantConversationToBottom(_ proxy: ScrollViewProxy) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.08) {
            withAnimation(.easeOut(duration: 0.22)) {
                proxy.scrollTo("applicant-conversation-bottom", anchor: .bottom)
            }
        }
    }
}

private struct ApplicantMessageBubble: View {
    let message: ApplicantConversationMessage

    private var isMine: Bool {
        message.senderRole == "applicant"
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

private struct ApplicantRequestInlineError: View {
    let message: String

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(.orange)
            Text(message)
                .font(.caption.weight(.semibold))
                .foregroundStyle(CatoTheme.ink)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(12)
        .background(Color.orange.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.orange.opacity(0.24), lineWidth: 1)
        )
    }
}
