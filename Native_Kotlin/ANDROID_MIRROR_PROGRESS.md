# Native Android Mirror Progress

## Current Status

The native Android/Kotlin app is now a functional mirror-in-progress of the native Swift app, not just a parser module or shell. The major applicant and recruiter flows are wired to shared backend contracts and use real backend state instead of seeded demo fallbacks.

Current completeness estimate: about 70-75% of the iOS functional POC is mirrored on Android. Remaining work is mostly Android UI polish, media edge behavior, and manual-device validation rather than backend contract coverage.

Implementation focus going forward:

- finish Android-specific recruiter/applicant UI behavior gaps
- avoid fake/placeholder data in manual testing paths
- keep source changes scoped to `Native_Kotlin`
- rely on manual testing for device behavior unless a specific build/check is requested

This module started as a JVM resume-parser module, not a full Android app. To respect the no-permission/no-network constraint, this pass did not install Android or Compose dependencies and did not modify signing, keystores, publishing, or Expo files.

See `IOS_TO_ANDROID_MIRROR_MAP.md` for the Swift-to-Kotlin file mapping.

## Local Verification Status

- `Native_Kotlin/src` currently contains 65 Kotlin files.
- `Native_Kotlin/app` now contains the native Android app module shell.
- Core Swift/Kotlin model parity script reports `missing_core_models 0`.
- Swift `CatoAPIClient` route comparison reports `missing_in_kotlin_route_literals 0`.
- Static dependency sweep reports no accidental `androidx`, `retrofit`, `okhttp`, `gson`, `moshi`, or `kotlinx` imports in the Kotlin mirror layer.
- Bracket-balance sweep across main/test Kotlin files reports no mismatches.
- Local Gradle execution remains blocked under the strict session rules because there is no `gradle` command and no `gradlew` wrapper, and installing tools/dependencies is out of scope.

## Android App Shell

- Added `:app` to `settings.gradle.kts`.
- Added `Native_Kotlin/app/build.gradle.kts` with a native Android application module and no signing/publishing configuration.
- Added Android `BuildConfig` fields for `CATO_SUPABASE_URL`, `CATO_SUPABASE_ANON_KEY`, and `CATO_API_BASE_URL`, sourced from local Gradle properties when available.
- Added `AndroidManifest.xml`, `CatoTheme`, `CatoAndroidApplication`, and `MainActivity`.
- Added `CatoAndroidShell` and `CatoAndroidTheme` to render a plain native Android shell without Compose or external UI dependencies.
- Added `CatoAndroidRuntime` for Android runtime config loading.
- Added `CatoAndroidSessionStore`, a SharedPreferences-backed implementation of the mirrored `AuthSessionRepository`.
- `CatoAndroidRuntime` can now construct the shared `CatoRawHttpClient` and `SupabaseRawHttpClient` when runtime config is present.
- Added normal Android `INTERNET` manifest permission for backend access.
- Added `CatoAndroidApiGateway`, a dependency-free background executor for shared `ApiRequestSpec` calls.
- Wired first backend-call actions into:
  - recruiter dashboard
  - recruiter dynamic search
  - recruiter messages
  - applicant home/profile load
  - applicant requests
  - applicant reels
- These actions currently show raw response status/body snippets so manual testing can verify config/session/API reachability before full JSON hydration is implemented.
- Added `CatoAndroidJson`, a tiny dependency-free JSON field/count extractor for early native hydration without adding Gson/Moshi.
- Successful backend responses now hydrate visible Android shell state for:
  - recruiter name/company
  - recruiter candidate/bookmark/message metric counts
  - applicant name/email
  - estimated applicant profile strength
  - applicant reel count
- `CatoAndroidJson` now supports extracting top-level object arrays from common response keys.
- Successful backend responses now hydrate visible list rows for:
  - runtime search results
  - recruiter message threads
  - applicant interest requests
  - applicant reel thumbnail titles
- Hydrated runtime search/message/request/reel rows now preserve backend IDs where present.
- Tapping hydrated candidate rows carries candidate ID/name/subtitle/match score into candidate review.
- Tapping hydrated recruiter message rows carries candidate ID/name/latest message into the conversation route.
- Tapping hydrated applicant request rows carries request ID/title/status into request detail or conversation routes.
- Tapping hydrated applicant reel thumbnails carries reel ID/title/subtitle into the reel detail route.
- Candidate review actions now call shared recruiter API specs for:
  - load candidate detail
  - send interest
  - bookmark
  - pass/maybe/shortlist review updates
  - contact candidate
  - refresh candidate messages
- Candidate detail responses now hydrate visible candidate review/profile sections for:
  - name/subtitle/match score
  - resume availability copy
  - match evidence
  - projects
  - internships
  - profile reel thumbnails when media is included
- Candidate profile media responses now hydrate the candidate profile reel thumbnail grid.
- Candidate message responses now hydrate the visible conversation cards.
- Recruiter video feed responses now hydrate the recruiter reels screen with backend video IDs, applicant IDs, source type, captions/titles, counts, and media URLs.
- Recruiter reel actions now use backend video IDs for:
  - mark viewed when playback starts
  - like video
  - send interest with `sourceVideoId`
- Applicant request and reel detail actions now call shared applicant API specs for:
  - accept/decline interest request
  - refresh/send applicant conversation message
  - clear reel caption
  - delete reel
- Applicant profile responses now hydrate project and internship cards when present.
- Applicant manual matching/profile setup route now calls the shared `applicantSearchProfile` endpoint and hydrates the visible setup summary with saved field count, skill count, and depth state.
- Applicant manual matching is now a dedicated native editor route instead of a static info page:
  - loads current saved setup
  - loads field/category options
  - loads skill options
  - selects up to 10 fields and up to 100 skills
  - selects one depth field/skill
  - saves through the shared `saveApplicantSearchProfile` contract
  - restores saved selected IDs when loading an existing setup
- Applicant manual matching editor now exposes custom field/skill creation through the shared matching-option add contract and selects newly created options immediately.
- Recruiter dashboard now loads saved filters/quick searches from the shared backend contract and renders the first quick-search rows.
- Recruiter quick-search rows now preserve their backend payload and restore saved search criteria when tapped:
  - selected job ID/name
  - employment type
  - target categories
  - required/preferred skills
  - graduated/non-graduated range inference
  - desired depth
- Recruiter dashboard interest-request card now opens a native recruiter interest-request list.
- Recruiter interest-request list refreshes from the shared `recruiterInterestRequests` contract and routes accepted requests toward conversation or pending requests toward candidate review.
- Recruiter dynamic search now includes a basic save-job-search action using the shared recruiter-job save contract.
- Selecting a recruiter quick search now puts Dynamic Search into edit mode and switches the action from save to update using the shared recruiter-job update contract.
- Successful save/update responses update the local quick-search list and selected job ID.
- Recruiter dynamic search now tracks native runtime-search state for:
  - employment intent
  - graduation filter
  - GPA minimum
  - selected semester numbers
  - selected fields/categories
  - must-have and preferred skills
  - fluency depth
- Recruiter dynamic search can now load field/category and skill options from the shared matching-options endpoint.
- Recruiter dynamic search can now add custom recruiter field/skill options through the shared add-option endpoint and selects the new option immediately.
- Runtime search and save-job-search now send the selected Android search state instead of an empty `RuntimeSearchSpec`.
- Dynamic search now exposes GPA and semester controls and sends them through `RuntimeSearchSpec`; saved quick searches restore GPA/semester criteria when available.
- Removed seeded demo fallback rows from the native Android shell surfaces so manual testing reflects real backend state:
  - recruiter runtime search results
  - recruiter reels feed
  - recruiter messages
  - recruiter interest requests
  - applicant requests
  - applicant owned reels
  - applicant public video feed
  - recruiter candidate profile reel grid
  These screens now show explicit empty states and refresh/load actions instead of fake candidates, companies, requests, or videos.
- Candidate review/profile state now clears candidate-specific resume, evidence, projects, internships, and media when a new candidate is selected, preventing stale data from the previous candidate from appearing during manual testing.
- Recruiter candidate review/profile now conditionally renders resume, intro video, deeper signal, proof reels, projects, and internships only when backend data exists.
- Recruiter reels now only show the Deeper action when the current intro/short-take clip has a deeper-signal clip for the same applicant, and source-type matching accepts the Swift/iOS naming variants.
- Recruiter and applicant matching-option creation now uses typed field/skill input instead of hardcoded native test labels.
- Recruiter dynamic search and applicant manual matching now persist typed field/skill search terms and filter the visible option rows after applying the search, while still allowing custom add from the same input.
- Applicant reel publishing now creates new project, internship, or accomplishment evidence from user-entered title/description text inside the wizard instead of generic draft records.
- Recruiter dynamic search now includes an editable search-name field so saved/updated quick searches can use recruiter-provided names.
- Recruiter candidate profile navigation now returns to the opening context, so profiles opened from candidate review return to review and profiles opened from reels return to reels.
- Candidate header no longer displays a hardcoded profile percentage; it hydrates profile strength from candidate detail when present and otherwise shows a neutral Profile action.
- Android shell defaults now avoid fake-looking recruiter/applicant state: dashboard candidate count, request title, university, semester, and quick-search name start neutral until backend data loads.
- Applicant recruiter preview no longer renders a synthetic intro-video section; it shows intro media only when a loaded applicant reel row has an intro/short-take source type.
- Recruiter candidate actions now guard against blank candidate IDs before loading detail/media/messages, auditing matches, sending interest, bookmarking, contacting, or setting pass/maybe/shortlist status.
- Applicant request/conversation actions now guard against blank request IDs before loading threads, replying, accepting, or declining.
- Applicant reel actions now guard against blank reel IDs before caption updates, deletes, views, or likes, and public profile opening now requires an applicant ID.
- Applicant reel wizard evidence summary now resolves accomplishment links as well as project and internship links.
- Backend list hydration now clears stale Android rows when refreshed responses are empty, including recruiter quick searches, interest requests, runtime search results, video feeds, messages, applicant requests, applicant reels, and candidate media.
- Applicant profile strength display now uses a readable unloaded state instead of rendering `--%` before profile data is fetched.
- Recruiter/applicant reel view and like actions now update local view/like labels and row badges after successful API calls, so the UI reflects interaction without waiting for a full feed refresh.
- Recruiter bookmark success now updates the local dashboard bookmark count immediately after the backend call succeeds.
- Recruiter contact-message success now upserts the local message-thread row and dashboard message count so messages reflect immediately after sending.
- Recruiter reel rows now preserve applicant identity separately from captions, so opening a profile from reels does not accidentally use the reel caption as the candidate name.
- Recruiter pass/maybe/shortlist success now updates local search/request row status badges, not only the candidate-review header.
- Recruiter message refresh now clears the dashboard message count to zero when no threads are returned instead of keeping a stale count.
- Android reel hydration now prefers playable video URLs over thumbnail URLs for native `VideoView` playback.
- Recruiter dynamic search and applicant manual matching no longer show hardcoded fallback field/skill chips before backend options are loaded; users can load options or add custom typed options instead.
- Recruiter fluency-depth selection no longer invents a default `technology` depth when no field/skill has been selected.
- Applicant public reel opening now carries the selected reel's view/like counts into the player, avoiding stale counters from a previously opened reel.
- Native Android video playback state is now keyed per clip instead of using one global recruiter flag, so moving between reels/profile videos does not inherit the previous clip's play/pause state.
- Recruiter candidate review and candidate profile now use a full-profile load action that hydrates candidate detail and then profile media, so resume/evidence and intro/deeper/reel videos populate together.
- Recruiter candidate review/profile now hydrate and render candidate accomplishments from candidate detail or profile-media responses, matching the Swift recruiter-only proof sections.
- Applicant public video feed now opens a real public applicant profile screen with basic identity and public videos instead of only updating text on the reel player.
- Recruiter reel video surfaces now support native swipe-up/swipe-down navigation and intro-video swipe-right to deeper signal, while retaining the button fallback.
- Applicant and recruiter interest-request routing now normalizes backend status values, so pending/accepted/declined/expired handling is not brittle to casing or alternate status labels.
- Applicant unread request rows are visually emphasized in the native request list before they are opened.
- Recruiter/applicant conversation screens now render a first-unread "New messages" divider and preserve unread flags from message thread payloads.
- Applicant education editing now validates GPA as numeric and within the 0-4 range before mutating local state or sending the backend update.
- Applicant education editing now includes fixed semester shortcut choices from Freshman through Graduated while still allowing manual label/number edits.
- Recruiter semester filtering no longer uses an ambiguous "Graduate" chip; it separates Year 5+, Graduating, and Graduated.
- Applicant accomplishments now have an explicit refresh path from the shared accomplishments endpoint on profile and reel-upload screens, so reel evidence linking does not depend only on profile hydration or newly created accomplishments.
- Recruiter dashboard now exposes native Bookmarks, Shortlist, and Evidence Queue secondary screens wired to the shared backend contracts, with candidate rows routing into Candidate Review.
- Candidate review now has a `Why this match?` action that calls the shared runtime match audit endpoint using the current Android search spec and selected candidate ID.
- Runtime match audit responses hydrate visible evidence rows from returned score, reasons, and blockers.
- Applicant project, internship, and reel-upload detail routes now expose first functional backend actions for:
  - creating a draft project
  - creating a draft internship
  - preparing a reel upload
  - creating a draft accomplishment for reel linkage
