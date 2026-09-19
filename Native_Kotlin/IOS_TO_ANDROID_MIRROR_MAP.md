# iOS to Android Mirror Map

This file maps the completed native Swift implementation to the local Kotlin contracts added under `Native_Kotlin/src/main/kotlin/com/cato/app`.

The current work is intentionally dependency-free because this environment does not have a local Android app module, Gradle wrapper, or installed Android UI dependencies. These files are the Android-side contract/state/use-case layer that Compose screens can bind to once the Android app module is available locally.

## Core

| Swift source | Kotlin mirror |
| --- | --- |
| `RootView.swift` | `state/AuthState.kt`, `state/CatoNavigation.kt`, `ui/ScreenSpecs.kt` root destination specs |
| `CatoNativeCore/CatoModels.swift` | `core/CatoModels.kt` |
| `Auth/CatoAPIClient.swift` | `core/CatoApiRoutes.kt`, `core/CatoApiContract.kt` |
| `Auth/SupabaseAuthClient.swift` | `core/SupabaseAuthContract.kt` |
| `Auth/OAuthPKCE.swift` | `core/OAuthPkce.kt` |
| `Auth/AppleNonce.swift` | `core/AppleNonce.kt`, `core/SupabaseAuthContract.kt` nonce/id-token request contracts |
| `Auth/GoogleOAuthSession.swift` | `core/SupabaseAuthContract.kt`, `core/OAuthPkce.kt` |
| `Auth/AuthSessionStore.swift` | `usecase/AuthUseCases.kt` (`InMemorySessionRepository` for local contract tests) |
| `Auth/AuthModels.swift` | `core/CatoModels.kt`, `core/CatoConfig.kt`, `state/AuthState.kt` |
| `Auth/LoginView.swift` | `state/AuthState.kt` (`LoginFormState`), `ui/ScreenSpecs.kt` login screen specs |
| `Config/CatoConfig.swift` | `core/CatoConfig.kt` |
| `Auth/AuthViewModel.swift` | `state/AuthState.kt`, `usecase/AuthUseCases.kt` |
| `Auth/CatoSSEClient.swift` | `core/CatoModels.kt` (`CatoSseEvent`, `CatoSseParser`), `core/CatoApiRoutes.kt` event paths, `core/CatoApiContract.kt` event stream request specs |
| `Theme/CatoTheme.swift` | `ui/CatoDesignTokens.kt` |

## Applicant

| Swift source | Kotlin mirror |
| --- | --- |
| `Applicant/ApplicantOnboardingView.swift` | `state/ApplicantOnboardingState.kt`, `usecase/ApplicantUseCases.kt` |
| `Applicant/ApplicantResumeUploadStep.swift` | `state/ApplicantUploadState.kt`, `usecase/ApplicantUseCases.kt` |
| `Applicant/ApplicantVideoUploadStep.swift` | `state/ApplicantUploadState.kt`, `usecase/ApplicantUseCases.kt` |
| `Applicant/ApplicantHomeView.swift` | `state/ApplicantProfileState.kt`, `usecase/ApplicantUseCases.kt` |
| `Applicant/ApplicantProfileView.swift` | `state/ApplicantActionState.kt` profile screen specs, `state/ApplicantReelsState.kt` profile/upload screen specs, `usecase/ApplicantUseCases.kt` |
| `Applicant/ApplicantSettingsView.swift` | `state/ApplicantActionState.kt` settings screen specs, `state/ApplicantProfileState.kt`, `state/ApplicantEducationEditorState.kt` |
| `Applicant/ApplicantRequestsView.swift` | `state/ApplicantRequestsState.kt` request screen/card specs, `state/ApplicantConversationState.kt` conversation screen specs, `usecase/ApplicantUseCases.kt` |
| `Applicant/ApplicantSearchProfileEditorView.swift` | `state/ApplicantProfileState.kt`, `state/MatchingOptionPickerState.kt`, `usecase/ApplicantUseCases.kt`, `usecase/MatchingOptionUseCases.kt` |
| `Applicant/ApplicantSharedViews.swift` | `state/CatoNavigation.kt`, `ui/ScreenSpecs.kt`, shared applicant state specs |

## Recruiter

| Swift source | Kotlin mirror |
| --- | --- |
| `Recruiter/RecruiterDashboardView.swift` | `state/RecruiterDashboardState.kt` dashboard screen specs/actions, `usecase/RecruiterUseCases.kt` |
| `Recruiter/RecruiterSearchView.swift` | `state/RecruiterSearchState.kt` dynamic search screen specs, `state/MatchingOptionPickerState.kt`, `usecase/MatchingOptionUseCases.kt` |
| `Recruiter/RecruiterResultsView.swift` | `state/RecruiterCandidatePresentationState.kt` results screen specs and row routes |
| `Recruiter/CandidateReviewView.swift` | `state/CandidateReviewState.kt` screen/video/resume section specs, `state/RecruiterReelsState.kt`, `ui/ScreenSpecs.kt`, `usecase/RecruiterUseCases.kt` |
| `Recruiter/CandidateDetailTabsView.swift` | `state/RecruiterCandidatePresentationState.kt`, `usecase/RecruiterUseCases.kt` (`CandidateProfilePayload`) |
| `Recruiter/RecruiterMessagesView.swift` | `state/RecruiterDashboardState.kt`, `usecase/RecruiterUseCases.kt` |
| `Recruiter/RecruiterContactView.swift` | `state/RecruiterContactState.kt` contact/conversation screen specs, `usecase/RecruiterUseCases.kt` |
| `Recruiter/RecruiterEvidenceQueueView.swift` | `state/RecruiterSecondaryState.kt`, `usecase/RecruiterUseCases.kt` |
| `Recruiter/RecruiterComparisonView.swift` | `state/RecruiterSecondaryState.kt`, `usecase/RecruiterUseCases.kt` |
| `Recruiter/RecruiterShellView.swift` | `state/CatoNavigation.kt`, `ui/ScreenSpecs.kt` |
| `Recruiter/RecruiterBookmarksView.swift` | `state/RecruiterSecondaryState.kt` |
| `Recruiter/RecruiterShortlistView.swift` | `state/RecruiterSecondaryState.kt` |
| `Recruiter/RecruiterSettingsView.swift` | `state/RecruiterSecondaryState.kt` |
| `Recruiter/RecruiterSharedViews.swift` | `state/CatoNavigation.kt`, `ui/ScreenSpecs.kt`, shared recruiter state specs |

## Still Needs Android UI Module

The following cannot be completed under the current no-permission/no-install constraint:

- Android app module setup.
- Compose screens.
- Android secure session storage.
- Supabase HTTP implementation with JSON decoding.
- Cloudinary/direct video upload implementation.
- Native video recording/gallery picker.
- ExoPlayer/Media3 playback.
- Local Gradle build/test execution.
