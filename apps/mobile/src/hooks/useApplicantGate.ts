import { useApplicantBootstrap } from './useApplicantBootstrap';
import { useOnboardingStatus } from './useOnboardingStatus';

export function useApplicantGate(accessToken?: string, enabled = true) {
  const activeToken = enabled ? accessToken : undefined;
  const applicantState = useApplicantBootstrap(activeToken);
  const onboardingState = useOnboardingStatus(enabled && applicantState.applicant ? activeToken : undefined);

  return {
    accessToken: activeToken,
    applicant: applicantState.applicant,
    error: applicantState.error ?? onboardingState.error,
    isLoading: applicantState.isLoading || onboardingState.isLoading,
    onboardingStatus: onboardingState.status
  };
}
