package com.cato.app.state

import com.cato.app.core.ApplicantInternship
import com.cato.app.core.ApplicantInternshipCommand
import com.cato.app.core.ApplicantProfileResponse
import com.cato.app.core.ApplicantProject
import com.cato.app.core.ApplicantProjectCommand

sealed interface ApplicantActionTarget {
    data object RecruiterPreview : ApplicantActionTarget
    data object ResumeUpload : ApplicantActionTarget
    data object ShortTakeUpload : ApplicantActionTarget
    data object DeeperSignalUpload : ApplicantActionTarget
    data object ProjectsManager : ApplicantActionTarget
    data object InternshipsManager : ApplicantActionTarget
    data object ReelsProfile : ApplicantActionTarget
    data object SearchProfileEditor : ApplicantActionTarget
    data object EducationEditor : ApplicantActionTarget
}

data class ApplicantProfileActionSpec(
    val target: ApplicantActionTarget,
    val title: String,
    val subtitle: String,
    val isPrimary: Boolean = false,
)

data class ApplicantRecruiterPreviewRowSpec(
    val title: String,
    val value: String,
    val isReady: Boolean,
)

data class ApplicantProfileActionState(
    val profile: ApplicantProfileResponse,
    val reelsCount: Int,
    val searchProfileConfigured: Boolean,
) {
    val screenSpec: ApplicantProfileScreenSpec
        get() = ApplicantProfileScreenSpec(
            title = "Profile",
            loadingMessage = "Loading profile",
            identity = ApplicantProfileIdentitySpec(
                displayName = profile.applicant.displayName,
                email = profile.applicant.email ?: "Email unavailable",
                educationTitle = profile.education?.universityName,
                educationSubtitle = listOfNotNull(profile.education?.major, profile.education?.semesterLabel)
                    .joinToString(" • ")
                    .ifBlank { null },
                gpaLabel = profile.education?.gpa?.let { "GPA %.2f".format(it) },
            ),
            recruiterPreview = ApplicantProfileRecruiterPreviewSpec(
                action = recruiterPreviewAction,
                strengthPercent = profile.profileStrength,
                readinessItems = recruiterVisibleRows.take(4),
                completionMessage = recruiterPreviewCompletionMessage,
                missingActions = missingRecruiterPreviewActions,
            ),
            prioritizeManualMatching = !searchProfileConfigured,
            manualMatchingAction = cardActions.first { it.target == ApplicantActionTarget.SearchProfileEditor },
            reels = ApplicantProfileReelsCardSpec(
                action = cardActions.first { it.target == ApplicantActionTarget.ReelsProfile },
                isEmpty = reelsCount == 0,
                emptyTitle = "Add proof videos linked to your work.",
                emptyMessage = "Each reel must connect to a project, internship, or accomplishment.",
            ),
            projects = cardActions.first { it.target == ApplicantActionTarget.ProjectsManager },
            internships = cardActions.first { it.target == ApplicantActionTarget.InternshipsManager },
            softSkillsTitle = "Soft skills",
            softSkillsCount = profile.softSkills?.items?.size ?: 0,
            softSkillsEmptyMessage = "Soft skills will appear after your signal profile is complete.",
        )

    val hasResume: Boolean
        get() = !profile.resume?.secureUrl.isNullOrBlank() || !profile.resume?.previewUrl.isNullOrBlank()

    val hasShortTake: Boolean
        get() = profile.signal?.tenSecondVideo != null

    val hasDeeperSignal: Boolean
        get() = profile.signal?.thirtySecondVideo != null

    val recruiterPreviewAction: ApplicantProfileActionSpec
        get() = ApplicantProfileActionSpec(
            target = ApplicantActionTarget.RecruiterPreview,
            title = "Recruiter preview",
            subtitle = "${profile.profileStrength}% profile strength",
            isPrimary = true,
        )

    val cardActions: List<ApplicantProfileActionSpec>
        get() = buildList {
            add(
                ApplicantProfileActionSpec(
                    target = ApplicantActionTarget.ReelsProfile,
                    title = "Profile reels",
                    subtitle = "$reelsCount/9 proof videos",
                )
            )
            add(
                ApplicantProfileActionSpec(
                    target = ApplicantActionTarget.ProjectsManager,
                    title = "What I built",
                    subtitle = "${profile.projects.size} projects",
                )
            )
            add(
                ApplicantProfileActionSpec(
                    target = ApplicantActionTarget.InternshipsManager,
                    title = "Internships",
                    subtitle = "${profile.internships.size} internships",
                )
            )
            add(
                ApplicantProfileActionSpec(
                    target = ApplicantActionTarget.SearchProfileEditor,
                    title = "Manual matching fields",
                    subtitle = if (searchProfileConfigured) "Configured" else "Add skills and fields",
                    isPrimary = !searchProfileConfigured,
                )
            )
        }

    val recruiterVisibleRows: List<ApplicantRecruiterPreviewRowSpec>
        get() = listOf(
            ApplicantRecruiterPreviewRowSpec("Intro short take", if (hasShortTake) "Visible" else "Missing", hasShortTake),
            ApplicantRecruiterPreviewRowSpec("Deeper signal", if (hasDeeperSignal) "Visible" else "Missing", hasDeeperSignal),
            ApplicantRecruiterPreviewRowSpec("Resume", if (hasResume) profile.resume?.originalFileName ?: "Uploaded" else "Missing", hasResume),
            ApplicantRecruiterPreviewRowSpec("Projects", profile.projects.size.toString(), profile.projects.isNotEmpty()),
            ApplicantRecruiterPreviewRowSpec("Internships", profile.internships.size.toString(), profile.internships.isNotEmpty()),
            ApplicantRecruiterPreviewRowSpec("Profile reels", "$reelsCount/9", reelsCount > 0),
        )

    val coreRecruiterProfileReady: Boolean
        get() = hasResume && hasShortTake && hasDeeperSignal && profile.projects.isNotEmpty()

    val recruiterPreviewCompletionMessage: String?
        get() = if (coreRecruiterProfileReady) {
            "Your core recruiter profile is in good shape. You can still add reels, projects, and internships over time."
        } else {
            null
        }

    val missingRecruiterPreviewActions: List<ApplicantProfileActionSpec>
        get() = buildList {
            if (!hasResume) {
                add(ApplicantProfileActionSpec(ApplicantActionTarget.ResumeUpload, "Add a resume", "Recruiters can open your PDF from your profile."))
            }
            if (!hasShortTake) {
                add(ApplicantProfileActionSpec(ApplicantActionTarget.ShortTakeUpload, "Add short take", "This is the first video recruiters see."))
            }
            if (!hasDeeperSignal) {
                add(ApplicantProfileActionSpec(ApplicantActionTarget.DeeperSignalUpload, "Add deeper signal", "Optional, but useful for stronger profile evidence."))
            }
            if (profile.projects.isEmpty()) {
                add(ApplicantProfileActionSpec(ApplicantActionTarget.ProjectsManager, "Add a project", "Projects carry strong profile weight."))
            }
            if (profile.internships.isEmpty()) {
                add(ApplicantProfileActionSpec(ApplicantActionTarget.InternshipsManager, "Add internship", "Optional, but visible when you have one."))
            }
    }
}

