import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import type { ProfileResponse } from '@cato/shared';
import type { ApplicantActivity, ApplicantActivityResponse, ApplicantInterestRequest } from '@cato/shared';
import { getApplicantActivity, getApplicantInterestRequests, getProfile } from '../../src/api/profile';
import { Button } from '../../src/components/Button';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Screen } from '../../src/components/Screen';
import { StatusBanner } from '../../src/components/StatusBanner';
import { useSession } from '../../src/hooks/useSession';
import { colors, controls, radii, shadows, spacing, typography } from '../../src/theme';

type DashboardAction = {
  body: string;
  icon: 'sparkles' | 'video' | 'resume' | 'profile';
  route: Parameters<typeof router.push>[0];
  title: string;
};

export default function HomeScreen() {
  const { session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [interestRequests, setInterestRequests] = useState<ApplicantInterestRequest[]>([]);
  const [activity, setActivity] = useState<ApplicantActivityResponse | null>(null);

  async function loadHome() {
    if (!session?.access_token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    Promise.all([
      getProfile(session.access_token),
      getApplicantInterestRequests(session.access_token),
      getApplicantActivity(session.access_token)
    ])
      .then(([result, requestResult, activityResult]) => {
        setProfile(result);
        setInterestRequests(requestResult.requests);
        setActivity(activityResult);
        setError(null);
      })
      .catch((profileError) => {
        setError(profileError instanceof Error ? profileError.message : 'Unable to load home');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  useEffect(() => {
    loadHome();
  }, [session]);

  if (isLoading && !profile) {
    return <LoadingScreen banner="Checking your profile" />;
  }

  if (!profile && error) {
    return (
      <Screen centered>
        <StatusBanner message={error} tone="danger" />
        <Button onPress={loadHome}>Retry</Button>
      </Screen>
    );
  }

  const profileTasks = [
    {
      action: () => router.push('/(tabs)/profile'),
      label: 'Short take',
      complete: Boolean(profile?.signal?.tenSecondVideo)
    },
    {
      action: () => router.push('/(onboarding)/deeper-signal'),
      label: 'Deeper signal',
      complete: Boolean(profile?.signal?.thirtySecondVideo)
    },
    {
      action: () => router.push('/(onboarding)/resume'),
      label: 'Resume',
      complete: Boolean(profile?.resume?.secureUrl)
    },
    {
      action: () => router.push('/(tabs)/profile'),
      label: 'Project',
      complete: Boolean(profile?.projects.length)
    },
    {
      action: () => router.push('/(tabs)/profile'),
      label: 'Internship',
      complete: Boolean(profile?.internships.length)
    },
    {
      action: () => router.push('/(tabs)/profile'),
      label: 'Soft skills',
      complete: Boolean(profile?.softSkills?.items.length)
    }
  ];
  const completionPercent = calculateProfileStrength(profile);
  const educationLine = [
    profile?.education?.semesterLabel,
    profile?.education?.major,
    profile?.education?.gpa !== undefined ? `GPA ${profile.education.gpa.toFixed(2)}` : undefined
  ]
    .filter(Boolean)
    .join(' • ');
  const nextAction = getNextAction(profile);
  const pendingRequests = interestRequests.filter((request) => request.status === 'sent' || request.status === 'viewed');
  const latestActivity = activity?.recent[0];

  return (
    <Screen scroll scrollBottomPadding={spacing.xxxl}>
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.title}>
            {profile?.applicant.name ? `Hey, ${profile.applicant.name.split(/\s+/)[0]}` : 'Hey'}
          </Text>
          <Text style={styles.body}>Keep your profile sharp for recruiters.</Text>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/profile')} style={styles.previewButton}>
          <Feather name="eye" size={18} color={colors.primaryText} />
          <Text style={styles.previewButtonText}>Preview</Text>
        </Pressable>
      </View>

      <View style={styles.identityCard}>
        <Text style={styles.identityName}>{profile?.applicant.name ?? 'Applicant'}</Text>
        {profile?.education?.universityName ? (
          <Text style={styles.identityUniversity}>{profile.education.universityName}</Text>
        ) : null}
        {educationLine ? <Text style={styles.identityMeta}>{educationLine}</Text> : null}
      </View>

      <View style={styles.strengthCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardTitle}>Profile strength</Text>
          <Text style={styles.percent}>{completionPercent}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
        </View>
        <Text style={styles.body}>Complete profiles rank better in recruiter discovery.</Text>
        <View style={styles.taskGrid}>
          {profileTasks.map((task) => (
            <Pressable key={task.label} onPress={task.action} style={[styles.taskPill, task.complete ? styles.taskPillComplete : null]}>
              <Feather name={task.complete ? 'check-circle' : 'circle'} size={16} color={task.complete ? colors.success : colors.muted} />
              <Text style={[styles.taskText, task.complete ? styles.taskTextComplete : null]}>{task.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable onPress={() => router.push(nextAction.route)} style={styles.actionCard}>
        <View style={styles.actionIcon}>{renderActionIcon(nextAction.icon)}</View>
        <View style={styles.actionCopy}>
          <Text style={styles.actionTitle}>{nextAction.title}</Text>
          <Text style={styles.actionBody}>{nextAction.body}</Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.text} />
      </Pressable>

      <View style={styles.activityCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardTitle}>Recruiter activity</Text>
          <Pressable onPress={() => router.push('/(tabs)/requests')} style={styles.smallLink}>
            <Text style={styles.smallLinkText}>{pendingRequests.length > 0 ? 'Requests' : 'Open'}</Text>
            <Feather name="chevron-right" size={16} color={colors.purple} />
          </Pressable>
        </View>
        <View style={styles.metricRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{activity?.metrics.profileViews ?? 0}</Text>
            <Text style={styles.metricLabel}>Views</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{activity?.metrics.resumeOpens ?? 0}</Text>
            <Text style={styles.metricLabel}>Resume</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{activity?.metrics.bookmarks ?? 0}</Text>
            <Text style={styles.metricLabel}>Saved</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{activity?.metrics.shortlists ?? 0}</Text>
            <Text style={styles.metricLabel}>Shortlist</Text>
          </View>
        </View>
        {latestActivity ? (
          <View style={styles.activityItem}>
            <Feather name={getActivityIcon(latestActivity)} size={18} color={colors.text} />
            <View style={styles.activityCopy}>
              <Text style={styles.activityTitle}>{latestActivity.title}</Text>
              <Text style={styles.activityBody}>{latestActivity.body}</Text>
              <Text style={styles.activityTime}>{formatActivityDate(latestActivity.createdAt)}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.activityEmpty}>No recruiter activity yet.</Text>
        )}
      </View>

      <Button onPress={() => router.push('/(tabs)/profile')} fullWidth>
        Manage profile
      </Button>
      {error ? <StatusBanner message={error} tone="danger" /> : null}
    </Screen>
  );
}

function getNextAction(profile: ProfileResponse | null): DashboardAction {
  if (!profile?.signal?.thirtySecondVideo) {
    return {
      icon: 'video',
      title: 'Add your deeper signal',
      body: 'Give recruiters more context behind your short take.',
      route: '/(onboarding)/deeper-signal'
    };
  }

  if (!profile.resume?.secureUrl) {
    return {
      icon: 'resume',
      title: 'Add your resume',
      body: 'Recruiters can verify the work behind your profile.',
      route: '/(onboarding)/resume'
    };
  }

  if (!profile.projects.length) {
    return {
      icon: 'sparkles',
      title: 'Feature a project',
      body: 'Show one thing you built, researched, wrote, or shipped.',
      route: '/(tabs)/profile'
    };
  }

  return {
    icon: 'profile',
    title: 'Review your recruiter preview',
    body: 'Check how your profile appears before more recruiters see it.',
    route: '/(tabs)/profile'
  };
}

function calculateProfileStrength(profile: ProfileResponse | null) {
  if (!profile) {
    return 0;
  }

  const coreItems = [
    Boolean(profile.resume?.secureUrl),
    Boolean(profile.signal?.tenSecondVideo),
    Boolean(profile.signal?.thirtySecondVideo),
    Boolean(profile.softSkills?.items.length)
  ];
  const coreScore = coreItems.filter(Boolean).length * 17.5;
  const projectCount = profile.projects.length;
  const projectScore = projectCount >= 3 ? 20 : projectCount === 2 ? 17 : projectCount === 1 ? 10 : 0;
  const internshipScore = profile.internships.length > 0 ? 10 : 0;

  return Math.round(coreScore + projectScore + internshipScore);
}

function renderActionIcon(icon: DashboardAction['icon']) {
  if (icon === 'video') return <Feather name="video" size={22} color={colors.text} />;
  if (icon === 'resume') return <Feather name="file-text" size={22} color={colors.text} />;
  if (icon === 'profile') return <Feather name="eye" size={22} color={colors.text} />;
  return <Feather name="zap" size={22} color={colors.text} />;
}

function getActivityIcon(activity: ApplicantActivity) {
  if (activity.type === 'profile_viewed') return 'eye';
  if (activity.type === 'resume_opened') return 'file-text';
  if (activity.type === 'bookmarked') return 'bookmark';
  if (activity.type === 'shortlisted') return 'star';
  if (activity.type === 'message_sent') return 'message-circle';
  if (activity.type === 'deeper_signal_opened') return 'video';
  return 'send';
}

function formatActivityDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
    justifyContent: 'space-between'
  },
  heroCopy: {
    flex: 1
  },
  title: {
    color: colors.text,
    ...typography.screenTitle
  },
  body: {
    marginTop: spacing.sm,
    color: colors.muted,
    ...typography.body
  },
  previewButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: controls.secondaryButtonHeight,
    paddingHorizontal: spacing.md
  },
  previewButtonText: {
    color: colors.primaryText,
    ...typography.button
  },
  strengthCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    marginTop: spacing.xxl,
    padding: spacing.lg,
    ...shadows.card
  },
  identityCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
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
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md
  },
  percent: {
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900'
  },
  progressTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 10,
    marginTop: spacing.lg,
    overflow: 'hidden'
  },
  progressFill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: '100%'
  },
  taskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  taskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surface,
    minHeight: controls.chipHeight,
    paddingHorizontal: spacing.md
  },
  taskPillComplete: {
    borderColor: '#cfe8b3',
    backgroundColor: '#f3faea'
  },
  taskText: {
    color: colors.muted,
    ...typography.meta
  },
  taskTextComplete: {
    color: colors.text
  },
  actionCard: {
    alignItems: 'center',
    backgroundColor: '#f2f0ff',
    borderRadius: radii.sm,
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xxl,
    padding: spacing.lg
  },
  actionIcon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    height: 46,
    justifyContent: 'center',
    width: 46
  },
  actionCopy: {
    flex: 1
  },
  actionTitle: {
    color: colors.text,
    ...typography.sectionTitle
  },
  actionBody: {
    color: colors.muted,
    marginTop: spacing.xs,
    ...typography.body
  },
  activityCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    gap: spacing.lg,
    marginTop: spacing.xxl,
    marginBottom: spacing.xxl,
    padding: spacing.lg
  },
  smallLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs
  },
  smallLinkText: {
    color: colors.purple,
    ...typography.label
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  metricBox: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.sm,
    flex: 1,
    padding: spacing.sm
  },
  metricValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 29
  },
  metricLabel: {
    color: colors.muted,
    marginTop: spacing.xs,
    ...typography.meta
  },
  activityItem: {
    alignItems: 'flex-start',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingTop: spacing.lg
  },
  activityCopy: {
    flex: 1
  },
  activityTitle: {
    color: colors.text,
    ...typography.label
  },
  activityBody: {
    color: colors.muted,
    marginTop: spacing.xs,
    ...typography.meta
  },
  activityTime: {
    color: colors.muted,
    marginTop: spacing.xs,
    ...typography.meta
  },
  activityEmpty: {
    color: colors.muted,
    ...typography.body
  }
});
