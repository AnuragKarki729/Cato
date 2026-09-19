import SwiftUI
import PhotosUI
import AVFoundation
import AVKit
import UIKit
import UniformTypeIdentifiers
import CatoNativeCore

struct ApplicantProfileView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var profile: ApplicantProfileResponse?
    @State private var reels: [ApplicantReelVideo] = []
    @State private var searchProfile: ApplicantSearchProfile?
    @State private var resumeResponse: ApplicantResumeResponse?
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var isShowingProjectsManager = false
    @State private var isShowingInternshipsManager = false
    @State private var isShowingRecruiterPreview = false
    @State private var isShowingResumeUpload = false
    @State private var isShowingShortTakeUpload = false
    @State private var isShowingDeeperSignalUpload = false

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    CatoLoadingView(message: "Loading profile")
                } else if let errorMessage {
                    ApplicantErrorView(message: errorMessage) {
                        Task { await loadProfile() }
                    }
                } else if let profile {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 16) {
                            identityCard(profile)
                            readinessCard(profile)
                            if shouldPrioritizeManualMatching {
                                ApplicantSearchProfileEditorView(showHeader: false) { savedProfile in
                                    searchProfile = savedProfile
                                }
                            }
                            reelsCard(reels)
                            if !shouldPrioritizeManualMatching {
                                ApplicantSearchProfileEditorView(showHeader: false) { savedProfile in
                                    searchProfile = savedProfile
                                }
                            }
                            softSkillsCard(profile.softSkills?.items ?? [])
                            projectsCard(profile.projects)
                            internshipsCard(profile.internships)
                        }
                        .padding(CatoTheme.screenPadding)
                    }
                }
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
            .background(CatoTheme.background.ignoresSafeArea())
            .task {
                await loadProfile()
            }
            .sheet(isPresented: $isShowingProjectsManager) {
                if let profile {
                    ApplicantProjectsManagerSheet(projects: profile.projects) {
                        Task { await loadProfile() }
                    }
                }
            }
            .sheet(isPresented: $isShowingInternshipsManager) {
                if let profile {
                    ApplicantInternshipsManagerSheet(internships: profile.internships) {
                        Task { await loadProfile() }
                    }
                }
            }
            .sheet(isPresented: $isShowingRecruiterPreview) {
                if let profile {
                    ApplicantRecruiterPreviewSheet(
                        profile: profile,
                        reelsCount: reels.count,
                        onAddResume: {
                            openFollowUpSheet { isShowingResumeUpload = true }
                        },
                        onAddShortTake: {
                            openFollowUpSheet { isShowingShortTakeUpload = true }
                        },
                        onAddDeeperSignal: {
                            openFollowUpSheet { isShowingDeeperSignalUpload = true }
                        },
                        onAddProject: {
                            openFollowUpSheet { isShowingProjectsManager = true }
                        },
                        onAddInternship: {
                            openFollowUpSheet { isShowingInternshipsManager = true }
                        }
                    )
                }
            }
            .sheet(isPresented: $isShowingResumeUpload) {
                ApplicantResumeUploadOnboardingStep {
                    isShowingResumeUpload = false
                    Task { await loadProfile() }
                }
            }
            .sheet(isPresented: $isShowingShortTakeUpload) {
                ShortTakeUploadOnboardingStep {
                    isShowingShortTakeUpload = false
                    Task { await loadProfile() }
                }
            }
            .sheet(isPresented: $isShowingDeeperSignalUpload) {
                DeeperSignalVideoUploadOnboardingStep(
                    onSkip: {
                        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }
                        try await apiClient.skipApplicantDeeperVideo(accessToken: accessToken)
                    },
                    onCompleted: {
                        isShowingDeeperSignalUpload = false
                        Task { await loadProfile() }
                    }
                )
            }
        }
    }

    private func identityCard(_ profile: ApplicantProfileResponse) -> some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 12) {
                    CandidateAvatar(name: profile.applicant.displayName, size: 54)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(profile.applicant.displayName)
                            .font(.title3.weight(.bold))
                        Text(profile.applicant.email)
                            .font(.subheadline)
                            .foregroundStyle(CatoTheme.muted)
                    }
                    Spacer()
                }

                if let education = profile.education {
                    Divider()
                    VStack(alignment: .leading, spacing: 6) {
                        Text(education.universityName)
                            .font(.headline.weight(.bold))
                        Text([education.major, education.semesterLabel].compactMap { $0 }.joined(separator: " • "))
                            .font(.subheadline)
                            .foregroundStyle(CatoTheme.muted)
                        if let gpa = education.gpa {
                            Text("GPA \(String(format: "%.2f", gpa))")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(CatoTheme.purple)
                        }
                    }
                }
            }
        }
    }

    private func readinessCard(_ profile: ApplicantProfileResponse) -> some View {
        Button {
            isShowingRecruiterPreview = true
        } label: {
            CatoCard {
                VStack(alignment: .leading, spacing: 14) {
                    HStack {
                        ApplicantSectionHeader(title: "Recruiter preview", subtitle: "\(profile.profileStrength)%")
                        Image(systemName: "chevron.right")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(CatoTheme.muted)
                    }
                    ProgressView(value: Double(profile.profileStrength), total: 100)
                        .tint(CatoTheme.purple)

                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                        ReadinessItem(title: "Resume", icon: "doc.text.fill", isDone: profile.resume?.secureUrl?.isEmpty == false || profile.resume?.previewUrl?.isEmpty == false)
                        ReadinessItem(title: "Short take", icon: "play.rectangle.fill", isDone: profile.signal?.tenSecondVideo != nil)
                        ReadinessItem(title: "Deeper signal", icon: "video.fill", isDone: profile.signal?.thirtySecondVideo != nil)
                        ReadinessItem(title: "Soft skills", icon: "sparkles", isDone: profile.softSkills?.items.isEmpty == false)
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }

    private func reelsCard(_ reels: [ApplicantReelVideo]) -> some View {
        NavigationLink {
            ApplicantReelsView()
        } label: {
            CatoCard {
                VStack(alignment: .leading, spacing: 14) {
                    ApplicantSectionHeader(title: "Profile reels", subtitle: "\(reels.count)/9")

                    if reels.isEmpty {
                        HStack(spacing: 12) {
                            Image(systemName: "play.rectangle.stack.fill")
                                .font(.title3)
                                .foregroundStyle(CatoTheme.purple)
                                .frame(width: 42, height: 42)
                                .background(CatoTheme.purpleSoft)
                                .clipShape(Circle())
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Add proof videos linked to your work.")
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(CatoTheme.ink)
                                Text("Each reel must connect to a project, internship, or accomplishment.")
                                    .font(.caption)
                                    .foregroundStyle(CatoTheme.muted)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption.weight(.bold))
                                .foregroundStyle(CatoTheme.muted)
                        }
                    } else {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 10) {
                                ForEach(reels.prefix(6)) { reel in
                                    ReelThumbnailCard(reel: reel)
                                }
                            }
                        }
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }

    private func softSkillsCard(_ skills: [ApplicantSoftSkill]) -> some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                ApplicantSectionHeader(title: "Soft skills", subtitle: "\(skills.count)")
                if skills.isEmpty {
                    Text("Soft skills will appear after your signal profile is complete.")
                        .font(.subheadline)
                        .foregroundStyle(CatoTheme.muted)
                } else {
                    ForEach(skills.prefix(4)) { skill in
                        VStack(alignment: .leading, spacing: 5) {
                            HStack {
                                Text(skill.label)
                                    .font(.subheadline.weight(.bold))
                                Spacer()
                                Text(String(format: "%.1f", skill.rating))
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(CatoTheme.purple)
                            }
                            Text(skill.evidence)
                                .font(.caption)
                                .foregroundStyle(CatoTheme.muted)
                        }
                        if skill.id != skills.prefix(4).last?.id {
                            Divider()
                        }
                    }
                }
            }
        }
    }

    private func projectsCard(_ projects: [ApplicantProject]) -> some View {
        Button {
            isShowingProjectsManager = true
        } label: {
            CatoCard {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        ApplicantSectionHeader(title: "What I built", subtitle: "\(projects.count)")
                        Image(systemName: "chevron.right")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(CatoTheme.muted)
                    }
                    if projects.isEmpty {
                        Text("Projects can help recruiters understand proof beyond internships. Tap to add one.")
                            .font(.subheadline)
                            .foregroundStyle(CatoTheme.muted)
                    } else {
                        ForEach(projects.prefix(3)) { project in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(project.title)
                                    .font(.subheadline.weight(.bold))
                                Text(project.description)
                                    .font(.caption)
                                    .foregroundStyle(CatoTheme.muted)
                                    .lineLimit(2)
                            }
                        }
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }

    private func internshipsCard(_ internships: [ApplicantInternship]) -> some View {
        Button {
            isShowingInternshipsManager = true
        } label: {
            CatoCard {
                VStack(alignment: .leading, spacing: 12) {
                    HStack {
                        ApplicantSectionHeader(title: "Internships", subtitle: "\(internships.count)")
                        Image(systemName: "chevron.right")
                            .font(.caption.weight(.bold))
                            .foregroundStyle(CatoTheme.muted)
                    }
                    if internships.isEmpty {
                        Text("Internships are optional; your resume, signal, and projects still carry most profile strength. Tap to add one.")
                            .font(.subheadline)
                            .foregroundStyle(CatoTheme.muted)
                    } else {
                        ForEach(internships.prefix(3)) { internship in
                            HStack {
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(internship.company)
                                        .font(.subheadline.weight(.bold))
                                    Text(internship.roleDepartment)
                                        .font(.caption)
                                        .foregroundStyle(CatoTheme.muted)
                                }
                                Spacer()
                                Text("\(internship.durationMonths)m")
                                    .font(.caption.weight(.bold))
                                    .foregroundStyle(CatoTheme.purple)
                            }
                        }
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }

    private var shouldPrioritizeManualMatching: Bool {
        searchProfile == nil && resumeResponse?.parseStatus != .ready
    }

    private func loadProfile() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to load profile."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            async let profileResponse = apiClient.getApplicantProfile(accessToken: accessToken)
            async let reelsResponse = apiClient.getApplicantReels(accessToken: accessToken)
            async let searchProfileResponse = apiClient.getApplicantSearchProfile(accessToken: accessToken)
            async let resumeRequest = apiClient.getApplicantResume(accessToken: accessToken)
            profile = try await profileResponse
            reels = try await reelsResponse.videos
            searchProfile = try await searchProfileResponse.profile
            resumeResponse = try await resumeRequest
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    private func openFollowUpSheet(_ open: @escaping () -> Void) {
        isShowingRecruiterPreview = false
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            open()
        }
    }
}

private struct ApplicantRecruiterPreviewSheet: View {
    @Environment(\.dismiss) private var dismiss
    let profile: ApplicantProfileResponse
    let reelsCount: Int
    let onAddResume: () -> Void
    let onAddShortTake: () -> Void
    let onAddDeeperSignal: () -> Void
    let onAddProject: () -> Void
    let onAddInternship: () -> Void

    private var hasResume: Bool {
        profile.resume?.secureUrl?.isEmpty == false || profile.resume?.previewUrl?.isEmpty == false
    }

    private var hasShortTake: Bool {
        profile.signal?.tenSecondVideo != nil
    }

    private var hasDeeperSignal: Bool {
        profile.signal?.thirtySecondVideo != nil
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    previewHeader
                    recruiterVisibleSections
                    missingActions
                }
                .padding(CatoTheme.screenPadding)
            }
            .background(CatoTheme.background.ignoresSafeArea())
            .navigationTitle("Recruiter preview")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    private var previewHeader: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 12) {
                    CandidateAvatar(name: profile.applicant.displayName, size: 58)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(profile.applicant.displayName)
                            .font(.title3.weight(.bold))
                        Text(profile.education?.summary ?? profile.applicant.email)
                            .font(.subheadline)
                            .foregroundStyle(CatoTheme.muted)
                            .lineLimit(2)
                    }
                    Spacer()
                    VStack(spacing: 2) {
                        Text("\(profile.profileStrength)%")
                            .font(.title3.weight(.bold))
                            .foregroundStyle(CatoTheme.purple)
                        Text("profile")
                            .font(.caption2.weight(.bold))
                            .foregroundStyle(CatoTheme.muted)
                    }
                }

                ProgressView(value: Double(profile.profileStrength), total: 100)
                    .tint(CatoTheme.purple)
            }
        }
    }

    private var recruiterVisibleSections: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                ApplicantSectionHeader(title: "Visible to recruiters", subtitle: "Current")
                RecruiterPreviewRow(title: "Intro short take", value: hasShortTake ? "Visible" : "Missing", isReady: hasShortTake)
                RecruiterPreviewRow(title: "Deeper signal", value: hasDeeperSignal ? "Visible" : "Missing", isReady: hasDeeperSignal)
                RecruiterPreviewRow(title: "Resume", value: hasResume ? (profile.resume?.originalFileName ?? "Uploaded") : "Missing", isReady: hasResume)
                RecruiterPreviewRow(title: "Projects", value: "\(profile.projects.count)", isReady: !profile.projects.isEmpty)
                RecruiterPreviewRow(title: "Internships", value: "\(profile.internships.count)", isReady: !profile.internships.isEmpty)
                RecruiterPreviewRow(title: "Profile reels", value: "\(reelsCount)/9", isReady: reelsCount > 0)
            }
        }
    }

    private var missingActions: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                ApplicantSectionHeader(title: "Improve this profile", subtitle: "Actions")

                if !hasResume {
                    RecruiterPreviewActionRow(title: "Add a resume", subtitle: "Recruiters can open your PDF from your profile.", icon: "doc.badge.plus", action: onAddResume)
                }
                if !hasShortTake {
                    RecruiterPreviewActionRow(title: "Add short take", subtitle: "This is the first video recruiters see.", icon: "play.rectangle.fill", action: onAddShortTake)
                }
                if !hasDeeperSignal {
                    RecruiterPreviewActionRow(title: "Add deeper signal", subtitle: "Optional, but useful for stronger profile evidence.", icon: "video.badge.plus", action: onAddDeeperSignal)
                }
                if profile.projects.isEmpty {
                    RecruiterPreviewActionRow(title: "Add a project", subtitle: "Projects carry strong profile weight.", icon: "hammer.fill", action: onAddProject)
                }
                if profile.internships.isEmpty {
                    RecruiterPreviewActionRow(title: "Add internship", subtitle: "Optional, but visible when you have one.", icon: "briefcase.fill", action: onAddInternship)
                }

                if hasResume && hasShortTake && hasDeeperSignal && !profile.projects.isEmpty {
                    Text("Your core recruiter profile is in good shape. You can still add reels, projects, and internships over time.")
                        .font(.subheadline)
                        .foregroundStyle(CatoTheme.muted)
                }
            }
        }
    }
}

