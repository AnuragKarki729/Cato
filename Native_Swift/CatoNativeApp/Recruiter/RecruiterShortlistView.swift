import SwiftUI
import CatoNativeCore

struct RecruiterShortlistView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var candidates: [RecruiterCandidate] = []
    @State private var selectedIds: Set<String> = []
    @State private var errorMessage: String?
    @State private var isLoading = true
    @State private var isActing = false

    var body: some View {
        Group {
            if isLoading {
                CatoLoadingView(message: "Loading shortlist")
            } else if let errorMessage {
                RecruiterErrorView(message: errorMessage) {
                    Task { await loadShortlist() }
                }
            } else if candidates.isEmpty {
                RecruiterEmptyStateView(
                    icon: "person.3",
                    title: "No shortlisted candidates",
                    message: "Advance candidates from review screens to build a focused shortlist."
                )
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Shortlist")
                                .font(CatoTheme.screenTitle)
                            Text("\(candidates.count) candidates advanced for deeper comparison.")
                                .font(CatoTheme.body)
                                .foregroundStyle(CatoTheme.muted)
                        }

                        if selectedIds.count >= 2 {
                            NavigationLink {
                                RecruiterComparisonView(candidateIds: Array(selectedIds.prefix(4)))
                            } label: {
                                HStack {
                                    Text("Compare \(selectedIds.count) candidates")
                                    Spacer()
                                    Image(systemName: "arrow.right")
                                }
                            }
                            .buttonStyle(CatoPrimaryButtonStyle())
                        }

                        ForEach(candidates) { candidate in
                            CatoCard {
                                VStack(alignment: .leading, spacing: 12) {
                                    HStack(spacing: 12) {
                                        Button {
                                            toggle(candidate)
                                        } label: {
                                            Image(systemName: selectedIds.contains(candidate.id) ? "checkmark.circle.fill" : "circle")
                                                .font(.system(size: 20, weight: .semibold))
                                                .foregroundStyle(CatoTheme.purple)
                                        }

                                        CandidateAvatar(name: candidate.displayName, size: 48)
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(candidate.displayName)
                                                .font(CatoTheme.cardTitle)
                                            Text(candidate.displaySubtitle.isEmpty ? "Profile details pending" : candidate.displaySubtitle)
                                                .font(CatoTheme.small)
                                                .foregroundStyle(CatoTheme.muted)
                                                .lineLimit(2)
                                        }
                                        Spacer()
                                        MatchScoreBadge(score: candidate.matchScore)
                                    }

                                    HStack {
                                        Label("\(candidate.projects.count) projects", systemImage: "folder")
                                        Label("\(candidate.internships.count) internships", systemImage: "building.2")
                                        Spacer()
                                    }
                                    .font(.caption.weight(.medium))
                                    .foregroundStyle(CatoTheme.muted)

                                    HStack(spacing: 10) {
                                        NavigationLink {
                                            CandidateReviewView(candidateId: candidate.id)
                                        } label: {
                                            Text("Review")
                                        }
                                        .buttonStyle(.borderedProminent)
                                        .tint(CatoTheme.purple)

                                        NavigationLink {
                                            RecruiterContactView(candidateId: candidate.id, mode: .request)
                                        } label: {
                                            Text("Contact")
                                        }
                                        .buttonStyle(.bordered)
                                        .tint(CatoTheme.purple)

                                        Button("Pass") {
                                            Task { await move(candidate, status: .passed) }
                                        }
                                        .buttonStyle(.bordered)
                                        .tint(CatoTheme.muted)
                                    }
                                    .disabled(isActing)
                                }
                            }
                        }
                    }
                    .padding(CatoTheme.screenPadding)
                }
                .background(CatoTheme.background.ignoresSafeArea())
            }
        }
        .navigationTitle("Shortlist")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadShortlist()
        }
    }

    private func toggle(_ candidate: RecruiterCandidate) {
        if selectedIds.contains(candidate.id) {
            selectedIds.remove(candidate.id)
        } else if selectedIds.count < 4 {
            selectedIds.insert(candidate.id)
        }
    }

    private func loadShortlist() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to load shortlist."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            candidates = try await apiClient.getRecruiterCandidates(
                accessToken: accessToken,
                filters: RecruiterCandidateSearchFilters(reviewStatus: .shortlisted)
            ).candidates
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    private func move(_ candidate: RecruiterCandidate, status: RecruiterReviewStatus) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }
        isActing = true
        defer { isActing = false }

        do {
            try await apiClient.updateRecruiterCandidateReview(accessToken: accessToken, candidateId: candidate.id, status: status)
            selectedIds.remove(candidate.id)
            candidates.removeAll { $0.id == candidate.id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