- Applicant reel upload now has a native publish wizard instead of a static placeholder:
  - chooses an existing video through the system video picker
  - stores a caption draft capped at 250 characters
  - selects linked evidence from loaded projects, internships, or accomplishments
  - can create draft project, internship, or accomplishment evidence and select returned backend IDs
  - uploads through the same signed Cloudinary multipart path used by onboarding videos
  - completes the backend reel upload with caption, secure URL, public ID, file metadata, and evidence link
  - refreshes applicant reels after successful publish
- Applicant owned reel playback now supports caption editing parity with iOS:
  - save a new caption
  - change an existing caption
  - clear caption back to null
  - update local reel rows after successful backend response
- Tapping hydrated applicant project/internship rows now selects their backend IDs and exposes update/delete actions through the shared project/internship contracts.
- Applicant profile tab now exposes direct profile refresh and renders accomplishment evidence rows so proof reels can be linked from projects, internships, or accomplishments.
- Applicant projects and internships now have native editable manager screens instead of fixed draft actions:
  - project title/type/description/link inputs
  - internship company/role/duration inputs
  - create, update, delete, and cancel edit flows
  - selected profile cards prefill the editor
  - backend responses hydrate local rows for immediate reuse in profile and reel evidence linking
- Applicant education/settings editing is now input-driven instead of saving static loaded state:
  - name, university, semester label/number, GPA, major, and minor inputs
  - validates that education cannot be left empty
  - saves account name and education through the shared backend contracts
- Applicant recruiter preview is now a functional conditional preview instead of static copy:
  - refreshes profile data
  - shows applicant identity/education
  - opens resume when available
  - routes missing resume to resume extraction
  - shows only available project, internship, and accomplishment proof sections
  - routes empty proof state toward reel/proof creation
- Applicant profile hydration now stores education metadata locally: university, major/minor, semester, and GPA.
- Applicant education settings now expose backend actions to save current name and, once loaded, current education through the shared account/education update contracts.
- Applicant reel publishing now matches the Swift/user flow more closely:
  - publish action appears as a bottom floating button only after video plus at least one evidence link are present
  - locked state remains explanatory when required inputs are missing
  - evidence picker no longer caps selectable loaded projects/internships/accomplishments at four items
- Android bottom navigation now mirrors the native Swift shell layout more closely:
  - left and right nav groups render as separate rounded capsules
  - the Reels tab is a larger centered purple circle with white icon/text
  - keyboard visibility still hides the whole nav bar globally
- Android semester choices no longer expose an ambiguous `Graduate` semester state; Year 5+ and Graduated are separated consistently in recruiter filters and applicant education state.
- Recruiter dashboard empty states now remain visible for Interest Requests and Quick Search instead of silently omitting empty sections, and interest request mini cards include sent-date copy when present.
- Recruiter dynamic search and applicant manual matching now show selected fields/skills as alphabetically sorted, one-row horizontal chip scrollers instead of forcing selected values into multi-row option grids.
- Recruiter and applicant bottom-nav unread badges now use hydrated unread state instead of hardcoded counts.
- Recruiter message rows and applicant request rows clear local unread state when opened.
- Recruiter conversation and applicant accepted-conversation screens now send the typed message body instead of fixed placeholder text.
- Recruiter/applicant conversation refresh and send responses hydrate or append visible conversation rows.
- Added dependency-free Android SSE runtime plumbing using `HttpURLConnection` and the shared `CatoSseParser`.
- Recruiter/applicant event streams are wired through hidden best-effort shell startup rather than settings controls.
- Recruiter and applicant reel playback surfaces now use native Android `VideoView` when a backend media URL is available, while preserving text fallback when no URL exists.
- Applicant reel thumbnails now carry media URLs into the applicant reel player route.
- Applicant Reels tab now includes a public applicant video feed path using the shared public video feed contract.
- Applicant public reel player supports viewing, liking, and opening the public applicant profile without exposing owner-only edit/delete controls.
- Login and settings now surface runtime config status.
- Password login is now wired through the shared Supabase password auth contract.
- Successful password login now:
  - stores the Supabase session in Android SharedPreferences
  - resolves existing backend role from `/auth/role`
  - claims the selected recruiter/applicant role when no role exists
  - syncs the selected/resolved role with the backend
  - routes into the native Android recruiter or applicant shell
- App launch now bootstraps an existing stored session by calling `/auth/role`; valid sessions route directly into the matching recruiter/applicant shell and invalid/missing-role sessions are cleared.
- Stored-session bootstrap now refreshes expired Supabase access tokens before resolving `/auth/role`, matching Swift session lifecycle behavior.
- Applicant root now gates through backend onboarding status before entering the applicant shell.
- Native Android onboarding covers the backend-backed sequence:
  - education save
  - resume upload/skip
  - signal prompt load/select
  - short-take video picker upload through Cloudinary and backend completion
  - deeper signal seen
  - deeper video picker upload through Cloudinary and backend completion/skip
  - final profile completion
  - status-advancing actions only advance after successful backend responses
- Added dependency-free Cloudinary multipart video upload support for Android onboarding videos, mirroring the Swift upload flow:
  - accept video/privacy consent
  - prepare backend upload URL
  - enforce backend-returned max file size and duration before cloud upload
  - upload selected video bytes with signed Cloudinary fields
  - complete backend video record with public ID, secure URL, content type, size, and duration
  - system video picker and Android's native video recorder can both feed the same upload flow
- Google sign-in now mirrors the Swift PKCE web-auth path without extra dependencies:
  - Android manifest accepts `cato://auth/callback`
  - Google button opens Supabase `/auth/v1/authorize` with PKCE challenge
  - callback code is exchanged through Supabase PKCE token grant
  - resolved session is saved locally and routed through the same role claim/sync path
  - Supabase URL configuration must allow `cato://auth/callback`
- Apple sign-in remains a native platform credential task because it requires Android-side provider credential work or a product decision to use web OAuth.
- Applicant and recruiter settings now include local sign-out behavior that clears the Android session store and returns to login.
- Applicant and recruiter delete-account settings actions now call the shared backend delete endpoints and only clear local session after a successful backend response.
- The first native shell can show login, applicant home, recruiter home, and the centered Cato bottom navigation using the existing mirrored Kotlin specs.
- The bottom navigation is now actionable:
  - recruiter: Home, Search, Reels, Messages, Settings
  - applicant: Home, Requests, Reels, Profile, Settings
- Added first-pass native screen bodies for:
  - recruiter dynamic search
  - recruiter reels
  - recruiter messages
  - recruiter settings
  - applicant requests
  - applicant reels
  - applicant profile
  - applicant settings
- Added first-pass recruiter dynamic-search result cards that open a candidate review route.
- Added first-pass candidate review route with:
  - runtime match header
  - interest/bookmark/contact actions
  - why-this-match section
  - intro/deeper signal/resume/project/internship sections
  - pass/maybe/shortlist decision controls
- Added first-pass recruiter reels behavior:
  - current reel state
  - play/pause action
  - previous/next reel actions
  - deeper-signal jump action for intro clips when deeper signal is available
  - intro/deeper/profile reel labels
  - candidate profile open from reels
- Added first-pass recruiter candidate profile route:
  - intro video first
  - deeper signal when available
  - remaining reels as 3-column thumbnails
  - recruiter-only resume/projects/internships sections
- Added first-pass recruiter message grouping route:
  - one row per applicant
  - unread row emphasis
  - conversation drill-down with message composer placeholder
- Added first-pass applicant detail routes from Profile and Settings:
  - recruiter preview
  - manual matching fields
  - projects
  - internships
  - education editor concept
- Added first-pass applicant reels profile:
  - profile-style header
  - upload/record/manage actions
  - three-column reel thumbnails
  - reel upload wizard route
  - reel playback/edit/delete concept route
- Added first-pass applicant request drill-down and accepted conversation route.
- Added global root-level keyboard dismissal behavior for native screens when tapping outside text inputs.
- This is now beyond the initial scaffold stage. The remaining work is polishing Android behavior and visual parity for the already wired dynamic search, candidate review, reels, applicant profile, requests, messages, and settings screens.

## Completed Locally

- Added pure Kotlin app contracts under `src/main/kotlin/com/cato/app`.
- Corrected Android color tokens to standard ARGB values matching Swift `CatoTheme`, avoiding white/text contrast regressions on light lavender surfaces.
- Added Android/JVM `CatoDateText.chatTimestamp` parity for chat/message timestamps.
- Improved the deterministic resume parser skill matching so symbolic skills such as `c++` and `ui/ux` are handled without partial false positives.
- Added low-level raw HTTP clients for Cato API and Supabase request specs.
- Added dependency-free JSON body serialization coverage for nested payloads, escaped strings, booleans, numbers, arrays, and explicit null values.
- Mirrored core Swift/iOS model contracts for:
  - recruiter candidates, dashboard, messages, saved filters, interest requests
  - runtime search and matching scores
  - applicant profile, education, resume, signals, projects, internships, activity, requests
  - profile reels and accomplishments
- Added backend route builders matching Swift `CatoAPIClient` paths.
- Reconciled route parity against Swift `CatoAPIClient`; literal route comparison currently reports no missing Swift paths.
- Added native config/session/error contracts matching Swift:
  - `CATO_SUPABASE_URL`
  - `CATO_SUPABASE_ANON_KEY`
  - `CATO_API_BASE_URL`
  - 60-second auth expiry leeway
  - Supabase `expires_in` conversion to absolute session expiry
- Added SSE event parser matching Swift line-buffer behavior:
  - split chunks
  - comments/heartbeats
  - multi-line data
  - message/request/general category routing
- Added SSE request specs matching Swift:
  - role-based `/recruiter/events` and `/applicant/events` paths
  - bearer authorization header
  - `Accept: text/event-stream`
  - infinite-timeout intent for the long-lived stream
- Added Supabase auth request contracts matching Swift:
  - password grant
  - Apple `id_token` grant
  - Android native Google `id_token` grant
  - Google PKCE authorize path
  - PKCE code exchange
  - refresh token grant
  - user full-name update
- Added PKCE verifier/challenge helper matching Swift Google OAuth.
- Added Apple nonce generation and SHA-256 helper matching Swift Sign in with Apple flow.
- Added Google OAuth callback parser matching Swift provider-error and missing-code behavior.
- Added auth bootstrap/sign-in orchestration contracts:
  - load stored session
  - refresh expired session
  - resolve or claim role
  - sync role
  - clear session on auth failure
  - clear persisted sessions when the backend role is missing, matching Swift bootstrap behavior
  - clear local session after applicant or recruiter account deletion
