package com.cato.app.state

import com.cato.app.core.ApplicantAccomplishment
import com.cato.app.core.ApplicantAccomplishmentCommand
import com.cato.app.core.ApplicantInternship
import com.cato.app.core.ApplicantInternshipCommand
import com.cato.app.core.ApplicantProject
import com.cato.app.core.ApplicantProjectCommand
import com.cato.app.core.ApplicantProfileResponse
import com.cato.app.core.ApplicantReelVideo
import com.cato.app.core.ApplicantVideoEvidenceLink

private const val MAX_REEL_COUNT = 9
private const val MAX_REEL_CAPTION_LENGTH = 250
private const val MAX_REEL_DURATION_SECONDS = 60.0

data class ApplicantReelsProfileState(
    val profile: ApplicantProfileResponse? = null,
    val reels: List<ApplicantReelVideo> = emptyList(),
) {
    val screenSpec: ApplicantReelsProfileScreenSpec
        get() = ApplicantReelsProfileScreenSpec(
            title = "Profile reels",
            loadingMessage = "Loading reels",
            displayName = displayName,
            avatarLetter = avatarLetter,
            infoLine = infoLine,
            countLabel = reelCountLabel,
            canAddReel = canAddReel,
            addButtonTitle = "Add reel",
            addButtonIconName = "plus",
            emptyTitle = "Add proof videos linked to your work.",
            emptyMessage = "Each reel must connect to a project, internship, or accomplishment.",
            gridItems = gridItems,
        )

    val displayName: String
        get() = profile?.applicant?.displayName ?: "Applicant"

    val avatarLetter: String
        get() = displayName.trim().firstOrNull()?.uppercaseChar()?.toString() ?: "A"

    val infoLine: String
        get() = listOfNotNull(
            profile?.education?.major?.takeIf { it.isNotBlank() },
            profile?.education?.universityName?.takeIf { it.isNotBlank() },
        ).joinToString(" • ")

    val reelCountLabel: String
        get() = "${reels.size}/$MAX_REEL_COUNT"

    val canAddReel: Boolean
        get() = reels.size < MAX_REEL_COUNT

    val gridItems: List<ApplicantReelGridItem>
        get() = reels.map { reel ->
            ApplicantReelGridItem(
                reelId = reel.id,
                thumbnailUrl = reel.thumbnailUrl.ifBlank { reel.videoUrl },
                caption = reel.caption?.takeIf { it.isNotBlank() },
                metricLabel = "${reel.viewCount} views",
            )
        }
}

data class ApplicantReelsProfileScreenSpec(
    val title: String,
    val loadingMessage: String,
    val displayName: String,
    val avatarLetter: String,
    val infoLine: String,
    val countLabel: String,
    val canAddReel: Boolean,
    val addButtonTitle: String,
    val addButtonIconName: String,
    val emptyTitle: String,
    val emptyMessage: String,
    val gridItems: List<ApplicantReelGridItem>,
) {
    val isEmpty: Boolean
        get() = gridItems.isEmpty()
}

data class PublicApplicantVideoProfileState(
    val displayName: String,
    val educationLine: String = "",
    val reels: List<ApplicantReelVideo> = emptyList(),
    val publicProjects: List<ApplicantProject> = emptyList(),
    val publicAccomplishments: List<ApplicantAccomplishment> = emptyList(),
) {
    val avatarLetter: String
        get() = displayName.trim().firstOrNull()?.uppercaseChar()?.toString() ?: "A"

    val gridItems: List<ApplicantReelGridItem>
        get() = reels.map { reel ->
            ApplicantReelGridItem(
                reelId = reel.id,
                thumbnailUrl = reel.thumbnailUrl.ifBlank { reel.videoUrl },
                caption = reel.caption?.takeIf { it.isNotBlank() },
                metricLabel = "${reel.viewCount} views",
            )
        }

    val visibleSections: List<PublicApplicantProfileSection>
        get() = buildList {
            if (publicProjects.isNotEmpty()) {
                add(PublicApplicantProfileSection("Projects", publicProjects.map { it.title }))
            }
            if (publicAccomplishments.isNotEmpty()) {
                add(PublicApplicantProfileSection("Accomplishments", publicAccomplishments.map { it.title }))
            }
        }
}

data class PublicApplicantProfileSection(
    val title: String,
    val rows: List<String>,
)

