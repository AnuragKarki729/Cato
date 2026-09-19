import SwiftUI
import CatoNativeCore

struct RecruiterSearchView: View {
    @EnvironmentObject private var auth: AuthViewModel
    let editingJob: RecruiterJob?

    @State private var employmentType = "any"
    @State private var graduationFilter = "any"
    @State private var gpaText = ""
    @State private var selectedCategories: [MatchingOption] = []
    @State private var selectedSkills: [MatchingOption] = []
    @State private var depthType: MatchingOptionType = .skill
    @State private var depthId = ""
    @State private var categoryQuery = ""
    @State private var skillQuery = ""
    @State private var categoryOptions: [MatchingOption] = []
    @State private var skillOptions: [MatchingOption] = []
    @State private var results: [RuntimeMatchResult] = []
    @State private var errorMessage: String?
    @State private var saveMessage: String?
    @State private var saveName = ""
    @State private var isShowingSaveDialog = false
    @State private var isLoadingCategories = false
    @State private var isLoadingSkills = false
    @State private var isRunningSearch = false
    @State private var hasRunSearch = false
    @State private var isSavingSearch = false
    @State private var isSearchCollapsed = false
    @State private var didNudgeToCategories = false
    @State private var didNudgeToSkills = false
    @FocusState private var isGpaFocused: Bool

    init(editingJob: RecruiterJob? = nil) {
        self.editingJob = editingJob
    }

    private let graduationOptions = [
        ("any", "Any"),
        ("false", "Not graduated"),
        ("true", "Graduated")
    ]

    private let employmentOptions = [
        ("any", "Any"),
        (RecruiterSearchEmploymentType.internship.rawValue, RecruiterSearchEmploymentType.internship.label),
        (RecruiterSearchEmploymentType.fullTime.rawValue, RecruiterSearchEmploymentType.fullTime.label),
        (RecruiterSearchEmploymentType.partTime.rawValue, RecruiterSearchEmploymentType.partTime.label),
        (RecruiterSearchEmploymentType.contract.rawValue, RecruiterSearchEmploymentType.contract.label)
    ]