- Added an in-memory session repository for local previews/tests only; production Android secure storage remains an app-module integration task.
- Added request payload builders for:
  - role read
  - applicant/recruiter account deletion
  - recruiter dashboard, saved filters, interest requests, candidates, evidence queue, bookmarks, messages, candidate detail, and candidate profile media reads
  - applicant profile, resume, reels, accomplishments, search profile, interest requests, activity, conversation, onboarding status, and signal prompt reads
  - matching option reads
  - role sync
  - recruiter review updates
  - interest requests
  - contact candidate
  - runtime matching
  - runtime match audit
  - saved searches
  - saved runtime searches as recruiter jobs
  - applicant manual search profile
  - applicant reel upload preparation/completion
  - public applicant video feed/profile request specs
  - applicant reel caption update/delete
  - applicant projects create/update/delete
  - applicant internships create/update/delete
  - applicant accomplishments create
  - applicant interest response
  - applicant conversation message send
  - applicant account and education update
  - applicant onboarding education, resume, consent, signal prompt/video, deeper signal, and profile completion
- Added state/reducer-style contracts for:
  - auth/root routing
  - root screen destinations matching Swift loading/login/applicant-onboarding/recruiter-shell routing
  - login form role selection and auth button enabled states
  - login screen copy, role pill, password, Apple, and Google action specs
  - recruiter shell nav
  - recruiter dashboard quick search and request previews
  - recruiter dashboard card action routes for quick searches, interest requests, evidence queue, and shortlist
  - recruiter dashboard screen specs matching Swift header, search hero, metrics, empty states, quick search, interest requests, and view-all threshold
  - recruiter all-interest-requests list state
  - recruiter grouped messages
  - recruiter shell unread-message count for the Messages nav badge
  - recruiter dynamic search
  - recruiter dynamic search screen specs for header, basic filters, option sections, depth picker, collapsed summary, and floating search/save actions
  - recruiter dynamic search collapsed summary, reset sections, scroll-nudge targets, and save/update job action copy
  - recruiter dynamic search collapsed multi-select summaries with alphabetical display values
  - recruiter dynamic search unique/capped/alphabetically sorted option toggles
  - recruiter saved-search dialog naming and validation state
  - recruiter runtime search result rows
  - recruiter reels feed
  - recruiter reels screen specs for loading/empty copy, active clip metadata, intro/deeper behavior, playback chrome, like, interest, and profile-open affordances
  - recruiter reels tap-to-pause/playback overlay state
  - recruiter reel view/like interaction eligibility so intro/deeper videos do not call reel-only endpoints
  - recruiter source-aware interest command creation from reels/intro clips
  - candidate review sticky decisions and header actions
  - candidate review screen specs for header, action message, why-this-match, search fit, featured videos, resume, and optional recruiter-visible sections
  - candidate review header runtime-score override when opened from dynamic search
  - applicant/recruiter bottom navigation with centered Reels item and keyboard-hidden chrome
  - applicant/recruiter shell scaffold specs for selected tab, bottom bar visibility, unread badge, manual matching warning badge, and Swift-matched bottom padding
  - applicant profile-tab warning badge when resume parsing/manual matching setup is missing
  - candidate review resume action and 3-column reel thumbnail grouping
  - candidate full-screen reel viewer paging and playback overlay state
  - candidate full-screen reel viewer screen specs for close action, active video metadata, playback state, interest availability, and view tracking
  - candidate review video layout
  - applicant home/profile readiness and manual matching prompt
  - applicant home recruiter-request preview, request notification dot, activity metrics, and recent visibility preview
  - typed applicant manual matching editor state with 10-field/100-skill caps and depth selection
  - applicant requests unread/bold behavior
  - applicant requests screen specs for loading/empty copy, action message, unread count, accept/decline actions, and working state
  - applicant reels profile grid
  - applicant reels profile screen specs for identity, count, add action, empty copy, and grid items
  - applicant public reels feed playback/paging/like/view state
  - public applicant video profile visibility without recruiter-only resume/review data
  - applicant reel upload wizard validation and evidence-link selection
  - applicant reel upload wizard screen specs for video actions, caption, evidence tabs, blocking messages, and floating publish visibility
  - applicant reel upload wizard single-expanded evidence section and floating publish visibility state
  - applicant reel upload wizard in-flow project, internship, and accomplishment creation drafts with immediate evidence linking
  - applicant reel playback caption edit state
  - applicant conversation unread-divider and message-bubble ownership
  - applicant conversation screen specs for title/subtitle, empty/loading copy, draft/send state, rows, and first unread marker
  - applicant and recruiter conversation incoming-message upsert reducers for SSE-driven refreshes
  - recruiter contact and conversation screen specs for interest/message copy, loading/empty copy, draft/send state, rows, and first unread marker
  - SSE event category routing for message/request refresh
  - applicant profile/settings navigation action targets
  - applicant profile/settings action targets mapped to concrete native routes
  - applicant profile screen specs for identity, recruiter preview, manual matching placement, reels, projects, internships, and soft skills copy
  - applicant recruiter-preview visible-row specs for intro, deeper signal, resume, projects, internships, and reels
  - applicant settings account rows plus logout/delete confirmation copy
  - applicant settings screen specs for profile, education action, account actions, disabled working state, and confirmation copy
  - applicant project and internship editor validation state
  - applicant education editor validation and semester options
  - applicant onboarding route and signal prompt selection state
  - applicant onboarding step titles, subtitles, loading copy, and primary action labels
  - applicant final-profile form state with rounded GPA, manual matching recovery copy, and command generation
  - applicant PDF resume and onboarding video upload validation state
  - applicant profile reel video preparation/optimization contract
  - recruiter ranked result row presentation
  - recruiter saved-filter results screen specs for loading copy, count/sort/filter labels, helper copy, empty state, and candidate review routes
  - recruiter candidate detail tabs/header/sections
  - recruiter candidate detail omits unavailable resume/video/more sections instead of rendering "No data" placeholders
  - recruiter candidate profile media payload with videos and accomplishments
  - shared matching option picker for search-or-add fields/skills
  - shared matching option picker screen specs for selected chips, visible options, add-result, limit, and empty hints
  - recruiter bookmarks, shortlist, and settings presentation state
  - recruiter evidence queue and candidate comparison presentation state
  - runtime match audit presentation with recruiter-friendly labels
  - runtime match audit sheet screen specs for loading, error/retry, strong signals, missing signals, verification notes, components, and diagnostics
  - runtime match audit diagnostics for eligibility, inputs present, manual contribution, and verification notes
  - recruiter contact request/message and conversation state
  - recruiter bookmarks screen specs and recruiter settings screen/account confirmation specs
- Added repository interfaces for auth, recruiter, and applicant data sources.
- Added use cases for:
  - recruiter dashboard loading
  - recruiter all-interest-requests loading
  - recruiter bookmarks, shortlist, and settings loading
  - recruiter grouped messages
  - recruiter reels loading
  - recruiter video view/like interaction flow
  - recruiter candidate-review video view interaction flow
  - runtime search
  - candidate review loading/status/bookmark/interest
  - recruiter evidence queue loading/status-update flow
  - recruiter candidate comparison loading flow
  - applicant home loading
  - applicant home request/activity loading
  - applicant shell manual-matching warning status loading
  - applicant requests loading/responding
  - applicant manual search profile saving
  - applicant onboarding action validation and repository calls
  - applicant signal video upload preparation
  - applicant final-profile GPA guard before completion
  - applicant final-profile form submission from validated state
  - applicant reels profile loading
  - applicant reel upload preparation
  - applicant reel publish/caption/delete flows
  - applicant reel publish-wizard evidence creation and immediate auto-linking
  - applicant project and internship create/update/delete flows
  - applicant accomplishment creation
  - matching option loading and creation
  - applicant conversation loading and send/reload behavior
  - public applicant video profile loading
  - public applicant video view/like interaction flow
- Added local unit tests for:
  - API route/payload construction
  - Swift-equivalent read/delete request specs for applicant and recruiter flows
  - recruiter reels state
  - recruiter reels screen spec copy, intro/deeper clip metadata, like/interest state, and empty state
  - source-aware recruiter interest commands from video feed clips
  - candidate review state
  - candidate review screen spec aggregation and omission of unavailable sections/placeholders
  - candidate review runtime search score override and reasons
  - candidate review resume URL fallback and 3-column thumbnail rows
  - candidate full-screen video viewer screen spec output for intro/reel playback
  - recruiter message grouping
  - recruiter dashboard screen spec copy, metrics, fallback identity, and view-all request action
  - applicant home/request state
  - applicant project/internship editor state
  - typed applicant manual matching editor caps and depth selection
  - applicant reels grid/upload wizard state
  - applicant reels profile and upload wizard screen spec copy/action contracts
  - applicant reel upload wizard in-flow evidence creation and auto-linking
  - applicant public video profile sections
  - applicant conversation unread state and SSE categorization
  - applicant/recruiter request and conversation screen spec copy/action contracts
  - applicant/recruiter shell scaffold spec behavior for keyboard-hidden bottom bars and centered Reels navigation
  - SSE chunk parsing and multi-line event data
  - native config/session validation
  - Supabase auth response to local session conversion
  - Supabase/API error best-message fallback behavior
  - Supabase auth endpoint/payload contracts
  - recruiter job create/update payloads for saved dynamic searches
  - recruiter dynamic search summary and runtime result rows
  - recruiter dynamic search screen spec copy, segmented options, collapsed display, and floating action contracts
  - recruiter saved-filter results screen spec labels and result-row review routes
  - recruiter bookmarks/settings screen copy, disabled working state, and logout/delete confirmation contracts
  - recruiter bookmarks/shortlist/settings loader use-case filters and dashboard-account mapping
  - runtime match audit payload
  - runtime audit presentation labels
  - runtime audit sheet screen spec copy, error fallback, and empty list copy
  - runtime audit diagnostic rows
  - shared matching option picker screen spec output for recruiter/applicant search-or-add UI
  - PKCE verifier/challenge generation
  - Apple nonce generation and SHA-256 hashing
  - Google OAuth callback success, provider error, and missing-code parsing
  - Android native Google ID-token Supabase grant request
  - auth bootstrap and role-claim orchestration
  - root screen routing parity with Swift `RootView`
  - login form role selection and working/disabled states
  - login screen spec parity with Swift copy and button availability
  - logout and applicant/recruiter delete-account orchestration
  - in-memory local session repository behavior
  - applicant profile action targets for missing resume/video/projects/internships and education editing
  - applicant profile/settings screen spec copy, manual matching priority placement, and disabled account actions
  - applicant education/account update payloads and validation
  - applicant onboarding/resume/signal/profile completion payloads
  - applicant onboarding route mapping and prompt selection
  - applicant onboarding presentation step specs
  - applicant final-profile GPA validation parity
  - applicant final-profile form recovery and command generation parity
  - applicant final-profile form submit/reject behavior
  - applicant resume/video upload validation and resume text quality state
  - applicant reel video optimization/pre-upload validation state
  - applicant onboarding action use cases for education, resume, consent, videos, deeper signal, and final profile
  - recruiter candidate result and detail presentation
  - matching option picker add-result and selected-chip behavior
  - recruiter bookmarks/shortlist/settings state
  - recruiter evidence queue and candidate comparison state
  - recruiter contact/conversation state
  - recruiter/public video interaction use cases skip non-reel videos, avoid duplicate view calls, and update like state after repository calls
  - applicant reel evidence creation use case auto-selects newly created project/internship/accomplishment links
  - applicant signal/profile reel upload preparation use cases
  - matching option loading and add-option use cases
  - applicant/recruiter bottom navigation specs and keyboard-hidden bottom bar behavior
  - Cato design token ARGB values
  - Cato design spacing/typography tokens
  - Cato chat timestamp formatting, including fractional ISO timestamps
  - dependency-free JSON payload serialization

## Mirrored iOS Behaviors Captured

