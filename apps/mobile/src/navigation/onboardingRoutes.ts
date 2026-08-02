import type { OnboardingStatus } from '@cato/shared';

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