    var body: some View {
        NavigationStack {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        header

                        Color.clear
                            .frame(height: 1)
                            .id("searchTop")

                        if isSearchCollapsed {
                            Button {
                                expandSearch(using: proxy)
                            } label: {
                                CollapsedSearchSummary(items: collapsedSummaryItems)
                            }
                            .buttonStyle(.plain)
                        } else {
                            searchBuilder(proxy: proxy)
                        }

                        Color.clear
                            .frame(height: 1)
                            .id("resultsTop")

                        if let errorMessage {
                            Text(errorMessage)
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(.red)
                                .padding(.horizontal, 4)
                        }

                        if let saveMessage {
                            Text(saveMessage)
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(CatoTheme.purple)
                                .padding(.horizontal, 4)
                        }

                        resultsSection
                    }
                    .padding(CatoTheme.screenPadding)
                    .padding(.bottom, 92)
                }
                .background(CatoTheme.background.ignoresSafeArea())
                .navigationBarTitleDisplayMode(.inline)
                .safeAreaInset(edge: .bottom) {
                    floatingActions(proxy: proxy)
                }
                .task {
                    await loadInitialOptions()
                    applyEditingJobIfNeeded()
                }
                .onChange(of: employmentType) { _ in
                    nudgeToCategories(using: proxy)
                }
                .onChange(of: graduationFilter) { _ in
                    nudgeToCategories(using: proxy)
                }
                .onChange(of: isGpaFocused) { focused in
                    if focused {
                        nudgeToCategories(using: proxy)
                    }
                }
                .onChange(of: categoryQuery) { _ in
                    Task { await loadOptions(type: .category) }
                }
                .onChange(of: skillQuery) { _ in
                    Task { await loadOptions(type: .skill) }
                }
                .sheet(isPresented: $isShowingSaveDialog) {
                    SaveSearchSheet(
                        name: $saveName,
                        isSaving: isSavingSearch,
                        modeTitle: editingJob == nil ? "Save search" : "Update job",
                        actionTitle: editingJob == nil ? "Save" : "Update Job",
                        onCancel: { isShowingSaveDialog = false },
                        onSave: { Task { await saveSearch() } }
                    )
                    .presentationDetents([.height(270)])
                }
            }
        }
    }

    @ViewBuilder
    private func searchBuilder(proxy: ScrollViewProxy) -> some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    Text("LOOKING FOR")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(CatoTheme.muted)
                    Spacer()
                    Button("Reset") {
                        resetBasics()
                    }
                    .font(.caption.weight(.bold))
                    .foregroundStyle(CatoTheme.purple)
                }

                Picker("Employment type", selection: $employmentType) {
                    ForEach(employmentOptions, id: \.0) { option in
                        Text(option.1).tag(option.0)
                    }
                }
                .pickerStyle(.segmented)

                Picker("Graduation", selection: $graduationFilter) {
                    ForEach(graduationOptions, id: \.0) { option in
                        Text(option.1).tag(option.0)
                    }
                }
                .pickerStyle(.segmented)

                HStack(spacing: 10) {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .foregroundStyle(CatoTheme.purple)
                    TextField("Minimum GPA, optional", text: $gpaText)
                        .keyboardType(.decimalPad)
                        .focused($isGpaFocused)
                }
                .padding(12)
                .background(CatoTheme.background)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
        }

        Color.clear
            .frame(height: 1)
            .id("optionalCriteriaAnchor")

        SearchOptionSection(
            title: "Field / category",
            placeholder: "Search technology, finance, healthcare...",
            query: $categoryQuery,
            selected: $selectedCategories,
            options: categoryOptions,
            isLoading: isLoadingCategories,
            showsReset: !selectedCategories.isEmpty || !categoryQuery.isEmpty,
            maxSelections: 10,
            onQueryChange: { Task { await loadOptions(type: .category) } },
            onAdd: {
                Task {
                    await addOption(type: .category, label: categoryQuery)
                    nudgeToSkills(using: proxy)
                }
            },
            onReset: {
                selectedCategories = []
                categoryQuery = ""
            },
            onSelect: { nudgeToSkills(using: proxy) }
        )

        Color.clear
            .frame(height: 1)
            .id("skillsAnchor")

        SearchOptionSection(
            title: "Experience in skills",
            placeholder: "Search Python, SQL, Figma, Excel...",
            query: $skillQuery,
            selected: $selectedSkills,
            options: skillOptions,
            isLoading: isLoadingSkills,
            showsReset: !selectedSkills.isEmpty || !skillQuery.isEmpty,
            maxSelections: 100,
            onQueryChange: { Task { await loadOptions(type: .skill) } },
            onAdd: { Task { await addOption(type: .skill, label: skillQuery) } },
            onReset: {
                selectedSkills = []
                skillQuery = ""
            },
            onSelect: {}
        )

        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("MOST FLUENT IN")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(CatoTheme.muted)
                        Text("Optional depth signal. Pick one selected skill or field.")
                            .font(CatoTheme.small)
                            .foregroundStyle(CatoTheme.muted)
                    }
                    Spacer()
                    if !depthId.isEmpty {
                        Button("Reset") {
                            depthId = ""
                        }
                        .font(.caption.weight(.bold))
                        .foregroundStyle(CatoTheme.purple)
                    }
                }

                Picker("Depth type", selection: $depthType) {
                    Text("Skill").tag(MatchingOptionType.skill)
                    Text("Field").tag(MatchingOptionType.category)
                }
                .pickerStyle(.segmented)
                .onChange(of: depthType) { _ in ensureDepthSelection() }

                if depthOptions.isEmpty {
                    Text("Select skills or fields above to enable depth.")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(CatoTheme.muted)
                } else {
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
                }
            }
        }
    }

    private func nudgeToCategories(using proxy: ScrollViewProxy) {
        guard !didNudgeToCategories, !isSearchCollapsed else {
            return
        }

        didNudgeToCategories = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
            withAnimation(.easeInOut(duration: 0.45)) {
                proxy.scrollTo("optionalCriteriaAnchor", anchor: .top)
            }
        }
    }

    private func nudgeToSkills(using proxy: ScrollViewProxy) {
        guard !didNudgeToSkills, !isSearchCollapsed else {
            return
        }

        didNudgeToSkills = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) {
            withAnimation(.easeInOut(duration: 0.42)) {
                proxy.scrollTo("skillsAnchor", anchor: .top)
            }
        }
    }

    private func collapseSearch(using proxy: ScrollViewProxy) {
        withAnimation(.easeInOut(duration: 0.28)) {
            isSearchCollapsed = true
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            withAnimation(.easeInOut(duration: 0.42)) {
                proxy.scrollTo("searchTop", anchor: .top)
            }
        }
    }

    private func expandSearch(using proxy: ScrollViewProxy) {
        withAnimation(.easeInOut(duration: 0.28)) {
            isSearchCollapsed = false
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            withAnimation(.easeInOut(duration: 0.42)) {
                proxy.scrollTo("searchTop", anchor: .top)
            }
        }
    }

    private func resetBasics() {
        employmentType = "any"
        graduationFilter = "any"
        gpaText = ""
        isGpaFocused = false
    }

    private func resetAllFilters() {
        resetBasics()
        selectedCategories = []
        selectedSkills = []
        depthId = ""
        categoryQuery = ""
        skillQuery = ""
        results = []
        hasRunSearch = false
        errorMessage = nil
        saveMessage = nil
        isSearchCollapsed = false
        didNudgeToCategories = false
        didNudgeToSkills = false
    }

    private func floatingActions(proxy: ScrollViewProxy) -> some View {
        HStack {
            Button {
                Task { await runSearch(onComplete: { collapseSearch(using: proxy) }) }
            } label: {
                ZStack {
                    Circle()
                        .fill(CatoTheme.purple)
                        .frame(width: 58, height: 58)
                        .shadow(color: CatoTheme.purple.opacity(0.24), radius: 16, y: 8)

                    if isRunningSearch {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 22, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
                .accessibilityLabel("Search candidates")
            }
            .disabled(isRunningSearch)

            Spacer()

            Button {
                saveName = defaultSaveName
                isShowingSaveDialog = true
            } label: {
                HStack(spacing: 8) {
                    if isSavingSearch {
                        ProgressView()
                            .tint(CatoTheme.purple)
                    } else {
                        Image(systemName: "square.and.arrow.down")
                            .font(.system(size: 17, weight: .bold))
                    }
                    Text(editingJob == nil ? "Save job" : "Update Job")
                        .font(.subheadline.weight(.bold))
                }
                .foregroundStyle(CatoTheme.purple)
                .padding(.horizontal, 18)
                .frame(height: 54)
                .background(.ultraThinMaterial)
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .stroke(CatoTheme.purple.opacity(0.22), lineWidth: 1)
                )
                .shadow(color: Color.black.opacity(0.08), radius: 16, y: 8)
                .accessibilityLabel(editingJob == nil ? "Save job" : "Update Job")
            }
            .disabled(isSavingSearch)
        }
        .padding(.horizontal, CatoTheme.screenPadding)
        .padding(.top, 8)
        .padding(.bottom, 10)
        .background(
            LinearGradient(
                colors: [CatoTheme.background.opacity(0), CatoTheme.background.opacity(0.96)],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
        )
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 5) {
                CatoWordmark()
                Spacer()
                Button {
                    resetAllFilters()
                } label: {
                    Label("Reset", systemImage: "arrow.counterclockwise")
                        .font(.caption.weight(.bold))
                }
                .foregroundStyle(CatoTheme.purple)
            }
            Text("Dynamic Search")
                .font(CatoTheme.screenTitle)
            Text("Build a structured candidate search from role type, field, skills, and student readiness signals.")
                .font(.subheadline)
                .foregroundStyle(CatoTheme.muted)
        }
    }

    @ViewBuilder
    private var resultsSection: some View {
        if results.isEmpty {
            RuntimeResultsEmptyState(hasRunSearch: hasRunSearch, hasFilters: !collapsedSummaryItems.isEmpty)
        } else {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .firstTextBaseline) {
                    Text("\(results.count) ranked candidates")
                        .font(CatoTheme.sectionTitle)
                    Spacer()
                    Text("Tap to review")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(CatoTheme.muted)
                }

                ForEach(Array(results.enumerated()), id: \.element.id) { index, result in
                    NavigationLink {
                        CandidateReviewView(candidateId: result.applicant.id, runtimeSearchSpec: currentSearchSpec, runtimeMatchScore: result.score)
                    } label: {
                        RuntimeResultRow(result: result, rank: index + 1)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }

    private func loadInitialOptions() async {
        await loadOptions(type: .category)
        await loadOptions(type: .skill)
    }

    @MainActor
    private func loadOptions(type: MatchingOptionType) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }

        if type == .category {
            isLoadingCategories = true
        } else {
            isLoadingSkills = true
        }

        do {
            let response = try await apiClient.getMatchingOptions(
                accessToken: accessToken,
                type: type,
                query: type == .category ? categoryQuery : skillQuery
            )
            if type == .category {
                categoryOptions = response.options
            } else {
                skillOptions = response.options
            }
        } catch {
            errorMessage = error.localizedDescription
        }

        if type == .category {
            isLoadingCategories = false
        } else {
            isLoadingSkills = false
        }
    }

    @MainActor
    private func addOption(type: MatchingOptionType, label: String) async {
        let trimmed = label.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }

        do {
            let option = try await apiClient.addMatchingOption(accessToken: accessToken, type: type, label: trimmed)
            if type == .category {
                selectedCategories.appendUnique(option, max: 10)
                categoryQuery = ""
                await loadOptions(type: .category)
            } else {
                selectedSkills.appendUnique(option, max: 100)
                skillQuery = ""
                await loadOptions(type: .skill)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    @MainActor
    private func runSearch(onComplete: @escaping () -> Void = {}) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to search candidates."
            return
        }

        isRunningSearch = true
        errorMessage = nil

        do {
            let response = try await apiClient.runRuntimeMatching(accessToken: accessToken, spec: currentSearchSpec)
            results = response.results
            hasRunSearch = true
            onComplete()
        } catch {
            errorMessage = error.localizedDescription
        }

        isRunningSearch = false
    }

    @MainActor
    private func saveSearch() async {
        let name = saveName.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else {
            errorMessage = "Name this saved search first."
            return
        }
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to save this search."
            return
        }

        isSavingSearch = true
        errorMessage = nil
        saveMessage = nil

        do {
            let job: RecruiterJob
            if let editingJob {
                job = try await apiClient.updateRecruiterSearch(accessToken: accessToken, jobId: editingJob.id, name: name, spec: currentSearchSpec)
                saveMessage = "\"\(job.title)\" updated."
            } else {
                job = try await apiClient.saveRecruiterSearch(accessToken: accessToken, name: name, spec: currentSearchSpec)
                saveMessage = "\"\(job.title)\" saved as a reusable role."
            }
            isShowingSaveDialog = false
        } catch {
            errorMessage = error.localizedDescription
        }

        isSavingSearch = false
    }

    private var currentSearchSpec: RuntimeSearchSpec {
        RuntimeSearchSpec(
            employmentType: selectedEmploymentType,
            targetCategories: selectedCategories.map(\.key),
            requiredSkills: selectedSkills.prefix(1).map(\.label),
            preferredSkills: Array(selectedSkills.dropFirst().map(\.label)),
            desiredDepth: currentDesiredDepth,
            graduated: graduationFilter,
            minGpa: Double(gpaText.trimmingCharacters(in: .whitespacesAndNewlines)),
            semesterNumbers: [],
            limit: 50
        )
    }

    private var defaultSaveName: String {
        let category = selectedCategories.first?.label
        let employment = selectedEmploymentType?.label
        let skill = selectedSkills.first?.label
        let name = [category, skill, employment].compactMap { $0 }.joined(separator: " ")
        return name.isEmpty ? "Saved candidate search" : name
    }

    private var selectedEmploymentType: RecruiterSearchEmploymentType? {
        RecruiterSearchEmploymentType(rawValue: employmentType)
    }

    private var depthOptions: [MatchingOption] {
        depthType == .skill ? selectedSkills.sortedByLabel() : selectedCategories.sortedByLabel()
    }

    private var currentDesiredDepth: MatchingDepth? {
        ensureDepthCandidateExists ? MatchingDepth(type: depthType, id: depthId) : nil
    }

    private var ensureDepthCandidateExists: Bool {
        !depthId.isEmpty && depthOptions.contains { $0.key == depthId }
    }

    private func applyEditingJobIfNeeded() {
        guard let editingJob, saveName.isEmpty else {
            return
        }

        saveName = editingJob.title
        employmentType = editingJob.employmentType.rawValue
        gpaText = editingJob.minGpa.map { String(format: "%.2f", $0) } ?? ""
        selectedCategories = editingJob.targetCategories.map { optionFromStoredValue($0, type: .category) }
        selectedSkills = (editingJob.requiredSkills + editingJob.preferredSkills).map { optionFromStoredValue($0, type: .skill) }
        if let desiredDepth = editingJob.desiredDepth {
            depthType = desiredDepth.type
            depthId = desiredDepth.id
        }
    }

    private func ensureDepthSelection() {
        if !depthOptions.contains(where: { $0.key == depthId }) {
            depthId = depthOptions.first?.key ?? ""
        }
    }

    private func optionFromStoredValue(_ value: String, type: MatchingOptionType) -> MatchingOption {
        let label = value
            .replacingOccurrences(of: "_", with: " ")
            .split(separator: " ")
            .map { word in word.prefix(1).uppercased() + word.dropFirst() }
            .joined(separator: " ")

        return MatchingOption(id: "\(type.rawValue):\(value)", type: type, key: value, label: label, builtin: nil, usageCount: nil)
    }

    private var collapsedSummaryItems: [SearchSummaryItem] {
        var items: [SearchSummaryItem] = []

        if let selectedEmploymentType {
            items.append(SearchSummaryItem(title: "Type", values: [selectedEmploymentType.label]))
        }

        if let graduationLabel = graduationOptions.first(where: { $0.0 == graduationFilter })?.1, graduationFilter != "any" {
            items.append(SearchSummaryItem(title: "Graduation", values: [graduationLabel]))
        }

        let trimmedGpa = gpaText.trimmingCharacters(in: .whitespacesAndNewlines)
        if !trimmedGpa.isEmpty {
            items.append(SearchSummaryItem(title: "GPA", values: ["\(trimmedGpa)+"]))
        }

        if !selectedCategories.isEmpty {
            items.append(SearchSummaryItem(title: "Field", values: selectedCategories.map(\.label)))
        }

        if !selectedSkills.isEmpty {
            items.append(SearchSummaryItem(title: "Skills", values: selectedSkills.map(\.label)))
        }

        if let depth = depthOptions.first(where: { $0.key == depthId }) {
            items.append(SearchSummaryItem(title: "Depth", values: [depth.label]))
        }

        return items
    }
}

