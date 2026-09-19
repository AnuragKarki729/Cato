package com.cato.nativeandroid

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Rect
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.text.Editable
import android.text.InputType
import android.text.TextUtils
import android.text.TextWatcher
import android.util.Base64
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.inputmethod.EditorInfo
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.MediaController
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.TextView
import android.widget.VideoView
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.ChatBubble
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Movie
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.IconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshotFlow
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.graphics.Color as ComposeColor
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.cato.app.core.ApplicantAccomplishmentCommand
import com.cato.app.core.ApplicantEducation
import com.cato.app.core.ApplicantEducationCommand
import com.cato.app.core.ApplicantInterestAction
import com.cato.app.core.ApplicantInternshipCommand
import com.cato.app.core.ApplicantOnboardingEducationCommand
import com.cato.app.core.ApplicantOnboardingProfileCommand
import com.cato.app.core.ApplicantOnboardingStatus
import com.cato.app.core.ApplicantParsedResumeTextCommand
import com.cato.app.core.ApplicantProjectCommand
import com.cato.app.core.ApplicantReelUploadCommand
import com.cato.app.core.ApplicantResumeUploadCommand
import com.cato.app.core.ApplicantSignalVideoCompleteCommand
import com.cato.app.core.ApplicantVideoEvidenceLink
import com.cato.app.core.ApiRequestSpec
import com.cato.app.core.CatoApiContract
import com.cato.app.core.CatoRole
import com.cato.app.core.CatoSseEventCategory
import com.cato.app.core.GoogleOAuthCallbackParser
import com.cato.app.core.MatchingDepth
import com.cato.app.core.MatchingOptionType
import com.cato.app.core.OAuthPkce
import com.cato.app.core.RecruiterCandidateSearchFilters
import com.cato.app.core.RecruiterSearchEmploymentType
import com.cato.app.core.RecruiterReviewStatus
import com.cato.app.core.RuntimeSearchSpec
import com.cato.app.core.SupabaseAuthContract
import com.cato.app.state.ApplicantTab
import com.cato.app.state.ResumeTextQuality
import com.cato.app.state.CatoRootRoute
import com.cato.app.state.RecruiterTab
import com.cato.app.state.ShellChromeState
import com.cato.app.ui.CatoButtonSpec
import com.cato.app.ui.CatoNavSpecs
import com.cato.app.ui.LoginScreenSpec
import com.cato.app.ui.RootScreenDestination
import com.cato.app.ui.toRootScreenSpec
import com.dinuscxj.progressbar.CircleProgressBar
import coil.compose.AsyncImage
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import java.io.ByteArrayInputStream
import java.util.zip.InflaterInputStream

private data class AndroidListRow(
    val id: String = "",
    val title: String,
    val subtitle: String,
    val badge: String = "",
    val unread: Boolean = false,
    val applicantId: String = "",
    val applicantName: String = "",
    val sourceType: String = "",
    val mediaUrl: String = "",
    val thumbnailUrl: String = "",
    val raw: String = "",
)

private data class SignalVideoSelection(
    val type: String,
    val bytes: ByteArray,
    val contentType: String,
    val fileName: String,
    val durationSeconds: Double,
    val returnToOnboarding: Boolean,
)

private data class ReelVideoSelection(
    val bytes: ByteArray,
    val contentType: String,
    val fileName: String,
    val durationSeconds: Double,
)

private data class ResumeUploadSelection(
    val command: ApplicantResumeUploadCommand,
    val extractedText: String?,
    val extractedSkills: List<String>,
    val extractionError: String?,
)

private class FillBoundsVideoView(context: Context) : VideoView(context) {
    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        setMeasuredDimension(
            View.MeasureSpec.getSize(widthMeasureSpec),
            View.MeasureSpec.getSize(heightMeasureSpec),
        )
    }
}

private class AspectFitVideoView(context: Context) : VideoView(context) {
    private var sourceWidth = 0
    private var sourceHeight = 0

    fun setSourceSize(width: Int, height: Int) {
        if (width <= 0 || height <= 0) return
        sourceWidth = width
        sourceHeight = height
        requestLayout()
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val parentWidth = View.MeasureSpec.getSize(widthMeasureSpec)
        val parentHeight = View.MeasureSpec.getSize(heightMeasureSpec)
        if (sourceWidth <= 0 || sourceHeight <= 0 || parentWidth <= 0 || parentHeight <= 0) {
            setMeasuredDimension(parentWidth, parentHeight)
            return
        }
        val sourceRatio = sourceWidth.toFloat() / sourceHeight.toFloat()
        val parentRatio = parentWidth.toFloat() / parentHeight.toFloat()
        val measuredWidth: Int
        val measuredHeight: Int
        if (sourceRatio > parentRatio) {
            measuredWidth = parentWidth
            measuredHeight = (parentWidth / sourceRatio).toInt()
        } else {
            measuredHeight = parentHeight
            measuredWidth = (parentHeight * sourceRatio).toInt()
        }
        setMeasuredDimension(measuredWidth, measuredHeight)
    }
}

class MainActivity : ComponentActivity() {
    private val colors = CatoAndroidColors()
    private val text = CatoAndroidText()
    private lateinit var runtime: CatoAndroidRuntime
    private lateinit var apiGateway: CatoAndroidApiGateway
    private var selectedRole = CatoRole.RECRUITER
    private var selectedRecruiterTab = RecruiterTab.HOME
    private var selectedApplicantTab = ApplicantTab.HOME
    private var recruiterDetail: String? = null
    private var recruiterCandidateProfileReturnDetail: String? = "candidate-review"
    private var applicantDetail: String? = null
    private var recruiterDeleteConfirmationVisible = false
    private var applicantDeleteConfirmationVisible = false
    private var applicantSettingsScrollY = 0
    private var recruiterReelIndex = 0
    private var applicantReelIndex = 0
    private var applicantPublicReelIndex = 0
    private var playingVideoKey = ""
    private var lastApiStatus: String? = null
    private var recruiterName = "Recruiter"
    private var recruiterCompany = "Company"
    private var recruiterEmail = ""
    private var recruiterAccountId = ""
    private var recruiterPlan = ""
    private var recruiterCandidateCount = "--"
    private var recruiterBookmarkCount = "0"
    private var recruiterMessageCount = "0"
    private var recruiterInterestRequestCount = "0"
    private var recruiterUnreadMessageCount = 0
    private var applicantName = "Applicant"
    private var applicantId = ""
    private var applicantEmail = ""
    private var applicantUniversityName = ""
    private var applicantMajor = ""
    private var applicantMinor = ""
    private var applicantSemesterLabel = ""
    private var applicantSemesterNumber = 1
    private var applicantGpa: Double? = null
    private var applicantProfileStrength = "--"
    private var applicantHasResumeSignal = false
    private var applicantHasIntroSignal = false
    private var applicantHasDeeperSignal = false
    private var applicantHasSoftSkillSignal = false
    private var applicantReelCount = "0"
    private var applicantProfileViews = "0"
    private var applicantBookmarkCount = "0"
    private var applicantShortlistCount = "0"
    private var applicantActivityRows = emptyList<AndroidListRow>()
    private var applicantManualProfileSummary = ""
    private var applicantResumeSummary = "No searchable resume text exists yet."
    private var applicantResumeUrl = ""
    private var resumeUploadReturnToOnboarding = false
    private var pendingSignalVideoType = ""
    private var pendingSignalVideoReturnToOnboarding = false
    private var pendingReelVideoSelection: ReelVideoSelection? = null
    private var pendingReelCaption = ""
    private var pendingReelEvidenceLinks = emptyList<ApplicantVideoEvidenceLink>()
    private var pendingReelEvidenceSection = "project"
    private var applicantOnboardingStatus = ApplicantOnboardingStatus.AUTH_COMPLETE
    private var applicantPromptRows = emptyList<AndroidListRow>()
    private var selectedSignalPromptId = ""
    private var applicantPromptsRequested = false
    private var applicantUnreadRequestCount = 0
    private var applicantManualSkillOptions = emptyList<AndroidListRow>()
    private var applicantManualFieldOptions = emptyList<AndroidListRow>()
    private var applicantManualSelectedSkills = emptyList<AndroidListRow>()
    private var applicantManualSelectedFields = emptyList<AndroidListRow>()
    private var applicantManualFieldQuery = ""
    private var applicantManualSkillQuery = ""
    private var applicantManualDepthType = MatchingOptionType.SKILL
    private var applicantManualDepthId = ""
    private var recruiterSearchRows = emptyList<AndroidListRow>()
    private var recruiterQuickSearchRows = emptyList<AndroidListRow>()
    private var recruiterDashboardRequested = false
    private var recruiterMessagesRequested = false
    private var recruiterQuickSearchRequested = false
    private var recruiterSearchOptionsRequested = false
    private var recruiterInterestRequestsRequested = false
    private var recruiterBookmarksRequested = false
    private var recruiterEvidenceQueueRequested = false
    private var recruiterShortlistRequested = false
    private var recruiterReelsRequested = false
    private var recruiterReelCandidatesRequested = false
    private var recruiterEventsRequested = false
    private var applicantHomeRequested = false
    private var applicantActivityRequested = false
    private var applicantRequestsRequested = false
    private var applicantProfileRequested = false
    private var applicantReelsRequested = false
    private var applicantPublicFeedRequested = false
    private var applicantManualOptionsRequested = false
    private var applicantResumeRequested = false
    private var applicantAccomplishmentsRequested = false
    private var applicantFinalSearchStatusRequested = false
    private var applicantEventsRequested = false
    private var recruiterSearchEmploymentType: RecruiterSearchEmploymentType? = null
    private var recruiterSearchGraduated = "any"
    private var recruiterSearchCategories = listOf<String>()
    private var recruiterSearchRequiredSkills = listOf<String>()
    private var recruiterSearchPreferredSkills = listOf<String>()
    private var recruiterSearchMinGpa: Double? = null
    private var recruiterSearchSemesterNumbers = listOf<Int>()
    private var recruiterFieldQuery = ""
    private var recruiterSkillQuery = ""
    private var recruiterSearchFieldOptions = emptyList<AndroidListRow>()
    private var recruiterSearchSkillOptions = emptyList<AndroidListRow>()
    private var recruiterSearchDepth: MatchingDepth? = null
    private var recruiterSearchName = "Untitled search"
    private var recruiterSearchCollapsed = false
    private var selectedRecruiterJobId = ""
    private var recruiterMessageRows = emptyList<AndroidListRow>()
    private var recruiterInterestRequestRows = emptyList<AndroidListRow>()
    private var recruiterBookmarkRows = emptyList<AndroidListRow>()
    private var recruiterEvidenceRows = emptyList<AndroidListRow>()
    private var recruiterShortlistRows = emptyList<AndroidListRow>()
    private var selectedShortlistComparisonIds = emptyList<String>()
    private var recruiterComparisonDetailRows = emptyMap<String, AndroidListRow>()
    private var applicantRequestRows = emptyList<AndroidListRow>()
    private var applicantSignalVideoRows = emptyList<AndroidListRow>()
    private var applicantReelRows = emptyList<AndroidListRow>()
    private var applicantPublicFeedRows = emptyList<AndroidListRow>()
    private var publicApplicantProfileName = "Applicant"
    private var publicApplicantProfileSubtitle = ""
    private var publicApplicantVideoRows = emptyList<AndroidListRow>()
    private var recruiterReelRows = emptyList<AndroidListRow>()
    private var selectedCandidateReelRows = emptyList<AndroidListRow>()
    private var selectedCandidateId = ""
    private var hydratedCandidateDetailId = ""
    private var hydratedCandidateMediaId = ""
    private var selectedCandidateName = "Candidate"
    private var selectedCandidateSubtitle = ""
    private var selectedCandidateAvatarUrl = ""
    private var selectedCandidateScore = "Runtime match"
    private var selectedCandidateProfileStrength = ""
    private var selectedCandidateSemesterLabel = ""
    private var selectedCandidateGpa = ""
    private var selectedCandidateSignalSummary = ""
    private var selectedCandidateReviewStatus = RecruiterReviewStatus.MAYBE
    private var selectedCandidateBookmarked = false
    private var selectedCandidateInterestStatus = ""
    private var selectedRequestId = ""
    private var selectedRequestTitle = "Request"
    private var selectedRequestSubtitle = "Interest request details will appear here."
    private var selectedRequestStatus = "sent"
    private var selectedProjectId = ""
    private var selectedInternshipId = ""
    private var projectDraftTitle = ""
    private var projectDraftType = "built_project"
    private var projectDraftDescription = ""
    private var projectDraftLink = ""
    private var internshipDraftCompany = ""
    private var internshipDraftRoleDepartment = "Engineering"
    private var internshipDraftDurationMonths = "1"
    private var reelEvidenceDraftTitle = ""
    private var reelEvidenceDraftDescription = ""
    private var reelEvidenceDraftLink = ""
    private var selectedReelId = ""
    private var selectedReelTitle = "Profile reel"
    private var selectedReelSubtitle = ""
    private var selectedReelApplicantId = ""
    private var selectedReelSourceType = "profile_reel"
    private var selectedReelLikeCount = "0 likes"
    private var selectedReelViewCount = "0 views"
    private var selectedReelMediaUrl = ""
    private var selectedReelRaw = ""
    private var locallyLikedReelIds = emptySet<String>()
    private var publicReelsCaughtUp = false
    private var publicReelSource = "feed"
    private var selectedCandidateResume = ""
    private var selectedCandidateResumeUrl = ""
    private var resumePreviewUrl = ""
    private var resumePreviewTitle = "Resume"
    private var resumePreviewReturnDetail: String? = null
    private var selectedCandidateEvidenceRows = emptyList<AndroidListRow>()
    private var selectedCandidateProjectRows = emptyList<AndroidListRow>()
    private var selectedCandidateInternshipRows = emptyList<AndroidListRow>()
    private var selectedCandidateAccomplishmentRows = emptyList<AndroidListRow>()
    private var selectedCandidateSoftSkillRows = emptyList<AndroidListRow>()
    private var selectedConversationRows = emptyList<AndroidListRow>()
    private var applicantProjectRows = emptyList<AndroidListRow>()
    private var applicantInternshipRows = emptyList<AndroidListRow>()
    private var applicantAccomplishmentRows = emptyList<AndroidListRow>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        runtime = CatoAndroidRuntime(applicationContext)
        apiGateway = CatoAndroidApiGateway(runtime)
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
        window.statusBarColor = colors.background
        window.navigationBarColor = colors.background
        if (handleOAuthCallback(intent)) return
        bootstrapStoredSession()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleOAuthCallback(intent)
    }

    @Deprecated("Uses the platform picker result for this dependency-free Android shell.")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_GOOGLE_SIGN_IN) {
            handleNativeGoogleSignInResult(data)
        } else if (requestCode == REQUEST_PICK_RESUME && resultCode == RESULT_OK) {
            val uri = data?.data
            if (uri == null) {
                lastApiStatus = "Choose a PDF resume before uploading."
                setContentView(applicantShell())
            } else {
                uploadResumeFromUri(uri)
            }
        } else if ((requestCode == REQUEST_PICK_SIGNAL_VIDEO || requestCode == REQUEST_RECORD_SIGNAL_VIDEO) && resultCode != RESULT_OK) {
            val returnToOnboarding = pendingSignalVideoReturnToOnboarding
            clearPendingSignalVideo()
            lastApiStatus = "Video recording or selection was cancelled."
            renderAfterSignalVideoUpload(returnToOnboarding)
        } else if (requestCode == REQUEST_PICK_SIGNAL_VIDEO && resultCode == RESULT_OK) {
            val uri = data?.data
            if (uri == null) {
                lastApiStatus = "Choose a video before uploading."
                renderAfterSignalVideoUpload()
            } else {
                uploadSignalVideoFromUri(uri)
            }
        } else if (requestCode == REQUEST_RECORD_SIGNAL_VIDEO && resultCode == RESULT_OK) {
            val uri = data?.data
            if (uri == null) {
                lastApiStatus = "Recorded video was not returned by the camera app. Try again or choose from gallery."
                renderAfterSignalVideoUpload()
            } else {
                uploadSignalVideoFromUri(uri)
            }
        } else if ((requestCode == REQUEST_PICK_REEL_VIDEO || requestCode == REQUEST_RECORD_REEL_VIDEO) && resultCode != RESULT_OK) {
            lastApiStatus = "Reel recording or selection was cancelled."
            applicantDetail = "reel-upload"
            setContentView(applicantShell())
        } else if (requestCode == REQUEST_PICK_REEL_VIDEO && resultCode == RESULT_OK) {
            val uri = data?.data
            if (uri == null) {
                lastApiStatus = "Choose a video before publishing a reel."
                setContentView(applicantShell())
            } else {
                readReelVideoFromUri(uri)
            }
        } else if (requestCode == REQUEST_RECORD_REEL_VIDEO && resultCode == RESULT_OK) {
            val uri = data?.data
            if (uri == null) {
                lastApiStatus = "Recorded reel was not returned by the camera app. Try again or choose from gallery."
                applicantDetail = "reel-upload"
                setContentView(applicantShell())
            } else {
                readReelVideoFromUri(uri)
            }
        }
    }

    override fun dispatchTouchEvent(event: MotionEvent): Boolean {
        if (event.action == MotionEvent.ACTION_DOWN) {
            val focusedView = currentFocus
            if (focusedView is EditText) {
                val bounds = Rect()
                focusedView.getGlobalVisibleRect(bounds)
                if (!bounds.contains(event.rawX.toInt(), event.rawY.toInt())) {
                    hideKeyboard()
                }
            }
        }
        return super.dispatchTouchEvent(event)
    }

    private fun bootstrapStoredSession() {
        if (runtime.sessionStore.accessTokenSynchronously() == null) {
            showRoot(CatoRootRoute.SignedOut)
            return
        }
        setContentView(loadingView())
        if (runtime.sessionStore.isExpiredSynchronously()) {
            apiGateway.refreshStoredSession { result ->
                runOnUiThread {
                    if (result.isSuccess) {
                        resolveStoredSessionRole()
                    } else {
                        runtime.sessionStore.clearSynchronously()
                        resetLoadedState()
                        showRoot(CatoRootRoute.SignedOut)
                    }
                }
            }
            return
        }
        resolveStoredSessionRole()
    }

    private fun resolveStoredSessionRole() {
        apiGateway.executeCato(CatoApiContract.getRole()) { result ->
            runOnUiThread {
                val role = result.getOrNull()
                    ?.takeIf { it.isSuccessful }
                    ?.body
                    ?.let { body -> CatoRole.entries.firstOrNull { it.wireValue == CatoAndroidJson.stringValue(body, "role") } }
                if (role == null) {
                    runtime.sessionStore.clearSynchronously()
                    resetLoadedState()
                    showRoot(CatoRootRoute.SignedOut)
                } else {
                    selectedRole = role
                    showRoot(CatoRootRoute.SignedIn(role))
                }
            }
        }
    }

    private fun showRoot(route: CatoRootRoute) {
        when (route.toRootScreenSpec().destination) {
            RootScreenDestination.LOADING -> setContentView(loadingView())
            RootScreenDestination.LOGIN -> setContentView(loginView())
            RootScreenDestination.APPLICANT_ONBOARDING -> loadApplicantOnboardingRoot()
            RootScreenDestination.RECRUITER_SHELL -> setContentView(recruiterShell())
        }
    }

    private fun resetLoadedState() {
        recruiterDashboardRequested = false
        recruiterMessagesRequested = false
        recruiterQuickSearchRequested = false
        recruiterSearchOptionsRequested = false
        recruiterInterestRequestsRequested = false
        recruiterBookmarksRequested = false
        recruiterEvidenceQueueRequested = false
        recruiterShortlistRequested = false
        recruiterReelsRequested = false
        recruiterReelCandidatesRequested = false
        recruiterEventsRequested = false
        applicantHomeRequested = false
        applicantActivityRequested = false
        applicantRequestsRequested = false
        applicantProfileRequested = false
        applicantReelsRequested = false
        applicantPublicFeedRequested = false
        applicantManualOptionsRequested = false
        applicantResumeRequested = false
        applicantAccomplishmentsRequested = false
        applicantFinalSearchStatusRequested = false
        applicantEventsRequested = false
        applicantPromptsRequested = false
        hydratedCandidateDetailId = ""
        hydratedCandidateMediaId = ""
        recruiterDeleteConfirmationVisible = false
        applicantDeleteConfirmationVisible = false
        recruiterComparisonDetailRows = emptyMap()
    }

    private fun requestOnce(flagName: String, request: ApiRequestSpec, label: String, redrawRecruiter: Boolean) {
        when (flagName) {
            "recruiter-dashboard" -> if (recruiterDashboardRequested) return else recruiterDashboardRequested = true
            "recruiter-messages" -> if (recruiterMessagesRequested) return else recruiterMessagesRequested = true
            "recruiter-quick-search" -> if (recruiterQuickSearchRequested) return else recruiterQuickSearchRequested = true
            "recruiter-interest-requests" -> if (recruiterInterestRequestsRequested) return else recruiterInterestRequestsRequested = true
            "recruiter-bookmarks" -> if (recruiterBookmarksRequested) return else recruiterBookmarksRequested = true
            "recruiter-evidence-queue" -> if (recruiterEvidenceQueueRequested) return else recruiterEvidenceQueueRequested = true
            "recruiter-shortlist" -> if (recruiterShortlistRequested) return else recruiterShortlistRequested = true
            "recruiter-reels" -> if (recruiterReelsRequested) return else recruiterReelsRequested = true
            "recruiter-reel-candidates" -> if (recruiterReelCandidatesRequested) return else recruiterReelCandidatesRequested = true
            "applicant-home" -> if (applicantHomeRequested) return else applicantHomeRequested = true
            "applicant-activity" -> if (applicantActivityRequested) return else applicantActivityRequested = true
            "applicant-requests" -> if (applicantRequestsRequested) return else applicantRequestsRequested = true
            "applicant-profile" -> if (applicantProfileRequested) return else applicantProfileRequested = true
            "applicant-reels" -> if (applicantReelsRequested) return else applicantReelsRequested = true
            "applicant-public-feed" -> if (applicantPublicFeedRequested) return else applicantPublicFeedRequested = true
            "applicant-resume" -> if (applicantResumeRequested) return else applicantResumeRequested = true
            "applicant-accomplishments" -> if (applicantAccomplishmentsRequested) return else applicantAccomplishmentsRequested = true
        }
        apiGateway.executeCato(request) { result ->
            runOnUiThread {
                val success = result.getOrNull()?.isSuccessful == true
                lastApiStatus = result.fold(
                    onSuccess = { response ->
                        if (response.isSuccessful) {
                            hydrateFromApi(label, response.body)
                            null
                        } else {
                            "$label responded ${response.statusCode}."
                        }
                    },
                    onFailure = { error -> "$label failed: ${error.message ?: "Unknown error"}" },
                )
                setContentView(if (redrawRecruiter) recruiterShell() else applicantShell())
                if (!success) {
                    resetRequestOnceFlag(flagName)
                }
            }
        }
    }

    private fun resetRequestOnceFlag(flagName: String) {
        when (flagName) {
            "recruiter-dashboard" -> recruiterDashboardRequested = false
            "recruiter-messages" -> recruiterMessagesRequested = false
            "recruiter-quick-search" -> recruiterQuickSearchRequested = false
            "recruiter-interest-requests" -> recruiterInterestRequestsRequested = false
            "recruiter-bookmarks" -> recruiterBookmarksRequested = false
            "recruiter-evidence-queue" -> recruiterEvidenceQueueRequested = false
            "recruiter-shortlist" -> recruiterShortlistRequested = false
            "recruiter-reels" -> recruiterReelsRequested = false
            "recruiter-reel-candidates" -> recruiterReelCandidatesRequested = false
            "applicant-home" -> applicantHomeRequested = false
            "applicant-activity" -> applicantActivityRequested = false
            "applicant-requests" -> applicantRequestsRequested = false
            "applicant-profile" -> applicantProfileRequested = false
            "applicant-reels" -> applicantReelsRequested = false
            "applicant-public-feed" -> applicantPublicFeedRequested = false
            "applicant-resume" -> applicantResumeRequested = false
            "applicant-accomplishments" -> applicantAccomplishmentsRequested = false
        }
    }

    private fun requestRecruiterSearchOptionsOnce() {
        if (recruiterSearchOptionsRequested) return
        recruiterSearchOptionsRequested = true
        apiGateway.executeCato(CatoApiContract.matchingOptions(MatchingOptionType.CATEGORY)) { fieldResult ->
            runOnUiThread {
                fieldResult.getOrNull()?.takeIf { it.isSuccessful }?.let { response ->
                    hydrateFromApi("recruiter field options", response.body)
                }
            }
            apiGateway.executeCato(CatoApiContract.matchingOptions(MatchingOptionType.SKILL)) { skillResult ->
                runOnUiThread {
                    val success = fieldResult.getOrNull()?.isSuccessful == true && skillResult.getOrNull()?.isSuccessful == true
                    lastApiStatus = skillResult.fold(
                        onSuccess = { response ->
                            if (response.isSuccessful) {
                                hydrateFromApi("recruiter skill options", response.body)
                                null
                            } else {
                                "recruiter skill options responded ${response.statusCode}."
                            }
                        },
                        onFailure = { error -> "recruiter search options failed: ${error.message ?: "Unknown error"}" },
                    )
                    setContentView(recruiterShell())
                    if (!success) recruiterSearchOptionsRequested = false
                }
            }
        }
    }

    private fun refreshRecruiterSearchOptions() {
        lastApiStatus = "Refreshing search options..."
        apiGateway.executeCato(CatoApiContract.matchingOptions(MatchingOptionType.CATEGORY)) { fieldResult ->
            runOnUiThread {
                fieldResult.getOrNull()?.takeIf { it.isSuccessful }?.let { response ->
                    hydrateFromApi("recruiter field options", response.body)
                }
            }
            apiGateway.executeCato(CatoApiContract.matchingOptions(MatchingOptionType.SKILL)) { skillResult ->
                runOnUiThread {
                    lastApiStatus = skillResult.fold(
                        onSuccess = { response ->
                            if (response.isSuccessful) {
                                hydrateFromApi("recruiter skill options", response.body)
                                "Search options refreshed."
                            } else {
                                "recruiter skill options responded ${response.statusCode}."
                            }
                        },
                        onFailure = { error -> "recruiter search options failed: ${error.message ?: "Unknown error"}" },
                    )
                    setContentView(recruiterShell())
                }
            }
        }
    }

    private fun requestApplicantPromptsOnce() {
        if (applicantPromptsRequested) return
        applicantPromptsRequested = true
        apiGateway.executeCato(CatoApiContract.signalPrompts()) { result ->
            runOnUiThread {
                lastApiStatus = result.fold(
                    onSuccess = { response ->
                        if (response.isSuccessful) {
                            hydrateFromApi("signal prompts", response.body)
                            null
                        } else {
                            "signal prompts responded ${response.statusCode}."
                        }
                    },
                    onFailure = { error ->
                        "signal prompts failed: ${error.message ?: "Unknown error"}"
                    },
                )
                setContentView(applicantOnboarding())
                if (result.getOrNull()?.isSuccessful != true) {
                    applicantPromptsRequested = false
                }
            }
        }
    }

    private fun requestApplicantManualOptionsOnce() {
        if (applicantManualOptionsRequested) return
        applicantManualOptionsRequested = true
        apiGateway.executeCato(CatoApiContract.applicantSearchProfile()) { profileResult ->
            runOnUiThread {
                profileResult.getOrNull()?.takeIf { it.isSuccessful }?.let { response ->
                    hydrateFromApi("load current setup", response.body)
                }
            }
            apiGateway.executeCato(CatoApiContract.matchingOptions(MatchingOptionType.CATEGORY)) { fieldResult ->
                runOnUiThread {
                    fieldResult.getOrNull()?.takeIf { it.isSuccessful }?.let { response ->
                        hydrateFromApi("manual field options", response.body)
                    }
                }
                apiGateway.executeCato(CatoApiContract.matchingOptions(MatchingOptionType.SKILL)) { skillResult ->
                    runOnUiThread {
                        val success = profileResult.getOrNull()?.isSuccessful == true &&
                            fieldResult.getOrNull()?.isSuccessful == true &&
                            skillResult.getOrNull()?.isSuccessful == true
                        lastApiStatus = skillResult.fold(
                            onSuccess = { response ->
                                if (response.isSuccessful) {
                                    hydrateFromApi("manual skill options", response.body)
                                    null
                                } else {
                                    "manual skill options responded ${response.statusCode}."
                                }
                            },
                            onFailure = { error -> "manual matching options failed: ${error.message ?: "Unknown error"}" },
                        )
                        setContentView(applicantShell())
                        if (!success) applicantManualOptionsRequested = false
                    }
                }
            }
        }
    }

    private fun requestApplicantFinalSearchStatusOnce() {
        if (applicantFinalSearchStatusRequested) return
        applicantFinalSearchStatusRequested = true
        apiGateway.executeCato(CatoApiContract.applicantResume()) { resumeResult ->
            runOnUiThread {
                resumeResult.getOrNull()?.takeIf { it.isSuccessful }?.let { response ->
                    hydrateFromApi("applicant resume", response.body)
                }
            }
            apiGateway.executeCato(CatoApiContract.applicantSearchProfile()) { profileResult ->
                runOnUiThread {
                    val success = resumeResult.getOrNull()?.isSuccessful == true && profileResult.getOrNull()?.isSuccessful == true
                    lastApiStatus = profileResult.fold(
                        onSuccess = { response ->
                            if (response.isSuccessful) {
                                hydrateFromApi("load current setup", response.body)
                                null
                            } else {
                                "load current setup responded ${response.statusCode}."
                            }
                        },
                        onFailure = { error -> "manual matching status failed: ${error.message ?: "Unknown error"}" },
                    )
                    setContentView(applicantOnboarding())
                    if (!success) applicantFinalSearchStatusRequested = false
                }
            }
        }
    }

    private fun loadApplicantOnboardingRoot() {
        setContentView(loadingView())
        apiGateway.executeCato(CatoApiContract.applicantOnboardingStatus()) { result ->
            runOnUiThread {
                val response = result.getOrNull()
                if (result.isSuccess && response?.isSuccessful == true) {
                    hydrateFromApi("applicant onboarding status", response.body)
                    if (
                        applicantOnboardingStatus == ApplicantOnboardingStatus.ONBOARDING_COMPLETE ||
                        applicantOnboardingStatus == ApplicantOnboardingStatus.PROFILE_FORM_COMPLETE
                    ) {
                        setContentView(applicantShell())
                    } else {
                        setContentView(applicantOnboarding())
                    }
                } else {
                    lastApiStatus = "Could not load onboarding: ${result.exceptionOrNull()?.message ?: response?.body ?: "Unknown error"}"
                    setContentView(applicantOnboarding())
                }
            }
        }
    }

    private fun loadingView(): View {
        return frame {
            addView(vertical(spacing = 10) {
                gravity = Gravity.CENTER
                addView(ImageView(this@MainActivity).apply {
                    setImageResource(R.drawable.cato_leaf)
                    adjustViewBounds = true
                }, LinearLayout.LayoutParams(dp(54), dp(54)).apply {
                    gravity = Gravity.CENTER_HORIZONTAL
                })
                addView(label("Connecting to Cato", 18, colors.textPrimary).apply {
                    gravity = Gravity.CENTER
                })
            }, centeredParams())
        }
    }

    private fun loginView(): View {
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    LoginScreen()
                }
            }
        }
    }

    @Composable
    private fun LoginScreen() {
        var email by remember { mutableStateOf("") }
        var password by remember { mutableStateOf("") }
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = ComposeColor(colors.background),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 24.dp, vertical = 56.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                CatoWordmark(fontSize = 46, leafSize = 34)
                Text("From search to strong shortlists.", color = ComposeColor(colors.textSecondary), fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
                lastApiStatus?.let { MaterialStatusCard(it) }
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
                    shape = RoundedCornerShape(26.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        MaterialConfigCard()
                        RoleToggleChips()
                        OutlinedTextField(
                            value = email,
                            onValueChange = { email = it },
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Email") },
                            singleLine = true,
                            shape = RoundedCornerShape(16.dp),
                            colors = polishedTextFieldColors(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        )
                        OutlinedTextField(
                            value = password,
                            onValueChange = { password = it },
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Password") },
                            singleLine = true,
                            shape = RoundedCornerShape(16.dp),
                            colors = polishedTextFieldColors(),
                            visualTransformation = PasswordVisualTransformation(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        )
                        Button(
                            onClick = { signInWithPassword(email, password) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(54.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ComposeColor(colors.accent)),
                        ) {
                            Text("Login", fontWeight = FontWeight.Bold)
                        }
                        OutlinedButton(
                            onClick = { startGoogleSignIn() },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(54.dp),
                            shape = RoundedCornerShape(16.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
                        ) {
                            Text("Continue with Google", fontWeight = FontWeight.Bold, color = ComposeColor(colors.textPrimary))
                        }
                    }
                }
                Text("Better hires, brighter futures.", color = ComposeColor(colors.textSecondary), fontSize = 14.sp)
            }
        }
    }

    @Composable
    private fun RoleToggleChips() {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            CatoRole.entries.forEach { role ->
                FilterChip(
                    selected = selectedRole == role,
                    onClick = {
                        selectedRole = role
                        setContentView(loginView())
                    },
                    label = { Text(role.wireValue.replaceFirstChar { it.uppercase() }) },
                )
            }
        }
    }

    @Composable
    private fun CatoActivityMaterialTheme(
        colors: CatoAndroidColors,
        content: @Composable () -> Unit,
    ) {
        MaterialTheme(
            colorScheme = lightColorScheme(
                primary = ComposeColor(colors.accent),
                onPrimary = ComposeColor(colors.onAccent),
                background = ComposeColor(colors.background),
                onBackground = ComposeColor(colors.textPrimary),
                surface = ComposeColor(colors.surface),
                onSurface = ComposeColor(colors.textPrimary),
                secondary = ComposeColor(colors.textSecondary),
            ),
            content = content,
        )
    }

    @Composable
    private fun CatoWordmark(fontSize: Int = 30, leafSize: Int = 22) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(5.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Cato", color = ComposeColor(colors.textPrimary), fontSize = fontSize.sp, fontWeight = FontWeight.Bold)
            Image(
                painter = painterResource(id = R.drawable.cato_leaf),
                contentDescription = null,
                modifier = Modifier.size(leafSize.dp),
            )
        }
    }

    @Composable
    private fun MaterialConfigCard() {
        val status = runtime.loadConfig().fold(
            onSuccess = { "Connected to configured Cato services." },
            onFailure = { it.message ?: "Native Android configuration is missing." },
        )
        MaterialInfoCard("Configuration", status)
    }

    @Composable
    private fun MaterialStatusCard(message: String) {
        MaterialInfoCard("Status", message)
    }

    @Composable
    private fun polishedTextFieldColors() = OutlinedTextFieldDefaults.colors(
        focusedContainerColor = ComposeColor(colors.surface),
        unfocusedContainerColor = ComposeColor(colors.surface),
        focusedBorderColor = ComposeColor(colors.accent),
        unfocusedBorderColor = ComposeColor(colors.border),
        focusedLabelColor = ComposeColor(colors.accent),
        unfocusedLabelColor = ComposeColor(colors.textSecondary),
        cursorColor = ComposeColor(colors.accent),
        focusedTextColor = ComposeColor(colors.textPrimary),
        unfocusedTextColor = ComposeColor(colors.textPrimary),
    )

    @Composable
    private fun MaterialInfoCard(title: String, body: String) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(22.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text(title, color = ComposeColor(colors.textPrimary), fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text(body, color = ComposeColor(colors.textSecondary), fontSize = 15.sp)
            }
        }
    }

    private fun signInWithPassword(email: String, password: String) {
        lastApiStatus = "Signing in..."
        setContentView(loginView())
        apiGateway.signInWithPassword(email, password, selectedRole) { result ->
            runOnUiThread {
                result.fold(
                    onSuccess = { role ->
                        lastApiStatus = null
                        selectedRole = role
                        showRoot(CatoRootRoute.SignedIn(role))
                    },
                    onFailure = { error ->
                        lastApiStatus = "Sign-in failed: ${error.message ?: "Unknown error"}"
                        setContentView(loginView())
                    },
                )
            }
        }
    }

    private fun startGoogleSignIn() {
        val webClientId = BuildConfig.CATO_GOOGLE_WEB_CLIENT_ID.trim()
        if (webClientId.isBlank()) {
            lastApiStatus = "Google sign-in is missing CATO_GOOGLE_WEB_CLIENT_ID in local.properties."
            setContentView(loginView())
            return
        }
        lastApiStatus = "Opening Google account picker..."
        setContentView(loginView())
        runCatching {
            val options = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(webClientId)
                .requestEmail()
                .build()
            val client = GoogleSignIn.getClient(this, options)
            client.signOut().addOnCompleteListener {
                startActivityForResult(client.signInIntent, REQUEST_GOOGLE_SIGN_IN)
            }
        }.onFailure { error ->
            lastApiStatus = "Google account picker could not be opened: ${error.message ?: "Unknown error"}"
            setContentView(loginView())
        }
    }

    private fun handleNativeGoogleSignInResult(data: Intent?) {
        lastApiStatus = "Completing Google sign-in..."
        setContentView(loadingView())
        val account = runCatching {
            GoogleSignIn.getSignedInAccountFromIntent(data).getResult(ApiException::class.java)
        }.getOrElse { error ->
            val message = if (error is ApiException) {
                "Google sign-in failed (${error.statusCode}). Check Android OAuth package/SHA and Web client ID."
            } else {
                "Google sign-in failed: ${error.message ?: "Unknown error"}"
            }
            lastApiStatus = message
            setContentView(loginView())
            return
        }
        val idToken = account.idToken
        if (idToken.isNullOrBlank()) {
            lastApiStatus = "Google sign-in failed: no ID token returned. Check CATO_GOOGLE_WEB_CLIENT_ID."
            setContentView(loginView())
            return
        }
        apiGateway.signInWithGoogleIdToken(idToken, selectedRole) { result ->
            runOnUiThread {
                result.fold(
                    onSuccess = { resolvedRole ->
                        lastApiStatus = null
                        selectedRole = resolvedRole
                        showRoot(CatoRootRoute.SignedIn(resolvedRole))
                    },
                    onFailure = { error ->
                        lastApiStatus = "Google sign-in failed: ${error.message ?: "Unknown error"}"
                        setContentView(loginView())
                    },
                )
            }
        }
    }

    private fun handleOAuthCallback(intent: Intent?): Boolean {
        val callbackUrl = intent?.dataString ?: return false
        if (!callbackUrl.startsWith(GOOGLE_REDIRECT_URI)) return false
        val codeVerifier = googleOAuthPreferences().getString(KEY_GOOGLE_CODE_VERIFIER, null).orEmpty()
        val role = CatoRole.entries.firstOrNull {
            it.wireValue == googleOAuthPreferences().getString(KEY_GOOGLE_ROLE, null)
        } ?: selectedRole

        return when (val callback = GoogleOAuthCallbackParser.parse(callbackUrl)) {
            is com.cato.app.core.GoogleOAuthCallbackResult.Success -> {
                lastApiStatus = "Completing Google sign-in..."
                setContentView(loadingView())
                apiGateway.exchangeGooglePkceCode(callback.code, codeVerifier, role) { result ->
                    runOnUiThread {
                        clearGoogleOAuthState()
                        result.fold(
                            onSuccess = { resolvedRole ->
                                lastApiStatus = null
                                selectedRole = resolvedRole
                                showRoot(CatoRootRoute.SignedIn(resolvedRole))
                            },
                            onFailure = { error ->
                                lastApiStatus = "Google sign-in failed: ${error.message ?: "Unknown error"}"
                                setContentView(loginView())
                            },
                        )
                    }
                }
                true
            }
            is com.cato.app.core.GoogleOAuthCallbackResult.Failure -> {
                clearGoogleOAuthState()
                lastApiStatus = "Google sign-in failed: ${callback.message}"
                setContentView(loginView())
                true
            }
        }
    }

    private fun saveGoogleOAuthState(codeVerifier: String, role: CatoRole) {
        googleOAuthPreferences().edit()
            .putString(KEY_GOOGLE_CODE_VERIFIER, codeVerifier)
            .putString(KEY_GOOGLE_ROLE, role.wireValue)
            .apply()
    }

    private fun clearGoogleOAuthState() {
        googleOAuthPreferences().edit().clear().apply()
    }

    private fun googleOAuthPreferences() = getSharedPreferences("cato_google_oauth", Context.MODE_PRIVATE)

    private fun chooseResumePdf(returnToOnboarding: Boolean = false) {
        resumeUploadReturnToOnboarding = returnToOnboarding
        runCatching {
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                setType("application/pdf")
            }
            startActivityForResult(intent, REQUEST_PICK_RESUME)
        }.onFailure { error ->
            val shouldReturnToOnboarding = resumeUploadReturnToOnboarding
            resumeUploadReturnToOnboarding = false
            lastApiStatus = "Could not open PDF picker: ${error.message ?: "Unknown error"}"
            setContentView(if (shouldReturnToOnboarding) applicantOnboarding() else applicantShell())
        }
    }

    private fun uploadResumeFromUri(uri: Uri) {
        lastApiStatus = "Reading resume..."
        setContentView(if (resumeUploadReturnToOnboarding) applicantOnboarding() else applicantShell())
        Thread {
            val result = runCatching {
                val bytes = contentResolver.openInputStream(uri)?.use { input -> input.readBytes() }
                    ?: throw IllegalStateException("Could not read the selected PDF.")
                if (bytes.isEmpty()) throw IllegalStateException("Resume PDF is empty.")
                if (bytes.size > MAX_RESUME_BYTES) throw IllegalStateException("Resume must be 10 MB or smaller.")
                val isPdf = bytes.size >= 4 && bytes[0] == 0x25.toByte() && bytes[1] == 0x50.toByte() && bytes[2] == 0x44.toByte() && bytes[3] == 0x46.toByte()
                if (!isPdf) throw IllegalStateException("Please choose a PDF resume.")
                buildResumeUploadSelection(uri, bytes)
            }
            runOnUiThread {
                result.fold(
                    onSuccess = { selection -> uploadResumeCommand(selection) },
                    onFailure = { error ->
                        val shouldReturnToOnboarding = resumeUploadReturnToOnboarding
                        resumeUploadReturnToOnboarding = false
                        lastApiStatus = "Resume upload failed: ${error.message ?: "Unknown error"}"
                        setContentView(if (shouldReturnToOnboarding) applicantOnboarding() else applicantShell())
                    },
                )
            }
        }.start()
    }

    private fun buildResumeUploadSelection(uri: Uri, bytes: ByteArray): ResumeUploadSelection {
        val fileName = resumeFileName(uri)
        val extraction = runCatching { extractPdfTextBestEffort(bytes) }
        val extractedText = extraction.getOrNull()
        return ResumeUploadSelection(
            command = ApplicantResumeUploadCommand(
                dataUri = "data:application/pdf;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP),
                originalFileName = fileName,
                fileSizeBytes = bytes.size,
            ),
            extractedText = extractedText,
            extractedSkills = extractedText?.let { ResumeTextQuality.extractKnownSkills(it) }.orEmpty(),
            extractionError = extraction.exceptionOrNull()?.message,
        )
    }

    private fun uploadResumeCommand(selection: ResumeUploadSelection) {
        lastApiStatus = "Uploading resume..."
        setContentView(if (resumeUploadReturnToOnboarding) applicantOnboarding() else applicantShell())
        apiGateway.executeCato(CatoApiContract.acceptApplicantConsent(resume = true, privacyPolicy = true)) { consentResult ->
            val consentResponse = consentResult.getOrNull()
            if (consentResult.isFailure || consentResponse?.isSuccessful != true) {
                runOnUiThread {
                    resumeUploadReturnToOnboarding = false
                    lastApiStatus = "Resume consent failed: ${consentResult.exceptionOrNull()?.message ?: consentResponse?.body ?: "Unknown error"}"
                    setContentView(applicantShell())
                }
                return@executeCato
            }
            apiGateway.executeCato(CatoApiContract.uploadApplicantResume(selection.command)) { uploadResult ->
                runOnUiThread {
                    val response = uploadResult.getOrNull()
                    val shouldReturnToOnboarding = resumeUploadReturnToOnboarding
                    resumeUploadReturnToOnboarding = false
                    if (uploadResult.isSuccess && response?.isSuccessful == true) {
                        hydrateFromApi("applicant resume", response.body)
                        applicantHasResumeSignal = applicantResumeUrl.isNotBlank()
                        applicantResumeRequested = false
                        applicantProfileRequested = false
                        if (applicantResumeUrl.isBlank()) {
                            applicantResumeSummary = "Resume uploaded. Refresh resume status to verify searchable text."
                        }
                        if (shouldReturnToOnboarding) {
                            applicantOnboardingStatus = ApplicantOnboardingStatus.RESUME_COMPLETE
                        }
                        if (selection.extractedText != null) {
                            lastApiStatus = "Resume uploaded. Saving searchable resume text..."
                            setContentView(if (shouldReturnToOnboarding) applicantOnboarding() else applicantShell())
                            val parsedCommand = ApplicantParsedResumeTextCommand(
                                text = selection.extractedText,
                                sourceFileName = selection.command.originalFileName,
                                extractedSkills = selection.extractedSkills,
                            )
                            apiGateway.executeCato(CatoApiContract.saveApplicantParsedResumeText(parsedCommand)) { parsedResult ->
                                runOnUiThread {
                                    val parsedResponse = parsedResult.getOrNull()
                                    if (parsedResult.isSuccess && parsedResponse?.isSuccessful == true) {
                                        applicantHasResumeSignal = true
                                        applicantFinalSearchStatusRequested = false
                                        applicantResumeSummary = "Resume extracted. Recruiter search can now use your resume text.\nFile: ${selection.command.originalFileName}"
                                        lastApiStatus = "Resume uploaded and searchable text saved."
                                    } else {
                                        applicantResumeSummary = "Resume uploaded, but searchable text could not be saved. Add matching fields manually so recruiters can still find you.\nFile: ${selection.command.originalFileName}"
                                        lastApiStatus = "Resume uploaded, but text save failed: ${parsedResult.exceptionOrNull()?.message ?: parsedResponse?.body ?: "Unknown error"}"
                                        if (!shouldReturnToOnboarding) applicantDetail = "manual-matching"
                                    }
                                    setContentView(if (shouldReturnToOnboarding) applicantOnboarding() else applicantShell())
                                }
                            }
                            return@runOnUiThread
                        }
                        if (selection.extractionError != null) {
                            applicantResumeSummary = "Resume uploaded, but Cato could not extract reliable text from it. Add matching fields manually so recruiters can still find you.\nReason: ${selection.extractionError}\nFile: ${selection.command.originalFileName}"
                            lastApiStatus = "Resume uploaded. Manual matching fields are needed because text extraction failed."
                            if (!shouldReturnToOnboarding) applicantDetail = "manual-matching"
                        } else {
                            lastApiStatus = "Resume uploaded."
                        }
                    } else {
                        lastApiStatus = "Resume upload failed: ${uploadResult.exceptionOrNull()?.message ?: response?.body ?: "Unknown error"}"
                    }
                    setContentView(if (shouldReturnToOnboarding) applicantOnboarding() else applicantShell())
                }
            }
        }
    }

    private fun resumeFileName(uri: Uri): String {
        return uri.lastPathSegment
            ?.substringAfterLast('/')
            ?.takeIf { it.isNotBlank() && it.endsWith(".pdf", ignoreCase = true) }
            ?: "resume.pdf"
    }

    private fun extractPdfTextBestEffort(bytes: ByteArray): String {
        val pdf = String(bytes, Charsets.ISO_8859_1)
        val streamText = PDF_STREAM_REGEX.findAll(pdf)
            .mapNotNull { match ->
                val dictionaryStart = (match.range.first - 700).coerceAtLeast(0)
                val dictionary = pdf.substring(dictionaryStart, match.range.first)
                val streamBytes = match.groupValues[1].trim('\r', '\n').toByteArray(Charsets.ISO_8859_1)
                val decodedBytes = if (dictionary.contains("/FlateDecode")) {
                    inflatePdfStream(streamBytes) ?: streamBytes
                } else {
                    streamBytes
                }
                extractPdfTextOperators(String(decodedBytes, Charsets.ISO_8859_1))
            }
            .filter { it.isNotBlank() }
            .joinToString(" ")
        val fallbackText = extractPdfTextOperators(pdf)
        val normalized = listOf(streamText, fallbackText)
            .filter { it.isNotBlank() }
            .joinToString(" ")
            .replace(Regex("\\s+"), " ")
            .trim()
        ResumeTextQuality.errorFor(normalized)?.let { error -> throw IllegalStateException(error.message) }
        return normalized
    }

    private fun inflatePdfStream(bytes: ByteArray): ByteArray? {
        return runCatching {
            InflaterInputStream(ByteArrayInputStream(bytes)).use { input -> input.readBytes() }
        }.getOrNull()
    }

    private fun extractPdfTextOperators(content: String): String {
        val pieces = mutableListOf<String>()
        PDF_LITERAL_STRING_REGEX.findAll(content).forEach { match ->
            pieces += decodePdfLiteralString(match.value.drop(1).dropLast(1))
        }
        PDF_HEX_STRING_REGEX.findAll(content).forEach { match ->
            pieces += decodePdfHexString(match.groupValues[1])
        }
        return pieces
            .map { it.replace(Regex("\\s+"), " ").trim() }
            .filter { text -> text.count { it.isLetterOrDigit() } >= 2 }
            .joinToString(" ")
    }

    private fun decodePdfLiteralString(value: String): String {
        val output = StringBuilder()
        var index = 0
        while (index < value.length) {
            val current = value[index]
            if (current != '\\' || index == value.lastIndex) {
                output.append(current)
                index += 1
                continue
            }
            val next = value[index + 1]
            when (next) {
                'n' -> output.append('\n')
                'r' -> output.append('\r')
                't' -> output.append('\t')
                'b' -> output.append('\b')
                'f' -> output.append('\u000C')
                '(', ')', '\\' -> output.append(next)
                '\n', '\r' -> Unit
                in '0'..'7' -> {
                    val octal = value.substring(index + 1, (index + 4).coerceAtMost(value.length))
                        .takeWhile { it in '0'..'7' }
                    output.append(octal.toInt(8).toChar())
                    index += octal.length
                }
                else -> output.append(next)
            }
            index += 2
        }
        return output.toString()
    }

    private fun decodePdfHexString(value: String): String {
        val clean = value.filterNot { it.isWhitespace() }
        if (clean.length < 2) return ""
        val padded = if (clean.length % 2 == 0) clean else "${clean}0"
        val bytes = padded.chunked(2)
            .mapNotNull { chunk -> chunk.toIntOrNull(16)?.toByte() }
            .toByteArray()
        if (bytes.isEmpty()) return ""
        return when {
            bytes.size >= 2 && bytes[0] == 0xFE.toByte() && bytes[1] == 0xFF.toByte() ->
                String(bytes.copyOfRange(2, bytes.size), Charsets.UTF_16BE)
            bytes.size > 4 && bytes.withIndex().count { (index, byte) -> index % 2 == 0 && byte == 0.toByte() } >= bytes.size / 3 ->
                String(bytes, Charsets.UTF_16BE)
            else -> String(bytes, Charsets.ISO_8859_1)
        }
    }

    private fun chooseSignalVideo(type: String, returnToOnboarding: Boolean) {
        pendingSignalVideoType = type
        pendingSignalVideoReturnToOnboarding = returnToOnboarding
        runCatching {
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                setType("video/*")
            }
            startActivityForResult(intent, REQUEST_PICK_SIGNAL_VIDEO)
        }.onFailure { error ->
            val returnToOnboarding = pendingSignalVideoReturnToOnboarding
            pendingSignalVideoType = ""
            pendingSignalVideoReturnToOnboarding = false
            lastApiStatus = "Could not open video picker: ${error.message ?: "Unknown error"}"
            renderAfterSignalVideoUpload(returnToOnboarding)
        }
    }

    private fun recordSignalVideo(type: String, returnToOnboarding: Boolean) {
        pendingSignalVideoType = type
        pendingSignalVideoReturnToOnboarding = returnToOnboarding
        runCatching {
            val maxDurationSeconds = if (type == "deeper") 30 else 10
            val intent = Intent(MediaStore.ACTION_VIDEO_CAPTURE).apply {
                putExtra(MediaStore.EXTRA_DURATION_LIMIT, maxDurationSeconds)
                putExtra(MediaStore.EXTRA_VIDEO_QUALITY, 0)
            }
            if (intent.resolveActivity(packageManager) == null) {
                throw IllegalStateException("No camera app is available for recording video.")
            }
            startActivityForResult(intent, REQUEST_RECORD_SIGNAL_VIDEO)
        }.onFailure { error ->
            val returnToOnboardingState = pendingSignalVideoReturnToOnboarding
            pendingSignalVideoType = ""
            pendingSignalVideoReturnToOnboarding = false
            lastApiStatus = "Could not open camera recorder: ${error.message ?: "Unknown error"}"
            renderAfterSignalVideoUpload(returnToOnboardingState)
        }
    }

    private fun uploadSignalVideoFromUri(uri: Uri) {
        val videoType = pendingSignalVideoType.ifBlank { "signal" }
        val shouldReturnToOnboarding = pendingSignalVideoReturnToOnboarding
        lastApiStatus = "Reading selected video..."
        setContentView(loadingView())
        Thread {
            val result = runCatching {
                val bytes = contentResolver.openInputStream(uri)?.use { input -> input.readBytes() }
                    ?: throw IllegalStateException("Could not read the selected video.")
                if (bytes.isEmpty()) throw IllegalStateException("Selected video is empty.")
                if (bytes.size > MAX_SIGNAL_VIDEO_BYTES) throw IllegalStateException("Choose a smaller video file.")
                val contentType = contentResolver.getType(uri)?.takeIf { it.startsWith("video/") } ?: "video/mp4"
                val durationSeconds = videoDurationSeconds(uri)
                if (videoType == "signal" && durationSeconds > 0.0 && (durationSeconds < 3.0 || durationSeconds > 10.0)) {
                    throw IllegalStateException("Short take videos must be between 3 and 10 seconds.")
                }
                if (videoType == "deeper" && durationSeconds > 30.0) {
                    throw IllegalStateException("Deeper signal videos must be 30 seconds or shorter.")
                }
                SignalVideoSelection(
                    type = videoType,
                    bytes = bytes,
                    contentType = contentType,
                    fileName = signalVideoFileName(uri, contentType),
                    durationSeconds = durationSeconds,
                    returnToOnboarding = shouldReturnToOnboarding,
                )
            }
            runOnUiThread {
                result.fold(
                    onSuccess = { selection -> uploadSignalVideoSelection(selection) },
                    onFailure = { error ->
                        val returnToOnboarding = pendingSignalVideoReturnToOnboarding
                        pendingSignalVideoType = ""
                        pendingSignalVideoReturnToOnboarding = false
                        lastApiStatus = "Video upload failed: ${error.message ?: "Unknown error"}"
                        renderAfterSignalVideoUpload(returnToOnboarding)
                    },
                )
            }
        }.start()
    }

    private fun uploadSignalVideoSelection(selection: SignalVideoSelection) {
        lastApiStatus = "Preparing video upload..."
        setContentView(loadingView())
        apiGateway.executeCato(CatoApiContract.acceptApplicantConsent(video = true, privacyPolicy = true)) { consentResult ->
            val consentResponse = consentResult.getOrNull()
            if (consentResult.isFailure || consentResponse?.isSuccessful != true) {
                runOnUiThread {
                    val returnToOnboarding = pendingSignalVideoReturnToOnboarding
                    lastApiStatus = "Video consent failed: ${consentResult.exceptionOrNull()?.message ?: consentResponse?.body ?: "Unknown error"}"
                    clearPendingSignalVideo()
                    renderAfterSignalVideoUpload(returnToOnboarding)
                }
                return@executeCato
            }
            apiGateway.executeCato(
                CatoApiContract.prepareApplicantVideoUpload(selection.type, selection.contentType, selection.bytes.size),
            ) { prepareResult ->
                val prepareResponse = prepareResult.getOrNull()
                if (prepareResult.isFailure || prepareResponse?.isSuccessful != true) {
                    runOnUiThread {
                        val returnToOnboarding = pendingSignalVideoReturnToOnboarding
                        lastApiStatus = "Video upload preparation failed: ${prepareResult.exceptionOrNull()?.message ?: prepareResponse?.body ?: "Unknown error"}"
                        clearPendingSignalVideo()
                        renderAfterSignalVideoUpload(returnToOnboarding)
                    }
                    return@executeCato
                }
                val maxFileSize = CatoAndroidJson.intValue(prepareResponse.body, "maxFileSizeBytes")
                val maxDurationSeconds = CatoAndroidJson.intValue(prepareResponse.body, "maxDurationSeconds")
                if (maxFileSize != null && selection.bytes.size > maxFileSize) {
                    runOnUiThread {
                        val returnToOnboarding = pendingSignalVideoReturnToOnboarding
                        lastApiStatus = "Choose a smaller video file. The server limit is ${maxFileSize / (1024 * 1024)} MB."
                        clearPendingSignalVideo()
                        renderAfterSignalVideoUpload(returnToOnboarding)
                    }
                    return@executeCato
                }
                if (maxDurationSeconds != null && selection.durationSeconds > maxDurationSeconds) {
                    runOnUiThread {
                        val returnToOnboarding = pendingSignalVideoReturnToOnboarding
                        lastApiStatus = "Choose a shorter video. The limit is $maxDurationSeconds seconds."
                        clearPendingSignalVideo()
                        renderAfterSignalVideoUpload(returnToOnboarding)
                    }
                    return@executeCato
                }
                lastApiStatus = "Uploading video..."
                apiGateway.uploadCloudinaryVideo(
                    preparationBody = prepareResponse.body,
                    videoBytes = selection.bytes,
                    contentType = selection.contentType,
                    fileName = selection.fileName,
                ) { uploadResult ->
                    val upload = uploadResult.getOrNull()
                    if (uploadResult.isFailure || upload == null) {
                        runOnUiThread {
                            val returnToOnboarding = pendingSignalVideoReturnToOnboarding
                            lastApiStatus = "Cloud upload failed: ${uploadResult.exceptionOrNull()?.message ?: "Unknown error"}"
                            clearPendingSignalVideo()
                            renderAfterSignalVideoUpload(returnToOnboarding)
                        }
                        return@uploadCloudinaryVideo
                    }
                    val command = ApplicantSignalVideoCompleteCommand(
                        cloudinaryPublicId = upload.publicId,
                        secureUrl = upload.secureUrl,
                        contentType = selection.contentType,
                        fileSizeBytes = upload.bytes ?: selection.bytes.size,
                        durationSeconds = selection.durationSeconds,
                    )
                    apiGateway.executeCato(CatoApiContract.completeApplicantVideoUpload(selection.type, command)) { completeResult ->
                        runOnUiThread {
                            val completeResponse = completeResult.getOrNull()
                            if (completeResult.isSuccess && completeResponse?.isSuccessful == true) {
                                when (selection.type) {
                                    "signal" -> {
                                        applicantOnboardingStatus = ApplicantOnboardingStatus.SIGNAL_VIDEO_UPLOADED
                                        applicantHasIntroSignal = true
                                    }
                                    "deeper" -> {
                                        applicantOnboardingStatus = ApplicantOnboardingStatus.DEEPER_VIDEO_UPLOADED
                                        applicantHasDeeperSignal = true
                                    }
                                }
                                invalidateApplicantReelProfileState()
                                lastApiStatus = "Video uploaded."
                            } else {
                                lastApiStatus = "Video completion failed: ${completeResult.exceptionOrNull()?.message ?: completeResponse?.body ?: "Unknown error"}"
                            }
                            val returnToOnboarding = selection.returnToOnboarding
                            clearPendingSignalVideo()
                            setContentView(if (returnToOnboarding) applicantOnboarding() else applicantShell())
                        }
                    }
                }
            }
        }
    }

    private fun clearPendingSignalVideo() {
        pendingSignalVideoType = ""
        pendingSignalVideoReturnToOnboarding = false
    }

    private fun renderAfterSignalVideoUpload(returnToOnboarding: Boolean = pendingSignalVideoReturnToOnboarding) {
        setContentView(if (returnToOnboarding) applicantOnboarding() else applicantShell())
    }

    private fun videoDurationSeconds(uri: Uri): Double {
        return runCatching {
            val retriever = MediaMetadataRetriever()
            try {
                retriever.setDataSource(this, uri)
                val millis = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)?.toDoubleOrNull() ?: 0.0
                millis / 1000.0
            } finally {
                retriever.release()
            }
        }.getOrDefault(0.0)
    }

    private fun signalVideoFileName(uri: Uri, contentType: String): String {
        val extension = when {
            contentType.contains("quicktime") -> "mov"
            contentType.contains("webm") -> "webm"
            else -> "mp4"
        }
        return uri.lastPathSegment
            ?.substringAfterLast('/')
            ?.takeIf { it.isNotBlank() && it.contains('.') }
            ?: "cato-video.$extension"
    }

    private fun chooseReelVideo() {
        runCatching {
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                setType("video/*")
            }
            startActivityForResult(intent, REQUEST_PICK_REEL_VIDEO)
        }.onFailure { error ->
            lastApiStatus = "Could not open video picker: ${error.message ?: "Unknown error"}"
            setContentView(applicantShell())
        }
    }

    private fun recordReelVideo() {
        runCatching {
            val intent = Intent(MediaStore.ACTION_VIDEO_CAPTURE).apply {
                putExtra(MediaStore.EXTRA_DURATION_LIMIT, 60)
                putExtra(MediaStore.EXTRA_VIDEO_QUALITY, 0)
            }
            if (intent.resolveActivity(packageManager) == null) {
                throw IllegalStateException("No camera app is available for recording video.")
            }
            startActivityForResult(intent, REQUEST_RECORD_REEL_VIDEO)
        }.onFailure { error ->
            lastApiStatus = "Could not open camera recorder: ${error.message ?: "Unknown error"}"
            applicantDetail = "reel-upload"
            setContentView(applicantShell())
        }
    }

    private fun readReelVideoFromUri(uri: Uri) {
        lastApiStatus = "Reading reel video..."
        setContentView(loadingView())
        Thread {
            val result = runCatching {
                val bytes = contentResolver.openInputStream(uri)?.use { input -> input.readBytes() }
                    ?: throw IllegalStateException("Could not read the selected video.")
                if (bytes.isEmpty()) throw IllegalStateException("Selected video is empty.")
                if (bytes.size > MAX_REEL_VIDEO_BYTES) throw IllegalStateException("Choose a smaller reel video.")
                val contentType = contentResolver.getType(uri)?.takeIf { it.startsWith("video/") } ?: "video/mp4"
                val durationSeconds = videoDurationSeconds(uri)
                if (durationSeconds > 60.0) throw IllegalStateException("Profile reels must be 60 seconds or shorter.")
                ReelVideoSelection(
                    bytes = bytes,
                    contentType = contentType,
                    fileName = signalVideoFileName(uri, contentType),
                    durationSeconds = durationSeconds,
                )
            }
            runOnUiThread {
                result.fold(
                    onSuccess = { selection ->
                        pendingReelVideoSelection = selection
                        lastApiStatus = "Video selected. Add caption and evidence, then publish."
                        applicantDetail = "reel-upload"
                        setContentView(applicantShell())
                    },
                    onFailure = { error ->
                        pendingReelVideoSelection = null
                        lastApiStatus = "Reel video failed: ${error.message ?: "Unknown error"}"
                        applicantDetail = "reel-upload"
                        setContentView(applicantShell())
                    },
                )
            }
        }.start()
    }

    private fun uploadPendingReel() {
        val selection = pendingReelVideoSelection
        if (selection == null) {
            lastApiStatus = "Choose a video before publishing."
            setContentView(applicantShell())
            return
        }
        if (pendingReelEvidenceLinks.isEmpty()) {
            lastApiStatus = "Link at least one project, internship, or accomplishment before publishing."
            setContentView(applicantShell())
            return
        }
        if (pendingReelCaption.length > 250) {
            lastApiStatus = "Caption must be 250 characters or less."
            setContentView(applicantShell())
            return
        }

        lastApiStatus = "Preparing reel upload..."
        setContentView(loadingView())
        apiGateway.executeCato(CatoApiContract.acceptApplicantConsent(video = true, privacyPolicy = true)) { consentResult ->
            val consentResponse = consentResult.getOrNull()
            if (consentResult.isFailure || consentResponse?.isSuccessful != true) {
                runOnUiThread {
                    lastApiStatus = "Video consent failed: ${consentResult.exceptionOrNull()?.message ?: consentResponse?.body ?: "Unknown error"}"
                    setContentView(applicantShell())
                }
                return@executeCato
            }
            apiGateway.executeCato(CatoApiContract.prepareApplicantReelUpload()) { prepareResult ->
                val prepareResponse = prepareResult.getOrNull()
                if (prepareResult.isFailure || prepareResponse?.isSuccessful != true) {
                    runOnUiThread {
                        lastApiStatus = "Reel upload preparation failed: ${prepareResult.exceptionOrNull()?.message ?: prepareResponse?.body ?: "Unknown error"}"
                        setContentView(applicantShell())
                    }
                    return@executeCato
                }
                val maxFileSize = CatoAndroidJson.intValue(prepareResponse.body, "maxFileSizeBytes")
                val maxDurationSeconds = CatoAndroidJson.intValue(prepareResponse.body, "maxDurationSeconds")
                if (maxFileSize != null && selection.bytes.size > maxFileSize) {
                    runOnUiThread {
                        lastApiStatus = "Choose a smaller reel video. The server limit is ${maxFileSize / (1024 * 1024)} MB."
                        setContentView(applicantShell())
                    }
                    return@executeCato
                }
                if (maxDurationSeconds != null && selection.durationSeconds > maxDurationSeconds) {
                    runOnUiThread {
                        lastApiStatus = "Choose a shorter reel. The limit is $maxDurationSeconds seconds."
                        setContentView(applicantShell())
                    }
                    return@executeCato
                }
                lastApiStatus = "Uploading reel..."
                apiGateway.uploadCloudinaryVideo(
                    preparationBody = prepareResponse.body,
                    videoBytes = selection.bytes,
                    contentType = selection.contentType,
                    fileName = selection.fileName,
                ) { uploadResult ->
                    val upload = uploadResult.getOrNull()
                    if (uploadResult.isFailure || upload == null) {
                        runOnUiThread {
                            lastApiStatus = "Cloud upload failed: ${uploadResult.exceptionOrNull()?.message ?: "Unknown error"}"
                            setContentView(applicantShell())
                        }
                        return@uploadCloudinaryVideo
                    }
                    val command = ApplicantReelUploadCommand(
                        caption = pendingReelCaption.trim().takeIf { it.isNotBlank() },
                        cloudinaryPublicId = upload.publicId,
                        secureUrl = upload.secureUrl,
                        contentType = selection.contentType,
                        fileSizeBytes = upload.bytes ?: selection.bytes.size,
                        durationSeconds = selection.durationSeconds,
                        orientation = "unknown",
                        links = pendingReelEvidenceLinks,
                    )
                    apiGateway.executeCato(CatoApiContract.completeApplicantReelUpload(command)) { completeResult ->
                        runOnUiThread {
                            val completeResponse = completeResult.getOrNull()
                            if (completeResult.isSuccess && completeResponse?.isSuccessful == true) {
                                clearPendingReel()
                                invalidateApplicantReelProfileState()
                                lastApiStatus = "Reel published."
                                executeApi(CatoApiContract.applicantReels(), "applicant reels") {
                                    applicantDetail = null
                                    selectedApplicantTab = ApplicantTab.REELS
                                    setContentView(applicantShell())
                                }
                            } else {
                                lastApiStatus = "Reel completion failed: ${completeResult.exceptionOrNull()?.message ?: completeResponse?.body ?: "Unknown error"}"
                                setContentView(applicantShell())
                            }
                        }
                    }
                }
            }
        }
    }

    private fun clearPendingReel() {
        pendingReelVideoSelection = null
        pendingReelCaption = ""
        pendingReelEvidenceLinks = emptyList()
        pendingReelEvidenceSection = "project"
        clearReelEvidenceDraftText()
        resetProjectDraft()
        resetInternshipDraft()
    }

    private fun invalidateApplicantReelProfileState() {
        applicantReelsRequested = false
        applicantProfileRequested = false
        applicantPublicFeedRequested = false
    }

    private fun invalidateApplicantProofProfileState() {
        applicantProfileRequested = false
        applicantAccomplishmentsRequested = false
        applicantReelsRequested = false
        applicantPublicFeedRequested = false
    }

    private fun invalidateRecruiterCandidateActionState() {
        recruiterDashboardRequested = false
        recruiterInterestRequestsRequested = false
        recruiterBookmarksRequested = false
        recruiterEvidenceQueueRequested = false
        recruiterShortlistRequested = false
        recruiterReelsRequested = false
        recruiterReelCandidatesRequested = false
    }

    private fun requestEventsOnce(role: CatoRole) {
        when (role) {
            CatoRole.RECRUITER -> {
                if (recruiterEventsRequested) return
                recruiterEventsRequested = true
            }
            CatoRole.APPLICANT -> {
                if (applicantEventsRequested) return
                applicantEventsRequested = true
            }
        }
        startEvents(role, announce = false)
    }

    private fun startEvents(role: CatoRole, announce: Boolean) {
        if (announce) {
            lastApiStatus = "Connecting ${role.wireValue} events..."
            setContentView(if (role == CatoRole.RECRUITER) recruiterShell() else applicantShell())
        }
        apiGateway.connectEvents(
            role = role,
            onEvent = { event ->
                runOnUiThread {
                    handleRealtimeEvent(role, event)
                }
            },
            onError = { error ->
                runOnUiThread {
                    lastApiStatus = "Events failed: ${error.message ?: "Unknown error"}"
                    resetEventsRequested(role)
                    if (announce) {
                        setContentView(if (role == CatoRole.RECRUITER) recruiterShell() else applicantShell())
                    }
                }
            },
        )
    }

    private fun resetEventsRequested(role: CatoRole) {
        when (role) {
            CatoRole.RECRUITER -> recruiterEventsRequested = false
            CatoRole.APPLICANT -> applicantEventsRequested = false
        }
    }

    private fun handleRealtimeEvent(role: CatoRole, event: com.cato.app.core.CatoSseEvent) {
        when (event.category) {
            CatoSseEventCategory.MESSAGE -> {
                if (role == CatoRole.RECRUITER) {
                    refreshRecruiterMessagesFromEvent(event)
                } else {
                    markApplicantRequestUnreadFromEvent(event, "New message")
                    refreshActiveApplicantConversationFromEvent(event)
                }
            }
            CatoSseEventCategory.INTEREST_REQUEST -> {
                if (role == CatoRole.RECRUITER) {
                    refreshRecruiterRequestsFromEvent(event)
                } else {
                    markApplicantRequestUnreadFromEvent(event, "New interest request")
                }
            }
            CatoSseEventCategory.GENERAL -> {
                lastApiStatus = "Event received: ${event.name}"
                setContentView(if (role == CatoRole.RECRUITER) recruiterShell() else applicantShell())
            }
        }
    }

    private fun refreshRecruiterMessagesFromEvent(event: com.cato.app.core.CatoSseEvent) {
        recruiterUnreadMessageCount += 1
        lastApiStatus = "New message event received."
        executeApi(CatoApiContract.recruiterMessages(), "recruiter messages") {
            setContentView(recruiterShell())
        }
        val applicantId = firstEventString(event, "applicantId", "candidateId")
        if (recruiterDetail == "conversation" && applicantId.isNotBlank() && applicantId == selectedCandidateId) {
            executeApi(CatoApiContract.recruiterCandidateMessages(selectedCandidateId), "candidate messages") {
                setContentView(recruiterShell())
            }
        }
    }

    private fun refreshRecruiterRequestsFromEvent(event: com.cato.app.core.CatoSseEvent) {
        lastApiStatus = "Interest request event received."
        executeApi(CatoApiContract.recruiterInterestRequests(), "recruiter interest requests") {
            setContentView(recruiterShell())
        }
    }

    private fun refreshActiveApplicantConversationFromEvent(event: com.cato.app.core.CatoSseEvent) {
        val requestId = firstEventString(event, "requestId")
        if (applicantDetail == "applicant-conversation" && requestId.isNotBlank() && requestId == selectedRequestId) {
            executeApi(CatoApiContract.applicantConversationMessages(selectedRequestId), "applicant conversation messages") {
                setContentView(applicantShell())
            }
        } else {
            setContentView(applicantShell())
        }
    }

    private fun markApplicantRequestUnreadFromEvent(event: com.cato.app.core.CatoSseEvent, fallbackTitle: String) {
        val requestId = firstEventString(event, "requestId")
        val title = firstEventString(event, "companyName", "recruiterName", "applicantName").ifBlank { fallbackTitle }
        val subtitle = firstEventString(event, "body", "reason", "status").ifBlank { event.name }
        val status = firstEventString(event, "status").normalizedInterestStatus().ifBlank { "sent" }

        if (requestId.isBlank()) {
            applicantUnreadRequestCount += 1
            lastApiStatus = "$fallbackTitle received."
            setContentView(applicantShell())
            return
        }

        val existingIndex = applicantRequestRows.indexOfFirst { it.id == requestId }
        applicantRequestRows = if (existingIndex >= 0) {
            applicantRequestRows.map {
                if (it.id == requestId) {
                    it.copy(
                        title = if (title.isNotBlank()) title else it.title,
                        subtitle = if (subtitle.isNotBlank()) subtitle else it.subtitle,
                        badge = status.ifBlank { it.badge },
                        unread = true,
                    )
                } else {
                    it
                }
            }
        } else {
            listOf(
                AndroidListRow(
                    id = requestId,
                    title = title,
                    subtitle = subtitle,
                    badge = status,
                    unread = true,
                ),
            ) + applicantRequestRows
        }
        applicantUnreadRequestCount = applicantRequestRows.count { it.unread }
        lastApiStatus = "$fallbackTitle received."
        setContentView(applicantShell())
    }

    private fun firstEventString(event: com.cato.app.core.CatoSseEvent, vararg keys: String): String {
        return firstString(event.data, *keys)
    }

    private fun applicantOnboarding(): View {
        val title = when (applicantOnboardingStatus) {
            ApplicantOnboardingStatus.AUTH_COMPLETE -> "Your college"
            ApplicantOnboardingStatus.EDUCATION_COMPLETE -> "Resume"
            ApplicantOnboardingStatus.RESUME_COMPLETE -> "What moves you?"
            ApplicantOnboardingStatus.SIGNAL_PROMPT_SELECTED -> "Short take"
            ApplicantOnboardingStatus.SIGNAL_VIDEO_UPLOADED -> "Go deeper"
            ApplicantOnboardingStatus.DEEPER_SIGNAL_SEEN -> "Optional deeper signal"
            ApplicantOnboardingStatus.DEEPER_VIDEO_SKIPPED,
            ApplicantOnboardingStatus.DEEPER_VIDEO_UPLOADED -> "Save your profile"
            ApplicantOnboardingStatus.PROFILE_FORM_COMPLETE,
            ApplicantOnboardingStatus.ONBOARDING_COMPLETE -> "Profile ready"
        }
        val subtitle = when (applicantOnboardingStatus) {
            ApplicantOnboardingStatus.AUTH_COMPLETE -> "Start with the basics recruiters use to understand your current stage."
            ApplicantOnboardingStatus.EDUCATION_COMPLETE -> "Upload a PDF resume or continue without one and add it later."
            ApplicantOnboardingStatus.RESUME_COMPLETE -> "Choose the prompt your short take will answer."
            ApplicantOnboardingStatus.SIGNAL_PROMPT_SELECTED -> "Prepare your 3 to 10 second intro video upload."
            ApplicantOnboardingStatus.SIGNAL_VIDEO_UPLOADED -> "Add a short thought after your short take, or skip it for now."
            ApplicantOnboardingStatus.DEEPER_SIGNAL_SEEN -> "Add a longer signal video, or skip it and finish your profile."
            ApplicantOnboardingStatus.DEEPER_VIDEO_SKIPPED,
            ApplicantOnboardingStatus.DEEPER_VIDEO_UPLOADED -> "Finish the recruiter-facing basics."
            ApplicantOnboardingStatus.PROFILE_FORM_COMPLETE,
            ApplicantOnboardingStatus.ONBOARDING_COMPLETE -> "Your applicant profile is ready."
        }
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    OnboardingScreen(title = title, subtitle = subtitle)
                }
            }
        }
    }

    @Composable
    private fun OnboardingScreen(title: String, subtitle: String) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = ComposeColor(colors.background),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 22.dp, vertical = 36.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                CatoWordmark(fontSize = 38, leafSize = 28)
                Text(title, color = ComposeColor(colors.textPrimary), fontSize = 30.sp, fontWeight = FontWeight.Bold)
                Text(subtitle, color = ComposeColor(colors.textSecondary), fontSize = 16.sp)
                lastApiStatus?.let { MaterialStatusCard(it) }
                MaterialInfoCard("Current onboarding status", applicantOnboardingStatus.wireValue)
                Button(
                    onClick = {
                        executeApi(CatoApiContract.applicantOnboardingStatus(), "applicant onboarding status") {
                            setContentView(applicantOnboarding())
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ComposeColor(colors.accent)),
                ) {
                    Text("Refresh status", fontWeight = FontWeight.Bold)
                }
                OnboardingStepActions()
                OutlinedButton(
                    onClick = {
                        runtime.sessionStore.clearSynchronously()
                        resetLoadedState()
                        showRoot(CatoRootRoute.SignedOut)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Text("Sign out", fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    @Composable
    private fun OnboardingStepActions() {
        when (applicantOnboardingStatus) {
            ApplicantOnboardingStatus.AUTH_COMPLETE -> EducationStepActions()
            ApplicantOnboardingStatus.EDUCATION_COMPLETE -> ResumeStepActions()
            ApplicantOnboardingStatus.RESUME_COMPLETE -> PromptStepActions()
            ApplicantOnboardingStatus.SIGNAL_PROMPT_SELECTED -> ShortTakeStepActions()
            ApplicantOnboardingStatus.SIGNAL_VIDEO_UPLOADED -> DeeperSignalStepActions()
            ApplicantOnboardingStatus.DEEPER_SIGNAL_SEEN -> DeeperVideoStepActions()
            ApplicantOnboardingStatus.DEEPER_VIDEO_SKIPPED,
            ApplicantOnboardingStatus.DEEPER_VIDEO_UPLOADED -> FinalProfileStepActions()
            ApplicantOnboardingStatus.PROFILE_FORM_COMPLETE,
            ApplicantOnboardingStatus.ONBOARDING_COMPLETE -> {
                Button(
                    onClick = { setContentView(applicantShell()) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ComposeColor(colors.accent)),
                ) {
                    Text("Enter Cato", fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    @Composable
    private fun EducationStepActions() {
        var university by remember(applicantUniversityName) { mutableStateOf(applicantUniversityName) }
        var selectedSemesterNumber by remember(applicantSemesterNumber) { mutableStateOf(applicantSemesterNumber) }
        var selectedSemesterLabel by remember(applicantSemesterLabel) { mutableStateOf(applicantSemesterLabel) }
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(
                value = university,
                onValueChange = { university = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("University") },
                singleLine = true,
            )
            Text("Semester", color = ComposeColor(colors.textPrimary), fontWeight = FontWeight.Bold, fontSize = 18.sp)
            semesterChoiceRows().chunked(2).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    row.forEach { (number, label) ->
                        FilterChip(
                            selected = selectedSemesterNumber == number,
                            onClick = {
                                selectedSemesterNumber = number
                                selectedSemesterLabel = label
                            },
                            label = { Text(label) },
                            modifier = Modifier.weight(1f),
                        )
                    }
                    repeat(2 - row.size) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
            }
            PrimaryMaterialAction("Save education") {
                applicantUniversityName = university.trim()
                if (applicantUniversityName.isBlank()) {
                    lastApiStatus = "University is required."
                    setContentView(applicantOnboarding())
                    return@PrimaryMaterialAction
                }
                applicantSemesterNumber = selectedSemesterNumber.takeIf { it > 0 } ?: 1
                applicantSemesterLabel = selectedSemesterLabel.ifBlank { "Freshman / Semester 1" }
                executeApiOnSuccess(CatoApiContract.saveApplicantOnboardingEducation(currentApplicantOnboardingEducationCommand()), "save onboarding education") {
                    applicantOnboardingStatus = ApplicantOnboardingStatus.EDUCATION_COMPLETE
                    setContentView(applicantOnboarding())
                }
            }
        }
    }

    @Composable
    private fun ResumeStepActions() {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            MaterialInfoCard("Resume status", applicantResumeSummary)
            PrimaryMaterialAction("Choose PDF resume") {
                chooseResumePdf(returnToOnboarding = true)
            }
            OutlinedButton(
                onClick = {
                    executeApiOnSuccess(CatoApiContract.skipApplicantResume(), "skip resume") {
                        applicantOnboardingStatus = ApplicantOnboardingStatus.RESUME_COMPLETE
                        applicantResumeSummary = "Resume skipped. You can upload a PDF later from Settings."
                        setContentView(applicantOnboarding())
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                shape = RoundedCornerShape(16.dp),
            ) {
                Text("Continue without resume", fontWeight = FontWeight.Bold)
            }
        }
    }

    @Composable
    private fun PromptStepActions() {
        LaunchedEffect(applicantOnboardingStatus) {
            requestApplicantPromptsOnce()
        }
        val prompts = applicantPromptRows.ifEmpty {
            listOf(AndroidListRow(id = "general-growth", title = "General", subtitle = "Tell recruiters what motivates your work."))
        }
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedButton(
                onClick = {
                    executeApi(CatoApiContract.signalPrompts(), "signal prompts") {
                        setContentView(applicantOnboarding())
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                shape = RoundedCornerShape(16.dp),
            ) {
                Text("Refresh prompts", fontWeight = FontWeight.Bold)
            }
            prompts.forEach { row ->
                val selected = selectedSignalPromptId == row.id
                MaterialActionCard(
                    title = if (selected) "${row.title} ✓" else row.title,
                    body = row.subtitle,
                    highlighted = selected,
                ) {
                    selectedSignalPromptId = row.id
                    setContentView(applicantOnboarding())
                }
            }
            PrimaryMaterialAction("Use selected prompt") {
                val promptId = selectedSignalPromptId.ifBlank { applicantPromptRows.firstOrNull()?.id.orEmpty() }
                if (promptId.isBlank()) {
                    lastApiStatus = "Select a prompt first. If prompts are still loading, try again in a moment."
                    setContentView(applicantOnboarding())
                } else {
                    executeApiOnSuccess(CatoApiContract.selectSignalPrompt(promptId), "select signal prompt") {
                        applicantOnboardingStatus = ApplicantOnboardingStatus.SIGNAL_PROMPT_SELECTED
                        setContentView(applicantOnboarding())
                    }
                }
            }
        }
    }

    @Composable
    private fun ShortTakeStepActions() {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            MaterialInfoCard("Short take video", "Record or choose an existing 3 to 10 second video.")
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
                    onClick = { recordSignalVideo(type = "signal", returnToOnboarding = true) },
                    modifier = Modifier
                        .weight(1f)
                        .height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ComposeColor(colors.accent)),
                ) {
                    Text("Record", fontWeight = FontWeight.Bold)
                }
                OutlinedButton(
                    onClick = { chooseSignalVideo(type = "signal", returnToOnboarding = true) },
                    modifier = Modifier
                        .weight(1f)
                        .height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Text("Choose", fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    @Composable
    private fun DeeperSignalStepActions() {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            MaterialInfoCard("Deeper thought", "Use this if you want recruiters to see more context before the optional longer video.")
            PrimaryMaterialAction("Continue") {
                executeApiOnSuccess(CatoApiContract.markDeeperSignalSeen(null), "mark deeper signal seen") {
                    applicantOnboardingStatus = ApplicantOnboardingStatus.DEEPER_SIGNAL_SEEN
                    setContentView(applicantOnboarding())
                }
            }
        }
    }

    @Composable
    private fun DeeperVideoStepActions() {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Button(
                    onClick = { recordSignalVideo(type = "deeper", returnToOnboarding = true) },
                    modifier = Modifier
                        .weight(1f)
                        .height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ComposeColor(colors.accent)),
                ) {
                    Text("Record", fontWeight = FontWeight.Bold)
                }
                OutlinedButton(
                    onClick = { chooseSignalVideo(type = "deeper", returnToOnboarding = true) },
                    modifier = Modifier
                        .weight(1f)
                        .height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Text("Choose", fontWeight = FontWeight.Bold)
                }
            }
            OutlinedButton(
                onClick = {
                    executeApiOnSuccess(CatoApiContract.skipApplicantDeeperVideo(), "skip deeper video") {
                        applicantOnboardingStatus = ApplicantOnboardingStatus.DEEPER_VIDEO_SKIPPED
                        setContentView(applicantOnboarding())
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                shape = RoundedCornerShape(16.dp),
            ) {
                Text("Skip deeper video", fontWeight = FontWeight.Bold)
            }
        }
    }

    @Composable
    private fun FinalProfileStepActions() {
        LaunchedEffect(applicantOnboardingStatus) {
            requestApplicantFinalSearchStatusOnce()
        }
        var name by remember(applicantName) { mutableStateOf(applicantName) }
        var gpa by remember(applicantGpa) { mutableStateOf(applicantGpa?.toString().orEmpty()) }
        var major by remember(applicantMajor) { mutableStateOf(applicantMajor) }
        var minor by remember(applicantMinor) { mutableStateOf(applicantMinor) }
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            MaterialInfoCard(
                "Education",
                "${applicantUniversityName.ifBlank { "University not set" }}\n${applicantSemesterLabel.ifBlank { "Semester not set" }}",
            )
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Name") },
                singleLine = true,
            )
            OutlinedTextField(
                value = gpa,
                onValueChange = { gpa = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("GPA optional") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            )
            OutlinedTextField(
                value = major,
                onValueChange = { major = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Major") },
                singleLine = true,
            )
            OutlinedTextField(
                value = minor,
                onValueChange = { minor = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Minor optional") },
                singleLine = true,
            )
            if (shouldShowApplicantSearchRecovery()) {
                MaterialActionCard("Help recruiters find you", applicantSearchRecoveryDescription()) {
                    applicantDetail = "manual-matching"
                    setContentView(applicantShell())
                }
            }
            PrimaryMaterialAction("Finish profile") {
                val nextName = name.trim()
                val nextGpaText = gpa.trim()
                val nextGpa = nextGpaText.takeIf { it.isNotBlank() }?.toDoubleOrNull()
                if (nextName.isBlank()) {
                    lastApiStatus = "Name is required."
                    setContentView(applicantOnboarding())
                    return@PrimaryMaterialAction
                }
                if (applicantUniversityName.isBlank() || applicantSemesterLabel.isBlank()) {
                    lastApiStatus = "Education must be saved before finishing profile."
                    applicantOnboardingStatus = ApplicantOnboardingStatus.AUTH_COMPLETE
                    setContentView(applicantOnboarding())
                    return@PrimaryMaterialAction
                }
                if (nextGpaText.isNotBlank() && nextGpa == null) {
                    lastApiStatus = "GPA must be a number between 0 and 4."
                    setContentView(applicantOnboarding())
                    return@PrimaryMaterialAction
                }
                if (nextGpa != null && (nextGpa < 0.0 || nextGpa > 4.0)) {
                    lastApiStatus = "GPA must be between 0 and 4."
                    setContentView(applicantOnboarding())
                    return@PrimaryMaterialAction
                }
                applicantName = nextName
                applicantGpa = nextGpa
                applicantMajor = major.trim()
                applicantMinor = minor.trim()
                executeApiOnSuccess(CatoApiContract.completeApplicantOnboardingProfile(currentApplicantOnboardingProfileCommand()), "complete onboarding profile") {
                    applicantOnboardingStatus = ApplicantOnboardingStatus.ONBOARDING_COMPLETE
                    setContentView(applicantShell())
                }
            }
        }
    }

    @Composable
    private fun PrimaryMaterialAction(label: String, onClick: () -> Unit) {
        Button(
            onClick = onClick,
            modifier = Modifier
                .fillMaxWidth()
                .height(54.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = ComposeColor(colors.accent)),
        ) {
            Text(label, fontWeight = FontWeight.Bold)
        }
    }

    @Composable
    private fun MaterialActionCard(
        title: String,
        body: String,
        highlighted: Boolean = false,
        onClick: () -> Unit,
    ) {
        Card(
            onClick = onClick,
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = if (highlighted) ComposeColor(colors.background) else ComposeColor(colors.surface),
            ),
            shape = RoundedCornerShape(22.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text(title, color = ComposeColor(colors.textPrimary), fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text(body, color = ComposeColor(colors.textSecondary), fontSize = 15.sp)
            }
        }
    }

    @Composable
    private fun MessagesHeader(
        title: String,
        subtitle: String,
        count: Int,
        unreadCount: Int,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Text(title, color = ComposeColor(colors.textPrimary), fontSize = 30.sp, fontWeight = FontWeight.Bold)
                    Text(subtitle, color = ComposeColor(colors.textSecondary), fontSize = 14.sp)
                }
                Surface(
                    color = ComposeColor(colors.background),
                    shape = RoundedCornerShape(999.dp),
                ) {
                    Text(
                        if (unreadCount > 0) "$unreadCount unread" else "$count total",
                        color = ComposeColor(colors.accent),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp),
                    )
                }
            }
        }
    }

    @Composable
    private fun MessageThreadRow(
        title: String,
        subtitle: String,
        badge: String,
        unread: Boolean,
        onClick: () -> Unit,
    ) {
        Card(
            onClick = onClick,
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = if (unread) ComposeColor(colors.background) else ComposeColor(colors.surface),
            ),
            shape = RoundedCornerShape(22.dp),
            border = androidx.compose.foundation.BorderStroke(
                width = 1.dp,
                color = if (unread) ComposeColor(colors.accent).copy(alpha = 0.26f) else ComposeColor(colors.border),
            ),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Box {
                    Surface(
                        color = ComposeColor(colors.background),
                        shape = CircleShape,
                        modifier = Modifier.size(48.dp),
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                title.firstOrNull()?.uppercase() ?: "C",
                                color = ComposeColor(colors.accent),
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                    if (unread) {
                        Surface(
                            color = ComposeColor(colors.accent),
                            shape = CircleShape,
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .size(11.dp),
                            content = {},
                        )
                    }
                }
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(5.dp),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            title,
                            color = ComposeColor(colors.textPrimary),
                            fontSize = 17.sp,
                            fontWeight = if (unread) FontWeight.Bold else FontWeight.SemiBold,
                            maxLines = 1,
                            modifier = Modifier.weight(1f),
                        )
                        if (badge.isNotBlank()) {
                            Surface(
                                color = ComposeColor(colors.background),
                                shape = RoundedCornerShape(999.dp),
                            ) {
                                Text(
                                    badge.replaceFirstChar { it.uppercase() },
                                    color = ComposeColor(colors.accent),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                )
                            }
                        }
                    }
                    Text(
                        subtitle,
                        color = if (unread) ComposeColor(colors.textPrimary) else ComposeColor(colors.textSecondary),
                        fontSize = 14.sp,
                        fontWeight = if (unread) FontWeight.Bold else FontWeight.Normal,
                        maxLines = 2,
                    )
                }
                Icon(
                    imageVector = Icons.Filled.ChevronRight,
                    contentDescription = "Open",
                    tint = ComposeColor(colors.textSecondary),
                    modifier = Modifier.size(20.dp),
                )
            }
        }
    }

    @Composable
    private fun RequestSurfaceCard(
        title: String,
        subtitle: String,
        status: String,
        meta: String,
        unread: Boolean,
        onClick: () -> Unit,
        actions: (@Composable () -> Unit)? = null,
    ) {
        Card(
            onClick = onClick,
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = if (unread) ComposeColor(colors.background) else ComposeColor(colors.surface),
            ),
            shape = RoundedCornerShape(22.dp),
            border = androidx.compose.foundation.BorderStroke(
                width = 1.dp,
                color = if (unread) ComposeColor(colors.accent).copy(alpha = 0.26f) else ComposeColor(colors.border),
            ),
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.Top,
                ) {
                    Box {
                        Surface(
                            color = ComposeColor(colors.background),
                            shape = CircleShape,
                            modifier = Modifier.size(48.dp),
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    title.firstOrNull()?.uppercase() ?: "R",
                                    color = ComposeColor(colors.accent),
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.Bold,
                                )
                            }
                        }
                        if (unread) {
                            Surface(
                                color = ComposeColor(colors.accent),
                                shape = CircleShape,
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .size(11.dp),
                                content = {},
                            )
                        }
                    }
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.Top,
                        ) {
                            Text(
                                title,
                                color = ComposeColor(colors.textPrimary),
                                fontSize = 17.sp,
                                fontWeight = if (unread) FontWeight.ExtraBold else FontWeight.Bold,
                                maxLines = 1,
                                modifier = Modifier.weight(1f),
                            )
                            RequestStatusBadge(status)
                        }
                        if (meta.isNotBlank()) {
                            Text(meta, color = ComposeColor(colors.textSecondary), fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
                Text(
                    subtitle,
                    color = if (unread) ComposeColor(colors.textPrimary) else ComposeColor(colors.textSecondary),
                    fontSize = 14.sp,
                    fontWeight = if (unread) FontWeight.Bold else FontWeight.Normal,
                )
                actions?.invoke()
            }
        }
    }

    @Composable
    private fun RequestStatusBadge(status: String) {
        val normalized = status.normalizedInterestStatus().ifBlank { status.ifBlank { "sent" } }
        val color = when (normalized) {
            "accepted" -> ComposeColor(colors.success)
            "declined" -> ComposeColor(colors.accent)
            "expired" -> ComposeColor(colors.textSecondary)
            else -> ComposeColor(colors.accent)
        }
        Surface(
            color = color.copy(alpha = 0.12f),
            shape = RoundedCornerShape(999.dp),
        ) {
            Text(
                normalized.replaceFirstChar { it.uppercase() },
                color = color,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            )
        }
    }

    private fun onboardingActionView(): View {
        return vertical(spacing = 16) {
            when (applicantOnboardingStatus) {
                ApplicantOnboardingStatus.AUTH_COMPLETE -> onboardingEducationActions()
                ApplicantOnboardingStatus.EDUCATION_COMPLETE -> onboardingResumeActions()
                ApplicantOnboardingStatus.RESUME_COMPLETE -> onboardingPromptActions()
                ApplicantOnboardingStatus.SIGNAL_PROMPT_SELECTED -> onboardingShortTakeActions()
                ApplicantOnboardingStatus.SIGNAL_VIDEO_UPLOADED -> onboardingDeeperSignalActions()
                ApplicantOnboardingStatus.DEEPER_SIGNAL_SEEN -> onboardingDeeperVideoActions()
                ApplicantOnboardingStatus.DEEPER_VIDEO_SKIPPED,
                ApplicantOnboardingStatus.DEEPER_VIDEO_UPLOADED -> onboardingFinalProfileActions()
                ApplicantOnboardingStatus.PROFILE_FORM_COMPLETE,
                ApplicantOnboardingStatus.ONBOARDING_COMPLETE -> {
                    addView(primaryButton("Enter Cato") {
                        setContentView(applicantShell())
                    })
                }
            }
        }
    }

    private fun LinearLayout.onboardingEducationActions() {
        val universityInput = input("University", applicantUniversityName)
        addView(universityInput)
        addView(sectionTitle("Semester"))
        semesterChoiceRows().chunked(2).forEach { row ->
            addView(horizontal(spacing = 8) {
                row.forEach { (number, label) ->
                    val selected = applicantSemesterNumber == number
                    addView(secondaryButton(if (selected) "$label ✓" else label) {
                        applicantUniversityName = universityInput.text.toString().trim()
                        applicantSemesterNumber = number
                        applicantSemesterLabel = label
                        setContentView(applicantOnboarding())
                    }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                }
                repeat(2 - row.size) {
                    addView(FrameLayout(this@MainActivity), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                }
            })
        }
        addView(primaryButton("Save education") {
            applicantUniversityName = universityInput.text.toString().trim()
            if (applicantUniversityName.isBlank()) {
                lastApiStatus = "University is required."
                setContentView(applicantOnboarding())
                return@primaryButton
            }
            if (applicantSemesterLabel.isBlank() || applicantSemesterNumber <= 0) {
                applicantSemesterNumber = 1
                applicantSemesterLabel = "Freshman / Semester 1"
            }
            executeApiOnSuccess(CatoApiContract.saveApplicantOnboardingEducation(currentApplicantOnboardingEducationCommand()), "save onboarding education") {
                applicantOnboardingStatus = ApplicantOnboardingStatus.EDUCATION_COMPLETE
                setContentView(applicantOnboarding())
            }
        })
    }

    private fun LinearLayout.onboardingResumeActions() {
        addView(featureCard("Resume status", applicantResumeSummary))
        addView(primaryButton("Choose PDF resume") {
            chooseResumePdf(returnToOnboarding = true)
        })
        addView(secondaryButton("Continue without resume") {
            executeApiOnSuccess(CatoApiContract.skipApplicantResume(), "skip resume") {
                applicantOnboardingStatus = ApplicantOnboardingStatus.RESUME_COMPLETE
                applicantResumeSummary = "Resume skipped. You can upload a PDF later from Settings."
                setContentView(applicantOnboarding())
            }
        })
    }

    private fun LinearLayout.onboardingPromptActions() {
        requestApplicantPromptsOnce()
        addView(secondaryButton("Refresh prompts") {
            executeApi(CatoApiContract.signalPrompts(), "signal prompts") {
                setContentView(applicantOnboarding())
            }
        })
        applicantPromptRows.ifEmpty {
            listOf(AndroidListRow(id = "general-growth", title = "General", subtitle = "Tell recruiters what motivates your work."))
        }.forEach { row ->
            addView(featureCard(row.title, row.subtitle) {
                selectedSignalPromptId = row.id
                setContentView(applicantOnboarding())
            })
        }
        addView(primaryButton("Use selected prompt") {
            val promptId = selectedSignalPromptId.ifBlank { applicantPromptRows.firstOrNull()?.id.orEmpty() }
            if (promptId.isBlank()) {
                lastApiStatus = "Select a prompt first. If prompts are still loading, try again in a moment."
                setContentView(applicantOnboarding())
            } else {
                executeApiOnSuccess(CatoApiContract.selectSignalPrompt(promptId), "select signal prompt") {
                    applicantOnboardingStatus = ApplicantOnboardingStatus.SIGNAL_PROMPT_SELECTED
                    setContentView(applicantOnboarding())
                }
            }
        })
    }

    private fun LinearLayout.onboardingShortTakeActions() {
        addView(featureCard("Short take video", "Record or choose an existing 3 to 10 second video."))
        addView(horizontal(spacing = 8) {
            addView(primaryButton("Record short take") {
                recordSignalVideo(type = "signal", returnToOnboarding = true)
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            addView(secondaryButton("Choose video") {
                chooseSignalVideo(type = "signal", returnToOnboarding = true)
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        })
    }

    private fun LinearLayout.onboardingDeeperSignalActions() {
        addView(featureCard("Deeper thought", "Use this if you want recruiters to see more context before the optional longer video."))
        addView(primaryButton("Continue") {
            executeApiOnSuccess(CatoApiContract.markDeeperSignalSeen(null), "mark deeper signal seen") {
                applicantOnboardingStatus = ApplicantOnboardingStatus.DEEPER_SIGNAL_SEEN
                setContentView(applicantOnboarding())
            }
        })
    }

    private fun LinearLayout.onboardingDeeperVideoActions() {
        addView(horizontal(spacing = 8) {
            addView(primaryButton("Record deeper video") {
                recordSignalVideo(type = "deeper", returnToOnboarding = true)
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            addView(secondaryButton("Choose video") {
                chooseSignalVideo(type = "deeper", returnToOnboarding = true)
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        })
        addView(secondaryButton("Skip deeper video") {
            executeApiOnSuccess(CatoApiContract.skipApplicantDeeperVideo(), "skip deeper video") {
                applicantOnboardingStatus = ApplicantOnboardingStatus.DEEPER_VIDEO_SKIPPED
                setContentView(applicantOnboarding())
            }
        })
    }

    private fun LinearLayout.onboardingFinalProfileActions() {
        requestApplicantFinalSearchStatusOnce()
        addView(featureCard("Education", "${applicantUniversityName.ifBlank { "University not set" }}\n${applicantSemesterLabel.ifBlank { "Semester not set" }}"))
        val nameInput = input("Name", applicantName)
        addView(nameInput)
        val gpaInput = input("GPA optional", applicantGpa?.toString().orEmpty())
        addView(gpaInput)
        val majorInput = input("Major", applicantMajor)
        addView(majorInput)
        val minorInput = input("Minor optional", applicantMinor)
        addView(minorInput)
        if (shouldShowApplicantSearchRecovery()) {
            addView(featureCard("Help recruiters find you", applicantSearchRecoveryDescription()) {
                applicantDetail = "manual-matching"
                setContentView(applicantShell())
            })
        }
        addView(primaryButton("Finish profile") {
            val nextName = nameInput.text.toString().trim()
            val nextGpaText = gpaInput.text.toString().trim()
            val nextGpa = nextGpaText.takeIf { it.isNotBlank() }?.toDoubleOrNull()
            if (nextName.isBlank()) {
                lastApiStatus = "Name is required."
                setContentView(applicantOnboarding())
                return@primaryButton
            }
            if (applicantUniversityName.isBlank() || applicantSemesterLabel.isBlank()) {
                lastApiStatus = "Education must be saved before finishing profile."
                applicantOnboardingStatus = ApplicantOnboardingStatus.AUTH_COMPLETE
                setContentView(applicantOnboarding())
                return@primaryButton
            }
            if (nextGpaText.isNotBlank() && nextGpa == null) {
                lastApiStatus = "GPA must be a number between 0 and 4."
                setContentView(applicantOnboarding())
                return@primaryButton
            }
            if (nextGpa != null && (nextGpa < 0.0 || nextGpa > 4.0)) {
                lastApiStatus = "GPA must be between 0 and 4."
                setContentView(applicantOnboarding())
                return@primaryButton
            }
            applicantName = nextName
            applicantGpa = nextGpa
            applicantMajor = majorInput.text.toString().trim()
            applicantMinor = minorInput.text.toString().trim()
            executeApiOnSuccess(CatoApiContract.completeApplicantOnboardingProfile(currentApplicantOnboardingProfileCommand()), "complete onboarding profile") {
                applicantOnboardingStatus = ApplicantOnboardingStatus.ONBOARDING_COMPLETE
                setContentView(applicantShell())
            }
        })
    }

    private fun recruiterShell(): View {
        requestEventsOnce(CatoRole.RECRUITER)
        val shell = CatoNavSpecs.recruiterShell(
            selectedTab = selectedRecruiterTab,
            chrome = ShellChromeState(unreadMessageCount = recruiterUnreadMessageCount),
        )
        return CatoAndroidShell(this, colors, text).screen(
            bottomNavigation = shell.bottomNavigation,
            content = recruiterContent(),
            onNavItemSelected = { key ->
                selectedRecruiterTab = when (key) {
                    "search" -> RecruiterTab.SEARCH
                    "reels" -> RecruiterTab.REELS
                    "messages" -> RecruiterTab.MESSAGES
                    "settings" -> RecruiterTab.SETTINGS
                    else -> RecruiterTab.HOME
                }
                recruiterDetail = null
                setContentView(recruiterShell())
            },
        )
    }

    private fun recruiterContent(): View {
        return when (recruiterDetail) {
            "candidate-review" -> recruiterCandidateReview()
            "candidate-profile" -> recruiterCandidateProfile()
            "reel-viewer" -> recruiterReelViewer()
            "conversation" -> recruiterConversation()
            "interest-requests" -> recruiterInterestRequests()
            "resume-preview" -> resumePreviewScreen(isRecruiter = true)
            "bookmarks" -> {
                val request = CatoApiContract.recruiterBookmarks()
                requestOnce("recruiter-bookmarks", request, "recruiter bookmarks", redrawRecruiter = true)
                recruiterSecondaryCandidateList(
                    title = "Bookmarks",
                    subtitle = "Saved candidates for later review.",
                    rows = recruiterBookmarkRows,
                    emptyTitle = "No bookmarks yet",
                    emptyBody = "Saved candidates will appear here after you bookmark them from search, reels, or candidate review.",
                    refreshLabel = "Refresh bookmarks",
                    request = request,
                    hydrateLabel = "recruiter bookmarks",
                    bookmarkMode = true,
                )
            }
            "evidence-queue" -> {
                val request = CatoApiContract.recruiterEvidenceQueue()
                requestOnce("recruiter-evidence-queue", request, "recruiter evidence queue", redrawRecruiter = true)
                recruiterSecondaryCandidateList(
                    title = "Evidence Queue",
                    subtitle = "Review strongest matches and validation signals.",
                    rows = recruiterEvidenceRows,
                    emptyTitle = "No evidence queued yet",
                    emptyBody = "Strong candidate evidence will appear here after matching has candidates to audit.",
                    refreshLabel = "Refresh evidence queue",
                    request = request,
                    hydrateLabel = "recruiter evidence queue",
                    evidenceMode = true,
                )
            }
            "shortlist" -> {
                val request = CatoApiContract.recruiterCandidates(
                    RecruiterCandidateSearchFilters(reviewStatus = RecruiterReviewStatus.SHORTLISTED),
                )
                requestOnce("recruiter-shortlist", request, "recruiter shortlist", redrawRecruiter = true)
                recruiterSecondaryCandidateList(
                    title = "Shortlist",
                    subtitle = "Candidates marked as shortlisted.",
                    rows = recruiterShortlistRows,
                    emptyTitle = "No shortlisted candidates yet",
                    emptyBody = "Candidates move here after you shortlist them from search, reels, or candidate review.",
                    refreshLabel = "Refresh shortlist",
                    request = request,
                    hydrateLabel = "recruiter shortlist",
                    shortlistMode = true,
                )
            }
            "candidate-comparison" -> recruiterCandidateComparison()
            else -> when (selectedRecruiterTab) {
                RecruiterTab.HOME -> recruiterDashboard()
                RecruiterTab.SEARCH -> recruiterSearch()
                RecruiterTab.REELS -> recruiterReels()
                RecruiterTab.MESSAGES -> recruiterMessages()
                RecruiterTab.SETTINGS -> recruiterSettings()
            }
        }
    }

    private fun applicantShell(): View {
        requestEventsOnce(CatoRole.APPLICANT)
        val shell = CatoNavSpecs.applicantShell(
            selectedTab = selectedApplicantTab,
            chrome = ShellChromeState(unreadMessageCount = applicantUnreadRequestCount),
            isManualMatchingMissing = shouldShowApplicantSearchRecovery(),
        )
        return CatoAndroidShell(this, colors, text).screen(
            bottomNavigation = shell.bottomNavigation,
            content = applicantContent(),
            onNavItemSelected = { key ->
                selectedApplicantTab = when (key) {
                    "requests" -> ApplicantTab.REQUESTS
                    "reels" -> ApplicantTab.REELS
                    "profile" -> ApplicantTab.PROFILE
                    "settings" -> ApplicantTab.SETTINGS
                    else -> ApplicantTab.HOME
                }
                applicantDetail = null
                setContentView(applicantShell())
            },
            showBottomNavigation = applicantDetail != "public-reel-player",
        )
    }

    private fun applicantContent(): View {
        return when (applicantDetail) {
            "recruiter-preview" -> applicantRecruiterPreview()
            "profile-strength" -> applicantProfileStrengthDetail()
            "manual-matching" -> applicantManualMatchingEditor()
            "resume-extraction" -> applicantResumeExtraction()
            "projects" -> applicantProjectsManager()
            "internships" -> applicantInternshipsManager()
            "accomplishments" -> applicantAccomplishmentsManager()
            "education" -> applicantEducationEditor()
            "reel-upload" -> applicantReelUploadWizard()
            "reel-player" -> applicantReelPlayer()
            "public-reel-player" -> applicantPublicReelPlayer()
            "public-applicant-profile" -> applicantPublicProfile()
            "resume-preview" -> resumePreviewScreen(isRecruiter = false)
            "request-detail" -> applicantDetailScreen(
                title = selectedRequestTitle,
                subtitle = "Review this recruiter interest request before accepting or declining.",
                sections = listOf(
                    "Request" to selectedRequestSubtitle,
                    "Context" to "Request may be tied to a reel, project, internship, or profile match.",
                    "Decision" to "Accept opens messaging. Decline is terminal unless re-requested later.",
                ),
                actions = if (selectedRequestStatus.isPendingInterestStatus()) {
                    listOf(
                        "Accept" to CatoApiContract.respondToApplicantInterestRequest(selectedRequestId, ApplicantInterestAction.ACCEPT),
                        "Decline" to CatoApiContract.respondToApplicantInterestRequest(selectedRequestId, ApplicantInterestAction.DECLINE),
                    )
                } else {
                    emptyList()
                },
                localActions = if (selectedRequestStatus == "accepted") {
                    listOf("Open conversation" to {
                        openApplicantConversation(selectedRequestId, selectedRequestTitle, selectedRequestSubtitle)
                    })
                } else {
                    emptyList()
                },
            )
            "applicant-conversation" -> applicantConversation()
            else -> when (selectedApplicantTab) {
                ApplicantTab.HOME -> applicantHome()
                ApplicantTab.REQUESTS -> applicantRequests()
                ApplicantTab.REELS -> applicantReels()
                ApplicantTab.PROFILE -> applicantProfile()
                ApplicantTab.SETTINGS -> applicantSettings()
            }
        }
    }

    private fun recruiterDashboard(): View {
        requestOnce("recruiter-dashboard", CatoApiContract.recruiterDashboard(), "recruiter dashboard", redrawRecruiter = true)
        requestOnce("recruiter-quick-search", CatoApiContract.recruiterSavedFilters(), "recruiter saved filters", redrawRecruiter = true)
        requestOnce("recruiter-interest-requests", CatoApiContract.recruiterInterestRequests(), "recruiter interest requests", redrawRecruiter = true)
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    RecruiterDashboardScreen()
                }
            }
        }
    }

    @Composable
    private fun RecruiterDashboardScreen() {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = ComposeColor(colors.background),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(start = 16.dp, end = 16.dp, top = 42.dp, bottom = 18.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                CatoHomeHeader(
                    name = recruiterName.ifBlank { "Recruiter" },
                    subtitle = recruiterCompany.ifBlank { recruiterEmail.ifBlank { "Build stronger shortlists from clear signals." } },
                    showNotificationDot = recruiterInterestRequestRows.isNotEmpty() || recruiterUnreadMessageCount > 0,
                )
                RecruiterSearchHeroCard()
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ApplicantStatCard(recruiterCandidateCount, "Matches", Modifier.weight(1f))
                    ApplicantStatCard(recruiterBookmarkCount, "Bookmarked", Modifier.weight(1f))
                    ApplicantStatCard(recruiterMessageCount, "Messages", Modifier.weight(1f))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    RecruiterShortcutCard(
                        title = "Evidence Queue",
                        subtitle = "Review strongest signals",
                        icon = Icons.Filled.CheckCircle,
                        modifier = Modifier.weight(1f),
                    ) {
                        recruiterDetail = "evidence-queue"
                        setContentView(recruiterShell())
                    }
                    RecruiterShortcutCard(
                        title = "Shortlist",
                        subtitle = "Compare finalists",
                        icon = Icons.Filled.Groups,
                        modifier = Modifier.weight(1f),
                    ) {
                        recruiterDetail = "shortlist"
                        setContentView(recruiterShell())
                    }
                }
                RecruiterQuickSearchCard()
                RecruiterInterestRequestsHomeCard()
                Spacer(modifier = Modifier.height(92.dp))
            }
        }
    }

    @Composable
    private fun CatoHomeHeader(
        name: String,
        subtitle: String,
        showNotificationDot: Boolean,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Column(
                verticalArrangement = Arrangement.spacedBy(5.dp),
                modifier = Modifier.weight(1f),
            ) {
                CatoWordmark(fontSize = 30, leafSize = 22)
                Text("Good morning, $name", color = ComposeColor(colors.textPrimary), fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
                Text(subtitle, color = ComposeColor(colors.textSecondary), fontSize = 14.sp, maxLines = 2)
            }
            Box {
                Surface(
                    color = ComposeColor(colors.background),
                    shape = CircleShape,
                    modifier = Modifier.size(42.dp),
                ) {
                    Icon(
                        imageVector = Icons.Filled.Notifications,
                        contentDescription = "Notifications",
                        tint = ComposeColor(colors.accent),
                        modifier = Modifier.padding(10.dp),
                    )
                }
                if (showNotificationDot) {
                    Surface(
                        color = ComposeColor(colors.accent),
                        shape = CircleShape,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .size(9.dp),
                        content = {},
                    )
                }
            }
        }
    }

    @Composable
    private fun RecruiterSearchHeroCard() {
        Card(
            onClick = {
                selectedRecruiterTab = RecruiterTab.SEARCH
                setContentView(recruiterShell())
            },
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.accent)),
            shape = RoundedCornerShape(20.dp),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(
                        modifier = Modifier.weight(1f),
                        verticalArrangement = Arrangement.spacedBy(5.dp),
                    ) {
                        Text("SEARCH", color = ComposeColor(colors.onAccent).copy(alpha = 0.68f), fontSize = 12.sp, fontWeight = FontWeight.ExtraBold)
                        Text("Dynamic Search", color = ComposeColor(colors.onAccent), fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                    }
                    Surface(
                        color = ComposeColor(colors.onAccent),
                        shape = CircleShape,
                        modifier = Modifier.size(48.dp),
                    ) {
                        Icon(
                            imageVector = Icons.Filled.ArrowForward,
                            contentDescription = "Open search",
                            tint = ComposeColor(colors.accent),
                            modifier = Modifier.padding(13.dp),
                        )
                    }
                }
                Text(
                    "Build a role-specific candidate pool from filters, skills, field depth, and deterministic match ranking.",
                    color = ComposeColor(colors.onAccent).copy(alpha = 0.82f),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }

    @Composable
    private fun RecruiterShortcutCard(
        title: String,
        subtitle: String,
        icon: androidx.compose.ui.graphics.vector.ImageVector,
        modifier: Modifier = Modifier,
        onClick: () -> Unit,
    ) {
        Card(
            onClick = onClick,
            modifier = modifier,
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(18.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Surface(color = ComposeColor(colors.background), shape = CircleShape, modifier = Modifier.size(34.dp)) {
                    Icon(icon, contentDescription = title, tint = ComposeColor(colors.accent), modifier = Modifier.padding(8.dp))
                }
                Text(title, color = ComposeColor(colors.textPrimary), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                Text(subtitle, color = ComposeColor(colors.textSecondary), fontSize = 12.sp, maxLines = 2)
            }
        }
    }

    @Composable
    private fun RecruiterQuickSearchCard() {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                MaterialSectionHeader("Quick Search", "Saved filters")
                if (recruiterQuickSearchRows.isEmpty()) {
                    RecruiterDashboardEmptyHint("Saved searches will appear here after you create reusable candidate filters.")
                } else {
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        recruiterQuickSearchRows.take(10).forEach { row ->
                            QuickSearchPill(row)
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun QuickSearchPill(row: AndroidListRow) {
        Surface(
            onClick = {
                applyRecruiterQuickSearch(row)
                selectedRecruiterTab = RecruiterTab.SEARCH
                executeApiOnSuccess(CatoApiContract.runtimeMatching(currentRuntimeSearchSpec()), "runtime search") {
                    recruiterSearchCollapsed = true
                    setContentView(recruiterShell())
                }
            },
            color = ComposeColor(colors.background),
            shape = RoundedCornerShape(999.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.accent).copy(alpha = 0.12f)),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 13.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Filled.Search, contentDescription = null, tint = ComposeColor(colors.accent), modifier = Modifier.size(16.dp))
                Text(row.title, color = ComposeColor(colors.accent), fontSize = 14.sp, fontWeight = FontWeight.ExtraBold, maxLines = 1)
            }
        }
    }

    @Composable
    private fun RecruiterInterestRequestsHomeCard() {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                MaterialSectionHeader("Interest Requests", "${recruiterInterestRequestRows.size} sent")
                if (recruiterInterestRequestRows.isEmpty()) {
                    RecruiterDashboardEmptyHint("Sent requests will appear here after you contact candidates.")
                } else {
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        recruiterInterestRequestRows.take(4).forEach { row ->
                            RecruiterInterestMiniCard(row)
                        }
                    }
                    if (recruiterInterestRequestRows.size > 10) {
                        TextButton(onClick = {
                            recruiterDetail = "interest-requests"
                            setContentView(recruiterShell())
                        }) {
                            Text("View all requests", color = ComposeColor(colors.accent), fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun RecruiterInterestMiniCard(row: AndroidListRow) {
        Card(
            onClick = {
                selectedCandidateId = row.applicantId.ifBlank { row.id.ifBlank { selectedCandidateId } }
                selectedCandidateName = row.title
                selectedRequestSubtitle = row.subtitle
                selectedCandidateInterestStatus = row.badge.normalizedInterestStatus()
                if (selectedCandidateInterestStatus == "accepted") {
                    openRecruiterConversation(selectedCandidateId, selectedCandidateName, selectedRequestSubtitle)
                } else {
                    recruiterDetail = "candidate-review"
                    setContentView(recruiterShell())
                }
            },
            modifier = Modifier.width(220.dp),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.background)),
            shape = RoundedCornerShape(16.dp),
        ) {
            Column(
                modifier = Modifier.padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(row.title, color = ComposeColor(colors.textPrimary), fontSize = 15.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                Text(row.subtitle.ifBlank { "Candidate request" }, color = ComposeColor(colors.textSecondary), fontSize = 12.sp, maxLines = 2)
                Text(row.badge.normalizedInterestStatus().ifBlank { row.badge.ifBlank { "sent" } }, color = ComposeColor(colors.accent), fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }

    @Composable
    private fun RecruiterDashboardEmptyHint(textValue: String) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.Top,
        ) {
            Surface(color = ComposeColor(colors.background), shape = CircleShape, modifier = Modifier.size(30.dp)) {
                Icon(Icons.Filled.Search, contentDescription = null, tint = ComposeColor(colors.accent), modifier = Modifier.padding(7.dp))
            }
            Text(textValue, color = ComposeColor(colors.textSecondary), fontSize = 13.sp, modifier = Modifier.weight(1f))
        }
    }

    private fun recruiterSearch(): View {
        requestRecruiterSearchOptionsOnce()
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    RecruiterSearchScreen()
                }
            }
        }
    }

    @Composable
    private fun RecruiterSearchScreen() {
        var searchName by remember { mutableStateOf(recruiterSearchName) }
        var fieldQuery by remember { mutableStateOf(recruiterFieldQuery) }
        var skillQuery by remember { mutableStateOf(recruiterSkillQuery) }
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = ComposeColor(colors.background),
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 18.dp, vertical = 30.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    Text("Dynamic Search", color = ComposeColor(colors.textPrimary), fontSize = 30.sp, fontWeight = FontWeight.Bold)
                    Text("Select what matters. Empty sections stay broad instead of blocking matches.", color = ComposeColor(colors.textSecondary), fontSize = 14.sp)
                    RecruiterSearchSummaryCard()
                    if (recruiterSearchCollapsed) {
                        MaterialActionCard("Search filters", runtimeSearchSummary()) {
                            recruiterSearchCollapsed = false
                            setContentView(recruiterShell())
                        }
                    } else {
                        RecruiterSearchControls(
                            searchName = searchName,
                            onSearchNameChange = {
                                searchName = it
                                recruiterSearchName = it.trim()
                            },
                            fieldQuery = fieldQuery,
                            onFieldQueryChange = {
                                fieldQuery = it
                                recruiterFieldQuery = it
                            },
                            skillQuery = skillQuery,
                            onSkillQueryChange = {
                                skillQuery = it
                                recruiterSkillQuery = it
                            },
                        )
                    }
                    Text("Ranked candidates", color = ComposeColor(colors.textPrimary), fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    if (recruiterSearchRows.isEmpty()) {
                        MaterialInfoCard("No candidates yet", "Search with the current filters to rank matching applicants. Leave filters empty to search broadly.")
                    } else {
                        recruiterSearchRows.forEach { row ->
                            RecruiterCandidateResultCard(row)
                        }
                    }
                    Spacer(modifier = Modifier.height(18.dp))
                }
                RecruiterSearchBottomActions()
            }
        }
    }

    @Composable
    private fun RecruiterSearchSummaryCard() {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(22.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text("Current search", color = ComposeColor(colors.textSecondary), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                Text(runtimeSearchSummary(), color = ComposeColor(colors.textPrimary), fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(
                        onClick = {
                            resetRecruiterSearchSelections()
                            setContentView(recruiterShell())
                        },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                    ) {
                        Text("Reset")
                    }
                    OutlinedButton(
                        onClick = { refreshRecruiterSearchOptions() },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(14.dp),
                    ) {
                        Text("Options")
                    }
                }
            }
        }
    }

    @Composable
    private fun RecruiterSearchControls(
        searchName: String,
        onSearchNameChange: (String) -> Unit,
        fieldQuery: String,
        onFieldQueryChange: (String) -> Unit,
        skillQuery: String,
        onSkillQueryChange: (String) -> Unit,
    ) {
        SearchSection("Save name", "Only used if you save this search for later.") {
            OutlinedTextField(
                value = searchName,
                onValueChange = onSearchNameChange,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Name this search") },
                shape = RoundedCornerShape(16.dp),
                singleLine = true,
            )
        }
        SearchSection("Looking for", "This is a ranking signal, not a hard exclusion.") {
            SearchChipGrid(
                items = RecruiterSearchEmploymentType.entries.map { it.label },
                selected = recruiterSearchEmploymentType?.let { listOf(it.label) } ?: emptyList(),
            ) { label ->
                val type = RecruiterSearchEmploymentType.entries.first { it.label == label }
                recruiterSearchEmploymentType = if (recruiterSearchEmploymentType == type) null else type
                setContentView(recruiterShell())
            }
        }
        SearchSection("Graduation", "Keep this broad unless the role strictly requires graduation.") {
            val values = listOf("any" to "Any", "false" to "Not graduated", "true" to "Graduated")
            SearchChipGrid(
                items = values.map { it.second },
                selected = values.firstOrNull { it.first == recruiterSearchGraduated }?.let { listOf(it.second) } ?: listOf("Any"),
            ) { label ->
                recruiterSearchGraduated = values.first { it.second == label }.first
                setContentView(recruiterShell())
            }
        }
        SearchSection("Minimum GPA", "Optional. GPA should boost fit, not dominate the profile.") {
            val values = listOf(null to "Any", 2.5 to "2.5+", 3.0 to "3.0+", 3.5 to "3.5+")
            SearchChipGrid(
                items = values.map { it.second },
                selected = values.firstOrNull { it.first == recruiterSearchMinGpa }?.let { listOf(it.second) } ?: listOf("Any"),
            ) { label ->
                recruiterSearchMinGpa = values.first { it.second == label }.first
                setContentView(recruiterShell())
            }
        }
        SearchSection("Semester", "Select one or more class standing options.") {
            SearchChipGrid(
                items = semesterChoiceRows().map { it.second },
                selected = semesterChoiceRows().filter { recruiterSearchSemesterNumbers.contains(it.first) }.map { it.second },
            ) { label ->
                val value = semesterChoiceRows().first { it.second == label }.first
                recruiterSearchSemesterNumbers = recruiterSearchSemesterNumbers.toggleInt(value)
                setContentView(recruiterShell())
            }
            if (recruiterSearchSemesterNumbers.isNotEmpty()) {
                TextButton(onClick = {
                    recruiterSearchSemesterNumbers = emptyList()
                    setContentView(recruiterShell())
                }) {
                    Text("Reset semesters")
                }
            }
        }
        RecruiterOptionSearchSection(
            title = "Fields",
            helper = "Select industries or fields. Recruiter-added fields become standardized options.",
            query = fieldQuery,
            onQueryChange = onFieldQueryChange,
            options = filterOptions(recruiterSearchFieldOptions, fieldQuery),
            selectedValues = recruiterSearchCategories,
            allOptions = recruiterSearchFieldOptions,
            addLabel = "Add field",
            emptyLabel = "No fields available",
            onToggle = { option ->
                recruiterSearchCategories = recruiterSearchCategories.toggle(option.id)
                setContentView(recruiterShell())
            },
            onReset = {
                recruiterSearchCategories = emptyList()
                recruiterFieldQuery = ""
                if (recruiterSearchDepth?.type == MatchingOptionType.CATEGORY) recruiterSearchDepth = null
                setContentView(recruiterShell())
            },
            onAdd = {
                executeApi(CatoApiContract.addMatchingOption(MatchingOptionType.CATEGORY, it), "add recruiter field option") {
                    setContentView(recruiterShell())
                }
            },
        )
        RecruiterOptionSearchSection(
            title = "Skills",
            helper = "First selected skill is treated as must-have. Additional skills boost the rank.",
            query = skillQuery,
            onQueryChange = onSkillQueryChange,
            options = filterOptions(recruiterSearchSkillOptions, skillQuery),
            selectedValues = recruiterSearchRequiredSkills + recruiterSearchPreferredSkills,
            allOptions = recruiterSearchSkillOptions,
            addLabel = "Add skill",
            emptyLabel = "No skills available",
            onToggle = { option ->
                val skill = option.id.ifBlank { option.title }
                if (recruiterSearchRequiredSkills.isEmpty() && !recruiterSearchPreferredSkills.contains(skill)) {
                    recruiterSearchRequiredSkills = listOf(skill)
                } else if (recruiterSearchRequiredSkills.contains(skill)) {
                    recruiterSearchRequiredSkills = emptyList()
                } else {
                    recruiterSearchPreferredSkills = recruiterSearchPreferredSkills.toggle(skill)
                }
                setContentView(recruiterShell())
            },
            onReset = {
                recruiterSearchRequiredSkills = emptyList()
                recruiterSearchPreferredSkills = emptyList()
                recruiterSkillQuery = ""
                if (recruiterSearchDepth?.type == MatchingOptionType.SKILL) recruiterSearchDepth = null
                setContentView(recruiterShell())
            },
            onAdd = {
                executeApi(CatoApiContract.addMatchingOption(MatchingOptionType.SKILL, it), "add recruiter skill option") {
                    setContentView(recruiterShell())
                }
            },
        )
        MaterialActionCard(
            title = "Fluency depth",
            body = recruiterSearchDepth?.let { "${it.type.wireValue}: ${matchingDepthLabel(it)}" } ?: "Choose one field or skill the applicant should be strongest in.",
        ) {
            recruiterSearchDepth = if (recruiterSearchDepth == null) {
                val skillId = recruiterSearchRequiredSkills.firstOrNull() ?: recruiterSearchPreferredSkills.firstOrNull()
                val fieldId = recruiterSearchCategories.firstOrNull()
                when {
                    skillId != null -> MatchingDepth(MatchingOptionType.SKILL, skillId)
                    fieldId != null -> MatchingDepth(MatchingOptionType.CATEGORY, fieldId)
                    else -> {
                        lastApiStatus = "Select a field or skill before setting fluency depth."
                        null
                    }
                }
            } else {
                null
            }
            setContentView(recruiterShell())
        }
    }

    @Composable
    private fun SearchSection(title: String, helper: String, content: @Composable () -> Unit) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(22.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(title, color = ComposeColor(colors.textPrimary), fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text(helper, color = ComposeColor(colors.textSecondary), fontSize = 13.sp)
                content()
            }
        }
    }

    @Composable
    private fun SearchChipGrid(items: List<String>, selected: List<String>, onClick: (String) -> Unit) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items.chunked(2).forEach { row ->
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    row.forEach { label ->
                        FilterChip(
                            selected = selected.any { it.equals(label, ignoreCase = true) },
                            onClick = { onClick(label) },
                            label = { Text(label, maxLines = 1) },
                            modifier = Modifier.weight(1f),
                        )
                    }
                    if (row.size == 1) Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }

    @Composable
    private fun RecruiterOptionSearchSection(
        title: String,
        helper: String,
        query: String,
        onQueryChange: (String) -> Unit,
        options: List<AndroidListRow>,
        selectedValues: List<String>,
        allOptions: List<AndroidListRow>,
        addLabel: String,
        emptyLabel: String,
        onToggle: (AndroidListRow) -> Unit,
        onReset: () -> Unit,
        onAdd: (String) -> Unit,
    ) {
        SearchSection(title, helper) {
            OutlinedTextField(
                value = query,
                onValueChange = onQueryChange,
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Search or add") },
                shape = RoundedCornerShape(16.dp),
                singleLine = true,
            )
            val selectedLabels = matchingDisplayLabels(selectedValues, allOptions)
            if (selectedLabels.isNotEmpty()) {
                Text("Selected", color = ComposeColor(colors.textSecondary), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                SearchChipGrid(items = selectedLabels.sortedBy { it.lowercase() }, selected = selectedLabels) {}
                TextButton(onClick = onReset) { Text("Reset $title") }
            }
            when {
                options.isNotEmpty() -> {
                    SearchChipGrid(
                        items = options.take(12).map { it.title },
                        selected = selectedLabels,
                    ) { label ->
                        options.firstOrNull { it.title == label }?.let(onToggle)
                    }
                }
                shouldShowAddOption(query, allOptions) -> {
                    MaterialActionCard("$addLabel: ${query.trim()}", "No matching option exists yet. Add it as a standardized option.") {
                        onAdd(query.trim())
                    }
                }
                allOptions.isEmpty() -> {
                    MaterialInfoCard(emptyLabel, "Refresh options or type above to add a standardized option.")
                }
            }
        }
    }

    @Composable
    private fun RecruiterCandidateResultCard(row: AndroidListRow) {
        Card(
            onClick = { openCandidateFromRow(row) },
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(22.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
        ) {
            Row(
                modifier = Modifier.padding(14.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                CandidateAvatar(name = row.title, imageUrl = candidateAvatarUrl(row), modifier = Modifier.size(52.dp), shape = RoundedCornerShape(16.dp))
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    Text(row.title, color = ComposeColor(colors.textPrimary), fontSize = 17.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                    Text(row.subtitle.ifBlank { "Candidate profile" }, color = ComposeColor(colors.textSecondary), fontSize = 13.sp, maxLines = 2)
                    if (row.badge.isNotBlank()) {
                        Surface(color = ComposeColor(colors.background), shape = RoundedCornerShape(999.dp)) {
                            Text(row.badge, color = ComposeColor(colors.accent), fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp))
                        }
                    }
                }
                Icon(Icons.Filled.ChevronRight, contentDescription = "Open candidate", tint = ComposeColor(colors.textSecondary), modifier = Modifier.size(20.dp))
            }
        }
    }

    @Composable
    private fun CandidateAvatar(
        name: String,
        imageUrl: String,
        modifier: Modifier = Modifier,
        shape: androidx.compose.ui.graphics.Shape = RoundedCornerShape(16.dp),
    ) {
        Surface(
            color = ComposeColor(colors.border),
            shape = shape,
            modifier = modifier,
        ) {
            if (imageUrl.isNotBlank()) {
                AsyncImage(
                    model = imageUrl,
                    contentDescription = "$name avatar",
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize(),
                )
            } else {
                Box(contentAlignment = Alignment.Center) {
                    Text(name.firstOrNull()?.uppercase() ?: "C", color = ComposeColor(colors.accent), fontSize = 20.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    private fun candidateAvatarUrl(row: AndroidListRow): String {
        return firstString(row.raw, "avatarUrl", "photoUrl", "profileImageUrl", "imageUrl", "thumbnailUrl", "mediaThumbnailUrl")
    }

    @Composable
    private fun RecruiterSearchBottomActions() {
        Surface(
            color = ComposeColor(colors.background),
            shadowElevation = 6.dp,
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(start = 18.dp, end = 18.dp, top = 10.dp, bottom = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Button(
                    onClick = { runRecruiterRuntimeSearch() },
                    modifier = Modifier
                        .weight(0.85f)
                        .height(54.dp),
                    shape = RoundedCornerShape(18.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ComposeColor(colors.accent)),
                ) {
                    Text("Search", fontWeight = FontWeight.Bold)
                }
                OutlinedButton(
                    onClick = { saveCurrentRecruiterSearch() },
                    modifier = Modifier
                        .weight(1f)
                        .height(54.dp),
                    shape = RoundedCornerShape(18.dp),
                ) {
                    Text(if (selectedRecruiterJobId.isBlank()) "Save job" else "Update Job", fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    private fun runRecruiterRuntimeSearch() {
        executeApiOnSuccess(CatoApiContract.runtimeMatching(currentRuntimeSearchSpec()), "runtime search") {
            recruiterSearchCollapsed = true
            setContentView(recruiterShell())
        }
    }

    private fun saveCurrentRecruiterSearch() {
        recruiterSearchName = recruiterSearchName.ifBlank { "Untitled search" }
        val request = if (selectedRecruiterJobId.isBlank()) {
            CatoApiContract.saveRecruiterSearch(recruiterSearchName, currentRuntimeSearchSpec())
        } else {
            CatoApiContract.updateRecruiterSearch(selectedRecruiterJobId, recruiterSearchName, currentRuntimeSearchSpec())
        }
        executeApiOnSuccess(request, if (selectedRecruiterJobId.isBlank()) "save recruiter search" else "update recruiter search") {
            recruiterQuickSearchRequested = false
            recruiterDashboardRequested = false
            setContentView(recruiterShell())
        }
    }

    private fun recruiterSearchFloatingActions(): View {
        return horizontal(spacing = 12) {
            addView(
                primaryButton("Search") {
                    executeApiOnSuccess(CatoApiContract.runtimeMatching(currentRuntimeSearchSpec()), "runtime search") {
                        recruiterSearchCollapsed = true
                        setContentView(recruiterShell())
                    }
                },
                LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 0.72f),
            )
            addView(
                secondaryButton(if (selectedRecruiterJobId.isBlank()) "Save job" else "Update Job") {
                    recruiterSearchName = recruiterSearchName.ifBlank { "Untitled search" }
                    val request = if (selectedRecruiterJobId.isBlank()) {
                        CatoApiContract.saveRecruiterSearch(recruiterSearchName, currentRuntimeSearchSpec())
                    } else {
                        CatoApiContract.updateRecruiterSearch(selectedRecruiterJobId, recruiterSearchName, currentRuntimeSearchSpec())
                    }
                    executeApiOnSuccess(request, if (selectedRecruiterJobId.isBlank()) "save recruiter search" else "update recruiter search") {
                        recruiterQuickSearchRequested = false
                        recruiterDashboardRequested = false
                        setContentView(recruiterShell())
                    }
                },
                LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f),
            )
        }
    }

    private fun recruiterCandidateReview(): View {
        requestSelectedCandidateHydrationOnce()
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    CandidateReviewScreen(isProfile = false)
                }
            }
        }
    }

    private fun candidateFloatingTopActions(): View {
        return horizontal(spacing = 8) {
            setPadding(0, 0, 0, 0)
            elevation = dp(6).toFloat()
            addView(
                if (selectedCandidateInterestStatus == "sent" || selectedCandidateInterestStatus == "viewed") {
                    secondaryButton("Interest sent") {
                        lastApiStatus = "Interest has already been sent to this candidate."
                        setContentView(recruiterShell())
                    }
                } else {
                    primaryButton("Interest") {
                        sendRecruiterInterestFromSelectedCandidate("Interested from native Android")
                    }
                },
                LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f),
            )
            addView(
                secondaryButton(if (selectedCandidateBookmarked) "Bookmarked" else "Bookmark") {
                    bookmarkSelectedCandidate()
                },
                LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f),
            )
            addView(
                secondaryButton("Contact") {
                    contactSelectedCandidate()
                },
                LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f),
            )
        }
    }

    private fun recruiterReels(): View {
        recruiterDetail = "reel-viewer"
        return recruiterReelViewer()
    }

    private fun recruiterReelViewer(): View {
        requestOnce("recruiter-reels", CatoApiContract.videoFeed(recruiter = true, limit = 50), "recruiter video feed", redrawRecruiter = true)
        requestOnce("recruiter-reel-candidates", CatoApiContract.recruiterCandidates(), "recruiter reel candidates", redrawRecruiter = true)
        val reels = recruiterReelRows
        if (reels.isEmpty()) {
            return scroll {
                addView(
                    vertical(spacing = 16) {
                        setPadding(dp(22), dp(28), dp(22), dp(132))
                        addView(horizontal(spacing = 10) {
                            addView(compactBackButton {
                                recruiterDetail = null
                                selectedRecruiterTab = RecruiterTab.REELS
                                setContentView(recruiterShell())
                            })
                            addView(label("Recruiter Reels", 26, colors.textPrimary, bold = true))
                        })
                        lastApiStatus?.let { addView(statusCard(it)) }
                        addView(primaryButton("Refresh feed") {
                            executeApi(CatoApiContract.videoFeed(recruiter = true, limit = 50), "recruiter video feed") {
                                setContentView(recruiterShell())
                            }
                        })
                        addView(featureCard("No reels yet", "Refresh the feed to load intro videos, deeper signals, and profile reels."))
                    },
                    matchWrapParams(),
                )
            }
        }
        val current = reels[recruiterReelIndex.coerceIn(0, reels.lastIndex)]
        selectedReelId = current.id.ifBlank { selectedReelId }
        selectedReelTitle = current.title
        selectedReelSubtitle = current.subtitle
        selectedReelApplicantId = current.applicantId.ifBlank { selectedCandidateId }
        selectedReelSourceType = current.sourceType.ifBlank { "profile_reel" }
        selectedReelMediaUrl = current.mediaUrl
        selectedReelRaw = current.raw
        applySelectedReelBadge(current.badge)
        selectedCandidateInterestStatus = firstString(current.raw, "interestRequestStatus", "requestStatus")
            .normalizedInterestStatus()
            .ifBlank { selectedCandidateInterestStatus }
        selectedCandidateBookmarked = CatoAndroidJson.booleanValue(current.raw, "bookmarked") ?: selectedCandidateBookmarked
        if (current.applicantId.isNotBlank()) {
            selectedCandidateId = current.applicantId
        }
        val currentApplicantName = current.applicantName.ifBlank { current.subtitle.substringBefore(" - ").trim() }
        if (currentApplicantName.isNotBlank()) {
            selectedCandidateName = currentApplicantName
        }
        return scroll {
            addView(
                vertical(spacing = 16) {
                    setPadding(dp(10), dp(10), dp(10), dp(104))
                    lastApiStatus?.let { addView(statusCard(it)) }
                    addView(recruiterReelSurface(current, currentApplicantName))
                },
                matchWrapParams(),
            )
        }
    }

    private fun recruiterReelSurface(row: AndroidListRow, applicantName: String): View {
        val key = selectedVideoKey()
        val isPlaying = isSelectedVideoPlaying()
        val positionText = "${recruiterReelIndex.coerceAtLeast(0) + 1}/${recruiterReelRows.size.coerceAtLeast(1)}"
        val interestSent = selectedCandidateInterestStatus == "sent" || selectedCandidateInterestStatus == "viewed"
        val sourceHint = when {
            isIntroVideoSource(row.sourceType) && deeperReelIndexFor(row.applicantId) >= 0 -> "Swipe right for deeper signal"
            isDeeperVideoSource(row.sourceType) -> "Deeper signal"
            else -> row.sourceType.replace('_', ' ').ifBlank { "Profile reel" }
        }
        return FrameLayout(this).apply {
            val surfaceHeight = (resources.displayMetrics.heightPixels - dp(196)).coerceAtLeast(dp(520))
            background = CatoAndroidDrawable.rounded(Color.BLACK, dp(28), Color.BLACK)
            clipToOutline = true
            installSwipeHandler(
                onSwipeUp = { moveRecruiterReel(1) },
                onSwipeDown = { moveRecruiterReel(-1) },
                onSwipeRight = {
                    if (isIntroVideoSource(row.sourceType)) {
                        moveToDeeperReel()
                    }
                },
                onSwipeLeft = {
                    if (isDeeperVideoSource(row.sourceType)) {
                        moveToIntroReel(row.applicantId)
                    }
                },
                onTap = {
                    toggleSelectedReelPlayback(key)
                },
            )
            if (row.mediaUrl.isNotBlank()) {
                addView(
                    controlledVideoView(
                        mediaUrl = row.mediaUrl,
                        videoKey = key,
                        onStarted = {
                            if (selectedReelId.isNotBlank()) {
                                executeApiOnSuccess(CatoApiContract.markVideoViewed(selectedReelId), "mark video viewed") {
                                    selectedReelViewCount = incrementCountLabel(selectedReelViewCount, "views")
                                    updateCurrentReelBadge()
                                }
                            }
                        },
                    ),
                    matchFrameParams(),
                )
            }
            addView(
                label("Applicant reels", 16, Color.WHITE, bold = true).apply {
                    setPadding(dp(12), dp(7), dp(12), dp(7))
                    background = CatoAndroidDrawable.rounded(Color.argb(86, 255, 255, 255), dp(16), Color.TRANSPARENT)
                },
                FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.TOP or Gravity.START).apply {
                    leftMargin = dp(16)
                    topMargin = dp(16)
                },
            )
            addView(
                label(positionText, 13, Color.WHITE, bold = true).apply {
                    setPadding(dp(10), dp(6), dp(10), dp(6))
                    background = CatoAndroidDrawable.rounded(Color.argb(86, 255, 255, 255), dp(14), Color.TRANSPARENT)
                },
                FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.TOP or Gravity.END).apply {
                    rightMargin = dp(16)
                    topMargin = dp(16)
                },
            )
            addView(
                vertical(spacing = 7) {
                    setPadding(dp(14), dp(14), dp(14), dp(14))
                    background = CatoAndroidDrawable.rounded(Color.argb(118, 0, 0, 0), dp(20), Color.TRANSPARENT)
                    addView(label(applicantName.ifBlank { selectedCandidateName.ifBlank { "Candidate" } }, 20, Color.WHITE, bold = true).apply {
                        setOnClickListener { openRecruiterCandidateProfile() }
                    })
                    if (row.subtitle.isNotBlank()) {
                        addView(label(row.subtitle, 13, Color.argb(214, 255, 255, 255)))
                    }
                    addView(label(sourceHint, 12, Color.WHITE, bold = true).apply {
                        setPadding(dp(9), dp(5), dp(9), dp(5))
                        background = CatoAndroidDrawable.rounded(Color.argb(52, 255, 255, 255), dp(13), Color.TRANSPARENT)
                    })
                    if (row.title.isNotBlank() && !isDeeperVideoSource(row.sourceType)) {
                        addView(label(row.title, 15, Color.WHITE, bold = true).apply {
                            setOnClickListener { openRecruiterCandidateProfile() }
                        })
                    }
                    addView(label("${selectedReelViewCount} - ${selectedReelLikeCount}", 12, Color.argb(204, 255, 255, 255)))
                },
                FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM or Gravity.START).apply {
                    leftMargin = dp(16)
                    rightMargin = dp(96)
                    bottomMargin = dp(18)
                },
            )
            addView(
                vertical(spacing = 14) {
                    gravity = Gravity.CENTER
                    addView(reelOverlayAction("L", "Like") {
                        if (selectedReelId.isBlank()) {
                            lastApiStatus = "Select a reel before liking video."
                        } else {
                            executeApiOnSuccess(CatoApiContract.setVideoLike(selectedReelId, liked = true), "like video") {
                                selectedReelLikeCount = incrementCountLabel(selectedReelLikeCount, "likes")
                                updateCurrentReelBadge()
                            }
                        }
                    })
                    addView(reelOverlayAction("I", if (interestSent) "Sent" else "Interested") {
                        if (interestSent) {
                            lastApiStatus = "Interest has already been sent to this candidate."
                            setContentView(recruiterShell())
                        } else {
                            val candidateId = interestCandidateId()
                            if (requireCandidateId("sending interest", candidateId)) {
                                executeApiOnSuccess(
                                    CatoApiContract.sendRecruiterInterest(
                                        candidateId = candidateId,
                                        reason = "Interested from native Android reel",
                                        sourceType = selectedReelSourceType,
                                        sourceVideoId = selectedReelId.takeIf { it.isNotBlank() },
                                    ),
                                    "send interest",
                                ) {
                                    invalidateRecruiterCandidateActionState()
                                    selectedCandidateInterestStatus = "sent"
                                    setContentView(recruiterShell())
                                }
                            }
                        }
                    })
                    addView(reelOverlayAction("P", "Profile") {
                        openRecruiterCandidateProfile()
                    })
                },
                FrameLayout.LayoutParams(dp(78), ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.END or Gravity.BOTTOM).apply {
                    rightMargin = dp(14)
                    bottomMargin = dp(22)
                },
            )
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, surfaceHeight)
        }
    }

    private fun reelOverlayAction(icon: String, title: String, onClick: () -> Unit): View {
        return vertical(spacing = 4) {
            gravity = Gravity.CENTER
            isClickable = true
            isFocusable = true
            setOnClickListener { onClick() }
            addView(label(icon, 24, Color.WHITE, bold = true).apply { gravity = Gravity.CENTER })
            addView(label(title, 10, Color.WHITE, bold = true).apply { gravity = Gravity.CENTER })
        }
    }

    private fun recruiterCandidateProfile(): View {
        requestSelectedCandidateHydrationOnce()
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    CandidateReviewScreen(isProfile = true)
                }
            }
        }
    }

    @Composable
    private fun CandidateReviewScreen(isProfile: Boolean) {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = ComposeColor(colors.background),
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 18.dp, vertical = 28.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    CandidateTopBar(isProfile)
                    CandidateReviewHeaderCard()
                    if (!isProfile) {
                        Button(
                            onClick = { loadRuntimeMatchAuditForSelectedCandidate() },
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ComposeColor(colors.accent)),
                        ) {
                            Text("Why this match?", fontWeight = FontWeight.Bold)
                        }
                    }
                    CandidateActionButtons()
                    CandidateVideosSection()
                    if (isProfile && selectedCandidateSignalSummary.isNotBlank()) {
                        CandidateInfoSection("About", listOf(AndroidListRow(title = "Signal", subtitle = selectedCandidateSignalSummary)))
                    }
                    if (selectedCandidateResumeUrl.isNotBlank()) {
                        CandidateResumeCard()
                    }
                    CandidateInfoSection("Match evidence", selectedCandidateEvidenceRows)
                    CandidateInfoSection("Projects", selectedCandidateProjectRows)
                    CandidateInfoSection("Internships", selectedCandidateInternshipRows)
                    CandidateInfoSection("Accomplishments", selectedCandidateAccomplishmentRows)
                    if (selectedCandidateSoftSkillRows.isNotEmpty()) {
                        CandidateInfoSection("Soft signals", selectedCandidateSoftSkillRows.take(4))
                    }
                    Spacer(modifier = Modifier.height(if (isProfile) 96.dp else 120.dp))
                }
                if (!isProfile) {
                    CandidateDecisionBar()
                }
            }
        }
    }

    @Composable
    private fun CompactBackButton(onClick: () -> Unit) {
        IconButton(
            onClick = onClick,
            modifier = Modifier.size(38.dp),
        ) {
            Icon(
                Icons.Filled.ArrowBack,
                contentDescription = "Back",
                tint = ComposeColor(colors.textPrimary),
                modifier = Modifier.size(28.dp),
            )
        }
    }

    @Composable
    private fun CandidateTopBar(isProfile: Boolean) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            CompactBackButton {
                recruiterDetail = if (isProfile) recruiterCandidateProfileReturnDetail else null
                setContentView(recruiterShell())
            }
            Text(
                if (isProfile) selectedCandidateName.ifBlank { "Candidate Profile" } else "Candidate Review",
                color = ComposeColor(colors.textPrimary),
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                modifier = Modifier.weight(1f),
            )
        }
    }

    @Composable
    private fun CandidateReviewHeaderCard() {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(24.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                CandidateAvatar(name = selectedCandidateName, imageUrl = selectedCandidateAvatarUrl, modifier = Modifier.size(66.dp), shape = RoundedCornerShape(18.dp))
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Runtime Match", color = ComposeColor(colors.accent), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Text(selectedCandidateName.ifBlank { "Candidate" }, color = ComposeColor(colors.textPrimary), fontSize = 23.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                    if (selectedCandidateSubtitle.isNotBlank()) {
                        Text(selectedCandidateSubtitle, color = ComposeColor(colors.textSecondary), fontSize = 14.sp, maxLines = 2)
                    }
                    CandidateFactChips()
                }
                PercentCircle(scorePercent(selectedCandidateScore), Modifier.size(78.dp), textSizeDp = 13)
            }
        }
    }

    @Composable
    private fun CandidateFactChips() {
        val facts = buildList {
            selectedCandidateProfileStrength.takeIf { it.isNotBlank() }?.let { add("Profile $it") }
            selectedCandidateGpa.takeIf { it.isNotBlank() }?.let { add("GPA $it") }
            selectedCandidateSemesterLabel.takeIf { it.isNotBlank() }?.let { add(it) }
            if (selectedCandidateResumeUrl.isNotBlank()) add("Resume")
            if (candidateDeeperVideoRow() != null) add("Deeper signal")
        }
        if (facts.isEmpty()) return
        Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            facts.forEach { fact ->
                Surface(color = ComposeColor(colors.background), shape = RoundedCornerShape(999.dp)) {
                    Text(fact, color = ComposeColor(colors.accent), fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp))
                }
            }
        }
    }

    @Composable
    private fun CandidateActionButtons() {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
            val interestSent = selectedCandidateInterestStatus == "sent" || selectedCandidateInterestStatus == "viewed"
            Button(
                onClick = {
                    if (interestSent) {
                        lastApiStatus = "Interest has already been sent to this candidate."
                        setContentView(recruiterShell())
                    } else {
                        sendRecruiterInterestFromSelectedCandidate("Interested from native Android")
                    }
                },
                modifier = Modifier.weight(1f).height(50.dp),
                shape = RoundedCornerShape(16.dp),
                colors = ButtonDefaults.buttonColors(containerColor = if (interestSent) ComposeColor(colors.surface) else ComposeColor(colors.accent)),
            ) {
                Text(if (interestSent) "Interest sent" else "Interest", color = if (interestSent) ComposeColor(colors.accent) else ComposeColor(colors.onAccent), fontWeight = FontWeight.Bold)
            }
            OutlinedButton(onClick = { bookmarkSelectedCandidate() }, modifier = Modifier.weight(1f).height(50.dp), shape = RoundedCornerShape(16.dp)) {
                Text(if (selectedCandidateBookmarked) "Bookmarked" else "Bookmark", fontWeight = FontWeight.Bold)
            }
            OutlinedButton(onClick = { contactSelectedCandidate() }, modifier = Modifier.weight(1f).height(50.dp), shape = RoundedCornerShape(16.dp)) {
                Text("Contact", fontWeight = FontWeight.Bold)
            }
        }
    }

    @Composable
    private fun CandidateVideosSection() {
        candidateIntroVideoRow()?.let { CandidateVideoCard("Intro video", it.subtitle.ifBlank { "10-second candidate introduction." }, it) }
        candidateDeeperVideoRow()?.let { CandidateVideoCard("Deeper signal", it.subtitle.ifBlank { "Candidate deeper signal." }, it) }
        val reels = candidateProfileReelRows()
        if (reels.isNotEmpty()) {
            Text("Profile reels", color = ComposeColor(colors.textPrimary), fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                reels.chunked(3).forEach { rowItems ->
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        rowItems.forEach { row ->
                            CandidateReelThumb(row, Modifier.weight(1f))
                        }
                        repeat(3 - rowItems.size) { Spacer(modifier = Modifier.weight(1f)) }
                    }
                }
            }
        }
    }

    @Composable
    private fun CandidateVideoCard(title: String, subtitle: String, row: AndroidListRow) {
        Card(
            onClick = { openCandidateVideo(row) },
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(22.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(publicVideoCardApplicantName(row), color = ComposeColor(colors.textPrimary), fontSize = 18.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                Surface(color = ComposeColor(Color.BLACK), shape = RoundedCornerShape(18.dp), modifier = Modifier.fillMaxWidth().height(190.dp)) {
                    Box(contentAlignment = Alignment.Center) {
                        VideoThumbnailImage(row.thumbnailUrl, row.mediaUrl)
                        Box(modifier = Modifier.fillMaxSize().background(ComposeColor.Black.copy(alpha = 0.28f)))
                        Icon(Icons.Filled.PlayCircle, contentDescription = "Play video", tint = ComposeColor.White, modifier = Modifier.size(42.dp))
                    }
                }
            }
        }
    }

    @Composable
    private fun CandidateReelThumb(row: AndroidListRow, modifier: Modifier = Modifier) {
        Card(
            onClick = { openCandidateVideo(row) },
            modifier = modifier.height(116.dp),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(Color.BLACK)),
            shape = RoundedCornerShape(16.dp),
        ) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.BottomStart) {
                VideoThumbnailImage(row.thumbnailUrl, row.mediaUrl)
                Box(modifier = Modifier.fillMaxSize().background(ComposeColor.Black.copy(alpha = 0.32f)))
                Icon(Icons.Filled.PlayCircle, contentDescription = "Play reel", tint = ComposeColor.White, modifier = Modifier.align(Alignment.Center).size(30.dp))
                Text(
                    publicVideoCardApplicantName(row),
                    color = ComposeColor.White,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(10.dp),
                    maxLines = 1,
                )
            }
        }
    }

    @Composable
    private fun CandidateResumeCard() {
        MaterialActionCard("Resume", selectedCandidateResume.ifBlank { "Resume is available. Tap to open." }) {
            openCandidateResume()
        }
    }

    @Composable
    private fun CandidateInfoSection(title: String, rows: List<AndroidListRow>) {
        if (rows.isEmpty()) return
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(20.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                MaterialSectionHeader(title, "${rows.size}")
                rows.forEachIndexed { index, row ->
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(row.title, color = ComposeColor(colors.textPrimary), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                        if (row.subtitle.isNotBlank()) {
                            Text(row.subtitle, color = ComposeColor(colors.textSecondary), fontSize = 13.sp)
                        }
                        val linkUrl = firstString(row.raw, "linkUrl", "url", "projectUrl", "publishedUrl")
                        if (linkUrl.isNotBlank()) {
                            TextButton(onClick = { openUrl(linkUrl, "Link is not available for this evidence item.") }) {
                                Text("Open link")
                            }
                        }
                    }
                    if (index != rows.lastIndex) {
                        Surface(color = ComposeColor(colors.border), modifier = Modifier.fillMaxWidth().height(1.dp), content = {})
                    }
                }
            }
        }
    }

    @Composable
    private fun CandidateDecisionBar() {
        val leftAction = if (selectedCandidateReviewStatus == RecruiterReviewStatus.PASSED) RecruiterReviewStatus.MAYBE else RecruiterReviewStatus.PASSED
        val rightAction = if (selectedCandidateReviewStatus == RecruiterReviewStatus.SHORTLISTED) RecruiterReviewStatus.MAYBE else RecruiterReviewStatus.SHORTLISTED
        Surface(color = ComposeColor(colors.background), shadowElevation = 6.dp) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(start = 18.dp, end = 18.dp, top = 10.dp, bottom = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                OutlinedButton(onClick = { updateCandidateReviewStatus(leftAction) }, modifier = Modifier.weight(1f).height(50.dp), shape = RoundedCornerShape(16.dp)) {
                    Text(reviewDecisionLabel(leftAction), fontWeight = FontWeight.Bold)
                }
                Surface(color = ComposeColor(colors.background), shape = RoundedCornerShape(999.dp), modifier = Modifier.weight(0.85f)) {
                    Text(reviewStatusLabel(selectedCandidateReviewStatus), color = ComposeColor(colors.accent), fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 10.dp, vertical = 12.dp), maxLines = 1)
                }
                Button(onClick = { updateCandidateReviewStatus(rightAction) }, modifier = Modifier.weight(1f).height(50.dp), shape = RoundedCornerShape(16.dp), colors = ButtonDefaults.buttonColors(containerColor = ComposeColor(colors.accent))) {
                    Text(reviewDecisionLabel(rightAction), fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    private fun reviewDecisionLabel(status: RecruiterReviewStatus): String {
        return when (status) {
            RecruiterReviewStatus.PASSED -> "Pass"
            RecruiterReviewStatus.SHORTLISTED -> "Shortlist"
            RecruiterReviewStatus.MAYBE,
            RecruiterReviewStatus.NONE,
            -> "Maybe?"
        }
    }

    private fun loadRuntimeMatchAuditForSelectedCandidate() {
        if (requireCandidateId("auditing match")) {
            executeApi(CatoApiContract.auditRuntimeMatching(currentRuntimeSearchSpec(), selectedCandidateId), "runtime match audit") {
                setContentView(recruiterShell())
            }
        }
    }

    private fun candidateEvidenceCard(row: AndroidListRow): View {
        val linkUrl = firstString(row.raw, "linkUrl", "url", "projectUrl", "publishedUrl")
        val body = if (linkUrl.isBlank()) row.subtitle else "${row.subtitle}\n$linkUrl"
        return featureCard(row.title, body) {
            if (linkUrl.isNotBlank()) {
                openUrl(linkUrl, "Link is not available for this evidence item.")
            }
        }
    }

    private fun candidateDecisionControls(compact: Boolean = false): View {
        val leftAction = if (selectedCandidateReviewStatus == RecruiterReviewStatus.PASSED) {
            RecruiterReviewStatus.MAYBE
        } else {
            RecruiterReviewStatus.PASSED
        }
        val rightAction = if (selectedCandidateReviewStatus == RecruiterReviewStatus.SHORTLISTED) {
            RecruiterReviewStatus.MAYBE
        } else {
            RecruiterReviewStatus.SHORTLISTED
        }
        return horizontal(spacing = 10) {
            addView(reviewDecisionButton(leftAction, compact), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            addView(statusPill(reviewStatusLabel(selectedCandidateReviewStatus)), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 0.8f))
            addView(reviewDecisionButton(rightAction, compact), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        }
    }

    private fun reviewDecisionButton(status: RecruiterReviewStatus, compact: Boolean = false): Button {
        val title = if (compact) {
            when (status) {
                RecruiterReviewStatus.PASSED -> "P"
                RecruiterReviewStatus.SHORTLISTED -> "S"
                RecruiterReviewStatus.MAYBE,
                RecruiterReviewStatus.NONE,
                -> "M"
            }
        } else {
            when (status) {
                RecruiterReviewStatus.PASSED -> "Pass"
                RecruiterReviewStatus.SHORTLISTED -> "Shortlist"
                RecruiterReviewStatus.MAYBE,
                RecruiterReviewStatus.NONE,
                -> "Maybe?"
            }
        }
        val makePrimary = status == RecruiterReviewStatus.SHORTLISTED
        val button = if (makePrimary) primaryButton(title) {
            updateCandidateReviewStatus(status)
        } else {
            secondaryButton(title) {
                updateCandidateReviewStatus(status)
            }
        }
        return button
    }

    private fun updateCandidateReviewStatus(status: RecruiterReviewStatus) {
        if (requireCandidateId("updating candidate decision")) {
            executeApiOnSuccess(
                CatoApiContract.updateRecruiterReview(selectedCandidateId, status),
                "${status.wireValue} candidate",
            ) {
                invalidateRecruiterCandidateActionState()
                updateSelectedCandidateReviewStatus(status)
                setContentView(recruiterShell())
            }
        }
    }

    private fun recruiterMessages(): View {
        requestOnce("recruiter-messages", CatoApiContract.recruiterMessages(), "recruiter messages", redrawRecruiter = true)
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    RecruiterMessagesScreen()
                }
            }
        }
    }

    @Composable
    private fun RecruiterMessagesScreen() {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = ComposeColor(colors.background),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 18.dp, vertical = 30.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                MessagesHeader(
                    title = "Messages",
                    subtitle = "Candidate conversations are grouped by applicant.",
                    count = recruiterMessageRows.size,
                    unreadCount = recruiterUnreadMessageCount,
                )
                if (recruiterMessageRows.isEmpty()) {
                    MaterialInfoCard("No messages yet", "Accepted interest requests and candidate conversations will appear here.")
                } else {
                    recruiterMessageRows.forEach { row ->
                        MessageThreadRow(
                            title = row.title,
                            subtitle = row.subtitle.ifBlank { "Open candidate conversation" },
                            badge = row.badge,
                            unread = row.unread,
                        ) {
                            recruiterMessageRows = recruiterMessageRows.map {
                                if (it.id == row.id) it.copy(unread = false) else it
                            }
                            recruiterUnreadMessageCount = recruiterMessageRows.count { it.unread }
                            openRecruiterConversation(row.id.ifBlank { selectedCandidateId }, row.title, row.subtitle)
                        }
                    }
                }
                Spacer(modifier = Modifier.height(96.dp))
            }
        }
    }

    private fun dashboardInterestRequestCard(row: AndroidListRow): View {
        val status = row.badge.normalizedInterestStatus().ifBlank { row.badge.ifBlank { "sent" } }
        val sentAt = firstString(row.raw, "sentAt", "createdAt", "updatedAt")
            .take(10)
            .takeIf { it.isNotBlank() }
        return featureCard(
            title = row.title,
            body = listOf(
                row.subtitle,
                status,
                sentAt?.let { "Sent $it" }.orEmpty(),
            ).filter { it.isNotBlank() }.joinToString("\n"),
        ) {
            selectedCandidateId = row.applicantId.ifBlank { row.id.ifBlank { selectedCandidateId } }
            selectedCandidateName = row.title
            selectedRequestSubtitle = row.subtitle
            selectedCandidateInterestStatus = status.normalizedInterestStatus()
            if (status.normalizedInterestStatus() == "accepted") {
                openRecruiterConversation(selectedCandidateId, selectedCandidateName, selectedRequestSubtitle)
            } else {
                recruiterCandidateProfileReturnDetail = null
                recruiterDetail = "candidate-review"
                setContentView(recruiterShell())
                requestSelectedCandidateHydrationOnce()
            }
        }
    }

    private fun recruiterInterestRequests(): View {
        requestOnce("recruiter-interest-requests", CatoApiContract.recruiterInterestRequests(), "recruiter interest requests", redrawRecruiter = true)
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    RecruiterInterestRequestsScreen()
                }
            }
        }
    }

    @Composable
    private fun RecruiterInterestRequestsScreen() {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = ComposeColor(colors.background),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 18.dp, vertical = 30.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    CompactBackButton {
                        recruiterDetail = null
                        setContentView(recruiterShell())
                    }
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text("Interest Requests", color = ComposeColor(colors.textPrimary), fontSize = 26.sp, fontWeight = FontWeight.Bold)
                        Text("Track sent, accepted, declined, and expired candidate requests.", color = ComposeColor(colors.textSecondary), fontSize = 13.sp)
                    }
                }
                if (recruiterInterestRequestRows.isEmpty()) {
                    MaterialInfoCard("No interest requests yet", "Interest sent to candidates will appear here with their latest status.")
                } else {
                    recruiterInterestRequestRows.forEach { row ->
                        RecruiterSentRequestCard(row)
                    }
                }
                Spacer(modifier = Modifier.height(92.dp))
            }
        }
    }

    @Composable
    private fun RecruiterSentRequestCard(row: AndroidListRow) {
        val status = row.badge.normalizedInterestStatus().ifBlank { row.badge.ifBlank { "sent" } }
        val sentAt = firstString(row.raw, "sentAt", "createdAt", "updatedAt").take(10)
        RequestSurfaceCard(
            title = row.title,
            subtitle = row.subtitle.ifBlank { "Candidate request" },
            status = status,
            meta = sentAt.takeIf { it.isNotBlank() }?.let { "Sent $it" }.orEmpty(),
            unread = row.unread,
            onClick = {
                selectedCandidateId = row.applicantId.ifBlank { row.id.ifBlank { selectedCandidateId } }
                selectedCandidateName = row.title
                selectedRequestSubtitle = row.subtitle
                selectedCandidateInterestStatus = status
                if (status == "accepted") {
                    openRecruiterConversation(selectedCandidateId, selectedCandidateName, selectedRequestSubtitle)
                } else {
                    recruiterDetail = "candidate-review"
                    setContentView(recruiterShell())
                }
            },
        )
    }

    private fun recruiterSecondaryCandidateList(
        title: String,
        subtitle: String,
        rows: List<AndroidListRow>,
        emptyTitle: String,
        emptyBody: String,
        refreshLabel: String,
        request: ApiRequestSpec,
        hydrateLabel: String,
        bookmarkMode: Boolean = false,
        shortlistMode: Boolean = false,
        evidenceMode: Boolean = false,
    ): View {
        return scroll {
            addView(
                vertical(spacing = 16) {
                    setPadding(dp(22), dp(28), dp(22), dp(132))
                    addView(horizontal(spacing = 10) {
                        addView(compactBackButton {
                            recruiterDetail = null
                            setContentView(recruiterShell())
                        })
                        addView(label(title, 26, colors.textPrimary, bold = true))
                    })
                    addView(label(subtitle, 16, colors.textSecondary))
                    lastApiStatus?.let { addView(statusCard(it)) }
                    addView(primaryButton(refreshLabel) {
                        executeApi(request, hydrateLabel) {
                            setContentView(recruiterShell())
                        }
                    })
                    if (rows.isEmpty()) {
                        addView(featureCard(emptyTitle, emptyBody))
                    } else {
                        if (shortlistMode) {
                            val selectedCount = selectedShortlistComparisonIds.size
                            addView(label("Select two to four candidates to compare.", 15, colors.textSecondary))
                            if (selectedCount >= 2) {
                                addView(primaryButton("Compare $selectedCount candidates") {
                                    recruiterDetail = "candidate-comparison"
                                    setContentView(recruiterShell())
                                })
                            } else if (selectedCount == 1) {
                                addView(statusCard("Select one more candidate to compare."))
                            }
                        }
                        rows.forEach { row ->
                            addView(
                                when {
                                    bookmarkMode -> bookmarkedCandidateCard(row)
                                    shortlistMode -> shortlistCandidateCard(row)
                                    evidenceMode -> evidenceCandidateCard(row)
                                    else -> candidateResultCard(row)
                                },
                            )
                        }
                    }
                },
                matchWrapParams(),
            )
        }
    }

    private fun bookmarkedCandidateCard(row: AndroidListRow): View {
        return vertical(spacing = 10) {
            setPadding(dp(18), dp(18), dp(18), dp(18))
            background = CatoAndroidDrawable.rounded(colors.surface, dp(18), colors.border)
            addView(label(row.title, 20, colors.textPrimary, bold = true))
            addView(label(row.subtitle.ifBlank { "Saved candidate" }, 15, colors.textSecondary))
            addView(label(row.badge.ifBlank { "Bookmarked" }, 14, colors.accent, bold = true))
            addView(horizontal(spacing = 10) {
                addView(secondaryButton("Review") {
                    openCandidateFromRow(row)
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(secondaryButton("Contact") {
                    selectedCandidateId = row.id.ifBlank { selectedCandidateId }
                    selectedCandidateName = row.title
                    if (requireCandidateId("opening bookmarked candidate conversation")) {
                        openRecruiterConversation(selectedCandidateId, selectedCandidateName, row.subtitle)
                    }
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            })
            addView(horizontal(spacing = 10) {
                addView(primaryButton("Shortlist") {
                    selectedCandidateId = row.id.ifBlank { selectedCandidateId }
                    selectedCandidateName = row.title
                    if (requireCandidateId("shortlisting bookmarked candidate")) {
                        executeApiOnSuccess(
                            CatoApiContract.updateRecruiterReview(selectedCandidateId, RecruiterReviewStatus.SHORTLISTED),
                            "shortlist bookmarked candidate",
                        ) {
                            invalidateRecruiterCandidateActionState()
                            if (recruiterShortlistRows.none { it.id == row.id }) {
                                recruiterShortlistRows = recruiterShortlistRows + row.copy(badge = row.badge.withReviewStatus("Shortlisted"))
                            }
                            setContentView(recruiterShell())
                        }
                    }
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(secondaryButton("Remove") {
                    selectedCandidateId = row.applicantId.ifBlank { row.id.ifBlank { selectedCandidateId } }
                    selectedCandidateName = row.title
                    if (requireCandidateId("removing bookmarked candidate")) {
                        executeApiOnSuccess(
                            CatoApiContract.removeRecruiterCandidateBookmark(selectedCandidateId),
                            "remove bookmarked candidate",
                        ) {
                            invalidateRecruiterCandidateActionState()
                            recruiterBookmarkRows = recruiterBookmarkRows.filterNot {
                                it.id == selectedCandidateId || it.applicantId == selectedCandidateId
                            }
                            recruiterBookmarkCount = recruiterBookmarkRows.size.toString()
                            setContentView(recruiterShell())
                        }
                    }
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            })
        }
    }

    private fun evidenceCandidateCard(row: AndroidListRow): View {
        val evidence = CatoAndroidJson.objectArray(row.raw, "matchEvidence")
            .ifEmpty { CatoAndroidJson.objectArray(row.raw, "reasons") }
            .map { firstString(it, "title", "reason", "text", "label").ifBlank { "Evidence available" } }
            .take(2)
        val validation = CatoAndroidJson.objectArray(row.raw, "needsValidation")
            .map { firstString(it, "title", "reason", "text", "label").ifBlank { "Needs validation" } }
            .firstOrNull()

        return vertical(spacing = 10) {
            setPadding(dp(18), dp(18), dp(18), dp(18))
            background = CatoAndroidDrawable.rounded(colors.surface, dp(18), colors.border)
            addView(label(row.title, 20, colors.textPrimary, bold = true))
            addView(label(row.subtitle.ifBlank { "Candidate evidence pending" }, 15, colors.textSecondary))
            addView(label(row.badge.ifBlank { "Strong match" }, 14, colors.accent, bold = true))
            if (evidence.isNotEmpty()) {
                addView(label("Evidence", 14, colors.textSecondary, bold = true))
                evidence.forEach { addView(label(it, 14, colors.textPrimary)) }
            }
            validation?.let {
                addView(statusCard("Needs validation: $it"))
            }
            addView(horizontal(spacing = 10) {
                addView(secondaryButton("Review") {
                    openCandidateFromRow(row)
                })
                addView(secondaryButton("Pass") {
                    updateEvidenceCandidate(row, RecruiterReviewStatus.PASSED)
                })
                addView(primaryButton("Shortlist") {
                    updateEvidenceCandidate(row, RecruiterReviewStatus.SHORTLISTED)
                })
            })
        }
    }

    private fun updateEvidenceCandidate(row: AndroidListRow, status: RecruiterReviewStatus) {
        selectedCandidateId = row.id.ifBlank { selectedCandidateId }
        selectedCandidateName = row.title
        if (!requireCandidateId("updating evidence queue candidate")) return
        executeApiOnSuccess(
            CatoApiContract.updateRecruiterReview(selectedCandidateId, status),
            "update evidence candidate",
        ) {
            invalidateRecruiterCandidateActionState()
            recruiterEvidenceRows = recruiterEvidenceRows.filterNot { it.id == row.id }
            if (status == RecruiterReviewStatus.SHORTLISTED && recruiterShortlistRows.none { it.id == row.id }) {
                recruiterShortlistRows = recruiterShortlistRows + row.copy(badge = row.badge.withReviewStatus(reviewStatusLabel(status)))
            }
            setContentView(recruiterShell())
        }
    }

    private fun shortlistCandidateCard(row: AndroidListRow): View {
        val selected = selectedShortlistComparisonIds.contains(row.id)
        return vertical(spacing = 10) {
            setPadding(dp(18), dp(18), dp(18), dp(18))
            background = CatoAndroidDrawable.rounded(
                if (selected) colors.background else colors.surface,
                dp(18),
                if (selected) colors.accent else colors.border,
            )
            addView(horizontal(spacing = 10) {
                addView(secondaryButton(if (selected) "Selected" else "Select") {
                    toggleShortlistComparison(row.id)
                    setContentView(recruiterShell())
                })
                addView(label(row.title, 19, colors.textPrimary, bold = true))
            })
            addView(label(row.subtitle.ifBlank { "Profile details pending" }, 15, colors.textSecondary))
            addView(label(row.badge.ifBlank { "Candidate" }, 14, colors.accent, bold = true))
            addView(horizontal(spacing = 10) {
                addView(secondaryButton("Review") {
                    openCandidateFromRow(row)
                })
                addView(secondaryButton("Pass") {
                    selectedCandidateId = row.id.ifBlank { selectedCandidateId }
                    selectedCandidateName = row.title
                    executeApiOnSuccess(
                        CatoApiContract.updateRecruiterReview(selectedCandidateId, RecruiterReviewStatus.PASSED),
                        "pass shortlisted candidate",
                    ) {
                        invalidateRecruiterCandidateActionState()
                        recruiterShortlistRows = recruiterShortlistRows.filterNot { it.id == row.id }
                        selectedShortlistComparisonIds = selectedShortlistComparisonIds.filterNot { it == row.id }
                        setContentView(recruiterShell())
                    }
                })
            })
        }
    }

    private fun recruiterCandidateComparison(): View {
        val candidates = recruiterShortlistRows.filter { selectedShortlistComparisonIds.contains(it.id) }.take(4)
        requestComparisonCandidateDetails(candidates)
        return scroll {
            addView(
                vertical(spacing = 16) {
                    setPadding(dp(22), dp(28), dp(22), dp(132))
                    addView(horizontal(spacing = 10) {
                        addView(compactBackButton {
                            recruiterDetail = "shortlist"
                            setContentView(recruiterShell())
                        })
                        addView(label("Compare Candidates", 25, colors.textPrimary, bold = true))
                    })
                    if (candidates.isEmpty()) {
                        addView(featureCard("No candidates selected", "Select two to four shortlisted candidates to compare them."))
                    } else {
                        addView(label("${candidates.size} selected", 15, colors.textSecondary, bold = true))
                        candidates.forEach { row ->
                            addView(comparisonCandidateCard(recruiterComparisonDetailRows[row.id] ?: row))
                        }
                    }
                },
                matchWrapParams(),
            )
        }
    }

    private fun requestComparisonCandidateDetails(candidates: List<AndroidListRow>) {
        candidates
            .map { it.id }
            .filter { it.isNotBlank() && recruiterComparisonDetailRows[it] == null }
            .take(4)
            .forEach { candidateId ->
                recruiterComparisonDetailRows = recruiterComparisonDetailRows + (candidateId to AndroidListRow(
                    id = candidateId,
                    title = recruiterShortlistRows.firstOrNull { it.id == candidateId }?.title ?: "Candidate",
                    subtitle = "Loading comparison details",
                ))
                apiGateway.executeCato(CatoApiContract.recruiterCandidate(candidateId)) { result ->
                    runOnUiThread {
                        val response = result.getOrNull()
                        if (response?.isSuccessful == true) {
                            val candidateBody = CatoAndroidJson.objectValue(response.body, "candidate") ?: response.body
                            recruiterComparisonDetailRows = recruiterComparisonDetailRows + (candidateId to comparisonRowFromCandidateBody(candidateId, candidateBody))
                            setContentView(recruiterShell())
                        } else {
                            val fallback = recruiterShortlistRows.firstOrNull { it.id == candidateId }
                            if (fallback != null) {
                                recruiterComparisonDetailRows = recruiterComparisonDetailRows + (candidateId to fallback)
                            }
                        }
                    }
                }
            }
    }

    private fun comparisonRowFromCandidateBody(candidateId: String, body: String): AndroidListRow {
        return AndroidListRow(
            id = candidateId,
            title = firstString(body, "displayName", "name", "candidateName", "applicantName").ifBlank { "Candidate" },
            subtitle = firstString(body, "displaySubtitle", "headline", "major", "universityName").ifBlank { "Profile details pending" },
            badge = CatoAndroidJson.intValue(body, "matchScore")?.let { "$it% match" }
                ?: firstString(body, "matchLabel", "status").ifBlank { "Candidate" },
            applicantId = candidateId,
            raw = body,
        )
    }

    private fun comparisonCandidateCard(row: AndroidListRow): View {
        val body = row.raw
        val profileStrength = CatoAndroidJson.intValue(body, "profileStrength")
            ?: CatoAndroidJson.intValue(body, "profileCompleteness")
            ?: CatoAndroidJson.intValue(body, "profileScore")
        val gpa = firstString(body, "gpa", "gradePointAverage").ifBlank { "Not set" }
        val projects = CatoAndroidJson.objectArray(body, "projects").size
        val internships = CatoAndroidJson.objectArray(body, "internships").size
        val hasResume = body.contains("\"hasResume\":true") || firstString(body, "resumeUrl", "resumePreviewUrl").isNotBlank()
        val evidence = CatoAndroidJson.objectArray(body, "matchEvidence")
            .ifEmpty { CatoAndroidJson.objectArray(body, "reasons") }
            .map { firstString(it, "title", "reason", "text", "label").ifBlank { "Evidence available" } }
            .take(3)

        return vertical(spacing = 10) {
            setPadding(dp(18), dp(18), dp(18), dp(18))
            background = CatoAndroidDrawable.rounded(colors.surface, dp(18), colors.border)
            addView(label(row.title, 21, colors.textPrimary, bold = true))
            addView(label(row.subtitle.ifBlank { "Profile pending" }, 15, colors.textSecondary))
            addView(comparisonMetric("Match", row.badge.ifBlank { "Runtime match" }))
            addView(comparisonMetric("Strength", profileStrength?.let { "$it%" } ?: "Not set"))
            addView(comparisonMetric("GPA", gpa))
            addView(comparisonMetric("Projects", projects.toString()))
            addView(comparisonMetric("Internships", internships.toString()))
            addView(comparisonMetric("Resume", if (hasResume) "Yes" else "No"))
            if (evidence.isNotEmpty()) {
                addView(label("Top evidence", 14, colors.textSecondary, bold = true))
                evidence.forEach { addView(label(it, 14, colors.textPrimary)) }
            }
            addView(secondaryButton("Review ${row.title}") {
                openCandidateFromRow(row)
            })
        }
    }

    private fun comparisonMetric(labelText: String, value: String): View {
        return horizontal(spacing = 8) {
            addView(label(labelText, 14, colors.textSecondary))
            addView(label(value, 14, colors.textPrimary, bold = true))
        }
    }

    private fun recruiterConversation(): View {
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    ConversationScreen(
                        title = selectedCandidateName.ifBlank { "Conversation" },
                        subtitle = selectedRequestSubtitle,
                        isRecruiter = true,
                        onBack = {
                            recruiterDetail = null
                            selectedRecruiterTab = RecruiterTab.MESSAGES
                            setContentView(recruiterShell())
                        },
                        onSend = { body ->
                            if (body.isBlank()) {
                                lastApiStatus = "Write a message before sending."
                                setContentView(recruiterShell())
                            } else if (requireCandidateId("contacting candidate")) {
                                executeApiOnSuccess(CatoApiContract.contactCandidate(selectedCandidateId, body), "contact candidate") {
                                    recruiterMessagesRequested = false
                                    executeApi(CatoApiContract.recruiterCandidateMessages(selectedCandidateId), "candidate messages") {
                                        setContentView(recruiterShell())
                                    }
                                }
                            }
                        },
                    )
                }
            }
        }
    }

    private fun recruiterSettings(): View {
        requestOnce("recruiter-dashboard", CatoApiContract.recruiterDashboard(), "recruiter dashboard", redrawRecruiter = true)
        return scroll {
            addView(
                vertical(spacing = 16) {
                    setPadding(dp(22), dp(32), dp(22), dp(120))
                    addView(label("Settings", 30, colors.textPrimary, bold = true))
                    addView(label("Manage recruiter account, company details, logout, and deletion.", 16, colors.textSecondary))
                    addView(configStatusCard())
                    addView(featureCard(
                        "Recruiter account",
                        listOf(
                            recruiterName.ifBlank { "Recruiter" },
                            recruiterEmail.ifBlank { "Email unavailable" },
                            "Company: ${recruiterCompany.ifBlank { "Not set" }}",
                            "Account ID: ${recruiterAccountId.ifBlank { "Unavailable" }}",
                        ).joinToString("\n"),
                    ))
                    addView(featureCard("Sign out", "Clear local Android session and return to login.") {
                        runtime.sessionStore.clearSynchronously()
                        resetLoadedState()
                        showRoot(CatoRootRoute.SignedOut)
                    })
                    if (recruiterDeleteConfirmationVisible) {
                        addView(dangerConfirmationCard(
                            title = "Delete recruiter account?",
                            body = "This deletes recruiter account data and signs you out. This action cannot be undone from the app.",
                            confirmTitle = "Delete account",
                            onConfirm = {
                                executeApiOnSuccess(CatoApiContract.deleteRecruiterAccount(), "delete recruiter account") {
                                    recruiterDeleteConfirmationVisible = false
                                    runtime.sessionStore.clearSynchronously()
                                    resetLoadedState()
                                    showRoot(CatoRootRoute.SignedOut)
                                }
                            },
                            onCancel = {
                                recruiterDeleteConfirmationVisible = false
                                setContentView(recruiterShell())
                            },
                        ))
                    } else {
                        addView(featureCard("Delete account", "Delete recruiter account data, clear local session, and return to login.") {
                            recruiterDeleteConfirmationVisible = true
                            setContentView(recruiterShell())
                        })
                    }
                },
                matchWrapParams(),
            )
        }
    }

    private fun applicantHome(): View {
        requestOnce("applicant-home", CatoApiContract.applicantProfile(), "applicant profile", redrawRecruiter = false)
        requestOnce("applicant-activity", CatoApiContract.applicantActivity(), "applicant activity", redrawRecruiter = false)
        requestOnce("applicant-requests", CatoApiContract.applicantInterestRequests(), "applicant requests", redrawRecruiter = false)
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    ApplicantHomeScreen()
                }
            }
        }
    }

    @Composable
    private fun ApplicantHomeScreen() {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = ComposeColor(colors.background),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(start = 16.dp, end = 16.dp, top = 42.dp, bottom = 18.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                ApplicantHomeHeader()
                ApplicantProfileStrengthCard()
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ApplicantStatCard(applicantProfileViews, "Views", Modifier.weight(1f))
                    ApplicantStatCard(applicantBookmarkCount, "Saved", Modifier.weight(1f))
                    ApplicantStatCard(applicantShortlistCount, "Shortlists", Modifier.weight(1f))
                }
                ApplicantRequestsPreviewCard()
                ApplicantRecentVisibilityCard()
                Spacer(modifier = Modifier.height(92.dp))
            }
        }
    }

    @Composable
    private fun ApplicantHomeHeader() {
        CatoHomeHeader(
            name = applicantName.ifBlank { "Applicant" },
            subtitle = listOf(applicantMajor, applicantUniversityName, applicantSemesterLabel).filter { it.isNotBlank() }.joinToString(" • ")
                .ifBlank { applicantEmail.ifBlank { "Complete your profile" } },
            showNotificationDot = applicantRequestRows.isNotEmpty(),
        )
    }

    @Composable
    private fun ApplicantProfileStrengthCard() {
        val strength = applicantProfileStrength.toFloatOrNull()?.coerceIn(0f, 100f) ?: 0f
        Card(
            onClick = {
                applicantDetail = "profile-strength"
                setContentView(applicantShell())
            },
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(16.dp),
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                        modifier = Modifier.weight(1f),
                    ) {
                        Text("Profile strength", color = ComposeColor(colors.textPrimary), fontSize = 17.sp, fontWeight = FontWeight.Bold)
                        Text("Tap to see what is missing and improve recruiter preview.", color = ComposeColor(colors.textSecondary), fontSize = 12.sp)
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        ProfileStrengthCircle(strength, Modifier.size(74.dp))
                        Icon(Icons.Filled.ChevronRight, contentDescription = "Open", tint = ComposeColor(colors.textSecondary), modifier = Modifier.size(18.dp))
                    }
                }
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        ApplicantChecklistPill("Resume", applicantHasResumeSignal || applicantResumeUrl.isNotBlank(), Modifier.weight(1f))
                        ApplicantChecklistPill("Short take", applicantHasIntroSignal, Modifier.weight(1f))
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        ApplicantChecklistPill("Deeper signal", applicantHasDeeperSignal, Modifier.weight(1f))
                        ApplicantChecklistPill("Soft skills", applicantHasSoftSkillSignal, Modifier.weight(1f))
                    }
                }
            }
        }
    }

    @Composable
    private fun ProfileStrengthCircle(strength: Float, modifier: Modifier = Modifier) {
        PercentCircle(strength, modifier, textSizeDp = 13)
    }

    @Composable
    private fun PercentCircle(percent: Float, modifier: Modifier = Modifier, textSizeDp: Int = 13) {
        AndroidView(
            modifier = modifier,
            factory = { context ->
                CircleProgressBar(context).apply {
                    setMax(100)
                    setStyle(CircleProgressBar.LINE)
                    setShader(CircleProgressBar.SWEEP)
                    setCap(Paint.Cap.ROUND)
                    setProgressStrokeWidth(dp(34).toFloat())
                    setProgressStartColor(colors.accent)
                    setProgressEndColor(colors.accent)
                    setProgressBackgroundColor(Color.TRANSPARENT)
                    setProgressTextColor(colors.textPrimary)
                    setProgressTextSize(dp(textSizeDp).toFloat())
                }
            },
            update = { view ->
                view.setProgress(percent.toInt().coerceIn(0, 100))
            },
        )
    }

    @Composable
    private fun ApplicantChecklistPill(title: String, isDone: Boolean, modifier: Modifier = Modifier) {
        Surface(
            modifier = modifier,
            color = if (isDone) ComposeColor(colors.background) else ComposeColor(colors.surface),
            shape = RoundedCornerShape(999.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Icon(
                    imageVector = if (isDone) Icons.Filled.CheckCircle else Icons.Filled.RadioButtonUnchecked,
                    contentDescription = title,
                    tint = if (isDone) ComposeColor(colors.accent) else ComposeColor(colors.textSecondary),
                    modifier = Modifier.size(16.dp),
                )
                Text(title, color = ComposeColor(colors.textPrimary), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, maxLines = 1)
            }
        }
    }

    private fun refreshApplicantHome() {
        executeApiOnSuccess(CatoApiContract.applicantProfile(), "applicant profile") {
            executeApiOnSuccess(CatoApiContract.applicantResume(), "applicant resume") {
                executeApiOnSuccess(CatoApiContract.applicantSearchProfile(), "applicant search profile") {
                    executeApiOnSuccess(CatoApiContract.applicantReels(), "applicant reels") {
                        executeApi(CatoApiContract.applicantInterestRequests(), "applicant requests") {
                            setContentView(applicantShell())
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun ApplicantStatCard(value: String, label: String, modifier: Modifier = Modifier) {
        Card(
            modifier = modifier,
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(16.dp),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(5.dp),
            ) {
                Text(value, color = ComposeColor(colors.accent), fontSize = 22.sp, fontWeight = FontWeight.Bold)
                Text(label, color = ComposeColor(colors.textSecondary), fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }

    @Composable
    private fun ApplicantRequestsPreviewCard() {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(16.dp),
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                MaterialSectionHeader("Recruiter requests", applicantRequestRows.size.toString())
                if (applicantRequestRows.isEmpty()) {
                    Text("Interest requests from recruiters will appear here.", color = ComposeColor(colors.textSecondary), fontSize = 14.sp)
                } else {
                    applicantRequestRows.take(3).forEach { row ->
                        MaterialActionCard(
                            title = row.title,
                            body = listOf(row.subtitle, row.badge.normalizedInterestStatus().ifBlank { row.badge }).filter { it.isNotBlank() }.joinToString("\n"),
                            highlighted = row.unread,
                        ) {
                            applicantRequestRows = applicantRequestRows.map {
                                if (it.id == row.id) it.copy(unread = false) else it
                            }
                            applicantUnreadRequestCount = applicantRequestRows.count { it.unread }
                            selectedRequestId = row.id
                            selectedRequestTitle = row.title
                            selectedRequestSubtitle = row.subtitle
                            selectedRequestStatus = row.badge.normalizedInterestStatus().ifBlank { "sent" }
                            if (selectedRequestStatus == "accepted") {
                                openApplicantConversation(selectedRequestId, selectedRequestTitle, selectedRequestSubtitle)
                            } else {
                                applicantDetail = "request-detail"
                                setContentView(applicantShell())
                            }
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun ApplicantRecentVisibilityCard() {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(16.dp),
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                MaterialSectionHeader("Recent visibility", applicantActivityRows.size.toString())
                if (applicantActivityRows.isEmpty()) {
                    Text("Recruiter activity will appear here once your profile is discovered.", color = ComposeColor(colors.textSecondary), fontSize = 14.sp)
                } else {
                    applicantActivityRows.take(4).forEach { row ->
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Surface(
                                color = ComposeColor(colors.background),
                                shape = CircleShape,
                                modifier = Modifier.size(26.dp),
                            ) {
                                Icon(Icons.Filled.Search, contentDescription = null, tint = ComposeColor(colors.accent), modifier = Modifier.padding(5.dp))
                            }
                            Column(verticalArrangement = Arrangement.spacedBy(2.dp), modifier = Modifier.weight(1f)) {
                                Text(row.title, color = ComposeColor(colors.textPrimary), fontSize = 14.sp, fontWeight = FontWeight.SemiBold)
                                if (row.subtitle.isNotBlank()) {
                                    Text(row.subtitle, color = ComposeColor(colors.textSecondary), fontSize = 12.sp)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private fun applicantRequests(): View {
        requestOnce("applicant-requests", CatoApiContract.applicantInterestRequests(), "applicant requests", redrawRecruiter = false)
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    ApplicantRequestsScreen()
                }
            }
        }
    }

    @Composable
    private fun ApplicantRequestsScreen() {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = ComposeColor(colors.background),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 18.dp, vertical = 30.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                MessagesHeader(
                    title = "Requests",
                    subtitle = "Accepted requests become recruiter conversations.",
                    count = applicantRequestRows.size,
                    unreadCount = applicantUnreadRequestCount,
                )
                if (applicantRequestRows.isEmpty()) {
                    MaterialInfoCard("No requests yet", "Recruiter interest requests will appear here when companies want to connect.")
                } else {
                    applicantRequestRows.forEach { row ->
                        ApplicantInterestRequestCard(row)
                    }
                }
                Spacer(modifier = Modifier.height(92.dp))
            }
        }
    }

    @Composable
    private fun ApplicantInterestRequestCard(row: AndroidListRow) {
        val status = row.badge.normalizedInterestStatus().ifBlank { row.badge.ifBlank { "sent" } }
        val sentAt = firstString(row.raw, "sentAt", "createdAt", "updatedAt").take(10)
        RequestSurfaceCard(
            title = row.title,
            subtitle = row.subtitle.ifBlank { "Recruiter request" },
            status = status,
            meta = sentAt.takeIf { it.isNotBlank() }?.let { "Sent $it" }.orEmpty(),
            unread = row.unread,
            onClick = {
                openApplicantRequest(row, status)
            },
            actions = {
                when {
                    status.isPendingInterestStatus() -> {
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                            OutlinedButton(
                                onClick = { respondToApplicantRequest(row, ApplicantInterestAction.DECLINE) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(14.dp),
                            ) {
                                Text("Decline")
                            }
                            Button(
                                onClick = { respondToApplicantRequest(row, ApplicantInterestAction.ACCEPT) },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(14.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = ComposeColor(colors.accent)),
                            ) {
                                Text("Accept", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                    status == "accepted" -> {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Icon(Icons.Filled.ChatBubble, contentDescription = null, tint = ComposeColor(colors.accent), modifier = Modifier.size(18.dp))
                            Text("Tap to open the conversation.", color = ComposeColor(colors.textSecondary), fontSize = 12.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                            Icon(Icons.Filled.ChevronRight, contentDescription = null, tint = ComposeColor(colors.textSecondary), modifier = Modifier.size(16.dp))
                        }
                    }
                }
            },
        )
    }

    private fun openApplicantRequest(row: AndroidListRow, status: String) {
        applicantRequestRows = applicantRequestRows.map {
            if (it.id == row.id) it.copy(unread = false) else it
        }
        applicantUnreadRequestCount = applicantRequestRows.count { it.unread }
        selectedRequestId = row.id
        selectedRequestTitle = row.title
        selectedRequestSubtitle = row.subtitle
        selectedRequestStatus = status
        if (selectedRequestStatus == "accepted") {
            openApplicantConversation(selectedRequestId, selectedRequestTitle, selectedRequestSubtitle)
        } else {
            applicantDetail = "request-detail"
            setContentView(applicantShell())
        }
    }

    private fun respondToApplicantRequest(row: AndroidListRow, action: ApplicantInterestAction) {
        selectedRequestId = row.id
        selectedRequestTitle = row.title
        selectedRequestSubtitle = row.subtitle
        executeApiOnSuccess(CatoApiContract.respondToApplicantInterestRequest(row.id, action), "respond applicant request") {
            applicantRequestsRequested = false
            executeApi(CatoApiContract.applicantInterestRequests(), "applicant requests") {
                setContentView(applicantShell())
            }
        }
    }

    private fun applicantRecentVisibilityCard(): View {
        return vertical(spacing = 10) {
            setPadding(dp(18), dp(18), dp(18), dp(18))
            background = CatoAndroidDrawable.rounded(colors.surface, dp(22), colors.border)
            addView(applicantSectionDivider("Recent visibility", applicantActivityRows.size.toString()))
            if (applicantActivityRows.isEmpty()) {
                addView(label("Recruiter activity will appear here once your profile is discovered.", 15, colors.textSecondary))
            } else {
                applicantActivityRows.take(4).forEach { row ->
                    addView(label(row.title, 15, colors.textPrimary, bold = true))
                    if (row.subtitle.isNotBlank()) {
                        addView(label(row.subtitle, 13, colors.textSecondary))
                    }
                }
            }
        }
    }

    private fun applicantConversation(): View {
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    ConversationScreen(
                        title = selectedRequestTitle.ifBlank { "Conversation" },
                        subtitle = selectedRequestSubtitle,
                        isRecruiter = false,
                        onBack = {
                            applicantDetail = null
                            selectedApplicantTab = ApplicantTab.REQUESTS
                            setContentView(applicantShell())
                        },
                        onSend = { body ->
                            if (body.isBlank()) {
                                lastApiStatus = "Write a reply before sending."
                                setContentView(applicantShell())
                            } else if (requireRequestId("sending reply")) {
                                executeApiOnSuccess(CatoApiContract.sendApplicantConversationMessage(selectedRequestId, body), "send applicant reply") {
                                    applicantRequestsRequested = false
                                    executeApi(CatoApiContract.applicantConversationMessages(selectedRequestId), "applicant conversation messages") {
                                        setContentView(applicantShell())
                                    }
                                }
                            }
                        },
                    )
                }
            }
        }
    }

    @Composable
    private fun ConversationScreen(
        title: String,
        subtitle: String,
        isRecruiter: Boolean,
        onBack: () -> Unit,
        onSend: (String) -> Unit,
    ) {
        var draft by remember { mutableStateOf("") }
        val scrollState = rememberScrollState()
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = ComposeColor(colors.background),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(start = 16.dp, end = 16.dp, top = 24.dp, bottom = 12.dp),
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    CompactBackButton(onBack)
                    Surface(
                        color = ComposeColor(colors.background),
                        shape = CircleShape,
                        modifier = Modifier.size(42.dp),
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                title.firstOrNull()?.uppercase() ?: "C",
                                color = ComposeColor(colors.accent),
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                            )
                        }
                    }
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(title, color = ComposeColor(colors.textPrimary), fontSize = 21.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                        if (subtitle.isNotBlank()) {
                            Text(subtitle, color = ComposeColor(colors.textSecondary), fontSize = 12.sp, maxLines = 1)
                        }
                    }
                }
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f),
                    color = ComposeColor(colors.surface),
                    shape = RoundedCornerShape(24.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(scrollState)
                            .padding(horizontal = 12.dp, vertical = 14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        if (selectedConversationRows.isEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(top = 42.dp),
                                contentAlignment = Alignment.Center,
                            ) {
                                Text(
                                    "Send a message to start the conversation.",
                                    color = ComposeColor(colors.textSecondary),
                                    fontSize = 14.sp,
                                )
                            }
                        } else {
                            var dividerShown = false
                            selectedConversationRows.forEach { row ->
                                if (row.unread && !dividerShown) {
                                    ConversationUnreadDivider()
                                    dividerShown = true
                                }
                                ConversationBubble(row = row, isRecruiterViewer = isRecruiter)
                            }
                        }
                        Spacer(modifier = Modifier.height(4.dp))
                    }
                }
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp),
                    color = ComposeColor.Transparent,
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(start = 0.dp, end = 0.dp, top = 4.dp, bottom = 4.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        OutlinedTextField(
                            value = draft,
                            onValueChange = { draft = it },
                            modifier = Modifier.weight(1f),
                            placeholder = { Text(if (isRecruiter) "Message applicant" else "Message recruiter") },
                            minLines = 1,
                            maxLines = 4,
                            shape = RoundedCornerShape(22.dp),
                        )
                        Button(
                            onClick = {
                                val body = draft.trim()
                                if (body.isNotBlank()) {
                                    draft = ""
                                }
                                onSend(body)
                            },
                            modifier = Modifier.size(52.dp),
                            shape = CircleShape,
                            colors = ButtonDefaults.buttonColors(containerColor = ComposeColor(colors.accent)),
                            contentPadding = androidx.compose.foundation.layout.PaddingValues(0.dp),
                        ) {
                            Icon(
                                imageVector = Icons.Filled.Send,
                                contentDescription = "Send",
                                tint = ComposeColor(colors.onAccent),
                                modifier = Modifier.size(22.dp),
                            )
                        }
                    }
                }
                Spacer(modifier = Modifier.height(72.dp))
            }
        }
    }

    @Composable
    private fun ConversationBubble(row: AndroidListRow, isRecruiterViewer: Boolean) {
        val sender = row.title.lowercase()
        val isMine = (isRecruiterViewer && sender == "recruiter") || (!isRecruiterViewer && sender == "applicant")
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = if (isMine) Arrangement.End else Arrangement.Start,
        ) {
            Surface(
                color = if (isMine) ComposeColor(colors.accent) else ComposeColor(colors.surface),
                shape = RoundedCornerShape(
                    topStart = 18.dp,
                    topEnd = 18.dp,
                    bottomStart = if (isMine) 18.dp else 4.dp,
                    bottomEnd = if (isMine) 4.dp else 18.dp,
                ),
                shadowElevation = 0.dp,
                border = if (isMine) null else androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
                modifier = Modifier.fillMaxWidth(0.78f),
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Text(
                        if (isMine) "You" else row.title.replaceFirstChar { it.uppercase() },
                        color = if (isMine) ComposeColor(colors.onAccent) else ComposeColor(colors.textPrimary),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        row.subtitle,
                        color = if (isMine) ComposeColor(colors.onAccent) else ComposeColor(colors.textSecondary),
                        fontSize = 15.sp,
                        fontWeight = if (row.unread) FontWeight.Bold else FontWeight.Normal,
                    )
                }
            }
        }
    }

    @Composable
    private fun ConversationUnreadDivider() {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center,
        ) {
            Surface(
                color = ComposeColor(colors.background),
                shape = RoundedCornerShape(999.dp),
            ) {
                Text(
                    "New messages",
                    color = ComposeColor(colors.accent),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                )
            }
        }
    }

    private fun openApplicantConversation(requestId: String, title: String, preview: String) {
        selectedRequestId = requestId.ifBlank { selectedRequestId }
        selectedRequestTitle = title
        selectedRequestSubtitle = preview
        applicantDetail = "applicant-conversation"
        setContentView(applicantShell())
        if (selectedRequestId.isNotBlank()) {
            executeApi(CatoApiContract.applicantConversationMessages(selectedRequestId), "applicant conversation messages") {
                setContentView(applicantShell())
            }
        }
    }

    private fun applicantResumeExtraction(): View {
        requestOnce("applicant-resume", CatoApiContract.applicantResume(), "applicant resume", redrawRecruiter = false)
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    ApplicantResumeExtractionScreen()
                }
            }
        }
    }

    @Composable
    private fun ApplicantResumeExtractionScreen() {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = ComposeColor(colors.background),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 22.dp, vertical = 28.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                OutlinedButton(
                    onClick = {
                        applicantDetail = null
                        selectedApplicantTab = ApplicantTab.SETTINGS
                        setContentView(applicantShell())
                    },
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Text("Back", fontWeight = FontWeight.Bold)
                }
                Text("Resume extraction", color = ComposeColor(colors.textPrimary), fontSize = 26.sp, fontWeight = FontWeight.Bold)
                Text("Resume parsing improves recruiter search, but missing or failed parsing should not block using Cato.", color = ComposeColor(colors.textSecondary), fontSize = 16.sp)
                lastApiStatus?.let { MaterialStatusCard(it) }
                MaterialInfoCard("Current resume status", applicantResumeSummary)
                OutlinedButton(
                    onClick = {
                        executeApi(CatoApiContract.applicantResume(), "applicant resume") {
                            setContentView(applicantShell())
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Text("Refresh resume status", fontWeight = FontWeight.Bold)
                }
                PrimaryMaterialAction("Choose PDF resume") {
                    chooseResumePdf()
                }
                if (applicantResumeUrl.isNotBlank()) {
                    OutlinedButton(
                        onClick = { openResumePreview(applicantResumeUrl, "Resume", isRecruiter = false) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(54.dp),
                        shape = RoundedCornerShape(16.dp),
                    ) {
                        Text("Open uploaded resume", fontWeight = FontWeight.Bold)
                    }
                } else {
                    MaterialInfoCard("Resume preview unavailable", "Upload a PDF resume before opening the in-app preview.")
                }
                OutlinedButton(
                    onClick = {
                        applicantDetail = "manual-matching"
                        setContentView(applicantShell())
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Text("Add matching fields manually", fontWeight = FontWeight.Bold)
                }
                OutlinedButton(
                    onClick = {
                        executeApiOnSuccess(CatoApiContract.skipApplicantResume(), "skip resume") {
                            applicantResumeSummary = "Resume skipped. Add manual matching fields so recruiters can still find you."
                            applicantDetail = "manual-matching"
                            setContentView(applicantShell())
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Text("Continue without resume", fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.height(92.dp))
            }
        }
    }

    private fun applicantProfileStrengthDetail(): View {
        requestOnce("applicant-home", CatoApiContract.applicantProfile(), "applicant profile", redrawRecruiter = false)
        requestOnce("applicant-resume", CatoApiContract.applicantResume(), "applicant resume", redrawRecruiter = false)
        return scroll {
            addView(
                vertical(spacing = 16) {
                    setPadding(dp(22), dp(28), dp(22), dp(120))
                    addView(horizontal(spacing = 10) {
                        addView(compactBackButton {
                            applicantDetail = null
                            selectedApplicantTab = ApplicantTab.HOME
                            setContentView(applicantShell())
                        })
                        addView(label("Profile strength", 26, colors.textPrimary, bold = true))
                    })
                    addView(label("This is used for ranking quality, not for blocking your profile.", 16, colors.textSecondary))
                    lastApiStatus?.let { addView(statusCard(it)) }
                    addView(featureCard(applicantProfileStrengthLabel(), "Resume, intro video, deeper signal, proof projects, soft-skill setup, and internships contribute to this score."))
                    addView(strengthChecklistCard(
                        title = "Resume",
                        complete = applicantHasResumeSignal || applicantResumeUrl.isNotBlank(),
                        completeText = "Resume is available for recruiter review and search.",
                        missingText = "Upload a PDF resume or add manual matching fields if parsing is missing.",
                        actionTitle = "Resume setup",
                    ) {
                        applicantDetail = "resume-extraction"
                        setContentView(applicantShell())
                    })
                    addView(strengthChecklistCard(
                        title = "Intro video",
                        complete = applicantHasIntroSignal,
                        completeText = "Your 10-second intro is available.",
                        missingText = "Add the short intro so recruiters see your profile hook first.",
                        actionTitle = "Open reels",
                    ) {
                        selectedApplicantTab = ApplicantTab.REELS
                        applicantDetail = null
                        setContentView(applicantShell())
                    })
                    addView(strengthChecklistCard(
                        title = "Deeper signal",
                        complete = applicantHasDeeperSignal,
                        completeText = "Your deeper signal is available.",
                        missingText = "Optional, but it gives recruiters stronger context.",
                        actionTitle = "Open profile",
                    ) {
                        selectedApplicantTab = ApplicantTab.PROFILE
                        applicantDetail = null
                        setContentView(applicantShell())
                    })
                    addView(strengthChecklistCard(
                        title = "Projects",
                        complete = applicantProjectRows.isNotEmpty(),
                        completeText = "${applicantProjectRows.size} project(s) added.",
                        missingText = "Projects carry meaningful profile-strength weight and can be linked to reels.",
                        actionTitle = "Manage projects",
                    ) {
                        selectedProjectId = ""
                        resetProjectDraft()
                        applicantDetail = "projects"
                        setContentView(applicantShell())
                    })
                    addView(strengthChecklistCard(
                        title = "Internships",
                        complete = applicantInternshipRows.isNotEmpty(),
                        completeText = "Internship signal is present.",
                        missingText = "Internships help but are intentionally capped so students without one are not punished too heavily.",
                        actionTitle = "Manage internships",
                    ) {
                        selectedInternshipId = ""
                        resetInternshipDraft()
                        applicantDetail = "internships"
                        setContentView(applicantShell())
                    })
                    addView(strengthChecklistCard(
                        title = "Manual matching fields",
                        complete = !shouldShowApplicantSearchRecovery(),
                        completeText = "Manual matching setup is available.",
                        missingText = "Add fields, skills, and one fluency depth so recruiter search can still find you.",
                        actionTitle = "Manual setup",
                    ) {
                        applicantDetail = "manual-matching"
                        setContentView(applicantShell())
                    })
                },
                matchWrapParams(),
            )
        }
    }

    private fun strengthChecklistCard(
        title: String,
        complete: Boolean,
        completeText: String,
        missingText: String,
        actionTitle: String,
        action: () -> Unit,
    ): View {
        val status = if (complete) "Complete" else "Needs attention"
        val body = "$status\n${if (complete) completeText else missingText}"
        return featureCard(title, body, action)
    }

    private fun applicantManualMatchingEditor(): View {
        requestApplicantManualOptionsOnce()
        return scroll {
            val rootScroll = this
            addView(
                vertical(spacing = 16) {
                    setPadding(dp(22), dp(28), dp(22), dp(120))
                    addView(horizontal(spacing = 10) {
                        addView(compactBackButton {
                            applicantDetail = null
                            setContentView(applicantShell())
                        })
                        addView(label("Set me up", 26, colors.textPrimary, bold = true))
                    })
                    addView(label("Use this when resume extraction is empty, failed, or incomplete.", 16, colors.textSecondary))
                    if (applicantManualProfileSummary.isNotBlank()) {
                        addView(featureCard("Manual matching", applicantManualProfileSummary))
                    }
                    addView(sectionTitle("Fields / industries ${applicantManualSelectedFields.size}/10"))
                    val manualFieldInput = input("Search or add a field", applicantManualFieldQuery)
                    val manualFieldResults = vertical(spacing = 8) {}
                    fun renderManualFieldResults() {
                        manualFieldResults.removeAllViews()
                        if (applicantManualSelectedFields.isNotEmpty()) {
                            manualFieldResults.addView(selectedSearchChipRow("Selected fields", applicantManualSelectedFields.map { it.title }))
                        }
                        manualOptionRows(
                            options = filterOptions(
                                applicantManualFieldOptions,
                                applicantManualFieldQuery,
                            ),
                            selected = applicantManualSelectedFields,
                            max = 10,
                            type = MatchingOptionType.CATEGORY,
                            onAfterToggle = {
                                applicantManualFieldQuery = ""
                                manualFieldInput.setText("")
                                hideKeyboard()
                                renderManualFieldResults()
                            },
                        ).forEach { manualFieldResults.addView(it) }
                        if (shouldShowAddOption(applicantManualFieldQuery, applicantManualFieldOptions)) {
                            manualFieldResults.addView(featureCard("Add field: ${applicantManualFieldQuery.trim()}", "No matching field exists yet. Add it as a standardized option.") {
                                executeApi(CatoApiContract.addMatchingOption(MatchingOptionType.CATEGORY, applicantManualFieldQuery.trim()), "add manual field option") {
                                    setContentView(applicantShell())
                                }
                            })
                        }
                        if (applicantManualFieldOptions.isEmpty()) {
                            manualFieldResults.addView(featureCard("No fields available", "Type a field above to add it as a standardized option."))
                        }
                    }
                    manualFieldInput.onTextChanged { value ->
                        applicantManualFieldQuery = value
                        renderManualFieldResults()
                    }
                    manualFieldInput.installTrailingClearButton {
                        applicantManualFieldQuery = ""
                        renderManualFieldResults()
                    }
                    manualFieldInput.onKeyboardSearch { value ->
                        applicantManualFieldQuery = value
                        renderManualFieldResults()
                    }
                    manualFieldInput.keepSearchResultsVisible(rootScroll, manualFieldResults)
                    addView(manualFieldInput)
                    renderManualFieldResults()
                    addView(manualFieldResults)
                    addView(sectionTitle("Skills ${applicantManualSelectedSkills.size}/100"))
                    val manualSkillInput = input("Search or add a skill", applicantManualSkillQuery)
                    val manualSkillResults = vertical(spacing = 8) {}
                    fun renderManualSkillResults() {
                        manualSkillResults.removeAllViews()
                        if (applicantManualSelectedSkills.isNotEmpty()) {
                            manualSkillResults.addView(selectedSearchChipRow("Selected skills", applicantManualSelectedSkills.map { it.title }))
                        }
                        manualOptionRows(
                            options = filterOptions(
                                applicantManualSkillOptions,
                                applicantManualSkillQuery,
                            ),
                            selected = applicantManualSelectedSkills,
                            max = 100,
                            type = MatchingOptionType.SKILL,
                            onAfterToggle = {
                                applicantManualSkillQuery = ""
                                manualSkillInput.setText("")
                                hideKeyboard()
                                renderManualSkillResults()
                            },
                        ).forEach { manualSkillResults.addView(it) }
                        if (shouldShowAddOption(applicantManualSkillQuery, applicantManualSkillOptions)) {
                            manualSkillResults.addView(featureCard("Add skill: ${applicantManualSkillQuery.trim()}", "No matching skill exists yet. Add it as a standardized option.") {
                                executeApi(CatoApiContract.addMatchingOption(MatchingOptionType.SKILL, applicantManualSkillQuery.trim()), "add manual skill option") {
                                    setContentView(applicantShell())
                                }
                            })
                        }
                        if (applicantManualSkillOptions.isEmpty()) {
                            manualSkillResults.addView(featureCard("No skills available", "Type a skill above to add it as a standardized option."))
                        }
                    }
                    manualSkillInput.onTextChanged { value ->
                        applicantManualSkillQuery = value
                        renderManualSkillResults()
                    }
                    manualSkillInput.installTrailingClearButton {
                        applicantManualSkillQuery = ""
                        renderManualSkillResults()
                    }
                    manualSkillInput.onKeyboardSearch { value ->
                        applicantManualSkillQuery = value
                        renderManualSkillResults()
                    }
                    manualSkillInput.keepSearchResultsVisible(rootScroll, manualSkillResults)
                    addView(manualSkillInput)
                    renderManualSkillResults()
                    addView(manualSkillResults)
                    addView(manualDepthSection())
                    addView(primaryButton("Save manual matching") {
                        val depthId = applicantManualDepthId
                            .ifBlank { (if (applicantManualDepthType == MatchingOptionType.SKILL) applicantManualSelectedSkills else applicantManualSelectedFields).firstOrNull()?.id.orEmpty() }
                        if (applicantManualSelectedSkills.isEmpty() || applicantManualSelectedFields.isEmpty() || depthId.isBlank()) {
                            lastApiStatus = "Choose at least one field, one skill, and one depth before saving."
                            setContentView(applicantShell())
                        } else {
                            executeApiOnSuccess(
                                CatoApiContract.saveApplicantSearchProfile(
                                    skillIds = applicantManualSelectedSkills.map { it.id },
                                    fieldIds = applicantManualSelectedFields.map { it.id },
                                    depth = MatchingDepth(applicantManualDepthType, depthId),
                                ),
                                "save manual matching",
                            ) {
                                applicantProfileRequested = false
                                applicantFinalSearchStatusRequested = false
                                setContentView(applicantShell())
                            }
                        }
                    })
                },
                matchWrapParams(),
            )
        }
    }

    private fun applicantProjectsManager(): View {
        requestOnce("applicant-profile", CatoApiContract.applicantProfile(), "applicant profile", redrawRecruiter = false)
        return scroll {
            addView(
                vertical(spacing = 16) {
                    setPadding(dp(22), dp(28), dp(22), dp(120))
                    addView(horizontal(spacing = 10) {
                        addView(compactBackButton {
                            selectedProjectId = ""
                            applicantDetail = null
                            selectedApplicantTab = ApplicantTab.PROFILE
                            setContentView(applicantShell())
                        })
                        addView(label("What I Built", 26, colors.textPrimary, bold = true))
                    })
                    addView(label("Add or edit projects that recruiters can review and reels can prove.", 16, colors.textSecondary))
                    lastApiStatus?.let { addView(statusCard(it)) }
                    applicantProjectRows.filter { it.id.isNotBlank() }.forEach { row ->
                        addView(featureCard(row.title, row.subtitle) {
                            selectedProjectId = row.id
                            projectDraftTitle = row.title
                            projectDraftDescription = row.subtitle
                            projectDraftType = firstString(row.raw, "type", "projectType").ifBlank { "built_project" }
                            projectDraftLink = firstString(row.raw, "linkUrl", "url", "projectUrl", "publishedUrl")
                            setContentView(applicantShell())
                        })
                    }
                    addView(sectionTitle(if (selectedProjectId.isBlank()) "Add project" else "Edit project"))
                    val titleInput = input("Project title")
                    titleInput.setText(projectDraftTitle)
                    addView(titleInput)
                    val typeInput = input("Project type")
                    typeInput.setText(projectDraftType)
                    addView(typeInput)
                    val descriptionInput = input("Description")
                    descriptionInput.setText(projectDraftDescription)
                    addView(descriptionInput)
                    val linkInput = input("Link optional")
                    linkInput.setText(projectDraftLink)
                    addView(linkInput)
                    addView(primaryButton(if (selectedProjectId.isBlank()) "Add project" else "Save project") {
                        projectDraftTitle = titleInput.text.toString().trim()
                        projectDraftType = typeInput.text.toString().trim().ifBlank { "built_project" }
                        projectDraftDescription = descriptionInput.text.toString().trim()
                        projectDraftLink = linkInput.text.toString().trim()
                        val command = currentProjectCommand()
                        if (command.title.isBlank() || command.description.isBlank()) {
                            lastApiStatus = "Project title and description are required."
                            setContentView(applicantShell())
                        } else if (selectedProjectId.isBlank()) {
                            executeApiOnSuccess(CatoApiContract.createApplicantProject(command), "create project") {
                                invalidateApplicantProofProfileState()
                                resetProjectDraft()
                                setContentView(applicantShell())
                            }
                        } else {
                            executeApiOnSuccess(CatoApiContract.updateApplicantProject(selectedProjectId, command), "update selected project") {
                                invalidateApplicantProofProfileState()
                                resetProjectDraft()
                                selectedProjectId = ""
                                setContentView(applicantShell())
                            }
                        }
                    })
                    if (selectedProjectId.isNotBlank()) {
                        addView(secondaryButton("Delete selected project") {
                            executeApiOnSuccess(CatoApiContract.deleteApplicantProject(selectedProjectId), "delete selected project") {
                                invalidateApplicantProofProfileState()
                                applicantProjectRows = applicantProjectRows.filterNot { it.id == selectedProjectId }
                                resetProjectDraft()
                                selectedProjectId = ""
                                setContentView(applicantShell())
                            }
                        })
                        addView(secondaryButton("Cancel edit") {
                            resetProjectDraft()
                            selectedProjectId = ""
                            setContentView(applicantShell())
                        })
                    }
                },
                matchWrapParams(),
            )
        }
    }

    private fun applicantInternshipsManager(): View {
        requestOnce("applicant-profile", CatoApiContract.applicantProfile(), "applicant profile", redrawRecruiter = false)
        return scroll {
            addView(
                vertical(spacing = 16) {
                    setPadding(dp(22), dp(28), dp(22), dp(120))
                    addView(horizontal(spacing = 10) {
                        addView(compactBackButton {
                            selectedInternshipId = ""
                            applicantDetail = null
                            selectedApplicantTab = ApplicantTab.PROFILE
                            setContentView(applicantShell())
                        })
                        addView(label("Internships", 26, colors.textPrimary, bold = true))
                    })
                    addView(label("Internships are optional proof and should not dominate profile strength.", 16, colors.textSecondary))
                    lastApiStatus?.let { addView(statusCard(it)) }
                    applicantInternshipRows.filter { it.id.isNotBlank() }.forEach { row ->
                        addView(featureCard(row.title, row.subtitle) {
                            selectedInternshipId = row.id
                            internshipDraftCompany = firstString(row.raw, "company", "companyName").ifBlank { row.title }
                            internshipDraftRoleDepartment = firstString(row.raw, "roleDepartment", "role", "department").ifBlank { row.subtitle.ifBlank { "Engineering" } }
                            internshipDraftDurationMonths = CatoAndroidJson.intValue(row.raw, "durationMonths")?.toString() ?: "1"
                            setContentView(applicantShell())
                        })
                    }
                    addView(sectionTitle(if (selectedInternshipId.isBlank()) "Add internship" else "Edit internship"))
                    val companyInput = input("Company")
                    companyInput.setText(internshipDraftCompany)
                    addView(companyInput)
                    val roleInput = input("Role area")
                    roleInput.setText(internshipDraftRoleDepartment)
                    addView(roleInput)
                    val durationInput = input("Duration in months")
                    durationInput.setText(internshipDraftDurationMonths)
                    addView(durationInput)
                    addView(primaryButton(if (selectedInternshipId.isBlank()) "Add internship" else "Save internship") {
                        internshipDraftCompany = companyInput.text.toString().trim()
                        internshipDraftRoleDepartment = roleInput.text.toString().trim().ifBlank { "Engineering" }
                        internshipDraftDurationMonths = durationInput.text.toString().trim()
                        val command = currentInternshipCommand()
                        if (command.company.isBlank()) {
                            lastApiStatus = "Company is required."
                            setContentView(applicantShell())
                        } else if (command.durationMonths <= 0) {
                            lastApiStatus = "Duration must be a positive number of months."
                            setContentView(applicantShell())
                        } else if (selectedInternshipId.isBlank()) {
                            executeApiOnSuccess(CatoApiContract.createApplicantInternship(command), "create internship") {
                                invalidateApplicantProofProfileState()
                                resetInternshipDraft()
                                setContentView(applicantShell())
                            }
                        } else {
                            executeApiOnSuccess(CatoApiContract.updateApplicantInternship(selectedInternshipId, command), "update selected internship") {
                                invalidateApplicantProofProfileState()
                                resetInternshipDraft()
                                selectedInternshipId = ""
                                setContentView(applicantShell())
                            }
                        }
                    })
                    if (selectedInternshipId.isNotBlank()) {
                        addView(secondaryButton("Delete selected internship") {
                            executeApiOnSuccess(CatoApiContract.deleteApplicantInternship(selectedInternshipId), "delete selected internship") {
                                invalidateApplicantProofProfileState()
                                applicantInternshipRows = applicantInternshipRows.filterNot { it.id == selectedInternshipId }
                                resetInternshipDraft()
                                selectedInternshipId = ""
                                setContentView(applicantShell())
                            }
                        })
                        addView(secondaryButton("Cancel edit") {
                            resetInternshipDraft()
                            selectedInternshipId = ""
                            setContentView(applicantShell())
                        })
                    }
                },
                matchWrapParams(),
            )
        }
    }

    private fun applicantAccomplishmentsManager(): View {
        requestOnce("applicant-accomplishments", CatoApiContract.applicantAccomplishments(), "applicant accomplishments", redrawRecruiter = false)
        return scroll {
            addView(
                vertical(spacing = 16) {
                    setPadding(dp(22), dp(28), dp(22), dp(120))
                    addView(horizontal(spacing = 10) {
                        addView(compactBackButton {
                            clearReelEvidenceDraftText()
                            applicantDetail = null
                            selectedApplicantTab = ApplicantTab.PROFILE
                            setContentView(applicantShell())
                        })
                        addView(label("Accomplishments", 26, colors.textPrimary, bold = true))
                    })
                    addView(label("Add proof-worthy wins that can be linked to reels and shown to recruiters.", 16, colors.textSecondary))
                    lastApiStatus?.let { addView(statusCard(it)) }
                    if (applicantAccomplishmentRows.isEmpty()) {
                        addView(featureCard("No accomplishments yet", "Add awards, publications, leadership wins, shipped outcomes, or measurable achievements."))
                    } else {
                        applicantAccomplishmentRows.filter { it.id.isNotBlank() }.forEach { row ->
                            addView(featureCard(row.title, row.subtitle) {
                                addPendingReelEvidence(ApplicantVideoEvidenceLink("accomplishment", row.id))
                                applicantDetail = "reel-upload"
                                setContentView(applicantShell())
                            })
                        }
                    }
                    addView(sectionTitle("Add accomplishment"))
                    val titleInput = input("Title", reelEvidenceDraftTitle)
                    addView(titleInput)
                    val descriptionInput = input("Description", reelEvidenceDraftDescription)
                    addView(descriptionInput)
                    val linkInput = input("Link optional", reelEvidenceDraftLink)
                    addView(linkInput)
                    addView(primaryButton("Save accomplishment") {
                        reelEvidenceDraftTitle = titleInput.text.toString().trim()
                        reelEvidenceDraftDescription = descriptionInput.text.toString().trim()
                        reelEvidenceDraftLink = linkInput.text.toString().trim()
                        if (reelEvidenceDraftTitle.isBlank() || reelEvidenceDraftDescription.isBlank()) {
                            lastApiStatus = "Add a title and description before saving an accomplishment."
                            setContentView(applicantShell())
                        } else {
                            executeApiOnSuccess(CatoApiContract.createApplicantAccomplishment(reelAccomplishmentCommand()), "create accomplishment") {
                                invalidateApplicantProofProfileState()
                                clearReelEvidenceDraftText()
                                setContentView(applicantShell())
                            }
                        }
                    })
                },
                matchWrapParams(),
            )
        }
    }

    private fun applicantEducationEditor(): View {
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    ApplicantEducationEditorScreen()
                }
            }
        }
    }

    @Composable
    private fun ApplicantEducationEditorScreen() {
        var name by remember(applicantName) { mutableStateOf(applicantName) }
        var university by remember(applicantUniversityName) { mutableStateOf(applicantUniversityName) }
        var semesterLabel by remember(applicantSemesterLabel) { mutableStateOf(applicantSemesterLabel) }
        var semesterNumber by remember(applicantSemesterNumber) { mutableStateOf(applicantSemesterNumber.toString()) }
        var gpa by remember(applicantGpa) { mutableStateOf(applicantGpa?.toString().orEmpty()) }
        var major by remember(applicantMajor) { mutableStateOf(applicantMajor) }
        var minor by remember(applicantMinor) { mutableStateOf(applicantMinor) }
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = ComposeColor(colors.background),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 22.dp, vertical = 28.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                OutlinedButton(
                    onClick = {
                        applicantDetail = null
                        selectedApplicantTab = ApplicantTab.SETTINGS
                        setContentView(applicantShell())
                    },
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Text("Back", fontWeight = FontWeight.Bold)
                }
                Text("Education", color = ComposeColor(colors.textPrimary), fontSize = 26.sp, fontWeight = FontWeight.Bold)
                Text("Name, university, and semester are required. GPA, major, and minor can be updated any time.", color = ComposeColor(colors.textSecondary), fontSize = 16.sp)
                lastApiStatus?.let { MaterialStatusCard(it) }
                OutlinedTextField(value = name, onValueChange = { name = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Name") }, singleLine = true)
                OutlinedTextField(value = university, onValueChange = { university = it }, modifier = Modifier.fillMaxWidth(), label = { Text("University") }, singleLine = true)
                OutlinedTextField(value = semesterLabel, onValueChange = { semesterLabel = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Semester label") }, singleLine = true)
                OutlinedTextField(
                    value = semesterNumber,
                    onValueChange = { semesterNumber = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Semester number") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                )
                Text("Semester shortcuts", color = ComposeColor(colors.textPrimary), fontWeight = FontWeight.Bold, fontSize = 18.sp)
                semesterChoiceRows().chunked(2).forEach { row ->
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        row.forEach { (number, label) ->
                            FilterChip(
                                selected = semesterNumber.toIntOrNull() == number,
                                onClick = {
                                    semesterLabel = label
                                    semesterNumber = number.toString()
                                    lastApiStatus = "Semester set to $label."
                                },
                                label = { Text(label) },
                                modifier = Modifier.weight(1f),
                            )
                        }
                        repeat(2 - row.size) { Spacer(modifier = Modifier.weight(1f)) }
                    }
                }
                OutlinedTextField(
                    value = gpa,
                    onValueChange = { gpa = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("GPA optional") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                )
                OutlinedTextField(value = major, onValueChange = { major = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Major") }, singleLine = true)
                OutlinedTextField(value = minor, onValueChange = { minor = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Minor optional") }, singleLine = true)
                PrimaryMaterialAction("Save name and education") {
                    saveApplicantEducationFromInput(
                        nextName = name,
                        nextUniversity = university,
                        nextSemesterLabel = semesterLabel,
                        nextSemesterNumberText = semesterNumber,
                        nextGpaText = gpa,
                        nextMajor = major,
                        nextMinor = minor,
                    )
                }
                Spacer(modifier = Modifier.height(92.dp))
            }
        }
    }

    private fun saveApplicantEducationFromInput(
        nextName: String,
        nextUniversity: String,
        nextSemesterLabel: String,
        nextSemesterNumberText: String,
        nextGpaText: String,
        nextMajor: String,
        nextMinor: String,
    ) {
        val trimmedName = nextName.trim()
        val trimmedUniversity = nextUniversity.trim()
        val trimmedSemesterLabel = nextSemesterLabel.trim()
        val nextSemesterNumber = nextSemesterNumberText.trim().toIntOrNull() ?: 0
        val trimmedGpa = nextGpaText.trim()
        val nextGpa = trimmedGpa.takeIf { it.isNotBlank() }?.toDoubleOrNull()
        if (trimmedName.isBlank()) {
            lastApiStatus = "Name is required."
            setContentView(applicantShell())
        } else if (trimmedUniversity.isBlank()) {
            lastApiStatus = "University is required."
            setContentView(applicantShell())
        } else if (trimmedSemesterLabel.isBlank() || nextSemesterNumber <= 0) {
            lastApiStatus = "Semester label and positive semester number are required."
            setContentView(applicantShell())
        } else if (trimmedGpa.isNotBlank() && nextGpa == null) {
            lastApiStatus = "GPA must be a number between 0 and 4."
            setContentView(applicantShell())
        } else if (nextGpa != null && (nextGpa < 0.0 || nextGpa > 4.0)) {
            lastApiStatus = "GPA must be between 0 and 4."
            setContentView(applicantShell())
        } else {
            applicantName = trimmedName
            applicantUniversityName = trimmedUniversity
            applicantSemesterLabel = trimmedSemesterLabel
            applicantSemesterNumber = nextSemesterNumber
            applicantGpa = nextGpa
            applicantMajor = nextMajor.trim()
            applicantMinor = nextMinor.trim()
            executeApiOnSuccess(CatoApiContract.updateApplicantAccount(applicantName), "save applicant name") {
                executeApiOnSuccess(CatoApiContract.updateApplicantEducation(currentApplicantEducationCommand()), "save applicant education") {
                    applicantDetail = null
                    selectedApplicantTab = ApplicantTab.SETTINGS
                    setContentView(applicantShell())
                }
            }
        }
    }

    private fun applicantReels(): View {
        requestOnce("applicant-profile", CatoApiContract.applicantProfile(), "applicant profile", redrawRecruiter = false)
        requestOnce("applicant-reels", CatoApiContract.applicantReels(), "applicant reels", redrawRecruiter = false)
        requestOnce("applicant-public-feed", CatoApiContract.videoFeed(recruiter = false, limit = 20), "applicant public video feed", redrawRecruiter = false)
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    ApplicantReelsScreen()
                }
            }
        }
    }

    @Composable
    private fun ApplicantReelsScreen() {
        val reelCount = applicantReelCountValue()
        val profileVideoRows = applicantOwnVideoProfileRows()
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = ComposeColor(colors.background),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 22.dp, vertical = 32.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                ApplicantReelsHeaderCard()
                ApplicantCreateReelCard()
                MaterialSectionHeader("Video profile", "${profileVideoRows.size} videos")
                if (profileVideoRows.isEmpty()) {
                    ApplicantEmptyReelsCard()
                } else {
                    ApplicantOwnedReelsGrid(profileVideoRows)
                }
                Text(
                    "${remainingApplicantReelSlots()} reel slot(s) remaining. Each reel must link to a project, internship, or accomplishment.",
                    color = ComposeColor(colors.textSecondary),
                    fontSize = 14.sp,
                )
                ApplicantPublicReelsSection()
                Spacer(modifier = Modifier.height(92.dp))
            }
        }
    }

    @Composable
    private fun ApplicantReelsHeaderCard() {
        val reelCount = applicantReelRows.size.takeIf { it > 0 } ?: applicantReelCount.toIntOrNull() ?: 0
        val profileVideoRows = applicantOwnVideoProfileRows()
        val totalViews = profileVideoRows.sumOf { countFromBadge(it.badge, "views") }
        val totalLikes = profileVideoRows.sumOf { countFromBadge(it.badge, "likes") }
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            ApplicantProfileAvatar(applicantName.ifBlank { applicantEmail.ifBlank { "A" } })
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(applicantName.ifBlank { "Applicant" }, color = ComposeColor(colors.textPrimary), fontSize = 26.sp, fontWeight = FontWeight.Bold)
                Text(
                    listOf(applicantMajor, applicantUniversityName).filter { it.isNotBlank() }.joinToString(" • ").ifBlank { applicantEmail },
                    color = ComposeColor(colors.textSecondary),
                    fontSize = 14.sp,
                )
            }
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                ApplicantStatCard(profileVideoRows.size.toString(), "Videos", Modifier.weight(1f))
                ApplicantStatCard(totalViews.toString(), "Views", Modifier.weight(1f))
                ApplicantStatCard(totalLikes.toString(), "Likes", Modifier.weight(1f))
            }
            Text(
                "Reels are proof videos linked to projects, internships, or accomplishments.",
                color = ComposeColor(colors.textSecondary),
                fontSize = 13.sp,
            )
        }
    }

    @Composable
    private fun ApplicantCreateReelCard() {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(18.dp),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("Create reel", color = ComposeColor(colors.textPrimary), fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        Text("Choose or record a video, add an optional caption, then link proof.", color = ComposeColor(colors.textSecondary), fontSize = 14.sp)
                    }
                    Text("${remainingApplicantReelSlots()} left", color = ComposeColor(colors.accent), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
                Button(
                    onClick = {
                        applicantDetail = "reel-upload"
                        setContentView(applicantShell())
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(54.dp),
                    enabled = !hasReachedApplicantReelLimit(),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ComposeColor(colors.accent)),
                ) {
                    Icon(Icons.Filled.Movie, contentDescription = "Create reel", tint = ComposeColor(Color.WHITE), modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (hasReachedApplicantReelLimit()) "Reel limit reached" else "Start reel post", fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    @Composable
    private fun ApplicantEmptyReelsCard() {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(18.dp),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(Icons.Filled.Movie, contentDescription = "No reels", tint = ComposeColor(colors.accent), modifier = Modifier.size(36.dp))
                Text("No reels yet", color = ComposeColor(colors.textPrimary), fontSize = 18.sp, fontWeight = FontWeight.Bold)
                Text(
                    "Post proof videos here. They will appear as thumbnails on your profile.",
                    color = ComposeColor(colors.textSecondary),
                    fontSize = 14.sp,
                )
            }
        }
    }

    @Composable
    private fun ApplicantOwnedReelsGrid(rows: List<AndroidListRow>) {
        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
            rows.chunked(3).forEachIndexed { rowIndex, rowItems ->
                Row(horizontalArrangement = Arrangement.spacedBy(3.dp), modifier = Modifier.fillMaxWidth()) {
                    rowItems.forEachIndexed { columnIndex, reel ->
                        val index = rowIndex * 3 + columnIndex
                        ApplicantOwnedReelTile(reel, index, Modifier.weight(1f))
                    }
                    repeat(3 - rowItems.size) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
            }
        }
    }

    @Composable
    private fun ApplicantOwnedReelTile(row: AndroidListRow, index: Int, modifier: Modifier = Modifier) {
        Surface(
            modifier = modifier.height(168.dp),
            color = ComposeColor(Color.BLACK),
            shape = RoundedCornerShape(8.dp),
            onClick = {
                selectedReelId = row.id.takeIf { it.isNotBlank() } ?: selectedReelId
                selectedReelTitle = row.title
                selectedReelSubtitle = row.subtitle.ifBlank { "Profile reel" }
                selectedReelApplicantId = row.applicantId.ifBlank { applicantId }
                selectedReelSourceType = row.sourceType
                selectedReelMediaUrl = row.mediaUrl
                selectedReelRaw = row.raw
                applySelectedReelBadge(row.badge)
                if (isIntroVideoSource(row.sourceType) || isDeeperVideoSource(row.sourceType)) {
                    publicApplicantVideoRows = applicantOwnVideoProfileRows()
                    applicantPublicReelIndex = publicApplicantVideoRows.indexOfFirst { it.id == row.id }.takeIf { it >= 0 } ?: index
                    publicReelsCaughtUp = false
                    publicReelSource = "profile"
                    applicantDetail = "public-reel-player"
                } else {
                    applicantReelIndex = applicantReelRows.indexOfFirst { it.id == row.id }.takeIf { it >= 0 } ?: index
                    applicantDetail = "reel-player"
                }
                setContentView(applicantShell())
            },
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                VideoThumbnailImage(row.thumbnailUrl, row.mediaUrl)
                Box(modifier = Modifier.fillMaxSize().background(ComposeColor.Black.copy(alpha = 0.32f)))
                Icon(Icons.Filled.PlayCircle, contentDescription = "Play reel", tint = ComposeColor(Color.WHITE), modifier = Modifier.align(Alignment.Center).size(32.dp))
                Column(modifier = Modifier.align(Alignment.BottomStart).padding(8.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        applicantOwnVideoProfileCardText(row),
                        color = ComposeColor(Color.WHITE),
                        fontSize = 10.sp,
                        lineHeight = 11.sp,
                        fontWeight = FontWeight.Bold,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
    }

    @Composable
    private fun ApplicantPublicReelsSection() {
        MaterialSectionHeader("Explore applicants", "public feed")
        if (applicantPublicFeedRows.isEmpty()) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
                shape = RoundedCornerShape(18.dp),
            ) {
                Text(
                    "Applicant videos will appear here when the feed has available clips.",
                    color = ComposeColor(colors.textSecondary),
                    fontSize = 14.sp,
                    modifier = Modifier.padding(18.dp),
                )
            }
        } else {
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                applicantPublicFeedRows.take(12).forEachIndexed { index, row ->
                    ApplicantPublicReelTile(row, index)
                }
            }
        }
    }

    @Composable
    private fun ApplicantPublicReelTile(row: AndroidListRow, index: Int) {
        Surface(
            modifier = Modifier
                .width(132.dp)
                .height(178.dp),
            color = ComposeColor(Color.BLACK),
            shape = RoundedCornerShape(14.dp),
            onClick = {
                applicantPublicReelIndex = index
                selectedReelId = row.id.ifBlank { selectedReelId }
                selectedReelTitle = row.title
                selectedReelSubtitle = row.subtitle
                selectedReelApplicantId = row.applicantId
                selectedReelMediaUrl = row.mediaUrl
                selectedReelRaw = row.raw
                applySelectedReelBadge(row.badge)
                lastApiStatus = null
                publicReelsCaughtUp = false
                publicReelSource = "feed"
                applicantDetail = "public-reel-player"
                setContentView(applicantShell())
            },
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                VideoThumbnailImage(row.thumbnailUrl, row.mediaUrl)
                Box(modifier = Modifier.fillMaxSize().background(ComposeColor.Black.copy(alpha = 0.34f)))
                Icon(Icons.Filled.PlayCircle, contentDescription = "Play", tint = ComposeColor(Color.WHITE), modifier = Modifier.align(Alignment.Center).size(32.dp))
                Column(modifier = Modifier.align(Alignment.BottomStart).padding(10.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text(publicVideoCardApplicantName(row), color = ComposeColor(Color.WHITE), fontSize = 12.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                }
            }
        }
    }

    @Composable
    private fun VideoThumbnailImage(thumbnailUrl: String, fallbackUrl: String = "") {
        val model = thumbnailUrl.ifBlank { fallbackUrl }
        if (model.isNotBlank()) {
            AsyncImage(
                model = model,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize(),
            )
        }
    }

    private fun publicVideoCardApplicantName(row: AndroidListRow): String {
        return row.applicantName
            .ifBlank { firstString(row.raw, "applicantName", "candidateName", "name", "displayName") }
            .ifBlank { row.subtitle.substringBefore(" - ").takeIf { it.isNotBlank() }.orEmpty() }
            .ifBlank { "Applicant" }
    }

    private fun applicantOwnVideoProfileCardText(row: AndroidListRow): String {
        return when {
            isIntroVideoSource(row.sourceType) -> "Intro video"
            isDeeperVideoSource(row.sourceType) -> "Deeper signal"
            else -> row.title.ifBlank { "Untitled reel" }
        }
    }

    @Composable
    private fun MaterialSectionHeader(title: String, trailing: String) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(title, color = ComposeColor(colors.textPrimary), fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Text(trailing, color = ComposeColor(colors.textSecondary), fontSize = 14.sp, fontWeight = FontWeight.Bold)
        }
    }

    private fun applicantReelsHeaderCard(): View {
        val reelCount = applicantReelRows.size.takeIf { it > 0 } ?: applicantReelCount.toIntOrNull() ?: 0
        val totalViews = applicantReelRows.sumOf { countFromBadge(it.badge, "views") }
        val totalLikes = applicantReelRows.sumOf { countFromBadge(it.badge, "likes") }
        return vertical(spacing = 14) {
            gravity = Gravity.CENTER_HORIZONTAL
            addView(label(applicantName.take(1).uppercase().ifBlank { "A" }, 42, colors.accent, bold = true).apply {
                gravity = Gravity.CENTER
                setPadding(dp(22), dp(18), dp(22), dp(18))
                background = CatoAndroidDrawable.rounded(Color.rgb(249, 245, 255), dp(34), Color.TRANSPARENT)
            })
            addView(label(applicantName.ifBlank { "Applicant" }, 28, colors.textPrimary, bold = true).apply { gravity = Gravity.CENTER })
            addView(label(listOf(applicantMajor, applicantUniversityName).filter { it.isNotBlank() }.joinToString(" • ").ifBlank { applicantEmail }, 15, colors.textSecondary).apply { gravity = Gravity.CENTER })
            addView(horizontal(spacing = 8) {
                addView(statPill(reelCount.toString(), "Reels"), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(statPill(totalViews.toString(), "Views"), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(statPill(totalLikes.toString(), "Likes"), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            })
            addView(label("Proof videos linked to projects, internships, or accomplishments.", 14, colors.textSecondary).apply { gravity = Gravity.CENTER })
        }
    }

    private fun applicantReelCountValue(): Int {
        return applicantReelRows.size.takeIf { it > 0 } ?: applicantReelCount.toIntOrNull() ?: 0
    }

    private fun hasReachedApplicantReelLimit(): Boolean = applicantReelCountValue() >= 9

    private fun remainingApplicantReelSlots(): Int = (9 - applicantReelCountValue()).coerceAtLeast(0)

    private fun statPill(value: String, labelText: String): View {
        return vertical(spacing = 2) {
            setPadding(dp(10), dp(10), dp(10), dp(10))
            gravity = Gravity.CENTER
            background = CatoAndroidDrawable.rounded(Color.rgb(249, 245, 255), dp(14), colors.border)
            addView(label(value, 20, colors.accent, bold = true).apply { gravity = Gravity.CENTER })
            addView(label(labelText, 12, colors.textSecondary, bold = true).apply { gravity = Gravity.CENTER })
        }
    }

    private fun statusPill(title: String): View {
        return vertical(spacing = 2) {
            setPadding(dp(10), dp(12), dp(10), dp(12))
            gravity = Gravity.CENTER
            background = CatoAndroidDrawable.rounded(colors.surface, dp(14), colors.border)
            addView(label(title, 13, colors.textPrimary, bold = true).apply {
                gravity = Gravity.CENTER
            })
        }
    }

    private fun applicantReelPlayer(): View {
        val current = applicantReelRows.getOrNull(applicantReelIndex.coerceIn(0, (applicantReelRows.size - 1).coerceAtLeast(0)))
        if (current != null) {
            selectedReelId = current.id.ifBlank { selectedReelId }
            selectedReelTitle = current.title
            selectedReelSubtitle = current.subtitle
            selectedReelMediaUrl = current.mediaUrl
            selectedReelRaw = current.raw
            applySelectedReelBadge(current.badge)
        }
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    ApplicantReelPlayerScreen()
                }
            }
        }
    }

    private fun applicantReelUploadWizard(): View {
        requestOnce("applicant-profile", CatoApiContract.applicantProfile(), "applicant profile", redrawRecruiter = false)
        requestOnce("applicant-reels", CatoApiContract.applicantReels(), "applicant reels", redrawRecruiter = false)
        requestOnce("applicant-accomplishments", CatoApiContract.applicantAccomplishments(), "applicant accomplishments", redrawRecruiter = false)
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    ApplicantReelUploadWizardScreen()
                }
            }
        }
    }

    @Composable
    private fun ApplicantReelPlayerScreen() {
        var caption by remember(selectedReelId) { mutableStateOf(selectedReelTitle.takeUnless { it == "Untitled reel" }.orEmpty()) }
        val canGoPrevious = applicantReelIndex > 0
        val canGoNext = applicantReelIndex < applicantReelRows.lastIndex
        Surface(modifier = Modifier.fillMaxSize(), color = ComposeColor(colors.background)) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 22.dp, vertical = 28.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                ReelTopBar("Profile reel") {
                    applicantDetail = null
                    selectedApplicantTab = ApplicantTab.REELS
                    setContentView(applicantShell())
                }
                ComposeVideoSurface(
                    title = selectedReelTitle.ifBlank { "Untitled reel" },
                    subtitle = selectedReelSubtitle.ifBlank { "Profile reel" },
                    mediaUrl = selectedReelMediaUrl,
                    videoKey = selectedVideoKey(),
                    metaText = selectedReelStatsAndDate(),
                    onSwipeUp = { moveApplicantOwnedReel(1) },
                    onSwipeDown = { moveApplicantOwnedReel(-1) },
                )
                if (canGoPrevious || canGoNext) {
                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        if (canGoPrevious) {
                            ReelChevronButton("Previous reel") {
                                moveApplicantOwnedReel(-1)
                                setContentView(applicantShell())
                            }
                        }
                        Spacer(modifier = Modifier.weight(1f))
                        if (canGoNext) {
                            ReelChevronButton("Next reel") {
                                moveApplicantOwnedReel(1)
                                setContentView(applicantShell())
                            }
                        }
                    }
                }
                MaterialInfoCard("Linked evidence", selectedPublishedReelEvidenceSummary())
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
                    shape = RoundedCornerShape(18.dp),
                ) {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Caption", color = ComposeColor(colors.textPrimary), fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        OutlinedTextField(
                            value = caption,
                            onValueChange = { caption = it.take(250) },
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Caption optional") },
                            minLines = 2,
                            maxLines = 4,
                        )
                        Text("${caption.length}/250", color = ComposeColor(colors.textSecondary), fontSize = 12.sp)
                        Button(
                            onClick = {
                                val newCaption = caption.take(250).trim()
                                if (requireReelId("saving caption")) {
                                    executeApiOnSuccess(CatoApiContract.updateApplicantReelCaption(selectedReelId, newCaption.takeIf { it.isNotBlank() }), "update reel caption") {
                                        applicantReelRows = applicantReelRows.map {
                                            if (it.id == selectedReelId) it.copy(title = newCaption.ifBlank { "Untitled reel" }) else it
                                        }
                                        selectedReelTitle = newCaption.ifBlank { "Untitled reel" }
                                        invalidateApplicantReelProfileState()
                                        setContentView(applicantShell())
                                    }
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = ComposeColor(colors.accent)),
                        ) { Text("Save caption", fontWeight = FontWeight.Bold) }
                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            OutlinedButton(
                                onClick = {
                                    if (requireReelId("clearing caption")) {
                                        executeApiOnSuccess(CatoApiContract.updateApplicantReelCaption(selectedReelId, null), "clear reel caption") {
                                            applicantReelRows = applicantReelRows.map {
                                                if (it.id == selectedReelId) it.copy(title = "Untitled reel") else it
                                            }
                                            selectedReelTitle = "Untitled reel"
                                            invalidateApplicantReelProfileState()
                                            setContentView(applicantShell())
                                        }
                                    }
                                },
                                modifier = Modifier.weight(1f).height(50.dp),
                                shape = RoundedCornerShape(16.dp),
                            ) { Text("Clear", fontWeight = FontWeight.Bold) }
                            OutlinedButton(
                                onClick = {
                                    if (requireReelId("deleting reel")) {
                                        executeApiOnSuccess(CatoApiContract.deleteApplicantReel(selectedReelId), "delete reel") {
                                            applicantReelRows = applicantReelRows.filterNot { it.id == selectedReelId }
                                            applicantReelCount = applicantReelRows.size.toString()
                                            invalidateApplicantReelProfileState()
                                            applicantDetail = null
                                            selectedApplicantTab = ApplicantTab.REELS
                                            setContentView(applicantShell())
                                        }
                                    }
                                },
                                modifier = Modifier.weight(1f).height(50.dp),
                                shape = RoundedCornerShape(16.dp),
                            ) { Text("Delete", color = ComposeColor(colors.error), fontWeight = FontWeight.Bold) }
                        }
                    }
                }
                Spacer(modifier = Modifier.height(92.dp))
            }
        }
    }

    @Composable
    private fun ApplicantReelUploadWizardScreen() {
        val canPublish = pendingReelVideoSelection != null && pendingReelEvidenceLinks.isNotEmpty() && !hasReachedApplicantReelLimit()
        var caption by remember(pendingReelVideoSelection?.fileName) { mutableStateOf(pendingReelCaption) }
        Surface(modifier = Modifier.fillMaxSize(), color = ComposeColor(colors.background)) {
            Box(modifier = Modifier.fillMaxSize()) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 22.dp, vertical = 28.dp)
                        .padding(bottom = if (canPublish) 150.dp else 92.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    ReelTopBar("Publish reel") {
                        applicantDetail = null
                        selectedApplicantTab = ApplicantTab.REELS
                        setContentView(applicantShell())
                    }
                    Text(
                        "Choose a video, add an optional caption, and link the evidence it proves.",
                        color = ComposeColor(colors.textSecondary),
                        fontSize = 15.sp,
                    )
                    lastApiStatus?.let { MaterialInfoCard("Reel status", it) }
                    if (hasReachedApplicantReelLimit()) {
                        MaterialInfoCard("Reel limit reached", "You have reached the 9 profile reel limit. Delete a reel before publishing another.")
                    } else {
                        ReelVideoAndCaptionCard(caption) { next ->
                            caption = next.take(250)
                            pendingReelCaption = caption
                        }
                        ReelEvidenceCard()
                        if (!canPublish) {
                            MaterialInfoCard("Publish locked", "Choose a video and link at least one project, internship, or accomplishment before publishing.")
                        }
                        OutlinedButton(
                            onClick = {
                                clearPendingReel()
                                lastApiStatus = "Reel draft cleared."
                                setContentView(applicantShell())
                            },
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                            shape = RoundedCornerShape(16.dp),
                        ) {
                            Text("Clear draft", fontWeight = FontWeight.Bold)
                        }
                    }
                }
                if (canPublish) {
                    Button(
                        onClick = { uploadPendingReel() },
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .fillMaxWidth()
                            .padding(horizontal = 22.dp, vertical = 104.dp)
                            .height(56.dp),
                        shape = RoundedCornerShape(18.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = ComposeColor(colors.accent)),
                    ) {
                        Icon(Icons.Filled.Send, contentDescription = "Publish", tint = ComposeColor(Color.WHITE), modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Publish reel", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    @Composable
    private fun ReelTopBar(title: String, onBack: () -> Unit) {
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            CompactBackButton(onBack)
            Text(title, color = ComposeColor(colors.textPrimary), fontSize = 26.sp, fontWeight = FontWeight.Bold)
        }
    }

    @Composable
    private fun ComposeVideoSurface(
        title: String,
        subtitle: String,
        mediaUrl: String,
        videoKey: String,
        metaText: String = "",
        onSwipeUp: (() -> Unit)? = null,
        onSwipeDown: (() -> Unit)? = null,
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(Color.BLACK)),
            shape = RoundedCornerShape(24.dp),
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(360.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    if (mediaUrl.isNotBlank()) {
                        key(mediaUrl, videoKey) {
                            AndroidView(
                                modifier = Modifier.fillMaxSize(),
                                factory = {
                                    controlledVideoView(mediaUrl = mediaUrl, videoKey = videoKey)
                                },
                            )
                        }
                    }
                }
                Text(title, color = ComposeColor(Color.WHITE), fontSize = 16.sp, fontWeight = FontWeight.Bold, maxLines = 2)
                if (subtitle.isNotBlank()) {
                    Text(subtitle, color = ComposeColor(colors.background), fontSize = 12.sp, maxLines = 2)
                }
                if (metaText.isNotBlank()) {
                    Text(metaText, color = ComposeColor(colors.background), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    @Composable
    private fun ReelChevronButton(contentDescription: String, onClick: () -> Unit) {
        Surface(
            modifier = Modifier.size(42.dp),
            color = ComposeColor(colors.surface),
            shape = CircleShape,
            border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
        ) {
            IconButton(onClick = onClick) {
                Icon(
                    imageVector = if (contentDescription.startsWith("Previous")) Icons.Filled.ChevronLeft else Icons.Filled.ChevronRight,
                    contentDescription = contentDescription,
                    tint = ComposeColor(colors.accent),
                    modifier = Modifier.size(22.dp),
                )
            }
        }
    }

    @Composable
    private fun ReelVideoAndCaptionCard(caption: String, onCaptionChange: (String) -> Unit) {
        val selection = pendingReelVideoSelection
        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)), shape = RoundedCornerShape(18.dp)) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                MaterialSectionHeader("Video and caption", "Max 60s")
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    color = ComposeColor(colors.background),
                    shape = RoundedCornerShape(16.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
                ) {
                    Row(modifier = Modifier.padding(14.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Movie, contentDescription = "Video", tint = ComposeColor(colors.accent), modifier = Modifier.size(28.dp))
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(selection?.fileName ?: "No video selected", color = ComposeColor(colors.textPrimary), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            Text(
                                selection?.let { "${"%.1f".format(it.durationSeconds)}s • ${it.bytes.size / (1024 * 1024)} MB" } ?: "Choose or record a video before publishing.",
                                color = ComposeColor(colors.textSecondary),
                                fontSize = 12.sp,
                            )
                        }
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Button(
                        onClick = { chooseReelVideo() },
                        modifier = Modifier.weight(1f).height(50.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = ComposeColor(colors.accent)),
                    ) { Text(if (selection == null) "Choose" else "Replace", fontWeight = FontWeight.Bold) }
                    OutlinedButton(
                        onClick = { recordReelVideo() },
                        modifier = Modifier.weight(1f).height(50.dp),
                        shape = RoundedCornerShape(16.dp),
                    ) { Text("Record", fontWeight = FontWeight.Bold) }
                }
                OutlinedTextField(
                    value = caption,
                    onValueChange = onCaptionChange,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Caption optional") },
                    minLines = 2,
                    maxLines = 4,
                )
                Text("${caption.length}/250", color = ComposeColor(colors.textSecondary), fontSize = 12.sp)
            }
        }
    }

    @Composable
    private fun ReelEvidenceCard() {
        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)), shape = RoundedCornerShape(18.dp)) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                MaterialSectionHeader("Linked evidence", "${pendingReelEvidenceLinks.size} selected")
                Text("Choose every context this reel supports.", color = ComposeColor(colors.textSecondary), fontSize = 13.sp)
                Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("project" to "Projects", "internship" to "Internships", "accomplishment" to "Accomplishments").forEach { (key, label) ->
                        FilterChip(
                            selected = pendingReelEvidenceSection == key,
                            onClick = {
                                pendingReelEvidenceSection = key
                                setContentView(applicantShell())
                            },
                            label = { Text(label) },
                        )
                    }
                }
                ReelEvidenceSelectionSection()
                ReelCreateEvidenceSection()
            }
        }
    }

    @Composable
    private fun ReelEvidenceSelectionSection() {
        val rows = when (pendingReelEvidenceSection) {
            "internship" -> applicantInternshipRows
            "accomplishment" -> applicantAccomplishmentRows
            else -> applicantProjectRows
        }.filter { it.id.isNotBlank() }
        val type = pendingReelEvidenceSection
        if (rows.isEmpty()) {
            Text("No ${type}s yet. Create one below, then link it.", color = ComposeColor(colors.textSecondary), fontSize = 13.sp)
        } else {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                rows.forEach { row ->
                    val link = ApplicantVideoEvidenceLink(type, row.id)
                    val selected = pendingReelEvidenceLinks.contains(link)
                    FilterChip(
                        selected = selected,
                        onClick = {
                            togglePendingReelEvidence(link)
                            setContentView(applicantShell())
                        },
                        label = { Text(row.title.ifBlank { "Untitled" }) },
                    )
                }
            }
        }
        Text(selectedReelEvidenceSummary(), color = ComposeColor(colors.textSecondary), fontSize = 12.sp)
    }

    @Composable
    private fun ReelCreateEvidenceSection() {
        var title by remember(pendingReelEvidenceSection) { mutableStateOf(reelEvidenceDraftTitle) }
        var description by remember(pendingReelEvidenceSection) { mutableStateOf(reelEvidenceDraftDescription) }
        var link by remember(pendingReelEvidenceSection) { mutableStateOf(reelEvidenceDraftLink.ifBlank { projectDraftLink }) }
        var projectType by remember(pendingReelEvidenceSection) { mutableStateOf(projectDraftType.ifBlank { "built_project" }) }
        var internshipRole by remember(pendingReelEvidenceSection) { mutableStateOf(internshipDraftRoleDepartment.ifBlank { "Engineering" }) }
        var internshipDuration by remember(pendingReelEvidenceSection) { mutableStateOf(internshipDraftDurationMonths) }
        val sectionTitle = when (pendingReelEvidenceSection) {
            "internship" -> "Create internship"
            "accomplishment" -> "Create accomplishment"
            else -> "Create project"
        }
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(sectionTitle, color = ComposeColor(colors.textPrimary), fontSize = 17.sp, fontWeight = FontWeight.Bold)
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text(if (pendingReelEvidenceSection == "internship") "Company" else "Title") },
            )
            when (pendingReelEvidenceSection) {
                "internship" -> {
                    OutlinedTextField(value = internshipRole, onValueChange = { internshipRole = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Role area") })
                    OutlinedTextField(
                        value = internshipDuration,
                        onValueChange = { internshipDuration = it.filter { char -> char.isDigit() } },
                        modifier = Modifier.fillMaxWidth(),
                        label = { Text("Duration in months") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    )
                }
                "accomplishment" -> {
                    OutlinedTextField(value = description, onValueChange = { description = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Description") }, minLines = 2)
                    OutlinedTextField(value = link, onValueChange = { link = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Link optional") })
                }
                else -> {
                    OutlinedTextField(value = projectType, onValueChange = { projectType = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Project type") })
                    OutlinedTextField(value = description, onValueChange = { description = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Description") }, minLines = 2)
                    OutlinedTextField(value = link, onValueChange = { link = it }, modifier = Modifier.fillMaxWidth(), label = { Text("Link optional") })
                }
            }
            OutlinedButton(
                onClick = {
                    when (pendingReelEvidenceSection) {
                        "internship" -> {
                            internshipDraftCompany = title.trim()
                            internshipDraftRoleDepartment = internshipRole.trim().ifBlank { "Engineering" }
                            internshipDraftDurationMonths = internshipDuration.trim()
                            if (internshipDraftCompany.isBlank()) {
                                lastApiStatus = "Add a company before creating internship evidence."
                                setContentView(applicantShell())
                            } else if ((internshipDraftDurationMonths.toIntOrNull() ?: 0) <= 0) {
                                lastApiStatus = "Duration must be a positive number of months."
                                setContentView(applicantShell())
                            } else {
                                executeApiOnSuccess(CatoApiContract.createApplicantInternship(reelInternshipCommand()), "create internship") {
                                    invalidateApplicantProofProfileState()
                                    clearReelEvidenceDraftText()
                                    resetInternshipDraft()
                                    setContentView(applicantShell())
                                }
                            }
                        }
                        "accomplishment" -> {
                            reelEvidenceDraftTitle = title.trim()
                            reelEvidenceDraftDescription = description.trim()
                            reelEvidenceDraftLink = link.trim()
                            if (reelEvidenceDraftTitle.isBlank() || reelEvidenceDraftDescription.isBlank()) {
                                lastApiStatus = "Add a title and description before creating accomplishment evidence."
                                setContentView(applicantShell())
                            } else {
                                executeApiOnSuccess(CatoApiContract.createApplicantAccomplishment(reelAccomplishmentCommand()), "create accomplishment") {
                                    invalidateApplicantProofProfileState()
                                    clearReelEvidenceDraftText()
                                    setContentView(applicantShell())
                                }
                            }
                        }
                        else -> {
                            reelEvidenceDraftTitle = title.trim()
                            projectDraftType = projectType.trim().ifBlank { "built_project" }
                            reelEvidenceDraftDescription = description.trim()
                            projectDraftLink = link.trim()
                            if (reelEvidenceDraftTitle.isBlank() || reelEvidenceDraftDescription.isBlank()) {
                                lastApiStatus = "Add a title and description before creating project evidence."
                                setContentView(applicantShell())
                            } else {
                                executeApiOnSuccess(CatoApiContract.createApplicantProject(reelProjectCommand()), "create project") {
                                    invalidateApplicantProofProfileState()
                                    clearReelEvidenceDraftText()
                                    resetProjectDraft()
                                    setContentView(applicantShell())
                                }
                            }
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(16.dp),
            ) {
                Text("Save and link", fontWeight = FontWeight.Bold)
            }
        }
    }

    private fun evidenceSectionPicker(): View {
        return horizontal(spacing = 8) {
            val sections = listOf(
                "project" to "Projects",
                "internship" to "Internships",
                "accomplishment" to "Accomplishments",
            )
            sections.forEach { (key, title) ->
                val count = pendingReelEvidenceLinks.count { it.targetType == key }
                val suffix = when {
                    pendingReelEvidenceSection == key && count > 0 -> " ✓$count"
                    pendingReelEvidenceSection == key -> " ✓"
                    count > 0 -> " $count"
                    else -> ""
                }
                addView(secondaryButton("$title$suffix") {
                    pendingReelEvidenceSection = key
                    setContentView(applicantShell())
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            }
        }
    }

    private fun evidenceSelectionBlock(sectionLabel: String, type: String, rows: List<AndroidListRow>): View {
        val candidates = rows.filter { it.id.isNotBlank() }
        return vertical(spacing = 8) {
            addView(label(sectionLabel, 18, colors.textPrimary, bold = true))
            if (candidates.isEmpty()) {
                addView(featureCard("No $sectionLabel yet", "Create one from this wizard, then select it after it appears."))
            } else {
                candidates.forEach { row ->
                    val link = ApplicantVideoEvidenceLink(type, row.id)
                    val selected = pendingReelEvidenceLinks.contains(link)
                    addView(secondaryButton(if (selected) "${row.title} ✓" else row.title) {
                        togglePendingReelEvidence(link)
                        setContentView(applicantShell())
                    })
                }
            }
        }
    }

    private fun selectedReelEvidenceSummary(): String {
        if (pendingReelEvidenceLinks.isEmpty()) {
            return "No evidence linked yet."
        }
        return pendingReelEvidenceLinks.joinToString("\n") { link ->
            val row = when (link.targetType) {
                "project" -> applicantProjectRows.firstOrNull { it.id == link.targetId }
                "internship" -> applicantInternshipRows.firstOrNull { it.id == link.targetId }
                "accomplishment" -> applicantAccomplishmentRows.firstOrNull { it.id == link.targetId }
                else -> null
            }
            "${link.targetType.replaceFirstChar { it.uppercase() }}: ${row?.title ?: link.targetId}"
        }
    }

    private fun selectedPublishedReelEvidenceSummary(): String {
        val raw = selectedReelRaw
        if (raw.isBlank()) {
            return "Linked project, internship, or accomplishment metadata was not included in this reel response."
        }
        val links = CatoAndroidJson.objectArray(raw, "evidenceLinks")
            .ifEmpty { CatoAndroidJson.objectArray(raw, "links") }
            .ifEmpty { CatoAndroidJson.objectArray(raw, "linkedEvidence") }
        if (links.isEmpty()) {
            val type = firstString(raw, "evidenceType", "sourceType", "visibility")
            return type.takeIf { it.isNotBlank() }?.let { "Linked as: $it" }
                ?: "Linked project, internship, or accomplishment metadata is not available."
        }
        return links.joinToString("\n") { link ->
            val type = firstString(link, "targetType", "evidenceType", "type").ifBlank { "Evidence" }
            val targetId = firstString(link, "targetId", "id", "_id")
            val target = CatoAndroidJson.objectValue(link, "target")
                ?: CatoAndroidJson.objectValue(link, type.lowercase())
            val title = firstString(link, "title", "name", "label")
                .ifBlank { target?.let { firstString(it, "title", "name", "label", "companyName", "roleDepartment") }.orEmpty() }
                .ifBlank { reelEvidenceTitleFor(type, targetId) }
                .ifBlank { targetId }
            listOf(evidenceTypeLabel(type), title).filter { it.isNotBlank() }.joinToString(": ")
        }
    }

    private fun reelEvidenceTitleFor(type: String, targetId: String): String {
        if (targetId.isBlank()) return ""
        val rows = when (type.lowercase()) {
            "project", "projects" -> applicantProjectRows
            "internship", "internships" -> applicantInternshipRows
            "accomplishment", "accomplishments" -> applicantAccomplishmentRows
            else -> emptyList()
        }
        val row = rows.firstOrNull { it.id == targetId } ?: return ""
        return row.title.ifBlank { row.subtitle }
    }

    private fun evidenceTypeLabel(type: String): String {
        return when (type.lowercase()) {
            "project", "projects" -> "Project"
            "internship", "internships" -> "Internship"
            "accomplishment", "accomplishments" -> "Accomplishment"
            else -> type.replace("_", " ").replaceFirstChar { it.uppercase() }
        }
    }

    private fun selectedReelStatsAndDate(): String {
        val date = firstString(selectedReelRaw, "createdAt", "updatedAt", "uploadedAt", "publishedAt").toDisplayDate()
        return listOf(selectedReelLikeCount, selectedReelViewCount, date)
            .filter { it.isNotBlank() }
            .joinToString("  •  ")
    }

    private fun String.toDisplayDate(): String {
        return Regex("""\d{4}-\d{1,2}-\d{1,2}""").find(this)?.value
            ?: take(10).takeIf { Regex("""\d{4}-\d{2}-\d{2}""").matches(it) }.orEmpty()
    }

    private fun togglePendingReelEvidence(link: ApplicantVideoEvidenceLink) {
        pendingReelEvidenceLinks = if (pendingReelEvidenceLinks.contains(link)) {
            pendingReelEvidenceLinks.filterNot { it == link }
        } else {
            pendingReelEvidenceLinks + link
        }
    }

    private fun addPendingReelEvidence(link: ApplicantVideoEvidenceLink) {
        if (link.targetType.isBlank() || link.targetId.isBlank()) return
        if (!pendingReelEvidenceLinks.contains(link)) {
            pendingReelEvidenceLinks = pendingReelEvidenceLinks + link
        }
    }

    private fun applicantPublicReelPlayer(): View {
        val publicRows = activeApplicantPublicReelRows()
        val current = publicRows.getOrNull(applicantPublicReelIndex.coerceIn(0, (publicRows.size - 1).coerceAtLeast(0)))
        if (current != null) {
            selectedReelId = current.id.ifBlank { selectedReelId }
            selectedReelTitle = current.title
            selectedReelSubtitle = current.subtitle
            selectedReelApplicantId = current.applicantId
            selectedReelMediaUrl = current.mediaUrl
            selectedReelRaw = current.raw
            applySelectedReelBadge(current.badge)
        }
        val caption = selectedReelTitle.takeIf { it.isNotBlank() && it != "Untitled reel" } ?: selectedReelSubtitle
        val applicantName = firstString(selectedReelRaw, "applicantName", "candidateName", "name")
            .ifBlank { publicApplicantProfileName.takeIf { it != "Applicant" }.orEmpty() }
            .ifBlank { "Applicant" }
        return FrameLayout(this).apply {
            setBackgroundColor(Color.BLACK)
            installSwipeHandler(
                onSwipeUp = { moveApplicantPublicReel(1) },
                onSwipeDown = { moveApplicantPublicReel(-1) },
                onSwipeRight = null,
            )
            if (selectedReelMediaUrl.isNotBlank()) {
                val playbackOverlay = label("", 52, Color.WHITE, bold = true).apply {
                    gravity = Gravity.CENTER
                    alpha = 0f
                    isClickable = false
                    background = CatoAndroidDrawable.rounded(Color.argb(112, 0, 0, 0), dp(42), Color.TRANSPARENT)
                }
                val videoView = controlledVideoView(
                    mediaUrl = selectedReelMediaUrl,
                    videoKey = selectedVideoKey(),
                    autoPlay = true,
                        tapToToggle = true,
                        showNativeControls = false,
                        fillBounds = false,
                        aspectFitCenter = true,
                        onPlaybackToggle = { isPlaying ->
                            showPublicReelPlaybackOverlay(playbackOverlay, isPlaying)
                        },
                    onStarted = {
                        if (canPersistSelectedReelInteraction()) {
                            executeApiOnSuccess(CatoApiContract.markVideoViewed(selectedReelId), "mark public video viewed") {
                                selectedReelViewCount = incrementCountLabel(selectedReelViewCount, "views")
                                updateCurrentReelBadge()
                            }
                        }
                    },
                )
                playbackOverlay.setOnClickListener { videoView.performClick() }
                addView(
                    videoView,
                    centerMatchFrameParams(),
                )
                addView(
                    View(this@MainActivity).apply {
                        installSwipeHandler(
                            onSwipeUp = { moveApplicantPublicReel(1) },
                            onSwipeDown = { moveApplicantPublicReel(-1) },
                            onSwipeRight = null,
                            onTap = { videoView.performClick() },
                        )
                    },
                    matchFrameParams(),
                )
                addView(playbackOverlay, FrameLayout.LayoutParams(dp(84), dp(84), Gravity.CENTER))
            }
            addView(compactBackButton {
                applicantDetail = null
                selectedApplicantTab = ApplicantTab.REELS
                setContentView(applicantShell())
            }, FrameLayout.LayoutParams(dp(40), dp(40), Gravity.TOP or Gravity.START).apply {
                leftMargin = dp(16)
                topMargin = dp(28)
            })
            addView(publicReelBottomCaption(caption), FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.BOTTOM or Gravity.START).apply {
                leftMargin = dp(18)
                rightMargin = dp(92)
                bottomMargin = dp(34)
            })
            addView(publicReelRightRail(applicantName), FrameLayout.LayoutParams(dp(74), ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.END or Gravity.BOTTOM).apply {
                rightMargin = dp(14)
                bottomMargin = dp(34)
            })
            if (publicReelsCaughtUp) {
                val overlay = vertical(spacing = 10) {
                        setPadding(dp(18), dp(16), dp(18), dp(16))
                        background = CatoAndroidDrawable.rounded(Color.argb(238, 255, 255, 255), dp(22), Color.TRANSPARENT)
                        addView(horizontal(spacing = 10) {
                            addView(label("You're all caught up", 19, colors.textPrimary, bold = true), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                            addView(secondaryButton("X") {
                                dismissCaughtUpOverlay()
                            }, LinearLayout.LayoutParams(dp(46), dp(42)))
                        })
                        addView(label(publicReelsCaughtUpMessage(), 14, colors.textSecondary).apply { gravity = Gravity.CENTER })
                    }
                addView(
                    overlay,
                    FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER).apply {
                        leftMargin = dp(24)
                        rightMargin = dp(24)
                    },
                )
                overlay.postDelayed({
                    if (applicantDetail == "public-reel-player" && publicReelsCaughtUp) {
                        dismissCaughtUpOverlay()
                    }
                }, 5000)
            }
        }
    }

    private fun dismissCaughtUpOverlay() {
        publicReelsCaughtUp = false
        if (applicantDetail == "public-reel-player") {
            setContentView(applicantShell())
        }
    }

    private fun publicReelsCaughtUpMessage(): String {
        return "You have explored all introductory reels and deeper signals on Cato. Stay tuned for more."
    }

    private fun showPublicReelPlaybackOverlay(overlay: TextView, isPlaying: Boolean) {
        overlay.animate().cancel()
        overlay.text = if (isPlaying) "||" else "▶"
        overlay.alpha = 1f
        overlay.isClickable = !isPlaying
        if (isPlaying) {
            overlay.animate()
                .alpha(0f)
                .setStartDelay(1500)
                .setDuration(220)
                .start()
        }
    }

    private fun publicReelBottomCaption(caption: String): View {
        return vertical(spacing = 6) {
            addView(label(selectedReelViewCount, 12, Color.WHITE, bold = true))
            if (caption.isNotBlank()) {
                addView(label(caption, 15, Color.WHITE, bold = true).apply {
                    maxLines = 2
                    ellipsize = TextUtils.TruncateAt.END
                    setOnClickListener { openProfileFromSelectedPublicReel() }
                })
            }
        }
    }

    private fun publicReelRightRail(applicantName: String): View {
        val liked = selectedPublicReelLiked()
        val likeCount = countFromBadge("$selectedReelViewCount - $selectedReelLikeCount", "likes")
        return vertical(spacing = 16) {
            gravity = Gravity.CENTER
            addView(label(applicantName.take(1).uppercase().ifBlank { "A" }, 24, colors.accent, bold = true).apply {
                gravity = Gravity.CENTER
                setPadding(dp(14), dp(10), dp(14), dp(10))
                background = CatoAndroidDrawable.rounded(Color.WHITE, dp(28), Color.TRANSPARENT)
                setOnClickListener { openProfileFromSelectedPublicReel() }
            }, LinearLayout.LayoutParams(dp(58), dp(58)))
            addView(vertical(spacing = 3) {
                gravity = Gravity.CENTER
                addView(label(if (liked) "♥" else "♡", 34, if (liked) colors.error else Color.WHITE, bold = true).apply {
                    gravity = Gravity.CENTER
                    setOnClickListener { likeSelectedPublicReel() }
                })
                addView(label(likeCount.toString(), 12, Color.WHITE, bold = true).apply { gravity = Gravity.CENTER })
            })
        }
    }

    private fun selectedPublicReelLiked(): Boolean {
        return selectedReelId.isNotBlank() && (
            selectedReelId in locallyLikedReelIds ||
                CatoAndroidJson.booleanValue(selectedReelRaw, "liked") == true ||
                CatoAndroidJson.booleanValue(selectedReelRaw, "isLiked") == true ||
                CatoAndroidJson.booleanValue(selectedReelRaw, "viewerLiked") == true
            )
    }

    private fun likeSelectedPublicReel() {
        if (!canPersistSelectedReelInteraction()) {
            lastApiStatus = "Likes are available on uploaded reels."
        } else if (requireReelId("liking video")) {
            executeApiOnSuccess(CatoApiContract.setVideoLike(selectedReelId, liked = true), "like public video") {
                locallyLikedReelIds = locallyLikedReelIds + selectedReelId
                selectedReelLikeCount = incrementCountLabel(selectedReelLikeCount, "likes")
                updateCurrentReelBadge()
            }
        }
    }

    private fun canPersistSelectedReelInteraction(): Boolean {
        return selectedReelId.isNotBlank() &&
            !selectedReelId.startsWith("intro-") &&
            !selectedReelId.startsWith("deeper-")
    }

    private fun openProfileFromSelectedPublicReel() {
        val applicantId = selectedReelApplicantId.ifBlank { selectedCandidateId }
        if (applicantId.isBlank()) {
            lastApiStatus = "Select an applicant video before opening the public profile."
            setContentView(applicantShell())
        } else if (selectedRole == CatoRole.APPLICANT && this.applicantId.isNotBlank() && applicantId == this.applicantId) {
            applicantDetail = null
            selectedApplicantTab = ApplicantTab.PROFILE
            setContentView(applicantShell())
        } else {
            executeApiOnSuccess(CatoApiContract.publicApplicantProfile(applicantId), "public applicant profile") {
                applicantDetail = "public-applicant-profile"
                setContentView(applicantShell())
            }
        }
    }

    private fun oldApplicantPublicReelPlayer(): View {
        return scroll {
            addView(
                vertical(spacing = 16) {
                    setPadding(dp(22), dp(28), dp(22), dp(120))
                    addView(horizontal(spacing = 10) {
                        addView(compactBackButton {
                            applicantDetail = null
                            selectedApplicantTab = ApplicantTab.REELS
                            setContentView(applicantShell())
                        })
                        addView(label(selectedReelTitle, 26, colors.textPrimary, bold = true))
                    })
                    addView(videoSurface(
                        title = selectedReelTitle,
                        subtitle = selectedReelSubtitle,
                        mediaUrl = selectedReelMediaUrl,
                        videoKey = selectedVideoKey(),
                        onSwipeUp = { moveApplicantPublicReel(1) },
                        onSwipeDown = { moveApplicantPublicReel(-1) },
                    ))
                    addView(actionRow("Previous public reel", "Next public reel"))
                    addView(horizontal(spacing = 8) {
                        addView(primaryButton("Mark viewed") {
                            if (requireReelId("marking video viewed")) {
                                executeApiOnSuccess(CatoApiContract.markVideoViewed(selectedReelId), "mark public video viewed") {
                                    selectedReelViewCount = incrementCountLabel(selectedReelViewCount, "views")
                                    updateCurrentReelBadge()
                                    setContentView(applicantShell())
                                }
                            }
                        }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                        addView(secondaryButton("Like") {
                            if (requireReelId("liking video")) {
                                executeApiOnSuccess(CatoApiContract.setVideoLike(selectedReelId, liked = true), "like public video") {
                                    selectedReelLikeCount = incrementCountLabel(selectedReelLikeCount, "likes")
                                    updateCurrentReelBadge()
                                    setContentView(applicantShell())
                                }
                            }
                        }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                    })
                    addView(featureCard("Applicant profile", "Open the public profile for this applicant.") {
                        val applicantId = selectedReelApplicantId.ifBlank { selectedCandidateId }
                        if (applicantId.isBlank()) {
                            lastApiStatus = "Select an applicant video before opening the public profile."
                            setContentView(applicantShell())
                        } else {
                            executeApiOnSuccess(CatoApiContract.publicApplicantProfile(applicantId), "public applicant profile") {
                                applicantDetail = "public-applicant-profile"
                                setContentView(applicantShell())
                            }
                        }
                    })
                },
                matchWrapParams(),
            )
        }
    }

    private fun activeApplicantPublicReelRows(): List<AndroidListRow> {
        return if (publicReelSource == "profile") {
            publicApplicantVideoRows
        } else {
            applicantPublicFeedRows
        }
    }

    private fun applicantPublicProfile(): View {
        return scroll {
            addView(
                vertical(spacing = 16) {
                    setPadding(dp(22), dp(28), dp(22), dp(120))
                    addView(horizontal(spacing = 10) {
                        addView(compactBackButton {
                            applicantDetail = "public-reel-player"
                            setContentView(applicantShell())
                        })
                        addView(label("Profile", 26, colors.textPrimary, bold = true))
                    })
                    addView(publicApplicantProfileHeaderCard())
                    lastApiStatus?.let { addView(statusCard(it)) }
                    if (publicApplicantVideoRows.isNotEmpty()) {
                        addView(sectionTitle("Videos"))
                        addView(thumbnailGrid(
                            titles = publicApplicantVideoRows.map { publicVideoCardApplicantName(it) },
                            thumbnailUrls = publicApplicantVideoRows.map { it.thumbnailUrl.ifBlank { it.mediaUrl } },
                            onItemClick = { index, title ->
                                val row = publicApplicantVideoRows[index]
                                applicantPublicReelIndex = index
                                selectedReelId = row.id.ifBlank { selectedReelId }
                                selectedReelTitle = title
                                selectedReelSubtitle = row.subtitle
                                selectedReelApplicantId = row.applicantId
                                selectedReelMediaUrl = row.mediaUrl
                                selectedReelRaw = row.raw
                                applySelectedReelBadge(row.badge)
                                publicReelsCaughtUp = false
                                publicReelSource = "profile"
                                applicantDetail = "public-reel-player"
                                setContentView(applicantShell())
                            },
                        ))
                    }
                },
                matchWrapParams(),
            )
        }
    }

    private fun publicApplicantProfileHeaderCard(): View {
        val totalViews = publicApplicantVideoRows.sumOf { countFromBadge(it.badge, "views") }
        val totalLikes = publicApplicantVideoRows.sumOf { countFromBadge(it.badge, "likes") }
        return vertical(spacing = 12) {
            setPadding(dp(18), dp(18), dp(18), dp(18))
            background = CatoAndroidDrawable.rounded(colors.surface, dp(22), colors.border)
            addView(horizontal(spacing = 12) {
                addView(label(publicApplicantProfileName.take(1).uppercase().ifBlank { "A" }, 34, colors.accent, bold = true))
                addView(vertical(spacing = 4) {
                    addView(label(publicApplicantProfileName.ifBlank { "Applicant" }, 22, colors.textPrimary, bold = true))
                    if (publicApplicantProfileSubtitle.isNotBlank()) {
                        addView(label(publicApplicantProfileSubtitle, 14, colors.textSecondary))
                    }
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            })
            addView(horizontal(spacing = 8) {
                addView(statPill(publicApplicantVideoRows.size.toString(), "Videos"), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(statPill(totalViews.toString(), "Views"), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(statPill(totalLikes.toString(), "Likes"), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            })
        }
    }

    private fun applicantProfile(): View {
        requestOnce("applicant-profile", CatoApiContract.applicantProfile(), "applicant profile", redrawRecruiter = false)
        requestOnce("applicant-resume", CatoApiContract.applicantResume(), "applicant resume", redrawRecruiter = false)
        requestOnce("applicant-reels", CatoApiContract.applicantReels(), "applicant reels", redrawRecruiter = false)
        requestOnce("applicant-accomplishments", CatoApiContract.applicantAccomplishments(), "applicant accomplishments", redrawRecruiter = false)
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    ApplicantProfileScreen()
                }
            }
        }
    }

    @Composable
    private fun ApplicantProfileScreen() {
        val manualMatchingFirst = shouldShowApplicantSearchRecovery()
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = ComposeColor(colors.background),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 22.dp, vertical = 32.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text("Profile", color = ComposeColor(colors.textPrimary), fontSize = 30.sp, fontWeight = FontWeight.Bold)
                Text("Manage how recruiters understand your work.", color = ComposeColor(colors.textSecondary), fontSize = 16.sp)
                ApplicantIdentityCard()
                ApplicantRecruiterPreviewCard()
                if (manualMatchingFirst) {
                    ApplicantManualMatchingProfileCard(highlighted = true)
                }
                ApplicantProfileReelsCard()
                if (!manualMatchingFirst) {
                    ApplicantManualMatchingProfileCard(highlighted = false)
                }
                ApplicantSoftSkillsProfileCard()
                ApplicantProofSection(
                    title = "What I built",
                    body = "Projects can be added, edited, deleted, and linked to reels.",
                    rows = applicantProjectRows,
                    onRowClick = { row ->
                        selectedProjectId = row.id
                        projectDraftTitle = row.title
                        projectDraftDescription = row.subtitle
                        projectDraftType = firstString(row.raw, "type", "projectType").ifBlank { "built_project" }
                        projectDraftLink = firstString(row.raw, "linkUrl", "url", "projectUrl", "publishedUrl")
                        applicantDetail = "projects"
                        setContentView(applicantShell())
                    },
                    onAddClick = {
                        selectedProjectId = ""
                        resetProjectDraft()
                        applicantDetail = "projects"
                        setContentView(applicantShell())
                    },
                )
                ApplicantProofSection(
                    title = "Internships",
                    body = "Internships can be managed without overweighting profile strength.",
                    rows = applicantInternshipRows,
                    onRowClick = { row ->
                        selectedInternshipId = row.id
                        internshipDraftCompany = firstString(row.raw, "company", "companyName").ifBlank { row.title }
                        internshipDraftRoleDepartment = firstString(row.raw, "roleDepartment", "role", "department").ifBlank { row.subtitle.ifBlank { "Engineering" } }
                        internshipDraftDurationMonths = CatoAndroidJson.intValue(row.raw, "durationMonths")?.toString() ?: "1"
                        applicantDetail = "internships"
                        setContentView(applicantShell())
                    },
                    onAddClick = {
                        selectedInternshipId = ""
                        resetInternshipDraft()
                        applicantDetail = "internships"
                        setContentView(applicantShell())
                    },
                )
                Spacer(modifier = Modifier.height(92.dp))
            }
        }
    }

    @Composable
    private fun ApplicantIdentityCard() {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(18.dp),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    ApplicantProfileAvatar(applicantName.ifBlank { applicantEmail.ifBlank { "A" } })
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(applicantName.ifBlank { "Applicant" }, color = ComposeColor(colors.textPrimary), fontSize = 22.sp, fontWeight = FontWeight.Bold)
                        Text(applicantEmail.ifBlank { "Email unavailable" }, color = ComposeColor(colors.textSecondary), fontSize = 15.sp)
                    }
                    IconButton(onClick = {
                        applicantDetail = "education"
                        setContentView(applicantShell())
                    }) {
                        Icon(Icons.Filled.ChevronRight, contentDescription = "Edit education", tint = ComposeColor(colors.textSecondary))
                    }
                }
                Surface(modifier = Modifier.fillMaxWidth().height(1.dp), color = ComposeColor(colors.border)) {}
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    ApplicantProfileValueLine(applicantUniversityName.ifBlank { "Add university" })
                    ApplicantProfileValueLine(
                        listOf(applicantMajor, applicantSemesterLabel).filter { it.isNotBlank() }.joinToString(" • ").ifBlank { "Add major and semester" },
                    )
                    applicantGpa?.let { gpa ->
                        ApplicantProfileValueLine(String.format("%.2f", gpa))
                    }
                }
            }
        }
    }

    @Composable
    private fun ApplicantProfileAvatar(name: String) {
        Surface(
            modifier = Modifier.size(58.dp),
            color = ComposeColor(colors.background),
            shape = RoundedCornerShape(18.dp),
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(name.trim().firstOrNull()?.uppercaseChar()?.toString() ?: "A", color = ComposeColor(colors.accent), fontSize = 24.sp, fontWeight = FontWeight.Bold)
            }
        }
    }

    @Composable
    private fun ApplicantInfoLine(label: String, value: String) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
            Text(label, color = ComposeColor(colors.textSecondary), fontSize = 14.sp)
            Text(
                value,
                color = ComposeColor(colors.textPrimary),
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f),
            )
        }
    }

    @Composable
    private fun ApplicantRecruiterPreviewCard() {
        val strength = applicantProfileStrength.toFloatOrNull()?.coerceIn(0f, 100f) ?: 0f
        Card(
            onClick = {
                applicantDetail = "recruiter-preview"
                setContentView(applicantShell())
            },
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(18.dp),
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column(verticalArrangement = Arrangement.spacedBy(3.dp), modifier = Modifier.weight(1f)) {
                        Text("Recruiter preview", color = ComposeColor(colors.textPrimary), fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        Text("Tap to see exactly what recruiters see.", color = ComposeColor(colors.textSecondary), fontSize = 13.sp)
                    }
                    ProfileStrengthCircle(strength, Modifier.size(70.dp))
                    Icon(Icons.Filled.ChevronRight, contentDescription = "Open recruiter preview", tint = ComposeColor(colors.textSecondary), modifier = Modifier.size(18.dp))
                }
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        ApplicantChecklistPill("Resume", applicantHasResumeSignal || applicantResumeUrl.isNotBlank(), Modifier.weight(1f))
                        ApplicantChecklistPill("Short take", applicantHasIntroSignal, Modifier.weight(1f))
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        ApplicantChecklistPill("Deeper signal", applicantHasDeeperSignal, Modifier.weight(1f))
                        ApplicantChecklistPill("Soft skills", applicantHasSoftSkillSignal, Modifier.weight(1f))
                    }
                }
            }
        }
    }

    @Composable
    private fun ApplicantManualMatchingProfileCard(highlighted: Boolean) {
        Card(
            onClick = {
                applicantDetail = "manual-matching"
                setContentView(applicantShell())
            },
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = if (highlighted) ComposeColor(Color.rgb(214, 186, 255)) else ComposeColor(colors.surface)),
            shape = RoundedCornerShape(18.dp),
        ) {
            Row(
                modifier = Modifier.padding(18.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.Top,
            ) {
                Surface(modifier = Modifier.size(44.dp), color = ComposeColor(colors.background), shape = CircleShape) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Filled.Search, contentDescription = "Manual matching", tint = ComposeColor(colors.accent), modifier = Modifier.size(22.dp))
                    }
                }
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("Manual matching fields", color = ComposeColor(colors.textPrimary), fontSize = 19.sp, fontWeight = FontWeight.Bold)
                    Text(
                        if (highlighted) applicantSearchRecoveryDescription() else applicantManualProfileSummary.ifBlank { applicantSearchRecoveryDescription() },
                        color = ComposeColor(colors.textSecondary),
                        fontSize = 14.sp,
                    )
                }
                Icon(Icons.Filled.ChevronRight, contentDescription = "Open manual matching", tint = ComposeColor(colors.textSecondary), modifier = Modifier.size(18.dp))
            }
        }
    }

    @Composable
    private fun ApplicantProfileReelsCard() {
        Card(
            onClick = {
                selectedApplicantTab = ApplicantTab.REELS
                setContentView(applicantShell())
            },
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(18.dp),
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
                        Text("Profile reels", color = ComposeColor(colors.textPrimary), fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        Text("${applicantReelCountValue()}/9", color = ComposeColor(colors.textSecondary), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                    Icon(Icons.Filled.ChevronRight, contentDescription = "Open reels", tint = ComposeColor(colors.textSecondary), modifier = Modifier.size(18.dp))
                }
                if (applicantReelRows.isEmpty()) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        Surface(modifier = Modifier.size(44.dp), color = ComposeColor(colors.background), shape = CircleShape) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Filled.Movie, contentDescription = "Reels", tint = ComposeColor(colors.accent), modifier = Modifier.size(22.dp))
                            }
                        }
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text("Add proof videos linked to your work.", color = ComposeColor(colors.textPrimary), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                            Text("Each reel must connect to a project, internship, or accomplishment.", color = ComposeColor(colors.textSecondary), fontSize = 12.sp)
                        }
                    }
                } else {
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        applicantReelRows.take(6).forEachIndexed { index, row ->
                            ApplicantReelPreviewTile(row, index)
                        }
                    }
                }
            }
        }
    }

    @Composable
    private fun ApplicantReelPreviewTile(row: AndroidListRow, index: Int) {
        Surface(
            modifier = Modifier
                .width(112.dp)
                .height(148.dp),
            color = ComposeColor(Color.BLACK),
            shape = RoundedCornerShape(14.dp),
            onClick = {
                applicantReelIndex = index
                selectedReelId = row.id
                selectedReelTitle = row.title
                selectedReelSubtitle = row.subtitle
                selectedReelMediaUrl = row.mediaUrl
                selectedReelRaw = row.raw
                applicantDetail = "reel-player"
                setContentView(applicantShell())
            },
        ) {
            Box(modifier = Modifier.fillMaxSize()) {
                VideoThumbnailImage(row.thumbnailUrl, row.mediaUrl)
                Box(modifier = Modifier.fillMaxSize().background(ComposeColor.Black.copy(alpha = 0.32f)))
                Icon(Icons.Filled.PlayCircle, contentDescription = "Play reel", tint = ComposeColor(Color.WHITE), modifier = Modifier.align(Alignment.Center).size(30.dp))
            }
        }
    }

    @Composable
    private fun ApplicantSoftSkillsProfileCard() {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(18.dp),
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("Soft skills", color = ComposeColor(colors.textPrimary), fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    Text(if (applicantHasSoftSkillSignal) "Ready" else "Pending", color = ComposeColor(colors.textSecondary), fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
                Text(
                    if (applicantHasSoftSkillSignal) {
                        "Soft-skill signals are available from your profile setup."
                    } else {
                        "Soft skills will appear after your signal profile is complete."
                    },
                    color = ComposeColor(colors.textSecondary),
                    fontSize = 14.sp,
                )
            }
        }
    }

    private fun refreshApplicantProfile() {
        executeApiOnSuccess(CatoApiContract.applicantProfile(), "applicant profile") {
            executeApiOnSuccess(CatoApiContract.applicantResume(), "applicant resume") {
                executeApiOnSuccess(CatoApiContract.applicantReels(), "applicant reels") {
                    executeApi(CatoApiContract.applicantAccomplishments(), "applicant accomplishments") {
                        setContentView(applicantShell())
                    }
                }
            }
        }
    }

    @Composable
    private fun ApplicantProofSection(
        title: String,
        body: String,
        rows: List<AndroidListRow>,
        onRowClick: (AndroidListRow) -> Unit,
        onAddClick: () -> Unit,
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(18.dp),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(title, color = ComposeColor(colors.textPrimary), fontWeight = FontWeight.Bold, fontSize = 20.sp)
                    Text(rows.size.toString(), color = ComposeColor(colors.textSecondary), fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
                Text(body, color = ComposeColor(colors.textSecondary), fontSize = 15.sp)
                if (rows.isEmpty()) {
                    Text("Nothing added yet.", color = ComposeColor(colors.textSecondary), fontSize = 14.sp)
                } else {
                    rows.take(3).forEach { row ->
                        ApplicantProofRow(row) {
                            onRowClick(row)
                        }
                    }
                }
                OutlinedButton(
                    onClick = onAddClick,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Text(if (rows.isEmpty()) "Add $title" else "Manage $title", fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    @Composable
    private fun ApplicantProofRow(row: AndroidListRow, onClick: () -> Unit) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = ComposeColor(colors.background),
            shape = RoundedCornerShape(14.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, ComposeColor(colors.border)),
            onClick = onClick,
        ) {
            Row(
                modifier = Modifier.padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Surface(modifier = Modifier.size(38.dp), color = ComposeColor(colors.background), shape = CircleShape) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Filled.Work, contentDescription = null, tint = ComposeColor(colors.accent), modifier = Modifier.size(19.dp))
                    }
                }
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text(row.title.ifBlank { "Untitled" }, color = ComposeColor(colors.textPrimary), fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    if (row.subtitle.isNotBlank()) {
                        Text(row.subtitle, color = ComposeColor(colors.textSecondary), fontSize = 12.sp)
                    }
                }
                Icon(Icons.Filled.ChevronRight, contentDescription = "Open", tint = ComposeColor(colors.textSecondary), modifier = Modifier.size(16.dp))
            }
        }
    }

    private fun applicantRecruiterPreview(): View {
        requestOnce("applicant-profile", CatoApiContract.applicantProfile(), "applicant profile", redrawRecruiter = false)
        requestOnce("applicant-resume", CatoApiContract.applicantResume(), "applicant resume", redrawRecruiter = false)
        requestOnce("applicant-reels", CatoApiContract.applicantReels(), "applicant reels", redrawRecruiter = false)
        requestOnce("applicant-accomplishments", CatoApiContract.applicantAccomplishments(), "applicant accomplishments", redrawRecruiter = false)
        val projectRows = applicantProjectRows.filter { it.id.isNotBlank() }
        val internshipRows = applicantInternshipRows.filter { it.id.isNotBlank() }
        val accomplishmentRows = applicantAccomplishmentRows.filter { it.id.isNotBlank() }
        return scroll {
            addView(
                vertical(spacing = 16) {
                    setPadding(dp(22), dp(28), dp(22), dp(120))
                    addView(horizontal(spacing = 10) {
                        addView(compactBackButton {
                            applicantDetail = null
                            selectedApplicantTab = ApplicantTab.PROFILE
                            setContentView(applicantShell())
                        })
                        addView(label("Recruiter Preview", 26, colors.textPrimary, bold = true))
                    })
                    addView(label("This mirrors the recruiter-facing profile. Empty proof sections stay hidden.", 16, colors.textSecondary))
                    lastApiStatus?.let { addView(statusCard(it)) }
                    addView(primaryButton("Refresh preview") {
                        executeApiOnSuccess(CatoApiContract.applicantProfile(), "applicant profile") {
                            executeApiOnSuccess(CatoApiContract.applicantResume(), "applicant resume") {
                                executeApiOnSuccess(CatoApiContract.applicantReels(), "applicant reels") {
                                    executeApi(CatoApiContract.applicantAccomplishments(), "applicant accomplishments") {
                                        setContentView(applicantShell())
                                    }
                                }
                            }
                        }
                    })
                    addView(featureCard(applicantName.ifBlank { "Applicant" }, listOf(applicantUniversityName, applicantMajor, applicantSemesterLabel).filter { it.isNotBlank() }.joinToString("\n").ifBlank { "Add education details so recruiters can understand your academic context." }))
                    val introRow = applicantIntroPreviewRow()
                    val deeperRow = applicantDeeperPreviewRow()
                    if (introRow != null) {
                        val row = introRow
                        addView(videoSurface("Intro video", row.subtitle.ifBlank { "Recruiters see your 10-second intro video first." }, row.mediaUrl, row.videoKey()))
                    } else {
                        addView(featureCard("Add intro video", "Recruiters see your short intro before your longer profile context.") {
                            chooseSignalVideo(type = "signal", returnToOnboarding = false)
                        })
                    }
                    if (deeperRow != null) {
                        val row = deeperRow
                        addView(videoSurface("Deeper signal", row.subtitle.ifBlank { "Recruiters can watch your longer thought process when available." }, row.mediaUrl, row.videoKey()))
                    } else {
                        addView(featureCard("Add deeper signal", "Add optional deeper context for recruiters who want more than the intro.") {
                            chooseSignalVideo(type = "deeper", returnToOnboarding = false)
                        })
                    }
                    val previewReelRows = applicantReelRows.filter { it.id.isNotBlank() }
                    if (previewReelRows.isNotEmpty()) {
                        addView(sectionTitle("Profile reels"))
                        addView(thumbnailGrid(
                            titles = previewReelRows.map { "" },
                            thumbnailUrls = previewReelRows.map { it.thumbnailUrl.ifBlank { it.mediaUrl } },
                            onItemClick = { index, title ->
                                val row = previewReelRows.getOrNull(index)
                                applicantReelIndex = applicantReelRows.indexOfFirst { it.id == row?.id }.takeIf { it >= 0 } ?: index
                                selectedReelId = row?.id?.takeIf { it.isNotBlank() } ?: selectedReelId
                                selectedReelTitle = row?.title ?: title
                                selectedReelSubtitle = row?.subtitle ?: "Profile reel"
                                selectedReelMediaUrl = row?.mediaUrl.orEmpty()
                                selectedReelRaw = row?.raw.orEmpty()
                                applicantDetail = "reel-player"
                                setContentView(applicantShell())
                            },
                        ))
                    }
                    if (applicantResumeUrl.isNotBlank()) {
                        addView(featureCard("Resume", "Recruiters can preview your uploaded PDF.") {
                            openResumePreview(applicantResumeUrl, "Resume", isRecruiter = false)
                        })
                    } else {
                        addView(featureCard("Add resume", "A resume improves recruiter review and search ranking.") {
                            applicantDetail = "resume-extraction"
                            setContentView(applicantShell())
                        })
                    }
                    projectRows.forEach { row -> addView(featureCard(row.title, row.subtitle)) }
                    internshipRows.forEach { row -> addView(featureCard(row.title, row.subtitle)) }
                    accomplishmentRows.forEach { row -> addView(featureCard(row.title, row.subtitle)) }
                    if (projectRows.isEmpty() && internshipRows.isEmpty() && accomplishmentRows.isEmpty()) {
                        addView(featureCard("Add proof", "Projects, internships, accomplishments, and profile reels make this preview stronger.") {
                            applicantDetail = "reel-upload"
                            setContentView(applicantShell())
                        })
                    }
                },
                matchWrapParams(),
            )
        }
    }

    private fun applicantSettings(): View {
        requestOnce("applicant-profile", CatoApiContract.applicantProfile(), "applicant profile", redrawRecruiter = false)
        requestOnce("applicant-resume", CatoApiContract.applicantResume(), "applicant resume", redrawRecruiter = false)
        requestOnce("applicant-search-profile", CatoApiContract.applicantSearchProfile(), "applicant search profile", redrawRecruiter = false)
        return ComposeView(this).apply {
            setContent {
                CatoActivityMaterialTheme(colors) {
                    ApplicantSettingsScreen()
                }
            }
        }
    }

    @Composable
    private fun ApplicantSettingsScreen() {
        val scrollState = rememberScrollState(initial = applicantSettingsScrollY)
        LaunchedEffect(scrollState) {
            snapshotFlow { scrollState.value }.collect { applicantSettingsScrollY = it }
        }
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = ComposeColor(colors.background),
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(scrollState)
                    .padding(horizontal = 22.dp, vertical = 32.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text("Settings", color = ComposeColor(colors.textPrimary), fontSize = 30.sp, fontWeight = FontWeight.Bold)
                Text("Manage your applicant account.", color = ComposeColor(colors.textSecondary), fontSize = 16.sp)
                ApplicantSettingsGroupCard("Profile") {
                    ApplicantSettingsRow(
                        icon = Icons.Filled.Description,
                        title = "Resume extraction",
                        body = applicantResumeSummary.ifBlank { "Retry extraction or add matching fields manually if parsing failed." },
                    ) {
                        applicantDetail = "resume-extraction"
                        setContentView(applicantShell())
                    }
                    ApplicantSettingsDivider()
                    ApplicantSettingsRow(
                        icon = Icons.Filled.Search,
                        title = "Manual matching fields",
                        body = applicantManualProfileSummary.ifBlank { applicantSearchRecoveryDescription() },
                        highlighted = shouldShowApplicantSearchRecovery(),
                    ) {
                        applicantDetail = "manual-matching"
                        setContentView(applicantShell())
                    }
                }
                ApplicantSettingsGroupCard("Account") {
                    ApplicantSettingsRow(
                        icon = Icons.Filled.ExitToApp,
                        title = "Log out",
                        body = "Clear local Android session and return to sign in.",
                    ) {
                        runtime.sessionStore.clearSynchronously()
                        resetLoadedState()
                        showRoot(CatoRootRoute.SignedOut)
                    }
                }
                if (applicantDeleteConfirmationVisible) {
                    DangerMaterialCard(
                        title = "Delete applicant account?",
                        body = "This deletes applicant account data and signs you out. This action cannot be undone from the app.",
                        confirmTitle = "Delete account",
                        onConfirm = {
                            executeApiOnSuccess(CatoApiContract.deleteApplicantAccount(), "delete applicant account") {
                                applicantDeleteConfirmationVisible = false
                                runtime.sessionStore.clearSynchronously()
                                resetLoadedState()
                                showRoot(CatoRootRoute.SignedOut)
                            }
                        },
                        onCancel = {
                            applicantDeleteConfirmationVisible = false
                            setContentView(applicantShell())
                        },
                    )
                } else {
                    ApplicantSettingsGroupCard("Danger zone") {
                        ApplicantSettingsRow(
                            icon = Icons.Filled.Delete,
                            title = "Delete account",
                            body = "Delete applicant data, clear local session, and return to sign in.",
                            destructive = true,
                        ) {
                            applicantDeleteConfirmationVisible = true
                            setContentView(applicantShell())
                        }
                    }
                }
                Spacer(modifier = Modifier.height(92.dp))
            }
        }
    }

    @Composable
    private fun ApplicantSettingsIdentityCard() {
        Card(
            onClick = {
                applicantDetail = "education"
                setContentView(applicantShell())
            },
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(18.dp),
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    ApplicantProfileAvatar(applicantName.ifBlank { applicantEmail.ifBlank { "A" } })
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(applicantName.ifBlank { "Applicant" }, color = ComposeColor(colors.textPrimary), fontSize = 21.sp, fontWeight = FontWeight.Bold)
                        Text(applicantEmail.ifBlank { "Email unavailable" }, color = ComposeColor(colors.textSecondary), fontSize = 14.sp)
                    }
                    Icon(Icons.Filled.ChevronRight, contentDescription = "Edit account", tint = ComposeColor(colors.textSecondary), modifier = Modifier.size(18.dp))
                }
                Surface(modifier = Modifier.fillMaxWidth().height(1.dp), color = ComposeColor(colors.border)) {}
                ApplicantProfileValueLine(applicantUniversityName.ifBlank { "Not added" })
                ApplicantProfileValueLine(applicantMajor.ifBlank { "Not added" })
                ApplicantProfileValueLine(applicantSemesterLabel.ifBlank { "Not added" })
                applicantGpa?.let { gpa ->
                    ApplicantProfileValueLine(String.format("%.2f", gpa))
                }
            }
        }
    }

    @Composable
    private fun ApplicantProfileValueLine(value: String) {
        Text(
            value,
            color = ComposeColor(colors.textPrimary),
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
        )
    }

    @Composable
    private fun ApplicantSettingsInfoLine(label: String, value: String) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
            Text(label, color = ComposeColor(colors.textSecondary), fontSize = 14.sp)
            Text(
                value,
                color = ComposeColor(colors.textPrimary),
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.weight(1f),
            )
        }
    }

    @Composable
    private fun ApplicantSettingsGroupCard(title: String, content: @Composable ColumnScope.() -> Unit) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(18.dp),
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text(title, color = ComposeColor(colors.textPrimary), fontSize = 18.sp, fontWeight = FontWeight.Bold)
                content()
            }
        }
    }

    @Composable
    private fun ApplicantSettingsRow(
        icon: androidx.compose.ui.graphics.vector.ImageVector,
        title: String,
        body: String,
        highlighted: Boolean = false,
        destructive: Boolean = false,
        onClick: () -> Unit,
    ) {
        Surface(
            modifier = Modifier.fillMaxWidth(),
            color = if (highlighted) ComposeColor(Color.rgb(214, 186, 255)) else ComposeColor(Color.TRANSPARENT),
            shape = RoundedCornerShape(14.dp),
            onClick = onClick,
        ) {
            Row(
                modifier = Modifier.padding(horizontal = if (highlighted) 10.dp else 0.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Surface(
                    modifier = Modifier.size(40.dp),
                    color = if (destructive) ComposeColor(colors.background) else ComposeColor(colors.background),
                    shape = CircleShape,
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            icon,
                            contentDescription = title,
                            tint = if (destructive) ComposeColor(colors.error) else ComposeColor(colors.accent),
                            modifier = Modifier.size(20.dp),
                        )
                    }
                }
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text(
                        title,
                        color = if (destructive) ComposeColor(colors.error) else ComposeColor(colors.textPrimary),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(body, color = ComposeColor(colors.textSecondary), fontSize = 12.sp)
                }
                Icon(Icons.Filled.ChevronRight, contentDescription = "Open", tint = ComposeColor(colors.textSecondary), modifier = Modifier.size(16.dp))
            }
        }
    }

    @Composable
    private fun ApplicantSettingsDivider() {
        Surface(modifier = Modifier.fillMaxWidth().height(1.dp), color = ComposeColor(colors.border)) {}
    }

    @Composable
    private fun DangerMaterialCard(
        title: String,
        body: String,
        confirmTitle: String,
        onConfirm: () -> Unit,
        onCancel: () -> Unit,
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = ComposeColor(colors.surface)),
            shape = RoundedCornerShape(18.dp),
        ) {
            Column(
                modifier = Modifier.padding(18.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(title, color = ComposeColor(colors.textPrimary), fontWeight = FontWeight.Bold, fontSize = 18.sp)
                Text(body, color = ComposeColor(colors.textSecondary), fontSize = 15.sp)
                Button(
                    onClick = onConfirm,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = ComposeColor(colors.warning)),
                ) {
                    Text(confirmTitle, fontWeight = FontWeight.Bold)
                }
                OutlinedButton(
                    onClick = onCancel,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                ) {
                    Text("Cancel", fontWeight = FontWeight.Bold)
                }
            }
        }
    }

    private fun applicantDetailScreen(
        title: String,
        subtitle: String,
        sections: List<Pair<String, String>>,
        actions: List<Pair<String, ApiRequestSpec>> = emptyList(),
        localActions: List<Pair<String, () -> Unit>> = emptyList(),
    ): View {
        return scroll {
            addView(
                vertical(spacing = 16) {
                    setPadding(dp(22), dp(28), dp(22), dp(120))
                    addView(horizontal(spacing = 10) {
                        addView(compactBackButton {
                            applicantDetail = null
                            setContentView(applicantShell())
                        })
                        addView(label(title, 26, colors.textPrimary, bold = true))
                    })
                    addView(label(subtitle, 16, colors.textSecondary))
                    sections.forEach { section ->
                        addView(featureCard(section.first, section.second))
                    }
                    actions.forEach { (label, request) ->
                        addView(primaryButton(label) {
                            when (label) {
                                "Accept" -> {
                                    if (requireRequestId("accepting request")) {
                                        executeApiOnSuccess(request, "accept request") {
                                            selectedRequestStatus = "accepted"
                                            applicantRequestRows = applicantRequestRows.map {
                                                if (it.id == selectedRequestId) it.copy(badge = "accepted", unread = false) else it
                                            }
                                            applicantUnreadRequestCount = applicantRequestRows.count { it.unread }
                                            applicantDetail = "applicant-conversation"
                                            setContentView(applicantShell())
                                        }
                                    }
                                }
                                "Decline" -> {
                                    if (requireRequestId("declining request")) {
                                        executeApiOnSuccess(request, "decline request") {
                                            selectedRequestStatus = "declined"
                                            applicantRequestRows = applicantRequestRows.map {
                                                if (it.id == selectedRequestId) it.copy(badge = "declined", unread = false) else it
                                            }
                                            applicantUnreadRequestCount = applicantRequestRows.count { it.unread }
                                            setContentView(applicantShell())
                                        }
                                    }
                                }
                                "Delete selected project" -> executeApiOnSuccess(request, "delete selected project") {
                                    invalidateApplicantProofProfileState()
                                    applicantProjectRows = applicantProjectRows.filterNot { it.id == selectedProjectId }
                                    selectedProjectId = ""
                                    applicantDetail = null
                                    selectedApplicantTab = ApplicantTab.PROFILE
                                    setContentView(applicantShell())
                                }
                                "Delete selected internship" -> executeApiOnSuccess(request, "delete selected internship") {
                                    invalidateApplicantProofProfileState()
                                    applicantInternshipRows = applicantInternshipRows.filterNot { it.id == selectedInternshipId }
                                    selectedInternshipId = ""
                                    applicantDetail = null
                                    selectedApplicantTab = ApplicantTab.PROFILE
                                    setContentView(applicantShell())
                                }
                                else -> executeApi(request, label.lowercase()) {
                                    setContentView(applicantShell())
                                }
                            }
                        })
                    }
                    localActions.forEach { (label, action) ->
                        addView(primaryButton(label) {
                            action()
                        })
                    }
                },
                matchWrapParams(),
            )
        }
    }

    private fun candidateResultCard(row: AndroidListRow): View {
        return featureCard(row.title, "${row.subtitle}\n${row.badge}") {
            openCandidateFromRow(row)
        }
    }

    private fun openCandidateFromRow(row: AndroidListRow) {
        selectedCandidateId = row.applicantId.ifBlank { row.id.ifBlank { selectedCandidateId } }
        selectedCandidateName = row.title
        selectedCandidateSubtitle = row.subtitle
        selectedCandidateAvatarUrl = candidateAvatarUrl(row)
        selectedCandidateScore = row.badge.ifBlank { "Runtime match" }
        selectedCandidateProfileStrength = ""
        selectedCandidateSemesterLabel = ""
        selectedCandidateGpa = ""
        selectedCandidateSignalSummary = firstString(row.raw, "signalSummary", "summary")
        selectedCandidateReviewStatus = reviewStatusFromText(row.badge)
        selectedCandidateBookmarked = CatoAndroidJson.booleanValue(row.raw, "bookmarked") == true
        selectedCandidateInterestStatus = firstString(row.raw, "interestRequestStatus", "requestStatus").normalizedInterestStatus()
        selectedCandidateResume = ""
        selectedCandidateResumeUrl = ""
        selectedCandidateEvidenceRows = immediateRuntimeEvidenceRows(row.raw)
        selectedCandidateProjectRows = emptyList()
        selectedCandidateInternshipRows = emptyList()
        selectedCandidateAccomplishmentRows = emptyList()
        selectedCandidateSoftSkillRows = emptyList()
        selectedCandidateReelRows = emptyList()
        hydratedCandidateDetailId = ""
        hydratedCandidateMediaId = ""
        recruiterDetail = "candidate-review"
        setContentView(recruiterShell())
        requestSelectedCandidateHydrationOnce()
    }

    private fun immediateRuntimeEvidenceRows(raw: String): List<AndroidListRow> {
        if (raw.isBlank()) return emptyList()
        val scoreBody = CatoAndroidJson.objectValue(raw, "score") ?: raw
        val reasons = CatoAndroidJson.stringArray(scoreBody, "reasons")
            .ifEmpty { CatoAndroidJson.stringArray(raw, "reasons") }
        val blockers = CatoAndroidJson.stringArray(scoreBody, "blockers")
            .ifEmpty { CatoAndroidJson.stringArray(raw, "blockers") }
        return buildList {
            if (reasons.isNotEmpty()) {
                add(AndroidListRow(title = "Why this match?", subtitle = reasons.take(4).joinToString("\n")))
            }
            if (blockers.isNotEmpty()) {
                add(AndroidListRow(title = "Missing signals", subtitle = blockers.take(4).joinToString("\n")))
            }
        }
    }

    private fun openRecruiterCandidateProfile() {
        if (!requireCandidateId("opening candidate profile")) return
        recruiterCandidateProfileReturnDetail = recruiterDetail ?: "candidate-review"
        recruiterDetail = "candidate-profile"
        setContentView(recruiterShell())
        requestSelectedCandidateHydrationOnce()
    }

    private fun requestSelectedCandidateHydrationOnce() {
        val candidateId = selectedCandidateId
        if (candidateId.isBlank()) return
        val needsDetail = hydratedCandidateDetailId != candidateId
        val needsMedia = hydratedCandidateMediaId != candidateId
        if (!needsDetail && !needsMedia) return
        if (needsDetail) {
            executeApiOnSuccess(CatoApiContract.recruiterCandidate(candidateId), "candidate detail") {
                hydratedCandidateDetailId = candidateId
                if (hydratedCandidateMediaId != candidateId) {
                    executeApiOnSuccess(CatoApiContract.recruiterCandidateProfileMedia(candidateId), "candidate profile media") {
                        hydratedCandidateMediaId = candidateId
                        setContentView(recruiterShell())
                    }
                } else {
                    setContentView(recruiterShell())
                }
            }
        } else if (needsMedia) {
            executeApiOnSuccess(CatoApiContract.recruiterCandidateProfileMedia(candidateId), "candidate profile media") {
                hydratedCandidateMediaId = candidateId
                setContentView(recruiterShell())
            }
        }
    }

    private fun toggleShortlistComparison(candidateId: String) {
        if (candidateId.isBlank()) return
        selectedShortlistComparisonIds = if (selectedShortlistComparisonIds.contains(candidateId)) {
            selectedShortlistComparisonIds.filterNot { it == candidateId }
        } else if (selectedShortlistComparisonIds.size < 4) {
            selectedShortlistComparisonIds + candidateId
        } else {
            lastApiStatus = "Compare up to four candidates at a time."
            selectedShortlistComparisonIds
        }
    }

    private fun currentRuntimeSearchSpec(): RuntimeSearchSpec {
        return RuntimeSearchSpec(
            employmentType = recruiterSearchEmploymentType,
            targetCategories = recruiterSearchCategories,
            requiredSkills = recruiterSearchRequiredSkills,
            preferredSkills = recruiterSearchPreferredSkills,
            desiredDepth = recruiterSearchDepth,
            graduated = recruiterSearchGraduated,
            minGpa = recruiterSearchMinGpa,
            semesterNumbers = recruiterSearchSemesterNumbers,
        )
    }

    private fun runtimeSearchSummary(): String {
        val parts = mutableListOf<String>()
        recruiterSearchEmploymentType?.let { parts += it.label }
        if (recruiterSearchGraduated != "any") parts += if (recruiterSearchGraduated == "true") "Graduated" else "Not graduated"
        if (recruiterSearchCategories.isNotEmpty()) {
            parts += compactSearchSummaryPart("Fields", matchingDisplayLabels(recruiterSearchCategories, recruiterSearchFieldOptions))
        }
        if (recruiterSearchRequiredSkills.isNotEmpty()) {
            parts += compactSearchSummaryPart("Must have", matchingDisplayLabels(recruiterSearchRequiredSkills, recruiterSearchSkillOptions))
        }
        if (recruiterSearchPreferredSkills.isNotEmpty()) {
            parts += compactSearchSummaryPart("Boost", matchingDisplayLabels(recruiterSearchPreferredSkills, recruiterSearchSkillOptions))
        }
        recruiterSearchMinGpa?.let { parts += "GPA $it+" }
        if (recruiterSearchSemesterNumbers.isNotEmpty()) {
            parts += compactSearchSummaryPart("Semesters", recruiterSearchSemesterNumbers.map { semesterSummaryLabel(it) })
        }
        recruiterSearchDepth?.let { parts += "Depth ${it.type.wireValue}/${matchingDepthLabel(it)}" }
        return parts.joinToString(" • ").ifBlank { "No filters selected. Search stays broad." }
    }

    private fun compactSearchSummaryPart(label: String, values: List<String>): String {
        val cleaned = values.filter { it.isNotBlank() }
        val visible = cleaned.take(2).joinToString(", ")
        val extra = cleaned.size - 2
        return when {
            cleaned.isEmpty() -> label
            extra > 0 -> "$label $visible +$extra"
            else -> "$label $visible"
        }
    }

    private fun semesterSummaryLabel(value: Int): String {
        return semesterChoiceRows().firstOrNull { it.first == value }?.second
            ?.replace(" / Semester ", " sem ")
            ?.replace(" / Extended undergrad", "")
            ?: "Sem $value"
    }

    private fun matchingDepthLabel(depth: MatchingDepth): String {
        val options = if (depth.type == MatchingOptionType.SKILL) recruiterSearchSkillOptions else recruiterSearchFieldOptions
        return matchingDisplayLabels(listOf(depth.id), options).firstOrNull() ?: depth.id
    }

    private fun matchingDisplayLabels(values: List<String>, options: List<AndroidListRow>): List<String> {
        return values.map { value ->
            options.firstOrNull { option ->
                option.id.equals(value, ignoreCase = true) || option.title.equals(value, ignoreCase = true)
            }?.title ?: value
        }
    }

    private fun shouldShowApplicantSearchRecovery(): Boolean {
        val hasManualProfile = applicantManualProfileSummary.contains("fields,", ignoreCase = true) &&
            applicantManualProfileSummary.contains("skills", ignoreCase = true)
        val resumeReady = applicantResumeSummary.contains("has searchable text", ignoreCase = true)
        return !hasManualProfile && !resumeReady
    }

    private fun applicantSearchRecoveryDescription(): String {
        return when {
            applicantResumeSummary.contains("Needs extraction", ignoreCase = true) ->
                "Your resume is uploaded, but searchable text is not ready yet. You can still finish onboarding, or add skills and fields manually so recruiter search can find you."
            applicantResumeSummary.contains("No resume", ignoreCase = true) || applicantResumeSummary.contains("skipped", ignoreCase = true) ->
                "You do not have searchable resume text yet. You can still finish onboarding, or add your skills and fields manually now."
            else ->
                "Add fields, skills, and one strongest fluency area to improve recruiter matching beyond the resume."
        }
    }

    private fun applicantManualMatchingSummary(fieldCount: Int, skillCount: Int, depthType: MatchingOptionType, depthId: String): String {
        val depthKind = if (depthType == MatchingOptionType.CATEGORY) "field" else "skill"
        val depthOptions = if (depthType == MatchingOptionType.CATEGORY) applicantManualFieldOptions else applicantManualSkillOptions
        val depthLabel = matchingDisplayLabels(listOf(depthId), depthOptions).firstOrNull()
            ?.let { cleanMatchingLabel(it) }
            ?: cleanMatchingLabel(depthId)
            .ifBlank { "Not set" }
        return "$fieldCount fields, $skillCount skills\nDeep knowledge in: $depthKind - $depthLabel"
    }

    private fun applicantProfileStrengthLabel(): String {
        return applicantProfileStrength.toIntOrNull()?.let { "$it%" } ?: "Refresh profile to calculate"
    }

    private fun scorePercent(value: String): Float {
        return Regex("""\d+""").find(value)?.value?.toFloatOrNull()?.coerceIn(0f, 100f) ?: 0f
    }

    private fun resetRecruiterSearchSelections() {
        selectedRecruiterJobId = ""
        recruiterSearchName = "Untitled search"
        recruiterSearchEmploymentType = null
        recruiterSearchGraduated = "any"
        recruiterSearchMinGpa = null
        recruiterSearchSemesterNumbers = emptyList()
        recruiterSearchCategories = emptyList()
        recruiterSearchRequiredSkills = emptyList()
        recruiterSearchPreferredSkills = emptyList()
        recruiterSearchDepth = null
        recruiterFieldQuery = ""
        recruiterSkillQuery = ""
        recruiterSearchCollapsed = false
        lastApiStatus = "Search filters reset."
    }

    private fun applyRecruiterQuickSearch(row: AndroidListRow) {
        selectedRecruiterJobId = row.id
        recruiterSearchName = row.title
        val body = row.raw
        if (body.isBlank()) return
        val employmentType = firstString(body, "employmentType")
        recruiterSearchEmploymentType = RecruiterSearchEmploymentType.entries.firstOrNull { it.wireValue == employmentType }
        recruiterSearchCategories = CatoAndroidJson.stringArray(body, "targetCategories")
            .ifEmpty { CatoAndroidJson.stringArray(body, "categories") }
            .distinct()
            .sorted()
        recruiterSearchRequiredSkills = CatoAndroidJson.stringArray(body, "requiredSkills")
            .distinct()
            .sorted()
        recruiterSearchPreferredSkills = CatoAndroidJson.stringArray(body, "preferredSkills")
            .distinct()
            .sorted()
        recruiterSearchMinGpa = CatoAndroidJson.doubleValue(body, "minGpa")
        recruiterSearchSemesterNumbers = CatoAndroidJson.intArray(body, "semesterNumbers").sorted()
        val preferredSemesterRange = CatoAndroidJson.objectValue(body, "preferredSemesterRange")
        recruiterSearchGraduated = when {
            preferredSemesterRange != null && (CatoAndroidJson.intValue(preferredSemesterRange, "min") ?: 0) >= 100 -> "true"
            preferredSemesterRange != null && (CatoAndroidJson.intValue(preferredSemesterRange, "max") ?: 100) < 100 -> "false"
            else -> firstString(body, "graduated").ifBlank { "any" }
        }
        if (recruiterSearchSemesterNumbers.isEmpty() && preferredSemesterRange != null) {
            val min = CatoAndroidJson.intValue(preferredSemesterRange, "min")
            val max = CatoAndroidJson.intValue(preferredSemesterRange, "max")
            if (min != null && max != null && min == max) recruiterSearchSemesterNumbers = listOf(min)
        }
        val depth = CatoAndroidJson.objectValue(body, "desiredDepth")
        recruiterSearchDepth = depth?.let {
            val type = MatchingOptionType.entries.firstOrNull { option -> option.wireValue == firstString(it, "type") }
            val id = firstString(it, "id")
            if (type != null && id.isNotBlank()) MatchingDepth(type, id) else null
        }
        lastApiStatus = "Loaded quick search: ${row.title}"
    }

    private fun searchToggleLabel(value: String, selectedValues: List<String>): String {
        return if (selectedValues.contains(value)) "$value ✓" else value
    }

    private fun List<String>.toggle(value: String): List<String> {
        return if (contains(value)) filterNot { it == value } else (this + value).distinct().sorted()
    }

    private fun List<Int>.toggleInt(value: Int): List<Int> {
        return if (contains(value)) filterNot { it == value } else (this + value).distinct().sorted()
    }

    private fun manualOptionRows(
        options: List<AndroidListRow>,
        selected: List<AndroidListRow>,
        max: Int,
        type: MatchingOptionType,
        onAfterToggle: (() -> Unit)? = null,
    ): List<View> {
        val displayOptions = options.sortedBy { cleanMatchingLabel(it.title).lowercase() }
        if (displayOptions.isEmpty()) return emptyList()
        return listOf(
            horizontalScroller {
                displayOptions.chunked(6).forEach { page ->
                    addView(vertical(spacing = 8) {
                        page.chunked(2).forEach { row ->
                            addView(horizontal(spacing = 8) {
                                row.forEach { option ->
                                    val isSelected = selected.any { it.id == option.id }
                                    addView(manualMatchingChip(option, isSelected) {
                                        when (type) {
                                            MatchingOptionType.SKILL -> {
                                                applicantManualSelectedSkills = toggleManualOption(applicantManualSelectedSkills, option, max)
                                                if (applicantManualDepthType == MatchingOptionType.SKILL && applicantManualSelectedSkills.none { it.id == applicantManualDepthId }) {
                                                    applicantManualDepthId = applicantManualSelectedSkills.firstOrNull()?.id.orEmpty()
                                                }
                                            }
                                            MatchingOptionType.CATEGORY -> {
                                                applicantManualSelectedFields = toggleManualOption(applicantManualSelectedFields, option, max)
                                                if (applicantManualDepthType == MatchingOptionType.CATEGORY && applicantManualSelectedFields.none { it.id == applicantManualDepthId }) {
                                                    applicantManualDepthId = applicantManualSelectedFields.firstOrNull()?.id.orEmpty()
                                                }
                                            }
                                        }
                                        onAfterToggle?.invoke() ?: setContentView(applicantShell())
                                    }, LinearLayout.LayoutParams(dp(132), ViewGroup.LayoutParams.WRAP_CONTENT))
                                }
                                repeat(2 - row.size) {
                                    addView(FrameLayout(this@MainActivity), LinearLayout.LayoutParams(dp(132), ViewGroup.LayoutParams.WRAP_CONTENT))
                                }
                            })
                        }
                    }, LinearLayout.LayoutParams(dp(272), ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                        rightMargin = dp(10)
                    })
                }
            }
        )
    }

    private fun filterOptions(options: List<AndroidListRow>, query: String): List<AndroidListRow> {
        val normalized = query.trim().lowercase()
        return if (normalized.isBlank()) {
            options
        } else {
            options.filter { option ->
                option.title.lowercase().contains(normalized) ||
                    option.id.lowercase().contains(normalized) ||
                    option.subtitle.lowercase().contains(normalized)
            }
        }
    }

    private fun shouldShowAddOption(query: String, options: List<AndroidListRow>): Boolean {
        val normalized = query.trim().lowercase()
        if (normalized.isBlank()) return false
        return options.none { option ->
            option.id.lowercase() == normalized || option.title.lowercase() == normalized
        }
    }

    private fun semesterChoiceRows(): List<Pair<Int, String>> {
        return listOf(
            1 to "Freshman / Semester 1",
            2 to "Freshman / Semester 2",
            3 to "Sophomore / Semester 3",
            4 to "Sophomore / Semester 4",
            5 to "Junior / Semester 5",
            6 to "Junior / Semester 6",
            7 to "Senior / Semester 7",
            8 to "Senior / Semester 8",
            9 to "Year 5+ / Semester 9",
            10 to "Year 5+ / Semester 10",
            99 to "Graduating this semester",
            100 to "Graduated",
        )
    }

    private fun selectedSearchChipRow(title: String, labels: List<String>): View {
        return vertical(spacing = 8) {
            addView(label(title, 13, colors.textSecondary, bold = true))
            addView(horizontalScroller {
                labels.sortedBy { it.lowercase() }.forEach { item ->
                    addView(selectedManualMatchingPill(cleanMatchingLabel(item)), LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT))
                }
            })
        }
    }

    private fun manualMatchingChip(option: AndroidListRow, selected: Boolean, onClick: () -> Unit): Button {
        val label = cleanMatchingLabel(option.title.ifBlank { option.id })
        return Button(this).apply {
            text = label
            textSize = 12f
            isAllCaps = false
            minHeight = 0
            minimumHeight = 0
            setPadding(dp(8), dp(6), dp(8), dp(6))
            setTextColor(colors.textPrimary)
            background = CatoAndroidDrawable.rounded(
                if (selected) colors.background else colors.surface,
                dp(14),
                if (selected) colors.accent else colors.border,
            )
            setOnClickListener { onClick() }
        }
    }

    private fun manualToggleChip(title: String, selected: Boolean, onClick: () -> Unit): Button {
        return Button(this).apply {
            text = cleanMatchingLabel(title)
            textSize = 12f
            isAllCaps = false
            minHeight = 0
            minimumHeight = 0
            setPadding(dp(8), dp(6), dp(8), dp(6))
            setTextColor(colors.textPrimary)
            background = CatoAndroidDrawable.rounded(
                if (selected) colors.background else colors.surface,
                dp(14),
                if (selected) colors.accent else colors.border,
            )
            setOnClickListener { onClick() }
        }
    }

    private fun manualDepthSection(): View {
        val host = vertical(spacing = 10) {}
        fun render() {
            host.removeAllViews()
            host.addView(sectionTitle("Most fluent in"))
            host.addView(manualDepthSegmentedToggle { render() })
            val depthRows = if (applicantManualDepthType == MatchingOptionType.SKILL) applicantManualSelectedSkills else applicantManualSelectedFields
            if (depthRows.isEmpty()) {
                host.addView(featureCard("Depth", "Select at least one ${if (applicantManualDepthType == MatchingOptionType.SKILL) "skill" else "field"} first."))
            } else {
                depthRows.chunked(2).forEach { row ->
                    host.addView(horizontal(spacing = 8) {
                        row.forEach { option ->
                            addView(manualToggleChip(cleanMatchingLabel(option.title.ifBlank { option.id }), applicantManualDepthId == option.id) {
                                applicantManualDepthId = option.id
                                render()
                            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                        }
                        repeat(2 - row.size) {
                            addView(FrameLayout(this@MainActivity), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                        }
                    })
                }
            }
        }
        render()
        return host
    }

    private fun manualDepthSegmentedToggle(onChanged: () -> Unit): View {
        return horizontal(spacing = 0) {
            setPadding(dp(4), dp(4), dp(4), dp(4))
            background = CatoAndroidDrawable.rounded(colors.surface, dp(999), colors.border)
            addView(manualDepthSegment("Skill", applicantManualDepthType == MatchingOptionType.SKILL) {
                if (applicantManualDepthType != MatchingOptionType.SKILL) {
                    applicantManualDepthType = MatchingOptionType.SKILL
                    applicantManualDepthId = applicantManualSelectedSkills.firstOrNull()?.id.orEmpty()
                    onChanged()
                }
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            addView(manualDepthSegment("Field", applicantManualDepthType == MatchingOptionType.CATEGORY) {
                if (applicantManualDepthType != MatchingOptionType.CATEGORY) {
                    applicantManualDepthType = MatchingOptionType.CATEGORY
                    applicantManualDepthId = applicantManualSelectedFields.firstOrNull()?.id.orEmpty()
                    onChanged()
                }
            }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        }
    }

    private fun manualDepthSegment(title: String, selected: Boolean, onClick: () -> Unit): TextView {
        return label(title, 13, colors.textPrimary, bold = selected).apply {
            gravity = Gravity.CENTER
            setPadding(dp(12), dp(9), dp(12), dp(9))
            background = CatoAndroidDrawable.rounded(
                if (selected) colors.background else Color.TRANSPARENT,
                dp(999),
                Color.TRANSPARENT,
            )
            setOnClickListener { onClick() }
        }
    }

    private fun selectedManualMatchingPill(title: String): View {
        return label(title, 12, colors.textPrimary, bold = true).apply {
            setPadding(dp(10), dp(7), dp(10), dp(7))
            background = CatoAndroidDrawable.rounded(colors.background, dp(999), colors.border)
        }
    }

    private fun cleanMatchingLabel(value: String): String {
        return value
            .replace('_', ' ')
            .replace('-', ' ')
            .trim()
            .split(Regex("\\s+"))
            .filter { it.isNotBlank() }
            .joinToString(" ") { word ->
                if (word.length <= 3 && word.all { it.isUpperCase() || it.isDigit() }) {
                    word
                } else {
                    word.replaceFirstChar { char -> char.uppercase() }
                }
            }
    }

    private fun searchOptionRows(
        options: List<AndroidListRow>,
        selectedValues: List<String>,
        onToggle: (AndroidListRow) -> Unit,
    ): List<View> {
        return options.chunked(3).map { row ->
            horizontal(spacing = 8) {
                row.forEach { option ->
                    val selected = selectedValues.any {
                        it.equals(option.id, ignoreCase = true) || it.equals(option.title, ignoreCase = true)
                    }
                    addView(secondaryButton(if (selected) "${option.title} ✓" else option.title) {
                        onToggle(option)
                        setContentView(recruiterShell())
                    }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                }
                repeat(3 - row.size) {
                    addView(FrameLayout(this@MainActivity), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                }
            }
        }
    }

    private fun toggleManualOption(
        selected: List<AndroidListRow>,
        option: AndroidListRow,
        max: Int,
    ): List<AndroidListRow> {
        return if (selected.any { it.id == option.id }) {
            selected.filterNot { it.id == option.id }
        } else if (selected.size >= max) {
            selected
        } else {
            (selected + option).sortedBy { it.title.lowercase() }
        }
    }

    private fun reelProjectCommand(): ApplicantProjectCommand {
        return ApplicantProjectCommand(
            title = reelEvidenceDraftTitle,
            type = projectDraftType.ifBlank { "built_project" },
            description = reelEvidenceDraftDescription,
            linkUrl = projectDraftLink.takeIf { it.isNotBlank() },
        )
    }

    private fun currentProjectCommand(): ApplicantProjectCommand {
        return ApplicantProjectCommand(
            title = projectDraftTitle,
            type = projectDraftType.ifBlank { "built_project" },
            description = projectDraftDescription,
            linkUrl = projectDraftLink.takeIf { it.isNotBlank() },
        )
    }

    private fun resetProjectDraft() {
        projectDraftTitle = ""
        projectDraftType = "built_project"
        projectDraftDescription = ""
        projectDraftLink = ""
    }

    private fun reelInternshipCommand(): ApplicantInternshipCommand {
        return ApplicantInternshipCommand(
            company = internshipDraftCompany.ifBlank { reelEvidenceDraftTitle },
            roleDepartment = internshipDraftRoleDepartment.ifBlank { "Engineering" },
            durationMonths = internshipDraftDurationMonths.toIntOrNull() ?: 0,
        )
    }

    private fun currentInternshipCommand(): ApplicantInternshipCommand {
        return ApplicantInternshipCommand(
            company = internshipDraftCompany,
            roleDepartment = internshipDraftRoleDepartment.ifBlank { "Engineering" },
            durationMonths = internshipDraftDurationMonths.toIntOrNull() ?: 0,
        )
    }

    private fun resetInternshipDraft() {
        internshipDraftCompany = ""
        internshipDraftRoleDepartment = "Engineering"
        internshipDraftDurationMonths = "1"
    }

    private fun reelAccomplishmentCommand(): ApplicantAccomplishmentCommand {
        return ApplicantAccomplishmentCommand(
            title = reelEvidenceDraftTitle,
            description = reelEvidenceDraftDescription,
            categoryFieldIds = emptyList(),
            skillIds = emptyList(),
            linkUrl = reelEvidenceDraftLink.takeIf { it.isNotBlank() },
        )
    }

    private fun clearReelEvidenceDraftText() {
        reelEvidenceDraftTitle = ""
        reelEvidenceDraftDescription = ""
        reelEvidenceDraftLink = ""
    }

    private fun currentApplicantEducationCommand(): ApplicantEducationCommand {
        return ApplicantEducationCommand(
            universityName = applicantUniversityName.takeIf { it.isNotBlank() } ?: "Unknown University",
            universityMatchedFromEmail = false,
            semesterLabel = applicantSemesterLabel.takeIf { it.isNotBlank() } ?: "Freshman / Semester 1",
            semesterNumber = applicantSemesterNumber.coerceAtLeast(1),
            gpa = applicantGpa,
            major = applicantMajor.takeIf { it.isNotBlank() },
            minor = applicantMinor.takeIf { it.isNotBlank() },
        )
    }

    private fun currentApplicantOnboardingEducationCommand(): ApplicantOnboardingEducationCommand {
        return ApplicantOnboardingEducationCommand(
            universityName = applicantUniversityName.takeIf { it.isNotBlank() } ?: "Unknown University",
            semesterLabel = applicantSemesterLabel.takeIf { it.isNotBlank() } ?: "Freshman / Semester 1",
            semesterNumber = applicantSemesterNumber.coerceAtLeast(1),
        )
    }

    private fun currentApplicantOnboardingProfileCommand(): ApplicantOnboardingProfileCommand {
        val education = ApplicantEducation(
            universityName = applicantUniversityName.takeIf { it.isNotBlank() } ?: "Unknown University",
            universityMatchedFromEmail = false,
            semesterLabel = applicantSemesterLabel.takeIf { it.isNotBlank() } ?: "Freshman / Semester 1",
            semesterNumber = applicantSemesterNumber.coerceAtLeast(1),
            gpa = applicantGpa,
            major = applicantMajor.takeIf { it.isNotBlank() },
            minor = applicantMinor.takeIf { it.isNotBlank() },
        )
        return ApplicantOnboardingProfileCommand(
            name = applicantName.ifBlank { "Applicant" },
            education = education,
            gpa = applicantGpa,
            major = applicantMajor.takeIf { it.isNotBlank() },
            minor = applicantMinor.takeIf { it.isNotBlank() },
        )
    }

    private fun messageCard(row: AndroidListRow): View {
        return vertical(spacing = 8) {
            isClickable = true
            isFocusable = true
            setPadding(dp(18), dp(18), dp(18), dp(18))
            background = CatoAndroidDrawable.rounded(colors.surface, dp(22), colors.border)
            addView(label(row.title, 20, colors.textPrimary, bold = row.unread))
            addView(label(row.subtitle, 15, colors.textSecondary, bold = row.unread))
            setOnClickListener {
                recruiterMessageRows = recruiterMessageRows.map {
                    if (it.id == row.id) it.copy(unread = false) else it
                }
                recruiterUnreadMessageCount = recruiterMessageRows.count { it.unread }
                openRecruiterConversation(row.id.ifBlank { selectedCandidateId }, row.title, row.subtitle)
            }
        }
    }

    private fun openRecruiterConversation(candidateId: String, candidateName: String, preview: String) {
        selectedCandidateId = candidateId.ifBlank { selectedCandidateId }
        selectedCandidateName = candidateName
        selectedRequestSubtitle = preview
        recruiterDetail = "conversation"
        setContentView(recruiterShell())
        if (selectedCandidateId.isNotBlank()) {
            executeApi(CatoApiContract.recruiterCandidateMessages(selectedCandidateId), "candidate messages") {
                setContentView(recruiterShell())
            }
        }
    }

    private fun conversationRowsView(): View {
        return vertical(spacing = 8) {
            if (selectedConversationRows.isEmpty()) {
                addView(featureCard("No messages yet", "Conversation threads load when opened. Refresh if the thread looks stale."))
            } else {
                var dividerShown = false
                selectedConversationRows.forEach { row ->
                    if (row.unread && !dividerShown) {
                        addView(label("New messages", 13, colors.accent, bold = true))
                        dividerShown = true
                    }
                    val isMine = row.title.equals("recruiter", ignoreCase = true) && selectedRole == CatoRole.RECRUITER ||
                        row.title.equals("applicant", ignoreCase = true) && selectedRole == CatoRole.APPLICANT
                    addView(
                        vertical(spacing = 6) {
                            setPadding(dp(14), dp(12), dp(14), dp(12))
                            background = CatoAndroidDrawable.rounded(
                                if (isMine) colors.background else colors.surface,
                                dp(18),
                                colors.border,
                            )
                            addView(label(if (isMine) "You" else row.title, 14, colors.textPrimary, bold = true))
                            addView(label(row.subtitle, 15, colors.textSecondary, bold = row.unread))
                        },
                    )
                }
            }
        }
    }

    private fun candidateIntroVideoRow(): AndroidListRow? {
        return selectedCandidateReelRows.firstOrNull { row ->
            isIntroVideoSource(row.sourceType)
        }
    }

    private fun applicantIntroPreviewRow(): AndroidListRow? {
        return applicantSignalVideoRows.firstOrNull { row ->
            isIntroVideoSource(row.sourceType)
        }
    }

    private fun applicantDeeperPreviewRow(): AndroidListRow? {
        return applicantSignalVideoRows.firstOrNull { row ->
            isDeeperVideoSource(row.sourceType)
        }
    }

    private fun candidateDeeperVideoRow(): AndroidListRow? {
        return selectedCandidateReelRows.firstOrNull { row ->
            isDeeperVideoSource(row.sourceType)
        }
    }

    private fun candidateProfileReelRows(): List<AndroidListRow> {
        return selectedCandidateReelRows.filterNot { row ->
            isIntroVideoSource(row.sourceType) || isDeeperVideoSource(row.sourceType)
        }
    }

    private fun applicantOwnVideoProfileRows(): List<AndroidListRow> {
        return (
            applicantSignalVideoRows.sortedBy { row ->
                when {
                    isIntroVideoSource(row.sourceType) -> 0
                    isDeeperVideoSource(row.sourceType) -> 1
                    else -> 2
                }
            } + applicantReelRows.filterNot { row ->
                isIntroVideoSource(row.sourceType) || isDeeperVideoSource(row.sourceType)
            }
            ).distinctBy { row -> row.id.ifBlank { "${row.sourceType}:${row.mediaUrl}" } }
    }

    private fun isIntroVideoSource(sourceType: String): Boolean {
        val source = sourceType.lowercase()
        return source == "intro" ||
            source == "short_take" ||
            source == "short_take_video" ||
            source == "intro_video" ||
            source == "signal_video"
    }

    private fun isDeeperVideoSource(sourceType: String): Boolean {
        val source = sourceType.lowercase()
        return source == "deeper" ||
            source == "deeper_signal" ||
            source == "deeper_video"
    }

    private fun deeperReelIndexFor(applicantId: String): Int {
        return recruiterReelRows.indexOfFirst { row ->
            row.applicantId == applicantId && isDeeperVideoSource(row.sourceType)
        }
    }

    private fun introReelIndexFor(applicantId: String): Int {
        return recruiterReelRows.indexOfFirst { row ->
            row.applicantId == applicantId && isIntroVideoSource(row.sourceType)
        }
    }

    private fun toggleSelectedReelPlayback(key: String) {
        val shouldPlay = playingVideoKey != key
        playingVideoKey = if (shouldPlay) key else ""
        if (shouldPlay && selectedReelId.isNotBlank()) {
            executeApiOnSuccess(CatoApiContract.markVideoViewed(selectedReelId), "mark video viewed") {
                selectedReelViewCount = incrementCountLabel(selectedReelViewCount, "views")
                updateCurrentReelBadge()
                setContentView(recruiterShell())
            }
        }
    }

    private fun incrementCountLabel(label: String, noun: String): String {
        val current = Regex("""\d+""").find(label)?.value?.toIntOrNull() ?: 0
        val next = current + 1
        return "$next $noun"
    }

    private fun incrementPlainCount(value: String): String {
        val current = value.toIntOrNull() ?: 0
        return (current + 1).toString()
    }

    private fun updateCurrentReelBadge() {
        val badge = "$selectedReelViewCount - $selectedReelLikeCount"
        applicantReelRows = applicantReelRows.map {
            if (it.id == selectedReelId) it.copy(badge = badge) else it
        }
        applicantPublicFeedRows = applicantPublicFeedRows.map {
            if (it.id == selectedReelId) it.copy(badge = badge) else it
        }
        recruiterReelRows = recruiterReelRows.map {
            if (it.id == selectedReelId) it.copy(badge = badge) else it
        }
        selectedCandidateReelRows = selectedCandidateReelRows.map {
            if (it.id == selectedReelId) it.copy(badge = badge) else it
        }
    }

    private fun applySelectedReelBadge(badge: String) {
        val parts = badge.split(" - ")
        selectedReelViewCount = parts.getOrNull(0)?.takeIf { it.isNotBlank() } ?: selectedReelViewCount
        selectedReelLikeCount = parts.getOrNull(1)?.takeIf { it.isNotBlank() } ?: selectedReelLikeCount
    }

    private fun countFromBadge(badge: String, noun: String): Int {
        val segment = badge.split(" - ").firstOrNull { noun in it.lowercase() } ?: return 0
        return Regex("""\d+""").find(segment)?.value?.toIntOrNull() ?: 0
    }

    private fun selectedVideoKey(): String {
        return selectedReelId.ifBlank { selectedReelMediaUrl.ifBlank { selectedReelTitle } }
    }

    private fun AndroidListRow.videoKey(): String {
        return id.ifBlank { mediaUrl.ifBlank { title } }
    }

    private fun isSelectedVideoPlaying(): Boolean {
        val key = selectedVideoKey()
        return key.isNotBlank() && playingVideoKey == key
    }

    private fun moveRecruiterReel(delta: Int) {
        val reelCount = recruiterReelRows.size
        if (reelCount <= 0) return
        recruiterReelIndex = (recruiterReelIndex + delta + reelCount) % reelCount
        playingVideoKey = ""
    }

    private fun moveApplicantPublicReel(delta: Int) {
        val reelCount = activeApplicantPublicReelRows().size
        if (reelCount <= 0) return
        val nextIndex = applicantPublicReelIndex + delta
        if (nextIndex > reelCount - 1) {
            publicReelsCaughtUp = true
            setContentView(applicantShell())
            return
        }
        if (nextIndex < 0) return
        publicReelsCaughtUp = false
        applicantPublicReelIndex = nextIndex
        activeApplicantPublicReelRows().getOrNull(nextIndex)?.let { next ->
            playingVideoKey = next.videoKey()
        }
        setContentView(applicantShell())
    }

    private fun moveApplicantOwnedReel(delta: Int) {
        val reelCount = applicantReelRows.size
        if (reelCount <= 0) return
        val nextIndex = (applicantReelIndex + delta).coerceIn(0, reelCount - 1)
        if (nextIndex == applicantReelIndex) return
        applicantReelIndex = nextIndex
        playingVideoKey = ""
    }

    private fun moveToDeeperReel() {
        val deeperIndex = deeperReelIndexFor(selectedReelApplicantId)
        if (deeperIndex >= 0) {
            recruiterReelIndex = deeperIndex
            playingVideoKey = ""
        } else {
            lastApiStatus = "Deeper signal is not available for this applicant."
        }
    }

    private fun moveToIntroReel(applicantId: String) {
        val introIndex = introReelIndexFor(applicantId.ifBlank { selectedReelApplicantId })
        if (introIndex >= 0) {
            recruiterReelIndex = introIndex
            playingVideoKey = ""
        } else {
            lastApiStatus = "Intro video is not available for this applicant."
        }
    }

    private fun updateSelectedCandidateReviewStatus(status: RecruiterReviewStatus) {
        selectedCandidateReviewStatus = status
        val statusLabel = reviewStatusLabel(status)
        recruiterSearchRows = recruiterSearchRows.map { row ->
            if (row.id == selectedCandidateId || row.applicantId == selectedCandidateId) {
                row.copy(badge = row.badge.withReviewStatus(statusLabel))
            } else {
                row
            }
        }
        recruiterInterestRequestRows = recruiterInterestRequestRows.map { row ->
            if (row.applicantId == selectedCandidateId || row.id == selectedCandidateId) {
                row.copy(badge = statusLabel.lowercase())
            } else {
                row
            }
        }
    }

    private fun openCandidateVideo(row: AndroidListRow) {
        if (row.sourceType == "deeper_signal") {
            recordRecruiterCandidateActivity("deeper_signal_opened")
        }
        recruiterReelRows = listOf(row) + selectedCandidateReelRows.filterNot { it.id.isNotBlank() && it.id == row.id }
        recruiterReelIndex = 0
        selectedReelId = row.id
        selectedReelTitle = row.title
        selectedReelSubtitle = row.subtitle
        selectedReelApplicantId = row.applicantId.ifBlank { selectedCandidateId }
        selectedReelSourceType = row.sourceType.ifBlank { "profile_reel" }
        selectedReelMediaUrl = row.mediaUrl
        selectedReelRaw = row.raw
        recruiterDetail = "reel-viewer"
        setContentView(recruiterShell())
    }

    private fun openCandidateResume() {
        recordRecruiterCandidateActivity("resume_opened")
        openResumePreview(
            selectedCandidateResumeUrl,
            selectedCandidateResume.ifBlank { "Candidate resume" },
            isRecruiter = true,
        )
    }

    private fun recordRecruiterCandidateActivity(type: String) {
        if (selectedCandidateId.isBlank()) return
        apiGateway.executeCato(CatoApiContract.recordRecruiterCandidateActivity(selectedCandidateId, type)) {
            // Activity recording is non-blocking UI telemetry.
        }
    }

    private fun candidateHeaderCard(): View {
        return vertical(spacing = 10) {
            setPadding(dp(18), dp(18), dp(18), dp(18))
            background = CatoAndroidDrawable.rounded(colors.surface, dp(22), colors.border)
            addView(label("Runtime Match", 15, colors.accent, bold = true))
            addView(label(selectedCandidateName, 28, colors.textPrimary, bold = true))
            if (selectedCandidateSubtitle.isNotBlank()) {
                addView(label(selectedCandidateSubtitle, 16, colors.textSecondary))
            }
            addView(label(selectedCandidateScore, 34, colors.accent, bold = true))
            if (selectedCandidateProfileStrength.isNotBlank()) {
                addView(label("Profile strength: $selectedCandidateProfileStrength", 15, colors.textSecondary, bold = true))
            }
            addView(label("Current decision: ${reviewStatusLabel(selectedCandidateReviewStatus)}", 15, colors.textSecondary, bold = true))
            addView(candidateFactGrid())
            val actions = buildList {
                add("Profile")
                if (selectedCandidateResumeUrl.isNotBlank()) add("Resume")
                if (candidateDeeperVideoRow() != null) add("Deeper signal")
            }
            addView(actionRow(*actions.toTypedArray()))
        }
    }

    private fun candidateFactGrid(): View {
        val facts = buildList {
            selectedCandidateProfileStrength.takeIf { it.isNotBlank() }?.let { add("Profile $it") }
            selectedCandidateGpa.takeIf { it.isNotBlank() }?.let { add("GPA $it") }
            selectedCandidateSemesterLabel.takeIf { it.isNotBlank() }?.let { add(it) }
            if (selectedCandidateResumeUrl.isNotBlank()) add("Resume")
            if (candidateDeeperVideoRow() != null) add("Deeper signal")
            if (selectedCandidateProjectRows.isNotEmpty()) add("${selectedCandidateProjectRows.size} projects")
            if (selectedCandidateInternshipRows.isNotEmpty()) add("${selectedCandidateInternshipRows.size} internships")
        }
        if (facts.isEmpty()) return FrameLayout(this)
        return vertical(spacing = 8) {
            facts.chunked(2).forEach { row ->
                addView(horizontal(spacing = 8) {
                    row.forEach { fact ->
                        addView(statusPill(fact), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                    }
                    repeat(2 - row.size) {
                        addView(FrameLayout(this@MainActivity), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                    }
                })
            }
        }
    }

    private fun candidateAboutSection(): View {
        val hasSignal = selectedCandidateSignalSummary.isNotBlank()
        val hasSoftSkills = selectedCandidateSoftSkillRows.isNotEmpty()
        if (!hasSignal && !hasSoftSkills) return FrameLayout(this)
        return vertical(spacing = 10) {
            addView(sectionTitle("About"))
            if (hasSignal) {
                addView(featureCard("Signal", selectedCandidateSignalSummary))
            }
            if (hasSoftSkills) {
                addView(featureCard(
                    "Soft signals",
                    selectedCandidateSoftSkillRows
                        .take(6)
                        .joinToString("\n") { row -> listOf(row.title, row.badge.ifBlank { row.subtitle }).filter { it.isNotBlank() }.joinToString(" - ") },
                ))
            }
        }
    }

    private fun candidateRecruiterActionRow(): View {
        val interestSent = selectedCandidateInterestStatus == "sent" || selectedCandidateInterestStatus == "viewed"
        return horizontal(spacing = 10) {
            addView(
                if (interestSent) {
                    secondaryButton("Interest sent") {
                        lastApiStatus = "Interest has already been sent to this candidate."
                        setContentView(recruiterShell())
                    }
                } else {
                    primaryButton("Interest") {
                        sendRecruiterInterestFromSelectedCandidate("Interested from native Android")
                    }
                },
                LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f),
            )
            addView(
                secondaryButton(if (selectedCandidateBookmarked) "Bookmarked" else "Bookmark") {
                    bookmarkSelectedCandidate()
                },
                LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f),
            )
            addView(
                secondaryButton("Contact") {
                    contactSelectedCandidate()
                },
                LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f),
            )
        }
    }

    private fun sendRecruiterInterestFromSelectedCandidate(reason: String) {
        if (selectedCandidateInterestStatus == "sent" || selectedCandidateInterestStatus == "viewed") {
            lastApiStatus = "Interest has already been sent to this candidate."
            setContentView(recruiterShell())
            return
        }
        val candidateId = interestCandidateId()
        if (requireCandidateId("sending interest", candidateId)) {
            executeApiOnSuccess(
                CatoApiContract.sendRecruiterInterest(
                    candidateId = candidateId,
                    reason = reason,
                    sourceType = selectedReelSourceType.takeIf { recruiterDetail == "reel-viewer" },
                    sourceVideoId = selectedReelId.takeIf { recruiterDetail == "reel-viewer" && it.isNotBlank() },
                ),
                "send interest",
            ) {
                invalidateRecruiterCandidateActionState()
                selectedCandidateInterestStatus = "sent"
                setContentView(recruiterShell())
            }
        }
    }

    private fun bookmarkSelectedCandidate() {
        if (selectedCandidateBookmarked) {
            lastApiStatus = "Candidate is already bookmarked."
            setContentView(recruiterShell())
        } else if (requireCandidateId("bookmarking candidate")) {
            executeApiOnSuccess(CatoApiContract.bookmarkRecruiterCandidate(selectedCandidateId), "bookmark candidate") {
                invalidateRecruiterCandidateActionState()
                selectedCandidateBookmarked = true
                recruiterBookmarkCount = incrementPlainCount(recruiterBookmarkCount)
                setContentView(recruiterShell())
            }
        }
    }

    private fun contactSelectedCandidate() {
        if (requireCandidateId("contacting candidate")) {
            openRecruiterConversation(selectedCandidateId, selectedCandidateName, selectedCandidateSubtitle)
        }
    }

    private fun actionRow(vararg titles: String): View {
        return horizontal(spacing = 10) {
            titles.forEach { title ->
                addView(
                    when (title) {
                        "Shortlist",
                        "Interest",
                        "Upload",
                        "Manage",
                        -> primaryButton(title) {
                            when (title) {
                                "Interest" -> {
                                    sendRecruiterInterestFromSelectedCandidate("Interested from native Android")
                                }
                                "Shortlist" -> {
                                    if (requireCandidateId("shortlisting candidate")) {
                                        executeApiOnSuccess(
                                            CatoApiContract.updateRecruiterReview(selectedCandidateId, RecruiterReviewStatus.SHORTLISTED),
                                            "shortlist candidate",
                                        ) {
                                            invalidateRecruiterCandidateActionState()
                                            updateSelectedCandidateReviewStatus(RecruiterReviewStatus.SHORTLISTED)
                                            setContentView(recruiterShell())
                                        }
                                    }
                                }
                                "Upload" -> {
                                    applicantDetail = "reel-upload"
                                    setContentView(applicantShell())
                                }
                                "Manage" -> {
                                    selectedApplicantTab = ApplicantTab.PROFILE
                                    setContentView(applicantShell())
                                }
                                else -> Unit
                            }
                        }
                        "Play",
                        "Pause",
                        -> secondaryButton(title) {
                            val nextPlaying = !isSelectedVideoPlaying()
                            playingVideoKey = if (nextPlaying) selectedVideoKey() else ""
                            val redraw: () -> Unit = {
                                setContentView(if (selectedRole == CatoRole.RECRUITER) recruiterShell() else applicantShell())
                            }
                            if (nextPlaying && selectedReelId.isNotBlank()) {
                                executeApiOnSuccess(CatoApiContract.markVideoViewed(selectedReelId), "mark video viewed") {
                                    selectedReelViewCount = incrementCountLabel(selectedReelViewCount, "views")
                                    updateCurrentReelBadge()
                                    redraw()
                                }
                            } else {
                                redraw()
                            }
                        }
                        "Interest sent" -> secondaryButton(title) {
                            lastApiStatus = "Interest has already been sent to this candidate."
                            setContentView(recruiterShell())
                        }
                        "Like" -> secondaryButton(title) {
                            if (selectedReelId.isBlank()) {
                                lastApiStatus = "Select a reel before liking video."
                            } else {
                                executeApiOnSuccess(CatoApiContract.setVideoLike(selectedReelId, liked = true), "like video") {
                                    selectedReelLikeCount = incrementCountLabel(selectedReelLikeCount, "likes")
                                    updateCurrentReelBadge()
                                }
                            }
                        }
                        "Previous" -> secondaryButton(title) {
                            moveRecruiterReel(-1)
                            setContentView(recruiterShell())
                        }
                        "Next" -> secondaryButton(title) {
                            moveRecruiterReel(1)
                            setContentView(recruiterShell())
                        }
                        "Previous public reel" -> secondaryButton("Previous") {
                            moveApplicantPublicReel(-1)
                            setContentView(applicantShell())
                        }
                        "Next public reel" -> secondaryButton("Next") {
                            moveApplicantPublicReel(1)
                            setContentView(applicantShell())
                        }
                        "Previous own reel" -> secondaryButton("Previous") {
                            moveApplicantOwnedReel(-1)
                            setContentView(applicantShell())
                        }
                        "Next own reel" -> secondaryButton("Next") {
                            moveApplicantOwnedReel(1)
                            setContentView(applicantShell())
                        }
                        "Deeper" -> secondaryButton(title) {
                            moveToDeeperReel()
                            setContentView(recruiterShell())
                        }
                        "Profile" -> secondaryButton(title) {
                            openRecruiterCandidateProfile()
                        }
                        "Bookmark" -> secondaryButton(title) {
                            bookmarkSelectedCandidate()
                        }
                        "Contact" -> secondaryButton(title) {
                            contactSelectedCandidate()
                        }
                        "Resume" -> secondaryButton(title) {
                            openCandidateResume()
                        }
                        "Deeper signal" -> secondaryButton(title) {
                            candidateDeeperVideoRow()?.let { openCandidateVideo(it) }
                                ?: run {
                                    lastApiStatus = "Deeper signal is not available for this candidate."
                                    setContentView(recruiterShell())
                                }
                        }
                        "Pass" -> secondaryButton(title) {
                            if (requireCandidateId("passing candidate")) {
                                executeApiOnSuccess(
                                    CatoApiContract.updateRecruiterReview(selectedCandidateId, RecruiterReviewStatus.PASSED),
                                    "pass candidate",
                                ) {
                                    invalidateRecruiterCandidateActionState()
                                    updateSelectedCandidateReviewStatus(RecruiterReviewStatus.PASSED)
                                    setContentView(recruiterShell())
                                }
                            }
                        }
                        "Maybe" -> secondaryButton(title) {
                            if (requireCandidateId("marking candidate maybe")) {
                                executeApiOnSuccess(
                                    CatoApiContract.updateRecruiterReview(selectedCandidateId, RecruiterReviewStatus.MAYBE),
                                    "maybe candidate",
                                ) {
                                    invalidateRecruiterCandidateActionState()
                                    updateSelectedCandidateReviewStatus(RecruiterReviewStatus.MAYBE)
                                    setContentView(recruiterShell())
                                }
                            }
                        }
                        else -> secondaryButton(title) {
                            lastApiStatus = "$title is not available on this screen yet."
                            setContentView(if (selectedRole == CatoRole.RECRUITER) recruiterShell() else applicantShell())
                        }
                    },
                    LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f),
                )
            }
        }
    }

    private fun videoSurface(
        title: String,
        subtitle: String,
        mediaUrl: String = "",
        videoKey: String = mediaUrl.ifBlank { title },
        onSwipeUp: (() -> Unit)? = null,
        onSwipeDown: (() -> Unit)? = null,
        onSwipeRight: (() -> Unit)? = null,
    ): View {
        val key = videoKey.ifBlank { mediaUrl.ifBlank { title } }
        return vertical(spacing = 10) {
            gravity = Gravity.CENTER
            setPadding(dp(18), dp(28), dp(18), dp(28))
            background = CatoAndroidDrawable.rounded(colors.accent, dp(28), colors.accent)
            installSwipeHandler(onSwipeUp, onSwipeDown, onSwipeRight)
            if (mediaUrl.isNotBlank()) {
                addView(
                    controlledVideoView(mediaUrl = mediaUrl, videoKey = key),
                    LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(280)),
                )
            }
            addView(label(title, 24, colors.onAccent, bold = true))
            addView(label(subtitle, 15, colors.onAccent))
        }
    }

    private fun controlledVideoView(
        mediaUrl: String,
        videoKey: String,
        autoPlay: Boolean = false,
        tapToToggle: Boolean = false,
        showNativeControls: Boolean = true,
        fillBounds: Boolean = false,
        aspectFitCenter: Boolean = false,
        onPlaybackToggle: ((Boolean) -> Unit)? = null,
        onStarted: (() -> Unit)? = null,
    ): View {
        var hasMarkedStarted = false
        val videoView = (
            when {
                aspectFitCenter -> AspectFitVideoView(this)
                fillBounds -> FillBoundsVideoView(this)
                else -> VideoView(this)
            }
            )
        val loadingOverlay = vertical(spacing = 8) {
            gravity = Gravity.CENTER
            setPadding(dp(14), dp(12), dp(14), dp(12))
            background = CatoAndroidDrawable.rounded(Color.argb(142, 0, 0, 0), dp(18), Color.TRANSPARENT)
            addView(ImageView(this@MainActivity).apply {
                setImageResource(R.drawable.cato_leaf)
                adjustViewBounds = true
            }, LinearLayout.LayoutParams(dp(34), dp(34)).apply {
                gravity = Gravity.CENTER_HORIZONTAL
            })
            addView(ProgressBar(this@MainActivity).apply {
                isIndeterminate = true
                indeterminateTintList = android.content.res.ColorStateList.valueOf(Color.WHITE)
            }, LinearLayout.LayoutParams(dp(32), dp(32)))
            addView(label("Loading video", 12, Color.WHITE, bold = true).apply {
                gravity = Gravity.CENTER
            })
            isClickable = false
            isFocusable = false
        }
        videoView.apply {
            tag = mediaUrl
            val controller = if (showNativeControls) {
                MediaController(this@MainActivity).also {
                    it.setAnchorView(this)
                    setMediaController(it)
                }
            } else {
                null
            }
            setVideoURI(Uri.parse(mediaUrl))
            setOnPreparedListener { mediaPlayer ->
                (this as? AspectFitVideoView)?.setSourceSize(mediaPlayer.videoWidth, mediaPlayer.videoHeight)
                mediaPlayer.isLooping = !autoPlay
                controller?.show(3000)
                if (autoPlay) {
                    post {
                        playingVideoKey = videoKey
                        start()
                        onPlaybackToggle?.invoke(true)
                    }
                    controller?.hide()
                }
            }
            setOnClickListener {
                if (tapToToggle) {
                    if (isPlaying) {
                        pause()
                        onPlaybackToggle?.invoke(false)
                    } else {
                        start()
                        onPlaybackToggle?.invoke(true)
                    }
                } else {
                    controller?.show(3000)
                }
            }
            setOnInfoListener { _, what, _ ->
                if (!hasMarkedStarted && what == android.media.MediaPlayer.MEDIA_INFO_VIDEO_RENDERING_START) {
                    hasMarkedStarted = true
                    loadingOverlay.visibility = View.GONE
                    playingVideoKey = videoKey
                    onStarted?.invoke()
                }
                false
            }
            setOnCompletionListener {
                hasMarkedStarted = false
                if (autoPlay) {
                    start()
                    hasMarkedStarted = true
                    playingVideoKey = videoKey
                    onStarted?.invoke()
                }
            }
        }
        return FrameLayout(this).apply {
            setBackgroundColor(Color.BLACK)
            addView(videoView, matchFrameParams())
            addView(loadingOverlay, centeredParams())
            isClickable = true
            setOnClickListener { videoView.performClick() }
        }
    }

    private fun View.installSwipeHandler(
        onSwipeUp: (() -> Unit)?,
        onSwipeDown: (() -> Unit)?,
        onSwipeRight: (() -> Unit)?,
        onSwipeLeft: (() -> Unit)? = null,
        onTap: (() -> Unit)? = null,
    ) {
        if (onSwipeUp == null && onSwipeDown == null && onSwipeRight == null && onSwipeLeft == null && onTap == null) return
        var startX = 0f
        var startY = 0f
        setOnTouchListener { view, event ->
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    startX = event.x
                    startY = event.y
                    true
                }
                MotionEvent.ACTION_UP -> {
                    val dx = event.x - startX
                    val dy = event.y - startY
                    val horizontal = kotlin.math.abs(dx) > kotlin.math.abs(dy)
                    val threshold = dp(48).toFloat()
                    when {
                        horizontal && dx > threshold && onSwipeRight != null -> {
                            onSwipeRight()
                            setContentView(if (selectedRole == CatoRole.RECRUITER) recruiterShell() else applicantShell())
                            true
                        }
                        horizontal && dx < -threshold && onSwipeLeft != null -> {
                            onSwipeLeft()
                            setContentView(if (selectedRole == CatoRole.RECRUITER) recruiterShell() else applicantShell())
                            true
                        }
                        !horizontal && dy < -threshold && onSwipeUp != null -> {
                            onSwipeUp()
                            setContentView(if (selectedRole == CatoRole.RECRUITER) recruiterShell() else applicantShell())
                            true
                        }
                        !horizontal && dy > threshold && onSwipeDown != null -> {
                            onSwipeDown()
                            setContentView(if (selectedRole == CatoRole.RECRUITER) recruiterShell() else applicantShell())
                            true
                        }
                        kotlin.math.abs(dx) < threshold && kotlin.math.abs(dy) < threshold && onTap != null -> {
                            onTap()
                            view.performClick()
                            setContentView(if (selectedRole == CatoRole.RECRUITER) recruiterShell() else applicantShell())
                            true
                        }
                        else -> true
                    }
                }
                else -> true
            }
        }
    }

    private fun thumbnailGrid(
        titles: List<String>,
        thumbnailUrls: List<String> = emptyList(),
        onClick: (() -> Unit)? = null,
        onItemClick: ((Int, String) -> Unit)? = null,
    ): View {
        return vertical(spacing = 10) {
            titles.chunked(3).forEachIndexed { rowIndex, row ->
                addView(horizontal(spacing = 10) {
                    row.forEachIndexed { columnIndex, title ->
                        val index = rowIndex * 3 + columnIndex
                        addView(
                            thumbnail(title, thumbnailUrls.getOrNull(index).orEmpty()) {
                                if (onItemClick != null) {
                                    onItemClick(index, title)
                                } else {
                                    onClick?.invoke()
                                }
                            },
                            LinearLayout.LayoutParams(0, dp(112), 1f),
                        )
                    }
                    repeat(3 - row.size) {
                        addView(FrameLayout(this@MainActivity), LinearLayout.LayoutParams(0, dp(112), 1f))
                    }
                })
            }
        }
    }

    private fun thumbnail(title: String, thumbnailUrl: String = "", onClick: (() -> Unit)? = null): View {
        return FrameLayout(this).apply {
            isClickable = onClick != null
            isFocusable = onClick != null
            background = CatoAndroidDrawable.rounded(colors.surface, dp(18), colors.border)
            if (thumbnailUrl.isNotBlank()) {
                addView(
                    ComposeView(this@MainActivity).apply {
                        setContent {
                            CatoActivityMaterialTheme(colors) {
                                Box(modifier = Modifier.fillMaxSize()) {
                                    VideoThumbnailImage(thumbnailUrl)
                                    Box(modifier = Modifier.fillMaxSize().background(ComposeColor.Black.copy(alpha = 0.34f)))
                                }
                            }
                        }
                    },
                    matchFrameParams(),
                )
            }
            addView(
                label(title, 13, if (thumbnailUrl.isNotBlank()) Color.WHITE else colors.textPrimary, bold = true).apply {
                    gravity = Gravity.CENTER
                    setPadding(dp(8), dp(8), dp(8), dp(8))
                },
                matchFrameParams(),
            )
            if (onClick != null) {
                setOnClickListener { onClick() }
            }
        }
    }

    private fun sectionTitle(title: String): TextView {
        return label(title, 18, colors.textPrimary, bold = true)
    }

    private fun applicantSectionDivider(title: String, trailing: String): View {
        return horizontal(spacing = 8) {
            addView(label(title, 18, colors.textPrimary, bold = true), LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            addView(label(trailing, 13, colors.textSecondary, bold = true))
        }
    }

    private fun roleToggle(): View {
        return horizontal(spacing = 8) {
            setPadding(dp(6), dp(6), dp(6), dp(6))
            background = CatoAndroidDrawable.rounded(Color.rgb(167, 123, 232), dp(29), colors.border)
            addView(rolePill("Recruiter", CatoRole.RECRUITER), LinearLayout.LayoutParams(0, dp(46), 1f))
            addView(rolePill("Applicant", CatoRole.APPLICANT), LinearLayout.LayoutParams(0, dp(46), 1f))
        }
    }

    private fun rolePill(title: String, role: CatoRole): View {
        val selected = selectedRole == role
        return TextView(this).apply {
            text = title
            textSize = 15f
            gravity = Gravity.CENTER
            setTextColor(if (selected) colors.onAccent else colors.textPrimary)
            setPadding(dp(16), dp(12), dp(16), dp(12))
            background = CatoAndroidDrawable.rounded(
                if (selected) colors.accent else Color.TRANSPARENT,
                dp(20),
                Color.TRANSPARENT,
            )
            setOnClickListener {
                selectedRole = role
                setContentView(loginView())
            }
        }
    }

    private fun standardScreen(
        title: String,
        subtitle: String,
        sections: List<Pair<String, String>>,
    ): View {
        return scroll {
            addView(
                vertical(spacing = 16) {
                    setPadding(dp(22), dp(32), dp(22), dp(120))
                    addView(label(title, 30, colors.textPrimary, bold = true))
                    addView(label(subtitle, 16, colors.textSecondary))
                    sections.forEach { section ->
                        addView(featureCard(section.first, section.second))
                    }
                },
                matchWrapParams(),
            )
        }
    }

    private fun featureCard(title: String, body: String, onClick: (() -> Unit)? = null): View {
        return vertical(spacing = 8) {
            isClickable = onClick != null
            isFocusable = onClick != null
            setPadding(dp(18), dp(16), dp(18), dp(16))
            background = CatoAndroidDrawable.rounded(colors.surface, dp(24), colors.border)
            addView(label(title, 19, colors.textPrimary, bold = true))
            addView(label(body, 14, colors.textSecondary))
            if (onClick != null) {
                setOnClickListener { onClick() }
            }
        }
    }

    private fun dangerConfirmationCard(
        title: String,
        body: String,
        confirmTitle: String,
        onConfirm: () -> Unit,
        onCancel: () -> Unit,
    ): View {
        return vertical(spacing = 12) {
            setPadding(dp(18), dp(18), dp(18), dp(18))
            background = CatoAndroidDrawable.rounded(Color.rgb(249, 245, 255), dp(22), Color.rgb(167, 123, 232))
            addView(label(title, 20, colors.textPrimary, bold = true))
            addView(label(body, 15, colors.textSecondary))
            addView(horizontal(spacing = 10) {
                addView(secondaryButton("Cancel") {
                    onCancel()
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
                addView(Button(this@MainActivity).apply {
                    text = confirmTitle
                    textSize = 16f
                    setTextColor(Color.WHITE)
                    background = CatoAndroidDrawable.rounded(colors.error, dp(16), colors.error)
                    setOnClickListener { onConfirm() }
                }, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
            })
        }
    }

    private fun configStatusCard(): View {
        val result = runtime.loadConfig()
        val body = result.fold(
            onSuccess = { "Native runtime config is present. API base: ${it.apiBaseUrl}" },
            onFailure = { it.message ?: "Native runtime config is missing." },
        )
        return featureCard(
            title = if (result.isSuccess) "Runtime ready" else "Runtime config needed",
            body = body,
        )
    }

    private fun statusCard(message: String): View {
        return featureCard("Backend status", message)
    }

    private fun executeApi(
        request: ApiRequestSpec,
        label: String,
        afterUiUpdate: () -> Unit,
    ) {
        lastApiStatus = "Loading $label..."
        apiGateway.executeCato(request) { result ->
            runOnUiThread {
                lastApiStatus = result.fold(
                    onSuccess = { response ->
                        if (response.isSuccessful) {
                            hydrateFromApi(label, response.body)
                        }
                        "$label responded ${response.statusCode}. ${response.body.take(120)}"
                    },
                    onFailure = { error ->
                        "$label failed: ${error.message ?: "Unknown error"}"
                    },
                )
                afterUiUpdate()
            }
        }
    }

    private fun executeApiOnSuccess(
        request: ApiRequestSpec,
        label: String,
        afterSuccess: () -> Unit,
    ) {
        lastApiStatus = "Loading $label..."
        apiGateway.executeCato(request) { result ->
            runOnUiThread {
                val success = result.getOrNull()?.isSuccessful == true
                lastApiStatus = result.fold(
                    onSuccess = { response ->
                        if (response.isSuccessful) {
                            hydrateFromApi(label, response.body)
                        }
                        "$label responded ${response.statusCode}. ${response.body.take(120)}"
                    },
                    onFailure = { error ->
                        "$label failed: ${error.message ?: "Unknown error"}"
                    },
                )
                if (success) {
                    afterSuccess()
                } else {
                    setContentView(if (selectedRole == CatoRole.RECRUITER) recruiterShell() else applicantShell())
                }
            }
        }
    }

    private fun hydrateFromApi(label: String, body: String) {
        when (label) {
            "applicant onboarding status" -> {
                val status = firstString(body, "onboardingStatus", "status")
                applicantOnboardingStatus = ApplicantOnboardingStatus.entries.firstOrNull { it.wireValue == status }
                    ?: applicantOnboardingStatus
            }
            "save onboarding education" -> {
                applicantOnboardingStatus = ApplicantOnboardingStatus.EDUCATION_COMPLETE
            }
            "skip resume" -> {
                applicantOnboardingStatus = ApplicantOnboardingStatus.RESUME_COMPLETE
            }
            "signal prompts" -> {
                val prompts = CatoAndroidJson.objectArray(body, "prompts")
                applicantPromptRows = prompts.mapIndexed { index, item ->
                    AndroidListRow(
                        id = firstString(item, "id", "_id", "promptId"),
                        title = firstString(item, "fieldLabel", "categoryLabel", "label").ifBlank { "Prompt ${index + 1}" },
                        subtitle = firstString(item, "text", "prompt").ifBlank { "Prompt available" },
                    )
                }
                if (applicantPromptRows.isNotEmpty()) {
                    if (selectedSignalPromptId.isBlank()) {
                        selectedSignalPromptId = applicantPromptRows.firstOrNull()?.id.orEmpty()
                    }
                } else {
                    selectedSignalPromptId = ""
                }
            }
            "select signal prompt" -> {
                applicantOnboardingStatus = ApplicantOnboardingStatus.SIGNAL_PROMPT_SELECTED
            }
            "mark deeper signal seen" -> {
                applicantOnboardingStatus = ApplicantOnboardingStatus.DEEPER_SIGNAL_SEEN
            }
            "skip deeper video" -> {
                applicantOnboardingStatus = ApplicantOnboardingStatus.DEEPER_VIDEO_SKIPPED
            }
            "complete onboarding profile" -> {
                applicantOnboardingStatus = ApplicantOnboardingStatus.ONBOARDING_COMPLETE
            }
            "prepare short take upload",
            "prepare deeper video upload",
            -> {
                lastApiStatus = "$label prepared. Finish native video upload from the media picker/recorder flow."
            }
            "recruiter dashboard" -> {
                val recruiterBody = CatoAndroidJson.objectValue(body, "recruiter") ?: body
                val metricsBody = CatoAndroidJson.objectValue(body, "metrics") ?: body
                recruiterName = CatoAndroidJson.stringValue(recruiterBody, "name") ?: recruiterName
                recruiterCompany = CatoAndroidJson.stringValue(recruiterBody, "companyName") ?: recruiterCompany
                recruiterEmail = CatoAndroidJson.stringValue(recruiterBody, "email") ?: recruiterEmail
                recruiterAccountId = firstString(recruiterBody, "id", "_id", "recruiterId").ifBlank { recruiterAccountId }
                recruiterPlan = CatoAndroidJson.stringValue(recruiterBody, "plan") ?: recruiterPlan
                recruiterCandidateCount = CatoAndroidJson.intValue(metricsBody, "candidates")?.toString() ?: recruiterCandidateCount
                recruiterBookmarkCount = CatoAndroidJson.intValue(metricsBody, "bookmarks")?.toString() ?: recruiterBookmarkCount
                recruiterMessageCount = CatoAndroidJson.intValue(metricsBody, "messages")?.toString() ?: recruiterMessageCount
                recruiterInterestRequestCount = CatoAndroidJson.intValue(metricsBody, "interestRequests")?.toString() ?: recruiterInterestRequestCount
            }
            "recruiter saved filters" -> {
                val filters = CatoAndroidJson.objectArray(body, "filters")
                    .ifEmpty { CatoAndroidJson.objectArray(body, "savedFilters") }
                    .ifEmpty { CatoAndroidJson.objectArray(body, "jobs") }
                recruiterQuickSearchRows = filters.mapIndexed { index, item ->
                    AndroidListRow(
                        id = firstString(item, "id", "_id", "jobId"),
                        title = firstString(item, "name", "title").ifBlank { "Quick Search ${index + 1}" },
                        subtitle = firstString(item, "summary", "description", "employmentType", "status").ifBlank { "Saved recruiter search" },
                        raw = item,
                    )
                }
            }
            "recruiter field options" -> {
                recruiterSearchFieldOptions = matchingOptionRows(body, MatchingOptionType.CATEGORY)
            }
            "recruiter skill options" -> {
                recruiterSearchSkillOptions = matchingOptionRows(body, MatchingOptionType.SKILL)
            }
            "add recruiter field option" -> {
                matchingOptionRow(body, MatchingOptionType.CATEGORY)?.let { option ->
                    recruiterSearchFieldOptions = (recruiterSearchFieldOptions + option).distinctBy { it.id }.sortedBy { it.title.lowercase() }
                    recruiterSearchCategories = recruiterSearchCategories.toggle(option.id)
                }
            }
            "add recruiter skill option" -> {
                matchingOptionRow(body, MatchingOptionType.SKILL)?.let { option ->
                    recruiterSearchSkillOptions = (recruiterSearchSkillOptions + option).distinctBy { it.id }.sortedBy { it.title.lowercase() }
                    if (recruiterSearchRequiredSkills.isEmpty()) {
                        recruiterSearchRequiredSkills = listOf(option.id.ifBlank { option.title })
                    } else {
                        recruiterSearchPreferredSkills = recruiterSearchPreferredSkills.toggle(option.id.ifBlank { option.title })
                    }
                }
            }
            "save recruiter search",
            "update recruiter search",
            -> {
                val jobBody = CatoAndroidJson.objectValue(body, "job") ?: body
                selectedRecruiterJobId = firstString(jobBody, "id", "_id", "jobId").ifBlank { selectedRecruiterJobId }
                recruiterSearchName = firstString(jobBody, "title", "name").ifBlank { recruiterSearchName }
                if (selectedRecruiterJobId.isNotBlank()) {
                    val row = AndroidListRow(
                        id = selectedRecruiterJobId,
                        title = recruiterSearchName,
                        subtitle = firstString(jobBody, "status", "employmentType", "roleCategory").ifBlank { "Saved recruiter search" },
                        raw = jobBody,
                    )
                    recruiterQuickSearchRows = (listOf(row) + recruiterQuickSearchRows.filterNot { it.id == row.id }).take(10)
                }
            }
            "recruiter interest requests" -> {
                val requests = CatoAndroidJson.objectArray(body, "requests")
                recruiterInterestRequestRows = requests.mapIndexed { index, item ->
                    val candidateId = firstString(item, "candidateId", "applicantId")
                    AndroidListRow(
                        id = firstString(item, "id", "_id", "requestId").ifBlank { candidateId },
                        title = firstString(item, "candidateName", "applicantName", "name").ifBlank { "Request ${index + 1}" },
                        subtitle = firstString(item, "message", "reason", "createdAt", "expiresAt").ifBlank { "Interest request" },
                        badge = firstString(item, "status").normalizedInterestStatus().ifBlank { "sent" },
                        applicantId = candidateId,
                        unread = item.contains("unread\":true") || item.contains("isUnread\":true"),
                    )
                }
                recruiterInterestRequestCount = recruiterInterestRequestRows.size.toString()
            }
            "applicant profile" -> {
                applicantId = firstString(body, "id", "_id", "applicantId").ifBlank { applicantId }
                applicantName = CatoAndroidJson.stringValue(body, "name") ?: applicantName
                applicantEmail = CatoAndroidJson.stringValue(body, "email") ?: applicantEmail
                applicantUniversityName = firstString(body, "universityName", "university").ifBlank { applicantUniversityName }
                applicantMajor = CatoAndroidJson.stringValue(body, "major") ?: applicantMajor
                applicantMinor = CatoAndroidJson.stringValue(body, "minor") ?: applicantMinor
                applicantSemesterLabel = CatoAndroidJson.stringValue(body, "semesterLabel") ?: applicantSemesterLabel
                applicantSemesterNumber = CatoAndroidJson.intValue(body, "semesterNumber") ?: applicantSemesterNumber
                applicantGpa = CatoAndroidJson.doubleValue(body, "gpa") ?: applicantGpa
                val projectCount = CatoAndroidJson.countArrayItems(body, "projects") ?: 0
                val internshipCount = CatoAndroidJson.countArrayItems(body, "internships") ?: 0
                val resumeBody = CatoAndroidJson.objectValue(body, "resume")
                val signalBody = CatoAndroidJson.objectValue(body, "signal")
                val softSkillsBody = CatoAndroidJson.objectValue(body, "softSkills")
                applicantSignalVideoRows = candidateVideoRowsFromObject(body, 0).map { row ->
                    row.copy(
                        title = when {
                            isIntroVideoSource(row.sourceType) -> "Intro video"
                            isDeeperVideoSource(row.sourceType) -> "Deeper signal"
                            else -> row.title
                        },
                        applicantId = row.applicantId.ifBlank { applicantId },
                    )
                }
                applicantHasResumeSignal = resumeBody?.let {
                    firstString(it, "secureUrl", "previewUrl").isNotBlank()
                } ?: false
                applicantHasIntroSignal = signalBody?.let {
                    CatoAndroidJson.objectValue(it, "tenSecondVideo") != null ||
                        firstString(it, "tenSecondVideoUrl", "introVideoUrl", "shortTakeVideoUrl").isNotBlank()
                } ?: false
                applicantHasDeeperSignal = signalBody?.let {
                    CatoAndroidJson.objectValue(it, "thirtySecondVideo") != null ||
                        firstString(it, "thirtySecondVideoUrl", "deeperVideoUrl", "deeperSignalVideoUrl").isNotBlank()
                } ?: false
                applicantHasSoftSkillSignal = softSkillsBody?.let {
                    (CatoAndroidJson.countArrayItems(it, "items") ?: 0) > 0
                } ?: false
                applicantProfileStrength = estimateProfileStrength(body, projectCount, internshipCount).toString()
                applicantProjectRows = rowsFromObjects(
                    objects = CatoAndroidJson.objectArray(body, "projects"),
                    fallbackTitle = "Project",
                    fallbackSubtitle = "Project evidence available",
                )
                applicantInternshipRows = rowsFromObjects(
                    objects = CatoAndroidJson.objectArray(body, "internships"),
                    fallbackTitle = "Internship",
                    fallbackSubtitle = "Internship evidence available",
                )
                applicantAccomplishmentRows = rowsFromObjects(
                    objects = CatoAndroidJson.objectArray(body, "accomplishments"),
                    fallbackTitle = "Accomplishment",
                    fallbackSubtitle = "Accomplishment evidence available",
                )
            }
            "applicant activity" -> {
                val metrics = CatoAndroidJson.objectValue(body, "metrics") ?: body
                applicantProfileViews = (CatoAndroidJson.intValue(metrics, "profileViews") ?: 0).toString()
                applicantBookmarkCount = (CatoAndroidJson.intValue(metrics, "bookmarks") ?: 0).toString()
                applicantShortlistCount = (CatoAndroidJson.intValue(metrics, "shortlists") ?: 0).toString()
                applicantActivityRows = rowsFromObjects(
                    objects = CatoAndroidJson.objectArray(body, "recent"),
                    fallbackTitle = "Activity",
                    fallbackSubtitle = "Recruiter visibility event",
                )
            }
            "create project",
            "update selected project",
            -> {
                rowFromBody(body, "project", "Project", "Project evidence available")?.let { row ->
                    applicantProjectRows = (listOf(row) + applicantProjectRows.filterNot { it.id == row.id }).distinctBy { it.id.ifBlank { it.title } }
                    if (applicantDetail == "reel-upload") {
                        addPendingReelEvidence(ApplicantVideoEvidenceLink("project", row.id))
                    }
                }
            }
            "create internship",
            "update selected internship",
            -> {
                rowFromBody(body, "internship", "Internship", "Internship evidence available")?.let { row ->
                    applicantInternshipRows = (listOf(row) + applicantInternshipRows.filterNot { it.id == row.id }).distinctBy { it.id.ifBlank { it.title } }
                    if (applicantDetail == "reel-upload") {
                        addPendingReelEvidence(ApplicantVideoEvidenceLink("internship", row.id))
                    }
                }
            }
            "create accomplishment" -> {
                rowFromBody(body, "accomplishment", "Accomplishment", "Accomplishment evidence available")?.let { row ->
                    applicantAccomplishmentRows = (listOf(row) + applicantAccomplishmentRows.filterNot { it.id == row.id }).distinctBy { it.id.ifBlank { it.title } }
                    if (applicantDetail == "reel-upload") {
                        addPendingReelEvidence(ApplicantVideoEvidenceLink("accomplishment", row.id))
                    }
                }
            }
            "applicant accomplishments" -> {
                applicantAccomplishmentRows = rowsFromObjects(
                    objects = CatoAndroidJson.objectArray(body, "accomplishments"),
                    fallbackTitle = "Accomplishment",
                    fallbackSubtitle = "Accomplishment evidence available",
                )
            }
            "applicant resume" -> {
                val resumeBody = CatoAndroidJson.objectValue(body, "resume")
                val resumeSource = resumeBody ?: body
                val parseStatus = firstString(body, "parseStatus").ifBlank { "none" }
                val fileName = firstString(resumeSource, "originalFileName")
                applicantResumeUrl = firstString(resumeSource, "secureUrl", "previewUrl")
                applicantResumeSummary = buildString {
                    append(
                        when (parseStatus) {
                            "ready" -> "Your resume has searchable text. Recruiter search can use it."
                            "needs_extraction" -> "Your resume is uploaded, but searchable text is not ready yet."
                            else -> "No searchable resume text exists yet."
                        },
                    )
                    if (fileName.isNotBlank()) append("\nFile: $fileName")
                    if (applicantResumeUrl.isBlank()) append("\nAdd manual matching fields so recruiter search can still find you.")
                }
            }
            "delete selected project" -> {
                applicantProjectRows = applicantProjectRows.filterNot { it.id == selectedProjectId }
                selectedProjectId = ""
            }
            "delete selected internship" -> {
                applicantInternshipRows = applicantInternshipRows.filterNot { it.id == selectedInternshipId }
                selectedInternshipId = ""
            }
            "load current setup" -> {
                val profileBody = CatoAndroidJson.objectValue(body, "profile")
                applicantManualProfileSummary = if (profileBody == null || profileBody == "null") {
                    "No manual matching profile is saved yet. Add fields, skills, and one fluency depth so recruiters can still find you when resume extraction is missing."
                } else {
                    val skillIds = CatoAndroidJson.stringArray(profileBody, "skillIds")
                    val fieldIds = CatoAndroidJson.stringArray(profileBody, "fieldIds")
                    if (skillIds.isNotEmpty()) {
                        applicantManualSelectedSkills = mergeSelectedManualRows(skillIds, applicantManualSkillOptions, "Skill")
                    }
                    if (fieldIds.isNotEmpty()) {
                        applicantManualSelectedFields = mergeSelectedManualRows(fieldIds, applicantManualFieldOptions, "Field")
                    }
                    val skillCount = skillIds.size
                    val fieldCount = fieldIds.size
                    val depth = CatoAndroidJson.objectValue(profileBody, "depth")
                    val depthType = depth?.let { CatoAndroidJson.stringValue(it, "type") }.orEmpty()
                    val depthId = depth?.let { CatoAndroidJson.stringValue(it, "id") }.orEmpty()
                    applicantManualDepthType = if (depthType == MatchingOptionType.CATEGORY.wireValue) MatchingOptionType.CATEGORY else MatchingOptionType.SKILL
                    applicantManualDepthId = depthId
                    val resolvedDepthType = if (depthType == MatchingOptionType.CATEGORY.wireValue) MatchingOptionType.CATEGORY else MatchingOptionType.SKILL
                    applicantManualMatchingSummary(fieldCount, skillCount, resolvedDepthType, depthId)
                }
            }
            "manual field options" -> {
                applicantManualFieldOptions = matchingOptionRows(body, MatchingOptionType.CATEGORY)
            }
            "manual skill options" -> {
                applicantManualSkillOptions = matchingOptionRows(body, MatchingOptionType.SKILL)
            }
            "add manual field option" -> {
                matchingOptionRow(body, MatchingOptionType.CATEGORY)?.let { option ->
                    applicantManualFieldOptions = (applicantManualFieldOptions + option).distinctBy { it.id }.sortedBy { it.title.lowercase() }
                    applicantManualSelectedFields = toggleManualOption(applicantManualSelectedFields, option, 10)
                    if (applicantManualDepthType == MatchingOptionType.CATEGORY && applicantManualDepthId.isBlank()) {
                        applicantManualDepthId = option.id
                    }
                }
            }
            "add manual skill option" -> {
                matchingOptionRow(body, MatchingOptionType.SKILL)?.let { option ->
                    applicantManualSkillOptions = (applicantManualSkillOptions + option).distinctBy { it.id }.sortedBy { it.title.lowercase() }
                    applicantManualSelectedSkills = toggleManualOption(applicantManualSelectedSkills, option, 100)
                    if (applicantManualDepthType == MatchingOptionType.SKILL && applicantManualDepthId.isBlank()) {
                        applicantManualDepthId = option.id
                    }
                }
            }
            "save manual matching" -> {
                val profileBody = CatoAndroidJson.objectValue(body, "profile")
                if (profileBody != null) {
                    val skillIds = CatoAndroidJson.stringArray(profileBody, "skillIds")
                    val fieldIds = CatoAndroidJson.stringArray(profileBody, "fieldIds")
                    if (skillIds.isNotEmpty()) {
                        applicantManualSelectedSkills = mergeSelectedManualRows(skillIds, applicantManualSkillOptions, "Skill")
                    }
                    if (fieldIds.isNotEmpty()) {
                        applicantManualSelectedFields = mergeSelectedManualRows(fieldIds, applicantManualFieldOptions, "Field")
                    }
                    val depth = CatoAndroidJson.objectValue(profileBody, "depth")
                    val depthType = depth?.let { CatoAndroidJson.stringValue(it, "type") }.orEmpty()
                    val depthId = depth?.let { CatoAndroidJson.stringValue(it, "id") }.orEmpty()
                    if (depthType.isNotBlank()) {
                        applicantManualDepthType = if (depthType == MatchingOptionType.CATEGORY.wireValue) MatchingOptionType.CATEGORY else MatchingOptionType.SKILL
                    }
                    if (depthId.isNotBlank()) {
                        applicantManualDepthId = depthId
                    }
                    applicantManualProfileSummary = applicantManualMatchingSummary(fieldIds.size, skillIds.size, applicantManualDepthType, applicantManualDepthId)
                } else {
                    applicantManualProfileSummary = applicantManualMatchingSummary(
                        applicantManualSelectedFields.size,
                        applicantManualSelectedSkills.size,
                        applicantManualDepthType,
                        applicantManualDepthId,
                    )
                }
            }
            "applicant reels" -> {
                val reels = CatoAndroidJson.objectArray(body, "reels")
                    .ifEmpty { CatoAndroidJson.objectArray(body, "videos") }
                applicantReelRows = reels.mapIndexed { index, item ->
                    val title = firstString(item, "caption", "title", "label").takeIf { it.isNotBlank() } ?: "Reel ${index + 1}"
                    val viewCount = CatoAndroidJson.intValue(item, "viewCount")
                        ?: CatoAndroidJson.intValue(item, "views")
                        ?: 0
                    val likeCount = CatoAndroidJson.intValue(item, "likeCount")
                        ?: CatoAndroidJson.intValue(item, "likes")
                        ?: 0
                    AndroidListRow(
                        id = firstString(item, "id", "_id", "videoId"),
                        title = title,
                        subtitle = firstString(item, "evidenceType", "sourceType", "createdAt").ifBlank { "Profile reel" },
                        badge = "$viewCount views - $likeCount likes",
                        sourceType = firstString(item, "evidenceType", "sourceType", "visibility").ifBlank { "profile_reel" },
                        mediaUrl = firstString(item, "optimizedVideoUrl", "videoUrl", "secureUrl"),
                        thumbnailUrl = firstString(item, "thumbnailUrl", "mediaThumbnailUrl", "posterUrl", "previewImageUrl"),
                        raw = item,
                    )
                }
                applicantReelCount = (
                    reels.size.takeIf { it > 0 }
                        ?: CatoAndroidJson.countArrayItems(body, "reels")
                        ?: CatoAndroidJson.countArrayItems(body, "videos")
                        ?: 0
                    ).toString()
            }
            "applicant public video feed" -> {
                val videos = CatoAndroidJson.objectArray(body, "videos")
                    .ifEmpty { CatoAndroidJson.objectArray(body, "reels") }
                val candidateObjects = CatoAndroidJson.objectArray(body, "candidates")
                    .ifEmpty { CatoAndroidJson.objectArray(body, "applicants") }
                    .ifEmpty { CatoAndroidJson.objectArray(body, "profiles") }
                applicantPublicFeedRows = (candidateObjects.flatMapIndexed { index, item -> candidateVideoRowsFromObject(item, index) } + videoRowsFromObjects(videos))
                    .distinctBy { row -> row.id.ifBlank { "${row.applicantId}:${row.sourceType}:${row.mediaUrl}" } }
            }
            "public applicant profile" -> {
                val profileBody = CatoAndroidJson.objectValue(body, "profile")
                    ?: CatoAndroidJson.objectValue(body, "applicant")
                    ?: body
                publicApplicantProfileName = firstString(profileBody, "name", "displayName", "applicantName").ifBlank { publicApplicantProfileName }
                val major = firstString(profileBody, "major")
                val university = firstString(profileBody, "universityName", "university")
                publicApplicantProfileSubtitle = listOf(major, university).filter { it.isNotBlank() }.joinToString(" - ")
                val videos = CatoAndroidJson.objectArray(body, "videos")
                    .ifEmpty { CatoAndroidJson.objectArray(body, "reels") }
                publicApplicantVideoRows = (candidateVideoRowsFromObject(profileBody, 0) + videoRowsFromObjects(videos, defaultApplicantId = selectedReelApplicantId))
                    .distinctBy { row -> row.id.ifBlank { "${row.applicantId}:${row.sourceType}:${row.mediaUrl}" } }
            }
            "recruiter messages" -> {
                recruiterUnreadMessageCount = CatoAndroidJson.intValue(body, "unreadCount") ?: recruiterUnreadMessageCount
                val messages = CatoAndroidJson.objectArray(body, "messages")
                val grouped = linkedMapOf<String, AndroidListRow>()
                messages.forEach { item ->
                    val candidateId = firstString(item, "candidateId", "applicantId")
                        .ifBlank { firstString(item, "id", "_id") }
                    if (candidateId.isBlank()) return@forEach
                    val unread = item.contains("isUnreadForViewer\":true") || item.contains("unread\":true")
                    val existing = grouped[candidateId]
                    if (existing == null) {
                        grouped[candidateId] = AndroidListRow(
                            id = candidateId,
                            applicantId = candidateId,
                            title = firstString(item, "candidateName", "applicantName", "name").ifBlank { "Applicant" },
                            subtitle = firstString(item, "body", "message", "latestMessage").ifBlank { "Message available" },
                            unread = unread,
                            raw = item,
                        )
                    } else if (unread && !existing.unread) {
                        grouped[candidateId] = existing.copy(unread = true)
                    }
                }
                recruiterMessageRows = grouped.values.toList()
                recruiterUnreadMessageCount = recruiterMessageRows.count { it.unread }
                recruiterMessageCount = recruiterMessageRows.size.toString()
            }
            "recruiter bookmarks" -> {
                recruiterBookmarkRows = candidateRowsFromBody(body, fallbackPrefix = "Bookmark")
                recruiterBookmarkCount = recruiterBookmarkRows.size.toString()
            }
            "recruiter evidence queue" -> {
                recruiterEvidenceRows = candidateRowsFromBody(body, fallbackPrefix = "Evidence candidate")
            }
            "recruiter shortlist" -> {
                recruiterShortlistRows = candidateRowsFromBody(body, fallbackPrefix = "Shortlisted candidate")
                recruiterComparisonDetailRows = recruiterComparisonDetailRows.filterKeys { selectedShortlistComparisonIds.contains(it) }
            }
            "candidate messages" -> {
                val messages = CatoAndroidJson.objectArray(body, "messages")
                selectedConversationRows = messages.mapIndexed { index, item ->
                    AndroidListRow(
                        id = firstString(item, "id", "_id"),
                        title = firstString(item, "senderRole", "role", "senderName").ifBlank { "Message ${index + 1}" },
                        subtitle = firstString(item, "body", "message", "text").ifBlank { "Message available" },
                        unread = item.contains("isUnreadForViewer\":true") || item.contains("unread\":true"),
                    )
                }
            }
            "contact candidate" -> {
                val message = CatoAndroidJson.objectValue(body, "message") ?: body
                val messageBody = firstString(message, "body", "message", "text").ifBlank { "Message sent" }
                selectedConversationRows = selectedConversationRows + AndroidListRow(
                    id = firstString(message, "id", "_id"),
                    title = firstString(message, "senderRole", "role", "senderName").ifBlank { "Recruiter" },
                    subtitle = messageBody,
                )
                if (selectedCandidateId.isNotBlank()) {
                    val threadRow = AndroidListRow(
                        id = selectedCandidateId,
                        title = selectedCandidateName.ifBlank { "Applicant" },
                        subtitle = messageBody,
                        unread = false,
                    )
                    recruiterMessageRows = listOf(threadRow) + recruiterMessageRows.filterNot { it.id == selectedCandidateId }
                    recruiterMessageCount = recruiterMessageRows.size.toString()
                    recruiterUnreadMessageCount = recruiterMessageRows.count { it.unread }
                }
            }
            "applicant conversation messages",
            "send applicant reply",
            -> {
                val messages = CatoAndroidJson.objectArray(body, "messages")
                if (messages.isNotEmpty()) {
                    selectedConversationRows = messages.mapIndexed { index, item ->
                        AndroidListRow(
                            id = firstString(item, "id", "_id"),
                            title = firstString(item, "senderRole", "role", "senderName").ifBlank { "Message ${index + 1}" },
                            subtitle = firstString(item, "body", "message", "text").ifBlank { "Message available" },
                            unread = item.contains("isUnreadForViewer\":true") || item.contains("unread\":true"),
                        )
                    }
                } else if (label == "send applicant reply" && body.contains("message")) {
                    val message = CatoAndroidJson.objectValue(body, "message") ?: body
                    selectedConversationRows = selectedConversationRows + AndroidListRow(
                        id = firstString(message, "id", "_id"),
                        title = firstString(message, "senderRole", "role", "senderName").ifBlank { "Applicant" },
                        subtitle = firstString(message, "body", "message", "text").ifBlank { "Message sent" },
                    )
                } else {
                    selectedConversationRows = emptyList()
                }
            }
            "recruiter video feed" -> {
                val videos = CatoAndroidJson.objectArray(body, "videos")
                    .ifEmpty { CatoAndroidJson.objectArray(body, "reels") }
                recruiterReelRows = videoRowsFromObjects(videos)
                recruiterReelIndex = if (recruiterReelRows.isEmpty()) 0 else recruiterReelIndex.coerceIn(0, recruiterReelRows.lastIndex)
            }
            "recruiter reel candidates" -> {
                val candidates = CatoAndroidJson.objectArray(body, "candidates")
                    .ifEmpty { CatoAndroidJson.objectArray(body, "results") }
                    .ifEmpty { CatoAndroidJson.objectArray(body, "matches") }
                mergeRecruiterCandidateClips(candidates)
                recruiterReelIndex = if (recruiterReelRows.isEmpty()) 0 else recruiterReelIndex.coerceIn(0, recruiterReelRows.lastIndex)
            }
            "candidate profile media" -> {
                val videos = CatoAndroidJson.objectArray(body, "videos")
                    .ifEmpty { CatoAndroidJson.objectArray(body, "reels") }
                selectedCandidateReelRows = videoRowsFromObjects(videos, defaultApplicantId = selectedCandidateId)
                val accomplishments = CatoAndroidJson.objectArray(body, "accomplishments")
                if (accomplishments.isNotEmpty()) {
                    selectedCandidateAccomplishmentRows = rowsFromObjects(
                        objects = accomplishments,
                        fallbackTitle = "Accomplishment",
                        fallbackSubtitle = "Accomplishment evidence available",
                    )
                }
            }
            "runtime match audit" -> {
                val auditBody = CatoAndroidJson.objectValue(body, "audit")
                    ?: CatoAndroidJson.objectValue(body, "score")
                    ?: body
                val scoreBody = CatoAndroidJson.objectValue(auditBody, "score") ?: auditBody
                val reasons = CatoAndroidJson.stringArray(scoreBody, "reasons")
                    .ifEmpty { CatoAndroidJson.stringArray(auditBody, "reasons") }
                val blockers = CatoAndroidJson.stringArray(scoreBody, "blockers")
                    .ifEmpty { CatoAndroidJson.stringArray(auditBody, "blockers") }
                val verificationNotes = CatoAndroidJson.stringArray(auditBody, "verificationNotes")
                val score = CatoAndroidJson.intValue(scoreBody, "totalScore")
                    ?: CatoAndroidJson.intValue(scoreBody, "matchScore")
                    ?: CatoAndroidJson.intValue(scoreBody, "score")
                    ?: CatoAndroidJson.intValue(auditBody, "totalScore")
                    ?: CatoAndroidJson.intValue(auditBody, "matchScore")
                    ?: CatoAndroidJson.intValue(auditBody, "score")
                if (score != null) {
                    selectedCandidateScore = "$score% match"
                }
                val rows = mutableListOf<AndroidListRow>()
                if (reasons.isNotEmpty()) {
                    rows += AndroidListRow(
                        title = "Why this match?",
                        subtitle = reasons.joinToString("\n"),
                    )
                }
                if (blockers.isNotEmpty()) {
                    rows += AndroidListRow(
                        title = "Weak or missing signals",
                        subtitle = blockers.joinToString("\n"),
                    )
                }
                if (verificationNotes.isNotEmpty()) {
                    rows += AndroidListRow(
                        title = "How this was checked",
                        subtitle = verificationNotes.joinToString("\n"),
                    )
                }
                if (rows.isEmpty()) {
                    rows += AndroidListRow(
                        title = "Why this match?",
                        subtitle = "Audit response was received, but no readable reasons were returned.",
                    )
                }
                selectedCandidateEvidenceRows = rows
            }
            "candidate detail" -> {
                selectedCandidateName = firstString(body, "displayName", "candidateName", "name").ifBlank { selectedCandidateName }
                selectedCandidateAvatarUrl = firstString(body, "avatarUrl", "photoUrl", "profileImageUrl", "imageUrl").ifBlank { selectedCandidateAvatarUrl }
                val major = firstString(body, "major")
                val university = firstString(body, "universityName")
                selectedCandidateSubtitle = listOf(major, university).filter { it.isNotBlank() }.joinToString(" - ").ifBlank { selectedCandidateSubtitle }
                selectedCandidateSemesterLabel = firstString(body, "semesterLabel")
                selectedCandidateGpa = CatoAndroidJson.doubleValue(body, "gpa")?.let { String.format("%.2f", it) }
                    ?: firstString(body, "gpa", "gradePointAverage")
                selectedCandidateSignalSummary = firstString(body, "signalSummary", "summary").ifBlank { selectedCandidateSignalSummary }
                val score = CatoAndroidJson.intValue(body, "matchScore")
                    ?: CatoAndroidJson.intValue(body, "totalScore")
                    ?: CatoAndroidJson.intValue(body, "score")
                selectedCandidateScore = score?.let { "$it% match" } ?: selectedCandidateScore
                selectedCandidateProfileStrength = (
                    CatoAndroidJson.intValue(body, "profileStrength")
                        ?: CatoAndroidJson.intValue(body, "profileCompleteness")
                        ?: CatoAndroidJson.intValue(body, "profileScore")
                    )?.let { "$it%" }.orEmpty()
                val reviewBody = CatoAndroidJson.objectValue(body, "review")
                selectedCandidateReviewStatus = RecruiterReviewStatus.fromWireValue(
                    reviewBody?.let { firstString(it, "status", "reviewStatus") }
                        ?: firstString(body, "reviewStatus", "status"),
                ).takeIf { it != RecruiterReviewStatus.NONE } ?: selectedCandidateReviewStatus
                selectedCandidateBookmarked = CatoAndroidJson.booleanValue(body, "bookmarked") ?: selectedCandidateBookmarked
                selectedCandidateInterestStatus = firstString(body, "interestRequestStatus", "requestStatus")
                    .normalizedInterestStatus()
                    .ifBlank { selectedCandidateInterestStatus }
                val resumeBody = CatoAndroidJson.objectValue(body, "resume")
                selectedCandidateResumeUrl = resumeBody?.let { firstString(it, "previewUrl", "secureUrl", "resumeUrl") }
                    ?: firstString(body, "resumePreviewUrl", "resumeUrl")
                selectedCandidateResume = if (selectedCandidateResumeUrl.isNotBlank()) {
                    "Resume is available. Tap to open."
                } else {
                    "Resume is not available for this candidate."
                }
                val detailEvidenceRows = rowsFromObjects(
                    objects = CatoAndroidJson.objectArray(body, "matchEvidence")
                        .ifEmpty { CatoAndroidJson.objectArray(body, "reasons") },
                    fallbackTitle = "Match evidence",
                    fallbackSubtitle = "Evidence available",
                )
                if (detailEvidenceRows.isNotEmpty()) {
                    selectedCandidateEvidenceRows = detailEvidenceRows
                }
                selectedCandidateProjectRows = rowsFromObjects(
                    objects = CatoAndroidJson.objectArray(body, "projects"),
                    fallbackTitle = "Project",
                    fallbackSubtitle = "Project evidence available",
                )
                selectedCandidateInternshipRows = rowsFromObjects(
                    objects = CatoAndroidJson.objectArray(body, "internships"),
                    fallbackTitle = "Internship",
                    fallbackSubtitle = "Internship evidence available",
                )
                selectedCandidateAccomplishmentRows = rowsFromObjects(
                    objects = CatoAndroidJson.objectArray(body, "accomplishments"),
                    fallbackTitle = "Accomplishment",
                    fallbackSubtitle = "Accomplishment evidence available",
                )
                selectedCandidateSoftSkillRows = softSkillRowsFromObjects(CatoAndroidJson.objectArray(body, "softSkills"))
                val mediaRows = videoRowsFromObjects(
                    objects = CatoAndroidJson.objectArray(body, "videos")
                        .ifEmpty { CatoAndroidJson.objectArray(body, "reels") },
                    defaultApplicantId = selectedCandidateId,
                )
                selectedCandidateReelRows = mediaRows
            }
            "runtime search" -> {
                val results = CatoAndroidJson.objectArray(body, "results")
                    .ifEmpty { CatoAndroidJson.objectArray(body, "matches") }
                    .ifEmpty { CatoAndroidJson.objectArray(body, "candidates") }
                recruiterSearchRows = results.mapIndexed { index, item ->
                    val applicantBody = CatoAndroidJson.objectValue(item, "applicant") ?: item
                    val scoreBody = CatoAndroidJson.objectValue(item, "score") ?: item
                    val score = CatoAndroidJson.intValue(scoreBody, "totalScore")
                        ?: CatoAndroidJson.intValue(scoreBody, "score")
                        ?: CatoAndroidJson.intValue(scoreBody, "matchScore")
                    AndroidListRow(
                        id = firstString(item, "applicantId", "candidateId")
                            .ifBlank { firstString(applicantBody, "id", "_id", "applicantId", "candidateId") },
                        title = firstString(applicantBody, "displayName", "candidateName", "applicantName", "name").ifBlank { "Candidate ${index + 1}" },
                        subtitle = firstString(applicantBody, "educationLine", "major", "universityName").ifBlank { "Matched candidate" },
                        badge = score?.let { "$it% runtime match" } ?: "Runtime match",
                        applicantId = firstString(item, "applicantId", "candidateId")
                            .ifBlank { firstString(applicantBody, "id", "_id", "applicantId", "candidateId") },
                        raw = item,
                    )
                }
            }
            "applicant requests" -> {
                val requests = CatoAndroidJson.objectArray(body, "requests")
                applicantRequestRows = requests.map {
                    AndroidListRow(
                        id = firstString(it, "id", "_id", "requestId"),
                        title = firstString(it, "companyName", "recruiterName", "name").ifBlank { "Recruiter request" },
                        subtitle = firstString(it, "message", "reason", "status").ifBlank { "Interest request available" },
                        badge = firstString(it, "status").normalizedInterestStatus().ifBlank { "sent" },
                        unread = it.contains("unread\":true") || it.contains("isUnread\":true"),
                    )
                }
                applicantUnreadRequestCount = applicantRequestRows.count { it.unread }
            }
        }
    }

    private fun rowsFromObjects(
        objects: List<String>,
        fallbackTitle: String,
        fallbackSubtitle: String,
    ): List<AndroidListRow> {
        return objects.mapIndexed { index, item ->
            AndroidListRow(
                id = firstString(item, "id", "_id"),
                title = firstString(item, "title", "name", "label", "role", "company", "companyName").ifBlank { "$fallbackTitle ${index + 1}" },
                subtitle = firstString(item, "body", "description", "evidence", "summary", "roleDepartment", "companyName", "secureUrl").ifBlank { fallbackSubtitle },
                raw = item,
            )
        }
    }

    private fun softSkillRowsFromObjects(objects: List<String>): List<AndroidListRow> {
        return objects.mapIndexed { index, item ->
            val rating = CatoAndroidJson.doubleValue(item, "rating")
                ?: CatoAndroidJson.doubleValue(item, "score")
            AndroidListRow(
                id = firstString(item, "id", "_id"),
                title = firstString(item, "label", "name", "title").ifBlank { "Soft signal ${index + 1}" },
                subtitle = rating?.let { String.format("%.1f", it) }.orEmpty(),
                raw = item,
            )
        }
    }

    private fun rowFromBody(body: String, key: String, fallbackTitle: String, fallbackSubtitle: String): AndroidListRow? {
        val item = CatoAndroidJson.objectValue(body, key)
            ?: CatoAndroidJson.objectValue(body, "data")
            ?: body.takeIf { it.trimStart().startsWith("{") }
            ?: return null
        val row = rowsFromObjects(listOf(item), fallbackTitle, fallbackSubtitle).firstOrNull() ?: return null
        return row.takeIf { it.id.isNotBlank() || it.title.isNotBlank() }
    }

    private fun candidateRowsFromBody(body: String, fallbackPrefix: String): List<AndroidListRow> {
        val objects = CatoAndroidJson.objectArray(body, "candidates")
            .ifEmpty { CatoAndroidJson.objectArray(body, "results") }
            .ifEmpty { CatoAndroidJson.objectArray(body, "matches") }
            .ifEmpty { CatoAndroidJson.objectArray(body, "bookmarks") }
            .ifEmpty { CatoAndroidJson.objectArray(body, "queue") }
        return objects.mapIndexed { index, item ->
            val score = CatoAndroidJson.intValue(item, "totalScore")
                ?: CatoAndroidJson.intValue(item, "score")
                ?: CatoAndroidJson.intValue(item, "matchScore")
            AndroidListRow(
                id = firstString(item, "applicantId", "candidateId", "id", "_id"),
                title = firstString(item, "displayName", "candidateName", "applicantName", "name").ifBlank { "$fallbackPrefix ${index + 1}" },
                subtitle = firstString(item, "educationLine", "major", "universityName", "evidence", "summary").ifBlank { "Candidate available" },
                badge = score?.let { "$it% runtime match" }
                    ?: firstString(item, "reviewStatus", "status").ifBlank { "Candidate" },
                applicantId = firstString(item, "applicantId", "candidateId"),
                raw = item,
            )
        }
    }

    private fun videoRowsFromObjects(
        objects: List<String>,
        defaultApplicantId: String = "",
    ): List<AndroidListRow> {
        return objects.mapIndexed { index, item ->
            val caption = firstString(item, "caption", "title", "label")
            val applicantName = firstString(item, "applicantName", "candidateName", "name")
            val evidenceType = firstString(item, "evidenceType", "sourceType", "visibility")
            val views = CatoAndroidJson.intValue(item, "viewCount") ?: 0
            val likes = CatoAndroidJson.intValue(item, "likeCount") ?: 0
            AndroidListRow(
                id = firstString(item, "id", "_id", "videoId"),
                title = caption.ifBlank { applicantName.ifBlank { "Video ${index + 1}" } },
                subtitle = listOf(applicantName, evidenceType).filter { it.isNotBlank() }.joinToString(" - ").ifBlank { "Profile video" },
                badge = "$views views - $likes likes",
                applicantId = firstString(item, "applicantId", "candidateId").ifBlank { defaultApplicantId },
                applicantName = applicantName,
                sourceType = evidenceType.ifBlank { "profile_reel" },
                mediaUrl = firstString(item, "optimizedVideoUrl", "videoUrl", "secureUrl", "mediaUrl"),
                thumbnailUrl = firstString(item, "thumbnailUrl", "mediaThumbnailUrl", "posterUrl", "previewImageUrl"),
                raw = item,
            )
        }
    }

    private fun mergeRecruiterCandidateClips(candidateObjects: List<String>) {
        val candidateClips = candidateObjects.flatMapIndexed { index, item ->
            candidateVideoRowsFromObject(item, index)
        }
        if (candidateClips.isEmpty()) return
        recruiterReelRows = (candidateClips + recruiterReelRows)
            .distinctBy { row -> row.id.ifBlank { "${row.applicantId}:${row.sourceType}:${row.mediaUrl}" } }
    }

    private fun candidateVideoRowsFromObject(item: String, index: Int): List<AndroidListRow> {
        val applicantId = firstString(item, "applicantId", "candidateId", "id", "_id")
        val applicantName = firstString(item, "displayName", "candidateName", "applicantName", "name").ifBlank { "Candidate ${index + 1}" }
        val subtitle = firstString(item, "educationLine", "major", "universityName", "signalSummary").ifBlank { "Candidate intro" }
        val signalSummary = firstString(item, "signalSummary", "summary").ifBlank { subtitle }
        val introUrl = signalVideoUrl(item, "tenSecondVideo", "tenSecondVideoUrl", "introVideoUrl", "shortTakeVideoUrl")
        val deeperUrl = signalVideoUrl(item, "thirtySecondVideo", "thirtySecondVideoUrl", "deeperVideoUrl", "deeperSignalVideoUrl")
        val introThumbnailUrl = signalVideoThumbnailUrl(item, "tenSecondVideo", "tenSecondThumbnailUrl", "introThumbnailUrl", "shortTakeThumbnailUrl")
        val deeperThumbnailUrl = signalVideoThumbnailUrl(item, "thirtySecondVideo", "thirtySecondThumbnailUrl", "deeperThumbnailUrl", "deeperSignalThumbnailUrl")
        val stableId = applicantId.ifBlank { index.toString() }
        return buildList {
            if (introUrl.isNotBlank()) {
                add(
                    AndroidListRow(
                        id = "intro-$stableId",
                        title = applicantName,
                        subtitle = signalSummary,
                        badge = "Intro video",
                        applicantId = applicantId,
                        applicantName = applicantName,
                        sourceType = "intro_video",
                        mediaUrl = introUrl,
                        thumbnailUrl = introThumbnailUrl,
                    ),
                )
            }
            if (deeperUrl.isNotBlank()) {
                add(
                    AndroidListRow(
                        id = "deeper-$stableId",
                        title = "$applicantName deeper signal",
                        subtitle = signalSummary,
                        badge = "Deeper signal",
                        applicantId = applicantId,
                        applicantName = applicantName,
                        sourceType = "deeper_signal",
                        mediaUrl = deeperUrl,
                        thumbnailUrl = deeperThumbnailUrl,
                    ),
                )
            }
        }
    }

    private fun signalVideoUrl(item: String, objectKey: String, vararg directKeys: String): String {
        directKeys.forEach { key ->
            firstString(item, key).takeIf { it.isNotBlank() }?.let { return it }
        }
        val nested = CatoAndroidJson.objectValue(item, objectKey)
            ?: CatoAndroidJson.objectValue(CatoAndroidJson.objectValue(item, "signal") ?: "", objectKey)
            ?: return ""
        return firstString(nested, "optimizedVideoUrl", "videoUrl", "secureUrl", "mediaUrl", "previewUrl")
    }

    private fun signalVideoThumbnailUrl(item: String, objectKey: String, vararg directKeys: String): String {
        directKeys.forEach { key ->
            firstString(item, key).takeIf { it.isNotBlank() }?.let { return it }
        }
        val nested = CatoAndroidJson.objectValue(item, objectKey)
            ?: CatoAndroidJson.objectValue(CatoAndroidJson.objectValue(item, "signal") ?: "", objectKey)
            ?: return ""
        return firstString(nested, "thumbnailUrl", "mediaThumbnailUrl", "posterUrl", "previewImageUrl")
    }

    private fun matchingOptionRows(body: String, type: MatchingOptionType): List<AndroidListRow> {
        val options = CatoAndroidJson.objectArray(body, "options")
            .ifEmpty { if (body.trimStart().startsWith("[")) CatoAndroidJson.objectArray(body, "options") else emptyList() }
        val objects = options.ifEmpty { CatoAndroidJson.objectArray(body, "data") }
        return objects.mapNotNull { item ->
            val id = firstString(item, "key", "id", "_id")
            val label = firstString(item, "label", "name", "title").ifBlank { id }
            if (id.isBlank() || label.isBlank()) {
                null
            } else {
                AndroidListRow(
                    id = id,
                    title = label,
                    subtitle = type.wireValue,
                )
            }
        }.distinctBy { it.id }.sortedBy { it.title.lowercase() }
    }

    private fun matchingOptionRow(body: String, type: MatchingOptionType): AndroidListRow? {
        val item = CatoAndroidJson.objectValue(body, "option") ?: body
        val id = firstString(item, "key", "id", "_id")
        val label = firstString(item, "label", "name", "title").ifBlank { id }
        return if (id.isBlank() || label.isBlank()) {
            null
        } else {
            AndroidListRow(id = id, title = label, subtitle = type.wireValue)
        }
    }

    private fun mergeSelectedManualRows(
        ids: List<String>,
        options: List<AndroidListRow>,
        fallbackSubtitle: String,
    ): List<AndroidListRow> {
        return ids.distinct().map { id ->
            options.firstOrNull { it.id == id }
                ?: AndroidListRow(id = id, title = id, subtitle = fallbackSubtitle)
        }.sortedBy { it.title.lowercase() }
    }

    private fun firstString(body: String, vararg keys: String): String {
        for (key in keys) {
            val value = CatoAndroidJson.stringValue(body, key)
            if (!value.isNullOrBlank()) return value
        }
        return ""
    }

    private fun reviewStatusLabel(status: RecruiterReviewStatus): String {
        return when (status) {
            RecruiterReviewStatus.PASSED -> "Passed"
            RecruiterReviewStatus.SHORTLISTED -> "Shortlisted"
            RecruiterReviewStatus.MAYBE,
            RecruiterReviewStatus.NONE,
            -> "Maybe"
        }
    }

    private fun reviewStatusFromText(value: String): RecruiterReviewStatus {
        val normalized = value.lowercase()
        return when {
            "shortlist" in normalized -> RecruiterReviewStatus.SHORTLISTED
            "pass" in normalized -> RecruiterReviewStatus.PASSED
            "maybe" in normalized -> RecruiterReviewStatus.MAYBE
            else -> selectedCandidateReviewStatus
        }
    }

    private fun String.withReviewStatus(statusLabel: String): String {
        val base = split(" • ").filterNot { part ->
            val normalized = part.lowercase()
            normalized == "passed" || normalized == "shortlisted" || normalized == "maybe"
        }.joinToString(" • ").ifBlank { "Runtime match" }
        return "$base • $statusLabel"
    }

    private fun String.normalizedInterestStatus(): String {
        val normalized = trim().lowercase().replace("-", "_").replace(" ", "_")
        return when (normalized) {
            "pending",
            "sent",
            "viewed",
            "unread",
            "new",
            -> "sent"
            "accept",
            "accepted",
            "approved",
            -> "accepted"
            "decline",
            "declined",
            "rejected",
            -> "declined"
            "expire",
            "expired",
            -> "expired"
            else -> normalized
        }
    }

    private fun String.isPendingInterestStatus(): Boolean {
        return normalizedInterestStatus() in setOf("sent", "viewed")
    }

    private fun interestCandidateId(): String {
        return if (recruiterDetail == "reel-viewer") {
            selectedReelApplicantId.ifBlank { selectedCandidateId }
        } else {
            selectedCandidateId
        }
    }

    private fun requireCandidateId(actionLabel: String, candidateId: String = selectedCandidateId): Boolean {
        if (candidateId.isBlank()) {
            lastApiStatus = "Select a candidate before $actionLabel."
            setContentView(recruiterShell())
            return false
        }
        return true
    }

    private fun requireRequestId(actionLabel: String): Boolean {
        if (selectedRequestId.isBlank()) {
            lastApiStatus = "Select a request before $actionLabel."
            setContentView(applicantShell())
            return false
        }
        return true
    }

    private fun requireReelId(actionLabel: String): Boolean {
        if (selectedReelId.isBlank()) {
            lastApiStatus = "Select a reel before $actionLabel."
            setContentView(applicantShell())
            return false
        }
        return true
    }

    private fun estimateProfileStrength(body: String, projectCount: Int, internshipCount: Int): Int {
        var score = 0
        if (body.contains("secureUrl") || body.contains("previewUrl")) score += 18
        if (body.contains("tenSecondVideo")) score += 18
        if (body.contains("thirtySecondVideo")) score += 17
        if (body.contains("softSkills")) score += 17
        score += when (projectCount) {
            0 -> 0
            1 -> 10
            2 -> 17
            else -> 20
        }
        if (internshipCount > 0) score += 10
        return score.coerceAtMost(100)
    }

    private fun metricRow(vararg items: Pair<String, String>): View {
        return horizontal(spacing = 10) {
            items.forEach { (title, value) ->
                addView(
                    vertical(spacing = 4) {
                        gravity = Gravity.CENTER
                        setPadding(dp(10), dp(14), dp(10), dp(14))
                        background = CatoAndroidDrawable.rounded(colors.surface, dp(18), colors.border)
                        addView(label(value, 24, colors.accent, bold = true))
                        addView(label(title, 12, colors.textSecondary))
                    },
                    LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f),
                )
            }
        }
    }

    private fun input(hint: String, value: String = ""): EditText {
        return EditText(this).apply {
            this.hint = hint
            if (value.isNotBlank()) setText(value)
            setHintTextColor(colors.textSecondary)
            setTextColor(colors.textPrimary)
            textSize = 16f
            setSingleLine(true)
            minHeight = dp(54)
            setPadding(dp(16), dp(12), dp(16), dp(12))
            background = CatoAndroidDrawable.rounded(colors.surface, dp(16), colors.border)
        }
    }

    private fun EditText.onKeyboardSearch(onSearch: (String) -> Unit) {
        imeOptions = EditorInfo.IME_ACTION_SEARCH
        setOnEditorActionListener { view, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEARCH || actionId == EditorInfo.IME_ACTION_DONE) {
                onSearch(view.text?.toString()?.trim().orEmpty())
                true
            } else {
                false
            }
        }
    }

    private fun EditText.onTextChanged(onChanged: (String) -> Unit) {
        addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(text: CharSequence?, start: Int, count: Int, after: Int) = Unit

            override fun onTextChanged(text: CharSequence?, start: Int, before: Int, count: Int) {
                onChanged(text?.toString().orEmpty())
            }

            override fun afterTextChanged(text: Editable?) = Unit
        })
    }

    private fun EditText.keepSearchResultsVisible(scrollView: ScrollView, resultsView: View) {
        setOnFocusChangeListener { _, hasFocus ->
            if (!hasFocus) return@setOnFocusChangeListener
            postDelayed({
                val inputRect = Rect()
                getDrawingRect(inputRect)
                scrollView.offsetDescendantRectToMyCoords(this, inputRect)
                val resultsRect = Rect()
                resultsView.getDrawingRect(resultsRect)
                scrollView.offsetDescendantRectToMyCoords(resultsView, resultsRect)
                val targetTop = minOf(inputRect.top, resultsRect.top).coerceAtLeast(0)
                scrollView.smoothScrollTo(0, (targetTop - dp(72)).coerceAtLeast(0))
            }, 260)
        }
    }

    private fun EditText.installTrailingClearButton(onClear: () -> Unit) {
        fun updateClearIcon() {
            val icon = if (text?.isNotEmpty() == true) android.R.drawable.ic_menu_close_clear_cancel else 0
            setCompoundDrawablesWithIntrinsicBounds(0, 0, icon, 0)
            compoundDrawablePadding = dp(8)
        }
        updateClearIcon()
        addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(text: CharSequence?, start: Int, count: Int, after: Int) = Unit
            override fun onTextChanged(text: CharSequence?, start: Int, before: Int, count: Int) {
                updateClearIcon()
            }
            override fun afterTextChanged(text: Editable?) = Unit
        })
        setOnTouchListener { view, event ->
            if (event.action == MotionEvent.ACTION_UP && compoundDrawables[2] != null) {
                val clearStart = width - paddingRight - compoundDrawables[2].bounds.width() - dp(12)
                if (event.x >= clearStart) {
                    setText("")
                    onClear()
                    view.performClick()
                    return@setOnTouchListener true
                }
            }
            false
        }
    }

    private fun primaryButton(title: String, onClick: () -> Unit): Button {
        return Button(this).apply {
            text = title
            isAllCaps = false
            textSize = 16f
            minHeight = dp(54)
            setTextColor(colors.onAccent)
            background = CatoAndroidDrawable.rounded(colors.accent, dp(16), colors.accent)
            setOnClickListener { onClick() }
        }
    }

    private fun secondaryButton(title: String, onClick: () -> Unit): Button {
        return Button(this).apply {
            text = title
            isAllCaps = false
            textSize = 16f
            minHeight = dp(54)
            setTextColor(colors.textPrimary)
            background = CatoAndroidDrawable.rounded(colors.surface, dp(16), colors.border)
            setOnClickListener { onClick() }
        }
    }

    private fun compactBackButton(onClick: () -> Unit): Button {
        return Button(this).apply {
            text = "‹"
            isAllCaps = false
            textSize = 28f
            minWidth = 0
            minHeight = 0
            minimumWidth = 0
            minimumHeight = 0
            includeFontPadding = false
            setPadding(0, 0, 0, dp(3))
            setTextColor(colors.textPrimary)
            background = CatoAndroidDrawable.rounded(colors.surface, dp(14), colors.border)
            setOnClickListener { onClick() }
        }
    }

    private fun label(title: String, size: Int, color: Int, bold: Boolean = false): TextView {
        return text.label(this, title, size, color, bold)
    }

    private fun frame(block: FrameLayout.() -> Unit): FrameLayout {
        return FrameLayout(this).apply {
            setBackgroundColor(colors.background)
            isClickable = true
            setOnClickListener { hideKeyboard() }
            block()
        }
    }

    private fun vertical(spacing: Int = 0, block: LinearLayout.() -> Unit): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            showDividers = if (spacing > 0) LinearLayout.SHOW_DIVIDER_MIDDLE else 0
            dividerDrawable = CatoAndroidDrawable.spacer(dp(spacing), vertical = true)
            block()
        }
    }

    private fun horizontal(spacing: Int = 0, block: LinearLayout.() -> Unit): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            showDividers = if (spacing > 0) LinearLayout.SHOW_DIVIDER_MIDDLE else 0
            dividerDrawable = CatoAndroidDrawable.spacer(dp(spacing), vertical = false)
            block()
        }
    }

    private fun horizontalScroller(block: LinearLayout.() -> Unit): HorizontalScrollView {
        return HorizontalScrollView(this).apply {
            isHorizontalScrollBarEnabled = false
            addView(
                horizontal(spacing = 10) {
                    setPadding(0, 0, dp(6), 0)
                    block()
                },
                ViewGroup.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT),
            )
        }
    }

    private fun scroll(block: ScrollView.() -> Unit): ScrollView {
        return ScrollView(this).apply {
            setBackgroundColor(colors.background)
            isClickable = true
            setOnClickListener { hideKeyboard() }
            block()
        }
    }

    private fun hideKeyboard() {
        val focusedView = currentFocus ?: return
        val inputManager = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        inputManager.hideSoftInputFromWindow(focusedView.windowToken, 0)
        focusedView.clearFocus()
    }

    private fun openUrl(url: String, missingMessage: String) {
        if (url.isBlank()) {
            lastApiStatus = missingMessage
            setContentView(if (selectedRole == CatoRole.RECRUITER) recruiterShell() else applicantShell())
            return
        }
        runCatching {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        }.onFailure { error ->
            lastApiStatus = "Could not open link: ${error.message ?: "Unknown error"}"
            setContentView(if (selectedRole == CatoRole.RECRUITER) recruiterShell() else applicantShell())
        }
    }

    private fun openResumePreview(url: String, title: String, isRecruiter: Boolean) {
        if (url.isBlank()) {
            lastApiStatus = "Resume URL is not available yet."
            setContentView(if (isRecruiter) recruiterShell() else applicantShell())
            return
        }
        resumePreviewUrl = url
        resumePreviewTitle = title.ifBlank { "Resume" }
        if (isRecruiter) {
            resumePreviewReturnDetail = recruiterDetail ?: "candidate-profile"
            recruiterDetail = "resume-preview"
            setContentView(recruiterShell())
        } else {
            resumePreviewReturnDetail = applicantDetail
            applicantDetail = "resume-preview"
            setContentView(applicantShell())
        }
    }

    private fun resumePreviewScreen(isRecruiter: Boolean): View {
        return vertical(spacing = 12) {
            setPadding(dp(22), dp(28), dp(22), dp(22))
            addView(horizontal(spacing = 10) {
                addView(compactBackButton {
                    if (isRecruiter) {
                        recruiterDetail = resumePreviewReturnDetail ?: "candidate-profile"
                        resumePreviewReturnDetail = null
                        setContentView(recruiterShell())
                    } else {
                        applicantDetail = resumePreviewReturnDetail
                        resumePreviewReturnDetail = null
                        selectedApplicantTab = ApplicantTab.PROFILE
                        setContentView(applicantShell())
                    }
                })
                addView(label(resumePreviewTitle, 24, colors.textPrimary, bold = true))
            })
            if (resumePreviewUrl.isBlank()) {
                addView(featureCard("Resume unavailable", "The resume link is missing."))
            } else {
                addView(WebView(this@MainActivity).apply {
                    webViewClient = WebViewClient()
                    settings.javaScriptEnabled = false
                    loadUrl(resumePreviewUrl)
                }, LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f))
                addView(secondaryButton("Open externally") {
                    openUrl(resumePreviewUrl, "Resume URL is not available yet.")
                })
            }
        }
    }

    private fun centeredParams() = FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.WRAP_CONTENT,
        ViewGroup.LayoutParams.WRAP_CONTENT,
        Gravity.CENTER,
    )

    private fun matchFrameParams() = FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
    )

    private fun centerMatchFrameParams() = FrameLayout.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT,
        Gravity.CENTER,
    )

    private fun matchWrapParams() = ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.WRAP_CONTENT,
    )

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    companion object {
        private const val GOOGLE_REDIRECT_URI = "cato://auth/callback"
        private const val KEY_GOOGLE_CODE_VERIFIER = "google_code_verifier"
        private const val KEY_GOOGLE_ROLE = "google_role"
        private const val REQUEST_PICK_RESUME = 41
        private const val REQUEST_PICK_SIGNAL_VIDEO = 42
        private const val REQUEST_PICK_REEL_VIDEO = 43
        private const val REQUEST_RECORD_SIGNAL_VIDEO = 44
        private const val REQUEST_RECORD_REEL_VIDEO = 45
        private const val REQUEST_GOOGLE_SIGN_IN = 46
        private const val MAX_RESUME_BYTES = 10 * 1024 * 1024
        private const val MAX_SIGNAL_VIDEO_BYTES = 120 * 1024 * 1024
        private const val MAX_REEL_VIDEO_BYTES = 120 * 1024 * 1024
        private val PDF_STREAM_REGEX = Regex("stream\\r?\\n(.*?)\\r?\\nendstream", setOf(RegexOption.DOT_MATCHES_ALL))
        private val PDF_LITERAL_STRING_REGEX = Regex("""\((?:\\.|[^\\)])*\)""")
        private val PDF_HEX_STRING_REGEX = Regex("""<([0-9A-Fa-f\s]{6,})>""")
    }
}
