import { Redirect, Stack, usePathname } from 'expo-router';
import { LoadingScreen, ReconnectScreen } from '../../src/components/LoadingScreen';
import { useAuthRole } from '../../src/hooks/useAuthRole';
import { useOnboardingStatus } from '../../src/hooks/useOnboardingStatus';
import { useSession } from '../../src/hooks/useSession';
import { useQueuedVideoUploads } from '../../src/media/videoUploadQueue';
import { onboardingPathByStatus, onboardingRouteByStatus } from '../../src/navigation/onboardingRoutes';

export default function OnboardingLayout() {
  const pathname = usePathname();
  const normalizedPathname = pathname.replace('/(onboarding)', '');
  const queuedUploads = useQueuedVideoUploads();
  const sessionState = useSession();
  const roleState = useAuthRole(sessionState.session?.access_token);
  const onboardingState = useOnboardingStatus(
    sessionState.session && roleState.role === 'applicant' ? sessionState.session.access_token : undefined
  );

  if (sessionState.isLoading || (sessionState.session && roleState.isLoading) || onboardingState.isLoading) {
    return <LoadingScreen banner="Checking onboarding" />;
  }

  if (!sessionState.session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (roleState.role === 'recruiter') {
    return <Redirect href="/(recruiter)/dashboard" />;
  }

  if (roleState.role !== 'applicant') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (roleState.error || onboardingState.error) {
    return <ReconnectScreen />;
  }

  const currentStatus = onboardingState.status?.onboardingStatus;

  if (!currentStatus) {
    return <LoadingScreen banner="Checking onboarding" />;
  }

  if (currentStatus === 'onboarding_complete') {
    return <Redirect href="/(tabs)/home" />;
  }

  const isPostVideoProfilePath =
    (currentStatus === 'deeper_video_skipped' || currentStatus === 'deeper_video_uploaded') &&
    (normalizedPathname === '/soft-skills' || normalizedPathname === '/profile-form');
  const isPendingUploadPath =
    ((queuedUploads.tenSecond || queuedUploads.tenSecondCompleted) &&
      (normalizedPathname === '/deeper-signal' || normalizedPathname === '/deeper-video')) ||
    (queuedUploads.tenSecondFailed && normalizedPathname === '/deeper-signal') ||
    ((queuedUploads.thirtySecond || queuedUploads.thirtySecondCompleted) &&
      (normalizedPathname === '/soft-skills' || normalizedPathname === '/profile-form')) ||
    (queuedUploads.thirtySecondFailed && normalizedPathname === '/soft-skills');
  const isRevisitingSignalPrompt = currentStatus === 'signal_prompt_selected' && normalizedPathname === '/signal-prompt';
  const isSelectingSignalPrompt = currentStatus === 'resume_complete' && normalizedPathname === '/signal-video';

  if (
    !isPostVideoProfilePath &&
    !isPendingUploadPath &&
    !isRevisitingSignalPrompt &&
    !isSelectingSignalPrompt &&
    normalizedPathname !== onboardingPathByStatus[currentStatus]
  ) {
    return <Redirect href={onboardingState.status?.nextRoute ?? onboardingRouteByStatus[currentStatus]} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