private struct SearchSummaryItem: Identifiable {
    let id = UUID()
    let title: String
    let values: [String]

    var displayedValues: [String] {
        Array(values.prefix(2))
    }

    var remainingCount: Int {
        max(0, values.count - 2)
    }
}

private struct CollapsedSearchSummary: View {
    let items: [SearchSummaryItem]

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 10) {
                    Image(systemName: "line.3.horizontal.decrease.circle.fill")
                        .font(.title3)
                        .foregroundStyle(CatoTheme.purple)

                    VStack(alignment: .leading, spacing: 2) {
                        Text("Dynamic Search")
                            .font(CatoTheme.cardTitle)
                            .foregroundStyle(CatoTheme.ink)
                        Text("Tap to edit criteria")
                            .font(CatoTheme.small)
                            .foregroundStyle(CatoTheme.muted)
                    }

                    Spacer()

                    Image(systemName: "chevron.down")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(CatoTheme.muted)
                }

                if items.isEmpty {
                    Text("All candidates")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(CatoTheme.purple)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 7)
                        .background(CatoTheme.purpleSoft)
                        .clipShape(Capsule())
                } else {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(items) { item in
                            HStack(alignment: .top, spacing: 8) {
                                Text(item.title)
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(CatoTheme.muted)
                                    .frame(width: 76, alignment: .leading)

                                FlowTextChips(values: item.displayedValues, remainingCount: item.remainingCount)
                            }
                        }
                    }
                }
            }
        }
    }
}