private struct RecruiterPreviewRow: View {
    let title: String
    let value: String
    let isReady: Bool

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: isReady ? "checkmark.circle.fill" : "plus.circle.fill")
                .foregroundStyle(isReady ? .green : CatoTheme.purple)
            Text(title)
                .font(.subheadline.weight(.semibold))
            Spacer()
            Text(value)
                .font(.caption.weight(.bold))
                .foregroundStyle(isReady ? CatoTheme.ink : CatoTheme.muted)
                .lineLimit(1)
        }
    }
}

private struct RecruiterPreviewActionRow: View {
    let title: String
    let subtitle: String
    let icon: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: icon)
                    .font(.headline)
                    .foregroundStyle(CatoTheme.purple)
                    .frame(width: 36, height: 36)
                    .background(CatoTheme.purpleSoft)
                    .clipShape(Circle())
                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.subheadline.weight(.bold))
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(CatoTheme.muted)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(CatoTheme.muted)
            }
            .foregroundStyle(CatoTheme.ink)
            .padding(.vertical, 4)
        }
        .buttonStyle(.plain)
    }
}

private struct ApplicantProjectsManagerSheet: View {
    @EnvironmentObject private var auth: AuthViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var projects: [ApplicantProject]
    @State private var editingProject: ApplicantProject?
    @State private var title = ""
    @State private var type = "built_project"
    @State private var description = ""
    @State private var linkUrl = ""
    @State private var isSaving = false
    @State private var errorMessage: String?
    let onChanged: () -> Void

