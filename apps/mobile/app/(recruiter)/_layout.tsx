import { Redirect, Stack, usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoadingScreen, ReconnectScreen } from '../../src/components/LoadingScreen';
import { useAuthRole } from '../../src/hooks/useAuthRole';
import { useSession } from '../../src/hooks/useSession';
import { InAppNotificationProvider } from '../../src/notifications/InAppNotificationProvider';
import { getNotificationSeenKey, useNotificationCount } from '../../src/notifications/notificationSeenStore';
import { RecruiterNav } from '../../src/recruiter/RecruiterNav';
import { colors } from '../../src/theme';

function getActiveRecruiterTab(pathname: string) {
  if (pathname.includes('/feed')) {
    return 'feed';
  }

  if (
    pathname.includes('/search') ||
    pathname.includes('/results') ||
    pathname.includes('/evidence-queue') ||
    pathname.includes('/shortlist') ||
    pathname.includes('/comparison')
  ) {
    return 'search';
  }

  if (pathname.includes('/bookmarks')) {
    return 'bookmarks';
  }

  if (pathname.includes('/messages')) {
    return 'messages';
  }

  if (pathname.includes('/upgrade')) {
    return 'account';
  }

  return 'home';
}

function shouldShowRecruiterNav(pathname: string) {
  return !pathname.includes('/login') && !pathname.includes('/contact') && !pathname.includes('/candidate/') && !pathname.includes('/feed');
}

export default function RecruiterLayout() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isLoading, session } = useSession();
  const roleState = useAuthRole(session?.access_token);
  const isLoginRoute = pathname.includes('/login');
  const requestSeenKey = session?.user.id ? getNotificationSeenKey('recruiter', session.user.id, 'requests') : undefined;
  const unseenRequests = useNotificationCount(requestSeenKey);

  if (isLoading || (session && roleState.isLoading)) {
    return <LoadingScreen banner="Loading Cato" />;
  }

  if (!session && !isLoginRoute) {
    return <Redirect href="/(recruiter)/login" />;
  }

  if (session && roleState.error) {
    return <ReconnectScreen />;
  }

  if (session && roleState.role === 'applicant') {
    return <Redirect href="/" />;
  }

  if (session && roleState.role === 'recruiter' && isLoginRoute) {
    return <Redirect href="/(recruiter)/dashboard" />;
  }

  if (session && roleState.role !== 'recruiter' && !isLoginRoute) {
    return <Redirect href="/(recruiter)/login" />;
  }

  const showNav = shouldShowRecruiterNav(pathname);
  const isFeed = pathname.includes('/feed');

  return (
    <InAppNotificationProvider accessToken={session?.access_token} requestSeenKey={requestSeenKey} role="recruiter">
      <SafeAreaView edges={isFeed ? ['left', 'right'] : ['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.shell}>
          <View style={styles.content}>
            <Stack screenOptions={{ headerShown: false }} />
          </View>
          {showNav ? (
            <View style={[styles.navDock, { paddingBottom: Math.max(insets.bottom, 10) }]}>
              <RecruiterNav active={getActiveRecruiterTab(pathname)} homeBadgeCount={unseenRequests} />
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </InAppNotificationProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  shell: {
    flex: 1
  },
  content: {
    flex: 1
  },
  navDock: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 18,
    paddingTop: 10
  }
});
