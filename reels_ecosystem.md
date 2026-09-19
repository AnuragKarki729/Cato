# Cato Reels/Profile Ecosystem Scope

## Purpose

This document is the ground truth for the applicant reels/profile ecosystem across native iOS and native Android.

The goal is to evolve Cato from a static applicant profile into a lightweight professional video profile network. Applicants can show evidence through short videos tied to real work, while recruiters can discover, evaluate, and express interest based on specific signals.

## Core Concept

Cato profiles should feel closer to an Instagram/TikTok-style professional profile, but constrained for hiring quality:

- Applicants can publish multiple short videos.
- Each video must be connected to real evidence: a project, internship, or accomplishment.
- Recruiters can discover applicants through video and then inspect deeper recruiting-only profile data.
- Applicants can view other applicant public profiles/videos, but not recruiter-only information.
- Messaging remains controlled and only opens after an accepted recruiter interest request.

## Video Rules

- The first introductory/hook video does not count toward the evidence video cap.
- Evidence videos are capped at 10 total per applicant:
  - 1 deeper signal video
  - up to 9 reel videos
- Each reel video has a max duration of 60 seconds.
- The deeper signal video remains the existing deeper-signal asset and counts against the evidence-video cap once present.
- Videos should be compressed/uploaded in storage-efficient quality, not highest quality.
- Videos must not be blank/black placeholder content.
- Videos have:
  - caption
  - like count
  - view count
  - created/updated timestamp
  - linked evidence items
- No comments in the first version.
- No editing after publish in the first version, except delete/replace if explicitly added later.

## Evidence Linking Rules

Every video must link to at least one of:

- project
- internship
- accomplishment

Relationship rules:

- One video can link to multiple projects/internships/accomplishments.
- One project/internship/accomplishment can have multiple videos.
- A profile can have uneven distribution, for example:
  - 4 videos for one accomplishment
  - 2 videos for one project
  - 2 videos for another project
  - 2 videos for one internship

The point is not equal distribution. The point is that every video has context.

## Applicant Visibility

Applicants can view:

- their own video grid/profile
- other applicants' public video profiles
- public captions, likes, and view counts
- public project/accomplishment context if marked visible

Applicants cannot view recruiter-only data for other applicants:

- resume/CV
- recruiter notes
- recruiter review state
- recruiter interest history
- private hiring metadata

Applicants cannot message other applicants.

## Recruiter Visibility

Recruiters can view:

- applicant video feed
- applicant profile
- video captions
- linked project/internship/accomplishment context
- resume/CV when available
- recruiter-only evidence sections
- match/audit explanations
- profile completeness/matching data

Recruiters can:

- like a video
- save/bookmark applicant
- send interest request based on a video
- open applicant profile from a video

Recruiter interest from a video should preserve the source context:

- videoId
- applicantId
- recruiterId
- linked project/internship/accomplishment IDs
- optional note/message later

Recruiters cannot message applicants until the applicant accepts the interest request.

Recruiters cannot message other recruiters.

## Feed Behavior

There should be two primary feed modes:

1. Applicant public discovery feed
   - Applicant-to-applicant viewing.
   - No recruiter-only data.
   - Like/view only.

2. Recruiter discovery feed
   - Recruiter-focused.
   - Includes interest action.
   - Includes route to candidate review/profile.
   - Can use matching/search filters.

Feed video behavior:

- Vertical reels-style scrolling.
- One active video per viewport.
- Active video autoplay.
- Offscreen videos pause.
- Leaving the screen pauses video.
- Tapping video can dim overlays if overlays conflict visually.
- Safe area must be respected for controls, but video should visually occupy the full viewport.

## Profile Layout

Applicant profile should have:

- profile header
- basic education/category context
- video grid/feed
- projects
- internships
- accomplishments
- resume status, recruiter-only
- profile strength/internal completion cues

Public applicant view should hide:

- resume
- recruiter notes
- recruiter review status
- interest request internals

Recruiter applicant view can show:

- resume
- evidence queue
- projects/internships/accomplishments
- video evidence
- match score
- why-this-match explanation
- interest/request controls

## Backend Models Needed

### applicant_videos

Suggested fields:

- id
- applicantId
- caption
- videoUrl
- thumbnailUrl
- durationSeconds
- storageProvider
- fileSizeBytes
- transcodeStatus: pending | ready | failed
- visibility: public | hidden
- likeCount
- viewCount
- createdAt
- updatedAt
- deletedAt optional

Indexes:

- applicantId, createdAt desc
- visibility, createdAt desc
- transcodeStatus, createdAt desc

### applicant_video_links

Many-to-many relationship between videos and evidence.

Suggested fields:

- id
- videoId
- applicantId
- targetType: project | internship | accomplishment
- targetId
- createdAt

Indexes:

- videoId
- applicantId, targetType
- targetType, targetId

Constraints:

- each video must have at least one link before publish
- targetId must belong to the same applicant

### applicant_accomplishments

Suggested fields:

- id
- applicantId
- title
- description
- categoryFieldIds
- skillIds
- linkUrl optional
- visibility: public | recruiter_only | hidden
- createdAt
- updatedAt

Indexes:

- applicantId, createdAt desc
- categoryFieldIds
- skillIds

### applicant_video_likes

Suggested fields:

- id
- videoId
- actorId
- actorType: applicant | recruiter
- createdAt

Indexes:

- videoId
- actorType, actorId
- unique videoId + actorType + actorId

