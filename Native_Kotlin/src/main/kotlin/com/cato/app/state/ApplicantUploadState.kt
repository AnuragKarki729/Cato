package com.cato.app.state

private const val MAX_RESUME_BYTES = 10 * 1024 * 1024
private const val MIN_ONBOARDING_VIDEO_SECONDS = 3.0
private const val MAX_REEL_VIDEO_SECONDS = 60.0

data class LocalApplicantResumeSelection(
    val fileName: String,
    val fileSizeBytes: Int,
    val extractedText: String? = null,
) {
    val isPdf: Boolean
        get() = fileName.substringAfterLast('.', "").lowercase() == "pdf"

    val validationError: ApplicantResumeSelectionError?
        get() = when {
            !isPdf -> ApplicantResumeSelectionError.NOT_PDF
            fileSizeBytes <= 0 -> ApplicantResumeSelectionError.EMPTY_FILE
            fileSizeBytes > MAX_RESUME_BYTES -> ApplicantResumeSelectionError.TOO_LARGE
            else -> null
        }
}

enum class ApplicantResumeSelectionError(val message: String) {
    NOT_PDF("Choose a PDF resume."),
    EMPTY_FILE("This PDF is empty."),
    TOO_LARGE("Choose a PDF smaller than 10 MB."),
}

data class ApplicantResumeUploadState(
    val selectedResume: LocalApplicantResumeSelection? = null,
    val isPickingPdf: Boolean = false,
    val isWorking: Boolean = false,
    val errorMessage: String? = null,
) {
    val selectedFileName: String?
        get() = selectedResume?.fileName

    val canUpload: Boolean
        get() = !isWorking && selectedResume?.validationError == null && selectedResume != null

    val uploadBlockedMessage: String?
        get() = selectedResume?.validationError?.message ?: if (selectedResume == null) "Choose a PDF resume before uploading." else null

    val parsedResumeText: String?
        get() = selectedResume?.extractedText?.takeIf { ResumeTextQuality.isAcceptable(it) }

    val parsedTextError: ResumeTextQualityError?
        get() = selectedResume?.extractedText?.let { ResumeTextQuality.errorFor(it) }
}

enum class ResumeTextQualityError(val message: String) {
    EMPTY_TEXT("Cato could not find searchable text in this PDF. Try uploading a text-based PDF instead of a scanned image."),
    LOW_QUALITY_TEXT("Cato could not extract reliable text from this PDF. It may be scanned, image-based, or encoded in a way that cannot be searched."),
}

object ResumeTextQuality {
    fun isAcceptable(text: String): Boolean = errorFor(text) == null

    fun errorFor(text: String): ResumeTextQualityError? {
        val scalars = text.filterNot { it.isWhitespace() }
        if (scalars.isEmpty()) return ResumeTextQualityError.EMPTY_TEXT
        if (scalars.length < 40) return ResumeTextQualityError.LOW_QUALITY_TEXT

        val usefulCount = scalars.count { it.isLetterOrDigit() || it.isPunctuationLike() }
        val letterCount = scalars.count { it.isLetter() }
        val usefulRatio = usefulCount.toDouble() / scalars.length.toDouble()
        val letterRatio = letterCount.toDouble() / scalars.length.toDouble()

        return if (usefulRatio >= 0.82 && letterRatio >= 0.35) null else ResumeTextQualityError.LOW_QUALITY_TEXT
    }

    fun extractKnownSkills(text: String): List<String> {
        val normalized = text.lowercase()
        val skillCandidates = listOf(
            "aws", "azure", "c", "c++", "css", "docker", "excel", "figma", "firebase",
            "git", "go", "html", "java", "javascript", "kotlin", "mongodb", "node",
            "postgresql", "python", "react", "sql", "swift", "typescript", "ui/ux",
        )
        return skillCandidates
            .filter { normalized.containsWholeSkill(it) }
            .sorted()
    }
}

data class LocalApplicantVideoSelection(
    val uri: String,
    val contentType: String,
    val durationSeconds: Double,
    val fileSizeBytes: Int? = null,
) {
    fun validationError(maxDurationSeconds: Double): ApplicantVideoSelectionError? {
        return when {
            uri.isBlank() -> ApplicantVideoSelectionError.UNREADABLE_VIDEO
            durationSeconds < MIN_ONBOARDING_VIDEO_SECONDS -> ApplicantVideoSelectionError.TOO_SHORT
            durationSeconds > maxDurationSeconds -> ApplicantVideoSelectionError.NEEDS_TRIM
            else -> null
        }
    }
}

