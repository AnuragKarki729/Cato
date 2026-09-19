package com.cato.app.state

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertNull
import kotlin.test.assertTrue

class ApplicantUploadStateTest {
    @Test
    fun resumeUploadRequiresPdfWithinTenMb() {
        val notPdf = LocalApplicantResumeSelection(fileName = "resume.docx", fileSizeBytes = 120)
        val tooLarge = LocalApplicantResumeSelection(fileName = "resume.pdf", fileSizeBytes = 11 * 1024 * 1024)
        val valid = LocalApplicantResumeSelection(fileName = "resume.pdf", fileSizeBytes = 120)

        assertEquals(ApplicantResumeSelectionError.NOT_PDF, notPdf.validationError)
        assertEquals(ApplicantResumeSelectionError.TOO_LARGE, tooLarge.validationError)
        assertNull(valid.validationError)
        assertTrue(ApplicantResumeUploadState(selectedResume = valid).canUpload)
        assertFalse(ApplicantResumeUploadState().canUpload)
    }

    @Test
    fun resumeTextQualityMatchesSwiftThresholdsAndExtractsKnownSkills() {
        val goodText = "Built Python and React APIs with AWS, SQL, Kotlin, and Docker for a campus hiring platform."
        val poorText = "%%%%% ##### ////"

        assertTrue(ResumeTextQuality.isAcceptable(goodText))
        assertEquals(ResumeTextQualityError.LOW_QUALITY_TEXT, ResumeTextQuality.errorFor(poorText))
        assertEquals(
            listOf("aws", "docker", "kotlin", "python", "react", "sql"),
            ResumeTextQuality.extractKnownSkills(goodText),
        )
    }

    @Test
    fun onboardingVideoUploadRequiresThreeSecondsAndTrimsLongVideos() {
        val state = ApplicantOnboardingVideoUploadState(
            title = "Short take",
            videoType = "10-second",
            maxDurationSeconds = 10.0,
        )

        val tooShort = state.selectVideo(
            LocalApplicantVideoSelection(uri = "file://short.mov", contentType = "video/quicktime", durationSeconds = 2.5)
        )
        val needsTrim = state.selectVideo(
            LocalApplicantVideoSelection(uri = "file://long.mov", contentType = "video/quicktime", durationSeconds = 12.0)
        )
        val valid = state.selectVideo(
            LocalApplicantVideoSelection(uri = "file://ok.mov", contentType = "video/quicktime", durationSeconds = 8.0)
        )

        assertEquals(ApplicantVideoSelectionError.TOO_SHORT.message, tooShort.errorMessage)
        assertEquals("file://long.mov", needsTrim.pendingTrimVideo?.uri)
        assertFalse(needsTrim.canUpload)
        assertTrue(valid.canUpload)
        assertEquals("file://ok.mov", valid.selectedVideo?.uri)
    }

    @Test
    fun reelVideoPreparationMirrorsSwiftOptimizationRules() {
        val raw = LocalApplicantVideoSelection(
            uri = "file://reel.mov",
            contentType = "video/quicktime",
            durationSeconds = 45.0,
            fileSizeBytes = 7_000_000,
        )
        val state = ApplicantReelVideoPreparationState(selectedVideo = raw, serverMaxFileSizeBytes = 8_000_000)
        val optimized = state.withOptimizedVideo(raw.copy(uri = "file://optimized.mp4", fileSizeBytes = 4_000_000))

        assertEquals("mp4", state.targetContainer)
        assertEquals("960x540", state.preferredExportPreset)
        assertEquals("medium", state.fallbackExportPreset)
        assertTrue(state.shouldOptimizeForNetworkUse)
        assertTrue(state.requiresOptimization)
        assertTrue(state.selectedVideoDurationAllowed)
        assertTrue(state.canUploadAfterOptimization)
        assertEquals("video/mp4", optimized.selectedVideo?.contentType)
        assertEquals("file://optimized.mp4", optimized.selectedVideo?.uri)
    }

    @Test
    fun reelVideoPreparationBlocksTooLongOrOversizedVideos() {
        val tooLong = ApplicantReelVideoPreparationState(
            selectedVideo = LocalApplicantVideoSelection(
                uri = "file://long.mov",
                contentType = "video/quicktime",
                durationSeconds = 61.0,
            )
        )
        val tooLarge = ApplicantReelVideoPreparationState(
            selectedVideo = LocalApplicantVideoSelection(
                uri = "file://large.mov",
                contentType = "video/quicktime",
                durationSeconds = 30.0,
                fileSizeBytes = 10_000_000,
            ),
            serverMaxFileSizeBytes = 8_000_000,
        )

        assertFalse(tooLong.canUploadAfterOptimization)
        assertEquals("Profile reels can be up to 60 seconds.", tooLong.uploadBlockedMessage)
        assertFalse(tooLarge.canUploadAfterOptimization)
        assertEquals("Video upload failed. Try again with a smaller local clip.", tooLarge.uploadBlockedMessage)
    }
}
