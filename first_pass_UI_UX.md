# Cato First-Pass UI/UX Audit

## 1. Executive Summary

The current Cato POC has the right core flow shape: applicant-first onboarding, full-screen video capture, profile CRUD, and a recruiter-side browsing loop. The largest UX gaps are not missing features, but consistency, perceived reliability, and form ergonomics.

The strongest parts are:

- The applicant route guards prevent half-onboarded users from reaching home.
- `Screen`, `LoadingScreen`, `LoadingOverlay`, `RecruiterContent`, and `theme.ts` provide a good base for consistency.
- The 10-second and 30-second video screens now feel closer to a native capture surface.
- The prompt carousel has a clear visual direction.

The weakest parts are:

- Loading states can alternate between `Loading Cato` and `Reconnecting to Cato`, which makes normal network/bootstrap transitions feel like errors.
- Applicant profile/settings is too dense and mixes account, edit, media, preview, soft skills, and destructive actions in one long scroll.
- Keyboard/focus behavior is only polished in a few spots, especially onboarding internships, but not consistently across all forms.
- Recruiter screens still have typography and spacing drift compared with the newer shared theme.
- Several screens still use local one-off styles instead of shared visual primitives.

Recommended strategy: first stabilize loading/state messaging, then standardize form/button components, then polish screen-by-screen layout density.

## 2. Highest-Priority UX Risks

### 1. Loading State Flicker Looks Like Failure

Files:

- `apps/mobile/app/index.tsx`
- `apps/mobile/app/(onboarding)/_layout.tsx`
- `apps/mobile/app/(tabs)/_layout.tsx`
- `apps/mobile/src/hooks/useApplicantGate.ts`
- `apps/mobile/src/hooks/useApplicantBootstrap.ts`
- `apps/mobile/src/hooks/useOnboardingStatus.ts`
- `apps/mobile/src/components/LoadingScreen.tsx`

Risk: The user sees `Loading Cato`, then `Reconnecting to Cato`, then `Loading Cato` again. This makes a normal bootstrap or route transition feel broken.

Likely cause: `useApplicantGate` combines two async hooks. `useApplicantBootstrap` loads/syncs the applicant, then `useOnboardingStatus` starts only after an applicant exists. Between those phases, the route layout can temporarily have no applicant/status or an error/null state and render `ReconnectScreen`. Because the same gate is used by `index`, onboarding layout, and tabs layout, navigation between guarded route groups can remount the same loading/error decision tree.

UX impact: Users cannot distinguish a real network failure from normal startup. This damages perceived reliability.

Recommendation: Use a single unified auth/app bootstrap state with explicit states: `checking-session`, `checking-role`, `syncing-profile`, `loading-onboarding`, `ready`, `offline`, `error`. Only show reconnect after a real failed request and a short retry window, not while role/profile/status are still transitioning.

### 2. Profile Screen Is Doing Too Much

File:

- `apps/mobile/app/(tabs)/profile.tsx`

Risk: The profile screen includes account identity, profile image management, recruiter preview, privacy, logout, education, internships, resume, videos, soft skills, and delete account. This is a high cognitive load surface.

UX impact: Important actions compete with destructive actions. Repeated small buttons create scanning fatigue. Users may miss key controls like media preview or profile completion.

Recommendation: Keep current functionality, but visually group into clear sections with stronger hierarchy. Longer term, split into tabs/accordion sections: `Profile`, `Media`, `Education`, `Account`.

### 3. Keyboard Behavior Is Inconsistent

Files:

- `apps/mobile/src/components/Screen.tsx`
- `apps/mobile/app/(onboarding)/profile-form.tsx`
- `apps/mobile/app/(onboarding)/deeper-signal.tsx`
- `apps/mobile/app/(recruiter)/login.tsx`
- `apps/mobile/app/(recruiter)/contact.tsx`
- `apps/mobile/app/(tabs)/profile.tsx`

Risk: `Screen` gives global keyboard avoidance, but only onboarding internship creation actively focuses and scrolls to a new input. Other inputs depend on default scroll behavior.

UX impact: On smaller phones, multiline inputs and lower form fields can still be partially blocked by keyboard/autocorrect bars. Users may need to manually scroll after tapping fields.

Recommendation: Introduce a shared form-screen pattern that supports input refs, `scrollToFocusedInput`, enough bottom padding for keyboard accessory/autocorrect, and consistent `returnKeyType`/submit behavior.

