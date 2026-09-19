# Cato Application Handoff

## 1. Product Summary

Cato is a mobile-first two-sided recruiting application. The POC is applicant-first, with a lightweight recruiter surface for demoing candidate discovery after applicant profiles are complete.

The applicant experience centers on university eligibility, resume upload, short-form video responses, POC soft-skill signals, and a minimal academic/professional profile.

## 2. POC Scope

### In Scope

- React Native mobile POC for iOS and Android.
- Android Google developer account scope for now.
- Applicant authentication through Google using Supabase OAuth.
- Applicant onboarding flow.
- US university selection and normalization.
- Resume upload or no-resume path.
- Cloudinary storage for resumes and videos.
- Dummy randomized soft-skill output for the POC.
- Mandatory 10-second signal video.
- Optional 30-second deeper signal video.
- Applicant profile form.
- Placeholder home screen.
- Profile/settings CRUD.
- Account deletion.
- MongoDB-backed applicant profile and onboarding data.
- Recruiter email/Google auth using the same Supabase identity layer.
- Recruiter dashboard, video feed, candidate detail, bookmarks, basic search, interest requests, messages log, and account deletion.
- Recruiter interest request flow before messaging.
- Applicant request inbox with accept/decline.
- SSE-backed foreground notifications for interest request events.
- MongoDB-backed notification records and seen/unseen counts.
- Recruiter dashboard interest request status section.
- WebSocket-backed recruiter message refresh for accepted-request messaging.
- Single-role enforcement: one Supabase account can be either applicant or recruiter, not both.
- Railway-hosted backend.

### Out of Scope

- Job postings.
- Matching.
- Production-grade threaded messaging/conversations.
- Recruiter company setup.
- Recruiter subscription/billing.
- Admin tooling.
- Apple sign-in.
- LinkedIn sign-in.
- LinkedIn resume import.
- Redis caching implementation.
- App Store/TestFlight readiness.
- Data export, unless later added explicitly.

## 3. Core Product Principles

- Mobile first.
- Applicant first.
- Keep the POC simple.
- Never block a screen while prior background processing is still running.
- Preserve onboarding progress so partially onboarded users resume from the correct step.
- Do not allow partially onboarded users into the home screen.
- Use structured datasets and controlled lists where practical.
- Avoid inferring or displaying sensitive personal traits.

## 4. Recommended Technical Stack

### Mobile

- Expo + React Native + TypeScript for the POC.
- Expo Router for mobile navigation.
- Later native Swift and Kotlin ports are expected but out of current scope.

### Backend

- Fastify + TypeScript.
- Zod for request validation.
- MongoDB native driver for data access.
- Supabase Auth for OAuth identity only.
- Cloudinary for file and video storage.
- Dummy randomized soft-skill output for the POC.
- Railway for backend hosting.

Fastify is recommended because it is lightweight, performant, simpler than NestJS, and common enough for reliable AI-assisted development.

### Monorepo

- Use npm workspaces for the POC.
- Root workspace layout:
  - `apps/mobile`
  - `apps/api`
  - `packages/shared`

### Data Ownership

- Supabase is the source of truth for authentication identity.
- MongoDB is the source of truth for application profile, onboarding, media metadata, prompt selection, and dummy soft-skill output.
- MongoDB applicant records must store the Supabase user UUID.
- Cloudinary stores resume and video assets.
- Redis is future scope.

## 5. Authentication And Eligibility

### Current Auth

- Google sign-in only.
- Apple and LinkedIn auth must be hidden in the POC UI.

### Eligibility Rules

- `.edu` email is preferred but not strictly required for the POC.
- If the authenticated email domain maps to a university in the standardized university dataset:
  - Auto-select the university.
  - Applicant must still select their semester.
- If the domain does not map to a university:
  - Explicitly ask the applicant to select their university.
  - Explicitly ask the applicant to select their semester.
- Non-`.edu` emails are allowed for now only if the applicant selects a US university and semester.
- If no university domain match exists, the app must not guess.

## 6. University Dataset

