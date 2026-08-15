# Cato Feature Adds

## Core Essence

Cato is a verified warm-intro marketplace for early talent. Students build signal profiles; recruiters send intentional interest requests; students accept before messaging.

## Priority 1

1. Recruiter Interest Requests
   - Recruiter taps `Interested`, adds a short reason, and sends a request.
   - Direct messaging is blocked until the applicant accepts.
   - Current POC status: implemented.

2. Applicant Request Inbox
   - Applicant sees company, recruiter, reason, role/category, and request status.
   - Applicant can accept or decline.
   - Current POC status: implemented with confirmation dialogs.

3. Messaging After Acceptance
   - WebSocket/chat opens only after an applicant accepts a recruiter request.
   - Current POC status: implemented as recruiter-side WebSocket-refreshed message log after acceptance.

4. Recruiter Review Workflow
   - Add shortlist, maybe, and pass states before sending interest.

5. Request Status Tracking
   - Track `sent`, `viewed`, `accepted`, `declined`, and `expired`.
   - Current POC status: implemented with 14-day expiry, 14-day declined-request cooldown, 25 pending-request limit, and 20 requests per 24 hours.

## Priority 2

6. Role-Fit Prompt Sets
   - Prompt sets vary by role family: engineering, sales, finance, design, and operations.

7. Proof-of-Work Section
   - Post-onboarding feature, not required during initial applicant onboarding.
   - Applicant can add project links, files, or short entries explaining what they built or solved.
   - Each project entry should support: project title, `What I built`, problem solved, applicant role, tools/skills used, link, and optional file upload.
   - Optional short project explanation video can be considered later, but should not be required for V1.

8. Profile Readiness Score
   - Rule-based internal score using resume, videos, proof-of-work, education, internships, and profile freshness.
   - Decision: profile strength must not over-penalize students without internships because many users are joining Cato to find their first internship.
   - Score weighting decision:
     - Resume, short take, deeper signal, and soft skills together account for 70%.
     - Projects account for 20% total: 1 project = 10%, 2 projects = 17%, 3+ projects = 20%.
     - Internships account for 10% total: 1+ internship = 10%, additional internships do not increase this portion.
   - Not exposed as public gamification.

9. Recruiter Filters
   - Filter by major, university, semester, GPA, internship experience, role interest, and location preference.
   - Applicant intent must be separated so students seeking internships do not compete directly against students seeking full-time placement jobs.
   - Recruiter search/ranking should support intent-specific pools: `internship` and `full_time_placement`.
   - Support specific university search and nearby university/location-radius filtering.
   - Support recruiter-created saved university lists such as `Target Schools`.
   - Avoid making prestige-only categories such as `Ivy League only` a first-class public filter because it can reinforce prestige bias.
   - If university groupings are needed later, keep them configurable and recruiter-defined rather than hardcoded as product-wide prestige tiers.

10. Applicant Visibility Controls
    - Pause discovery, hide resume, hide deeper signal, and preview recruiter view.

## Priority 3

11. Recruiter Request Limits
    - Current POC status: implemented for recruiter-level limits.
    - Future production work: add company-level limits, abuse monitoring, and admin override tooling.

12. Anti-Ghosting Metrics
    - Track response time and unresponded requests for both applicants and recruiters.
    - Current POC status: partially supported by request status timestamps; analytics UI not implemented.

13. Verified Recruiter Company
    - Company email/domain verification and basic company profile.

14. Candidate Comparison View
    - Compare shortlisted students side by side using standardized profile fields.

15. Alternative Written Signal
    - Optional written answer fallback for candidates who do not want to rely only on video.

## Priority 4

16. Recruiter Templates
    - Structured outreach templates with required personalization.

17. Applicant Activity Feed
    - Show profile viewed, request received, request accepted, and message started.

18. Admin Review Tools
    - Basic admin tools for reported users, recruiters, companies, and suspicious activity.

19. University Expansion / Nearby University Search
    - Add larger university dataset, search pagination, and later GPS-nearby university suggestions.

20. AI Later
    - Resume parsing, summaries, ranking assist, and spam detection are future enhancements, not core V1 requirements.
