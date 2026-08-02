import type { Applicant, AppUserRole, OnboardingStatusResponse } from '@cato/shared';
import type { Session } from '@supabase/supabase-js';
import { useApplicantGate } from './useApplicantGate';
import { useAuthRole } from './useAuthRole';
import { useSession } from './useSession';

type AppGateState = {
  applicant: Applicant | null;
  error: Error | null;
  isLoading: boolean;
  loadingBanner: string;
  onboardingStatus: OnboardingStatusResponse | null;
  phase:
    | 'checking-session'
    | 'signed-out'
    | 'checking-role'
    | 'role-missing'
    | 'syncing-applicant'
    | 'ready'
    | 'reconnect';
  role: AppUserRole | null;
  session: Session | null;
};

export function useAppGate(): AppGateState {
  const sessionState = useSession();
  const roleState = useAuthRole(sessionState.session?.access_token);
  const applicantState = useApplicantGate(
    sessionState.session?.access_token,
    roleState.role === 'applicant'
  );

  if (sessionState.isLoading) {
    return {
      applicant: null,
      error: null,
      isLoading: true,
      loadingBanner: 'Checking your session',
      onboardingStatus: null,
      phase: 'checking-session',
      role: null,
      session: null
    };
  }

  if (!sessionState.session) {
    return {
      applicant: null,
      error: null,
      isLoading: false,
      loadingBanner: 'Checking your session',
      onboardingStatus: null,
      phase: 'signed-out',
      role: null,
      session: null
    };
  }

  if (roleState.isLoading) {
    return {
      applicant: null,
      error: null,
      isLoading: true,
      loadingBanner: 'Checking your account',
      onboardingStatus: null,
      phase: 'checking-role',
      role: null,
      session: sessionState.session
    };
  }

  if (roleState.error) {
    return {
      applicant: null,
      error: roleState.error,
      isLoading: false,
      loadingBanner: 'Checking your account',
      onboardingStatus: null,
      phase: 'reconnect',
      role: null,
      session: sessionState.session
    };
  }

  if (!roleState.role) {
    return {
      applicant: null,
      error: null,
      isLoading: false,
      loadingBanner: 'Checking your account',
      onboardingStatus: null,
      phase: 'role-missing',
      role: null,
      session: sessionState.session
    };
  }

  if (roleState.role !== 'applicant') {
    return {
      applicant: null,
      error: null,
      isLoading: false,
      loadingBanner: 'Checking your account',
      onboardingStatus: null,
      phase: 'ready',
      role: roleState.role,
      session: sessionState.session
    };
  }

  if (applicantState.error) {
    return {
      applicant: applicantState.applicant,
      error: applicantState.error,
      isLoading: false,
      loadingBanner: 'Checking your profile',
      onboardingStatus: applicantState.onboardingStatus,
      phase: 'reconnect',
      role: roleState.role,
      session: sessionState.session
    };
  }

  if (applicantState.isLoading || !applicantState.applicant) {
    return {
      applicant: applicantState.applicant,
      error: null,
      isLoading: true,
      loadingBanner: 'Checking your profile',
      onboardingStatus: applicantState.onboardingStatus,
      phase: 'syncing-applicant',
      role: roleState.role,
      session: sessionState.session
    };
  }

  return {
    applicant: applicantState.applicant,
    error: null,
    isLoading: false,
    loadingBanner: 'Checking your profile',
    onboardingStatus: applicantState.onboardingStatus,
    phase: 'ready',
    role: roleState.role,
    session: sessionState.session
  };
}
