# Refactor Major V1 Audit

Audit date: August 15, 2026

## Executive Summary

This audit used six specialist agents and one master orchestrator:

- Logic Agent
- Backend Auditor Agent
- Applicant Comprehensiveness Agent
- Recruiter Comprehensiveness Agent
- Concept / Market Pain-Point Agent
- Code Audit / Refactor Agent
- Master Orchestrator

The current Cato flow is understood as a proof-of-concept early-talent screening product with two primary surfaces: applicant onboarding/profile creation and recruiter candidate discovery. The applicant flow is substantially implemented. The recruiter flow is usable as a demo, especially the video feed and candidate preview, but it is not production-ready.

Production-readiness verdict: not production ready.

The TypeScript monorepo architecture is appropriate for the current POC and should not be broadly rewritten yet. The right next step is targeted refactoring, backend hardening, privacy controls, contract stabilization, and completion of real recruiter workflows before handling real applicant data at scale.

The largest cross-agent themes are:

- Onboarding state is inconsistent across mobile/backend after the deeper video step.
- Resume/video upload paths are fragile for real-world file sizes, retries, and app lifecycle interruptions.
- Recruiter access exposes too much applicant PII/media without sufficient authorization, auditability, or job context.
- Search, messaging, soft-skill outputs, and recruiter workflows are still POC-level.
- The market pain is real, but mandatory video/AI positioning is risky; Cato should position as an early-talent signal layer with optional video and accommodation paths.

## Current Application Flow Understanding

Applicant flow:

1. Supabase session is established.
2. User role is resolved.
3. Applicant bootstrap runs.
4. Applicant onboarding progresses through:
   - `auth_complete`
   - `education_complete`
   - `resume_complete`
   - `signal_prompt_selected`
   - `signal_video_uploaded`
   - `deeper_signal_seen`
   - `deeper_video_skipped` or `deeper_video_uploaded`
   - profile / onboarding complete

Recruiter flow:

- Recruiter POC includes auth, dashboard, feed, know-more sheet, candidate detail, bookmarks, send-message logging, and account deletion.
- Recruiter discovery/search and messaging are not yet production-grade.
- Recruiter/company/job setup is missing or incomplete.

System architecture:

- Fastify backend.
- MongoDB repositories.
- Supabase admin `getUser` per request.
- Cloudinary signed upload and complete flows.
- Railway healthcheck.
- TypeScript monorepo with Expo/React Native mobile app and shared package.

## Production Readiness Roadmap

### Immediate

- Fix onboarding route/state mismatch after deeper-video completion.
- Move onboarding state rank, valid transitions, and route rules into shared code used by mobile and backend.
- Gate recruiter routes on authenticated session and recruiter role.
- Add recovery UX/API behavior for sessions with missing or conflicting roles.
- Replace base64 JSON resume upload with multipart/direct upload flow suitable for real file sizes.
- Add visible failure/retry states for 30-second video upload, resume upload, prompt loading, soft-skills loading, and home/feed states.
- Invoke and verify Mongo index creation, including applicant/search/recruiter access patterns.
- Replace static `/health` with dependency-aware readiness checks.
- Restrict recruiter access to applicant PII, raw media URLs, and resume URLs.
- Add confirmation flows for destructive resume/video deletion.
- Remove or gate raw third-party resume viewing where it leaks applicant resume URLs.

### Next

- Move backend route orchestration into application services.
- Add shared Zod/contracts or OpenAPI/JSON Schema for mobile/backend compatibility.
- Harden Cloudinary signed upload constraints and verify complete metadata server-side.
- Remove websocket token from query string.
- Add audit trails for candidate views, downloads, outreach, and media access.
- Make deletion more transactional or compensating-action based.
- Reduce dependency on Supabase admin API for every authenticated request where feasible.
- Add recruiter/company profile setup.
- Add job/requisition context to recruiter workflows.
- Replace fake/non-functional search with real search semantics.
- Build real conversation/messaging model or explicitly remove messaging from the production scope.
- Replace dummy/fallback soft-skill outputs with production-grade analysis or clearly label them as unavailable.
- Improve consent language, accessibility, and accommodation flows.

### Later

- Add transcripts, summaries, and recruiter-facing evidence explanations.
- Add optional/later video, role-specific prompts, prep/rerecording, and practice mode.
- Add non-video evidence paths such as portfolio, work sample, written response, or transcript-only submission.
- Add ATS/CRM workflow integrations once core product behavior is stable.
- Prepare native Kotlin/Swift only after contracts, flow models, signing, app IDs, permissions, and media equivalents are stable.
- Revisit DOC/DOCX only after PDF upload, preview, replacement, download, and deletion are stable.

## Logic Agent

### Confirmed Strengths

- Applicant progression is guarded by backend state.
- Server-side consent enforcement exists.
- Account deletion is substantive rather than purely cosmetic.

### Production Blockers