data class ApplicantProfileScreenSpec(
    val title: String,
    val loadingMessage: String,
    val identity: ApplicantProfileIdentitySpec,
    val recruiterPreview: ApplicantProfileRecruiterPreviewSpec,
    val prioritizeManualMatching: Boolean,
    val manualMatchingAction: ApplicantProfileActionSpec,
    val reels: ApplicantProfileReelsCardSpec,
    val projects: ApplicantProfileActionSpec,
    val internships: ApplicantProfileActionSpec,
    val softSkillsTitle: String,
    val softSkillsCount: Int,
    val softSkillsEmptyMessage: String,
)

data class ApplicantProfileIdentitySpec(
    val displayName: String,
    val email: String,
    val educationTitle: String?,
    val educationSubtitle: String?,
    val gpaLabel: String?,
)

data class ApplicantProfileRecruiterPreviewSpec(
    val action: ApplicantProfileActionSpec,
    val strengthPercent: Int,
    val readinessItems: List<ApplicantRecruiterPreviewRowSpec>,
    val completionMessage: String?,
    val missingActions: List<ApplicantProfileActionSpec>,
)

data class ApplicantProfileReelsCardSpec(
    val action: ApplicantProfileActionSpec,
    val isEmpty: Boolean,
    val emptyTitle: String,
    val emptyMessage: String,
)

