import { Redirect, Stack, usePathname } from 'expo-router';
import { LoadingScreen, ReconnectScreen } from '../../src/components/LoadingScreen';
import { useAppGate } from '../../src/hooks/useAppGate';
import { useQueuedVideoUploads } from '../../src/media/videoUploadQueue';
import { onboardingPathByStatus, onboardingRouteByStatus } from '../../src/navigation/onboardingRoutes';

export default function OnboardingLayout() {
  const pathname = usePathname();
  const queuedUploads = useQueuedVideoUploads();
  const gate = useAppGate();

  if (gate.isLoading) {
    return <LoadingScreen banner={gate.loadingBanner} />;
  }

  if (!gate.session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (gate.role === 'recruiter') {
    return <Redirect href="/(recruiter)/dashboard" />;
  }

  if (gate.role !== 'applicant') {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (gate.phase === 'reconnect') {
    return <ReconnectScreen />;
  }

  if (!gate.applicant) {
    return <LoadingScreen banner="Checking your profile" />;
  }

  const currentStatus = gate.onboardingStatus?.onboardingStatus ?? gate.applicant.onboardingStatus;

  if (currentStatus === 'onboarding_complete') {
    return <Redirect href="/(tabs)/home" />;
  }

  const isPostVideoProfilePath =
    (currentStatus === 'deeper_video_skipped' || currentStatus === 'deeper_video_uploaded') &&
    (pathname === '/soft-skills' || pathname === '/profile-form');
  const isPendingUploadPath =
    ((queuedUploads.tenSecond || queuedUploads.tenSecondCompleted) &&
      (pathname === '/deeper-signal' || pathname === '/deeper-video')) ||
    ((queuedUploads.thirtySecond || queuedUploads.thirtySecondCompleted) &&
      (pathname === '/soft-skills' || pathname === '/profile-form'));
  const isRevisitingSignalPrompt = currentStatus === 'signal_prompt_selected' && pathname === '/signal-prompt';
  const isSelectingSignalPrompt = currentStatus === 'resume_complete' && pathname === '/signal-video';

  if (
    !isPostVideoProfilePath &&
    !isPendingUploadPath &&
    !isRevisitingSignalPrompt &&
    !isSelectingSignalPrompt &&
    pathname !== onboardingPathByStatus[currentStatus]
  ) {
    return <Redirect href={gate.onboardingStatus?.nextRoute ?? onboardingRouteByStatus[currentStatus]} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
