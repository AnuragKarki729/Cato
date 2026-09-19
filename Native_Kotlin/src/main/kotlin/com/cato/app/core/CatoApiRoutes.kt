package com.cato.app.core

import java.net.URLEncoder
import java.nio.charset.StandardCharsets

object CatoApiRoutes {
    const val AUTH_ROLE = "/auth/role"
    const val APPLICANT_AUTH_SYNC = "/auth/sync"
    const val RECRUITER_AUTH_SYNC = "/recruiter/auth/sync"
    const val APPLICANT_ACCOUNT = "/account"
    const val RECRUITER_ACCOUNT = "/recruiter/account"
    const val RECRUITER_DASHBOARD = "/recruiter/dashboard"
    const val RECRUITER_SAVED_FILTERS = "/recruiter/saved-filters"
    const val RECRUITER_JOBS = "/recruiter/jobs"
    const val RECRUITER_BOOKMARKS = "/recruiter/bookmarks"
    const val RECRUITER_INTEREST_REQUESTS = "/recruiter/interest-requests"
    const val RECRUITER_MESSAGES = "/recruiter/messages"
    const val RECRUITER_EVENTS = "/recruiter/events"
    const val RECRUITER_VIDEO_FEED = "/recruiter/videos/feed"
    const val PUBLIC_VIDEO_FEED = "/videos/feed"
    const val MATCHING_OPTIONS = "/matching/options"
    const val RUNTIME_MATCHING = "/matching/search/run"
    const val RUNTIME_MATCHING_AUDIT = "/matching/search/audit"
    const val APPLICANT_PROFILE = "/profile"
    const val APPLICANT_PROFILE_ACCOUNT = "/profile/applicant"
    const val APPLICANT_PROFILE_EDUCATION = "/profile/education"
    const val APPLICANT_ONBOARDING_STATUS = "/onboarding/status"
    const val APPLICANT_ONBOARDING_EDUCATION = "/onboarding/education"
    const val APPLICANT_ONBOARDING_RESUME_SKIP = "/onboarding/resume/skip"
    const val APPLICANT_RESUME = "/resume"
    const val APPLICANT_RESUME_UPLOAD = "/resume/upload"
    const val APPLICANT_RESUME_PARSED_TEXT = "/resume/parsed-text"
    const val APPLICANT_PRIVACY_CONSENT = "/privacy/consent"
    const val SIGNAL_PROMPTS = "/signal-prompts"
    const val APPLICANT_SIGNAL_PROMPT = "/onboarding/signal-prompt"
    const val APPLICANT_DEEPER_SIGNAL_SEEN = "/onboarding/deeper-signal/seen"
    const val APPLICANT_DEEPER_VIDEO_SKIP = "/onboarding/deeper-video/skip"
    const val APPLICANT_ONBOARDING_PROFILE = "/onboarding/profile"
    const val APPLICANT_SEARCH_PROFILE = "/applicant/search-profile"
    const val APPLICANT_ACTIVITY = "/applicant/activity"
    const val APPLICANT_INTEREST_REQUESTS = "/applicant/interest-requests"
    const val APPLICANT_REELS = "/applicant/reels"
    const val APPLICANT_REEL_UPLOAD_URL = "/applicant/reels/upload-url"
    const val APPLICANT_REEL_COMPLETE = "/applicant/reels/complete"
    const val APPLICANT_ACCOMPLISHMENTS = "/applicant/accomplishments"
    const val APPLICANT_EVENTS = "/applicant/events"
    const val APPLICANT_PROJECTS = "/profile/projects"
    const val APPLICANT_INTERNSHIPS = "/profile/internships"

    fun recruiterCandidates(filters: RecruiterCandidateSearchFilters = RecruiterCandidateSearchFilters()): String {
        return pathWithQuery("/recruiter/candidates", recruiterCandidateQuery(filters))
    }

    fun recruiterEvidenceQueue(filters: RecruiterCandidateSearchFilters = RecruiterCandidateSearchFilters()): String {
        return pathWithQuery("/recruiter/evidence-queue", recruiterCandidateQuery(filters))
    }

    fun recruiterCandidate(candidateId: String): String = "/recruiter/candidates/${candidateId.urlPath()}"

    fun recruiterJob(jobId: String): String = "/recruiter/jobs/${jobId.urlPath()}"

