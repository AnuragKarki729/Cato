import SwiftUI
import CatoNativeCore

struct RecruiterBookmarksView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var bookmarked: [RecruiterCandidate] = []
    @State private var errorMessage: String?
    @State private var isLoading = true

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    CatoLoadingView(message: "Loading bookmarks")
                } else if let errorMessage {
                    RecruiterErrorView(message: errorMessage) {
                        Task { await loadBookmarks() }
                    }
                } else if bookmarked.isEmpty {
                    RecruiterEmptyStateView(
                        icon: "bookmark",
                        title: "No bookmarks yet",
                        message: "Bookmark candidates from review screens to return to them quickly."
                    )
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 14) {
                            Text("\(bookmarked.count) bookmarked candidates")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(CatoTheme.muted)

                            ForEach(bookmarked) { candidate in
                                NavigationLink {
                                    CandidateReviewView(candidateId: candidate.id)
                                } label: {
                                    CatoCard {
                                        HStack(spacing: 12) {
                                            CandidateAvatar(name: candidate.displayName, size: 50)
                                            VStack(alignment: .leading, spacing: 4) {
                                                Text(candidate.displayName)
                                                    .font(CatoTheme.cardTitle)
                                                    .foregroundStyle(CatoTheme.ink)
                                                Text(candidate.displaySubtitle.isEmpty ? "Profile details pending" : candidate.displaySubtitle)
                                                    .font(CatoTheme.small)
                                                    .foregroundStyle(CatoTheme.muted)
                                                    .lineLimit(2)
                                            }
                                            Spacer()
                                            MatchScoreBadge(score: candidate.matchScore)
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
            .navigationTitle("Bookmarked")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                await loadBookmarks()
            }
        }
    }

    private func loadBookmarks() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to load bookmarks."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            bookmarked = try await apiClient.getRecruiterBookmarks(accessToken: accessToken).bookmarks
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}
