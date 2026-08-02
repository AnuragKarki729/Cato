# Cato

Cato is a mobile-first applicant onboarding POC for university students. The current scope is applicant onboarding, placeholder home, profile/settings CRUD, Cloudinary media storage, MongoDB profile data, Supabase Google auth, and dummy randomized soft-skill output.

See [handoff.md](./handoff.md) for the source of truth.

## Current Status

This repository is a local POC scaffold with the applicant onboarding and settings surfaces implemented.

Implemented so far:

- Requirements handoff.
- Agent workflow plan.
- Secret-safe `.gitignore`.
- Environment variable template.
- npm workspace scaffold.
- Fastify API health check.
- Expo mobile placeholder shell.
- Shared constants package.
- Backend Supabase JWT guard.
- Applicant sync and `GET /me` API foundation.
- Mobile Supabase session hook and Google-only OAuth shell.
- Onboarding status API foundation.
- Education save endpoint.
- POC university search and email-domain matching endpoints.
- Backend-configured signal prompt endpoint.
- Mobile onboarding status routing and API wrappers.
- Resume skip endpoint.
- Cloudinary-backed resume upload endpoint foundation.
- Dummy randomized soft-skill generation.
- Soft-skill output endpoint.
- Mobile resume skip and deeper-signal soft-skill loading.
- Signal prompt selection endpoint.
- Signal state endpoint.
- Cloudinary-backed 10-second and 30-second video upload endpoint foundation.
- Optional 30-second video skip endpoint.
- Mobile signal prompt, signal video, deeper signal, and deeper video flow wiring.
- Profile aggregation endpoint.
- Onboarding profile completion endpoint.
- Education and internship CRUD endpoints.
- Soft-skill edit endpoint.
- Account deletion endpoint with MongoDB, Cloudinary, and Supabase cleanup.
- Mobile profile form and profile/settings API wiring.
- Mobile resume document picker upload.
- Mobile camera recording upload for 10-second and 30-second video flows.
- Auth, onboarding, and tab route guards backed by backend onboarding status.
- Real onboarding profile form using saved education, standardized semesters, and controlled internship roles.
- Resume and video read/delete routes for profile/settings media management.
- Cloudinary cleanup when resumes or videos are replaced.
- Mobile profile/settings screen for education edits, internship CRUD, soft-skill edits, resume upload/delete, video retake/delete, optional 30-second completion, and account deletion.
- Mobile education onboarding with email-domain university match, manual university search/select, semester selection, and saved progress.
- Mobile onboarding screens navigate to the next required step after successful saves/uploads/skips.
- Mobile onboarding layout redirects incomplete applicants to the exact next required step.
- Mobile OAuth callback route for Supabase Google sign-in deep links.
- Backend onboarding endpoints enforce required previous steps, including mandatory 10-second video before deeper signal.
- Applicant onboarding status updates are monotonic and set `onboardingCompletedAt` on completion.
- Backend signal prompt selection snapshots server-owned prompt text instead of trusting client-provided prompt copy.
- Backend profile validation enforces the controlled internship role/department list.
- Resume and video consent timestamps are stored on the applicant record and enforced by media upload endpoints.
- Mobile onboarding and profile/settings media actions include POC consent acknowledgement before resume upload or video recording.
- Mobile privacy policy placeholder is available from sign-in, media consent screens, and profile/settings.

## POC Scope

In scope:

- React Native mobile app.
- Fastify + TypeScript backend.
- Supabase Google auth.
- MongoDB application data.
- Cloudinary resumes and videos.
- Dummy randomized soft-skill output.
- Applicant onboarding route guards.
- Placeholder home.
- Profile/settings CRUD.
- Account deletion.

Out of scope:

- Recruiters.
- Apple sign-in.
- LinkedIn sign-in.
- Redis.
- Real AI/Gemini parsing.
- App Store/TestFlight readiness.

## Environment

Copy `.env.example` to `.env` and fill in values locally.

The POC uses Expo-style public mobile variables:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_API_BASE_URL
```

Backend-only secrets must never be exposed to the mobile app:

```text
SUPABASE_SERVICE_ROLE_KEY
CLOUDINARY_API_SECRET
MONGODB_URL
```

## Runtime

Use Node 20 for local development.

```sh
nvm use
npm install
```

The current shell used for scaffolding had Node 22, which can trigger an Expo SDK 51 CLI free-port issue during `expo start`.

## Structure

```text
apps/
  api/
  mobile/
packages/
  shared/