Use an authoritative US Department of Education source.

Recommended source:

- IPEDS / NCES institution data as the authoritative US higher education source.
- College Scorecard data may be used as a developer-friendly dataset/API layer derived from Department of Education data.

References:

- IPEDS: https://nces.ed.gov/ipeds/
- College Scorecard dataset: https://catalog.data.gov/dataset/college-scorecard

### Dataset Requirements

For the POC, maintain a normalized static snapshot in the repo or database.

Each university record should support:

- `unitId`
- `name`
- `aliases`
- `domains`
- `city`
- `state`
- `normalizedSearchText`

### Normalization Requirements

- Support common aliases and abbreviations.
- Examples:
  - `UCLA` -> `University of California, Los Angeles`
  - `UC Berkeley` -> `University of California, Berkeley`
  - `NYU` -> `New York University`
- Search should handle case-insensitive matching.
- Search should tolerate punctuation and whitespace differences.

### POC Search Behavior

- The university screen must not render the full university dataset by default.
- For the current POC, default university suggestions should show only the top 3 records.
- Applicants must use search to find all other universities.
- University search must support pagination parameters so the API can scale beyond the initial dataset without returning the full list.

### Immediate Post-POC Requirement

After the core POC is complete and before POC deployment, expand the university dataset to at least 100 US universities and add GPS-based nearby university suggestions.

Nearby university behavior:

- Request device location permission only on the university selection screen.
- Use the applicant device GPS location to rank nearby universities from the standardized university dataset.
- Show only the top 3 nearest universities as default suggestions.
- Do not render the full list by default.
- All other universities must be found through paginated search.
- Search should remain server-side/search-index friendly to avoid mobile rendering overhead and backend response bloat.

## 7. Applicant Onboarding Flow

### Step 1: Sign In

- Applicant signs in with Google.
- Supabase returns the authenticated identity.
- Backend creates or loads the MongoDB applicant record using the Supabase UUID.

### Step 2: University And Semester

Required if the email domain does not map to a university.

If domain maps successfully:

- University is prefilled and locked or clearly selected.
- Applicant still selects semester.

If domain does not map:

- Applicant selects a US university from the normalized dataset.
- Applicant selects semester.

### Step 3: Resume

Applicant chooses one:

- Upload resume.
- Continue with no resume.

Allowed file types:

- PDF.

POC max file size:

- 10 MB.

Storage:

- Cloudinary.
- Path convention: `user_id/resume/file1.pdf`.

POC soft-skill generation:

- Uses dummy randomized soft-skill output.
- Does not call Gemini or any functional AI provider.
- Should still be treated like async background processing so the product flow matches the future architecture.
- Must not block the next onboarding screen.
- Dummy output is not editable during onboarding.
- Dummy output can be edited after onboarding from profile/settings.

### Step 4: What's Your Signal?

- Applicant selects one backend-configured prompt.
- Applicant cannot create a custom prompt.

Initial POC prompts:

- What's your hot take?
- What's a hill you'd die on?
- What's something people misunderstand about you?
- What's a problem you love solving?
- What's a rule you think should be broken?
- What's a moment that changed how you work?

### Step 5: 10-Second Signal Video

- Mandatory.
- Prompt appears on the recording screen.
- Video must be portrait.
- Max resolution: 1080p.
- Preferred delivery format: HLS where supported by Cloudinary workflow.
- Duration limit: 10 seconds.
- Applicant can retake before submitting.
- Once submitted, upload immediately.
- Path convention: `user_id/video/10_sec_vid_id`.
- If the applicant retakes the video, delete the prior submitted 10-second video from Cloudinary.

After this upload succeeds, the applicant is considered a created user, but onboarding is still incomplete.

### Step 6: Go Deeper Into Your Signal

Screen title:

- `Go deeper into your signal`

If dummy soft-skill generation has completed:

- Show dummy soft-skill output.

If no resume was uploaded or dummy soft-skill generation is not complete:

- Show: `It was great to know you a bit better`

This screen explains that the next optional step is a 30-second video where the applicant can go deeper into a subject, topic, or personal signal.

