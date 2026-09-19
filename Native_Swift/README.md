# Native Swift Cato

This folder is the native iOS migration workspace for Cato.

## Structure

- `CatoNativeApp/`: SwiftUI application source.
- `CatoNative.xcodeproj`: runnable iOS project with `CatoNative` app and `CatoNativeCore` framework targets.
- `Sources/CatoNativeCore/`: testable app models, navigation state, API contracts, and scoring view models.
- `Sources/ResumeParser/`: deterministic resume text extraction and parsing.
- `Sources/ResumeParserCLI/`: local CLI for testing resume extraction.

# Resume Parser

This package is the iOS-side deterministic resume parsing core for Cato.

## Current scope

- Extract text from `.txt` and digital `.pdf` files.
- Parse plain resume text deterministically.
- Extract contact signals, GPA, resume sections, skill keywords, and parser confidence.
- Keep parsed output inspectable and editable later by the applicant.

## Intentional limits

- Scanned PDFs need OCR and are not handled here.
- DOCX extraction is not implemented in Swift yet because Foundation has no built-in ZIP reader. Add a small ZIP/XML reader or native dependency before enabling DOCX on iOS.
- Matching does not happen in this package. This package produces normalized text and structured fields for backend matching.

## Run tests

```sh
cd Native_Swift
swift test
```

## Run the native app

Open `CatoNative.xcodeproj` in Xcode, select the `CatoNative` scheme and an iOS simulator, then run it. The current bundle identifier is `com.anuragkarki.cato.native`, intentionally separate from the existing Expo app while the migration is in development.

## Native auth configuration

The native app reads runtime config from either Xcode scheme environment variables or generated Info.plist keys:

- `CATO_SUPABASE_URL`
- `CATO_SUPABASE_ANON_KEY`
- `CATO_API_BASE_URL`

For simulator development, set these in Xcode:

1. Open `CatoNative.xcodeproj`.
2. Select the `CatoNative` scheme.
3. Open `Edit Scheme...`.
4. Go to `Run > Arguments > Environment Variables`.
5. Add the three `CATO_*` values above.

For device/TestFlight builds, provide the same values through build settings, an `.xcconfig`, or the generated Info.plist keys:

- `CatoSupabaseURL`
- `CatoSupabaseAnonKey`
- `CatoAPIBaseURL`

Sign in with Apple is enabled in the native entitlements. For physical-device testing, the active bundle identifier must also have Sign in with Apple enabled in Apple Developer. The current migration bundle is `com.anuragkarki.cato.native`; switch it to `com.anuragkarki.cato` only when you want this native target to replace the Expo app identity.

## Parse a local file

```sh
cd Native_Swift
swift run resume-parser-cli /path/to/resume.pdf
```

The CLI prints deterministic JSON with:

- raw normalized text
- contact fields
- GPA
- detected sections
- detected skills
- parser confidence
- unparsed lines for later applicant correction
