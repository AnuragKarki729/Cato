import SwiftUI
import CatoNativeCore

struct RecruiterResultsView: View {
    let title: String
    var filters = RecruiterCandidateSearchFilters()
    var runtimeSearchSpec: RuntimeSearchSpec?

    @EnvironmentObject private var auth: AuthViewModel
    @State private var candidates: [RecruiterCandidate] = []
    @State private var errorMessage: String?
    @State private var isLoading = true

    var body: some View {
        Group {
            if isLoading {
                CatoLoadingView(message: "Loading candidates")
            } else if let errorMessage {
                RecruiterErrorView(message: errorMessage) {
                    Task { await loadCandidates() }
                }
            } else if candidates.isEmpty {
                VStack(spacing: 12) {
                    Image(systemName: "person.crop.circle.badge.questionmark")
                        .font(.system(size: 38))
                        .foregroundStyle(CatoTheme.purple)
                    Text("No candidates found")
                        .font(.title3.weight(.bold))
                    Text("Try adjusting the search or clearing filters.")
                        .foregroundStyle(CatoTheme.muted)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(CatoTheme.background.ignoresSafeArea())
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            Text("\(candidates.count) candidates")
                                .font(.subheadline.weight(.semibold))
                                .foregroundStyle(CatoTheme.muted)
                            Spacer()
                            Label("Sort", systemImage: "arrow.up.arrow.down")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(CatoTheme.purple)
                            Label("Filter", systemImage: "line.3.horizontal.decrease.circle")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(CatoTheme.purple)
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 8)

                        Text("Ranked by match strength, profile completeness, evidence signals, projects, and recruiter filters.")
                            .font(.caption)
                            .foregroundStyle(CatoTheme.muted)
                            .padding(.horizontal, 20)

                        ForEach(candidates) { candidate in
                            NavigationLink {
                                CandidateReviewView(candidateId: candidate.id, runtimeSearchSpec: runtimeSearchSpec)
                            } label: {
                                CandidateResultRow(candidate: candidate)
                            }
                            .buttonStyle(.plain)
                            .padding(.horizontal, 20)
                        }
                    }
                    .padding(.bottom, 20)
                }
                .background(CatoTheme.background.ignoresSafeArea())
            }
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                } label: {
                    Image(systemName: "line.3.horizontal.decrease.circle")
                }
            }
        }
        .task {
            await loadCandidates()
        }
    }

    private func loadCandidates() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to load candidates."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            candidates = try await apiClient.getRecruiterCandidates(accessToken: accessToken, filters: filters).candidates
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

private struct CandidateResultRow: View {
    let candidate: RecruiterCandidate

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top, spacing: 12) {
                    CandidateAvatar(name: candidate.displayName, size: 58)

                    VStack(alignment: .leading, spacing: 5) {
                        Text(candidate.displayName)
                            .font(CatoTheme.cardTitle)
                            .foregroundStyle(CatoTheme.ink)
                        Text(candidate.displaySubtitle.isEmpty ? "Profile details pending" : candidate.displaySubtitle)
                            .font(.subheadline)
                            .foregroundStyle(CatoTheme.muted)
                        Text(candidate.semesterLabel ?? "Semester pending")
                            .font(.caption2.weight(.medium))
                            .foregroundStyle(CatoTheme.muted)
                    }

                    Spacer()

                    VStack(alignment: .trailing, spacing: 5) {
                        Text("\(candidate.matchScore)%")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(CatoTheme.purple)
                        Text(candidate.matchStrength.replacingOccurrences(of: "_", with: " ").capitalized)
                            .font(.caption2.weight(.bold))
                            .foregroundStyle(CatoTheme.purple)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(CatoTheme.purpleSoft)
                            .clipShape(Capsule())
                    }
                }

                HStack {
                    ForEach(candidate.tags.prefix(3), id: \.self) { tag in
                        Text(tag)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(CatoTheme.purple)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 5)
                            .background(CatoTheme.purpleSoft)
                            .clipShape(Capsule())
                    }
                    Spacer()
                    Image(systemName: candidate.bookmarked ? "bookmark.fill" : "bookmark")
                        .foregroundStyle(CatoTheme.purple)
                }

                HStack(spacing: 8) {
                    CapabilityPill(label: candidate.hasResume ? "Resume" : "No resume", icon: "doc.text")
                    CapabilityPill(label: candidate.hasDeeperSignal ? "Deeper signal" : "Short take", icon: "play.rectangle")
                    Spacer()
                    Text("View profile")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 7)
                        .background(CatoTheme.purple)
                        .clipShape(Capsule())
                }
            }
        }
    }
}

private struct CapabilityPill: View {
    let label: String
    let icon: String

    var body: some View {
        Label(label, systemImage: icon)
            .font(.caption.weight(.medium))
            .foregroundStyle(CatoTheme.muted)
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(CatoTheme.background)
            .clipShape(Capsule())
    }
}