    private let projectTypes = [
        ("built_project", "Built project"),
        ("research", "Research"),
        ("thesis", "Thesis"),
        ("video", "Video"),
        ("writing", "Writing"),
        ("other", "Other")
    ]

    init(projects: [ApplicantProject], onChanged: @escaping () -> Void) {
        _projects = State(initialValue: projects)
        self.onChanged = onChanged
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if let errorMessage {
                        ApplicantInlineError(message: errorMessage)
                    }

                    editorCard

                    CatoCard {
                        VStack(alignment: .leading, spacing: 12) {
                            ApplicantSectionHeader(title: "Projects", subtitle: "\(projects.count)")
                            if projects.isEmpty {
                                Text("Add projects, research, thesis work, writing, or portfolio work recruiters should see.")
                                    .font(.subheadline)
                                    .foregroundStyle(CatoTheme.muted)
                            } else {
                                ForEach(projects) { project in
                                    projectRow(project)
                                    if project.id != projects.last?.id {
                                        Divider()
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(CatoTheme.screenPadding)
            }
            .background(CatoTheme.background.ignoresSafeArea())
            .navigationTitle("What I built")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    private var editorCard: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                ApplicantSectionHeader(title: editingProject == nil ? "Add project" : "Edit project", subtitle: "")
                TextField("Project title", text: $title)
                    .textFieldStyle(.roundedBorder)
                Picker("Type", selection: $type) {
                    ForEach(projectTypes, id: \.0) { value, label in
                        Text(label).tag(value)
                    }
                }
                .pickerStyle(.menu)
                TextField("Description", text: $description, axis: .vertical)
                    .lineLimit(3...6)
                    .textFieldStyle(.roundedBorder)
                TextField("Link, if any", text: $linkUrl)
                    .textInputAutocapitalization(.never)
                    .keyboardType(.URL)
                    .textFieldStyle(.roundedBorder)

                HStack {
                    if editingProject != nil {
                        Button("Cancel") {
                            resetForm()
                        }
                        .buttonStyle(CatoSecondaryButtonStyle())
                    }
                    Button(isSaving ? "Saving..." : editingProject == nil ? "Add project" : "Save changes") {
                        Task { await saveProject() }
                    }
                    .buttonStyle(CatoPrimaryButtonStyle())
                    .disabled(isSaving || title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || description.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }

    private func projectRow(_ project: ApplicantProject) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(project.title)
                        .font(.subheadline.weight(.bold))
                    Text(project.type.replacingOccurrences(of: "_", with: " ").capitalized)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(CatoTheme.purple)
                    Text(project.description)
                        .font(.caption)
                        .foregroundStyle(CatoTheme.muted)
                }
                Spacer()
                Menu {
                    Button("Edit") { startEditing(project) }
                    Button("Delete", role: .destructive) {
                        Task { await deleteProject(project) }
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                        .font(.title3)
                        .foregroundStyle(CatoTheme.purple)
                }
            }
            if let linkUrl = project.linkUrl, !linkUrl.isEmpty {
                Text(linkUrl)
                    .font(.caption2)
                    .foregroundStyle(CatoTheme.muted)
                    .lineLimit(1)
            }
        }
        .padding(.vertical, 4)
    }

    private func startEditing(_ project: ApplicantProject) {
        editingProject = project
        title = project.title
        type = project.type
        description = project.description
        linkUrl = project.linkUrl ?? ""
    }

    private func resetForm() {
        editingProject = nil
        title = ""
        type = "built_project"
        description = ""
        linkUrl = ""
        errorMessage = nil
    }

    private func saveProject() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to manage projects."
            return
        }

        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        do {
            let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
            let trimmedDescription = description.trimmingCharacters(in: .whitespacesAndNewlines)
            let trimmedLink = linkUrl.trimmingCharacters(in: .whitespacesAndNewlines)
            let saved: ApplicantProject
            if let editingProject {
                saved = try await apiClient.updateApplicantProject(
                    accessToken: accessToken,
                    projectId: editingProject.id,
                    title: trimmedTitle,
                    type: type,
                    description: trimmedDescription,
                    linkUrl: trimmedLink
                )
                if let index = projects.firstIndex(where: { $0.id == editingProject.id }) {
                    projects[index] = saved
                }
            } else {
                saved = try await apiClient.createApplicantProject(
                    accessToken: accessToken,
                    title: trimmedTitle,
                    type: type,
                    description: trimmedDescription,
                    linkUrl: trimmedLink
                )
                projects.insert(saved, at: 0)
            }
            resetForm()
            onChanged()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func deleteProject(_ project: ApplicantProject) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to manage projects."
            return
        }

        do {
            try await apiClient.deleteApplicantProject(accessToken: accessToken, projectId: project.id)
            projects.removeAll { $0.id == project.id }
            if editingProject?.id == project.id {
                resetForm()
            }
            onChanged()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct ApplicantInlineError: View {
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
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.orange.opacity(0.24), lineWidth: 1)
        )
    }
}

private struct ApplicantInternshipsManagerSheet: View {
    @EnvironmentObject private var auth: AuthViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var internships: [ApplicantInternship]
    @State private var editingInternship: ApplicantInternship?
    @State private var company = ""
    @State private var roleDepartment = "Engineering"
    @State private var durationMonths = ""
    @State private var isSaving = false
    @State private var errorMessage: String?
    let onChanged: () -> Void

