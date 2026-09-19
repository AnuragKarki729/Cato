import SwiftUI
import CatoNativeCore

struct ApplicantHomeView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var profile: ApplicantProfileResponse?
    @State private var activity: ApplicantActivityResponse?
    @State private var requests: [ApplicantInterestRequest] = []
    @State private var resumeResponse: ApplicantResumeResponse?
    @State private var searchProfile: ApplicantSearchProfile?
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var isShowingSearchProfileEditor = false

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    CatoLoadingView(message: "Loading applicant home")
                } else if let errorMessage {
                    ApplicantErrorView(message: errorMessage) {
                        Task { await loadHome() }
                    }
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 18) {
                            header

                            profileStrengthCard

                            if let activity {
                                metricsRow(activity.metrics)
                            }

                            requestsPreview
                            activityPreview
                        }
                        .padding(CatoTheme.screenPadding)
                    }
                }
            }
            .background(CatoTheme.background.ignoresSafeArea())
            .task {
                await loadHome()
            }
            .navigationDestination(isPresented: $isShowingSearchProfileEditor) {
                ApplicantSearchProfileEditorView()
            }
        }
    }

    private var header: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 5) {
                CatoWordmark()
                Text("Good morning, \(profile?.applicant.displayName ?? "Applicant")")
                    .font(.system(size: 18, weight: .semibold))
                Text(profile?.education?.summary ?? profile?.applicant.email ?? "Complete your profile")
                    .font(.subheadline)
                    .foregroundStyle(CatoTheme.muted)
                    .lineLimit(2)
            }

            Spacer()

            ZStack(alignment: .topTrailing) {
                Circle()
                    .fill(CatoTheme.purpleSoft)
                    .frame(width: 42, height: 42)
                    .overlay(Image(systemName: "bell").foregroundStyle(CatoTheme.purple))
                if !requests.isEmpty {
                    Circle()
                        .fill(CatoTheme.purple)
                        .frame(width: 9, height: 9)
                }
            }
        }
    }

    private var profileStrengthCard: some View {
        Button {
            NotificationCenter.default.post(name: .applicantSelectProfileTab, object: nil)
        } label: {
            CatoCard {
                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Profile strength")
                                .font(.headline.weight(.bold))
                            Text("Tap to see what is missing and improve recruiter preview.")
                                .font(.caption)
                                .foregroundStyle(CatoTheme.muted)
                        }
                        Spacer()
                        HStack(spacing: 8) {
                            Text("\(profile?.profileStrength ?? 0)%")
                                .font(.system(size: 28, weight: .bold))
                                .foregroundStyle(CatoTheme.purple)
                            Image(systemName: "chevron.right")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(CatoTheme.muted)
                        }
                    }

                    ProgressView(value: Double(profile?.profileStrength ?? 0), total: 100)
                        .tint(CatoTheme.purple)

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        ApplicantChecklistPill(title: "Resume", isDone: profile?.resume?.secureUrl?.isEmpty == false || profile?.resume?.previewUrl?.isEmpty == false)
                        ApplicantChecklistPill(title: "Short take", isDone: profile?.signal?.tenSecondVideo != nil)
                        ApplicantChecklistPill(title: "Deeper signal", isDone: profile?.signal?.thirtySecondVideo != nil)
                        ApplicantChecklistPill(title: "Soft skills", isDone: profile?.softSkills?.items.isEmpty == false)
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var searchRecoveryCard: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: "magnifyingglass.circle.fill")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundStyle(.orange)
                        .frame(width: 42, height: 42)
                        .background(Color.orange.opacity(0.12))
                        .clipShape(Circle())

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Improve recruiter search")
                            .font(.headline.weight(.bold))
                            .foregroundStyle(CatoTheme.ink)
                        Text(searchRecoveryDescription)
                            .font(.subheadline)
                            .foregroundStyle(CatoTheme.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }

                Button {
                    isShowingSearchProfileEditor = true
                } label: {
                    Label("Add skills and fields manually", systemImage: "slider.horizontal.3")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(CatoPrimaryButtonStyle())
            }
        }
    }

    private var requestsPreview: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                ApplicantSectionHeader(title: "Recruiter requests", subtitle: "\(requests.count)")

                if requests.isEmpty {
                    Text("Interest requests from recruiters will appear here.")
                        .font(.subheadline)
                        .foregroundStyle(CatoTheme.muted)
                } else {
                    VStack(spacing: 10) {
                        ForEach(requests.prefix(3)) { request in
                            NavigationLink {
                                ApplicantRequestDetailView(request: request)
                            } label: {
                                ApplicantRequestRow(request: request)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
        }
    }

    private var activityPreview: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                ApplicantSectionHeader(title: "Recent visibility", subtitle: "\(activity?.recent.count ?? 0)")

                if let recent = activity?.recent, !recent.isEmpty {
                    VStack(spacing: 10) {
                        ForEach(recent.prefix(4)) { item in
                            HStack(alignment: .top, spacing: 10) {
                                Image(systemName: "sparkle.magnifyingglass")
                                    .foregroundStyle(CatoTheme.purple)
                                    .frame(width: 26, height: 26)
                                    .background(CatoTheme.purpleSoft)
                                    .clipShape(Circle())
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(item.title)
                                        .font(.subheadline.weight(.semibold))
                                    Text(item.body)
                                        .font(.caption)
                                        .foregroundStyle(CatoTheme.muted)
                                }
                                Spacer()
                            }
                        }
                    }
                } else {
                    Text("Recruiter activity will appear here once your profile is discovered.")
                        .font(.subheadline)
                        .foregroundStyle(CatoTheme.muted)
                }
            }
        }
    }

    private func metricsRow(_ metrics: ApplicantActivityMetrics) -> some View {
        HStack(spacing: 10) {
            ApplicantMetricCard(value: "\(metrics.profileViews)", label: "Views")
            ApplicantMetricCard(value: "\(metrics.bookmarks)", label: "Saved")
            ApplicantMetricCard(value: "\(metrics.shortlists)", label: "Shortlists")
        }
    }

    private var shouldShowSearchRecoveryPrompt: Bool {
        guard searchProfile == nil else { return false }
        return resumeResponse?.parseStatus != .ready
    }

    private var searchRecoveryDescription: String {
        switch resumeResponse?.parseStatus {
        case .needsExtraction:
            return "Your resume is uploaded, but Cato has not extracted searchable text from it. Add your skills and fields manually so recruiter search can still find you."
        case .some(.none), nil:
            return "You do not have searchable resume text yet. Add your skills and fields manually so recruiters can match you while your resume is missing or not parsed."
        case .ready:
            return "Add your skills and fields manually to strengthen matching beyond your resume."
        }
    }

    private func loadHome() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to load applicant home."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            async let profileResponse = apiClient.getApplicantProfile(accessToken: accessToken)
            async let activityResponse = apiClient.getApplicantActivity(accessToken: accessToken)
            async let requestResponse = apiClient.getApplicantInterestRequests(accessToken: accessToken)
            async let resumeRequest = apiClient.getApplicantResume(accessToken: accessToken)
            async let searchProfileRequest = apiClient.getApplicantSearchProfile(accessToken: accessToken)
            profile = try await profileResponse
            activity = try await activityResponse
            requests = try await requestResponse.requests
            resumeResponse = try await resumeRequest
            searchProfile = try await searchProfileRequest.profile
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

private struct ApplicantChecklistPill: View {
    let title: String
    let isDone: Bool

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: isDone ? "checkmark.circle.fill" : "circle")
                .foregroundStyle(isDone ? CatoTheme.purple : CatoTheme.muted)
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(CatoTheme.ink)
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(isDone ? CatoTheme.purpleSoft : Color.white)
        .clipShape(Capsule())
        .overlay(Capsule().stroke(CatoTheme.border, lineWidth: 1))
    }
}

private struct ApplicantMetricCard: View {
    let value: String
    let label: String

    var body: some View {
        CatoCard {
            VStack(spacing: 5) {
                Text(value)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(CatoTheme.purple)
                Text(label)
                    .font(.caption.weight(.medium))
                    .foregroundStyle(CatoTheme.muted)
            }
            .frame(maxWidth: .infinity)
        }
    }
}