- Single-role users can hit dead ends when role state is missing or conflicted.
- Recruiter area is not fully gated on auth and role.
- Backend/mobile mismatch exists after deeper-video completion:
  - Mobile sends `deeper_video_*` toward soft skills.
  - Backend `nextRoute` sends the user to profile form.
- `profile_form_complete` appears dead.
- Sessions missing role state lack recovery behavior.
- Video upload continuity depends on an in-memory queue, which is fragile across app restarts, crashes, and network changes.

### Recommended Resolution

- Centralize onboarding states, ranks, transitions, and route mapping.
- Treat role resolution as a recoverable state, not a terminal failure.
- Make deeper-video completion route behavior identical across backend and mobile.
- Persist upload queue state or move upload completion orchestration server-side.

## Backend Auditor Agent

### Confirmed Architecture

- Fastify backend.
- MongoDB repositories.
- Supabase admin `getUser` per request.
- Cloudinary signed upload/complete flows.
- Railway healthcheck.

### Production Blockers

- Resume upload uses base64 JSON and is likely to fail around real-world file sizes.
- Index definitions are incomplete, and `ensureApplicantIndexes` is not invoked.
- Static `/health` does not verify database, Supabase, Cloudinary, or other dependencies.
- Any synced recruiter can read applicant PII/media URLs too broadly.

### Additional Risks

- Cloudinary complete trusts client-supplied metadata too much.
- Signed upload parameters are underconstrained.
- Websocket token appears in query string.
- Deletion is non-transactional.
- Every auth request depends on Supabase admin API availability/latency.
- Multi-step writes are not atomic.
- Recruiter candidate listing has N+1 behavior.
- Tests are minimal and need broader integration coverage around media, auth, and role boundaries.

### Recommended Resolution

- Move large uploads to multipart/direct object upload patterns.
- Server-verify uploaded asset metadata.
- Add dependency-aware health/readiness checks.
- Add least-privilege recruiter data views.
- Add indexes and enforce startup/index migration behavior.
- Add integration tests around auth, upload, onboarding, recruiter access, and deletion.

## Applicant Comprehensiveness Agent

### Current Coverage

Applicant POC flow is mostly complete:

- Auth.
- University setup.
- Resume upload.
- Prompt selection.
- 10-second signal video.
- Elaboration.
- 30-second deeper video.
- Soft skills.
- Profile.
- Preview.
- Logout/delete.

### Production Blockers

- Onboarding route mismatch after deeper video.
- 30-second upload failure can be silent.
- Soft-skill outputs are dummy/fallback and not production-grade.
- API errors are opaque to the applicant.
- Accessibility gaps remain.

### Missing UX States

- Loading, empty, error, and retry states for:
  - Search.
  - Prompt loading.
  - Resume upload.
  - Soft skills.
  - Home.
- Confirmation for destructive resume/video deletes.
- Stronger consent UX.
- Avoid Google Docs viewer for private resumes because it leaks resume URLs to a third party.

### Recommended Resolution

- Add visible retryable failure states before expanding scope.
- Make privacy and consent explicit at each media/resume step.
- Either make soft-skill analysis real and explainable or remove it from production claims.

## Recruiter Comprehensiveness Agent

### Current Coverage

Recruiter POC includes:

- Auth.
- Dashboard.
- Feed.
- Know-more sheet.
- Candidate detail.
- Bookmarks.
- Send-message log.
- Account deletion.

### Production Blockers

- Search/results are fake or non-functional.
- Messages are hidden from bottom nav and are not a true conversation system.
- Recruiter/company profile setup is missing.
- Job/requisition context is missing.
- Role conflict UX is weak.
- Documentation still says recruiter is out of scope.

### Privacy Risks

- Candidate email is exposed broadly.
- Raw media/resume URLs are exposed broadly.
- No audit trail exists for views, downloads, outreach, or media access.
- Websocket token appears in query string.

### Recommended Resolution

- Decide whether recruiter messaging is in or out of V1.
- Add company/recruiter profile setup before production recruiter usage.
- Add requisition context so search and outreach are tied to a hiring need.
- Restrict applicant data exposure and add audit logs.

## Concept / Market Pain-Point Agent

### Sourced Web Claims

