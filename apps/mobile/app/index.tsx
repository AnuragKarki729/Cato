import { Redirect } from 'expo-router';
import { LoadingScreen, ReconnectScreen } from '../src/components/LoadingScreen';
import { useAppGate } from '../src/hooks/useAppGate';
import { onboardingRouteByStatus } from '../src/navigation/onboardingRoutes';

export default function Index() {
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

  if (!gate.role) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (gate.phase === 'reconnect') {
    return <ReconnectScreen />;
  }

  if (!gate.applicant) {
    return <LoadingScreen banner="Checking your profile" />;
  }

  const nextRoute = gate.onboardingStatus?.nextRoute ?? onboardingRouteByStatus[gate.applicant.onboardingStatus];
  return <Redirect href={nextRoute} />;
}