    private let roleDepartments = [
        "Engineering", "Product", "Design", "Marketing", "Sales", "Finance",
        "Operations", "Data", "Research", "HR", "Legal", "Customer Success", "Other"
    ]

    init(internships: [ApplicantInternship], onChanged: @escaping () -> Void) {
        _internships = State(initialValue: internships)
        self.onChanged = onChanged
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if let errorMessage {
                        ApplicantInlineError(message: errorMessage)
                    }

                    editorCard

                    CatoCard {
                        VStack(alignment: .leading, spacing: 12) {
                            ApplicantSectionHeader(title: "Internships", subtitle: "\(internships.count)")
                            if internships.isEmpty {
                                Text("Internships are optional. Add them when they help describe the kind of work you have done.")
                                    .font(.subheadline)
                                    .foregroundStyle(CatoTheme.muted)
                            } else {
                                ForEach(internships) { internship in
                                    internshipRow(internship)
                                    if internship.id != internships.last?.id {
                                        Divider()
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(CatoTheme.screenPadding)
            }
            .background(CatoTheme.background.ignoresSafeArea())
            .navigationTitle("Internships")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    private var editorCard: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                ApplicantSectionHeader(title: editingInternship == nil ? "Add internship" : "Edit internship", subtitle: "")
                TextField("Company", text: $company)
                    .textFieldStyle(.roundedBorder)
                Picker("Role / department", selection: $roleDepartment) {
                    ForEach(roleDepartments, id: \.self) { role in
                        Text(role).tag(role)
                    }
                }
                .pickerStyle(.menu)
                TextField("Duration in months", text: $durationMonths)
                    .keyboardType(.numberPad)
                    .textFieldStyle(.roundedBorder)

                HStack {
                    if editingInternship != nil {
                        Button("Cancel") {
                            resetForm()
                        }
                        .buttonStyle(CatoSecondaryButtonStyle())
                    }
                    Button(isSaving ? "Saving..." : editingInternship == nil ? "Add internship" : "Save changes") {
                        Task { await saveInternship() }
                    }
                    .buttonStyle(CatoPrimaryButtonStyle())
                    .disabled(isSaving || company.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || Int(durationMonths) == nil)
                }
            }
        }
    }

    private func internshipRow(_ internship: ApplicantInternship) -> some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text(internship.company)
                    .font(.subheadline.weight(.bold))
                Text(internship.roleDepartment)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(CatoTheme.purple)
                Text("\(internship.durationMonths) month\(internship.durationMonths == 1 ? "" : "s")")
                    .font(.caption)
                    .foregroundStyle(CatoTheme.muted)
            }
            Spacer()
            Menu {
                Button("Edit") { startEditing(internship) }
                Button("Delete", role: .destructive) {
                    Task { await deleteInternship(internship) }
                }
            } label: {
                Image(systemName: "ellipsis.circle")
                    .font(.title3)
                    .foregroundStyle(CatoTheme.purple)
            }
        }
        .padding(.vertical, 4)
    }

    private func startEditing(_ internship: ApplicantInternship) {
        editingInternship = internship
        company = internship.company
        roleDepartment = internship.roleDepartment
        durationMonths = "\(internship.durationMonths)"
    }

    private func resetForm() {
        editingInternship = nil
        company = ""
        roleDepartment = "Engineering"
        durationMonths = ""
        errorMessage = nil
    }

    private func saveInternship() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to manage internships."
            return
        }
        guard let duration = Int(durationMonths), duration > 0 else {
            errorMessage = "Enter duration in months."
            return
        }

        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        do {
            let trimmedCompany = company.trimmingCharacters(in: .whitespacesAndNewlines)
            let saved: ApplicantInternship
            if let editingInternship {
                saved = try await apiClient.updateApplicantInternship(
                    accessToken: accessToken,
                    internshipId: editingInternship.id,
                    company: trimmedCompany,
                    roleDepartment: roleDepartment,
                    durationMonths: duration
                )
                if let index = internships.firstIndex(where: { $0.id == editingInternship.id }) {
                    internships[index] = saved
                }
            } else {
                saved = try await apiClient.createApplicantInternship(
                    accessToken: accessToken,
                    company: trimmedCompany,
                    roleDepartment: roleDepartment,
                    durationMonths: duration
                )
                internships.insert(saved, at: 0)
            }
            resetForm()
            onChanged()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func deleteInternship(_ internship: ApplicantInternship) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to manage internships."
            return
        }

        do {
            try await apiClient.deleteApplicantInternship(accessToken: accessToken, internshipId: internship.id)
            internships.removeAll { $0.id == internship.id }
            if editingInternship?.id == internship.id {
                resetForm()
            }
            onChanged()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct ReelThumbnailCard: View {
    let reel: ApplicantReelVideo

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            AsyncImage(url: URL(string: reel.thumbnailUrl)) { image in
                image
                    .resizable()
                    .scaledToFill()
            } placeholder: {
                Rectangle()
                    .fill(CatoTheme.purpleSoft)
                    .overlay(Image(systemName: "play.fill").foregroundStyle(CatoTheme.purple))
            }
            .frame(width: 108, height: 150)
            .clipped()

            LinearGradient(colors: [.clear, .black.opacity(0.65)], startPoint: .top, endPoint: .bottom)
                .frame(height: 70)

            VStack(alignment: .leading, spacing: 3) {
                if let caption = reel.caption, !caption.isEmpty {
                    Text(caption)
                        .font(.caption.weight(.bold))
                        .foregroundStyle(.white)
                        .lineLimit(2)
                }
                Text("\(reel.likeCount) likes")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.8))
            }
            .padding(8)
        }
        .frame(width: 108, height: 150)
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

private struct ApplicantReelProfileStat: View {
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.headline.weight(.heavy))
                .foregroundStyle(CatoTheme.ink)
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(CatoTheme.muted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(CatoTheme.card)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(CatoTheme.border, lineWidth: 1))
    }
}

private struct ApplicantReelGridThumbnail: View {
    let reel: ApplicantReelVideo

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            AsyncImage(url: URL(string: reel.thumbnailUrl)) { image in
                image
                    .resizable()
                    .scaledToFill()
            } placeholder: {
                Rectangle()
                    .fill(CatoTheme.purpleSoft)
                    .overlay(
                        Image(systemName: "play.fill")
                            .font(.title3)
                            .foregroundStyle(CatoTheme.purple)
                    )
            }
            .aspectRatio(9 / 16, contentMode: .fill)
            .clipped()

            LinearGradient(colors: [.clear, .black.opacity(0.68)], startPoint: .top, endPoint: .bottom)

            HStack(spacing: 4) {
                Image(systemName: "play.fill")
                Text("\(reel.viewCount)")
            }
            .font(.caption2.weight(.heavy))
            .foregroundStyle(.white)
            .padding(7)
        }
        .aspectRatio(9 / 16, contentMode: .fit)
        .clipShape(Rectangle())
        .accessibilityLabel(reel.caption?.isEmpty == false ? reel.caption! : "Profile reel")
    }
}

private struct ApplicantReelPlaybackSheet: View {
    let reel: ApplicantReelVideo
    let onSaveCaption: (String) -> Void
    let onDelete: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var captionDraft: String
    @State private var isEditingCaption = false
    @State private var player: AVPlayer?