enum class ApplicantVideoSelectionError(val message: String) {
    UNREADABLE_VIDEO("Cato could not read this video."),
    TOO_SHORT("Choose a clip that is at least 3 seconds."),
    NEEDS_TRIM("Trim this video before uploading."),
}

data class ApplicantOnboardingVideoUploadState(
    val title: String,
    val videoType: String,
    val maxDurationSeconds: Double,
    val selectedVideo: LocalApplicantVideoSelection? = null,
    val pendingTrimVideo: LocalApplicantVideoSelection? = null,
    val isShowingCamera: Boolean = false,
    val isLoadingVideo: Boolean = false,
    val isUploading: Boolean = false,
    val errorMessage: String? = null,
    val allowsSkip: Boolean = false,
) {
    val canUpload: Boolean
        get() = !isLoadingVideo && !isUploading && selectedVideo?.validationError(maxDurationSeconds) == null && selectedVideo != null

    val uploadBlockedMessage: String?
        get() = selectedVideo?.validationError(maxDurationSeconds)?.message ?: if (selectedVideo == null) "Choose a video before uploading." else null

    fun selectVideo(video: LocalApplicantVideoSelection): ApplicantOnboardingVideoUploadState {
        val validation = video.validationError(maxDurationSeconds)
        return if (validation == ApplicantVideoSelectionError.NEEDS_TRIM) {
            copy(selectedVideo = null, pendingTrimVideo = video, errorMessage = null)
        } else {
            copy(selectedVideo = video.takeIf { validation == null }, pendingTrimVideo = null, errorMessage = validation?.message)
        }
    }
}

data class ApplicantReelVideoPreparationState(
    val selectedVideo: LocalApplicantVideoSelection? = null,
    val serverMaxFileSizeBytes: Int? = null,
    val isOptimizing: Boolean = false,
    val errorMessage: String? = null,
) {
    val targetContainer: String
        get() = "mp4"

    val preferredExportPreset: String
        get() = "960x540"

    val fallbackExportPreset: String
        get() = "medium"

    val shouldOptimizeForNetworkUse: Boolean
        get() = true

    val requiresOptimization: Boolean
        get() = selectedVideo != null

    val selectedVideoDurationAllowed: Boolean
        get() = selectedVideo?.durationSeconds?.let { it in MIN_ONBOARDING_VIDEO_SECONDS..MAX_REEL_VIDEO_SECONDS } ?: false

    val uploadBlockedMessage: String?
        get() {
            val video = selectedVideo ?: return "Choose a video before publishing."
            if (video.durationSeconds < MIN_ONBOARDING_VIDEO_SECONDS) return ApplicantVideoSelectionError.TOO_SHORT.message
            if (video.durationSeconds > MAX_REEL_VIDEO_SECONDS) return "Profile reels can be up to 60 seconds."
            if (serverMaxFileSizeBytes != null && video.fileSizeBytes != null && video.fileSizeBytes > serverMaxFileSizeBytes) {
                return "Video upload failed. Try again with a smaller local clip."
            }
            return null
        }

    val canUploadAfterOptimization: Boolean
        get() = !isOptimizing && uploadBlockedMessage == null

    fun withOptimizedVideo(video: LocalApplicantVideoSelection): ApplicantReelVideoPreparationState {
        return copy(
            selectedVideo = video.copy(contentType = "video/mp4"),
            isOptimizing = false,
            errorMessage = null,
        )
    }
}

private fun Char.isPunctuationLike(): Boolean {
    return this in listOf('.', ',', ';', ':', '-', '_', '/', '+', '#', '@', '(', ')', '[', ']', '&')
}

private fun String.containsWholeSkill(skill: String): Boolean {
    val startCandidates = indices.filter { index ->
        regionMatches(index, skill, 0, skill.length, ignoreCase = true)
    }
    return startCandidates.any { index ->
        val before = getOrNull(index - 1)
        val after = getOrNull(index + skill.length)
        !before.isSkillBoundaryBlocked() && !after.isSkillBoundaryBlocked()
    }
}

private fun Char?.isSkillBoundaryBlocked(): Boolean {
    return this != null && (isLetterOrDigit() || this == '+' || this == '#')
}