- Recruiter reels merge applicant 10-second intro videos with profile reels.
- Recruiter reel swipe up/down moves between videos.
- Recruiter intro video swipe right can expose deeper signal.
- Recruiter reel and candidate full-screen video viewer contracts include tap-to-pause/play, play overlay visibility, and auto-resume on page changes.
- Recruiter reel view/like interactions only apply to uploaded profile reels, not the 10-second intro or deeper-signal video.
- Recruiter interest from a profile reel preserves video and linked project/internship/accomplishment context.
- Candidate review shows intro/deeper signal as featured videos.
- Candidate review shows remaining profile reels as 3-column thumbnail grid.
- Candidate review resume action prefers preview URL, falls back to raw resume URL, and hides when no resume URL exists.
- Candidate review bottom decision actions switch between Pass/Maybe/Shortlist.
- Candidate review header actions appear after scrolling past 10% threshold.
- Candidate review bottom decision actions collapse to icon-only after scrolling past 10% threshold.
- Candidate review mutating actions expose the same working/disabled state as Swift while recruiter actions are in flight.
- Candidate review opened from dynamic search uses the runtime match score, source label, reasons, and blockers instead of falling back to the persisted candidate/profile score.
- Applicant request cards expose unread state and 9+ badge behavior.
- Applicant home mirrors Swift dashboard previews:
  - top request notification when requests exist
  - first 3 recruiter requests route to request detail
  - activity metrics for views, saved, and shortlists
  - first 4 recent visibility events
- Recruiter messages are grouped one thread/card per candidate.
- Recruiter shell unread-message badge derives from unread message count and caps display at `9+`.
- Applicant and recruiter bottom navigation mirrors the native iOS structure:
  - centered Reels action
  - recruiter: Home, Search, Reels, Messages, Settings
  - applicant: Home, Requests, Reels, Profile, Settings
  - bottom navigation is hidden while keyboard is visible
- Applicant profile strength uses the iOS weighting:
  - resume, short take, deeper signal, soft skills = 70%
  - projects capped at 20%
  - internships capped at 10%
- Applicant manual matching prompt appears when resume parsing is missing/failed and no manual search profile exists.
- Applicant shell profile-tab warning uses the same lightweight resume/search-profile check as Swift.
- Applicant manual matching editor mirrors Swift option selection:
  - fields capped at 10
  - skills capped at 100
  - selected fields and skills sort alphabetically
  - one depth skill/field is required
  - saved values use standardized option keys
- Applicant request cards expose unread state and 9+ badge behavior.
- Applicant reels profile presents a TikTok-style profile grid contract.
- Applicant public reels feed supports playback paging, tap-to-pause/play, view state, and like state without exposing recruiter-only fields.
- Public applicant profile contracts hide recruiter-only fields and only show public video evidence, projects, and accomplishments.
- Public discovery contracts include:
  - public `/videos/feed`
  - public `/applicants/:id/public-profile`
  - video view/like actions
- Applicant reel publishing requires:
  - an uploaded or recorded video
  - at least one linked project, internship, or accomplishment
  - max 60-second duration
  - max 250-character caption
  - max 9 profile reels, excluding intro and deeper signal
- Applicant profile reel videos mirror Swift's upload preparation contract:
  - export to MP4
  - prefer 960x540, fall back to medium quality
  - optimize for network use
  - block videos over the server-provided max file size before upload completion
- Applicant reel publishing wizard mirrors Swift:
  - Projects, Internships, and Accomplishments are modeled as one expanded evidence section at a time
  - Projects, internships, and accomplishments can be created during the publish flow and are linked to the reel immediately after creation
  - publish action only becomes visible when video, evidence link, capacity, duration, and caption constraints are satisfied
  - full-capacity copy matches Swift: "You have reached the 9 reel limit."
- Applicant reel captions can be changed from empty to text, text to new text, or text back to empty.
- SSE event stream paths mirror Swift:
  - recruiter: `/recruiter/events`
  - applicant: `/applicant/events`
- SSE request specs mirror Swift authorization, event-stream accept header, and long-lived timeout behavior.
- SSE events are best-effort refresh triggers:
  - `message_sent` refreshes messages
  - `interest_request_sent` and `interest_request_responded` refresh requests
- Applicant conversations show a "new messages" divider before the first unread message and align bubbles by sender role.
- Applicant and recruiter conversations can upsert SSE-delivered messages by id, ignore messages for another thread, and preserve chronological ordering.
- Applicant profile action targets mirror Swift:
  - recruiter preview
  - add resume
  - add short take
  - add deeper signal
  - manage projects
  - manage internships
  - profile reels
  - manual matching fields
  - education editor
- Applicant recruiter preview mirrors Swift:
  - shows visible/missing rows for intro short take, deeper signal, resume, projects, internships, and profile reels
  - exposes the same completion message once resume, short take, deeper signal, and project evidence exist
- Applicant profile and settings action targets map to concrete native routes so cards are actionable rather than static.
- Applicant settings account actions mirror Swift logout/delete confirmation copy and disabled working state.
- Applicant project and internship editor states mirror Swift sheet validation:
  - project title and description are required
  - blank project type defaults to `project`
  - internship company, role/department, and positive duration are required
- Applicant education editor mirrors Swift:
  - name and university are required
  - education can be changed but not deleted to an empty state
  - GPA must be between 0 and 4 if provided
  - degree metadata fields can be cleared independently
  - semester options include Freshman through Graduated
- Applicant onboarding mirrors Swift route progression:
  - auth complete -> education
  - education complete -> resume
  - resume complete -> signal prompt
  - signal prompt selected -> short take upload
  - signal video uploaded -> deeper signal
  - deeper signal seen -> deeper video
  - deeper video skipped/uploaded -> final profile
  - profile form complete/onboarding complete -> applicant shell
- Applicant upload steps mirror Swift:
  - resume upload accepts PDF only
  - resume upload blocks empty files and files over 10 MB
  - resume text extraction quality is modeled so failed parsing can fall back to manual matching fields
  - onboarding videos require at least 3 seconds
  - short take videos longer than 10 seconds and deeper signal videos longer than 30 seconds require trimming before upload
- Recruiter candidate result/detail specs mirror Swift:
  - ranked result row with match score, tags, resume/video capability pills, bookmark state
  - candidate detail tabs for About, Resume, Video, and More
  - detail header fact pills for profile strength, GPA, resume, deeper signal, projects, internships, and accomplishments
  - recruiter-only accomplishments from candidate profile media appear in the More tab only when present
  - unavailable resume/video/projects/internships/accomplishments are omitted rather than shown as "No ..." sections
- Recruiter saved dynamic searches mirror Swift:
  - create uses `POST /recruiter/jobs`
  - update uses `PUT /recruiter/jobs/:id`
  - payload includes capacity, active status, employment type, skills, categories, depth, GPA, and preferred semester range
- Recruiter runtime search payload mirrors Swift:
  - selected category keys are sent as target categories
  - first selected skill is required
  - remaining selected skills are preferred
  - depth uses the selected option key
- Recruiter dynamic search interaction contracts mirror Swift:
  - collapsed summary shows selected criteria only, two visible chips plus `+n`
  - empty collapsed summary means all candidates
  - category selections are unique, capped at 10, and alphabetically sorted
  - skill selections are unique, capped at 100, and alphabetically sorted
  - top criteria, categories, skills, depth, and all filters can be reset independently
  - save action reads "Save job" for new searches and "Update Job" when editing
  - save dialog defaults to `[field] [skill] [employment]` or "Saved candidate search"
  - save dialog validates non-empty names before create/update
  - state exposes one-time nudge targets from basics to categories and categories to skills
- Runtime match audit presentation avoids technical scoring names:
  - `bm25` is shown as "Resume relevance"
  - component rows use recruiter-friendly labels such as "Filter fit" and "Project evidence"
  - eligibility, resume/manual-search readiness, manual matches, and verification notes can be shown without exposing raw API structures
- Matching option picker mirrors Swift:
  - one input for search or add
  - shows `Add skill: query` or `Add field: query` only when no options match
  - selected chips sort alphabetically
  - max selection limits are enforced locally
- Recruiter secondary screens mirror Swift:
  - bookmarks empty state and result rows
  - shortlist selection capped at 4 candidates for comparison
  - evidence queue rows show match strength, profile strength, top evidence, and validation labels
  - evidence queue removes candidates after Pass/Maybe/Shortlist action
  - candidate comparison columns show match, strength, GPA, project/internship counts, resume availability, and top evidence
  - settings account rows plus logout/delete action copy
- Recruiter dashboard action cards mirror Swift navigation:
  - quick searches route to saved-filter results
  - interest request cards route to candidate review
  - evidence queue and shortlist shortcuts have concrete native routes
  - view-all interest requests has a standalone sorted list contract
- Recruiter candidate resume access mirrors Swift intent:
  - candidate detail hydration preserves the resume preview/download URL when the backend returns it
  - resume cards open that URL through Android's viewer intent when tapped
- Recruiter candidate review decisions now keep native state in sync:
  - candidate detail hydrates review status from top-level or nested review payloads
  - Pass, Maybe, and Shortlist update the visible current decision after successful API calls
- Recruiter candidate header pills are actionable:
  - Profile opens the candidate profile/media view
  - Resume opens the preserved resume URL
  - Deeper signal routes to the candidate profile media screen
- Recruiter interest actions preserve context:
  - candidate review/profile sends interest to the selected candidate
  - reel viewer sends interest to the reel applicant and attaches video source metadata
- Recruiter search result handoff preserves review context:
  - candidate rows carry name, subtitle, runtime match score, and any visible review status into candidate review
- Recruiter dashboard quick search empty state is actionable:
  - tapping the Quick Search card loads saved filters/jobs into the dashboard
- Recruiter settings cards use loaded account state:
  - recruiter card shows the current recruiter name
  - company card shows the current company name
- Recruiter contact/conversation mirrors Swift:
  - interest request and message modes have different default copy
  - send is disabled for empty drafts
  - conversation rows insert a "New messages" divider before first unread message
  - recruiter-authored messages are treated as the current user's bubbles
  - incoming messages update or append the correct candidate thread only
- Applicant request routing is status-based:
  - accepted requests open the conversation route
  - sent/viewed requests open the request detail route with accept/decline actions
  - declined/expired requests open detail without active response buttons
  - successful Accept moves directly into the conversation route
  - successful Decline updates local request status and clears unread state
- Applicant home actions mirror Swift:
  - Profile strength opens the profile/recruiter-preview area
  - Manual matching fields opens the guided manual setup editor
- Applicant resume extraction settings now have a native status route:
  - loads current resume and parse status from `/resume`
  - opens uploaded resume when a URL is present
  - can continue without resume and route to manual matching fields
  - can choose a PDF with Android's system document picker
  - validates PDF magic bytes and 10 MB size cap locally
  - accepts resume/privacy consent before uploading through the existing resume upload endpoint
- Applicant reel actions are no longer passive:
  - Upload opens the reel publish flow through Android's system video picker
  - Record opens Android's native system video recorder and feeds the returned video into the same validation/upload path
  - Manage routes back to the profile area where owned reels/projects/internships can be managed
- Applicant owned reel management updates local state after successful API calls:
  - Clear caption renames the local row to Untitled reel
  - Delete reel removes the local row and updates the local reel count
- Applicant project/internship deletes update local state:
  - successful project deletion removes the project row and returns to profile
  - successful internship deletion removes the internship row and returns to profile
- Recruiter shortlist now mirrors the Swift comparison flow:
  - shortlist rows can be selected and deselected
  - two to four selected candidates can open a comparison screen
  - comparison shows match, profile strength, GPA, projects, internships, resume status, and top evidence when available from the loaded row payload
  - shortlist rows still route into candidate review, and Pass removes the row locally after the API call succeeds
- Recruiter evidence queue is now actionable:
  - queue rows show top evidence and validation copy when present
  - Review opens candidate review
  - Pass removes the candidate from the queue after updating review status
  - Shortlist updates review status, removes the candidate from the queue, and appends the row to the local shortlist
- Recruiter bookmarks are now actionable:
  - Review opens candidate review
  - Contact opens the candidate conversation route
  - Shortlist updates review status and appends the row to the local shortlist