data class PublicApplicantVideoFeedState(
    val videos: List<ApplicantReelVideo> = emptyList(),
    val currentIndex: Int = 0,
    val isPausedByUser: Boolean = false,
    val isChromeVisible: Boolean = true,
    val likedVideoIds: Set<String> = emptySet(),
    val viewedVideoIds: Set<String> = emptySet(),
) {
    val currentVideo: ApplicantReelVideo?
        get() = videos.getOrNull(currentIndex)

    val currentVideoUrl: String?
        get() = currentVideo?.let { it.optimizedVideoUrl.ifBlank { it.videoUrl } }?.takeIf { it.isNotBlank() }

    val shouldPlay: Boolean
        get() = currentVideoUrl != null && !isPausedByUser

    val showPlayOverlay: Boolean
        get() = currentVideoUrl != null && isPausedByUser

    val positionText: String
        get() = if (videos.isEmpty()) "0 / 0" else "${currentIndex + 1} / ${videos.size}"

    val canInteractWithCurrentVideo: Boolean
        get() = currentVideo != null

    val isCurrentVideoLiked: Boolean
        get() = currentVideo?.id?.let { it in likedVideoIds } ?: false

    val isCurrentVideoViewed: Boolean
        get() = currentVideo?.id?.let { it in viewedVideoIds } ?: false

    fun next(): PublicApplicantVideoFeedState {
        if (currentIndex >= videos.lastIndex) return this
        return copy(currentIndex = currentIndex + 1, isPausedByUser = false, isChromeVisible = true)
    }

    fun previous(): PublicApplicantVideoFeedState {
        if (currentIndex <= 0) return this
        return copy(currentIndex = currentIndex - 1, isPausedByUser = false, isChromeVisible = true)
    }

    fun togglePlayback(): PublicApplicantVideoFeedState {
        return if (currentVideo == null) this else copy(isPausedByUser = !isPausedByUser, isChromeVisible = true)
    }

    fun markCurrentViewed(): PublicApplicantVideoFeedState {
        val id = currentVideo?.id ?: return this
        return copy(viewedVideoIds = viewedVideoIds + id)
    }

    fun toggleCurrentLike(): PublicApplicantVideoFeedState {
        val id = currentVideo?.id ?: return this
        return copy(likedVideoIds = if (id in likedVideoIds) likedVideoIds - id else likedVideoIds + id)
    }
}

data class ApplicantReelGridItem(
    val reelId: String,
    val thumbnailUrl: String,
    val caption: String?,
    val metricLabel: String,
)