```

## Commands

```sh
npm run typecheck
npm run build
npm run verify
npm run preflight:api
npm run dev:api
npm run smoke:api
npm run smoke:api:auth
npm run smoke:api:disposable
npm run dev:mobile
```

API health check:

```sh
curl http://127.0.0.1:4000/health
```

Protected auth route smoke checks:

```sh
curl -i http://127.0.0.1:4000/me
curl -i -X POST http://127.0.0.1:4000/auth/sync
curl -i http://127.0.0.1:4000/onboarding/status
curl -i "http://127.0.0.1:4000/universities/search?q=ucla"
curl -i http://127.0.0.1:4000/signal-prompts
curl -i http://127.0.0.1:4000/resume
curl -i -X DELETE http://127.0.0.1:4000/resume
curl -i -X POST http://127.0.0.1:4000/onboarding/resume/skip
curl -i http://127.0.0.1:4000/profile/soft-skills
curl -i http://127.0.0.1:4000/signal
curl -i -X POST http://127.0.0.1:4000/onboarding/signal-prompt
curl -i -X POST http://127.0.0.1:4000/videos/10-second
curl -i -X POST http://127.0.0.1:4000/videos/30-second
curl -i http://127.0.0.1:4000/videos
curl -i -X DELETE http://127.0.0.1:4000/videos/10-second
curl -i -X DELETE http://127.0.0.1:4000/videos/30-second
curl -i -X POST http://127.0.0.1:4000/onboarding/deeper-video/skip
curl -i http://127.0.0.1:4000/profile
curl -i -X POST http://127.0.0.1:4000/onboarding/profile
curl -i -X POST http://127.0.0.1:4000/profile/internships
curl -i -X PATCH http://127.0.0.1:4000/profile/soft-skills
curl -i -X DELETE http://127.0.0.1:4000/account
```

Without a bearer token, protected routes should return `401`.

## API Smoke Test

API preflight check:

```sh
npm run preflight:api
```

This checks required env variables and network reachability for Supabase Auth, MongoDB, and Cloudinary without printing secret values.

Start the API in one terminal:

```sh
npm run dev:api
```

Run the smoke test in another terminal:

```sh
npm run smoke:api
```

Set `API_BASE_URL` to smoke-check a deployed API:

```sh
API_BASE_URL=https://your-api.up.railway.app npm run smoke:api
```

Authenticated smoke test:

```sh
SUPABASE_ACCESS_TOKEN=your-session-access-token npm run smoke:api:auth
```

The authenticated smoke test verifies:

- Supabase bearer-token authentication.
- MongoDB applicant sync.
- Onboarding status progression.
- Education save.
- Resume skip, unless `TEST_RESUME_DATA_URI` is provided.
- Signal prompt selection.
- Mandatory 10-second video upload through Cloudinary.
- Rejection of deleting the mandatory 10-second video.
- Deeper signal progression.
- 30-second video skip, unless `TEST_THIRTY_SECOND_VIDEO_DATA_URI` is provided.
- Profile completion.
- Profile aggregation.
- Profile/settings education update.
- Profile/settings internship create, update, and delete.
- Profile/settings soft-skill update.

Optional Cloudinary upload checks:
Required Cloudinary media for full authenticated onboarding:

```sh
SUPABASE_ACCESS_TOKEN=your-session-access-token \
TEST_RESUME_DATA_URI='data:application/pdf;base64,...' \
TEST_TEN_SECOND_VIDEO_DATA_URI='data:video/mp4;base64,...' \
TEST_THIRTY_SECOND_VIDEO_DATA_URI='data:video/mp4;base64,...' \
npm run smoke:api:auth
```

`TEST_TEN_SECOND_VIDEO_DATA_URI` is required because the first signal video is mandatory. Resume and 30-second video media are optional in the product flow.

Account deletion is intentionally disabled by default. To verify full account deletion with a disposable test user:

```sh
SUPABASE_ACCESS_TOKEN=disposable-test-user-token \
DELETE_SMOKE_ACCOUNT=true \
npm run smoke:api:auth
```

Disposable-user authenticated smoke test:

```sh
npm run smoke:api:disposable
```

This command:

- Creates a confirmed temporary Supabase user.
- Signs in with the public anon key.
- Runs the authenticated smoke test with the generated access token.
- Forces `DELETE_SMOKE_ACCOUNT=true`.
- Deletes the Supabase test user again in cleanup.

Use optional `SMOKE_TEST_EMAIL` and `SMOKE_TEST_PASSWORD` only when you need deterministic credentials for a disposable test user.

This check requires DNS/network access to the configured Supabase project host. If it fails before user creation with a fetch/DNS error, verify local network access to `SUPABASE_URL`.

## Railway

`railway.json` is configured for the API service.

Required Railway variables:

```text
PORT
NODE_ENV
CORS_ORIGIN
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
MONGODB_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_URL
```
