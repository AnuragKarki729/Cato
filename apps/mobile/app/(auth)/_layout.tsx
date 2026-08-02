import { Redirect, Stack } from 'expo-router';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { useAuthRole } from '../../src/hooks/useAuthRole';
import { useSession } from '../../src/hooks/useSession';

export default function AuthLayout() {
  const { isLoading, session } = useSession();
  const roleState = useAuthRole(session?.access_token);

  if (isLoading || roleState.isLoading) {
    return <LoadingScreen banner="Loading Cato" />;
  }

  if (session && roleState.role === 'recruiter') {
    return <Redirect href="/(recruiter)/dashboard" />;
  }

  if (session && roleState.role === 'applicant') {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
