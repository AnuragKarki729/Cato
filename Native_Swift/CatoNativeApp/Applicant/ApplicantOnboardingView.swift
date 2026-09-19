import SwiftUI
import CatoNativeCore

struct ApplicantOnboardingView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var status: ApplicantOnboardingStatus?
    @State private var profile: ApplicantProfileResponse?
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isLoading {
                CatoLoadingView(message: "Loading onboarding")
                    .background(CatoTheme.background.ignoresSafeArea())
            } else if status == .onboardingComplete || status == .profileFormComplete {
                ApplicantShellView()
            } else if let errorMessage {
                ApplicantErrorView(message: errorMessage) {
                    Task { await refresh() }
                }
            } else {
                currentStep
            }
        }
        .task {
            await refresh()
        }
    }

    @ViewBuilder
    private var currentStep: some View {
        switch status {
        case .authComplete, .none:
            EducationOnboardingStep(onCompleted: reloadAfterStep)
        case .educationComplete:
            ResumeOnboardingStep(onCompleted: reloadAfterStep)
        case .resumeComplete:
            SignalPromptOnboardingStep(onCompleted: reloadAfterStep)
        case .signalPromptSelected:
            ShortTakeUploadOnboardingStep(onCompleted: reloadAfterStep)
        case .signalVideoUploaded:
            DeeperSignalOnboardingStep(onCompleted: reloadAfterStep)
        case .deeperSignalSeen:
            DeeperVideoOnboardingStep(onCompleted: reloadAfterStep)
        case .deeperVideoSkipped, .deeperVideoUploaded:
            FinalProfileOnboardingStep(profile: profile, onCompleted: reloadAfterStep)
        case .profileFormComplete, .onboardingComplete:
            ApplicantShellView()
        }
    }

    private func reloadAfterStep() {
        Task { await refresh() }
    }

    private func refresh() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to continue onboarding."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            async let statusResponse = apiClient.getApplicantOnboardingStatus(accessToken: accessToken)
            async let profileResponse = apiClient.getApplicantProfile(accessToken: accessToken)
            status = try await statusResponse.onboardingStatus
            profile = try? await profileResponse
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

private struct EducationOnboardingStep: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var universityName = ""
    @State private var selectedSemester = ApplicantSemester.options[0]
    @State private var isWorking = false
    @State private var errorMessage: String?
    let onCompleted: () -> Void

    var body: some View {
        ApplicantOnboardingContainer(title: "Your college", subtitle: "Start with the basics recruiters use to understand your current stage.") {
            VStack(alignment: .leading, spacing: 16) {
                TextField("University", text: $universityName)
                    .textInputAutocapitalization(.words)
                    .padding(14)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(CatoTheme.border, lineWidth: 1))

                Text("Semester")
                    .font(.headline.weight(.bold))

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    ForEach(ApplicantSemester.options) { semester in
                        Button {
                            selectedSemester = semester
                        } label: {
                            Text(semester.shortLabel)
                                .font(.caption.weight(.bold))
                                .lineLimit(2)
                                .minimumScaleFactor(0.8)
                                .frame(maxWidth: .infinity, minHeight: 38)
                                .padding(8)
                                .foregroundStyle(selectedSemester.id == semester.id ? .white : CatoTheme.ink)
                                .background(selectedSemester.id == semester.id ? CatoTheme.purple : Color.white)
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(CatoTheme.border, lineWidth: 1))
                        }
                    }
                }

                ApplicantStepError(errorMessage)

                Button {
                    Task { await save() }
                } label: {
                    if isWorking {
                        ProgressView().tint(.white).frame(maxWidth: .infinity)
                    } else {
                        Text("Continue").frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(CatoPrimaryButtonStyle())
                .disabled(isWorking || universityName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
    }

    private func save() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to save education."
            return
        }

        isWorking = true
        errorMessage = nil

        do {
            _ = try await apiClient.saveApplicantEducation(
                accessToken: accessToken,
                universityName: universityName.trimmingCharacters(in: .whitespacesAndNewlines),
                semesterLabel: selectedSemester.label,
                semesterNumber: selectedSemester.value
            )
            onCompleted()
        } catch {
            errorMessage = error.localizedDescription
        }

        isWorking = false
    }
}

