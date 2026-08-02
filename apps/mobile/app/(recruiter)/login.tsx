import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { claimAuthRole } from '../../src/api/auth';
import { syncRecruiter } from '../../src/api/recruiter';
import { signInWithGoogle } from '../../src/auth/googleSignIn';
import { Button } from '../../src/components/Button';
import { CatoLogoMark } from '../../src/components/CatoLogoMark';
import { Field } from '../../src/components/Field';
import { Screen } from '../../src/components/Screen';
import { StatusBanner } from '../../src/components/StatusBanner';
import { TextAction } from '../../src/components/TextAction';
import { useKeyboardAwareScroll } from '../../src/forms/useKeyboardAwareScroll';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing, typography } from '../../src/theme';

export default function RecruiterLoginScreen() {
  const keyboardScroll = useKeyboardAwareScroll();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    setError(null);
    setIsSubmitting(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (authError || !data.session) {
        throw authError ?? new Error('Recruiter login failed');
      }

      await claimAuthRole(data.session.access_token, { role: 'recruiter' });
      await syncRecruiter(data.session.access_token);
      router.replace('/(recruiter)/dashboard');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Recruiter login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignUp() {
    setError(null);
    setIsSubmitting(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password
      });

      if (authError) {
        throw authError;
      }

      if (data.session) {
        await claimAuthRole(data.session.access_token, { role: 'recruiter' });
        await syncRecruiter(data.session.access_token);
        router.replace('/(recruiter)/dashboard');
        return;
      }

      setError('Check your email to confirm your recruiter account.');
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : 'Recruiter signup failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setIsSubmitting(true);

    try {
      await signInWithGoogle();
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        return;
      }

      await claimAuthRole(data.session.access_token, { role: 'recruiter' });
      await syncRecruiter(data.session.access_token);
      router.replace('/(recruiter)/dashboard');
    } catch (googleError) {
      setError(googleError instanceof Error ? googleError.message : 'Google recruiter login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen scroll scrollRef={keyboardScroll.scrollRef}>
      <CatoLogoMark size="lg" />
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.body}>Log in to your recruiter account.</Text>
      <View onLayout={keyboardScroll.registerField('recruiter-email')}>
        <Field
          autoCapitalize="none"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          onFocus={() => keyboardScroll.focusField('recruiter-email')}
          placeholder="Email"
          textContentType="emailAddress"
          value={email}
        />
      </View>
      <View onLayout={keyboardScroll.registerField('recruiter-password')}>
        <Field
          label="Password"
          onChangeText={setPassword}
          onFocus={() => keyboardScroll.focusField('recruiter-password')}
          placeholder="Password"
          secureTextEntry
          textContentType="password"
          value={password}
        />
      </View>
      <Button
        disabled={isSubmitting || !email.trim() || !password}
        fullWidth
        onPress={handleLogin}
        style={styles.primaryAction}
      >
        {isSubmitting ? 'Logging in...' : 'Login'}
      </Button>
      <Button
        disabled={isSubmitting || !email.trim() || !password}
        fullWidth
        onPress={handleSignUp}
        style={styles.secondaryAction}
        variant="secondary"
      >
        Create recruiter account
      </Button>
      <Button disabled={isSubmitting} fullWidth onPress={handleGoogleSignIn} style={styles.secondaryAction} variant="secondary">
        Continue with Google
      </Button>
      <TextAction onPress={() => router.replace('/(auth)/sign-in')}>Back to applicant sign in</TextAction>
      {error ? <StatusBanner message={error} tone="danger" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.xxl,
    color: colors.text,
    ...typography.screenTitle
  },
  body: {
    marginTop: spacing.sm,
    color: colors.muted,
    ...typography.body
  },
  primaryAction: {
    marginTop: spacing.xxl
  },
  secondaryAction: {
    marginTop: spacing.md
  }
});