private struct FlowTextChips: View {
    let values: [String]
    let remainingCount: Int

    var body: some View {
        FlowWrap(items: chipValues) { value in
            Text(value.label)
                .font(.caption.weight(.bold))
                .foregroundStyle(value.isCount ? CatoTheme.ink : CatoTheme.purple)
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(value.isCount ? CatoTheme.background : CatoTheme.purpleSoft)
                .clipShape(Capsule())
        }
    }

    private var chipValues: [TextChipValue] {
        values.map { TextChipValue(label: $0, isCount: false) } +
            (remainingCount > 0 ? [TextChipValue(label: "+\(remainingCount)", isCount: true)] : [])
    }
}

private struct TextChipValue: Identifiable {
    let label: String
    let isCount: Bool
    var id: String { "\(label)-\(isCount)" }
}

private struct SearchOptionSection: View {
    let title: String
    let placeholder: String
    @Binding var query: String
    @Binding var selected: [MatchingOption]
    let options: [MatchingOption]
    let isLoading: Bool
    let showsReset: Bool
    let maxSelections: Int
    let onQueryChange: () -> Void
    let onAdd: () -> Void
    let onReset: () -> Void
    let onSelect: () -> Void

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text(title.uppercased())
                        .font(.caption.weight(.bold))
                        .foregroundStyle(CatoTheme.muted)
                    Spacer()
                    if isLoading {
                        ProgressView()
                    }
                    if showsReset {
                        Button("Reset", action: onReset)
                            .font(.caption.weight(.bold))
                            .foregroundStyle(CatoTheme.purple)
                    }
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