Buttons:

- `Go deeper into my signal`
- `Skip for now`

### Step 7: Optional 30-Second Video

Triggered by `Go deeper into my signal`.

- Optional during onboarding.
- Encouraged later from profile if skipped.
- Duration limit: 30 seconds.
- Portrait.
- Max resolution: 1080p.
- Preferred delivery format: HLS where supported.
- Upload immediately after recording.
- Path convention: `user_id/video/30_sec_vid_id`.

### Step 8: Welcome Profile Form

Screen title:

- `Welcome {Name}`

Subtitle:

- `Let's get you settled`

Collect minimal recruiter-relevant academic and early-career information.

Fields:

- University.
- Semester label.
- Semester number.
- GPA.
- Major.
- Minor, optional.
- Internships, zero or more.

Internship fields:

- Company.
- Duration in months.
- Role/department.

Field behavior:

- Semester is selected through standardized options and stored as a number.
- GPA uses a 4.0 scale.
- Major is a freeform searchable select.
- Minor is a freeform searchable select.
- Multiple internships are allowed.
- Internship duration is stored in months.
- Internship role/department uses a controlled list.
- Internship company can be freeform text.

Suggested role/department list:

- Engineering.
- Product.
- Design.
- Marketing.
- Sales.
- Finance.
- Operations.
- Data.
- Research.
- HR.
- Legal.
- Customer Success.
- Other.

### Step 9: Home

- Show a placeholder home screen.
- User reaches home only after onboarding is complete.

### Step 10: Profile/Settings

- User can view and edit profile data.
- User can edit dummy soft-skill output after onboarding.
- User can upload/change resume.
- User can retake videos.
- User can complete the optional 30-second deeper signal video if skipped.
- User can delete account.

## 8. Onboarding Progress States

Track onboarding progress in MongoDB.

Recommended ordered states:

- `auth_complete`
- `education_complete`
- `resume_complete`
- `signal_prompt_selected`
- `signal_video_uploaded`
- `deeper_signal_seen`
- `deeper_video_skipped`
- `deeper_video_uploaded`
- `profile_form_complete`
- `onboarding_complete`

Routing rules:

- If onboarding is incomplete, resume from the next required incomplete step.
- If the 30-second video was skipped, continue to the profile form.
- If onboarding is incomplete, block access to home.
- If onboarding is complete, route to home.

## 9. POC Soft-Skill Output

### Provider

- No functional AI provider in the POC.
- Gemini integration is deferred.

### Timing

- Dummy randomized soft-skill generation after resume upload.
- Keep the behavior async-shaped so it can later be replaced by real AI parsing without changing the user flow.
- Do not block onboarding screens.

### Output

Only soft-skill-style items should be shown.

Each soft-skill item should include:

- `label`
- `rating`, integer from 1 to 5
- `evidence`
- `confidence`, one of `low`, `medium`, `high`

Example:

```json
{
  "label": "Communication",
  "rating": 4,
  "evidence": "Dummy POC signal generated for onboarding preview.",
  "confidence": "medium"
}
```

### Sensitive Trait Policy

Even for dummy output, the system must not generate, label, score, or summarize sensitive traits, including:

- Race.
- Ethnicity.
- Religion.
- Gender identity.
- Sexuality.
- Disability.
- Health status.
- Political views.
- Nationality or immigration status.
- Age.
- Socioeconomic status.

When real AI parsing is added later, sensitive resume information must be ignored for scoring.

## 10. Media Storage

Cloudinary folder convention:

- Resume: `user_id/resume/file1.pdf`
- 10-second video: `user_id/video/10_sec_vid_id`
- 30-second video: `user_id/video/30_sec_vid_id`

Requirements:

- Store Cloudinary public ID and secure URL in MongoDB.
- Store upload status.
- Store duration for videos.
- Store file type and original file name for resumes.
- Delete replaced videos and resumes when appropriate.
- Delete all user assets on account deletion.

## 11. Data Model Draft

### Applicant

