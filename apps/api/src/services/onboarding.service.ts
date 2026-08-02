type OnboardingStatus =
  | 'auth_complete'
  | 'education_complete'
  | 'resume_complete'
  | 'signal_prompt_selected'
  | 'signal_video_uploaded'
  | 'deeper_signal_seen'
  | 'deeper_video_skipped'
  | 'deeper_video_uploaded'
  | 'profile_form_complete'
  | 'onboarding_complete';

const routeByStatus: Record<OnboardingStatus, string> = {
  auth_complete: '/(onboarding)/education',
  education_complete: '/(onboarding)/resume',
  resume_complete: '/(onboarding)/signal-prompt',
  signal_prompt_selected: '/(onboarding)/signal-video',
  signal_video_uploaded: '/(onboarding)/deeper-signal',
  deeper_signal_seen: '/(onboarding)/deeper-video',
  deeper_video_skipped: '/(onboarding)/profile-form',
  deeper_video_uploaded: '/(onboarding)/profile-form',
  profile_form_complete: '/(tabs)/home',
  onboarding_complete: '/(tabs)/home'
};

const statusRank: Record<OnboardingStatus, number> = {
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
  return routeByStatus[onboardingStatus];
}

export function isAtLeastOnboardingStatus(current: OnboardingStatus, required: OnboardingStatus) {
  return statusRank[current] >= statusRank[required];
}