### applicant_video_views

Suggested fields:

- id
- videoId
- actorId optional
- actorType optional
- sessionId optional
- viewedAt

Implementation note:

- Avoid one write per autoplay loop.
- Count unique view windows or debounce server writes.
- Later this can move to batched analytics.

### interest_requests source fields

Interest requests should support optional source fields:

- sourceType: profile | video | search | match_proposal
- sourceVideoId optional
- sourceProjectId optional
- sourceInternshipId optional
- sourceAccomplishmentId optional

## API Surface Needed

Applicant:

- POST /applicant/reels/upload-url
- POST /applicant/reels/complete
- GET /applicant/reels
- DELETE /applicant/reels/:id
- POST /applicant/accomplishments
- GET /applicant/accomplishments
- PUT /applicant/accomplishments/:id
- DELETE /applicant/accomplishments/:id

Public/applicant discovery:

- GET /videos/feed
- POST /videos/:id/view
- POST /videos/:id/like
- DELETE /videos/:id/like
- GET /applicants/:id/public-profile

Recruiter:

- GET /recruiter/videos/feed
- GET /recruiter/candidates/:id/profile
- POST /recruiter/interest-requests with optional sourceVideoId

Existing recruiter interest endpoint accepts source context:

- POST /recruiter/candidates/:id/interest
  - sourceType: profile | video | search | match_proposal
  - sourceVideoId optional
  - sourceProjectId optional
  - sourceInternshipId optional
  - sourceAccomplishmentId optional

## Backend Implementation Status

Implemented initial shared backend foundation:

- applicant reel video collection
- applicant video evidence links
- applicant accomplishments
- video likes
- video views
- direct signed Cloudinary upload URL for reels
- 9 reel video cap
- 60 second reel max duration
- 80MB reel max file size guard
- 720p/eco delivery URL generation
- evidence link validation before publish
- applicant reel list/delete endpoints
- public video feed endpoint
- recruiter video feed endpoint
- like/unlike endpoint
- view tracking endpoint
- optional source metadata on recruiter interest requests
- account deletion cleanup for reels/accomplishments/video engagement

Not implemented yet:

- native iOS reels UI
- native Android reels UI
- background transcoding queue
- moderation/reporting
- view debounce/batching
- recruiter interest directly from reel UI
- matching score boosts from video evidence

## Matching Integration

Videos should not replace deterministic matching.

Videos should add evidence signals:

- project video exists
- accomplishment video exists
- internship video exists
- video linked to selected field/skill context
- profile has recruiter-viewable evidence

Initial scoring behavior:

- videos can boost evidence/profile completeness
- videos should not hard-exclude applicants
- likes/views should not heavily affect ranking at first to avoid popularity bias
- recruiter interest from video should improve future recruiter-side relevance signals, not global applicant quality

Soft skills remain low priority because current soft skill generation is unreliable and may be deprecated.

## Storage/Transcoding Requirements

Initial implementation:

- max 60 seconds per video
- cap evidence videos at 10 total: 1 deeper signal + 9 reels
- the intro/hook video is separate from this cap
- clients should upload compressed video first, targeting fast delivery and low storage
- backend signed upload responses should return constraints so iOS and Android use the same limits
- delivery URLs should prefer automatic quality/format transformations
- store thumbnail
- reject unsupported files gracefully
- keep upload failure non-blocking to the rest of the profile

Later:

- background transcoding queue
- adaptive streaming if needed
- CDN/cache policy
- moderation pipeline

## Trust And Safety

Required controls:

- applicant can delete/hide own video
- applicant can pause discovery
- recruiter/applicant can report video/profile
- block company/recruiter later
- private or recruiter-only evidence visibility

Do not allow:

- applicant-to-applicant messaging
- recruiter-to-recruiter messaging
- comments in initial version

## Native iOS Ground Truth

Swift implementation should include:

- applicant video upload flow
- evidence selection before publish
- reels feed component
- profile video grid
- recruiter feed with interest action
- source-aware interest request creation
- full viewport video behavior
- safe-area controls over full-bleed video

## Native Android Ground Truth

Kotlin implementation must match this document, not the legacy Expo implementation.

Android should implement:

- same data model assumptions
- same API contract
- same max video count/duration rules
- same public vs recruiter-only visibility rules
- same feed behavior
- same source-aware recruiter interest flow

## First Implementation Phases

### Phase 1: Backend Data Model

- Add applicant videos.
- Add accomplishments.
- Add video-to-evidence links.
- Add likes/views.
- Add source fields to interest requests.

### Phase 2: Applicant Creation Flow

- Add accomplishment CRUD.
- Add video upload.
- Require evidence link before publish.
- Show applicant video profile/grid.

### Phase 3: Recruiter Discovery

- Add recruiter reels feed.
- Add video-driven candidate profile entry.
- Add interest request from video.

### Phase 4: Applicant Public Discovery

- Add public applicant feed.
- Hide recruiter-only fields.
- Add applicant likes/views.

### Phase 5: Ranking Integration

- Add video evidence boosts.
- Add source-aware analytics.
- Avoid popularity-biased ranking until enough trust controls exist.

## Open Decisions

- Whether accomplishments are public by default or recruiter-only by default.
- Whether applicants can replace videos or only delete/re-upload.
- Whether a recruiter like should be visible to the applicant.
- Whether video views should be exact counts or rounded/bucketed counts.
- Whether applicant public discovery launches before recruiter video discovery.