- Sourced fact: Indeed's 2025 "Great Disconnect" report says job seekers face harder searches while employers report resume overload and qualification mismatch. Source: [Indeed, The Great Disconnect: Overlooked Talent, Overwhelmed Employers](https://www.indeed.com/lead/the-great-disconnect-overlooked-talent-overwhelmed-employers?co=US).
- Sourced fact: Criteria's 2024 Candidate Experience Report reports candidate frustration around competition, ghosting, bias, and changing views on degree requirements. Source: [Criteria, 2024 Candidate Experience Report](https://www.criteriacorp.com/2024-candidate-experience-report).
- Sourced fact: NACE recruiting benchmark materials cover early-talent sourcing, screening, selection processes, AI usage, budgets, and cycle times. Source: [NACE, 2025 Recruiting Benchmarks Report & Dashboard](https://naceweb.org/store/2025/research-reports/2025-nace-recruiting-benchmarks-report-dashboard/).
- Sourced fact: EEOC/DOJ guidance warns that AI/software hiring tools can violate disability discrimination law if they screen out candidates or fail to provide reasonable accommodation. Source: [EEOC/DOJ AI hiring warning](https://www.eeoc.gov/newsroom/us-eeoc-and-us-department-justice-warn-against-disability-discrimination).
- Sourced fact: Illinois regulates AI analysis of applicant video interviews, including notice, explanation, consent, sharing limits, and deletion obligations. Source: [Illinois Artificial Intelligence Video Interview Act](https://www.ilga.gov/Legislation/ILCS/Articles?ActID=4015&ChapterID=68&Print=).
- Sourced fact: Research on asynchronous video interviews finds design choices such as preparation time, rerecording, question count, and evaluation source affect applicant reactions. Sources: [Tilston et al. 2024](https://onlinelibrary.wiley.com/doi/abs/10.1002/hrm.22202), [Oostrom et al. 2024](https://research.tilburguniversity.edu/en/publications/applicant-reactions-to-algorithm-versus-recruiter-based-evaluatio/), [Roulin et al. 2026](https://research.vu.nl/en/publications/assessing-biasing-factors-in-asynchronous-video-interviews-applic/).

### Product Inference

The pain point is real: early-career candidates struggle to stand out, and recruiters struggle to screen high-volume applicant pools. However, positioning Cato as a mandatory video resume replacement is risky because it increases bias, privacy, accessibility, and candidate-trust concerns.

The stronger positioning is:

- Early-talent signal layer.
- Optional video, not mandatory video.
- Role-specific prompts.
- Prep and rerecording support.
- Non-video accommodation paths.
- Transcript/summary-first recruiter review.
- Status transparency for applicants.
- Recruiter workflow tooling tied to jobs/requisitions.
- Portfolio/work-sample evidence.
- Strong privacy controls.
- Practice mode before submission.

## Code Audit / Refactor Agent

### Current Architecture Assessment

The current TypeScript monorepo architecture is appropriate for the POC. A broad rewrite is not justified yet.

### Definitely Worth Doing

- Move onboarding state/rank/route rules into shared code.
- Split the 1400-line profile screen.
- Move API route orchestration into backend application services.
- Add shared Zod/contracts or OpenAPI/JSON Schema.
- Centralize controlled lists.
- Add env-gated logging.
- Keep resume handling PDF-only until there is a tested production document strategy.
- Add integration tests around critical flows.

### Not Worth Doing Yet

- Full React Native rewrite.
- Broad OOP rewrite.
- Go/Rust backend rewrite.
- Immediate Kotlin/Swift rewrite.

### Native Readiness

Kotlin/Swift readiness is moderate-low. Before native investment, Cato needs:

- OpenAPI or JSON Schema.
- Stable backend contracts.
- Explicit flow/state models.
- Native permission and media equivalents.
- Real signing and app IDs.

## Master Orchestrator Conflict-Resolution Notes

- The Logic, Applicant, and Code Audit agents all identified the same onboarding mismatch. This should be treated as the top product correctness issue, not three separate workstreams.
- The Backend and Recruiter agents both flagged applicant PII/media exposure. This should be consolidated into one privacy/access-control initiative covering recruiter permissions, URL access, audit logs, and candidate consent.
- The Applicant and Concept agents both raised video trust/accessibility concerns. The resolved recommendation is not to remove video entirely, but to make video optional or later-stage, with non-video alternatives.
- The Backend and Code Audit agents both raised test/readiness issues. These should be grouped into integration testing and dependency readiness rather than treated as separate backend cleanup.
- The Recruiter agent's fake search/results finding should be prioritized above recruiter UI polish because it affects core product truthfulness.
- No broad rewrite is recommended. The correct path is targeted shared-state refactoring, contract stabilization, backend hardening, privacy controls, and workflow completion.

## Final Prioritized Action List

1. Fix onboarding state/route mismatch and centralize onboarding rules in shared code.
2. Fully gate recruiter areas by auth, role, and explicit applicant-data authorization.
3. Replace fragile resume upload path with production-suitable upload handling.
4. Make video upload reliable, retryable, and persistent across app lifecycle interruptions.
5. Restrict applicant PII/media/resume URL exposure and add recruiter access audit logs.
6. Add dependency-aware health/readiness checks and invoke required Mongo indexes.
7. Replace fake recruiter search/results with real, scoped search behavior.
8. Decide V1 scope for recruiter messaging; either build real conversations or remove the claim.
9. Add recruiter/company profile and job/requisition context.
10. Replace dummy soft-skill outputs with production-grade analysis or remove production claims.
11. Add applicant loading, empty, error, retry, confirmation, and accessibility states.
12. Add stronger consent, accommodation, and non-video submission paths.
13. Move backend route orchestration into application services.
14. Add shared API contracts using Zod, OpenAPI, or JSON Schema.
15. Add integration tests for auth, onboarding, upload, recruiter access, deletion, and health.
