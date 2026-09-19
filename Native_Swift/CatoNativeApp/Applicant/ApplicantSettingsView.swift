import SwiftUI
import CatoNativeCore

struct ApplicantSettingsView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var profile: ApplicantProfileResponse?
    @State private var resumeResponse: ApplicantResumeResponse?
    @State private var searchProfile: ApplicantSearchProfile?
    @State private var selectedSkillOptions: [MatchingOption] = []
    @State private var selectedFieldOptions: [MatchingOption] = []
    @State private var skillOptions: [MatchingOption] = []
    @State private var fieldOptions: [MatchingOption] = []
    @State private var skillQuery = ""
    @State private var fieldQuery = ""
    @State private var newSkillLabel = ""
    @State private var newFieldLabel = ""
    @State private var depthType: MatchingOptionType = .skill
    @State private var depthId = ""
    @State private var errorMessage: String?
    @State private var resumeExtractionMessage: String?
    @State private var searchProfileMessage: String?
    @State private var isLoading = true
    @State private var isExtractingResume = false
    @State private var isSavingSearchProfile = false
    @State private var isLoadingOptions = false
    @State private var isConfirmingLogout = false
    @State private var isConfirmingDelete = false
    @State private var isShowingProfileEditor = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Settings")
                            .font(CatoTheme.screenTitle)
                        Text("Manage your applicant account.")
                            .font(CatoTheme.body)
                            .foregroundStyle(CatoTheme.muted)
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

                    Button {
                        isShowingProfileEditor = true
                    } label: {
                        CatoCard {
                            VStack(alignment: .leading, spacing: 14) {
                                HStack(spacing: 12) {
                                    CandidateAvatar(name: displayName, size: 54)
                                    VStack(alignment: .leading, spacing: 3) {
                                        Text(displayName)
                                            .font(.headline.weight(.bold))
                                        Text(displayEmail)
                                            .font(.subheadline)
                                            .foregroundStyle(CatoTheme.muted)
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right")
                                        .font(.caption.weight(.bold))
                                        .foregroundStyle(CatoTheme.muted)
                                }

                                Divider()

                                ApplicantSettingsInfoRow(label: "University", value: profile?.education?.universityName ?? "Not added")
                                ApplicantSettingsInfoRow(label: "Major", value: profile?.education?.major ?? "Not added")
                                ApplicantSettingsInfoRow(label: "Semester", value: profile?.education?.semesterLabel ?? "Not added")
                                if let gpa = profile?.education?.gpa {
                                    ApplicantSettingsInfoRow(label: "GPA", value: String(format: "%.2f", gpa))
                                }
                            }
                        }
                    }
                    .buttonStyle(.plain)

                    CatoCard {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Account")
                                .font(.headline.weight(.bold))

                            if auth.isWorking {
                                HStack(spacing: 10) {
                                    ProgressView()
                                    Text("Updating account...")
                                        .font(.subheadline.weight(.semibold))
                                        .foregroundStyle(CatoTheme.muted)
                                }
                            }

                            Button {
                                isConfirmingLogout = true
                            } label: {
                                Text("Log out")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(CatoPrimaryButtonStyle())
                            .disabled(auth.isWorking)

                            Button(role: .destructive) {
                                isConfirmingDelete = true
                            } label: {
                                Text("Delete account")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.bordered)
                            .disabled(auth.isWorking)
                        }
                    }
                }
                .padding(CatoTheme.screenPadding)
            }
            .background(CatoTheme.background.ignoresSafeArea())
            .task {
                await loadProfile()
            }
            .sheet(isPresented: $isShowingProfileEditor) {
                if let profile {
                    ApplicantProfileEducationEditorSheet(profile: profile) {
                        Task { await loadProfile() }
                    }
                }
            }
            .alert("Log out?", isPresented: $isConfirmingLogout) {
                Button("Cancel", role: .cancel) {}
                Button("Log out", role: .destructive) {
                    auth.signOut()
                }
            } message: {
                Text("You will return to the Cato sign-in screen.")
            }
            .alert("Delete account?", isPresented: $isConfirmingDelete) {
                Button("Cancel", role: .cancel) {}
                Button("Delete account", role: .destructive) {
                    auth.deleteApplicantAccount()
                }
            } message: {
                Text("This permanently removes your Cato applicant account and cannot be undone.")
            }
        }
    }

    private var displayName: String {
        profile?.applicant.displayName ?? "Applicant"
    }

    private var displayEmail: String {
        profile?.applicant.email ?? auth.session?.user.email ?? "Email unavailable"
    }

    private var resumeParseIcon: String {
        resumeResponse?.parseStatus == .ready ? "checkmark.seal.fill" : "exclamationmark.triangle.fill"
    }

    private var resumeParseColor: Color {
        resumeResponse?.parseStatus == .ready ? .green : .orange
    }

    private var resumeParseDescription: String {
        if resumeResponse?.parseStatus == .ready {
            return "Your resume has searchable text. This helps Cato match you in recruiter searches."
        }

        return "Your resume is uploaded, but Cato has not extracted searchable text from it yet. You can still use the app, but recruiters may not find you in resume-based searches until this is fixed."
    }

    private func loadProfile() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to load settings."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            profile = try await apiClient.getApplicantProfile(accessToken: accessToken)
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    private func extractResumeText() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            resumeExtractionMessage = "Sign in again to extract your resume."
            return
        }

        guard let resume = resumeResponse?.resume, let urlString = resume.secureUrl ?? resume.previewUrl, let url = URL(string: urlString) else {
            resumeExtractionMessage = "Resume file link is unavailable. Try replacing the resume."
            return
        }

        isExtractingResume = true
        resumeExtractionMessage = nil

        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            if let httpResponse = response as? HTTPURLResponse, !(200..<300).contains(httpResponse.statusCode) {
                throw ResumeTextExtractionError.unreadablePDF
            }

            let text = try ResumeTextExtractor.extractText(from: data)
            try await saveParsedResumeText(
                apiClient: apiClient,
                accessToken: accessToken,
                text: text,
                sourceFileName: resume.originalFileName
            )
            resumeResponse = try await apiClient.getApplicantResume(accessToken: accessToken)
            resumeExtractionMessage = "Resume extracted. Recruiter search can now use your resume text."
        } catch {
            resumeExtractionMessage = "\(error.localizedDescription) You can keep using Cato, but resume-based search visibility may be limited until extraction succeeds."
        }

        isExtractingResume = false
    }

    private var depthOptions: [MatchingOption] {
        depthType == .skill ? selectedSkillOptions : selectedFieldOptions
    }

    private func hydrateSearchProfileSelection() {
        guard let searchProfile else { return }

        selectedSkillOptions = searchProfile.skillIds.map { storedOption(key: $0, type: .skill) }
        selectedFieldOptions = searchProfile.fieldIds.map { storedOption(key: $0, type: .category) }
        depthType = searchProfile.depth.type
        depthId = searchProfile.depth.id
    }

    private func storedOption(key: String, type: MatchingOptionType) -> MatchingOption {
        let label = key
            .split(separator: "_")
            .map { $0.capitalized }
            .joined(separator: " ")
        return MatchingOption(id: "\(type.rawValue):\(key)", type: type, key: key, label: label, builtin: nil, usageCount: nil)
    }

    private func loadOptions(type: MatchingOptionType) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }

        isLoadingOptions = true
        defer { isLoadingOptions = false }

        do {
            let response = try await apiClient.getMatchingOptions(
                accessToken: accessToken,
                type: type,
                query: type == .skill ? skillQuery : fieldQuery
            )
            if type == .skill {
                skillOptions = response.options
            } else {
                fieldOptions = response.options
            }
        } catch {
            searchProfileMessage = error.localizedDescription
        }
    }

    private func addManualOption(type: MatchingOptionType) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }

        let label = (type == .skill ? newSkillLabel : newFieldLabel).trimmingCharacters(in: .whitespacesAndNewlines)
        guard !label.isEmpty else { return }

        do {
            let option = try await apiClient.addMatchingOption(accessToken: accessToken, type: type, label: label)
            if type == .skill {
                selectedSkillOptions.appendUnique(option, max: 100)
                newSkillLabel = ""
                skillQuery = ""
                await loadOptions(type: .skill)
            } else {
                selectedFieldOptions.appendUnique(option, max: 10)
                newFieldLabel = ""
                fieldQuery = ""
                await loadOptions(type: .category)
            }
            ensureDepthSelection()
        } catch {
            searchProfileMessage = error.localizedDescription
        }
    }

    private func saveSearchProfile() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            searchProfileMessage = "Sign in again to save your search profile."
            return
        }

        ensureDepthSelection()
        guard !depthId.isEmpty else {
            searchProfileMessage = "Choose the one skill or field you are most fluent in."
            return
        }

        isSavingSearchProfile = true
        searchProfileMessage = nil

        do {
            searchProfile = try await apiClient.saveApplicantSearchProfile(
                accessToken: accessToken,
                skillIds: selectedSkillOptions.map(\.key),
                fieldIds: selectedFieldOptions.map(\.key),
                depth: MatchingDepth(type: depthType, id: depthId)
            )
            searchProfileMessage = "Search profile saved."
        } catch {
            searchProfileMessage = error.localizedDescription
        }

        isSavingSearchProfile = false
    }

    private func ensureDepthSelection() {
        if !depthOptions.contains(where: { $0.key == depthId }) {
            depthId = depthOptions.first?.key ?? ""
        }
    }
}