- Recruiter candidate review now auto-loads on row open:
  - opening a candidate row immediately loads candidate detail and profile media
  - the existing manual Load candidate button remains as a fallback
- Recruiter candidate profile now auto-loads when opened:
  - Profile and Deeper signal actions route through the same hydrated profile path
  - detail and media are loaded immediately instead of relying only on the manual Load full profile button
- Applicant reel upload now supports multiple evidence links:
  - project, internship, and accomplishment links toggle independently
  - created evidence inside the upload wizard is auto-selected without replacing existing selections
  - upload validation now requires one or more links
  - the existing `links` payload is sent as the full selected list, matching the Swift reel ecosystem behavior
- Applicant reels now have a profile-style header:
  - identity line uses applicant name and education context
  - reel, view, and like counts are summarized above the thumbnail grid
  - copy matches the proof-video purpose of the reels ecosystem
- Applicant public profiles opened from reels now use profile-style presentation:
  - shows applicant identity and education context
  - summarizes video, view, and like counts
  - continues to hide empty profile sections while showing available videos as thumbnails
- Recruiter and applicant matching option pickers now follow the search-or-add result pattern:
  - fields and skills use a single search input per section
  - when no exact option exists, an "Add field/skill: query" result card appears
  - separate custom-add buttons were removed from those sections
- Recruiter message entry points now load threads automatically:
  - message rows clear unread state and open the candidate conversation
  - accepted interest requests also open the conversation
  - both paths immediately request candidate messages instead of requiring a manual refresh
- Applicant accepted request entry points now load threads automatically:
  - accepted request cards open the applicant conversation route
  - the conversation messages are requested immediately instead of requiring a manual refresh
- Main shell screens now have guarded first-load behavior:
  - recruiter dashboard and messages request their data on first entry
  - applicant home/profile, requests, and reels request their data on first entry
  - manual refresh buttons remain as fallback controls
  - guard flags prevent repeated request loops during redraws
- Recruiter discovery screens now hydrate supporting data on first entry:
  - dashboard requests saved Quick Search filters once
  - Dynamic Search requests field and skill option lists once
  - manual Load buttons remain available as fallbacks
- Applicant manual matching now hydrates on first entry:
  - current setup is requested once
  - field and skill option lists are requested once
  - manual Load buttons remain available as fallbacks
- Session reset now clears first-load guards:
  - sign-out, account deletion, and invalid stored-session paths reset loaded-state flags
  - a later user/session can hydrate dashboard/profile/search surfaces normally
- Applicant home now includes activity metrics:
  - first entry requests `/applicant/activity`
  - profile views, saved count, and shortlist count are shown beside profile strength actions
  - metric state resets with other first-load guards on sign-out/account deletion
- Secondary screens now lazy-load on first entry:
  - recruiter interest requests, bookmarks, evidence queue, and shortlist request their data when opened
  - recruiter settings requests dashboard/account context when opened directly
  - applicant settings requests profile context when opened directly
  - applicant resume extraction requests resume status when opened
  - refresh/load buttons remain as explicit fallbacks for manual testing
- Applicant evidence surfaces now hydrate before use:
  - profile requests accomplishments in addition to profile metadata
  - project and internship managers request profile context when opened
  - the reel upload wizard requests profile evidence plus accomplishments before evidence selection
- Reels feeds now hydrate on first entry:
  - recruiter reels request the recruiter video feed when opened
  - applicant reels request both own reels and the public applicant video feed when opened
- Recruiter Contact actions now open and load the conversation thread:
  - candidate review/profile/reel Contact uses the same auto-loading thread helper as message rows
  - this avoids landing on an empty conversation that requires manual refresh
- Applicant onboarding prompt selection now hydrates automatically:
  - the prompt step requests signal prompts once when displayed
  - the manual Load prompts button remains as a fallback
  - the empty prompt message now distinguishes selection from still-loading state
- Recruiter candidate review/profile now share guarded candidate hydration:
  - opening review/profile from thin rows requests candidate detail and profile media once per selected candidate
  - search result rows and profile actions reuse the same hydration path
  - session reset clears candidate hydration markers
- Bookmarked candidate Contact now uses the same auto-loading conversation path:
  - Contact from bookmarks opens the conversation and requests candidate messages immediately
  - message/request empty states now describe automatic loading plus manual refresh fallback
- Recruiter reels now mirror the Swift feed composition more closely:
  - recruiter reels request both `/videos/feed` and recruiter candidates on first entry
  - candidate ten-second intro and deeper-signal video URLs are converted into reel rows when present
  - uploaded profile reels and candidate intro/deeper clips are merged with stable de-duplication
- Applicant final onboarding now mirrors Swift search recovery behavior:
  - final profile step requests resume status and manual matching/search-profile status once
  - if resume parsing is missing and no manual matching profile exists, a "Help recruiters find you" recovery card appears
  - the card routes directly to manual matching while preserving the ability to finish onboarding
- Recruiter candidate evidence rows now preserve raw payloads and open evidence links:
  - projects, internships, and accomplishments keep their backend JSON for link extraction
  - candidate review/profile evidence cards open `linkUrl`/URL fields when present
  - unlinked evidence remains visible as ordinary profile context
- SSE/unread behavior now updates real screen state instead of only status text:
  - recruiter and applicant shells start their matching event stream once per signed-in session
  - Settings does not expose manual event connection controls for launch
  - recruiter `message_sent` events refresh recruiter message rows and the active candidate thread when applicable
  - recruiter `interest_request_responded` events refresh recruiter interest request rows
  - applicant `interest_request_sent` and `message_sent` events mark the relevant request row unread locally
  - applicant request events avoid fetching `/applicant/interest-requests` automatically because that endpoint marks sent requests viewed
  - applicant `message_sent` refreshes the active accepted conversation only when the event belongs to the open request
- Applicant manual-matching warning badge is now state-driven:
  - profile nav warning uses the same recovery condition as onboarding/profile recovery
  - a parsed resume with searchable text or a saved manual matching profile clears the warning
  - the previous hardcoded warning state has been removed
- Applicant reel upload wizard now behaves closer to the Swift/TikTok-style posting flow:
  - evidence linking uses a section picker and expands only one section at a time
  - selected project/internship/accomplishment counts are shown on the section controls
  - creating evidence from the wizard switches to the matching section and auto-links the new item
  - the publish action is hidden until both video and linked evidence exist
  - evidence refresh reloads profile-backed projects/internships plus accomplishments
- Recruiter candidate review/profile now treats detail loading as a fallback refresh:
  - candidate review/profile still hydrate automatically on entry
  - manual load buttons were renamed to refresh fallbacks
  - generic candidate evidence rows now use the same link-aware card as project/internship/accomplishment rows
- Auto-loaded Android screens now use refresh/fallback wording instead of primary "Load" actions:
  - recruiter dashboard, quick searches, search fields, and skills
  - applicant home profile, resume status, manual matching setup/options, public feed, and prompts
  - empty states now clarify that data loads automatically and refresh is only a fallback
- Global keyboard behavior now mirrors the native UX expectation:
  - tapping outside an active text input clears focus and hides the keyboard
  - the bottom navigation bar hides while the keyboard is visible
  - the nav bar returns to its fixed bottom position when the keyboard is dismissed
- Applicant profile warning badge now uses a transparent warning triangle glyph instead of an exclamation mark.
- Runtime search result rows now preserve richer backend match context:
  - nested `{ applicant, score }` and flat result shapes are both parsed
  - applicant id/name/education and runtime score are carried into candidate review
  - raw runtime result payload is preserved so immediate "Why this match?" reasons can render before full hydration
  - candidate-detail hydration no longer erases immediate runtime reasons when the detail endpoint has no match evidence
- Applicant public reels now behave more like a feed:
  - selecting a public feed row stores the active public reel index
  - public reel playback supports swipe up/down and previous/next controls
  - public profile video thumbnails now play from that profile's video list instead of falling back to the main public feed
  - play/pause and like actions redraw the correct applicant or recruiter shell based on role
  - view/like counts continue to update the owning feed row
- Recruiter candidate header deeper-signal action now opens the deeper-signal video directly instead of only navigating back to profile.
- Recruiter candidate asset interactions now mirror backend activity behavior:
  - Kotlin API routes expose `/recruiter/candidates/:id/activity`
  - opening a resume records `resume_opened`
  - opening a deeper signal records `deeper_signal_opened`
  - activity recording is non-blocking so the resume/video opens immediately
- Recruiter dynamic search controls are closer to the native Swift flow:
  - added a full reset action for the runtime search
  - added section-level reset actions for graduation, GPA, semesters, fields, and skills
  - manual option refresh now actually refetches fields and skills after initial load
  - search/save actions are compact side-by-side controls with `Save job` / `Update Job` wording
  - selected skills now store normalized option IDs for backend matching while summaries render readable labels
- Recruiter bookmarked candidates now have complete list actions:
  - bookmarked cards include Review, Contact, Shortlist, and Remove
  - Remove calls the backend bookmark delete route and updates the local bookmark list/count
- Applicant profile manual matching placement now follows the intended priority:
  - if resume/search recovery is needed, manual matching appears directly below Recruiter Preview
  - otherwise Profile Reels appears first and manual matching moves below it
  - the profile screen now requests applicant reels so the Profile Reels count can be shown there
- Android login no longer renders the dead-end Apple sign-in action:
  - password and Google sign-in remain available
  - shared auth contract support is left intact for future product decisions
- Applicant-owned profile reels now have stronger playback navigation:
  - thumbnail selection stores the active reel index
  - own reel playback supports previous/next controls
  - own reel playback supports swipe up/down
  - shared swipe handling now redraws the correct applicant or recruiter shell instead of always returning to recruiter UI
- Recruiter messages now match the intended thread model:
  - backend message records are grouped client-side into one card per applicant
  - the newest message remains the preview because backend messages arrive newest-first
  - unread state is preserved if any message in that applicant thread is unread
  - tapping the thread clears unread locally and opens the candidate conversation
- Recruiter candidate review decision controls now mirror the Swift state model:
  - current decision is shown in the center
  - left action toggles Pass/Maybe depending on current status
  - right action toggles Shortlist/Maybe depending on current status
  - Shortlist remains the prominent action when available
- Recruiter candidate review video stack is closer to Swift:
  - intro video renders as playable media instead of a plain card
  - deeper signal renders directly when available
  - profile reels render as 3-column thumbnails from the review screen
- Applicant-to-applicant public profile now respects the privacy boundary:
  - public applicant profile shows basic profile identity plus public videos
  - projects, internships, accomplishments, and resume remain recruiter-only surfaces
  - removed unused public proof-row state from the Android shell

## Verification

Attempted:

```sh
gradle test --offline
```

Blocked because this machine/session has no `gradle` command and `Native_Kotlin` has no Gradle wrapper. No dependency installation or network access was attempted.

Local static checks completed under the no-permission constraint:

- Kotlin brace/parenthesis balance scan over `src/main/kotlin` and `src/test/kotlin`.
- Forbidden dependency/import scan for Android/network/JSON libraries not already present.
- Swift core-model-to-Kotlin model parity scan; current result: `missing_core_models 0`.
- Swift `CatoAPIClient` literal API path inventory against Kotlin route builders; current result: `missing_in_kotlin_route_literals 0`.

Current local module inventory:

- 40 main Kotlin files.
- 25 Kotlin test files.
- 148 `@Test` declarations.

## Next Phase

1. Keep closing Android parity gaps through source-level implementation.
2. Continue recruiter candidate/profile/reels polish on Android.
3. Continue applicant profile/reels/settings polish on Android.
4. Replace any remaining neutral placeholder sections with conditional real-data rendering.
5. Defer heavier Android build/device validation to manual testing unless specifically requested.

## Candidate Action Parity Update

- Added Android selected-candidate bookmark and interest request state.
- Candidate detail hydration now reads `bookmarked` and `interestRequestStatus` from backend responses.
- Candidate review/profile actions now show guarded `Interest sent` and `Bookmarked` states instead of always looking fresh.
- Successful Android interest/bookmark actions update local candidate state immediately.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Profile Strength Detail Update