data class ApplicantSettingsActionState(
    val profile: ApplicantProfileResponse,
    val sessionEmail: String? = null,
    val isWorking: Boolean = false,
) {
    val screenSpec: ApplicantSettingsScreenSpec
        get() = ApplicantSettingsScreenSpec(
            title = "Settings",
            loadingMessage = "Loading settings",
            subtitle = "Manage your applicant account.",
            profile = ApplicantSettingsProfileSpec(
                displayName = displayName,
                email = displayEmail,
            ),
            educationAction = educationAction,
            infoRows = infoRows.map { ApplicantSettingsInfoRowSpec(label = it.first, value = it.second) },
            accountSectionTitle = "Account",
            logout = ApplicantSettingsActionButtonSpec(
                title = logoutActionTitle,
                iconName = "rectangle.portrait.and.arrow.right",
                destructive = false,
                enabled = actionsEnabled,
            ),
            delete = ApplicantSettingsActionButtonSpec(
                title = deleteActionTitle,
                iconName = "trash",
                destructive = true,
                enabled = actionsEnabled,
            ),
            workingMessage = if (isWorking) "Updating account..." else null,
            logoutConfirmation = ApplicantSettingsConfirmationSpec(
                title = logoutConfirmationTitle,
                message = logoutConfirmationMessage,
                confirmTitle = logoutActionTitle,
            ),
            deleteConfirmation = ApplicantSettingsConfirmationSpec(
                title = deleteConfirmationTitle,
                message = deleteConfirmationMessage,
                confirmTitle = deleteActionTitle,
            ),
        )

    val displayName: String
        get() = profile.applicant.displayName

    val displayEmail: String
        get() = profile.applicant.email ?: sessionEmail ?: "Email unavailable"

    val educationAction: ApplicantProfileActionSpec
        get() = ApplicantProfileActionSpec(
            target = ApplicantActionTarget.EducationEditor,
            title = "Education",
            subtitle = profile.education?.summary ?: "Add university, major, and semester",
            isPrimary = profile.education == null,
        )

    val infoRows: List<Pair<String, String>>
        get() = buildList {
            add("University" to (profile.education?.universityName ?: "Not added"))
            add("Major" to (profile.education?.major ?: "Not added"))
            add("Semester" to (profile.education?.semesterLabel ?: "Not added"))
            profile.education?.gpa?.let { add("GPA" to "%.2f".format(it)) }
        }

    val logoutActionTitle: String
        get() = "Log out"

    val logoutConfirmationTitle: String
        get() = "Log out?"

    val logoutConfirmationMessage: String
        get() = "You will return to the Cato sign-in screen."

    val deleteActionTitle: String
        get() = "Delete account"

    val deleteConfirmationTitle: String
        get() = "Delete account?"

    val deleteConfirmationMessage: String
        get() = "This permanently removes your Cato applicant account and cannot be undone."

    val actionsEnabled: Boolean
        get() = !isWorking
}

data class ApplicantSettingsScreenSpec(
    val title: String,
    val loadingMessage: String,
    val subtitle: String,
    val profile: ApplicantSettingsProfileSpec,
    val educationAction: ApplicantProfileActionSpec,
    val infoRows: List<ApplicantSettingsInfoRowSpec>,
    val accountSectionTitle: String,
    val logout: ApplicantSettingsActionButtonSpec,
    val delete: ApplicantSettingsActionButtonSpec,
    val workingMessage: String?,
    val logoutConfirmation: ApplicantSettingsConfirmationSpec,
    val deleteConfirmation: ApplicantSettingsConfirmationSpec,
)

data class ApplicantSettingsProfileSpec(
    val displayName: String,
    val email: String,
)

data class ApplicantSettingsInfoRowSpec(
    val label: String,
    val value: String,
)

data class ApplicantSettingsActionButtonSpec(
    val title: String,
    val iconName: String,
    val destructive: Boolean,
    val enabled: Boolean,
)

data class ApplicantSettingsConfirmationSpec(
    val title: String,
    val message: String,
    val confirmTitle: String,
    val cancelTitle: String = "Cancel",
)

data class ApplicantProjectEditorState(
    val editingProject: ApplicantProject? = null,
    val title: String = editingProject?.title.orEmpty(),
    val type: String = editingProject?.type.orEmpty(),
    val description: String = editingProject?.description.orEmpty(),
    val linkUrl: String = editingProject?.linkUrl.orEmpty(),
    val isSaving: Boolean = false,
    val errorMessage: String? = null,
) {
    val isEditing: Boolean
        get() = editingProject != null

    val canSave: Boolean
        get() = title.trim().isNotEmpty() && description.trim().isNotEmpty() && !isSaving

    val command: ApplicantProjectCommand
        get() = ApplicantProjectCommand(
            title = title.trim(),
            type = type.trim().ifBlank { "project" },
            description = description.trim(),
            linkUrl = linkUrl.trim().takeIf { it.isNotBlank() },
        )

    val validationMessage: String?
        get() = when {
            title.trim().isEmpty() -> "Project title is required."
            description.trim().isEmpty() -> "Project description is required."
            else -> null
        }
}

data class ApplicantInternshipEditorState(
    val editingInternship: ApplicantInternship? = null,
    val company: String = editingInternship?.company.orEmpty(),
    val roleDepartment: String = editingInternship?.roleDepartment.orEmpty(),
    val durationMonthsText: String = editingInternship?.durationMonths?.toString().orEmpty(),
    val isSaving: Boolean = false,
    val errorMessage: String? = null,
) {
    val isEditing: Boolean
        get() = editingInternship != null

    val durationMonths: Int?
        get() = durationMonthsText.trim().toIntOrNull()

    val canSave: Boolean
        get() = validationMessage == null && !isSaving

    val command: ApplicantInternshipCommand
        get() = ApplicantInternshipCommand(
            company = company.trim(),
            durationMonths = durationMonths ?: 0,
            roleDepartment = roleDepartment.trim(),
        )

    val validationMessage: String?
        get() = when {
            company.trim().isEmpty() -> "Company is required."
            roleDepartment.trim().isEmpty() -> "Role or department is required."
            durationMonths == null || durationMonths!! <= 0 -> "Duration must be at least one month."
            else -> null
        }
}
