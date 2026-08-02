import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { deleteRecruiterAccount } from '../../src/api/recruiter';
import { RecruiterContent } from '../../src/recruiter/RecruiterContent';
import { supabase } from '../../src/lib/supabase';
import { useSession } from '../../src/hooks/useSession';
import { colors, controls, radii, spacing, typography } from '../../src/theme';

export default function RecruiterUpgradeScreen() {
  const { session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/(auth)/sign-in');
  }

  async function handleDeleteAccount() {
    if (!session?.access_token) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      await deleteRecruiterAccount(session.access_token);
      await supabase.auth.signOut({ scope: 'local' });
      router.replace('/(auth)/sign-in');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete recruiter account');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <RecruiterContent>
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
      <Pressable onPress={handleLogout} style={styles.logoutButton}>
        <Text style={styles.logoutButtonText}>Log out</Text>
      </Pressable>
      <Pressable disabled={isDeleting} onPress={handleDeleteAccount} style={styles.deleteButton}>
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