data class ApplicantReelUploadWizardState(
    val selectedVideoUri: String? = null,
    val selectedDurationSeconds: Double? = null,
    val caption: String = "",
    val selectedLinks: Set<ApplicantVideoEvidenceLink> = emptySet(),
    val expandedEvidenceType: ApplicantReelEvidenceType = ApplicantReelEvidenceType.PROJECT,
    val availableProjects: List<ApplicantProject> = emptyList(),
    val availableInternships: List<ApplicantInternship> = emptyList(),
    val availableAccomplishments: List<ApplicantAccomplishment> = emptyList(),
    val newProjectDraft: ApplicantReelNewProjectDraft = ApplicantReelNewProjectDraft(),
    val newInternshipDraft: ApplicantReelNewInternshipDraft = ApplicantReelNewInternshipDraft(),
    val newAccomplishmentDraft: ApplicantReelNewAccomplishmentDraft = ApplicantReelNewAccomplishmentDraft(),
    val existingReelCount: Int = 0,
) {
    val screenSpec: ApplicantReelUploadWizardScreenSpec
        get() = ApplicantReelUploadWizardScreenSpec(
            title = "Publish reel",
            videoSectionTitle = "Video",
            chooseVideoTitle = if (hasVideo) "Replace video" else "Choose video",
            recordVideoTitle = "Record video",
            captionTitle = "Caption",
            captionPlaceholder = "Add a caption, optional",
            captionCountLabel = captionCountLabel,
            evidenceTitle = "Link evidence",
            evidenceHelperText = "Connect this video to at least one project, internship, or accomplishment.",
            expandedSection = selectedEvidenceSection,
            sectionTabs = sections.map { section ->
                ApplicantReelEvidenceTabSpec(
                    type = section.type,
                    title = section.title,
                    selected = section.type == expandedEvidenceType,
                    count = section.items.size,
                )
            },
            publishButtonTitle = "Publish reel",
            publishButtonIconName = "paperplane.fill",
            publishButtonVisible = publishButtonVisible,
            blockingMessage = blockingMessage,
        )

    val normalizedCaption: String?
        get() = caption.trim().takeIf { it.isNotBlank() }

    val captionCountLabel: String
        get() = "${caption.length.coerceAtMost(MAX_REEL_CAPTION_LENGTH)}/$MAX_REEL_CAPTION_LENGTH"

    val isCaptionTooLong: Boolean
        get() = caption.length > MAX_REEL_CAPTION_LENGTH

    val hasVideo: Boolean
        get() = !selectedVideoUri.isNullOrBlank()

    val hasEvidenceLink: Boolean
        get() = selectedLinks.isNotEmpty()

    val hasCapacity: Boolean
        get() = existingReelCount < MAX_REEL_COUNT

    val isDurationAllowed: Boolean
        get() = selectedDurationSeconds == null || selectedDurationSeconds <= MAX_REEL_DURATION_SECONDS

    val canPublish: Boolean
        get() = hasCapacity && hasVideo && hasEvidenceLink && !isCaptionTooLong && isDurationAllowed

    val blockingMessage: String?
        get() = when {
            !hasCapacity -> "You have reached the $MAX_REEL_COUNT reel limit."
            !hasVideo -> "Choose or record a video before publishing."
            !isDurationAllowed -> "Profile reels can be up to 60 seconds."
            !hasEvidenceLink -> "Link this reel to at least one project, internship, or accomplishment."
            isCaptionTooLong -> "Captions can be up to $MAX_REEL_CAPTION_LENGTH characters."
            else -> null
        }

    val sections: List<ApplicantReelEvidenceSection>
        get() = listOf(
            ApplicantReelEvidenceSection(
                type = ApplicantReelEvidenceType.PROJECT,
                title = "Projects",
                items = availableProjects.map {
                    ApplicantReelEvidenceItem(
                        title = it.title,
                        subtitle = it.type,
                        link = ApplicantVideoEvidenceLink("project", it.id),
                    )
                },
            ),
            ApplicantReelEvidenceSection(
                type = ApplicantReelEvidenceType.INTERNSHIP,
                title = "Internships",
                items = availableInternships.map {
                    ApplicantReelEvidenceItem(
                        title = "${it.roleDepartment} at ${it.company}",
                        subtitle = "${it.durationMonths} months",
                        link = ApplicantVideoEvidenceLink("internship", it.id),
                    )
                },
            ),
            ApplicantReelEvidenceSection(
                type = ApplicantReelEvidenceType.ACCOMPLISHMENT,
                title = "Accomplishments",
                items = availableAccomplishments.map {
                    ApplicantReelEvidenceItem(
                        title = it.title,
                        subtitle = it.description,
                        link = ApplicantVideoEvidenceLink("accomplishment", it.id),
                    )
                },
            ),
        )

    val selectedEvidenceSection: ApplicantReelEvidenceSection
        get() = sections.first { it.type == expandedEvidenceType }

    val publishButtonVisible: Boolean
        get() = canPublish

    fun withCaption(value: String): ApplicantReelUploadWizardState {
        return copy(caption = value.take(MAX_REEL_CAPTION_LENGTH))
    }

    fun toggleLink(link: ApplicantVideoEvidenceLink): ApplicantReelUploadWizardState {
        val updated = selectedLinks.toMutableSet()
        if (!updated.add(link)) updated.remove(link)
        return copy(selectedLinks = updated)
    }

    fun expandEvidence(type: ApplicantReelEvidenceType): ApplicantReelUploadWizardState {
        return if (expandedEvidenceType == type) this else copy(expandedEvidenceType = type)
    }

    fun afterProjectCreated(project: ApplicantProject): ApplicantReelUploadWizardState {
        return copy(
            availableProjects = availableProjects + project,
            selectedLinks = selectedLinks + ApplicantVideoEvidenceLink("project", project.id),
            expandedEvidenceType = ApplicantReelEvidenceType.PROJECT,
            newProjectDraft = ApplicantReelNewProjectDraft(),
        )
    }

    fun afterInternshipCreated(internship: ApplicantInternship): ApplicantReelUploadWizardState {
        return copy(
            availableInternships = availableInternships + internship,
            selectedLinks = selectedLinks + ApplicantVideoEvidenceLink("internship", internship.id),
            expandedEvidenceType = ApplicantReelEvidenceType.INTERNSHIP,
            newInternshipDraft = ApplicantReelNewInternshipDraft(),
        )
    }

    fun afterAccomplishmentCreated(accomplishment: ApplicantAccomplishment): ApplicantReelUploadWizardState {
        return copy(
            availableAccomplishments = availableAccomplishments + accomplishment,
            selectedLinks = selectedLinks + ApplicantVideoEvidenceLink("accomplishment", accomplishment.id),
            expandedEvidenceType = ApplicantReelEvidenceType.ACCOMPLISHMENT,
            newAccomplishmentDraft = ApplicantReelNewAccomplishmentDraft(),
        )
    }
}