- Added Android profile-strength checklist state during applicant profile hydration.
- Applicant home `Profile strength` now opens a dedicated detail screen instead of only switching to the profile tab.
- The detail screen explains what contributes to strength and links directly to resume setup, reels, projects, internships, and manual matching fields.
- No build/test loop was run for this pass; manual verification is expected.

## Bottom Navigation Reels Treatment Update

- Confirmed Android nav order matches current product direction.
- Updated the shared Android shell so the center Reels item renders as a larger accent-circle action for both applicant and recruiter shells.
- Kept Search recruiter-only and Requests applicant-side.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Settings Account Summary Update

- Added an actionable applicant account summary card to Android settings.
- The card shows name, email, university, major, and semester, and opens the education editor.
- Kept education editable but not deletable into an empty state.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Candidate Profile Detail Update

- Added Android candidate profile facts from candidate detail hydration: semester, GPA, profile strength, resume/deeper signal, project and internship counts.
- Added candidate signal summary and soft signal rows to the Android candidate profile About section.
- Soft signal ratings are preserved when returned by the backend.
- Candidate profile now better mirrors Swift CandidateDetailTabs about/header content while keeping absent sections hidden.
- No build/test loop was run for this pass; manual verification is expected.

## Candidate Review Decision Accessibility Update

- Added Android Pass/Maybe/Shortlist controls near the top of candidate review, directly after recruiter actions.
- Kept the existing bottom decision controls for long-scroll workflows.
- This approximates Swift sticky decision accessibility without introducing a larger Android layout rewrite.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Reel Evidence Summary Update

- Preserved raw reel payloads in Android reel rows.
- Own/public/recruiter reel selection paths now carry the selected raw reel payload forward.
- Applicant owned-reel player now renders linked evidence metadata from `evidenceLinks`, `links`, or `linkedEvidence` when present instead of a static placeholder.
- Falls back to the reel evidence/source type when detailed link metadata is not present.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Reel Limit Parity Update

- Added Android UI enforcement for the 9 profile reel limit.
- Applicant reels screen now hides the upload entry and shows a limit-reached message when at capacity.
- Reel upload wizard now blocks publishing flow when the limit is reached and routes back to reels.
- Limit copy now shows remaining reel slots.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Dashboard And Comparison Update

- Recruiter dashboard metrics now read the backend `metrics` object explicitly.
- Added the dashboard interest-request count as first-class Android state.
- Interest-request list refreshes now update the dashboard request count.
- Recruiter settings now show recruiter account, company, email, account id, sign out, and delete account actions. Plan/subscription UI and manual event connection controls stay hidden for launch.
- Candidate comparison now hydrates selected shortlist candidates with candidate-detail payloads before rendering comparison columns when possible.
- Comparison cards now prefer detailed project, internship, resume, score, GPA, and evidence data over shortlist summary rows.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Recruiter Preview Action Update

- Applicant recruiter preview now shows direct add actions when the intro video is missing.
- Applicant recruiter preview now shows direct add actions when the deeper signal is missing.
- These actions reuse the existing native Android signal/deeper video picker and upload flow instead of sending applicants to a generic proof/reel flow.
- Existing resume, project, internship, accomplishment, and reel preview behavior was preserved.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Reels Action State Update

- Recruiter reels now hydrate selected candidate interest/bookmark state from the current reel row payload when present.
- The reel action row now shows `Interest sent` instead of a fresh `Interest` action when the backend row already indicates a sent/viewed request.
- `Interest sent` now behaves as a guarded status action and does not send another request.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Dashboard Interest Preview Update

- Recruiter dashboard now loads interest requests alongside dashboard metrics and quick searches.
- The dashboard shows up to four recent interest request cards, mirroring the Swift dashboard flow.
- A `View all requests` button appears when more than ten requests exist.
- Dashboard request cards and the full interest request list now share the same tap behavior.
- Accepted requests open the conversation; pending/other requests open candidate review and hydrate candidate details.
- No build/test loop was run for this pass; manual verification is expected.

## In-App Resume Preview Update

- Added a native Android resume preview route backed by `WebView`.
- Candidate resume actions now open the resume inside the app first instead of immediately launching an external browser.
- Applicant own-resume preview actions now use the same in-app preview route.
- The preview screen keeps an `Open externally` fallback for links that need the browser/PDF handler.
- Resume preview back navigation returns to the screen that opened the preview.
- Non-resume evidence links still use the existing external URL opener.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Quick Search Result Flow Update

- Android recruiter dashboard Quick Search cards now apply the saved search and immediately run runtime matching.
- This mirrors the Swift dashboard behavior where quick-search pills open ranked results directly.
- The selected saved search still loads into the dynamic search editor so recruiters can update it afterward.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Search Collapse Update

- Added Android recruiter dynamic-search collapsed state.
- After running a runtime search, the long filter builder collapses into a `Search filters` summary card so ranked candidates are easier to see.
- Tapping the summary expands the filter builder again for edits.
- Resetting the search expands the builder again.
- Quick Search dashboard cards also collapse the builder after loading and running the saved search.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Proof Metadata Edit Update

- Android project edit flows now preserve project `type` and optional link URL from the backend row payload.
- Android internship edit flows now preserve company, role/department, and duration from the backend row payload.
- Generic proof row parsing now recognizes `company` and `roleDepartment` fields so internship cards display more useful text.
- These changes better mirror the Swift project/internship manager sheets.
- No build/test loop was run for this pass; manual verification is expected.

## Login Password Field Update

- Android login password input now uses password text variation instead of a plain text field.
- Manual email/password login behavior is unchanged.
- Google OAuth PKCE flow remains unchanged.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Reels Profile Polish Update

- Android applicant reels now opens like a profile surface instead of a debug-style list.
- The screen now prioritizes applicant identity, reel/view/like stats, a `Post reel` action, and the owned reel thumbnail grid.
- Public applicant video discovery remains available lower on the screen as `Explore applicants`.
- Removed the prominent public-feed refresh action from the top area to keep the reels tab focused on the applicant profile.
- Reel publishing now labels the upload path as `Choose from gallery`.
- Added a `Record` entry point that opens Android's native system video recorder and validates the returned clip before upload.
- No build/test loop was run for this pass; manual verification is expected.

## Android Camera Recording Update

- Onboarding short-take video now supports `Record short take` through Android's system video recorder with a 10-second capture limit.
- Onboarding deeper-signal video now supports `Record deeper video` through Android's system video recorder with a 30-second capture limit.
- Applicant reel publishing now supports `Record` through Android's system video recorder with a 60-second capture limit.
- Recorded clips reuse the same existing video validation and upload paths as gallery-selected videos.
- Cancelling recording or gallery selection clears pending signal state and returns to the correct onboarding/applicant screen.
- Android manifest includes a narrow video-capture `<queries>` declaration so the app can detect an installed camera recorder on Android 11+ without adding custom camera dependencies.

## Recruiter Candidate Video Order Update

- Candidate review no longer renders decision controls twice inside the review body.
- Candidate review now surfaces intro video, deeper signal, and profile-reel thumbnails before resume/evidence/proof sections.
- Candidate profile now places intro and deeper signal before the about/details section so the recruiter-facing profile starts with video proof.
- Existing 3-column profile reel thumbnail behavior is preserved.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Reel Count Hydration Update

- Applicant-owned reel hydration now reads backend `viewCount`/`views` and `likeCount`/`likes`.
- Reels profile stats now have real row data to sum instead of defaulting to zero-count badges.
- Owned reel grid thumbnails now include the reel count badge below the caption/title.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Reel Evidence Creation Parity Update

- Android reel publishing now uses type-specific evidence creation instead of one generic title/description form.
- Project evidence creation now captures project type and optional link URL before linking it to the pending reel.
- Internship evidence creation now captures company, role area, and duration in months before linking it to the pending reel.
- Accomplishment evidence creation now captures title, description, and optional link URL before linking it to the pending reel.
- Clearing the reel draft now also clears evidence draft metadata for project/internship/accomplishment creation.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Home Action Parity Update

- Applicant home `Recruiter Preview` now opens the actual recruiter-preview route instead of only switching to the profile tab.
- This mirrors the iOS behavior where recruiter preview is a direct action, not a vague navigation hint.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Reel Profile Action Update

- Recruiter reel viewer now presents the profile-opening card with the candidate name instead of the current video title.
- Opening the profile from a reel now carries that candidate name forward before rendering the recruiter candidate profile.
- Existing play/pause, swipe up/down, right-swipe-to-deeper, interest, like, and contact actions were preserved.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Candidate Sticky Decision Update

- Android candidate review now returns a framed layout with scroll content plus a sticky bottom decision bar.
- Pass / Maybe / Shortlist stays available above the bottom navigation while the recruiter scrolls candidate evidence.
- Removed the in-scroll duplicate decision section from candidate review content.
- Added extra bottom padding to the scroll content so proof/evidence rows are not hidden behind the sticky decision controls.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Onboarding Education Parity Update

- Android applicant onboarding now lets first-time applicants enter university directly in the education step.
- Added semester shortcut selection to the onboarding education step instead of only showing a static education card.
- Selecting a semester preserves the typed university value across the screen redraw.
- Added the missing `Graduate student` semester option to match Swift.
- Recruiter dynamic-search semester filters now also include `Graduate` separately from `Year 5+`, `Graduating`, and `Graduated`.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Onboarding Final Profile Update

- Android final onboarding step now collects editable name, optional GPA, major, and optional minor before finishing the profile.
- University and semester are shown as saved education context instead of being silently reused from state.
- Added validation for required name, saved education, and GPA range before calling the complete-profile endpoint.
- This better mirrors Swift's final profile form while preserving the existing manual-matching recovery prompt.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Public Reel Navigation Fix

- Applicant public reel `Previous` and `Next` actions now redraw the shell after moving the active reel index.
- This makes button-based public reel navigation behave like swipe navigation.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Onboarding Resume Failure Route Fix

- Resume picker launch failures now return to onboarding when the picker was opened from onboarding.
- Resume PDF read/validation failures now also return to onboarding instead of dropping the applicant into the main shell.
- Non-onboarding resume upload failures still return to the applicant shell as before.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Signal Video Duration Guard Update

- Android now validates short take videos locally before upload: 3 to 10 seconds when duration metadata is readable.
- Android now validates deeper signal videos locally before upload: 30 seconds or shorter.
- Existing server-side upload preparation checks remain in place for file size and server-provided duration limits.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Candidate Floating Actions Update

- Android candidate review now adds a top floating Interest / Bookmark / Contact action group.
- The floating group is hidden at the top of the review and becomes visible after the candidate review scrolls down.
- This mirrors the Swift recruiter review behavior where the decision action card remains in the body, while the core recruiter actions stay reachable after scrolling.
- No build/test loop was run for this pass; manual verification is expected.

## Settings Event Stream Cleanup

- Removed recruiter and applicant settings cards that exposed manual `Connect events` controls.
- Event streaming is already started from the Android shells, matching Swift's hidden/best-effort SSE behavior.
- Settings now stays focused on account information, education/resume controls where relevant, sign out, and delete account.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Reels Surface Parity Update

- Replaced the Android recruiter reels card-style player with a fuller reel surface: black video backdrop, overlay title/counts, candidate identity, and vertical action rail.
- When recruiter reels are loaded, the tab now prioritizes the reel surface itself instead of rendering a header, refresh button, and duplicate action rows above/below it.
- Tapping the reel toggles playback and records a view when playback starts.
- Swipe up/down still moves between applicant clips.
- Swipe right on an intro clip opens that applicant's deeper signal when available.
- Swipe left on a deeper signal returns to that applicant's intro clip when available.
- Recruiter actions are available directly on the reel surface: Like, Interested/Sent, and Profile.
- No build/test loop was run for this pass; manual verification is expected.

## Login Role Selector Polish

- Android login role selection now renders as one segmented pill container rather than two separated buttons.
- Selected role uses the Cato purple fill and white text; unselected role keeps dark text on the light segmented background.
- This better mirrors the Swift native segmented control styling.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Candidate Decision Bar Compacting

