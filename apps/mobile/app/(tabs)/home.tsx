import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { ProfileResponse } from '@cato/shared';
import { getProfile } from '../../src/api/profile';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Screen } from '../../src/components/Screen';
import { StatusBanner } from '../../src/components/StatusBanner';
import { useSession } from '../../src/hooks/useSession';
import { colors, radii, spacing, typography } from '../../src/theme';

export default function HomeScreen() {
  const { session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    getProfile(session.access_token)
      .then((result) => {
        setProfile(result);
        setError(null);
      })
      .catch((profileError) => {
        setError(profileError instanceof Error ? profileError.message : 'Unable to load home');
      });
  }, [session]);

  if (!profile && !error) {
    return <LoadingScreen banner="Checking your profile" />;
  }

  const profileTasks = [
    { label: 'Short take', complete: Boolean(profile?.signal?.tenSecondVideo) },
    { label: 'Deeper signal', complete: Boolean(profile?.signal?.thirtySecondVideo) },
    { label: 'Resume', complete: Boolean(profile?.resume?.secureUrl) },
    { label: 'Soft skills', complete: Boolean(profile?.softSkills?.items.length) }
  ];
  const completedTasks = profileTasks.filter((task) => task.complete).length;
  const educationLine = [
    profile?.education?.semesterLabel,
    profile?.education?.major,
    profile?.education?.gpa !== undefined ? `GPA ${profile.education.gpa.toFixed(2)}` : undefined
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <Screen scroll scrollBottomPadding={spacing.xxxl}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.body}>
        {profile?.applicant.name ? `Welcome back, ${profile.applicant.name.split(/\s+/)[0]}.` : 'Welcome back.'}
      </Text>
      <View style={styles.identityCard}>
        <Text style={styles.identityName}>{profile?.applicant.name ?? 'Applicant'}</Text>
        {profile?.education?.universityName ? (
          <Text style={styles.identityUniversity}>{profile.education.universityName}</Text>
        ) : null}
        {educationLine ? <Text style={styles.identityMeta}>{educationLine}</Text> : null}
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Profile status</Text>
        <Text style={styles.score}>{completedTasks}/{profileTasks.length}</Text>
        <Text style={styles.body}>Core profile pieces complete.</Text>
      </View>
      <View style={styles.taskList}>
        {profileTasks.map((task) => (
          <View key={task.label} style={styles.taskRow}>
            <View style={[styles.statusDot, task.complete ? styles.statusDotComplete : null]} />
            <Text style={styles.taskText}>{task.label}</Text>
            <Text style={[styles.taskState, task.complete ? styles.taskStateComplete : null]}>
              {task.complete ? 'Done' : 'Open'}
            </Text>
          </View>
        ))}
      </View>
      <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.button}>
        <Text style={styles.buttonText}>Manage profile</Text>
      </Pressable>
      {error ? <StatusBanner message={error} tone="danger" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    ...typography.screenTitle
  },
  body: {
    marginTop: spacing.sm,
    color: colors.muted,
    ...typography.body
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    marginTop: spacing.xxl,
    padding: spacing.lg
  },
  identityCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    marginTop: spacing.xxl,
    padding: spacing.lg
  },
  identityName: {
    color: colors.text,
    ...typography.sectionTitle
  },
  identityUniversity: {
    marginTop: spacing.sm,
    color: colors.text,
    ...typography.label
  },
  identityMeta: {
    marginTop: spacing.sm,
    color: colors.muted,
    ...typography.meta
  },
  cardTitle: {
    color: colors.text,
    ...typography.sectionTitle
  },
  score: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900'
  },
  taskList: {
    gap: spacing.md,
    marginTop: spacing.xxl
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.md
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border
  },
  statusDotComplete: {
    backgroundColor: colors.accent
  },
  taskText: {
    flex: 1,
    color: colors.text,
    ...typography.label
  },
  taskState: {
    color: colors.muted,
    ...typography.meta
  },
  taskStateComplete: {
    color: colors.success
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.lg
  },
  buttonText: {
    color: colors.primaryText,
    ...typography.button
  }
});