private struct ApplicantSettingsInfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack(alignment: .top) {
            Text(label)
                .font(CatoTheme.small)
                .foregroundStyle(CatoTheme.muted)
            Spacer(minLength: 12)
            Text(value)
                .font(.caption.weight(.semibold))
                .foregroundStyle(CatoTheme.ink)
                .multilineTextAlignment(.trailing)
        }
    }
}

private struct ApplicantManualOptionPicker: View {
    let title: String
    let limitText: String
    let placeholder: String
    @Binding var query: String
    @Binding var customLabel: String
    @Binding var selected: [MatchingOption]
    let options: [MatchingOption]
    let maxSelections: Int
    let onQueryChange: () -> Void
    let onAdd: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(title.uppercased())
                    .font(.caption.weight(.bold))
                    .foregroundStyle(CatoTheme.muted)
                Spacer()
                Text(limitText)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(selected.count >= maxSelections ? .orange : CatoTheme.muted)
            }

            HStack(spacing: 10) {
                Image(systemName: "magnifyingglass")
                    .foregroundStyle(CatoTheme.purple)
                TextField(placeholder, text: $query)
                    .textInputAutocapitalization(.never)
            }
            .padding(12)
            .background(CatoTheme.background)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .onChange(of: query) { _ in onQueryChange() }

            if !selected.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(selected.sortedByLabel()) { option in
                            SelectedOptionChip(label: option.label) {
                                selected.removeAll { $0.key == option.key && $0.type == option.type }
                            }
                        }
                    }
                }
            }

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 110), spacing: 8)], spacing: 8) {
                ForEach(options.prefix(10)) { option in
                    Button {
                        selected.appendUnique(option, max: maxSelections)
                    } label: {
                        Text(option.label)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(selected.containsOption(option) ? .white : CatoTheme.ink)
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 9)
                            .padding(.horizontal, 8)
                            .background(selected.containsOption(option) ? CatoTheme.purple : CatoTheme.purpleSoft)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .disabled(!selected.containsOption(option) && selected.count >= maxSelections)
                }

                if shouldShowAddResult {
                    Button(action: onAddFromQuery) {
                        Label(addResultTitle, systemImage: "plus.circle")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(CatoTheme.purple)
                            .lineLimit(1)
                            .minimumScaleFactor(0.72)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 9)
                            .padding(.horizontal, 8)
                            .background(CatoTheme.purpleSoft)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .disabled(selected.count >= maxSelections)
                }
            }
        }
    }

    private var trimmedQuery: String {
        query.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private var shouldShowAddResult: Bool {
        guard trimmedQuery.count >= 2, options.isEmpty else { return false }
        return !selected.contains { $0.label.localizedCaseInsensitiveCompare(trimmedQuery) == .orderedSame }
    }

    private var addResultTitle: String {
        let singularTitle = title.lowercased().contains("skill") ? "skill" : "field"
        return "Add \(singularTitle): \(trimmedQuery)"
    }

    private func onAddFromQuery() {
        customLabel = trimmedQuery
        onAdd()
    }
}