                if !selected.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(sortedSelected) { option in
                                SelectedOptionChip(label: option.label) {
                                    selected.removeAll { $0.key == option.key && $0.type == option.type }
                                }
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }

                LazyVGrid(columns: [GridItem(.adaptive(minimum: 118), spacing: 8)], spacing: 8) {
                    ForEach(options.prefix(12)) { option in
                        Button {
                            selected.appendUnique(option, max: maxSelections)
                            onSelect()
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

                    if shouldShowAddButton {
                        Button(action: onAdd) {
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
        .onChange(of: query) { _ in onQueryChange() }
    }

    private var shouldShowAddButton: Bool {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.count >= 2, options.isEmpty else { return false }
        return !options.contains { $0.label.localizedCaseInsensitiveCompare(trimmed) == .orderedSame }
    }

    private var addResultTitle: String {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        let singularTitle = title.lowercased().contains("skill") ? "skill" : "field"
        return "Add \(singularTitle): \(trimmed)"
    }

    private var sortedSelected: [MatchingOption] {
        selected.sorted { left, right in
            left.label.localizedCaseInsensitiveCompare(right.label) == .orderedAscending
        }
    }
}

private struct SaveSearchSheet: View {
    @Binding var name: String
    let isSaving: Bool
    let modeTitle: String
    let actionTitle: String
    let onCancel: () -> Void
    let onSave: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(modeTitle)
                        .font(.title3.weight(.bold))
                    Text("Name this search so you can reuse it as a role.")
                        .font(CatoTheme.small)
                        .foregroundStyle(CatoTheme.muted)
                }
                Spacer()
                Button(action: onCancel) {
                    Image(systemName: "xmark")
                        .font(.headline)
                        .foregroundStyle(CatoTheme.muted)
                }
            }

            TextField("Search name", text: $name)
                .font(.body.weight(.semibold))
                .padding(12)
                .background(CatoTheme.background)
                .clipShape(RoundedRectangle(cornerRadius: 12))

            HStack(spacing: 10) {
                Button("Cancel", action: onCancel)
                    .buttonStyle(CatoSecondaryButtonStyle())

                Button {
                    onSave()
                } label: {
                    HStack {
                        if isSaving {
                            ProgressView()
                                .tint(.white)
                        }
                        Text(isSaving ? "Saving" : actionTitle)
                    }
                }
                .buttonStyle(CatoPrimaryButtonStyle())
                .disabled(isSaving)
            }
        }
        .padding(20)
        .background(CatoTheme.card)
    }
}