- Android candidate review now has both full and compact sticky decision bars.
- At the top of the review, Pass / Maybe / Shortlist render with full labels.
- After scrolling past the same threshold that reveals the floating Interest / Bookmark / Contact actions, the decision controls collapse to compact P / M / S labels while keeping the current status visible in the middle.
- This mirrors the Swift candidate review behavior where recruiter actions become less visually heavy after scrolling into evidence.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Accomplishments Manager Update

- Added a native Android applicant accomplishments manager route from the Profile tab.
- Applicants can now view current accomplishments and create a new accomplishment with title, description, and optional link outside the reel upload wizard.
- Existing accomplishments can still be selected from this manager to continue into reel publishing as linked evidence.
- Update/delete was not added because the current shared Android API contract only exposes accomplishment creation, not accomplishment update/delete endpoints.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Dynamic Search Floating Actions Update

- Android recruiter dynamic search now uses bottom sticky Search / Save job actions instead of placing search/save inside the filter builder.
- The scroll content now has extra bottom padding so ranked results are not covered by the sticky controls.
- Running search still collapses the filter builder into the summary card before showing ranked candidates.
- Search name now updates as the recruiter types, so the bottom Save job / Update Job action uses the visible name without a separate draft-save button.
- No build/test loop was run for this pass; manual verification is expected.

## Matching Search Input Cleanup

- Removed the extra `Apply search` buttons from recruiter dynamic search field/skill inputs and applicant manual matching field/skill inputs.
- The same single input now handles searching/adding: pressing the keyboard Search/Done action applies the typed query and redraws the filtered options.
- Clear/reset controls remain visible, but the search/add sections no longer require a second search input or a separate apply step.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Reel Caption Draft Cleanup

- Android reel publishing now keeps the caption draft in sync as the applicant types.
- Removed the extra `Save caption draft` button from the publish wizard.
- The final publish action still reads the visible field value, so the latest caption is used even if the user immediately publishes after typing.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Search Summary Compaction

- Android recruiter dynamic search summary now caps long multi-select sections to two visible labels plus a `+n` suffix.
- Fields, required skills, boosted skills, and semesters now stay readable in the current-search and collapsed-search cards.
- This is display-only and does not change the runtime matching request sent to the backend.
- No build/test loop was run for this pass; manual verification is expected.

## Settings Delete Confirmation Parity

- Recruiter and applicant settings no longer delete accounts immediately from the first tap.
- Tapping `Delete account` now reveals an in-screen confirmation card with Cancel and Delete actions.
- Confirmation state is cleared when loaded app state is reset, so it does not leak across sign-out/sign-in.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Search Selection Feedback

- Android recruiter dynamic search now marks the selected employment type with the same checkmark pattern used by graduation, GPA, semester, field, and skill filters.
- This is a UI feedback-only change and does not alter matching payloads.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Education Editor Guardrails

- Android applicant education semester shortcuts now update the visible semester fields in place instead of redrawing the whole screen and wiping unsaved text.
- Saving education now requires a major, alongside name, university, and a valid semester, so the profile cannot be saved into an incomplete education state.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Launch Settings Cleanup

- Removed visible plan/subscription text from Android recruiter settings for launch.
- The existing hydrated plan state remains untouched for future subscription UI, but it is no longer displayed in settings.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Recruiter Preview Reels Grid

- Android applicant recruiter preview now shows owned profile reels as a thumbnail grid, matching the recruiter-facing profile model.
- Recruiter preview requests applicant reels directly, so the grid does not depend on visiting the Reels tab first.
- Tapping a preview reel opens the applicant-owned reel player with the selected reel loaded.
- The preview no longer depends on a stale globally selected reel URL to show reel content.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Candidate Reel Thumbnail Context

- Candidate review and candidate profile reel thumbnails now show reel title plus badge/source context when available.
- This makes recruiter-facing 3-column reel grids closer to the applicant profile grid and easier to scan.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Profile Refresh Coverage

- Android applicant profile refresh now reloads the main profile, owned reels, and accomplishments together.
- This keeps the profile cards, recruiter preview entry point, and proof/reel sections synchronized after edits.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Profile Accomplishment Routing

- Tapping an existing accomplishment card from the applicant profile now opens the accomplishments manager.
- Profile-level accomplishment cards no longer force the applicant into reel upload/linking; reel upload still has its own evidence-linking flow.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Home Refresh Coverage

- Android applicant home refresh now reloads profile, resume status, manual search profile, and owned reels together.
- This keeps dashboard profile-strength, manual matching, resume, and reel indicators from staying stale after edits elsewhere.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Resume Preview Availability

- Android resume extraction now shows `Open uploaded resume` only when an applicant resume URL exists.
- Without a resume URL, the screen shows a non-actionable preview-unavailable card instead of a button that only reports an error.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Dashboard Refresh Coverage

- Android recruiter dashboard refresh now reloads dashboard metrics, saved quick searches, and interest requests together.
- This keeps the dashboard cards, metrics, and request carousel/list aligned after recruiter activity.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Accepted Request Detail Action

- Applicant request detail now supports local actions in addition to backend request actions.
- Accepted interest-request detail shows `Open conversation`, routing directly into the accepted recruiter conversation.
- Pending requests still show Accept/Decline backed by the existing response endpoint.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Candidate Action Consistency

- Android candidate review now centralizes Interest, Bookmark, and Contact behavior through shared helper actions.
- Floating top actions, in-body candidate actions, and generic action rows now share the same already-sent/already-bookmarked guards.
- This reduces drift from Swift behavior where bookmarked candidates cannot be bookmarked again and sent interest requests cannot be duplicated.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Recent Visibility Surface

- Android applicant home now stores and renders the `recent` list from `/applicant/activity`.
- The dashboard now mirrors Swift's Recent visibility card with up to four recruiter visibility events.
- Empty recent activity shows explanatory copy instead of silently dropping the section.
- No build/test loop was run for this pass; manual verification is expected.

## Empty State Copy Cleanup

- Replaced remaining debug-style `No ... loaded` Android UI copy with user-facing empty states.
- Recruiter bookmarks, evidence queue, shortlist, dynamic search fields/skills/results, recruiter reels, applicant manual matching options, and applicant public videos now describe the actual next action or expected state.
- No build/test loop was run for this pass; manual verification is expected.

## Generic Action Fallback

- Android shared action rows no longer render unsupported actions as silent no-op buttons.
- If an unknown action label reaches the generic renderer, the app now surfaces a status message and redraws the current role shell.
- No build/test loop was run for this pass; manual verification is expected.

## Messages And Requests Copy Pass

- Recruiter messages, recruiter interest requests, and applicant requests now use product-facing empty copy instead of first-load/stale-list language.
- Applicant request card click handling remains the same but is now formatted clearly around unread clearing, request selection, and conversation/detail routing.
- Recruiter messages already group to one row per applicant and bold unread rows; this pass preserved that behavior.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Request Badge Hydration

- Android applicant home now requests applicant interest requests on first dashboard load.
- Applicant home refresh now reloads requests after profile, resume, search profile, and reels so the bottom-nav unread badge does not depend on visiting the Requests tab first.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Settings Hydration

- Android applicant settings now requests profile, resume status, and manual matching/search-profile state when opened.
- Settings now exposes Manual matching fields directly, so failed or missing resume extraction has the same recovery path from settings as from profile/home.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Fallback Copy Cleanup

- Android applicant preview/settings no longer expose internal `not loaded` language for missing education, account, resume, or manual matching state.
- Empty applicant account/education values now use product-facing `not set` or action-oriented copy.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Profile Resume Action

- Android applicant profile now requests resume state alongside profile, reels, and accomplishments.
- Profile now shows a direct Resume/Add resume card that routes into resume extraction/upload recovery, matching Swift's recruiter-preview readiness flow.
- Profile refresh now reloads resume state too, so the resume card can update after upload or extraction changes.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Recruiter Preview Hydration

- Android applicant recruiter preview now requests profile, resume, reels, and accomplishments when opened.
- Refresh preview now reloads all data the recruiter-facing preview depends on instead of only refreshing profile.
- This keeps resume availability, proof sections, and reel thumbnails current without requiring navigation through other applicant tabs first.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Reel Upload Limit Hydration

- Android reel upload wizard now requests applicant reels when opened before checking the 9-profile-reel limit.
- The wizard already auto-links newly created project, internship, or accomplishment evidence while in the reel-upload route; this pass preserved that behavior.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Candidate Hydration Retry Safety

- Android candidate review/profile no longer mark candidate detail or profile media as hydrated before the backend request succeeds.
- If the first automatic candidate detail/media request fails, reopening or redrawing the candidate screen can retry instead of being blocked by a stale hydrated ID.
- No build/test loop was run for this pass; manual verification is expected.

## One-Time Loader Retry Safety

- Android `requestOnce` screen loaders now reset their requested flag when the backend call fails or returns a non-success status.
- One-time loaders now hydrate app state only for successful responses, so error bodies cannot be parsed into visible screen state.
- Normal API action helpers now follow the same rule: state hydration happens only for successful responses.
- This prevents dashboard/profile/reels/messages/request screens from getting stuck in a stale first-load state after a transient failure.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Profile Missing Action Parity

- Android applicant profile now surfaces direct `Add short take` and `Add deeper signal` recovery cards when those recruiter-visible videos are missing.
- Applicant profile readiness flags now derive from the nested resume, signal, and soft-skills objects instead of broad raw JSON substring checks.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Media Mutation Freshness

- Successful short-take/deeper-signal uploads now update local readiness flags immediately and invalidate applicant profile hydration.
- Successful resume upload now updates local resume readiness and invalidates applicant resume/profile hydration.
- Reel publish, caption edit, caption clear, and delete now invalidate applicant reel/profile/public-feed hydration so profile/reel surfaces can refresh instead of staying stale.
- No build/test loop was run for this pass; manual verification is expected.

## Option Loader Retry Safety

- Recruiter search option preload, applicant manual matching option preload, signal prompt preload, and final-profile search status preload now hydrate only successful responses.
- Those preloaders now reset their one-time flags when one of their chained backend calls fails, allowing automatic retry on redraw.
- Retry flags are reset after the current redraw, not before it, to avoid immediate request loops on failed automatic loaders.
- No build/test loop was run for this pass; manual verification is expected.

## SSE Retry Safety

- Android recruiter/applicant event streams now clear their requested flag when the connection fails.
- This allows message/request badge SSE connections to retry after transient connection errors instead of staying permanently disabled for the role.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Proof Mutation Freshness

- Project, internship, and accomplishment create/edit/delete flows now invalidate dependent applicant profile, reel, public feed, and accomplishment state after successful mutations.
- Reel-upload evidence creation now uses success-only API callbacks before clearing drafts or linking evidence.
- Shared action-sheet proof deletes also invalidate profile proof state so recruiter preview and profile strength reload with current data.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Candidate Action Safety

- Recruiter interest, bookmark, shortlist, maybe, pass, evidence-queue, and shortlist-list actions now update local UI only after successful backend responses.
- Candidate action success invalidates dashboard, interest requests, bookmarks, shortlist, evidence queue, and reels state so related recruiter surfaces can refresh.
- Recruiter/applicant reel likes and public-reel view counts now increment locally only after the backend accepts the action.
- Recruiter and applicant message-send flows now refresh the thread only after the send endpoint succeeds.
- Recruiter Save job / Update Job now updates Quick Search state only after the backend save succeeds.
- Runtime search now collapses the filter panel only after the matching endpoint succeeds.
- Applicant manual matching save now updates warning/profile state only after the backend save succeeds.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Education Settings Parity

- Android applicant education editing now matches Swift: name, university, and semester are required, while GPA, major, and minor are optional metadata.
- Settings copy now explains that education can be changed without forcing optional degree fields.
- No build/test loop was run for this pass; manual verification is expected.

## Candidate Review Floating Actions Polish