### 4. Recruiter UI Still Feels Less Polished Than Applicant UI

Files:

- `apps/mobile/app/(recruiter)/results.tsx`
- `apps/mobile/app/(recruiter)/bookmarks.tsx`
- `apps/mobile/app/(recruiter)/messages.tsx`
- `apps/mobile/app/(recruiter)/contact.tsx`
- `apps/mobile/src/recruiter/RecruiterNav.tsx`

Risk: Several recruiter screens still use raw `fontSize`, raw spacing values like `12`/`18`, and compact cards that do not fully match the shared theme.

UX impact: The recruiter side feels like a different app even though the entry point is shared.

Recommendation: Bring these screens onto `typography`, `spacing`, `controls`, and a shared candidate-card component.

## 3. Loading/Reconnect State Analysis

Current loading path:

1. `SessionProvider` resolves Supabase session.
2. `useAuthRole` fetches `/auth/role`.
3. If role is applicant, `useApplicantGate` runs.
4. `useApplicantBootstrap` calls `syncApplicant`, then `getMe`.
5. Once applicant exists, `useOnboardingStatus` calls `/onboarding/status`.
6. Route guards redirect based on role/status.

The repeated loading/reconnect behavior likely comes from this pattern:

- The guard renders `LoadingScreen` while any hook is loading.
- Once loading is false, `error || !applicant` renders `ReconnectScreen`.
- During route redirects/remounts, the hook chain can briefly reset to `applicant: null`.
- `useOnboardingStatus` only starts after `applicantState.applicant`, so there are multiple partial states.
- `index`, onboarding layout, and tabs layout all duplicate this logic.

Files with duplicated guard logic:

- `apps/mobile/app/index.tsx`
- `apps/mobile/app/(onboarding)/_layout.tsx`
- `apps/mobile/app/(tabs)/_layout.tsx`

Recommended fix direction:

- Create one `useAppGate` or `AppBootstrapProvider`.
- Cache the last valid applicant/status during route-group redirects.
- Split `isLoading` from `isRecovering`.
- Rename reconnect UI to something less alarming for transient refreshes, such as `Checking your profile`.
- Only show `Reconnecting to Cato` when a network request failed and retry is active.
- Keep an error-specific view for real backend failures.

Do not change functionality during this polish pass. This should be treated as state presentation and routing stability work.

## 4. Keyboard, Focus, and Scroll Behavior Gaps

### Onboarding Profile Form

File:

- `apps/mobile/app/(onboarding)/profile-form.tsx`

What works:

- New internship creation sets `pendingCompanyFocusId`.
- The screen focuses the new company field.
- It scrolls to the end after adding an internship.

Gaps:

- `scrollToEnd` is coarse. It works for appended internships but does not generalize to arbitrary fields.
- The save button is close to the bottom after long internship lists and may be hidden by keyboard until manual scrolling.
- GPA, major, and minor do not auto-advance or dismiss keyboard intentionally.

Recommendation:

- Use a shared helper that measures the focused input and scrolls it above the keyboard.
- Keep the current add-internship focus behavior, but replace `scrollToEnd` with field-specific scroll positioning.

### Applicant Profile Settings

File:

- `apps/mobile/app/(tabs)/profile.tsx`

Gaps:

- Many editable fields exist in one scroll without section-level sticky actions.
- Internship duration still uses a number mutation pattern that can feel jumpy if users try to clear the field.
- Major is a free text input here, while onboarding major is a search-assisted input.
- There is no focus-scroll behavior for lower fields.

Recommendation:

- Match onboarding validation behavior in profile settings.
- Use labels before every editable field, not placeholders alone.
- Add scroll/focus helpers for internship and media replacement sections.

### Deeper Signal Text Area

File:

- `apps/mobile/app/(onboarding)/deeper-signal.tsx`

Gaps:

- Uses `Screen` without `scroll`, so a multiline input can be cramped on smaller devices.
- No explicit keyboard dismissal path except background scrolling is unavailable.
- The primary action may sit below comfortable thumb reach when keyboard is open.

Recommendation:

- Make it a scroll form or a full-height composed layout with sticky actions above the keyboard.
- Keep the text area visible while typing with extra bottom padding.

### Recruiter Login and Contact

Files:

- `apps/mobile/app/(recruiter)/login.tsx`
- `apps/mobile/app/(recruiter)/contact.tsx`