private struct RuntimeResultsEmptyState: View {
    let hasRunSearch: Bool
    let hasFilters: Bool

    var body: some View {
        CatoCard {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: hasRunSearch ? "person.crop.circle.badge.questionmark" : "person.3.sequence")
                    .font(.title2)
                    .foregroundStyle(CatoTheme.purple)
                    .frame(width: 42, height: 42)
                    .background(CatoTheme.purpleSoft)
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 6) {
                    Text(hasRunSearch ? "No candidates matched this search" : "Ranked matches will appear here")
                        .font(CatoTheme.cardTitle)
                        .foregroundStyle(CatoTheme.ink)
                    Text(hasRunSearch ? emptySearchHelp : "Build a search, then tap the search icon. Results are ranked with explainable deterministic scoring.")
                        .font(CatoTheme.small)
                        .foregroundStyle(CatoTheme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    private var emptySearchHelp: String {
        hasFilters
            ? "Try removing a skill, using a broader field, or leaving graduation/GPA open. Skills and fields boost rank unless they are must-have filters."
            : "There may be no completed applicant profiles ready for matching yet."
    }
}

private struct RuntimeResultRow: View {
    let result: RuntimeMatchResult
    let rank: Int

    var body: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top, spacing: 12) {
                    CandidateAvatar(name: result.applicant.displayName, size: 52)

                    VStack(alignment: .leading, spacing: 5) {
                        HStack(spacing: 7) {
                            Text("#\(rank)")
                                .font(.caption.weight(.heavy))
                                .foregroundStyle(CatoTheme.purple)
                                .padding(.horizontal, 7)
                                .padding(.vertical, 4)
                                .background(CatoTheme.purpleSoft)
                                .clipShape(Capsule())
                            Text(result.applicant.displayName)
                                .font(.headline.weight(.heavy))
                                .foregroundStyle(CatoTheme.ink)
                                .lineLimit(1)
                        }
                        Text(result.applicant.displaySubtitle.isEmpty ? "Profile details pending" : result.applicant.displaySubtitle)
                            .font(.caption)
                            .foregroundStyle(CatoTheme.muted)
                            .lineLimit(2)
                    }

                    Spacer()

                    MatchScoreBadge(score: result.score.totalScore)
                }

                if let componentScores = result.score.componentScores {
                    HStack(spacing: 8) {
                        RuntimeScorePill(label: "Relevance", value: componentScores.bm25)
                        RuntimeScorePill(label: "Profile", value: componentScores.profileStrength)
                        RuntimeScorePill(label: "Projects", value: componentScores.projects)
                    }
                }

                if !result.score.reasons.isEmpty {
                    VStack(alignment: .leading, spacing: 5) {
                        ForEach(result.score.reasons.prefix(3), id: \.self) { reason in
                            Label(reason, systemImage: "checkmark.circle.fill")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(CatoTheme.muted)
                                .lineLimit(2)
                        }
                    }
                }

                if !result.score.blockers.isEmpty {
                    Label(result.score.blockers.prefix(2).joined(separator: " • "), systemImage: "exclamationmark.triangle.fill")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.orange)
                        .lineLimit(2)
                }