    init(
        reel: ApplicantReelVideo,
        onSaveCaption: @escaping (String) -> Void,
        onDelete: @escaping () -> Void
    ) {
        self.reel = reel
        self.onSaveCaption = onSaveCaption
        self.onDelete = onDelete
        _captionDraft = State(initialValue: reel.caption ?? "")
    }

    private var videoURL: URL? {
        URL(string: reel.optimizedVideoUrl.isEmpty ? reel.videoUrl : reel.optimizedVideoUrl)
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    ZStack {
                        if let player {
                            VideoPlayer(player: player)
                        } else {
                            Rectangle()
                                .fill(Color.black)
                                .overlay(
                                    Label("Video unavailable", systemImage: "exclamationmark.triangle.fill")
                                        .font(.subheadline.weight(.bold))
                                        .foregroundStyle(.white)
                                )
                        }
                    }
                    .aspectRatio(9 / 16, contentMode: .fit)
                    .frame(maxWidth: .infinity)
                    .clipShape(RoundedRectangle(cornerRadius: 18))
                    .background(Color.black)

                    CatoCard {
                        VStack(alignment: .leading, spacing: 12) {
                            HStack {
                                Label("\(reel.viewCount) views", systemImage: "eye.fill")
                                Spacer()
                                Label("\(reel.likeCount) likes", systemImage: "heart.fill")
                            }
                            .font(.caption.weight(.bold))
                            .foregroundStyle(CatoTheme.purple)

                            if isEditingCaption {
                                TextField("Caption (optional)", text: $captionDraft, axis: .vertical)
                                    .lineLimit(2...4)
                                    .textFieldStyle(.roundedBorder)
                                    .onChange(of: captionDraft) { value in
                                        if value.count > 250 {
                                            captionDraft = String(value.prefix(250))
                                        }
                                    }
                                HStack {
                                    Text("\(captionDraft.count)/250")
                                        .font(.caption.weight(.semibold))
                                        .foregroundStyle(CatoTheme.muted)
                                    Spacer()
                                    Button("Cancel") {
                                        captionDraft = reel.caption ?? ""
                                        isEditingCaption = false
                                    }
                                    Button("Save") {
                                        onSaveCaption(captionDraft)
                                        isEditingCaption = false
                                    }
                                    .fontWeight(.bold)
                                }
                            } else {
                                Text(reel.caption?.isEmpty == false ? reel.caption! : "No caption")
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(reel.caption?.isEmpty == false ? CatoTheme.ink : CatoTheme.muted)
                                Button {
                                    isEditingCaption = true
                                } label: {
                                    Label("Edit caption", systemImage: "pencil")
                                }
                                .font(.caption.weight(.bold))
                            }

                            Text("\(reel.links.count) linked evidence item\(reel.links.count == 1 ? "" : "s")")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(CatoTheme.muted)
                        }
                    }

                    Button(role: .destructive) {
                        onDelete()
                        dismiss()
                    } label: {
                        Label("Delete reel", systemImage: "trash")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
                .padding(CatoTheme.screenPadding)
            }
            .background(CatoTheme.background.ignoresSafeArea())
            .navigationTitle("Reel")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .onAppear {
                if let videoURL {
                    player = AVPlayer(url: videoURL)
                    player?.play()
                }
            }
            .onDisappear {
                player?.pause()
                player = nil
            }
        }
    }
}

