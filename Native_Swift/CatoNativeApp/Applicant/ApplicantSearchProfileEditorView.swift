import SwiftUI
import CatoNativeCore

struct ApplicantSearchProfileEditorView: View {
    @EnvironmentObject private var auth: AuthViewModel
    let showHeader: Bool
    let onSaved: ((ApplicantSearchProfile?) -> Void)?

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

    init(showHeader: Bool = true, onSaved: ((ApplicantSearchProfile?) -> Void)? = nil) {
        self.showHeader = showHeader
        self.onSaved = onSaved
    }

    var body: some View {
        Group {
            if showHeader {
                ScrollView {
                    content
                        .padding(CatoTheme.screenPadding)
                }
            } else {
                content
            }
        }
        .background(CatoTheme.background.ignoresSafeArea())
        .navigationTitle(showHeader ? "" : "Search profile")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadSearchProfile()
        }
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 18) {
            if showHeader {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Search profile")
                        .font(CatoTheme.screenTitle)
                    Text("Help recruiters find you even when resume extraction is missing or incomplete.")
                        .font(CatoTheme.body)
                        .foregroundStyle(CatoTheme.muted)
                }
            }

            if isLoading {
                CatoLoadingView(message: "Loading search profile")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
            } else {
                if let errorMessage {
                    Text(errorMessage)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.red)
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.red.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                resumeExtractionCard
                manualSearchProfileCard
            }
        }
    }

    private var resumeExtractionCard: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: resumeParseIcon)
                        .font(.title3.weight(.bold))
                        .foregroundStyle(resumeParseColor)
                        .frame(width: 34, height: 34)
                        .background(resumeParseColor.opacity(0.12))
                        .clipShape(Circle())

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Resume extraction")
                            .font(.headline.weight(.bold))
                        Text(resumeDisplayName)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(CatoTheme.muted)
                            .lineLimit(1)
                    }

                    Spacer()
                }

                Text(resumeParseDescription)
                    .font(.subheadline)
                    .foregroundStyle(CatoTheme.muted)
                    .fixedSize(horizontal: false, vertical: true)

                if let resumeExtractionMessage {
                    Text(resumeExtractionMessage)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(resumeResponse?.parseStatus == .ready ? .green : .red)
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background((resumeResponse?.parseStatus == .ready ? Color.green : Color.red).opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }

                if hasUploadedResume, resumeResponse?.parseStatus != .ready {
                    Button {
                        Task { await extractResumeText() }
                    } label: {
                        if isExtractingResume {
                            ProgressView().tint(.white).frame(maxWidth: .infinity)
                        } else {
                            Label("Extract resume", systemImage: "text.viewfinder")
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(CatoPrimaryButtonStyle())
                    .disabled(isExtractingResume)
                }
            }
        }
    }

    private var manualSearchProfileCard: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Manual matching fields")
                            .font(.headline.weight(.bold))
                        Text(searchProfile == nil ? "Add this if resume extraction fails or if you want stronger recruiter matching." : "Your manual searchable profile is saved.")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(CatoTheme.muted)
                    }
                    Spacer()
                    if isLoadingOptions {
                        ProgressView()
                    }
                }

                Text("Choose up to 10 fields and up to 100 skills. Then choose the one area you are most fluent in. This helps Cato match you even when your resume cannot be parsed.")
                    .font(.subheadline)
                    .foregroundStyle(CatoTheme.muted)

                ApplicantSearchProfileOptionPicker(
                    title: "Fields / industries",
                    limitText: "\(selectedFieldOptions.count)/10",
                    placeholder: "Search or add a field",
                    query: $fieldQuery,
                    customLabel: $newFieldLabel,
                    selected: $selectedFieldOptions,
                    options: fieldOptions,
                    maxSelections: 10,
                    onQueryChange: { Task { await loadOptions(type: .category) } },
                    onAdd: { Task { await addManualOption(type: .category) } }
                )

                ApplicantSearchProfileOptionPicker(
                    title: "Skills",
                    limitText: "\(selectedSkillOptions.count)/100",
                    placeholder: "Search or add a skill",
                    query: $skillQuery,
                    customLabel: $newSkillLabel,
                    selected: $selectedSkillOptions,
                    options: skillOptions,
                    maxSelections: 100,
                    onQueryChange: { Task { await loadOptions(type: .skill) } },
                    onAdd: { Task { await addManualOption(type: .skill) } }
                )

                VStack(alignment: .leading, spacing: 8) {
                    Text("Most fluent in")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(CatoTheme.muted)

                    Picker("Depth type", selection: $depthType) {
                        Text("Skill").tag(MatchingOptionType.skill)
                        Text("Field").tag(MatchingOptionType.category)
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: depthType) { _ in
                        ensureDepthSelection()
                    }

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(depthOptions) { option in
                                Button {
                                    depthId = option.key
                                } label: {
                                    Text(option.label)
                                        .font(.caption.weight(.bold))
                                        .foregroundStyle(depthId == option.key ? .white : CatoTheme.ink)
                                        .padding(.vertical, 9)
                                        .padding(.horizontal, 12)
                                        .background(depthId == option.key ? CatoTheme.purple : CatoTheme.purpleSoft)
                                        .clipShape(Capsule())
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    if depthOptions.isEmpty {
                        Text("Select at least one skill or field before choosing your depth.")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(CatoTheme.muted)
                    }
                }

                if let searchProfileMessage {
                    Text(searchProfileMessage)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(searchProfile == nil ? .red : .green)
                }

                Button {
                    Task { await saveSearchProfile() }
                } label: {
                    if isSavingSearchProfile {
                        ProgressView().tint(.white).frame(maxWidth: .infinity)
                    } else {
                        Text("Save search profile").frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(CatoPrimaryButtonStyle())
                .disabled(isSavingSearchProfile || depthOptions.isEmpty)
            }
        }
    }

    private var hasUploadedResume: Bool {
        guard let resume = resumeResponse?.resume else { return false }
        return resume.secureUrl?.isEmpty == false || resume.previewUrl?.isEmpty == false
    }

    private var resumeDisplayName: String {
        guard hasUploadedResume else { return "No resume uploaded" }
        return resumeResponse?.resume?.originalFileName ?? "Uploaded resume"
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

        if hasUploadedResume {
            return "Your resume is uploaded, but Cato has not extracted searchable text from it yet. You can still use the app, but recruiters may not find you in resume-based searches until this is fixed."
        }

        return "No searchable resume text exists yet. You can add matching fields manually now and upload a PDF resume later."
    }

    private var depthOptions: [MatchingOption] {
        depthType == .skill ? selectedSkillOptions : selectedFieldOptions
    }

    private func loadSearchProfile() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to load your search profile."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            async let resumeRequest = apiClient.getApplicantResume(accessToken: accessToken)
            async let searchProfileRequest = apiClient.getApplicantSearchProfile(accessToken: accessToken)
            resumeResponse = try await resumeRequest
            searchProfile = try await searchProfileRequest.profile
            hydrateSearchProfileSelection()
            await loadOptions(type: .category)
            await loadOptions(type: .skill)
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
                selectedSkillOptions.appendUniqueSearchProfileOption(option, max: 100)
                newSkillLabel = ""
                skillQuery = ""
                await loadOptions(type: .skill)
            } else {
                selectedFieldOptions.appendUniqueSearchProfileOption(option, max: 10)
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
            onSaved?(searchProfile)
            NotificationCenter.default.post(name: .applicantSearchProfileDidChange, object: nil)
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

extension Notification.Name {
    static let applicantSearchProfileDidChange = Notification.Name("applicantSearchProfileDidChange")
    static let applicantSelectProfileTab = Notification.Name("applicantSelectProfileTab")
}

private struct ApplicantSearchProfileOptionPicker: View {
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
                        ForEach(selected.sortedSearchProfileOptions()) { option in
                            ApplicantSearchProfileSelectedChip(label: option.label) {
                                selected.removeAll { $0.key == option.key && $0.type == option.type }
                            }
                        }
                    }
                }
            }

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 110), spacing: 8)], spacing: 8) {
                ForEach(options.prefix(10)) { option in
                    Button {
                        selected.appendUniqueSearchProfileOption(option, max: maxSelections)
                    } label: {
                        Text(option.label)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(selected.containsSearchProfileOption(option) ? .white : CatoTheme.ink)
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 9)
                            .padding(.horizontal, 8)
                            .background(selected.containsSearchProfileOption(option) ? CatoTheme.purple : CatoTheme.purpleSoft)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .disabled(!selected.containsSearchProfileOption(option) && selected.count >= maxSelections)
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

private struct ApplicantSearchProfileSelectedChip: View {
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

private extension Array where Element == MatchingOption {
    mutating func appendUniqueSearchProfileOption(_ option: MatchingOption, max: Int) {
        guard count < max || containsSearchProfileOption(option) else { return }
        if !containsSearchProfileOption(option) {
            append(option)
        }
    }

    func containsSearchProfileOption(_ option: MatchingOption) -> Bool {
        contains { $0.key == option.key && $0.type == option.type }
    }

    func sortedSearchProfileOptions() -> [MatchingOption] {
        sorted { left, right in
            left.label.localizedCaseInsensitiveCompare(right.label) == .orderedAscending
        }
    }
}
