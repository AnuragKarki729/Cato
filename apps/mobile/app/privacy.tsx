import { Pressable, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { colors, controls, radii, spacing, typography } from '../src/theme';

export default function PrivacyScreen() {
  return (
    <Screen scroll>
      <Text style={styles.title}>Privacy Policy</Text>
      <Text style={styles.body}>
        This POC stores your account identity, university profile, resume metadata, uploaded resume, videos,
        internships, and dummy soft-skill output so the applicant onboarding flow can work.
      </Text>
      <Text style={styles.body}>
        Resumes and videos are stored in Cloudinary. Profile and onboarding data are stored in MongoDB. Supabase is
        used for authentication identity only.
      </Text>
      <Text style={styles.body}>
        You can delete your account from Profile. Deletion removes your Supabase Auth user, MongoDB profile data,
        Cloudinary media assets, and soft-skill output.
      </Text>
      <Text style={styles.body}>
        This is a placeholder policy for the POC and is not a formal production privacy policy.
      </Text>
      <Pressable onPress={() => router.back()} style={styles.button}>
        <Text style={styles.buttonText}>Back</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    ...typography.screenTitle
  },
  body: {
    marginTop: spacing.lg,
    color: colors.muted,
    ...typography.body
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    minHeight: controls.buttonHeight,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg
  },
  buttonText: {
    color: colors.primaryText,
    ...typography.button
  }
});
