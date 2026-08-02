import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { deleteRecruiterAccount } from '../../src/api/recruiter';
import { LoadingOverlay } from '../../src/components/LoadingOverlay';
import { RecruiterContent } from '../../src/recruiter/RecruiterContent';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/hooks/useSession';
import { colors, controls, radii, spacing, typography } from '../../src/theme';

export default function RecruiterUpgradeScreen() {
  const { session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleLogout() {
    setTransitionMessage('Logging out...');
    setError(null);

    try {
      await supabase.auth.signOut();
      router.replace('/(auth)/sign-in');
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Unable to log out');
      setTransitionMessage(null);
    }
  }

  async function handleDeleteAccount() {
    if (!session?.access_token) {
      return;
    }

    setIsDeleting(true);
    setTransitionMessage('Deleting account...');
    setError(null);

    try {
      await deleteRecruiterAccount(session.access_token);
      await supabase.auth.signOut({ scope: 'local' });
      router.replace('/(auth)/sign-in');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete recruiter account');
      setTransitionMessage(null);
      setIsDeleting(false);
    }
  }

  function confirmLogout() {
    Alert.alert('Log out?', 'You will return to the welcome screen.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: handleLogout }
    ]);
  }

  function confirmDeleteAccount() {
    Alert.alert('Delete account?', 'This deletes your recruiter account. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: handleDeleteAccount, style: 'destructive' }
    ]);
  }

  return (
    <RecruiterContent>
      <LoadingOverlay message={transitionMessage ?? 'Working...'} visible={Boolean(transitionMessage)} />
      <Text style={styles.title}>Upgrade Plan</Text>
      <Text style={styles.body}>Unlock unlimited access and advanced tools.</Text>
      <View style={styles.plan}>
        <Text style={styles.planTitle}>Professional</Text>
        <Text style={styles.price}>$79 / month</Text>
        {['Unlimited candidate views', 'Contact candidates', 'Advanced search filters', 'Bookmarks and shortlist', 'Candidate comparison'].map((item) => (
          <Text key={item} style={styles.feature}>✓ {item}</Text>
        ))}
      </View>
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Upgrade Now</Text>
      </Pressable>
      <Pressable disabled={Boolean(transitionMessage)} onPress={confirmLogout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Log out</Text>
      </Pressable>
      <Pressable disabled={isDeleting || Boolean(transitionMessage)} onPress={confirmDeleteAccount} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>{isDeleting ? 'Deleting...' : 'Delete account'}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </RecruiterContent>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, ...typography.screenTitle },
  body: { marginTop: spacing.sm, color: colors.muted, ...typography.body },
  plan: {
    gap: spacing.md,
    marginTop: spacing.xxl,
    borderWidth: 2,
    borderColor: colors.purple,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.lg
  },
  planTitle: { color: colors.text, ...typography.sectionTitle },
  price: { color: colors.text, ...typography.label },
  feature: { color: colors.muted, ...typography.meta },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.buttonHeight,
    marginTop: spacing.xxl,
    borderRadius: radii.sm,
    backgroundColor: colors.primary
  },
  buttonText: { color: colors.primaryText, ...typography.button },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.secondaryButtonHeight,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface
  },
  logoutButtonText: { color: colors.danger, ...typography.button },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.secondaryButtonHeight,
    marginTop: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.danger
  },
  deleteButtonText: { color: colors.primaryText, ...typography.button },
  error: { marginTop: spacing.lg, color: colors.danger, ...typography.meta }
});
