# Native Swift App Plan

## Goal

Port Cato into a native SwiftUI iOS app, starting with the recruiter pivot flow.

## Current checkpoint

- Native Swift app source exists under `CatoNativeApp/`.
- `CatoNative.xcodeproj` now provides a runnable iOS app target and a separate `CatoNativeCore` framework target.
- Testable app models exist under `Sources/CatoNativeCore/`.
- Resume parser remains available under `Sources/ResumeParser/`.
- Swift tests validate native core fixtures and parser behavior.
- The app builds and launches on an iPhone 16 Pro simulator.
- Native auth bootstrapping is in place:
  - Email/password sign-in through Supabase Auth REST.
  - Sign in with Apple through `AuthenticationServices`, nonce hashing, and Supabase ID-token exchange.
  - Cato API role resolution and applicant/recruiter sync after sign-in.
  - Session refresh on app start.

## Recruiter screens started

- Login
- Dashboard
- Dynamic search
- Results
- Candidate review
- Bookmarks
- Messages placeholder

## Next native steps

1. Move native auth token persistence from `UserDefaults` to Keychain.
2. Add native Google OAuth/sign-in for iOS if Google remains a first-class iOS provider.
3. Replace fixture recruiter data with API-backed services.
4. Build the remaining recruiter pivot screens:
   - Evidence queue
   - Resume tab
   - Contact candidate
   - Shortlist
   - Candidate comparison
   - Subscription hidden for launch
5. Port video and resume preview flows.
