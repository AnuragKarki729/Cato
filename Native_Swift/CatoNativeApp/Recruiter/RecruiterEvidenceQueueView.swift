import SwiftUI
import CatoNativeCore

struct RecruiterEvidenceQueueView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var candidates: [RecruiterCandidate] = []
    @State private var errorMessage: String?
    @State private var isLoading = true
    @State private var actionMessage: String?
    @State private var isActing = false

    var body: some View {
        Group {
            if isLoading {
                CatoLoadingView(message: "Loading evidence queue")
            } else if let errorMessage {
                RecruiterErrorView(message: errorMessage) {
                    Task { await loadQueue() }
                }
            } else if candidates.isEmpty {
                RecruiterEmptyStateView(
                    icon: "checkmark.seal",
                    title: "Evidence queue is clear",
                    message: "Candidates that need a closer evidence review will appear here."
                )
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Evidence Queue")
                                .font(CatoTheme.screenTitle)
                            Text("Review the strongest matches, validate unclear areas, then pass or advance.")
                                .font(CatoTheme.body)
                                .foregroundStyle(CatoTheme.muted)
                        }

                        CatoCard {
                            HStack(spacing: 12) {
                                VStack(alignment: .leading, spacing: 3) {
                                    Text("\(candidates.count) left")
                                        .font(.system(size: 22, weight: .bold))
                                        .foregroundStyle(CatoTheme.purple)
                                    Text("Strong matches awaiting review")
                                        .font(.caption)
                                        .foregroundStyle(CatoTheme.muted)
                                }
                                Spacer()
                                Image(systemName: "checklist.checked")
                                    .font(.system(size: 22, weight: .semibold))
                                    .foregroundStyle(CatoTheme.purple)
                                    .frame(width: 44, height: 44)
                                    .background(CatoTheme.purpleSoft)
                                    .clipShape(Circle())
                            }
                        }

                        if let actionMessage {
                            Text(actionMessage)
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(CatoTheme.purple)
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(CatoTheme.purpleSoft)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }

                        ForEach(candidates) { candidate in
                            CatoCard {
                                VStack(alignment: .leading, spacing: 14) {
                                    HStack(alignment: .top, spacing: 12) {
                                        CandidateAvatar(name: candidate.displayName, size: 54)
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(candidate.displayName)
                                                .font(.headline)
                                            Text(candidate.displaySubtitle.isEmpty ? "Profile details pending" : candidate.displaySubtitle)
                                                .font(.subheadline)
                                                .foregroundStyle(CatoTheme.muted)
                                        }
                                        Spacer()
                                        MatchScoreBadge(score: candidate.matchScore)
                                    }

                                    HStack(spacing: 8) {
                                        QueueBadge(label: candidate.matchStrength.replacingOccurrences(of: "_", with: " ").capitalized, icon: "chart.line.uptrend.xyaxis")
                                        QueueBadge(label: "Profile \(candidate.profileStrength)%", icon: "gauge.with.dots.needle.bottom.50percent")
                                    }

                                    ForEach(candidate.matchEvidence.prefix(2)) { evidence in
                                        HStack(alignment: .top, spacing: 9) {
                                            Image(systemName: evidence.strength == "strong" ? "sparkle.magnifyingglass" : "checkmark.circle")
                                                .foregroundStyle(CatoTheme.purple)
                                            VStack(alignment: .leading, spacing: 2) {
                                                Text(evidence.title)
                                                    .font(.subheadline.weight(.semibold))
                                                Text(evidence.body)
                                                    .font(.caption)
                                                    .foregroundStyle(CatoTheme.muted)
                                            }
                                        }
                                    }

                                    if let validation = candidate.needsValidation.first {
                                        Text("Needs validation: \(validation.title)")
                                            .font(.caption.weight(.semibold))
                                            .foregroundStyle(.orange)
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 7)
                                            .background(Color.orange.opacity(0.12))
                                            .clipShape(Capsule())
                                    }

                                    NavigationLink {
                                        CandidateReviewView(candidateId: candidate.id)
                                    } label: {
                                        HStack {
                                            Text("Open evidence review")
                                            Spacer()
                                            Image(systemName: "arrow.right")
                                        }
                                    }
                                    .buttonStyle(CatoPrimaryButtonStyle())

                                    HStack(spacing: 10) {
                                        Button("Pass") {
                                            Task { await update(candidate, status: .passed) }
                                        }
                                        Button("Review deeper") {
                                            Task { await update(candidate, status: .maybe) }
                                        }
                                        Button("Advance") {
                                            Task { await update(candidate, status: .shortlisted) }
                                        }
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .tint(CatoTheme.purple)
                                    .disabled(isActing)
                                }
                            }
                        }
                    }
                   .padding(20)
                    .padding(CatoTheme.screenPadding)
                }
                .background(CatoTheme.background.ignoresSafeArea())
            }
        }
        .navigationTitle("Evidence")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadQueue()
        }
    }

    private func loadQueue() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to load evidence queue."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            candidates = try await apiClient.getRecruiterEvidenceQueue(accessToken: accessToken).queue
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    private func update(_ candidate: RecruiterCandidate, status: RecruiterReviewStatus) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }
        isActing = true
        defer { isActing = false }

        do {
            try await apiClient.updateRecruiterCandidateReview(accessToken: accessToken, candidateId: candidate.id, status: status)
            candidates.removeAll { $0.id == candidate.id }
            actionMessage = "\(candidate.displayName) marked \(status.rawValue)."
        } catch {
            actionMessage = error.localizedDescription
        }
    }
}

private struct QueueBadge: View {
    let label: String
    let icon: String

    var body: some View {
        Label(label, systemImage: icon)
            .font(.caption.weight(.semibold))
            .foregroundStyle(CatoTheme.purple)
            .lineLimit(1)
            .minimumScaleFactor(0.75)
            .padding(.horizontal, 9)
            .padding(.vertical, 6)
            .background(CatoTheme.purpleSoft)
            .clipShape(Capsule())
    }
}
