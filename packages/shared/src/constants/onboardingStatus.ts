export const onboardingStatuses = [
  'auth_complete',
  'education_complete',
  'resume_complete',
  'signal_prompt_selected',
  'signal_video_uploaded',
  'deeper_signal_seen',
  'deeper_video_skipped',
  'deeper_video_uploaded',
  'profile_form_complete',
  'onboarding_complete'
] as const;

export type OnboardingStatus = (typeof onboardingStatuses)[number];