```ts
type Applicant = {
  _id: ObjectId;
  supabaseUserId: string;
  email: string;
  name?: string;
  authProvider: 'google';
  onboardingStatus: OnboardingStatus;
  onboardingCompletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
```

### Education Profile

```ts
type EducationProfile = {
  applicantId: ObjectId;
  universityUnitId?: string;
  universityName: string;
  universityMatchedFromEmail: boolean;
  semesterLabel: string;
  semesterNumber: number;
  gpa?: number;
  major?: string;
  minor?: string;
  updatedAt: Date;
};
```

### Resume

```ts
type Resume = {
  applicantId: ObjectId;
  cloudinaryPublicId: string;
  secureUrl: string;
  originalFileName: string;
  fileType: 'pdf';
  fileSizeBytes: number;
  softSkillGenerationStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  uploadedAt?: Date;
  updatedAt: Date;
};
```

### Signal Prompt

```ts
type SignalPrompt = {
  _id: ObjectId;
  text: string;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};
```

### Applicant Signal

```ts
type ApplicantSignal = {
  applicantId: ObjectId;
  promptId: ObjectId;
  promptTextSnapshot: string;
  tenSecondVideo?: MediaAsset;
  thirtySecondVideo?: MediaAsset;
  thirtySecondVideoSkipped: boolean;
  updatedAt: Date;
};
```

### Media Asset

```ts
type MediaAsset = {
  cloudinaryPublicId: string;
  secureUrl: string;
  durationSeconds: number;
  maxResolution: '1080p';
  orientation: 'portrait';
  uploadedAt: Date;
};
```

### Soft Skill Output

```ts
type AiSoftSkillOutput = {
  applicantId: ObjectId;
  source: 'dummy' | 'resume';
  provider: 'none' | 'gemini';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  items: Array<{
    label: string;
    rating: 1 | 2 | 3 | 4 | 5;
    evidence: string;
    confidence: 'low' | 'medium' | 'high';
  }>;
  editableByApplicant: boolean;
  generatedAt?: Date;
  updatedAt: Date;
};
```

### Internship

```ts
type Internship = {
  applicantId: ObjectId;
  company: string;
  durationMonths: number;
  roleDepartment: string;
  createdAt: Date;
  updatedAt: Date;
};
```

## 12. API Route Draft

All protected routes require Supabase JWT verification.

### Auth / Me

- `GET /me`
  - Returns current applicant and onboarding state.
- `POST /auth/sync`
  - Creates or loads MongoDB applicant record from Supabase identity.

### University

- `GET /universities/search?q=`
  - Searches normalized US university dataset.
  - Supports `limit` and `offset` pagination.
  - Blank/default query returns at most 3 suggested universities.
- `POST /universities/match-email`
  - Attempts domain-to-university match.

### Onboarding

- `GET /onboarding/status`
- `PATCH /onboarding/status`
- `POST /onboarding/education`
- `POST /onboarding/resume/skip`
- `POST /onboarding/signal-prompt`
- `POST /onboarding/deeper-signal/seen`
- `POST /onboarding/deeper-video/skip`
- `POST /onboarding/profile`
- `POST /onboarding/complete`

### Prompts

- `GET /signal-prompts`
  - Returns active backend-configured prompts.

### Resume

- `POST /resume/upload`
- `GET /resume`
- `DELETE /resume`

### Videos

- `POST /videos/10-second`
- `POST /videos/30-second`
- `GET /videos`
- `DELETE /videos/:type`

### Profile / Settings

- `GET /profile`
- `PATCH /profile/education`
- `POST /profile/internships`
- `PATCH /profile/internships/:id`
- `DELETE /profile/internships/:id`
- `PATCH /profile/soft-skills`
- `DELETE /account`

## 13. Navigation Draft

### Unauthenticated

- Sign in screen.

### Authenticated But Incomplete Onboarding

- Route to the next incomplete onboarding step.

### Authenticated And Complete

Bottom navigation:

- Home.
- Profile.

Home:

- Placeholder screen.

Profile:

- Applicant information.
- Resume.
- Videos.
- Soft-skill output.
- Internships.
- Account deletion.
- Prompt to finish optional 30-second deeper signal if skipped.

## 14. Compliance And Privacy Requirements

The POC must include basic privacy and consent handling because it stores resumes, education information, and videos.

Required:

- Consent before resume upload.
- Consent before video recording/upload.
- Privacy policy placeholder.
- Account deletion flow.
- Full user data deletion from:
  - Supabase Auth.
  - MongoDB.
  - Cloudinary.
  - Soft-skill output.
- Retain abandoned partial onboarding data unless the user deletes their account.

Future scope:

- Data export.
- Formal privacy policy.
- Formal terms of service.
- Production-grade retention policy.

## 15. Deferred Scope

### Apple Sign-In

- Hidden in POC.
- Future scope.
- If added later and Apple email does not identify a university, require university and semester selection.

### LinkedIn

- Hidden in POC.
- Future scope.
- No current backend hooks.
- LinkedIn resume import is future scope only.
- If added later and LinkedIn identity does not identify a university, require university and semester selection.

### Redis

- Future scope.
- Potential future uses:
  - Prompt list caching.
  - University search caching.
  - Auth/session metadata caching.
  - Rate limiting.

### Recruiter Product

- Included only as a POC demo surface.
- Current recruiter scope:
  - recruiter account sync/auth,
  - dashboard metrics,
  - candidate list/search,
  - TikTok-style short-take feed,
  - candidate detail/preview,
  - bookmarks,
  - interest requests before messaging,
  - request status tracking,
  - dashboard request status summary,
  - basic WebSocket-refreshed message logging after applicant acceptance,
  - account deletion.
- Production recruiter features are future scope:
  - company profile setup,
  - job/requisition context,
  - matching,
  - real threaded conversations,
  - recruiter team seats,
  - billing/subscriptions,
  - audit logs and access controls.

### Interest Requests And Messaging

- Recruiters cannot directly message an applicant first.
- Recruiter sends an interest request with a short reason.
- Applicant sees the request in the Requests tab and can accept or decline after confirmation.
- Messaging opens only after acceptance.
- Interest request statuses:
  - `sent`
  - `viewed`
  - `accepted`
  - `declined`
  - `expired`
- Pending requests expire after 14 days.
- Recruiters are limited to 25 pending requests and 20 sent requests per 24 hours.
- Declined requests have a 14-day re-request cooldown.
- Expired and declined requests require explicit re-request.
- Accepted requests are terminal for the current POC.
- Live foreground request updates use SSE.
- Recruiter message refresh uses WebSocket.
- Push notifications through FCM/APNs are deferred.

### Notifications

- In-app request notifications are persisted in MongoDB.
- Notification records store recipient Supabase UUID, role, bucket, event name, payload, read timestamp, and created timestamp.
- Mobile keeps a local AsyncStorage cache for instant badge updates.
- Backend unread counts are the source of truth across sessions/devices.
- Notification seen behavior is triggered when applicants open Requests or recruiters open Dashboard.

### Real AI Resume Parsing

- Future scope.
- Gemini integration must not be implemented in the POC.
- The POC uses dummy randomized soft-skill output instead.

## 16. POC Success Criteria

The POC is complete when:

- Applicant can sign in with Google.
- Applicant identity is synced from Supabase to MongoDB.
- University and semester requirements are enforced.
- Applicant can upload or skip a resume.
- Resume upload stores metadata and triggers dummy randomized soft-skill generation.
- Applicant can select a signal prompt.
- Applicant can record, retake, and upload the mandatory 10-second video.
- Applicant can view the deeper signal screen.
- Applicant can optionally record or skip the 30-second video.
- Applicant can complete the profile form.
- Incomplete users resume from the correct onboarding step.
- Incomplete users cannot access home.
- Complete users can access placeholder home.
- Complete users can access profile/settings CRUD.
- Users who skipped the 30-second video see a finish-profile prompt from profile/settings.
- Account deletion removes Supabase, MongoDB, Cloudinary, and soft-skill output.
- Recruiter can sign up/sign in, browse completed candidates, search profiles, bookmark candidates, send a basic message, and delete their account.
- Recruiter can send interest requests before messaging, view latest request statuses on the dashboard, and message only after applicant acceptance.
- Applicant can review recruiter interest requests, accept/decline with confirmation, and unlock messaging by accepting.
- In-app request notifications are stored in MongoDB, delivered live with SSE while foregrounded, and marked seen when the relevant screen is opened.