Gaps:

- Login uses centered non-scroll `Screen`; this can compress badly on smaller phones with keyboard open.
- Contact uses raw local styling and lacks clear keyboard-aware action placement.

Recommendation:

- Use scroll mode for all text-entry screens unless the content is proven to fit on the smallest target viewport.
- Add `returnKeyType`, `textContentType`, and consistent keyboard hints.

## 5. Visual System Consistency Gaps

Shared theme exists:

- `apps/mobile/src/theme.ts`

The theme defines colors, radii, spacing, typography, controls, and shadows. This is good. The problem is partial adoption.

### Remaining Style Drift

Files with visible drift:

- `apps/mobile/app/(recruiter)/results.tsx`
- `apps/mobile/app/(recruiter)/bookmarks.tsx`
- `apps/mobile/app/(recruiter)/messages.tsx`
- `apps/mobile/app/(recruiter)/contact.tsx`
- `apps/mobile/src/recruiter/RecruiterNav.tsx`
- `apps/mobile/src/components/VideoRecorder.tsx`
- `apps/mobile/app/(onboarding)/signal-video.tsx`

Examples:

- Raw font sizes and weights appear in recruiter lists.
- `RecruiterNav` uses `fontSize: 10`, `gap: 3`, and `minWidth: 54`, separate from theme tokens.
- Video recorder uses many absolute positions and raw sizes, which is acceptable for camera UI but should still use shared spacing where possible.
- Accent pale green appears as `#eefee0` in several places instead of a semantic theme token.
- Empty/loading copy is screen-specific instead of using shared state components.

Recommendation:

- Add semantic tokens: `accentSurface`, `disabled`, `scrim`, `tabBarHeight`, `avatarSmall`, `avatarLarge`.
- Create shared components: `PrimaryButton`, `SecondaryButton`, `DangerButton`, `Chip`, `TextField`, `Section`, `CandidateCard`, `SoftSkillCard`.
- Replace raw one-off button/card styles with these primitives.

## 6. Screen-by-Screen Polish Findings

### Welcome / Applicant Sign-In

File:

- `apps/mobile/app/(auth)/sign-in.tsx`

Findings:

- Good first-screen clarity: applicant primary, recruiter secondary.
- The recruiter button is visible enough without competing with applicant CTA.
- The logo treatment is repeated manually in several files.

Recommendation:

- Extract `CatoLogoMark`.
- Keep applicant CTA visually dominant.

### Auth Layout

File:

- `apps/mobile/app/(auth)/_layout.tsx`

Findings:

- Uses role gate and redirects authenticated users.
- Loading message is generic and consistent with other route groups.

Recommendation:

- Once app bootstrap is centralized, auth layout should rely on the same resolved role state instead of separate guard decisions.

### University / Semester

File:

- `apps/mobile/app/(onboarding)/education.tsx`

Findings:

- Three visible universities plus search is the correct POC compromise.
- Email-matched university disabled input communicates locked state.
- Search is debounced at 250ms, which is reasonable.

Gaps:

- Save button is enabled even before a university is selected; validation happens only after tap.
- Error is displayed at bottom, so users may not see it if focused near the top.
- Result cards could use a selected check/icon for faster recognition.

Recommendation:

- Disable continue until university and semester are valid.
- Add inline selected marker.
- Place validation close to the field.

### Resume Upload

File:

- `apps/mobile/app/(onboarding)/resume.tsx`

Findings:

- Clear primary and secondary path.
- Consent is visible before upload.

Gaps:

- Upload is blocking with `LoadingOverlay`, unlike videos which now proceed in background.
- `isSubmitting` starts before document picker; if a user cancels, the overlay can feel unnecessary.
- Resume upload status copy uses technical status like `softSkillGenerationStatus`.

Recommendation:

- For consistency, let resume upload move forward in background if backend supports it.
- Replace technical status with user-facing copy.
- Show consent and privacy as a compact grouped control.

### Signal Prompt Carousel

File:

- `apps/mobile/app/(onboarding)/signal-prompt.tsx`

Findings:

- Visually the strongest onboarding screen.
- Swipe interaction and faint neighboring cards match the intended direction.

Gaps:

- Uses emoji assets while later soft skills use Ionicons. This is acceptable but less consistent.
- Card width is fixed at `248`, which may feel small on large phones and tight on narrow phones.
- The button says `Record My 10s Take` even if the prompt was only tapped but not persisted until button press. This is fine functionally but selection feedback should remain obvious.