    fun recruiterCandidateProfileMedia(candidateId: String): String {
        return "/recruiter/candidates/${candidateId.urlPath()}/profile-media"
    }

    fun recruiterCandidateBookmark(candidateId: String): String {
        return "/recruiter/candidates/${candidateId.urlPath()}/bookmark"
    }

    fun recruiterCandidateActivity(candidateId: String): String {
        return "/recruiter/candidates/${candidateId.urlPath()}/activity"
    }

    fun recruiterCandidateReview(candidateId: String): String {
        return "/recruiter/candidates/${candidateId.urlPath()}/review"
    }

    fun recruiterCandidateInterest(candidateId: String): String {
        return "/recruiter/candidates/${candidateId.urlPath()}/interest"
    }

    fun recruiterCandidateContact(candidateId: String): String {
        return "/recruiter/candidates/${candidateId.urlPath()}/contact"
    }

    fun recruiterCandidateMessages(candidateId: String): String {
        return "/recruiter/candidates/${candidateId.urlPath()}/messages"
    }

    fun eventStream(role: CatoRole): String {
        return if (role == CatoRole.RECRUITER) RECRUITER_EVENTS else APPLICANT_EVENTS
    }

    fun applicantInterestRequestMessages(requestId: String): String {
        return "/applicant/interest-requests/${requestId.urlPath()}/messages"
    }

    fun applicantInterestRequestResponse(requestId: String): String {
        return "/applicant/interest-requests/${requestId.urlPath()}/respond"
    }

    fun matchingOptions(type: MatchingOptionType, query: String = "", limit: Int = 25): String {
        val queryItems = buildList {
            add("type" to type.wireValue)
            add("limit" to limit.toString())
            if (query.isNotBlank()) add("q" to query)
        }
        return pathWithQuery(MATCHING_OPTIONS, queryItems)
    }

    fun videoFeed(recruiter: Boolean, limit: Int = 20, offset: Int = 0): String {
        val basePath = if (recruiter) RECRUITER_VIDEO_FEED else PUBLIC_VIDEO_FEED
        return pathWithQuery(basePath, listOf("limit" to limit.toString(), "offset" to offset.toString()))
    }

    fun videoView(videoId: String): String = "/videos/${videoId.urlPath()}/view"

    fun videoLike(videoId: String): String = "/videos/${videoId.urlPath()}/like"

    fun applicantPublicProfile(applicantId: String): String = "/applicants/${applicantId.urlPath()}/public-profile"

    fun applicantVideoUploadUrl(type: String): String = "/videos/${type.urlPath()}/upload-url"

    fun applicantVideoComplete(type: String): String = "/videos/${type.urlPath()}/complete"

    fun applicantReel(reelId: String): String = "/applicant/reels/${reelId.urlPath()}"

    fun applicantProject(projectId: String): String = "/profile/projects/${projectId.urlPath()}"

    fun applicantInternship(internshipId: String): String = "/profile/internships/${internshipId.urlPath()}"

    private fun recruiterCandidateQuery(filters: RecruiterCandidateSearchFilters): List<Pair<String, String>> {
        return buildList {
            filters.q?.takeIf { it.isNotBlank() }?.let { add("q" to it) }
            filters.categoryFieldIds.forEach { add("categoryFieldIds" to it) }
            filters.universities.forEach { add("universities" to it) }
            filters.majors.forEach { add("majors" to it) }
            filters.semesterNumbers.forEach { add("semesterNumbers" to it.toString()) }
            filters.gpaMin?.let { add("gpaMin" to it.toString()) }
            filters.hasInternship?.let { add("hasInternship" to it.toString()) }
            filters.bookmarkedOnly?.let { add("bookmarkedOnly" to it.toString()) }
            filters.reviewStatus?.let { add("reviewStatus" to it.wireValue) }
        }
    }

    private fun pathWithQuery(path: String, queryItems: List<Pair<String, String>>): String {
        if (queryItems.isEmpty()) return path
        return path + "?" + queryItems.joinToString("&") { (key, value) ->
            "${key.urlQuery()}=${value.urlQuery()}"
        }
    }

    private fun String.urlPath(): String = URLEncoder.encode(this, StandardCharsets.UTF_8.toString()).replace("+", "%20")

    private fun String.urlQuery(): String = URLEncoder.encode(this, StandardCharsets.UTF_8.toString())
}
