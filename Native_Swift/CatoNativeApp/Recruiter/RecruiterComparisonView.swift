import SwiftUI
import CatoNativeCore

struct RecruiterComparisonView: View {
    let candidateIds: [String]

    @EnvironmentObject private var auth: AuthViewModel
    @State private var candidates: [RecruiterCandidate] = []
    @State private var errorMessage: String?
    @State private var isLoading = true

    var body: some View {
        Group {
            if isLoading {
                CatoLoadingView(message: "Loading comparison")
            } else if let errorMessage {
                RecruiterErrorView(message: errorMessage) {
                    Task { await loadCandidates() }
                }
            } else if candidates.isEmpty {
                RecruiterEmptyStateView(
                    icon: "rectangle.split.3x1",
                    title: "No candidates selected",
                    message: "Select two to four shortlisted candidates to compare them."
                )
            } else {
                ScrollView([.horizontal, .vertical]) {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Compare Candidates")
                            .font(CatoTheme.screenTitle)
                            .padding(.horizontal, CatoTheme.screenPadding)
                            .padding(.top, CatoTheme.screenPadding)

                        HStack(alignment: .top, spacing: 12) {
                            ForEach(candidates) { candidate in
                                ComparisonColumn(candidate: candidate)
                                    .frame(width: 230)
                            }
                        }
                        .padding(.horizontal, CatoTheme.screenPadding)
                        .padding(.bottom, CatoTheme.screenPadding)
                    }
                }
                .background(CatoTheme.background.ignoresSafeArea())
            }
        }
        .navigationTitle("Comparison")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadCandidates()
        }
    }

    private func loadCandidates() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to compare candidates."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            var loaded = [RecruiterCandidate]()
            for id in candidateIds {
                let response = try await apiClient.getRecruiterCandidate(accessToken: accessToken, candidateId: id)
                loaded.append(response.candidate)
            }
            candidates = loaded
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

private struct ComparisonColumn: View {
    let candidate: RecruiterCandidate

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 14) {
                CandidateAvatar(name: candidate.displayName, size: 58)
                Text(candidate.displayName)
                    .font(CatoTheme.cardTitle)
                Text(candidate.displaySubtitle.isEmpty ? "Profile pending" : candidate.displaySubtitle)
                    .font(.caption)
                    .foregroundStyle(CatoTheme.muted)

                Divider()

                ComparisonMetric(label: "Match", value: "\(candidate.matchScore)%")
                ComparisonMetric(label: "Strength", value: "\(candidate.profileStrength)%")
                ComparisonMetric(label: "GPA", value: candidate.gpa.map { String(format: "%.2f", $0) } ?? "Not set")
                ComparisonMetric(label: "Projects", value: "\(candidate.projects.count)")
                ComparisonMetric(label: "Internships", value: "\(candidate.internships.count)")
                ComparisonMetric(label: "Resume", value: candidate.hasResume ? "Yes" : "No")

                Divider()

                Text("Top evidence")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(CatoTheme.muted)
                ForEach(candidate.matchEvidence.prefix(3)) { evidence in
                    Text(evidence.title)
                        .font(.caption)
                        .foregroundStyle(CatoTheme.ink)
                }
            }
        }
    }
}

private struct ComparisonMetric: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label)
                .font(.caption)
                .foregroundStyle(CatoTheme.muted)
            Spacer()
            Text(value)
                .font(.caption.weight(.bold))
                .foregroundStyle(CatoTheme.ink)
        }
    }
}