Recommendation:

- Use responsive card width with min/max bounds.
- Consider replacing emojis with a consistent icon set if brand polish matters more than playfulness.

### 10-Second Video

Files:

- `apps/mobile/app/(onboarding)/signal-video.tsx`
- `apps/mobile/src/components/VideoRecorder.tsx`

Findings:

- Full-screen capture is correct for mobile.
- Consent dialog is appropriately before camera use.
- Prompt persists during recording.
- Retake and use-video controls are inside the video surface.

Gaps:

- Consent copy and spacing use local styles and raw values.
- The close `x` is a text character, not an icon.
- Instructions modal appears inside camera surface, but the copy may wrap unpredictably on small screens.
- `VideoRecorder` still has an internal `isUploading` state and `Uploading...` button label even though parent route moves forward in background. This could briefly conflict with the desired non-blocking mental model.

Recommendation:

- Use icon buttons from the same icon library.
- Theme the dialog through shared modal primitives.
- Make upload handoff copy consistent: `Saving in background` only if the user remains on screen.

### Deeper Signal Text

File:

- `apps/mobile/app/(onboarding)/deeper-signal.tsx`

Findings:

- Screen is simple and understandable.
- Character counter supports effort without exposing scoring.

Gaps:

- It waits for the queued 10-second upload before moving on. This can feel like an unexplained pause after text entry.
- The screen title is instructional but not emotionally aligned with the rest of the designer flow.
- No loading state during `waitForQueuedVideoUpload`.

Recommendation:

- If waiting is unavoidable, show `Saving your signal` instead of appearing idle.
- Consider moving the queued wait earlier or making the next screen handle pending state.

### 30-Second Video

File:

- `apps/mobile/app/(onboarding)/deeper-video.tsx`

Findings:

- Correctly skips consent because video consent happened earlier.
- `Skip for now` is available only before recording.

Gaps:

- Status text is absolute-positioned and may conflict with full-screen recording controls.
- Error positioning is absolute, which can overlap with bottom controls on some devices.

Recommendation:

- Use a shared bottom toast/banner component for transient status/error messages.

### Soft Skills

Files:

- `apps/mobile/app/(onboarding)/soft-skills.tsx`
- `apps/mobile/app/(tabs)/profile.tsx`

Findings:

- View-only soft skill cards are directionally correct.
- Stars and icons are easy to scan.

Gaps:

- Fallback ratings include a `3`, while current scoring rules expect normal floor of `3.5` unless lowest effort.
- Fallback copy may appear if backend data is still pending, which can cause temporary mismatch with stored results.
- Soft-skill card color uses hard-coded pale green.

Recommendation:

- Align fallback data with scoring rules.
- Distinguish `preparing` from completed soft skills.
- Add `colors.accentSurface`.

### Final Onboarding Profile Form

File:

- `apps/mobile/app/(onboarding)/profile-form.tsx`

Findings:

- Strongest form behavior is add-internship focus/scroll.
- Name, GPA, major validation are present.
- Major search-assisted selection is useful.

Gaps:

- Save button margin is only `spacing.sm`, making it feel attached to preceding internship block after long forms.
- GPA field is visually valid/invalid only through submit error, not inline border like name/major.
- Disabled save state uses opacity only; it may look broken rather than intentionally disabled.

Recommendation:

- Add a larger final-action gap.
- Show inline GPA invalid border when out of range or empty.
- Add disabled button token.

### Applicant Home

File:

- `apps/mobile/app/(tabs)/home.tsx`

Findings:

- Placeholder is acceptable for POC.

Gap:

- It does not reflect profile completion status or pending background uploads.

Recommendation:

- For POC polish, show a minimal dashboard: profile completeness, video status, resume status, and CTA to profile.

### Applicant Profile / Settings

File:

- `apps/mobile/app/(tabs)/profile.tsx`

Findings:

- Functionally rich.
- Recruiter preview is useful.
- Media viewing/replacement is covered.
- Soft skills are view-only.

Gaps:

- Too many unrelated tasks in one scroll.
- Top account section has upload picture, name save, preview, privacy, logout, and finish profile prompt together.
- Resume `View resume` and `Download resume` currently route to the same preview screen, which may be acceptable but the distinction is unclear.
- Some profile editing behavior differs from onboarding, especially major and internship duration.
- Destructive delete account sits at the bottom without a confirmation pattern visible in this file.