                HStack {
                    Text("Review candidate")
                        .font(.caption.weight(.heavy))
                        .foregroundStyle(CatoTheme.purple)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.caption.weight(.bold))
                        .foregroundStyle(CatoTheme.muted)
                }
            }
        }
    }
}

private struct RuntimeScorePill: View {
    let label: String
    let value: Double

    var body: some View {
        VStack(spacing: 2) {
            Text("\(Int(value.rounded()))")
                .font(.caption.weight(.heavy))
                .foregroundStyle(CatoTheme.ink)
            Text(label)
                .font(.caption2.weight(.semibold))
                .foregroundStyle(CatoTheme.muted)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(CatoTheme.background)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(CatoTheme.border, lineWidth: 1))
    }
}

private struct SelectedOptionChip: View {
    let label: String
    let onRemove: () -> Void

    var body: some View {
        HStack(spacing: 6) {
            Text(label)
            Button(action: onRemove) {
                Image(systemName: "xmark")
            }
        }
        .font(.caption.weight(.bold))
        .foregroundStyle(.white)
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .background(CatoTheme.purple)
        .clipShape(Capsule())
    }
}

private struct FlowWrap<Item: Identifiable, Content: View>: View {
    let items: [Item]
    let content: (Item) -> Content

    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 96), spacing: 8)], alignment: .leading, spacing: 8) {
            ForEach(items) { item in
                content(item)
            }
        }
    }
}

private extension Array where Element == MatchingOption {
    mutating func appendUnique(_ option: MatchingOption) {
        guard !containsOption(option) else { return }
        append(option)
    }

    mutating func appendUnique(_ option: MatchingOption, max: Int) {
        guard count < max || containsOption(option) else { return }
        appendUnique(option)
    }

    func containsOption(_ option: MatchingOption) -> Bool {
        contains { $0.type == option.type && $0.key == option.key }
    }

    func sortedByLabel() -> [MatchingOption] {
        sorted { left, right in
            left.label.localizedCaseInsensitiveCompare(right.label) == .orderedAscending
        }
    }
}
