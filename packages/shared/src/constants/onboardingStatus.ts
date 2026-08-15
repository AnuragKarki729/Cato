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

export const onboardingRouteByStatus: Record<OnboardingStatus, string> = {
  auth_complete: '/(onboarding)/education',
  education_complete: '/(onboarding)/resume',
  resume_complete: '/(onboarding)/signal-prompt',
  signal_prompt_selected: '/(onboarding)/signal-video',
  signal_video_uploaded: '/(onboarding)/deeper-signal',
  deeper_signal_seen: '/(onboarding)/deeper-video',
  deeper_video_skipped: '/(onboarding)/soft-skills',
  deeper_video_uploaded: '/(onboarding)/soft-skills',
  profile_form_complete: '/(tabs)/home',
  onboarding_complete: '/(tabs)/home'
};

export const onboardingPathByStatus: Record<OnboardingStatus, string> = {
  auth_complete: '/education',
  education_complete: '/resume',
  resume_complete: '/signal-prompt',
  signal_prompt_selected: '/signal-video',
  signal_video_uploaded: '/deeper-signal',
  deeper_signal_seen: '/deeper-video',
  deeper_video_skipped: '/soft-skills',
  deeper_video_uploaded: '/soft-skills',
  profile_form_complete: '/home',
  onboarding_complete: '/home'
};

export const onboardingStatusRank: Record<OnboardingStatus, number> = {
  auth_complete: 0,
  education_complete: 1,
  resume_complete: 2,
  signal_prompt_selected: 3,
  signal_video_uploaded: 4,
  deeper_signal_seen: 5,
  deeper_video_skipped: 6,
  deeper_video_uploaded: 7,
  profile_form_complete: 8,
  onboarding_complete: 9
};

export function getNextOnboardingRoute(onboardingStatus: OnboardingStatus) {
  return onboardingRouteByStatus[onboardingStatus];
}

export function isAtLeastOnboardingStatus(current: OnboardingStatus, required: OnboardingStatus) {
  return onboardingStatusRank[current] >= onboardingStatusRank[required];
}
