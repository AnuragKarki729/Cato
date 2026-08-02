import type { OnboardingStatus } from '../constants/onboardingStatus';

export type OnboardingStatusResponse = {
  onboardingStatus: OnboardingStatus;
  nextRoute: string;
};