private struct ResumeOnboardingStep: View {
    let onCompleted: () -> Void

    var body: some View {
        ApplicantResumeUploadOnboardingStep(onCompleted: onCompleted)
    }
}

private struct SignalPromptOnboardingStep: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var prompts: [SignalPrompt] = []
    @State private var selectedPromptId: String?
    @State private var isLoading = true
    @State private var isWorking = false
    @State private var errorMessage: String?
    let onCompleted: () -> Void

    var body: some View {
        ApplicantOnboardingContainer(title: "What moves you?", subtitle: "Choose the prompt your short take will answer.") {
            VStack(alignment: .leading, spacing: 12) {
                if isLoading {
                    CatoLoadingView(message: "Loading prompts")
                        .frame(maxWidth: .infinity)
                } else {
                    ForEach(prompts.prefix(8)) { prompt in
                        Button {
                            selectedPromptId = prompt.id
                        } label: {
                            VStack(alignment: .leading, spacing: 5) {
                                Text(prompt.fieldLabel)
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(CatoTheme.purple)
                                Text(prompt.text)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(CatoTheme.ink)
                                    .multilineTextAlignment(.leading)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(12)
                            .background(selectedPromptId == prompt.id ? CatoTheme.purpleSoft : Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(selectedPromptId == prompt.id ? CatoTheme.purple : CatoTheme.border, lineWidth: 1))
                        }
                    }
                }

                ApplicantStepError(errorMessage)

                Button {
                    Task { await selectPrompt() }
                } label: {
                    if isWorking {
                        ProgressView().tint(.white).frame(maxWidth: .infinity)
                    } else {
                        Text("Use this prompt").frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(CatoPrimaryButtonStyle())
                .disabled(isWorking || selectedPromptId == nil)
            }
        }
        .task {
            await loadPrompts()
        }
    }

    private func loadPrompts() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to load prompts."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            prompts = try await apiClient.getSignalPrompts(accessToken: accessToken).prompts
            selectedPromptId = prompts.first?.id
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    private func selectPrompt() async {
        guard let selectedPromptId, let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Choose a prompt first."
            return
        }

        isWorking = true
        errorMessage = nil

        do {
            try await apiClient.selectSignalPrompt(accessToken: accessToken, promptId: selectedPromptId)
            onCompleted()
        } catch {
            errorMessage = error.localizedDescription
        }

        isWorking = false
    }
}

private struct VideoBlockedOnboardingStep: View {
    let title: String
    let message: String
    let systemImage: String
    let onRefresh: () -> Void

    var body: some View {
        ApplicantOnboardingContainer(title: title, subtitle: "This step requires native media support.") {
            VStack(spacing: 16) {
                Image(systemName: systemImage)
                    .font(.system(size: 44))
                    .foregroundStyle(CatoTheme.purple)
                Text(message)
                    .font(.subheadline)
                    .foregroundStyle(CatoTheme.muted)
                    .multilineTextAlignment(.center)
                Button("Refresh status", action: onRefresh)
                    .buttonStyle(CatoPrimaryButtonStyle())
            }
            .frame(maxWidth: .infinity)
        }
    }
}

private struct DeeperSignalOnboardingStep: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var elaboration = ""
    @State private var isWorking = false
    @State private var errorMessage: String?
    let onCompleted: () -> Void

    var body: some View {
        ApplicantOnboardingContainer(title: "Go deeper", subtitle: "Add a short thought after your short take, or skip it for now.") {
            VStack(alignment: .leading, spacing: 14) {
                TextEditor(text: $elaboration)
                    .frame(minHeight: 120)
                    .padding(10)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(CatoTheme.border, lineWidth: 1))

                ApplicantStepError(errorMessage)

                Button {
                    Task { await continueStep() }
                } label: {
                    if isWorking {
                        ProgressView().tint(.white).frame(maxWidth: .infinity)
                    } else {
                        Text("Continue").frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(CatoPrimaryButtonStyle())
                .disabled(isWorking)
            }
        }
    }

    private func continueStep() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to continue."
            return
        }

        isWorking = true
        errorMessage = nil

        do {
            try await apiClient.markDeeperSignalSeen(accessToken: accessToken, elaboration: elaboration)
            onCompleted()
        } catch {
            errorMessage = error.localizedDescription
        }

        isWorking = false
    }
}