struct ApplicantReelsView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var profile: ApplicantProfileResponse?
    @State private var reels: [ApplicantReelVideo] = []
    @State private var accomplishments: [ApplicantAccomplishment] = []
    @State private var selectedItem: PhotosPickerItem?
    @State private var selectedVideo: LocalApplicantVideo?
    @State private var caption = ""
    @State private var selectedLinks = Set<ApplicantVideoEvidenceLink>()
    @State private var expandedEvidenceType: ReelEvidenceType = .project
    @State private var newAccomplishmentTitle = ""
    @State private var newAccomplishmentDescription = ""
    @State private var newAccomplishmentLink = ""
    @State private var newProjectTitle = ""
    @State private var newProjectType = "built_project"
    @State private var newProjectDescription = ""
    @State private var newProjectLink = ""
    @State private var newInternshipCompany = ""
    @State private var newInternshipRoleDepartment = "Engineering"
    @State private var newInternshipDurationMonths = ""
    @State private var editingReelId: String?
    @State private var editingCaption = ""
    @State private var isShowingPublishWizard = false
    @State private var isShowingCamera = false
    @State private var selectedReel: ApplicantReelVideo?
    @State private var isLoading = true
    @State private var isReadingVideo = false
    @State private var isUploading = false
    @State private var isCreatingAccomplishment = false
    @State private var isCreatingProject = false
    @State private var isCreatingInternship = false
    @State private var errorMessage: String?
    @State private var successMessage: String?

    private let reelLimit = 9

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                headerCard
                publishEntryCard
                existingReelsCard
            }
            .padding(CatoTheme.screenPadding)
        }
        .navigationTitle("Profile reels")
        .navigationBarTitleDisplayMode(.inline)
        .background(CatoTheme.background.ignoresSafeArea())
        .task { await load() }
        .sheet(isPresented: $isShowingPublishWizard) {
            publishWizard
        }
        .sheet(item: $selectedReel) { reel in
            ApplicantReelPlaybackSheet(
                reel: reel,
                onSaveCaption: { newCaption in
                    Task { await updateCaption(reel.id, captionValue: newCaption) }
                },
                onDelete: {
                    Task {
                        await deleteReel(reel.id)
                        selectedReel = nil
                    }
                }
            )
        }
    }

    private var headerCard: some View {
        VStack(spacing: 16) {
            if let profile {
                VStack(spacing: 12) {
                    CandidateAvatar(name: profile.applicant.displayName, size: 82)
                    VStack(spacing: 4) {
                        Text(profile.applicant.displayName)
                            .font(.title2.weight(.heavy))
                            .foregroundStyle(CatoTheme.ink)
                        Text(profile.education?.summary ?? profile.applicant.email)
                            .font(.subheadline)
                            .foregroundStyle(CatoTheme.muted)
                            .multilineTextAlignment(.center)
                            .lineLimit(2)
                    }
                }
                .frame(maxWidth: .infinity)
            }

            HStack(spacing: 10) {
                ApplicantReelProfileStat(value: "\(reels.count)", label: "Reels")
                ApplicantReelProfileStat(value: "\(totalViews)", label: "Views")
                ApplicantReelProfileStat(value: "\(totalLikes)", label: "Likes")
            }

            Text("Reels are proof videos linked to projects, internships, or accomplishments.")
                .font(.caption.weight(.semibold))
                .foregroundStyle(CatoTheme.muted)
                .multilineTextAlignment(.center)
                .frame(maxWidth: .infinity)
        }
        .padding(.top, 8)
    }

    private var publishEntryCard: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                ApplicantSectionHeader(title: "Create reel", subtitle: "Post flow")
                Text("Choose a video, add an optional caption, then connect it to the project, internship, or accomplishment it proves. Nothing uploads until you publish.")
                    .font(.subheadline)
                    .foregroundStyle(CatoTheme.muted)
                Button {
                    resetDraft()
                    isShowingPublishWizard = true
                } label: {
                    Label("Start reel post", systemImage: "plus.rectangle.on.rectangle")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(CatoPrimaryButtonStyle())
                .disabled(reels.count >= reelLimit)

                if reels.count >= reelLimit {
                    Text("You have reached the 9 reel limit.")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(CatoTheme.muted)
                }
            }
        }
    }

    private var publishWizard: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        uploadCard
                        evidenceCard
                    }
                    .padding(CatoTheme.screenPadding)
                    .padding(.bottom, canUpload ? 92 : 18)
                }
                if canUpload {
                    floatingPublishButton
                        .padding(.horizontal, CatoTheme.screenPadding)
                        .padding(.bottom, 14)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
            .animation(.easeInOut(duration: 0.18), value: canUpload)
            .background(CatoTheme.background.ignoresSafeArea())
            .navigationTitle("Publish reel")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") {
                        isShowingPublishWizard = false
                    }
                }
            }
            .sheet(isPresented: $isShowingCamera) {
                ApplicantReelCameraRecorder(maxDurationSeconds: 60) { url in
                    Task { await loadRecordedVideo(url) }
                }
                .ignoresSafeArea()
            }
        }
    }

    private var uploadCard: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                ApplicantSectionHeader(title: "Video and caption", subtitle: "Max 60s")

                HStack(spacing: 10) {
                    Button {
                        isShowingCamera = true
                    } label: {
                        Label("Record", systemImage: "video.fill")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(CatoSecondaryButtonStyle())
                    .disabled(isReadingVideo || isUploading || reels.count >= reelLimit)

                    PhotosPicker(selection: $selectedItem, matching: .videos, photoLibrary: .shared()) {
                        Label(selectedVideo == nil ? "Choose" : "Replace", systemImage: "photo.on.rectangle")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(CatoSecondaryButtonStyle())
                    .disabled(isReadingVideo || isUploading || reels.count >= reelLimit)
                    .onChange(of: selectedItem) { item in
                        Task { await loadSelectedVideo(item) }
                    }
                }

                if isReadingVideo {
                    Label("Reading video", systemImage: "hourglass")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(CatoTheme.muted)
                }

                if let selectedVideo {
                    HStack {
                        Label("\(selectedVideo.durationSeconds, specifier: "%.1f")s selected", systemImage: "checkmark.circle.fill")
                            .font(.subheadline.weight(.bold))
                            .foregroundStyle(CatoTheme.purple)
                        Spacer()
                        if let bytes = selectedVideo.fileSizeBytes {
                            Text(ByteCountFormatter.string(fromByteCount: Int64(bytes), countStyle: .file))
                                .font(.caption)
                                .foregroundStyle(CatoTheme.muted)
                        }
                    }
                }

                TextField("Caption (optional)", text: $caption, axis: .vertical)
                    .lineLimit(2...4)
                    .textFieldStyle(.roundedBorder)
                    .onChange(of: caption) { value in
                        if value.count > 250 {
                            caption = String(value.prefix(250))
                        }
                    }
                Text("\(caption.count)/250")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(caption.count >= 250 ? .orange : CatoTheme.muted)

                ApplicantStepError(errorMessage)

                if let successMessage {
                    Label(successMessage, systemImage: "checkmark.circle.fill")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(CatoTheme.purple)
                }
            }
        }
    }

    private var evidenceCard: some View {
        CatoCard {
            VStack(alignment: .leading, spacing: 12) {
                ApplicantSectionHeader(title: "Linked evidence", subtitle: "\(selectedLinks.count) selected")
                Text("Choose every context this reel supports.")
                    .font(.caption)
                    .foregroundStyle(CatoTheme.muted)

                Picker("Evidence type", selection: $expandedEvidenceType) {
                    ForEach(ReelEvidenceType.allCases) { type in
                        Text(type.title).tag(type)
                    }
                }
                .pickerStyle(.menu)
                .padding(.horizontal, 12)
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(CatoTheme.purpleSoft)
                .clipShape(RoundedRectangle(cornerRadius: 12))

                selectedEvidenceSection

                if selectedLinks.isEmpty {
                    Text("A reel cannot be uploaded without at least one link.")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(CatoTheme.muted)
                }
            }
        }
    }

    @ViewBuilder
    private var selectedEvidenceSection: some View {
        switch expandedEvidenceType {
        case .project:
            if let profile {
                EvidenceChipSection(
                    title: "Projects",
                    items: profile.projects.map { EvidenceChoice(label: $0.title, link: ApplicantVideoEvidenceLink(targetType: "project", targetId: $0.id)) },
                    selectedLinks: $selectedLinks
                )
            }
            createProjectCard
        case .internship:
            if let profile {
                EvidenceChipSection(
                    title: "Internships",
                    items: profile.internships.map { EvidenceChoice(label: "\($0.roleDepartment) at \($0.company)", link: ApplicantVideoEvidenceLink(targetType: "internship", targetId: $0.id)) },
                    selectedLinks: $selectedLinks
                )
            }
            createInternshipCard
        case .accomplishment:
            EvidenceChipSection(
                title: "Accomplishments",
                items: accomplishments.map { EvidenceChoice(label: $0.title, link: ApplicantVideoEvidenceLink(targetType: "accomplishment", targetId: $0.id)) },
                selectedLinks: $selectedLinks
            )
            accomplishmentCard
        }
    }

    private var floatingPublishButton: some View {
        Button {
            Task { await uploadReel() }
        } label: {
            if isUploading {
                ProgressView()
                    .tint(.white)
                    .frame(maxWidth: .infinity)
            } else {
                Label("Publish reel", systemImage: "paperplane.fill")
                    .frame(maxWidth: .infinity)
            }
        }
        .buttonStyle(CatoPrimaryButtonStyle())
        .shadow(color: CatoTheme.purple.opacity(0.22), radius: 16, y: 8)
        .disabled(isUploading)
    }

    private var createProjectCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            ApplicantSectionHeader(title: "Create project", subtitle: "If missing")
            TextField("Project title", text: $newProjectTitle)
                .textFieldStyle(.roundedBorder)
            Picker("Project type", selection: $newProjectType) {
                Text("Built project").tag("built_project")
                Text("Research").tag("research")
                Text("Thesis").tag("thesis")
                Text("Video").tag("video")
                Text("Writing").tag("writing")
                Text("Other").tag("other")
            }
            .pickerStyle(.menu)
            TextField("Description", text: $newProjectDescription, axis: .vertical)
                .lineLimit(2...4)
                .textFieldStyle(.roundedBorder)
            TextField("Link, if any", text: $newProjectLink)
                .keyboardType(.URL)
                .textInputAutocapitalization(.never)
                .textFieldStyle(.roundedBorder)
            Button {
                Task { await createProject() }
            } label: {
                if isCreatingProject {
                    ProgressView().frame(maxWidth: .infinity)
                } else {
                    Label("Save and link project", systemImage: "plus.circle")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(CatoSecondaryButtonStyle())
            .disabled(newProjectTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || newProjectDescription.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isCreatingProject)
        }
    }

    private var createInternshipCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            ApplicantSectionHeader(title: "Create internship", subtitle: "If missing")
            TextField("Company", text: $newInternshipCompany)
                .textFieldStyle(.roundedBorder)
            Picker("Role area", selection: $newInternshipRoleDepartment) {
                ForEach(["Engineering", "Product", "Design", "Marketing", "Sales", "Finance", "Operations", "Data", "Research", "HR", "Legal", "Customer Success", "Other"], id: \.self) { role in
                    Text(role).tag(role)
                }
            }
            .pickerStyle(.menu)
            TextField("Duration in months", text: $newInternshipDurationMonths)
                .keyboardType(.numberPad)
                .textFieldStyle(.roundedBorder)
            Button {
                Task { await createInternship() }
            } label: {
                if isCreatingInternship {
                    ProgressView().frame(maxWidth: .infinity)
                } else {
                    Label("Save and link internship", systemImage: "plus.circle")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(CatoSecondaryButtonStyle())
            .disabled(newInternshipCompany.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || Int(newInternshipDurationMonths) == nil || isCreatingInternship)
        }
    }

    private var accomplishmentCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            ApplicantSectionHeader(title: "Add accomplishment", subtitle: "Optional")
            TextField("Title", text: $newAccomplishmentTitle)
                .textFieldStyle(.roundedBorder)
            TextField("Description", text: $newAccomplishmentDescription, axis: .vertical)
                .lineLimit(2...4)
                .textFieldStyle(.roundedBorder)
            TextField("Link, if any", text: $newAccomplishmentLink)
                .keyboardType(.URL)
                .textInputAutocapitalization(.never)
                .textFieldStyle(.roundedBorder)
            Button {
                Task { await createAccomplishment() }
            } label: {
                if isCreatingAccomplishment {
                    ProgressView().frame(maxWidth: .infinity)
                } else {
                    Label("Save accomplishment", systemImage: "plus.circle")
                        .frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(CatoSecondaryButtonStyle())
            .disabled(newAccomplishmentTitle.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || newAccomplishmentDescription.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isCreatingAccomplishment)
        }
    }

    private var existingReelsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("Reels", systemImage: "film.stack")
                    .font(.headline.weight(.heavy))
                    .foregroundStyle(CatoTheme.ink)
                Spacer()
                Text("\(reels.count)/\(reelLimit)")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(CatoTheme.purple)
            }

            if reels.isEmpty {
                CatoCard {
                    VStack(spacing: 10) {
                        Image(systemName: "play.rectangle.stack.fill")
                            .font(.system(size: 34))
                            .foregroundStyle(CatoTheme.purple)
                        Text("No reels yet")
                            .font(.headline.weight(.bold))
                        Text("Post proof videos here. They will appear as thumbnails on your profile.")
                            .font(.subheadline)
                            .foregroundStyle(CatoTheme.muted)
                            .multilineTextAlignment(.center)
                    }
                    .frame(maxWidth: .infinity)
                }
            } else {
                LazyVGrid(columns: reelGridColumns, spacing: 2) {
                    ForEach(reels) { reel in
                        Button {
                            selectedReel = reel
                        } label: {
                            ApplicantReelGridThumbnail(reel: reel)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private var reelGridColumns: [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: 2), count: 3)
    }

    private var totalViews: Int {
        reels.reduce(0) { $0 + $1.viewCount }
    }

    private var totalLikes: Int {
        reels.reduce(0) { $0 + $1.likeCount }
    }

    private var canUpload: Bool {
        selectedVideo != nil &&
        !selectedLinks.isEmpty &&
        caption.count <= 250 &&
        !isUploading &&
        reels.count < reelLimit
    }

    private func resetDraft() {
        selectedItem = nil
        selectedVideo = nil
        caption = ""
        selectedLinks.removeAll()
        expandedEvidenceType = .project
        newProjectTitle = ""
        newProjectType = "built_project"
        newProjectDescription = ""
        newProjectLink = ""
        newInternshipCompany = ""
        newInternshipRoleDepartment = "Engineering"
        newInternshipDurationMonths = ""
        newAccomplishmentTitle = ""
        newAccomplishmentDescription = ""
        newAccomplishmentLink = ""
        errorMessage = nil
        successMessage = nil
    }

    private func load() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to manage reels."
            isLoading = false
            return
        }

        isLoading = true
        do {
            async let profileResponse = apiClient.getApplicantProfile(accessToken: accessToken)
            async let reelsResponse = apiClient.getApplicantReels(accessToken: accessToken)
            async let accomplishmentsResponse = apiClient.getApplicantAccomplishments(accessToken: accessToken)
            profile = try await profileResponse
            reels = try await reelsResponse.videos
            accomplishments = try await accomplishmentsResponse.accomplishments
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    private func loadSelectedVideo(_ item: PhotosPickerItem?) async {
        guard let item else { return }
        isReadingVideo = true
        errorMessage = nil
        successMessage = nil
        defer { isReadingVideo = false }

        do {
            guard let picked = try await item.loadTransferable(type: PickedApplicantVideo.self) else {
                throw ApplicantVideoUploadError.unreadableVideo
            }
            let validatedVideo = try await validatedLocalVideo(from: picked.url, maxDurationSeconds: 60)
            selectedVideo = try await optimizedReelVideo(from: validatedVideo)
        } catch {
            selectedVideo = nil
            errorMessage = error.localizedDescription
        }
    }

    private func loadRecordedVideo(_ url: URL) async {
        isReadingVideo = true
        errorMessage = nil
        successMessage = nil
        defer { isReadingVideo = false }

        do {
            let validatedVideo = try await validatedLocalVideo(from: url, maxDurationSeconds: 60)
            selectedVideo = try await optimizedReelVideo(from: validatedVideo)
        } catch {
            selectedVideo = nil
            errorMessage = error.localizedDescription
        }
    }

    private func uploadReel() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken, let selectedVideo else {
            errorMessage = "Choose a video before uploading."
            return
        }

        isUploading = true
        errorMessage = nil
        successMessage = nil
        defer { isUploading = false }

        do {
            try await apiClient.acceptApplicantConsent(accessToken: accessToken, video: true, privacyPolicy: true)
            let preparation = try await apiClient.prepareApplicantReelUpload(accessToken: accessToken)
            if let maxFileSizeBytes = preparation.maxFileSizeBytes,
               let localBytes = selectedVideo.fileSizeBytes,
               localBytes > maxFileSizeBytes {
                throw ApplicantVideoUploadError.cloudinaryFailed
            }

            let uploaded = try await ApplicantVideoCloudinaryUploader.upload(video: selectedVideo, preparation: preparation)
            _ = try await apiClient.completeApplicantReelUpload(
                accessToken: accessToken,
                caption: optionalText(caption),
                cloudinaryPublicId: uploaded.publicId,
                secureUrl: uploaded.secureUrl,
                contentType: selectedVideo.contentType,
                fileSizeBytes: uploaded.bytes ?? selectedVideo.fileSizeBytes,
                durationSeconds: selectedVideo.durationSeconds,
                orientation: "unknown",
                links: Array(selectedLinks)
            )

            caption = ""
            self.selectedVideo = nil
            selectedItem = nil
            selectedLinks.removeAll()
            successMessage = "Reel uploaded."
            await load()
            isShowingPublishWizard = false
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func createProject() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }
        isCreatingProject = true
        errorMessage = nil
        defer { isCreatingProject = false }

        do {
            let project = try await apiClient.createApplicantProject(
                accessToken: accessToken,
                title: newProjectTitle.trimmingCharacters(in: .whitespacesAndNewlines),
                type: newProjectType,
                description: newProjectDescription.trimmingCharacters(in: .whitespacesAndNewlines),
                linkUrl: newProjectLink.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            selectedLinks.insert(ApplicantVideoEvidenceLink(targetType: "project", targetId: project.id))
            newProjectTitle = ""
            newProjectType = "built_project"
            newProjectDescription = ""
            newProjectLink = ""
            await load()
            successMessage = "Project linked to this reel."
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func createInternship() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }
        guard let durationMonths = Int(newInternshipDurationMonths), durationMonths > 0 else {
            errorMessage = "Enter internship duration in months."
            return
        }
        isCreatingInternship = true
        errorMessage = nil
        defer { isCreatingInternship = false }

        do {
            let internship = try await apiClient.createApplicantInternship(
                accessToken: accessToken,
                company: newInternshipCompany.trimmingCharacters(in: .whitespacesAndNewlines),
                roleDepartment: newInternshipRoleDepartment,
                durationMonths: durationMonths
            )
            selectedLinks.insert(ApplicantVideoEvidenceLink(targetType: "internship", targetId: internship.id))
            newInternshipCompany = ""
            newInternshipRoleDepartment = "Engineering"
            newInternshipDurationMonths = ""
            await load()
            successMessage = "Internship linked to this reel."
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func createAccomplishment() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }
        isCreatingAccomplishment = true
        errorMessage = nil
        defer { isCreatingAccomplishment = false }

        do {
            let accomplishment = try await apiClient.createApplicantAccomplishment(
                accessToken: accessToken,
                title: newAccomplishmentTitle.trimmingCharacters(in: .whitespacesAndNewlines),
                description: newAccomplishmentDescription.trimmingCharacters(in: .whitespacesAndNewlines),
                linkUrl: newAccomplishmentLink.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            accomplishments.insert(accomplishment, at: 0)
            selectedLinks.insert(ApplicantVideoEvidenceLink(targetType: "accomplishment", targetId: accomplishment.id))
            newAccomplishmentTitle = ""
            newAccomplishmentDescription = ""
            newAccomplishmentLink = ""
            successMessage = "Accomplishment linked to this reel."
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func deleteReel(_ reelId: String) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }
        do {
            try await apiClient.deleteApplicantReel(accessToken: accessToken, reelId: reelId)
            reels.removeAll { $0.id == reelId }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func updateCaption(_ reelId: String) async {
        await updateCaption(reelId, captionValue: editingCaption)
    }

    private func updateCaption(_ reelId: String, captionValue: String) async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else { return }
        do {
            let updated = try await apiClient.updateApplicantReelCaption(
                accessToken: accessToken,
                reelId: reelId,
                caption: optionalText(captionValue)
            )
            if let index = reels.firstIndex(where: { $0.id == reelId }) {
                reels[index] = updated
            }
            if selectedReel?.id == reelId {
                selectedReel = updated
            }
            editingReelId = nil
            editingCaption = ""
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func optionalText(_ value: String) -> String? {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    private func optimizedReelVideo(from video: LocalApplicantVideo) async throws -> LocalApplicantVideo {
        let asset = AVURLAsset(url: video.url)
        let preset = AVAssetExportSession.exportPresets(compatibleWith: asset).contains(AVAssetExportPreset960x540)
            ? AVAssetExportPreset960x540
            : AVAssetExportPresetMediumQuality

        guard let exportSession = AVAssetExportSession(asset: asset, presetName: preset) else {
            return video
        }

        let outputURL = FileManager.default.temporaryDirectory
            .appendingPathComponent("cato-reel-\(UUID().uuidString)")
            .appendingPathExtension("mp4")
        if FileManager.default.fileExists(atPath: outputURL.path) {
            try FileManager.default.removeItem(at: outputURL)
        }

        exportSession.outputURL = outputURL
        exportSession.outputFileType = .mp4
        exportSession.shouldOptimizeForNetworkUse = true
        await exportSession.export()

        guard exportSession.status == .completed else {
            throw exportSession.error ?? ApplicantVideoUploadError.exportFailed
        }

        return localVideo(from: outputURL, durationSeconds: video.durationSeconds)
    }
}

private struct EvidenceChoice: Identifiable {
    var id: String { link.id }
    let label: String
    let link: ApplicantVideoEvidenceLink
}

private enum ReelEvidenceType: String, CaseIterable, Identifiable {
    case project
    case internship
    case accomplishment

    var id: String { rawValue }

    var title: String {
        switch self {
        case .project: return "Projects"
        case .internship: return "Internships"
        case .accomplishment: return "Accomplishments"
        }
    }
}

private struct EvidenceChipSection: View {
    let title: String
    let items: [EvidenceChoice]
    @Binding var selectedLinks: Set<ApplicantVideoEvidenceLink>

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.caption.weight(.bold))
                .foregroundStyle(CatoTheme.muted)

            if items.isEmpty {
                Text("None added yet.")
                    .font(.caption)
                    .foregroundStyle(CatoTheme.muted)
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(items) { item in
                            let selected = selectedLinks.contains(item.link)
                            Button {
                                if selected {
                                    selectedLinks.remove(item.link)
                                } else {
                                    selectedLinks.insert(item.link)
                                }
                            } label: {
                                Text(item.label)
                                    .font(.caption.weight(.semibold))
                                    .lineLimit(1)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 8)
                                    .foregroundStyle(selected ? .white : CatoTheme.ink)
                                    .background(selected ? CatoTheme.purple : CatoTheme.purpleSoft)
                                    .clipShape(Capsule())
                            }
                        }
                    }
                }
            }
        }
    }
}