- Android candidate review top floating Interest/Bookmark/Contact actions no longer sit inside a frosted/card row; only the buttons carry their own backgrounds.
- This matches the iOS polish direction where the floating controls replace the header area without adding an extra row container.
- No build/test loop was run for this pass; manual verification is expected.

## Recruiter Dashboard Carousel Parity

- Android dashboard Interest Requests now render as a horizontal carousel of up to four cards, matching the Swift dashboard flow.
- Android Quick Search now renders saved searches in a horizontal carousel of up to ten cards instead of stacking the dashboard vertically.
- No build/test loop was run for this pass; manual verification is expected.

## Runtime Match Audit Parsing

- Android `Why this match?` now reads both flat audit responses and nested Swift/backend-style `audit.score` responses.
- Audit rows now include strong reasons, weak/missing signals, and verification notes when the backend provides them.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Signal Upload Freshness

- Successful short-take/deeper-signal uploads now invalidate applicant reel, profile, and public-feed hydration together.
- Recruiter preview/profile video sections can now refresh after signal video replacement without relying on a separate manual reload path.
- No build/test loop was run for this pass; manual verification is expected.

## Applicant Resume Extraction Recovery

- Android resume upload now attempts deterministic local text extraction before uploading the PDF.
- When extracted text passes quality checks, Android saves it through the shared parsed-resume-text backend contract with known skills extracted from the text.
- PDF upload is no longer blocked by parser failure: scanned, image-based, or low-quality extraction cases still upload the resume and route non-onboarding applicants into manual matching fields.
- The failure copy now explains that manual fields keep the applicant searchable when resume text cannot be extracted.
- No build/test loop was run for this pass; manual verification is expected.

## Compose Material UI Foundation

- Added Jetpack Compose, Material 3, and Material Icons dependencies to begin replacing hand-built Android UI surfaces with library components.
- Replaced the custom `LinearLayout` bottom navigation shell with a Compose `Scaffold` and Material 3 `NavigationBar`/`NavigationBarItem` components.
- Existing View-based screens are embedded inside the Compose scaffold, so functionality remains intact while individual screens can be migrated incrementally.
- Bottom navigation remains icon-only and hides when the keyboard/IME is visible.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Compose Login And Onboarding Pass

- Native Android login is now rendered with Compose Material 3 `Surface`, `OutlinedTextField`, `Button`, `OutlinedButton`, `FilterChip`, and `Card` components.
- Applicant onboarding now uses a Compose Material 3 container/header/status area while keeping existing step-specific action blocks embedded for behavior safety.
- This starts replacing the handmade UI without rewriting auth or onboarding business logic.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Compose Onboarding Step Actions

- Replaced the live applicant onboarding step action block with Compose Material 3 controls.
- Education, resume, prompt selection, short take, deeper signal, deeper video, final profile, and profile-ready states now use Material cards, buttons, chips, and text fields.
- Existing API contracts, recording/video picker paths, resume picker path, prompt loading, and completion transitions were preserved.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Compose Applicant Home Pass

- Replaced the applicant home/dashboard surface with Compose Material 3.
- Recruiter Preview, Profile strength, Manual matching fields, and Profile Reels still route through the existing working destinations.
- Applicant stats and recent visibility now render as Material cards instead of handmade `LinearLayout` blocks.
- Refresh profile keeps the existing profile/resume/search/reel/request API chain.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Compose Applicant Profile And Reels Pass

- Replaced the applicant profile landing screen with Compose Material 3 cards while preserving existing recruiter preview, resume extraction, signal upload, manual matching, project, internship, and accomplishment routes.
- Replaced the applicant reels landing screen with Compose Material 3 cards for profile stats, posting, owned reels, and public applicant feed entries.
- Existing reel player and reel upload wizard remain on the current working flow for a later dedicated migration.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Compose Applicant Settings Pass

- Replaced the applicant settings landing screen with Compose Material 3.
- Account, education, resume extraction, manual matching, sign out, and delete-account actions preserve the existing behavior.
- Delete-account confirmation now renders as a Material card with explicit confirm/cancel actions.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Compose Applicant Requests Pass

- Replaced the applicant requests landing screen with Compose Material 3.
- Empty state, refresh, unread highlighting, request detail routing, and accepted-request chat routing preserve the existing behavior.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Applicant Home iOS-Parity Polish

- Reworked the authenticated applicant Home screen to follow the Swift `ApplicantHomeView` layout instead of the earlier bare Material stack.
- Home now uses the Cato header with notification indicator, profile-strength card with progress and checklist pills, metrics row, recruiter requests preview, and recent visibility card.
- Existing profile-strength routing, request routing, and activity/request data hydration were preserved.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Compose Activity Lifecycle Crash Fix

- Fixed startup crash `ViewTreeLifecycleOwner not found from ComposeView`.
- `MainActivity` now extends AndroidX `ComponentActivity`, which installs the lifecycle/view-tree owners required by Compose.
- Added `androidx.activity:activity-compose` dependency.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Android Messenger Conversation Pass

- Replaced recruiter and applicant conversation detail screens with a shared Compose messenger-style thread.
- Current-user messages align to the right; the other participant's messages align to the left.
- Conversation screens now use a dedicated header, message timeline, unread divider, composer row, and refresh action instead of rendering each reply as an isolated card.
- Bottom navigation now renders inside a pill-shaped container while preserving the existing icon-only behavior and keyboard hide behavior.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Canopas Animated Bottom Nav

- Added `com.canopas.compose-animated-navigationbar:bottombar:1.0.2` from Maven Central.
- Replaced the Material `NavigationBar` shell with Canopas `AnimatedBottomBar` using a filled animated indicator.
- Kept Cato's icon-only tab behavior, centered reels item, unread badges, warning badge, keyboard hide behavior, and existing routing.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Split Center Reels Bottom Nav

- Updated the shared Android bottom navigation to visually match the iOS split layout for both applicant and recruiter shells.
- The nav now renders as two left icons, a raised circular center Reels button, and two right icons.
- Existing Canopas animated selection, routing, unread badges, warning badge, and keyboard hide behavior were preserved.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Split Bottom Nav Backgrounds

- Split the shared Android bottom navigation background into three visual containers: a left Canopas pill for two icons, a standalone raised Reels circle, and a right Canopas pill for two icons.
- Preserved applicant and recruiter tab structure, existing routing, unread/warning badges, and keyboard hide behavior.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Android Chat UI Cleanup

- Removed the API status card from recruiter/applicant conversation screens to give the thread more space.
- Removed the visible `Refresh thread` action; conversations still load on open and reload after sending.
- Reworked the shared conversation screen into a cleaner Material 3 messenger layout with a compact header, avatar, bordered chat pane, aligned bubbles, and circular send action.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Android Messages List Polish

- Replaced the recruiter messages list with a Compose Material 3 thread list instead of handmade cards.
- Recruiter messages now show one row per applicant with avatar, latest preview, status badge, unread dot, and chevron navigation into the dedicated chat screen.
- Applicant requests now use the same thread-row component; accepted requests open chat, pending/declined requests open request detail.
- Preserved unread behavior: rows become read when opened and unread counts update locally.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Android Recruiter Dynamic Search Polish

- Replaced the recruiter dynamic search screen with a Compose Material 3 implementation instead of custom View cards/buttons.
- Search filters now use Material cards, outlined text fields, filter chips, selected summaries, and Material result cards.
- Preserved existing runtime matching, save/update search, add field/skill option, reset, collapsed-summary, and candidate-review routing behavior.
- Ranked candidates now render as tappable Material result rows with avatar initials, score badge, and chevron navigation.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Android Home iOS-Parity Pass

- Replaced the recruiter home/dashboard custom View implementation with a Compose Material 3 layout mirroring the Swift `RecruiterDashboardView`.
- Recruiter home now uses the shared Cato header, dynamic search hero, three metric cards, Evidence Queue/Shortlist shortcuts, Quick Search card, and Interest Requests card.
- Removed Android-only visible refresh/status controls from recruiter home.
- Applicant home now uses the same shared Cato header and no longer shows transient API status on the home surface.
- Preserved existing dashboard, quick search, interest request, search routing, evidence queue, shortlist, and conversation behavior.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Android Requests iOS-Parity Pass

- Replaced the recruiter Interest Requests detail screen with Compose Material 3 request cards instead of custom View cards.
- Removed visible refresh/status controls from recruiter requests.
- Applicant Requests now use iOS-like request cards with avatar initial, status badge, unread emphasis, request reason, and inline Accept/Decline actions for pending requests.
- Accepted applicant requests show a conversation cue and open the dedicated chat screen.
- Preserved existing request list loading, recruiter candidate-review routing, applicant accept/decline API calls, and conversation routing.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Android Candidate Review/Profile iOS-Parity Pass

- Replaced the main recruiter Candidate Review and Candidate Profile visible surfaces with shared Compose Material 3 screens.
- Removed Android-only visible refresh/status controls from candidate review/profile.
- Candidate review now mirrors the iOS hierarchy: top bar, candidate header, Why this match action, recruiter action row, intro/deeper media, profile reel thumbnails, resume, evidence/projects/internships/accomplishments/soft-signal sections, and bottom decision controls.
- Missing profile sections are omitted instead of showing placeholder "No X" blocks.
- Preserved existing candidate hydration, media hydration, runtime audit, interest, bookmark, contact, resume open, video open, and pass/maybe/shortlist APIs.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Android Applicant Profile iOS-Parity Pass

- Reworked the applicant Profile tab into a Compose Material 3 layout mirroring Swift `ApplicantProfileView`.
- Profile now renders identity/education first, then recruiter preview readiness, prioritized manual matching setup when resume search is not ready, profile reels, soft skills, projects, and internships.
- Removed Android-only visible refresh/status controls from the profile surface.
- Preserved existing routing to recruiter preview, manual matching fields, reels, project manager, internship manager, and education editing.
- Reels preview now shows horizontal proof-video thumbnails and opens the existing reel player.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Android Applicant Reels Polish Pass

- Reworked the applicant Reels tab toward the Swift `ApplicantReelsView` structure.
- Reels now use a profile-style header with avatar, name, education/email subtitle, and Reels/Views/Likes stats.
- Replaced the list-style owned reels with a 3-column thumbnail grid that opens the existing owned reel player.
- Added a focused Create Reel card that routes to the existing publish wizard and respects the 9-reel limit.
- Removed visible refresh/status controls from the Reels tab.
- Kept applicant public discovery available as a compact horizontal reel strip.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Android Applicant Settings Polish Pass

- Reworked applicant Settings into a Swift-like account-first layout.
- Settings now shows an identity/education summary card that routes to education editing.
- Grouped profile utilities into a Profile card: education, resume extraction, and manual matching fields.
- Grouped sign out and delete behavior into Account and Danger Zone cards.
- Removed the plain stacked action-card feel while preserving existing education, resume extraction, manual matching, sign out, and delete routes.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Android Applicant Reel Wizard/Player Polish Pass

- Researched Android-native media/UI options before the pass:
  - AndroidX Photo Picker is the right library-backed gallery path for selected media access.
  - CameraX is the right future upgrade for an in-app recorder instead of delegating to the system camera intent.
  - AndroidX Media3/ExoPlayer is the right future upgrade for robust video playback instead of platform `VideoView`.
  - Material 3 is already available locally and was used for the current UI polish without adding network-installed dependencies.
- Replaced the owned reel player custom View layout with a Compose Material 3 screen.
- Replaced the reel upload wizard custom View layout with a Compose Material 3 wizard.
- The wizard now has structured video/caption, linked evidence, evidence creation, draft clearing, and floating publish behavior.
- Preserved existing choose video, record video, upload, create/link evidence, caption update, and delete APIs.
- Verified with `./gradlew :app:compileDebugKotlin`.

## Android Manual Matching Chip Polish

- Limited applicant manual matching field/skill options into horizontally scrollable 6-option carousel pages.
- Reduced manual option chip font size and tightened chip padding for better density.
- Selected fields/skills now render with a light lavender selected-chip style.
- Cleaned matching labels so stored values like `business_analytics` display as readable labels with spaces.
- Verified with `./gradlew :app:compileDebugKotlin`.