## 17. Implementation Milestones

### Milestone 1: Project Foundation

- Initialize React Native app.
- Initialize Fastify + TypeScript backend.
- Configure environment variables.
- Connect Supabase Auth.
- Connect MongoDB.
- Prepare Railway deployment setup.

### Milestone 2: Auth And Applicant Record

- Google sign-in.
- Supabase JWT verification in backend.
- MongoDB applicant sync.
- Onboarding status tracking.

### Milestone 3: University And Education

- Add IPEDS/College Scorecard-derived university snapshot.
- Implement normalized university search.
- Implement email domain matching.
- Build university/semester screen.

### Milestone 4: Resume

- Build resume upload/no-resume screen.
- Upload resume to Cloudinary.
- Store resume metadata in MongoDB.
- Trigger dummy randomized soft-skill generation.
- Store soft-skill generation status and results.

### Milestone 5: Signal Prompt And 10-Second Video

- Add backend-configured prompt collection.
- Build prompt selection.
- Build 10-second video recording.
- Support retake and replacement cleanup.
- Upload video immediately.

### Milestone 6: Deeper Signal

- Build soft-skill output/generic fallback screen.
- Build optional 30-second recording.
- Support skip state.
- Store video or skip status.

### Milestone 7: Profile Form

- Build welcome profile form.
- Add academic fields.
- Add multiple internships.
- Standardize semester and role/department values.

### Milestone 8: Home And Settings

- Build placeholder home.
- Build profile/settings CRUD.
- Add finish-profile prompt if 30-second video was skipped.
- Add account deletion.

### Milestone 9: Verification

- Validate onboarding route guards.
- Validate media upload and deletion.
- Validate dummy soft-skill fallback behavior.
- Validate account deletion cleanup.
- Validate Android POC flow.

## 18. Open Questions

No blocking open questions remain for the POC requirements based on the current confirmed scope.

## 19. Decision Pivots

### Resume Upload Format

For the current POC, resume uploads accept PDF only.

DOC and DOCX support is deferred because reliable server-side conversion adds deployment and preview complexity. The production path can revisit DOC/DOCX after PDF upload, preview, replacement, download, and deletion are stable.

### Recruiter Media Access

For the current POC, recruiter preview can use direct Cloudinary URLs for the short take, deeper signal, profile image, and resume PDF.

Before production, recruiter media and resume access must move behind scoped access controls such as signed, temporary URLs or authenticated backend media endpoints. Recruiter list/feed responses should stay summary-first and avoid returning resume or deeper-signal URLs until a recruiter opens a specific candidate detail view.

### Android Build Versioning

Every Android bundle uploaded to Google Play must use a new `versionCode`.

Before each Android Play upload, update both:

- `apps/mobile/app.config.js` `android.versionCode`
- `apps/mobile/android/app/build.gradle` `defaultConfig.versionCode`

### Applicant Intent And Profile Strength

Students looking for internships and students looking for full-time placement jobs must not compete in the same ranking pool. Applicant intent should be captured as a first-class profile/search dimension with at least:

- `internship`
- `full_time_placement`

Recruiter discovery, filters, and ranking should respect this intent before comparing applicants.

Profile strength must not depend heavily on internships because many students use Cato specifically to find their first internship.

Profile strength weighting decision:

- Resume, short take, deeper signal, and soft skills together account for 70%.
- Projects account for 20% total:
  - 1 project = 10%.
  - 2 projects = 17%.
  - 3+ projects = 20%.
- Internships account for 10% total:
  - 1+ internship = 10%.
  - Additional internships do not increase this portion.