private struct ApplicantReelCameraRecorder: UIViewControllerRepresentable {
    let maxDurationSeconds: Double
    let onVideo: (URL) -> Void

    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = UIImagePickerController.isSourceTypeAvailable(.camera) ? .camera : .photoLibrary
        picker.mediaTypes = [UTType.movie.identifier]
        picker.cameraCaptureMode = .video
        picker.videoMaximumDuration = maxDurationSeconds
        picker.videoQuality = .typeMedium
        picker.allowsEditing = false
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(onVideo: onVideo) {
            dismiss()
        }
    }

    final class Coordinator: NSObject, UINavigationControllerDelegate, UIImagePickerControllerDelegate {
        let onVideo: (URL) -> Void
        let onDismiss: () -> Void

        init(onVideo: @escaping (URL) -> Void, onDismiss: @escaping () -> Void) {
            self.onVideo = onVideo
            self.onDismiss = onDismiss
        }

        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            if let url = info[.mediaURL] as? URL {
                onVideo(url)
            }
            onDismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            onDismiss()
        }
    }
}

private struct ReadinessItem: View {
    let title: String
    let icon: String
    let isDone: Bool

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .foregroundStyle(isDone ? CatoTheme.purple : CatoTheme.muted)
            Text(title)
                .font(.caption.weight(.semibold))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
            Spacer()
        }
        .padding(10)
        .background(isDone ? CatoTheme.purpleSoft : Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(CatoTheme.border, lineWidth: 1))
    }
}