private struct DeeperVideoOnboardingStep: View {
    @EnvironmentObject private var auth: AuthViewModel
    let onCompleted: () -> Void

    var body: some View {
        DeeperSignalVideoUploadOnboardingStep(
            onSkip: {
                guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
                    throw CatoAPIError.requestFailed("Sign in again to continue.")
                }
                try await apiClient.skipApplicantDeeperVideo(accessToken: accessToken)
            },
            onCompleted: onCompleted
        )
    }
}

private struct FinalProfileOnboardingStep: View {
    @EnvironmentObject private var auth: AuthViewModel
    let profile: ApplicantProfileResponse?
    let onCompleted: () -> Void
    @State private var name = ""
    @State private var gpa = ""
    @State private var major = ""
    @State private var minor = ""
    @State private var resumeResponse: ApplicantResumeResponse?
    @State private var searchProfile: ApplicantSearchProfile?
    @State private var isLoadingSearchStatus = true
    @State private var isWorking = false
    @State private var errorMessage: String?

    var body: some View {
        ApplicantOnboardingContainer(title: "Save your profile", subtitle: "Finish the recruiter-facing basics.") {
            VStack(alignment: .leading, spacing: 14) {
                TextField("Name", text: $name)
                    .textInputAutocapitalization(.words)
                    .padding(14)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(CatoTheme.border, lineWidth: 1))

                if let education = profile?.education {
                    CatoCard {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(education.universityName)
                                .font(.headline.weight(.bold))
                            Text(education.semesterLabel)
                                .font(.subheadline)
                                .foregroundStyle(CatoTheme.muted)
                        }
                    }
                }

                TextField("GPA", text: $gpa)
                    .keyboardType(.decimalPad)
                    .padding(14)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(CatoTheme.border, lineWidth: 1))

                TextField("Major", text: $major)
                    .textInputAutocapitalization(.words)
                    .padding(14)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(CatoTheme.border, lineWidth: 1))

                TextField("Minor optional", text: $minor)
                    .textInputAutocapitalization(.words)
                    .padding(14)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
                    .overlay(RoundedRectangle(cornerRadius: 14).stroke(CatoTheme.border, lineWidth: 1))

                if shouldShowSearchProfileRecovery {
                    searchProfileRecoveryCard
                }

                ApplicantStepError(errorMessage)

                Button {
                    Task { await save() }
                } label: {
                    if isWorking {
                        ProgressView().tint(.white).frame(maxWidth: .infinity)
                    } else {
                        Text("Finish profile").frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(CatoPrimaryButtonStyle())
                .disabled(isWorking || name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || profile?.education == nil)
            }
        }
        .onAppear {
            if name.isEmpty {
                name = profile?.applicant.displayName ?? ""
                if let existingGPA = profile?.education?.gpa {
                    gpa = String(format: "%.2f", existingGPA)
                }
                major = profile?.education?.major ?? ""
                minor = profile?.education?.minor ?? ""
            }
        }
        .task {
            await loadSearchStatus()
        }
    }

    private var searchProfileRecoveryCard: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: "magnifyingglass.circle.fill")
                        .font(.system(size: 27, weight: .bold))
                        .foregroundStyle(.orange)
                        .frame(width: 40, height: 40)
                        .background(Color.orange.opacity(0.12))
                        .clipShape(Circle())

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Help recruiters find you")
                            .font(.headline.weight(.bold))
                        Text(searchProfileRecoveryDescription)
                            .font(.subheadline)
                            .foregroundStyle(CatoTheme.muted)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }

                NavigationLink {
                    ApplicantSearchProfileEditorView()
                } label: {
                    Label("Add matching details", systemImage: "slider.horizontal.3")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(CatoPrimaryButtonStyle())
            }
        }
    }

    private var shouldShowSearchProfileRecovery: Bool {
        guard !isLoadingSearchStatus else { return false }
        guard searchProfile == nil else { return false }
        return resumeResponse?.parseStatus != .ready
    }

    private var searchProfileRecoveryDescription: String {
        switch resumeResponse?.parseStatus {
        case .needsExtraction:
            return "Your resume is uploaded, but searchable text is not ready yet. You can still finish onboarding, or add skills and fields manually so recruiter search can find you."
        case .some(.none), nil:
            return "You do not have searchable resume text yet. You can still finish onboarding, or add your skills and fields manually now."
        case .ready:
            return "Add your skills and fields manually to strengthen matching beyond your resume."
        }
    }

    private func loadSearchStatus() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            isLoadingSearchStatus = false
            return
        }

        isLoadingSearchStatus = true

        do {
            async let resumeRequest = apiClient.getApplicantResume(accessToken: accessToken)
            async let searchProfileRequest = apiClient.getApplicantSearchProfile(accessToken: accessToken)
            resumeResponse = try await resumeRequest
            searchProfile = try await searchProfileRequest.profile
        } catch {
            resumeResponse = nil
            searchProfile = nil
        }

        isLoadingSearchStatus = false
    }

    private func save() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken, let education = profile?.education else {
            errorMessage = "Profile details are not ready yet."
            return
        }

        let parsedGPA = Double(gpa.trimmingCharacters(in: .whitespacesAndNewlines))
        if let parsedGPA, parsedGPA < 0 || parsedGPA > 4 {
            errorMessage = "GPA must be between 0.00 and 4.00."
            return
        }

        isWorking = true
        errorMessage = nil

        do {
            try await apiClient.completeApplicantOnboardingProfile(
                accessToken: accessToken,
                name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                education: education,
                gpa: parsedGPA.map { (round($0 * 100) / 100) },
                major: major,
                minor: minor
            )
            onCompleted()
        } catch {
            errorMessage = error.localizedDescription
        }

        isWorking = false
    }
}

