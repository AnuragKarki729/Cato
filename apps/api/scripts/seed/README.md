# Cato dummy applicant seeding

Creates **applicant-only** dummy users so the recruiter feed/search/detail views
have realistic, varied data to work with. It creates **no recruiter users** and
**never** modifies real data.

## What it creates

For each dummy applicant (default 16, configurable):

- `applicants` — `onboardingStatus: "onboarding_complete"`, name, seed email,
  profile-image source, consents
- `education_profiles` — university, semester, major/minor, GPA, derived
  `majorFieldIds` / `minorFieldIds` used by recruiter category sorting
- `internships` — 0–3 per applicant (varies)
- `applicant_projects` — 0–3 post-onboarding projects with optional links
- `resumes` — real sample PDF for ~60%; the rest are marked `skipped`
- `applicant_signals` — selected prompt snapshot, elaboration, **mandatory 10s
  video**, prompt category fields, and an **optional 30s** deeper-signal video
  (~55%)
- `soft_skill_outputs` — 3–5 varied traits/ratings (`source: "dummy"`)
- `app_user_roles` — role `applicant`

Every document is tagged with `isSeed: true` and `seedTag: "cato-dummy-applicant"`.
Dummy users are **not** created in Supabase — they are not login-able and cannot
collide with real users (seed `supabaseUserId`/emails use dedicated prefixes and
the `cato-seed.invalid` domain). Each seed run uses a random batch suffix, so
reruns will not collide with previous dummy identities.

## Run the seed

```bash
cd apps/api
node scripts/seed-applicants.mjs            # ~16 applicants
SEED_COUNT=20 node scripts/seed-applicants.mjs
```

Dry run without Mongo writes or Cloudinary uploads:

```bash
cd apps/api
SEED_DRY_RUN=true node scripts/seed-applicants.mjs
```

## Reset (delete only seed data)

```bash
cd apps/api
node scripts/reset-applicants.mjs
```

Deletes only `{ isSeed: true }` Mongo documents and the Cloudinary `cato_seed/`
folder. It also deletes recruiter workflow records that point to seeded
applicant IDs, such as bookmarks, notes/reviews, interest requests, and messages.
Real applicants, recruiters, and unrelated data are untouched.

## Required env

Read from the repo-root `.env` (same as the other `apps/api` scripts):

- `MONGODB_URL` — **required** (seed + reset)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` —
  required unless `SEED_SKIP_MEDIA=true`

Optional:

- `SEED_COUNT` — number of applicants (1–200, default 16)

## Media

Sample videos are **generated locally** — the repo ships no video assets. Resume
seeding uses PDF only, matching the current app decision.

- **Default:** `ffmpeg` renders a small pool of short, **colorful portrait**
  clips (never black — uses `testsrc2`/`smptebars`/`rgbtestsrc`/etc.), uploads
  each once to Cloudinary under `cato_seed/`, and reuses them across applicants.
  Thumbnails are derived from a mid-clip frame, so they are never black either.
  Requires `ffmpeg` on PATH (`brew install ffmpeg`).

- **No ffmpeg / bring your own assets:** set `SEED_SKIP_MEDIA=true` and supply
  URLs you already host:

  ```bash
  SEED_SKIP_MEDIA=true \
  SEED_SAMPLE_10S_URL="https://..." \
  SEED_SAMPLE_THUMBNAIL_URL="https://..." \
  SEED_SAMPLE_30S_URL="https://..."        # optional \
  SEED_SAMPLE_RESUME_URL="https://..."     # optional \
  node scripts/seed-applicants.mjs
  ```

  `SEED_SAMPLE_10S_URL` + `SEED_SAMPLE_THUMBNAIL_URL` are the minimum in this mode
  (the 10s video is mandatory). In this mode Cloudinary cleanup is skipped on
  reset (assets are considered externally managed).

> Content of the clips does not matter for the POC — they just need to be real,
> playable, non-black videos so the feed looks and functions correctly.
