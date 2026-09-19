package com.cato.app.state

import com.cato.app.core.CatoRole

sealed interface CatoRootRoute {
    data object Loading : CatoRootRoute
    data object SignedOut : CatoRootRoute
    data class SignedIn(val role: CatoRole) : CatoRootRoute
}

enum class ApplicantTab {
    HOME,
    REQUESTS,
    REELS,
    PROFILE,
    SETTINGS,
}

enum class RecruiterTab {
    HOME,
    SEARCH,
    REELS,
    MESSAGES,
    SETTINGS,
}

sealed interface RecruiterRoute {
    data object Dashboard : RecruiterRoute
    data object DynamicSearch : RecruiterRoute
    data object Reels : RecruiterRoute
    data object Messages : RecruiterRoute
    data object Settings : RecruiterRoute
    data object EvidenceQueue : RecruiterRoute
    data object Shortlist : RecruiterRoute
    data object AllInterestRequests : RecruiterRoute
    data class QuickSearchResults(val filterId: String, val title: String) : RecruiterRoute
    data class CandidateReview(val candidateId: String) : RecruiterRoute
    data class CandidateProfile(val candidateId: String) : RecruiterRoute
    data class ContactCandidate(val candidateId: String) : RecruiterRoute
    data class Conversation(val candidateId: String) : RecruiterRoute
}

sealed interface ApplicantRoute {
    data object Home : ApplicantRoute
    data object Requests : ApplicantRoute
    data object Reels : ApplicantRoute
    data object Profile : ApplicantRoute
    data object Settings : ApplicantRoute
    data object SearchProfileEditor : ApplicantRoute
    data object RecruiterPreview : ApplicantRoute
    data object ResumeUpload : ApplicantRoute
    data object ShortTakeUpload : ApplicantRoute
    data object DeeperSignalUpload : ApplicantRoute
    data object ProjectsManager : ApplicantRoute
    data object InternshipsManager : ApplicantRoute
    data object EducationEditor : ApplicantRoute
    data class Conversation(val recruiterId: String) : ApplicantRoute
    data class RequestDetail(val requestId: String) : ApplicantRoute
}

fun ApplicantActionTarget.toRoute(): ApplicantRoute {
    return when (this) {
        ApplicantActionTarget.RecruiterPreview -> ApplicantRoute.RecruiterPreview
        ApplicantActionTarget.ResumeUpload -> ApplicantRoute.ResumeUpload
        ApplicantActionTarget.ShortTakeUpload -> ApplicantRoute.ShortTakeUpload
        ApplicantActionTarget.DeeperSignalUpload -> ApplicantRoute.DeeperSignalUpload
        ApplicantActionTarget.ProjectsManager -> ApplicantRoute.ProjectsManager
        ApplicantActionTarget.InternshipsManager -> ApplicantRoute.InternshipsManager
        ApplicantActionTarget.ReelsProfile -> ApplicantRoute.Reels
        ApplicantActionTarget.SearchProfileEditor -> ApplicantRoute.SearchProfileEditor
        ApplicantActionTarget.EducationEditor -> ApplicantRoute.EducationEditor
    }
}

data class ShellChromeState(
    val isKeyboardVisible: Boolean = false,
    val unreadMessageCount: Int = 0,
) {
    val shouldShowBottomBar: Boolean
        get() = !isKeyboardVisible

    val unreadMessageBadge: String?
        get() = when {
            unreadMessageCount <= 0 -> null
            unreadMessageCount > 9 -> "9+"
            else -> unreadMessageCount.toString()
        }
}