struct ApplicantOnboardingContainer<Content: View>: View {
    let title: String
    let subtitle: String
    @ViewBuilder let content: Content

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    VStack(alignment: .leading, spacing: 6) {
                        CatoWordmark()
                        Text(title)
                            .font(CatoTheme.screenTitle)
                        Text(subtitle)
                            .font(CatoTheme.body)
                            .foregroundStyle(CatoTheme.muted)
                    }
                    content
                }
                .padding(CatoTheme.screenPadding)
            }
            .background(CatoTheme.background.ignoresSafeArea())
        }
    }
}

struct ApplicantStepError: View {
    let message: String?

    init(_ message: String?) {
        self.message = message
    }

    var body: some View {
        if let message {
            Text(message)
                .font(.caption.weight(.semibold))
                .foregroundStyle(.red)
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.red.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
    }
}

private struct ApplicantSemester: Identifiable, Equatable {
    let label: String
    let shortLabel: String
    let value: Int

    var id: Int { value }

    static let options = [
        ApplicantSemester(label: "Freshman / Semester 1", shortLabel: "Freshman\nSem 1", value: 1),
        ApplicantSemester(label: "Freshman / Semester 2", shortLabel: "Freshman\nSem 2", value: 2),
        ApplicantSemester(label: "Sophomore / Semester 3", shortLabel: "Sophomore\nSem 3", value: 3),
        ApplicantSemester(label: "Sophomore / Semester 4", shortLabel: "Sophomore\nSem 4", value: 4),
        ApplicantSemester(label: "Junior / Semester 5", shortLabel: "Junior\nSem 5", value: 5),
        ApplicantSemester(label: "Junior / Semester 6", shortLabel: "Junior\nSem 6", value: 6),
        ApplicantSemester(label: "Senior / Semester 7", shortLabel: "Senior\nSem 7", value: 7),
        ApplicantSemester(label: "Senior / Semester 8", shortLabel: "Senior\nSem 8", value: 8),
        ApplicantSemester(label: "Year 5+ / Extended undergrad", shortLabel: "Year 5+", value: 9),
        ApplicantSemester(label: "Graduate student", shortLabel: "Graduate", value: 10),
        ApplicantSemester(label: "Graduating this semester", shortLabel: "Graduating", value: 99),
        ApplicantSemester(label: "Graduated", shortLabel: "Graduated", value: 100)
    ]
}