Recommendation:

- Add section cards or accordions.
- Move destructive account actions into an account subsection.
- Match onboarding field validation and input behavior.
- Use a shared media action row component.

### Recruiter Dashboard

File:

- `apps/mobile/app/(recruiter)/dashboard.tsx`

Findings:

- Metrics and plan card are clear.
- Derived backend activity is represented.

Gaps:

- `Your Plan` and `Professional` may imply paid subscription even though subscriptions are web-only/future scope.
- CTA hierarchy could be clearer: `Search Candidates` should be the dominant action, `View Plan` should be secondary/account-oriented.

Recommendation:

- Rename plan section for POC, or make it clearly informational.

### Recruiter Search

File:

- `apps/mobile/app/(recruiter)/search.tsx`

Findings:

- Filter rows are easy to scan.

Gaps:

- Filters are static and look editable but are not actually configured in this screen.
- `Clear all filters` is a tappable-looking text with no handler.

Recommendation:

- For POC, either mark filters as preview/static or make inactive rows visually read-only.
- Avoid visible controls that do nothing.

### Recruiter Results and Bookmarks

Files:

- `apps/mobile/app/(recruiter)/results.tsx`
- `apps/mobile/app/(recruiter)/bookmarks.tsx`

Findings:

- Candidate cards show core info compactly.

Gaps:

- Results title says `128 results` regardless of actual candidate count.
- Body says `Swipe to preview 10-second videos`, but cards are tap-only in the current code.
- Results/bookmarks card styles duplicate each other with raw values.

Recommendation:

- Use actual candidate count.
- Remove swipe instruction until swipe exists.
- Create one `CandidateListCard`.

### Recruiter Candidate Detail

File:

- `apps/mobile/app/(recruiter)/candidate/[id].tsx`

Findings:

- Good content order: identity, soft skills, signal, resume, actions.
- Resume preview and video watch use in-app screens.

Gaps:

- Bottom action row has multiple flexible buttons, including a primary action; on narrow screens this can compress labels.
- Only 10-second video is exposed here; if 30-second exists, it is not surfaced.
- `Back` is text-only and may be less discoverable than an icon+label.

Recommendation:

- Stack primary action full-width below secondary actions.
- Add 30-second video if present.
- Use standard back header/action.

### Recruiter Messages

File:

- `apps/mobile/app/(recruiter)/messages.tsx`

Findings:

- WebSocket integration exists.

Gaps:

- `Realtime messages disconnected.` appears as a hard error but may be transient.
- No reconnecting/connected state.
- Message list styles still drift from theme tokens.

Recommendation:

- Use a small connection banner with neutral, warning, and connected states.
- Do not use alarming error styling for a recoverable socket reconnect.

### Recruiter Account / Upgrade

File:

- `apps/mobile/app/(recruiter)/upgrade.tsx`

Findings:

- Logout and delete account exist.

Gaps:

- Account actions live on a screen titled `Upgrade Plan`.
- `Upgrade Now` is visible even though subscriptions are future/web-only.
- Delete account sits alongside plan upgrade, which mixes billing and destructive account management.

Recommendation:

- Rename tab/screen to `Account` for POC.
- Move future subscription copy below account controls or mark as future scope.

## 7. Accessibility and Readability Gaps

### Touch Targets

Most primary buttons meet reasonable height targets through `controls.buttonHeight` and `controls.secondaryButtonHeight`. Gaps remain in text-only actions:

- `Back`
- `Privacy Policy`
- `Remove`
- `Delete`
- `Clear all filters`
- recruiter result `Filter`

Recommendation: Wrap text actions in minimum-height pressable areas, not bare text-sized hit boxes.

### Color Contrast and Meaning

The main text/background palette is readable. The muted gray and purple link color are acceptable but should be checked against actual device brightness.

Gaps:

- `colors.purple` is used for links and prompts; it may compete with the green accent.
- Pale green `#eefee0` appears without semantic token.
- Danger actions are sometimes text-only and sometimes filled red buttons.

Recommendation:

- Define semantic use rules: purple for navigation links, green for positive/selected states, red only for destructive/error.
- Add consistent danger confirmation style.

### Typography

Good:

- `typography.screenTitle`, `body`, `label`, `meta`, and `button` exist.

Gaps:

- Recruiter list screens still use raw sizes.
- Logo text uses local font sizes repeatedly.
- Some compact card headings use title weights that may be too heavy for repeated lists.

Recommendation:

- Use `typography` everywhere except brand/logo and camera overlays.
- Add `typography.cardTitle` if repeated cards need a middle tier.

## 8. User-Friction Map

High-friction moments:

1. App startup: repeated loading/reconnect states.
2. Resume upload: blocking overlay while videos use background upload.
3. Deeper signal: possible invisible wait for queued 10-second upload.
4. Profile settings: too many unrelated actions in one long page.
5. Recruiter search: static filters look interactive.
6. Recruiter account: upgrade/account/delete/logout mixed together.
7. Text entry screens: keyboard behavior not uniformly managed.

Lower-friction moments:

1. Google/applicant entry is clear.
2. University selection is compact.
3. Prompt carousel is engaging.
4. Full-screen recording is aligned with mobile expectations.
5. In-app resume/video preview reduces context switching.

## 9. Recommended Implementation Order

### Phase 1: Perceived Reliability

1. Centralize app bootstrap/route gate state.
2. Replace transient `ReconnectScreen` use with neutral loading/checking states.
3. Add real error and retry screens only after failed requests.
4. Add non-blocking upload banners/toasts for background upload states.

### Phase 2: Shared UI Primitives

1. Add shared `CatoLogoMark`.
2. Add shared buttons: primary, secondary, danger, text action.
3. Add shared text field and labeled field wrapper.
4. Add shared section/card primitives.
5. Add shared connection/loading banner.

### Phase 3: Form Ergonomics

1. Add field-aware keyboard scroll helper.
2. Apply it to onboarding profile, applicant profile, deeper signal, recruiter login, and recruiter contact.
3. Standardize validation borders and inline error text.
4. Standardize disabled button appearance.

### Phase 4: Applicant Polish

1. Align resume upload state with video upload state.
2. Polish consent dialogs and camera overlay controls.
3. Split profile/settings visually into clearer sections.
4. Align profile edit behavior with onboarding edit behavior.
5. Make applicant home a small status dashboard instead of placeholder.

### Phase 5: Recruiter Polish

1. Convert recruiter results/bookmarks/messages/contact to theme tokens.
2. Create shared candidate card.
3. Fix misleading static text: `128 results`, swipe preview, inactive filters.
4. Rename `Upgrade Plan` to `Account` for POC.
5. Add neutral WebSocket connection status UI.

## 10. Non-Goals / Functionality That Should Not Change During Polish

Do not change these while doing the UI/UX polish pass:

- Applicant/recruiter role rules.
- Supabase auth behavior.
- MongoDB data ownership.
- Cloudinary upload structure.
- Video upload flow.
- Soft-skill scoring logic.
- Recruiter message WebSocket backend behavior.
- Resume/video media routes.
- Account deletion semantics.

The polish pass should focus on state presentation, visual consistency, screen layout, input ergonomics, and reducing user confusion.

## 11. UI/UX Principles Applied Conservatively

These recommendations are based on established product design and HCI principles, without claiming specific study citations here:

- Cognitive load: reduce how many unrelated decisions appear on one screen.
- Progressive disclosure: show advanced/destructive actions only when the user is in the relevant section.
- Recognition over recall: use labels, selected states, icons, and section grouping so users do not have to remember where actions live.
- Fitts's law: primary mobile actions should be large, reachable, and not crowded by secondary actions.
- Gestalt proximity: group related controls tightly and separate unrelated sections clearly.
- Feedback and system status: every wait, upload, retry, and socket state should have clear, non-alarming feedback.
- Error prevention: disable invalid primary actions where possible and place validation close to the field.

## 12. Concrete Acceptance Criteria For The Polish Pass

- A normal app reload never alternates between `Loading Cato` and `Reconnecting to Cato` unless there is a real failed request.
- Every route group uses one shared bootstrap/gate state.
- Every text input screen remains usable with keyboard and autocorrect bar open.
- Primary buttons share height, typography, radius, and spacing.
- Secondary and text actions share predictable visual treatment.
- Recruiter and applicant screens use the same theme tokens.
- Static recruiter text never describes unavailable interactions.
- Profile/settings is visually scannable in under 5 seconds.
- All destructive actions are visually separated from routine editing.
- Background uploads are communicated as non-blocking status, not as blocking overlays.
