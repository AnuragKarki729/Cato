package com.cato.app.core

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class CatoApiContractTest {
    @Test
    fun mirrorsNativeSwiftApplicantProfileRoute() {
        assertEquals("/profile", CatoApiRoutes.APPLICANT_PROFILE)
        assertEquals("/applicant/activity", CatoApiRoutes.APPLICANT_ACTIVITY)
    }

    @Test
    fun mirrorsNativeSwiftEventRoutes() {
        assertEquals("/recruiter/events", CatoApiRoutes.eventStream(CatoRole.RECRUITER))
        assertEquals("/applicant/events", CatoApiRoutes.eventStream(CatoRole.APPLICANT))

        val recruiterStream = CatoApiContract.eventStream(CatoRole.RECRUITER, accessToken = "token")
        val applicantStream = CatoApiContract.eventStream(CatoRole.APPLICANT, accessToken = "token")

        assertEquals("GET", recruiterStream.method)
        assertEquals("/recruiter/events", recruiterStream.path)
        assertEquals("/applicant/events", applicantStream.path)
        assertEquals("Bearer token", recruiterStream.headers["Authorization"])
        assertEquals("text/event-stream", recruiterStream.headers["Accept"])
        assertTrue(recruiterStream.infiniteTimeout)
    }

    @Test
    fun buildsAuthAndAccountRequestSpecs() {
        val role = CatoApiContract.getRole()
        val deleteApplicant = CatoApiContract.deleteApplicantAccount()
        val deleteRecruiter = CatoApiContract.deleteRecruiterAccount()

        assertEquals("GET", role.method)
        assertEquals("/auth/role", role.path)
        assertEquals("DELETE", deleteApplicant.method)
        assertEquals("/account", deleteApplicant.path)
        assertEquals("DELETE", deleteRecruiter.method)
        assertEquals("/recruiter/account", deleteRecruiter.path)
    }

    @Test
    fun buildsRecruiterCandidateFilterPath() {
        val path = CatoApiRoutes.recruiterCandidates(
            RecruiterCandidateSearchFilters(
                q = "backend",
                categoryFieldIds = listOf("technology"),
                universities = listOf("Harvard University"),
                semesterNumbers = listOf(1, 2),
                reviewStatus = RecruiterReviewStatus.MAYBE,
            )
        )

        assertTrue(path.startsWith("/recruiter/candidates?"))
        assertTrue(path.contains("q=backend"))
        assertTrue(path.contains("categoryFieldIds=technology"))
        assertTrue(path.contains("universities=Harvard+University"))
        assertTrue(path.contains("semesterNumbers=1"))
        assertTrue(path.contains("reviewStatus=maybe"))
    }

    @Test
    fun buildsRecruiterReadRequestSpecs() {
        assertEquals("/recruiter/dashboard", CatoApiContract.recruiterDashboard().path)
        assertEquals("/recruiter/saved-filters", CatoApiContract.recruiterSavedFilters().path)
        assertEquals("/recruiter/interest-requests", CatoApiContract.recruiterInterestRequests().path)
        assertEquals("/recruiter/bookmarks", CatoApiContract.recruiterBookmarks().path)
        assertEquals("/recruiter/messages", CatoApiContract.recruiterMessages().path)
        assertEquals("/recruiter/candidates/candidate%201", CatoApiContract.recruiterCandidate("candidate 1").path)
        assertEquals("/recruiter/candidates/candidate%201/profile-media", CatoApiContract.recruiterCandidateProfileMedia("candidate 1").path)
        assertEquals("/recruiter/candidates/candidate%201/messages", CatoApiContract.recruiterCandidateMessages("candidate 1").path)
        assertEquals("GET", CatoApiContract.recruiterCandidates().method)
        assertEquals("GET", CatoApiContract.recruiterEvidenceQueue().method)
    }

    @Test
    fun buildsInterestRequestPayload() {
        val request = CatoApiContract.sendRecruiterInterest(
            candidateId = "abc123",
            reason = "Strong project evidence",
            sourceType = "video",
            sourceVideoId = "video123",
        )

        assertEquals("POST", request.method)
        assertEquals("/recruiter/candidates/abc123/interest", request.path)
        assertEquals("Strong project evidence", request.body["reason"])
        assertEquals("video", request.body["sourceType"])
        assertEquals("video123", request.body["sourceVideoId"])
    }

    @Test
    fun buildsBookmarkCandidateRequestSpec() {
        val request = CatoApiContract.bookmarkRecruiterCandidate("candidate 1")

        assertEquals("POST", request.method)
        assertEquals("/recruiter/candidates/candidate%201/bookmark", request.path)
    }

    @Test
    fun mirrorsNativeSwiftRecruiterCandidateDynamicRoutes() {
        assertEquals("/recruiter/candidates/candidate%201", CatoApiRoutes.recruiterCandidate("candidate 1"))
        assertEquals("/recruiter/candidates/candidate%201/profile-media", CatoApiRoutes.recruiterCandidateProfileMedia("candidate 1"))
        assertEquals("/recruiter/candidates/candidate%201/bookmark", CatoApiRoutes.recruiterCandidateBookmark("candidate 1"))
        assertEquals("/recruiter/candidates/candidate%201/review", CatoApiRoutes.recruiterCandidateReview("candidate 1"))
        assertEquals("/recruiter/candidates/candidate%201/interest", CatoApiRoutes.recruiterCandidateInterest("candidate 1"))
        assertEquals("/recruiter/candidates/candidate%201/contact", CatoApiRoutes.recruiterCandidateContact("candidate 1"))
        assertEquals("/recruiter/candidates/candidate%201/messages", CatoApiRoutes.recruiterCandidateMessages("candidate 1"))
    }

    @Test
    fun buildsMatchingOptionAndVideoInteractionPayloads() {
        val readOptions = CatoApiContract.matchingOptions(MatchingOptionType.CATEGORY, query = "tech")
        val option = CatoApiContract.addMatchingOption(MatchingOptionType.SKILL, "  Python  ")
        val feed = CatoApiContract.videoFeed(recruiter = false, limit = 10, offset = 20)
        val recruiterFeed = CatoApiContract.videoFeed(recruiter = true, limit = 15, offset = 5)
        val profile = CatoApiContract.publicApplicantProfile("applicant 1")
        val view = CatoApiContract.markVideoViewed("video1")
        val like = CatoApiContract.setVideoLike("video1", liked = true)
        val unlike = CatoApiContract.setVideoLike("video1", liked = false)

        assertEquals("GET", readOptions.method)
        assertEquals("/matching/options?type=category&limit=25&q=tech", readOptions.path)
        assertEquals("POST", option.method)
        assertEquals("/matching/options", option.path)
        assertEquals("skill", option.body["type"])
        assertEquals("Python", option.body["label"])
        assertEquals("GET", feed.method)
        assertEquals("/videos/feed?limit=10&offset=20", feed.path)
        assertEquals("/recruiter/videos/feed?limit=15&offset=5", recruiterFeed.path)
        assertEquals("/applicants/applicant%201/public-profile", profile.path)
        assertEquals("POST", view.method)
        assertEquals("/videos/video1/view", view.path)
        assertEquals("POST", like.method)
        assertEquals("DELETE", unlike.method)
        assertEquals("/videos/video1/like", unlike.path)
    }

    @Test
    fun buildsRuntimeSearchPayload() {
        val request = CatoApiContract.runtimeMatching(
            RuntimeSearchSpec(
                employmentType = RecruiterSearchEmploymentType.INTERNSHIP,
                targetCategories = listOf("technology"),
                requiredSkills = listOf("kotlin"),
                desiredDepth = MatchingDepth(MatchingOptionType.SKILL, "kotlin"),
                graduated = "false",
            )
        )

        assertEquals("POST", request.method)
        assertEquals("/matching/search/run", request.path)
        assertEquals("internship", request.body["employmentType"])
        assertEquals(listOf("technology"), request.body["targetCategories"])
        assertTrue(request.body.containsKey("desiredDepth"))
    }

    @Test
    fun buildsRuntimeSearchAuditPayload() {
        val request = CatoApiContract.auditRuntimeMatching(
            spec = RuntimeSearchSpec(requiredSkills = listOf("python")),
            applicantId = "app1",
        )

        assertEquals("POST", request.method)
        assertEquals("/matching/search/audit", request.path)
        assertEquals("app1", request.body["applicantId"])
        assertEquals(listOf("python"), request.body["requiredSkills"])
    }

    @Test
    fun buildsRecruiterJobPayloadForSavedRuntimeSearch() {
        val request = CatoApiContract.saveRecruiterSearch(
            name = "Technology interns",
            spec = RuntimeSearchSpec(
                employmentType = RecruiterSearchEmploymentType.INTERNSHIP,
                targetCategories = listOf("technology"),
                requiredSkills = listOf("kotlin"),
                graduated = "false",
                limit = 25,
            )
        )
        val capacity = request.body["capacity"] as Map<*, *>
        val semesterRange = request.body["preferredSemesterRange"] as Map<*, *>

        assertEquals("POST", request.method)
        assertEquals("/recruiter/jobs", request.path)
        assertEquals("Technology interns", request.body["title"])
        assertEquals("technology", request.body["roleCategory"])
        assertEquals("internship", request.body["employmentType"])
        assertEquals(25, capacity["maxAutoProposalsPerRun"])
        assertEquals(1, semesterRange["min"])
        assertEquals(99, semesterRange["max"])
    }

    @Test
    fun buildsRecruiterJobUpdatePayloadForGraduatedSearch() {
        val request = CatoApiContract.updateRecruiterSearch(
            jobId = "job1",
            name = "Graduate role",
            spec = RuntimeSearchSpec(graduated = "true")
        )
        val semesterRange = request.body["preferredSemesterRange"] as Map<*, *>

        assertEquals("PUT", request.method)
        assertEquals("/recruiter/jobs/job1", request.path)
        assertEquals(100, semesterRange["min"])
        assertEquals(100, semesterRange["max"])
    }

    @Test
    fun buildsApplicantReelUploadPayload() {
        val request = CatoApiContract.completeApplicantReelUpload(
            ApplicantReelUploadCommand(
                caption = "Built this during a hackathon",
                cloudinaryPublicId = "cato/reels/abc",
                secureUrl = "https://cdn.example.com/abc.mp4",
                contentType = "video/mp4",
                fileSizeBytes = 1234,
                durationSeconds = 42.0,
                orientation = "portrait",
                links = listOf(ApplicantVideoEvidenceLink("project", "p1")),
            )
        )

        assertEquals("POST", request.method)
        assertEquals("/applicant/reels/complete", request.path)
        assertEquals("Built this during a hackathon", request.body["caption"])
        assertEquals("cato/reels/abc", request.body["cloudinaryPublicId"])
        assertTrue(request.body["links"] is List<*>)
    }

    @Test
    fun buildsApplicantReadRequestSpecs() {
        assertEquals("/profile", CatoApiContract.applicantProfile().path)
        assertEquals("/resume", CatoApiContract.applicantResume().path)
        assertEquals("/applicant/reels", CatoApiContract.applicantReels().path)
        assertEquals("/applicant/accomplishments", CatoApiContract.applicantAccomplishments().path)
        assertEquals("/applicant/search-profile", CatoApiContract.applicantSearchProfile().path)
        assertEquals("/applicant/interest-requests", CatoApiContract.applicantInterestRequests().path)
        assertEquals("/applicant/activity", CatoApiContract.applicantActivity().path)
        assertEquals("/applicant/interest-requests/request%201/messages", CatoApiContract.applicantConversationMessages("request 1").path)
        assertEquals("/onboarding/status", CatoApiContract.applicantOnboardingStatus().path)
        assertEquals("/signal-prompts", CatoApiContract.signalPrompts().path)
    }

    @Test
    fun buildsApplicantReelMutationPayloads() {
        val prepare = CatoApiContract.prepareApplicantReelUpload()
        val caption = CatoApiContract.updateApplicantReelCaption("reel 1", " Updated caption ")
        val clearCaption = CatoApiContract.updateApplicantReelCaption("reel 1", null)
        val delete = CatoApiContract.deleteApplicantReel("reel 1")

        assertEquals("POST", prepare.method)
        assertEquals("/applicant/reels/upload-url", prepare.path)
        assertEquals("PATCH", caption.method)
        assertEquals("/applicant/reels/reel%201", caption.path)
        assertEquals(" Updated caption ", caption.body["caption"])
        assertTrue(clearCaption.body.containsKey("caption"))
        assertEquals(null, clearCaption.body["caption"])
        assertEquals("DELETE", delete.method)
        assertEquals("/applicant/reels/reel%201", delete.path)
    }

    @Test
    fun buildsApplicantProjectAndInternshipPayloads() {
        val project = CatoApiContract.createApplicantProject(
            ApplicantProjectCommand(
                title = "Portfolio",
                type = "built_project",
                description = "Built a recruiting app",
                linkUrl = "https://example.com",
            )
        )
        val internship = CatoApiContract.updateApplicantInternship(
            internshipId = "i1",
            command = ApplicantInternshipCommand(
                company = "Acme",
                roleDepartment = "Software Engineering",
                durationMonths = 3,
            )
        )

        assertEquals("/profile/projects", project.path)
        assertEquals("Portfolio", project.body["title"])
        assertEquals("/profile/internships/i1", internship.path)
        assertEquals(3, internship.body["durationMonths"])
    }

    @Test
    fun buildsApplicantConversationPayloads() {
        val respond = CatoApiContract.respondToApplicantInterestRequest("req1", ApplicantInterestAction.ACCEPT)
        val send = CatoApiContract.sendApplicantConversationMessage("req1", "Hello")

        assertEquals("/applicant/interest-requests/req1/respond", respond.path)
        assertEquals("accept", respond.body["action"])
        assertEquals("/applicant/interest-requests/req1/messages", send.path)
        assertEquals("Hello", send.body["body"])
    }

    @Test
    fun buildsApplicantAccountAndEducationPayloads() {
        val account = CatoApiContract.updateApplicantAccount("  Zoe Chen  ")
        val education = CatoApiContract.updateApplicantEducation(
            ApplicantEducationCommand(
                universityName = " Stanford University ",
                universityMatchedFromEmail = true,
                semesterLabel = "Sophomore / Semester 4",
                semesterNumber = 4,
                gpa = 3.8,
                major = " Computer Science ",
                minor = "",
            )
        )

        assertEquals("/profile/applicant", account.path)
        assertEquals("Zoe Chen", account.body["name"])
        assertEquals("/profile/education", education.path)
        assertEquals("Stanford University", education.body["universityName"])
        assertEquals(4, education.body["semesterNumber"])
        assertEquals("Computer Science", education.body["major"])
        assertFalse(education.body.containsKey("minor"))
    }

    @Test
    fun buildsApplicantOnboardingResumeAndConsentPayloads() {
        val education = CatoApiContract.saveApplicantOnboardingEducation(
            ApplicantOnboardingEducationCommand(
                universityName = "Harvard University",
                semesterLabel = "Freshman / Semester 1",
                semesterNumber = 1,
            )
        )
        val resume = CatoApiContract.uploadApplicantResume(
            ApplicantResumeUploadCommand(
                dataUri = "data:application/pdf;base64,abc",
                originalFileName = "resume.pdf",
                fileSizeBytes = 1000,
            )
        )
        val parsed = CatoApiContract.saveApplicantParsedResumeText(
            ApplicantParsedResumeTextCommand(
                text = "Resume text",
                sourceFileName = "resume.pdf",
                extractedSkills = listOf("kotlin"),
            )
        )
        val consent = CatoApiContract.acceptApplicantConsent(resume = true, privacyPolicy = true)

        assertEquals("/onboarding/education", education.path)
        assertEquals(false, education.body["universityMatchedFromEmail"])
        assertEquals("/resume/upload", resume.path)
        assertEquals("pdf", resume.body["fileType"])
        assertEquals("/resume/parsed-text", parsed.path)
        assertEquals("client", parsed.body["parser"])
        assertEquals("/privacy/consent", consent.path)
        assertEquals(true, consent.body["resume"])
        assertFalse(consent.body.containsKey("video"))
    }

    @Test
    fun buildsApplicantSignalVideoAndProfileCompletionPayloads() {
        val prompt = CatoApiContract.selectSignalPrompt("prompt1")
        val prepare = CatoApiContract.prepareApplicantVideoUpload("signal", "video/mp4", fileSizeBytes = 2000)
        val complete = CatoApiContract.completeApplicantVideoUpload(
            type = "signal",
            command = ApplicantSignalVideoCompleteCommand(
                cloudinaryPublicId = "cato/signal/1",
                secureUrl = "https://cdn.example.com/1.mp4",
                contentType = "video/mp4",
                durationSeconds = 9.0,
            )
        )
        val seen = CatoApiContract.markDeeperSignalSeen("  I led the backend  ")
        val profile = CatoApiContract.completeApplicantOnboardingProfile(
            ApplicantOnboardingProfileCommand(
                name = "Zoe",
                education = ApplicantEducation(
                    universityName = "Stanford",
                    semesterLabel = "Sophomore / Semester 4",
                    semesterNumber = 4,
                    universityMatchedFromEmail = true,
                    major = "Computer Science",
                ),
                gpa = 3.8,
                major = "Computer Science",
            )
        )

        assertEquals("/onboarding/signal-prompt", prompt.path)
        assertEquals("prompt1", prompt.body["promptId"])
        assertEquals("/videos/signal/upload-url", prepare.path)
        assertEquals(2000, prepare.body["fileSizeBytes"])
        assertEquals("/videos/signal/complete", complete.path)
        assertEquals("cato/signal/1", complete.body["cloudinaryPublicId"])
        assertEquals("/onboarding/deeper-signal/seen", seen.path)
        assertEquals("I led the backend", seen.body["elaboration"])
        assertEquals("/onboarding/profile", profile.path)
        assertEquals("Zoe", profile.body["name"])
        assertEquals(emptyList<Map<String, String>>(), profile.body["internships"])
    }

    @Test
    fun categorizesSseEventsLikeNativeSwift() {
        assertEquals(CatoSseEventCategory.MESSAGE, CatoSseEvent("message_sent", "{}").category)
        assertEquals(CatoSseEventCategory.INTEREST_REQUEST, CatoSseEvent("interest_request_sent", "{}").category)
        assertEquals(CatoSseEventCategory.INTEREST_REQUEST, CatoSseEvent("interest_request_responded", "{}").category)
        assertEquals(CatoSseEventCategory.GENERAL, CatoSseEvent("other", "{}").category)
    }

    @Test
    fun parsesSseChunksLikeNativeSwift() {
        val parser = CatoSseParser()

        val first = parser.receive("event: message_sent\ndata: {\"id\":")
        val second = parser.receive("\"m1\"}\ndata: second line\n\n: heartbeat\n\n")

        assertEquals(emptyList(), first)
        assertEquals(1, second.size)
        assertEquals("message_sent", second.single().name)
        assertEquals("{\"id\":\"m1\"}\nsecond line", second.single().data)
        assertEquals(CatoSseEventCategory.MESSAGE, second.single().category)
    }
}
