import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LoadingScreen, ReconnectScreen } from '../../src/components/LoadingScreen';
import { useAppGate } from '../../src/hooks/useAppGate';

export default function TabsLayout() {
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

  if ((gate.onboardingStatus?.onboardingStatus ?? gate.applicant.onboardingStatus) !== 'onboarding_complete') {
    return <Redirect href={gate.onboardingStatus?.nextRoute ?? '/'} />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="home-outline" size={size} />
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="person-circle-outline" size={size} />
        }}
      />
    </Tabs>
  );
}
