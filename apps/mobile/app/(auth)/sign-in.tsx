import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { claimAuthRole } from '../../src/api/auth';
import { signInWithGoogle } from '../../src/auth/googleSignIn';
import { Button } from '../../src/components/Button';
import { CatoLogoMark } from '../../src/components/CatoLogoMark';
import { Screen } from '../../src/components/Screen';
import { StatusBanner } from '../../src/components/StatusBanner';
import { TextAction } from '../../src/components/TextAction';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing, typography } from '../../src/theme';

export default function SignInScreen() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        await claimAuthRole(data.session.access_token, { role: 'applicant' });
      }
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : 'Google sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen centered>
      <CatoLogoMark />
      <Text style={styles.title}>
        Show what makes you <Text style={styles.accent}>different.</Text>
      </Text>
      <Text style={styles.body}>
        Share your story, voice, and strengths in a way that feels more human than a form.
      </Text>
      <View style={styles.avatarRow}>
        {['A', 'M', 'J', 'S'].map((initial) => (
          <View key={initial} style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.meta}>Join students building their unique profile.</Text>
      <Button disabled={isSubmitting} onPress={handleGoogleSignIn} style={styles.primaryAction}>
        {isSubmitting ? 'Opening Google...' : 'Start My Profile'}
      </Button>
      <Button onPress={() => router.push('/(recruiter)/login')} style={styles.secondaryAction} variant="secondary">
        I am a recruiter
      </Button>
      <TextAction onPress={() => router.push('/privacy')}>Privacy Policy</TextAction>
      {error ? <StatusBanner message={error} tone="danger" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.xxxl,
    color: colors.text,
    ...typography.heroTitle
  },
  accent: {
    color: colors.accent
  },
  body: {
    marginTop: spacing.lg,
    color: colors.muted,
    ...typography.body
  },
  avatarRow: {
    flexDirection: 'row',
    marginTop: spacing.xxl
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    marginRight: -6,
    borderWidth: 2,
    borderColor: colors.background,
    borderRadius: 15,
    backgroundColor: colors.surface
  },
  avatarText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800'
  },
  meta: {
    marginTop: spacing.sm,
    color: colors.muted,
    ...typography.meta
  },
  primaryAction: {
    marginTop: spacing.xxxl
  },
  secondaryAction: {
    marginTop: spacing.md
  }
});