private struct SelectedOptionChip: View {
    let label: String
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 6) {
            Text(label)
                .font(.caption.weight(.bold))
            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .font(.caption)
            }
        }
        .foregroundStyle(CatoTheme.purple)
        .padding(.vertical, 7)
        .padding(.horizontal, 10)
        .background(CatoTheme.purpleSoft)
        .clipShape(Capsule())
    }
}

private struct ApplicantProfileEducationEditorSheet: View {
    @EnvironmentObject private var auth: AuthViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var name: String
    @State private var universityName: String
    @State private var selectedSemester: ApplicantSettingsSemester
    @State private var gpa: String
    @State private var major: String
    @State private var minor: String
    @State private var isSaving = false
    @State private var errorMessage: String?
    let originalEducation: ApplicantEducation?
    let onSaved: () -> Void

    init(profile: ApplicantProfileResponse, onSaved: @escaping () -> Void) {
        let semester = ApplicantSettingsSemester.options.first { $0.value == profile.education?.semesterNumber }
            ?? ApplicantSettingsSemester.options.first
            ?? ApplicantSettingsSemester(label: "Freshman / Semester 1", shortLabel: "Freshman\nSem 1", value: 1)
        _name = State(initialValue: profile.applicant.displayName)
        _universityName = State(initialValue: profile.education?.universityName ?? "")
        _selectedSemester = State(initialValue: semester)
        _gpa = State(initialValue: profile.education?.gpa.map { String(format: "%.2f", $0) } ?? "")
        _major = State(initialValue: profile.education?.major ?? "")
        _minor = State(initialValue: profile.education?.minor ?? "")
        originalEducation = profile.education
        self.onSaved = onSaved
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if let errorMessage {
                        ApplicantSettingsInlineError(message: errorMessage)
                    }

                    CatoCard {
                        VStack(alignment: .leading, spacing: 12) {
                            ApplicantSectionHeader(title: "Applicant info", subtitle: "Editable")
                            TextField("Name", text: $name)
                                .textInputAutocapitalization(.words)
                                .textFieldStyle(.roundedBorder)
                            TextField("University", text: $universityName)
                                .textInputAutocapitalization(.words)
                                .textFieldStyle(.roundedBorder)
                        }
                    }

                    CatoCard {
                        VStack(alignment: .leading, spacing: 12) {
                            ApplicantSectionHeader(title: "Semester", subtitle: selectedSemester.shortLabel.replacingOccurrences(of: "\n", with: " "))
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                                ForEach(ApplicantSettingsSemester.options) { semester in
                                    Button {
                                        selectedSemester = semester
                                    } label: {
                                        Text(semester.shortLabel)
                                            .font(.caption.weight(.bold))
                                            .lineLimit(2)
                                            .minimumScaleFactor(0.78)
                                            .multilineTextAlignment(.center)
                                            .frame(maxWidth: .infinity, minHeight: 42)
                                            .padding(8)
                                            .foregroundStyle(selectedSemester.id == semester.id ? .white : CatoTheme.ink)
                                            .background(selectedSemester.id == semester.id ? CatoTheme.purple : Color.white)
                                            .clipShape(RoundedRectangle(cornerRadius: 12))
                                            .overlay(RoundedRectangle(cornerRadius: 12).stroke(CatoTheme.border, lineWidth: 1))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }

                    CatoCard {
                        VStack(alignment: .leading, spacing: 12) {
                            ApplicantSectionHeader(title: "Degree metadata", subtitle: "Optional")
                            TextField("GPA", text: $gpa)
                                .keyboardType(.decimalPad)
                                .textFieldStyle(.roundedBorder)
                            TextField("Major", text: $major)
                                .textInputAutocapitalization(.words)
                                .textFieldStyle(.roundedBorder)
                            TextField("Minor", text: $minor)
                                .textInputAutocapitalization(.words)
                                .textFieldStyle(.roundedBorder)

                            Button {
                                gpa = ""
                                major = ""
                                minor = ""
                            } label: {
                                Label("Clear optional fields", systemImage: "trash")
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(CatoSecondaryButtonStyle())
                        }
                    }

                    Button {
                        Task { await save() }
                    } label: {
                        if isSaving {
                            ProgressView()
                                .tint(.white)
                                .frame(maxWidth: .infinity)
                        } else {
                            Text("Save profile info")
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(CatoPrimaryButtonStyle())
                    .disabled(isSaving || name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || universityName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                .padding(CatoTheme.screenPadding)
            }
            .background(CatoTheme.background.ignoresSafeArea())
            .navigationTitle("Edit profile info")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    private func save() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to save profile info."
            return
        }

        let parsedGpa: Double?
        let trimmedGpa = gpa.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmedGpa.isEmpty {
            parsedGpa = nil
        } else if let value = Double(trimmedGpa), value >= 0, value <= 4 {
            parsedGpa = value
        } else {
            errorMessage = "GPA must be between 0 and 4."
            return
        }

        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        do {
            _ = try await apiClient.updateApplicantAccount(
                accessToken: accessToken,
                name: name.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            _ = try await apiClient.updateApplicantEducation(
                accessToken: accessToken,
                universityName: universityName.trimmingCharacters(in: .whitespacesAndNewlines),
                universityMatchedFromEmail: originalEducation?.universityMatchedFromEmail ?? false,
                semesterLabel: selectedSemester.label,
                semesterNumber: selectedSemester.value,
                gpa: parsedGpa,
                major: optionalText(major),
                minor: optionalText(minor)
            )
            onSaved()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func optionalText(_ value: String) -> String? {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}

private struct ApplicantSettingsInlineError: View {
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
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.orange.opacity(0.24), lineWidth: 1))
    }
}

private struct ApplicantSettingsSemester: Identifiable, Equatable {
    let label: String
    let shortLabel: String
    let value: Int

    var id: Int { value }

    static let options = [
        ApplicantSettingsSemester(label: "Freshman / Semester 1", shortLabel: "Freshman\nSem 1", value: 1),
        ApplicantSettingsSemester(label: "Freshman / Semester 2", shortLabel: "Freshman\nSem 2", value: 2),
        ApplicantSettingsSemester(label: "Sophomore / Semester 3", shortLabel: "Sophomore\nSem 3", value: 3),
        ApplicantSettingsSemester(label: "Sophomore / Semester 4", shortLabel: "Sophomore\nSem 4", value: 4),
        ApplicantSettingsSemester(label: "Junior / Semester 5", shortLabel: "Junior\nSem 5", value: 5),
        ApplicantSettingsSemester(label: "Junior / Semester 6", shortLabel: "Junior\nSem 6", value: 6),
        ApplicantSettingsSemester(label: "Senior / Semester 7", shortLabel: "Senior\nSem 7", value: 7),
        ApplicantSettingsSemester(label: "Senior / Semester 8", shortLabel: "Senior\nSem 8", value: 8),
        ApplicantSettingsSemester(label: "Year 5+ / Extended undergrad", shortLabel: "Year 5+", value: 9),
        ApplicantSettingsSemester(label: "Graduate student", shortLabel: "Graduate", value: 10),
        ApplicantSettingsSemester(label: "Graduating this semester", shortLabel: "Graduating", value: 99),
        ApplicantSettingsSemester(label: "Graduated", shortLabel: "Graduated", value: 100)
    ]
}

private extension Array where Element == MatchingOption {
    mutating func appendUnique(_ option: MatchingOption, max: Int) {
        guard count < max || containsOption(option) else { return }
        if !containsOption(option) {
            append(option)
        }
    }

    func containsOption(_ option: MatchingOption) -> Bool {
        contains { $0.key == option.key && $0.type == option.type }
    }

    func sortedByLabel() -> [MatchingOption] {
        sorted { left, right in
            left.label.localizedCaseInsensitiveCompare(right.label) == .orderedAscending
        }
    }
}
