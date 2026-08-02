import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { SoftSkillOutput } from '@cato/shared';
import { getSoftSkills } from '../../src/api/resume';
import { Screen } from '../../src/components/Screen';
import { useSession } from '../../src/hooks/useSession';
import { useQueuedVideoUploads, waitForQueuedVideoUpload } from '../../src/media/videoUploadQueue';
import { colors, controls, radii, spacing, typography } from '../../src/theme';

const fallbackSkills = [
  { label: 'Communication', rating: 4, evidence: 'Your signal shows clear intent and steady expression.' },
  { label: 'Authenticity', rating: 4, evidence: 'You bring a personal point of view into the response.' },
  { label: 'Adaptability', rating: 3, evidence: 'Your profile suggests openness to learning and growth.' }
] as const;

function getTraitIcon(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes('communication')) return 'chatbubble-ellipses-outline';
  if (normalized.includes('authentic')) return 'sparkles-outline';
  if (normalized.includes('adapt')) return 'shuffle-outline';
  if (normalized.includes('empathy')) return 'heart-outline';
  if (normalized.includes('resilience')) return 'shield-checkmark-outline';
  if (normalized.includes('collaboration')) return 'people-outline';
  if (normalized.includes('critical')) return 'bulb-outline';
  if (normalized.includes('creativity')) return 'color-palette-outline';

  return 'planet-outline';
}

function getStarIcon(star: number, rating: number) {
  if (rating >= star) {
    return 'star';
  }

  if (rating >= star - 0.5) {
    return 'star-half';
  }

  return 'star-outline';
}

export default function SoftSkillsScreen() {
  const { session } = useSession();
  const queuedUploads = useQueuedVideoUploads();
  const [softSkills, setSoftSkills] = useState<SoftSkillOutput | null>(null);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    let isMounted = true;
    const token = session.access_token;

    waitForQueuedVideoUpload('30-second')
      .then(() => getSoftSkills(token))
      .then((result) => {
        if (isMounted) {
          setSoftSkills(result.softSkills);
        }
      })
      .catch((error) => {
        console.error('[soft-skills-debug] unable to refresh soft skills:', {
          message: error instanceof Error ? error.message : 'Unable to refresh soft skills'
        });
      });

    return () => {
      isMounted = false;
    };
  }, [session]);

  const skills = softSkills?.status === 'completed' && softSkills.items.length > 0 ? softSkills.items : fallbackSkills;

  return (
    <Screen scroll>
      <Text style={styles.title}>Your soft skills</Text>
      <Text style={styles.body}>
        {queuedUploads.thirtySecond
          ? 'Finishing your video upload, then refreshing your signal.'
          : 'Powered by your stories, takes, and responses.'}
      </Text>
      <View style={styles.list}>
        {skills.map((skill, index) => (
          <View key={`${skill.label}-${index}`} style={styles.skillRow}>
            <View style={styles.skillIcon}>
              <Ionicons color={colors.text} name={getTraitIcon(skill.label)} size={17} />
            </View>
            <View style={styles.skillCopy}>
              <Text style={styles.skillTitle}>{skill.label}</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    color={skill.rating >= star - 0.5 ? colors.accent : '#cbd5e1'}
                    name={getStarIcon(star, skill.rating)}
                    size={13}
                  />
                ))}
              </View>
              <Text style={styles.skillEvidence}>{skill.evidence}</Text>
            </View>
            <Text style={styles.rating}>{skill.rating}/5</Text>
          </View>
        ))}
      </View>
      <View style={styles.edgeCard}>
        <Text style={styles.edgeTitle}>Your edge</Text>
        <Text style={styles.edgeBody}>Your profile is taking shape. Save your profile so recruiters can understand your story.</Text>
      </View>
      <Pressable onPress={() => router.replace('/(onboarding)/profile-form')} style={styles.button}>
        <Text style={styles.buttonText}>Save My Profile</Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/(onboarding)/deeper-signal')}>
        <Text style={styles.linkText}>Improve My Take</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.sm,
    color: colors.text,
    ...typography.screenTitle
  },
  body: {
    marginTop: spacing.sm,
    color: colors.muted,
    ...typography.body
  },
  list: {
    gap: spacing.md,
    marginTop: spacing.xxl
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.md
  },
  skillIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#eefee0'
  },
  skillCopy: {
    flex: 1
  },
  skillTitle: {
    color: colors.text,
    ...typography.label
  },
  skillEvidence: {
    marginTop: spacing.xs,
    color: colors.muted,
    ...typography.meta
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: spacing.xs
  },
  rating: {
    color: colors.text,
    ...typography.meta
  },
  edgeCard: {
    marginTop: spacing.xxxl,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.lg
  },
  edgeTitle: {
    color: colors.text,
    ...typography.sectionTitle
  },
  edgeBody: {
    marginTop: spacing.sm,
    color: colors.muted,
    ...typography.meta
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
  },
  linkText: {
    marginTop: spacing.lg,
    color: colors.purple,
    ...typography.label,
    textAlign: 'center'
  }
});