Recruiter dynamic search decision:

- Recruiter dynamic search should run as a temporary deterministic `SearchSpec`.
- Runtime searches must not create persistent job/role records automatically.
- A search only becomes a recruiter job when the recruiter explicitly saves it.
- V1 recruiter dynamic search is structured-first: employment type, field/category, skills, graduation status, GPA, semester, major, university, and later international-student status.
- Field/category and skill controls should be search-to-select dropdowns.
- Recruiters can add missing fields/categories and skills from the search UI.
- Recruiter-added matching options are normalized to lowercased standardized keys, deduplicated, and saved in a shared backend option catalog.
- Free-text search can remain as a later additive input to the same `SearchSpec`.
- Student matching must normalize unrealistic years-of-experience phrasing into skill evidence strength instead of literal years.
- Example: `10 years Python` for a college student search means strong Python evidence across resume text, projects, internships, and profile signals.

## 20. Agent Workflow Plan

Use sub-agents only for scoped work with clear ownership. The main Codex agent remains responsible for final integration, conflict resolution, and keeping this handoff accurate.

### Model Policy

- Do not assign any sub-agent above `gpt-5.5` with medium reasoning.
- Use `gpt-5.4` with low reasoning for low-complexity, tightly scoped tasks.
- Use `gpt-5.4` with medium reasoning by default for normal scoped implementation and review tasks.
- Use `gpt-5.5` with medium reasoning only for QA, high-risk review, complex implementation, or tasks where extra reasoning is clearly justified.
- Do not choose stronger models by habit. Match model capability to task complexity.

### Goal

Build the Cato POC from this handoff using React Native for mobile and Fastify + TypeScript for backend. The POC includes applicant onboarding/profile creation and the lightweight recruiter discovery demo surface.

### Supervisor Agent

Responsibilities:

- Review architecture decisions.
- Enforce POC scope.
- Check that implementation matches this handoff.
- Review code from mobile, backend, data, media, and QA work.
- Identify cross-cutting risks before integration.

The supervisor should not own large direct implementation patches unless explicitly assigned.

### Mobile Agent

Responsibilities:

- React Native app structure.
- Navigation.
- Onboarding screens.
- Placeholder home.
- Profile/settings screens.
- Client-side onboarding route guards.
- Public mobile environment variable usage.

Expected write scope:

- `apps/mobile/**`

### Backend Agent

Responsibilities:

- Fastify + TypeScript backend.
- Supabase JWT verification.
- MongoDB connection and repositories.
- Applicant sync.
- Onboarding/profile API routes.
- Account deletion orchestration.

Expected write scope:

- `apps/api/**`

### Data Agent

Responsibilities:

- University dataset snapshot format.
- University normalization/search.
- Prompt seed data.
- Controlled lists for semesters and role/departments.
- Data model consistency.

Expected write scope:

- `packages/shared/**`
- `apps/api/src/data/**`
- `apps/api/src/seeds/**`

### Media Agent

Responsibilities:

- Cloudinary upload conventions.
- Resume metadata handling.
- Video metadata handling.
- Replacement cleanup behavior.
- Dummy randomized soft-skill generation.

Expected write scope:

- `apps/api/src/media/**`
- `apps/api/src/soft-skills/**`

### QA Agent

Responsibilities:

- Test strategy.
- Route guard verification.
- Onboarding state edge cases.
- Account deletion checks.
- Regression review.

Expected write scope:

- Test files only.

### First Loop

The first loop must only establish the project foundation:

- Use npm workspaces.
- Create monorepo structure.
- Create backend app shell.
- Create mobile app shell.
- Add shared package shell if useful.
- Add `.env.example`.
- Rename public mobile env vars during scaffolding:
  - `NEXT_PUBLIC_SUPABASE_URL` -> `EXPO_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` -> `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Add backend health check.
- Add README run instructions.
- Verify both apps can start or build.

No recruiter, Apple, LinkedIn, Redis, real AI parsing, or production app-store work should be added in the first loop.
