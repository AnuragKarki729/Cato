# Native Kotlin

This module contains Android-side Kotlin work for Cato.

It started as the deterministic resume parsing core. It now also contains the dependency-free Kotlin contract/state/use-case layer for mirroring the completed native Swift app in `../Native_Swift`.

## Current scope

### Native Android mirror contracts

- Core Cato API routes and request payloads.
- Supabase auth request contracts.
- Auth/session/bootstrap state.
- Applicant home/profile/settings/requests/reels state.
- Recruiter dashboard/search/results/reels/candidate-review state.
- Candidate review sticky action specs.
- Shared matching option picker state.
- Local unit tests documenting expected behavior.

See:

- `ANDROID_MIRROR_PROGRESS.md`
- `IOS_TO_ANDROID_MIRROR_MAP.md`

### Resume parser

- Extract text from `.txt`.
- Extract basic text from `.docx` using deterministic ZIP/XML reading.
- Parse plain resume text deterministically.
- Extract contact signals, GPA, resume sections, skill keywords, and parser confidence.
- Skill extraction uses explicit boundaries so symbolic skills such as `c++` and `ui/ux` work without matching unrelated words.

## Intentional limits

- Android does not provide reliable native PDF text extraction through the standard SDK. `PdfRenderer` renders pages but does not extract text.
- Digital PDF extraction should use a dedicated native/library-backed text extractor before production.
- Scanned PDFs need OCR and are not handled here.
- Matching does not happen in the resume parser. The app contracts include matching/search request payloads, but backend scoring remains server-side.
- This repository does not currently include a full Android app module or Compose UI dependency setup.

## Run tests

Add a Gradle wrapper or open the module in Android Studio with a local Gradle installation, then run:

```sh
./gradlew test
```

In this Codex session, tests could not be executed because no `gradle` command or Gradle wrapper was available, and dependency/tool installation was explicitly out of scope.