data class ApplicantReelUploadWizardScreenSpec(
    val title: String,
    val videoSectionTitle: String,
    val chooseVideoTitle: String,
    val recordVideoTitle: String,
    val captionTitle: String,
    val captionPlaceholder: String,
    val captionCountLabel: String,
    val evidenceTitle: String,
    val evidenceHelperText: String,
    val expandedSection: ApplicantReelEvidenceSection,
    val sectionTabs: List<ApplicantReelEvidenceTabSpec>,
    val publishButtonTitle: String,
    val publishButtonIconName: String,
    val publishButtonVisible: Boolean,
    val blockingMessage: String?,
)

data class ApplicantReelEvidenceTabSpec(
    val type: ApplicantReelEvidenceType,
    val title: String,
    val selected: Boolean,
    val count: Int,
)

data class ApplicantReelNewProjectDraft(
    val title: String = "",
    val type: String = "built_project",
    val description: String = "",
    val linkUrl: String = "",
) {
    val canCreate: Boolean
        get() = validationMessage == null

    val command: ApplicantProjectCommand
        get() = ApplicantProjectCommand(
            title = title.trim(),
            type = type.trim().ifBlank { "built_project" },
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

data class ApplicantReelNewInternshipDraft(
    val company: String = "",
    val roleDepartment: String = "Engineering",
    val durationMonthsText: String = "",
) {
    val durationMonths: Int?
        get() = durationMonthsText.trim().toIntOrNull()

    val canCreate: Boolean
        get() = validationMessage == null

    val command: ApplicantInternshipCommand
        get() = ApplicantInternshipCommand(
            company = company.trim(),
            roleDepartment = roleDepartment.trim(),
            durationMonths = durationMonths ?: 0,
        )

    val validationMessage: String?
        get() = when {
            company.trim().isEmpty() -> "Company is required."
            roleDepartment.trim().isEmpty() -> "Role or department is required."
            durationMonths == null || durationMonths!! <= 0 -> "Duration must be at least one month."
            else -> null
        }
}

data class ApplicantReelNewAccomplishmentDraft(
    val title: String = "",
    val description: String = "",
    val linkUrl: String = "",
) {
    val canCreate: Boolean
        get() = validationMessage == null

    val command: ApplicantAccomplishmentCommand
        get() = ApplicantAccomplishmentCommand(
            title = title.trim(),
            description = description.trim(),
            linkUrl = linkUrl.trim().takeIf { it.isNotBlank() },
        )

    val validationMessage: String?
        get() = when {
            title.trim().isEmpty() -> "Accomplishment title is required."
            description.trim().isEmpty() -> "Accomplishment description is required."
            else -> null
        }
}

enum class ApplicantReelEvidenceType(val wireValue: String, val title: String) {
    PROJECT("project", "Projects"),
    INTERNSHIP("internship", "Internships"),
    ACCOMPLISHMENT("accomplishment", "Accomplishments"),
}

data class ApplicantReelEvidenceSection(
    val type: ApplicantReelEvidenceType,
    val title: String,
    val items: List<ApplicantReelEvidenceItem>,
) {
    val isEmpty: Boolean
        get() = items.isEmpty()
}

data class ApplicantReelEvidenceItem(
    val title: String,
    val subtitle: String,
    val link: ApplicantVideoEvidenceLink,
)

data class ApplicantReelPlaybackState(
    val reel: ApplicantReelVideo,
    val isEditingCaption: Boolean = false,
    val captionDraft: String = reel.caption.orEmpty(),
) {
    val displayCaption: String
        get() = reel.caption?.takeIf { it.isNotBlank() } ?: "No caption"

    val captionCountLabel: String
        get() = "${captionDraft.length.coerceAtMost(MAX_REEL_CAPTION_LENGTH)}/$MAX_REEL_CAPTION_LENGTH"

    val canSaveCaption: Boolean
        get() = captionDraft.length <= MAX_REEL_CAPTION_LENGTH

    val normalizedCaption: String?
        get() = captionDraft.trim().takeIf { it.isNotBlank() }
}
