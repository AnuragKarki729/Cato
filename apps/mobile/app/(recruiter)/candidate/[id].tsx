import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { RecruiterCandidate } from '@cato/shared';
import { bookmarkRecruiterCandidate, getRecruiterCandidate } from '../../../src/api/recruiter';
import { Screen } from '../../../src/components/Screen';
import { useSession } from '../../../src/hooks/useSession';
import { colors, controls, radii, spacing, typography } from '../../../src/theme';

export default function RecruiterCandidateScreen() {
  const { session } = useSession();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [candidate, setCandidate] = useState<RecruiterCandidate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.access_token || !id) {
      return;
    }

    getRecruiterCandidate(session.access_token, id)
      .then((response) => setCandidate(response.candidate))
      .catch((candidateError) => {
        setError(candidateError instanceof Error ? candidateError.message : 'Unable to load candidate');
      });
  }, [id, session]);

  async function handleBookmark() {
    if (!session?.access_token || !candidate) {
      return;
    }

    try {
      await bookmarkRecruiterCandidate(session.access_token, candidate.id);
      setCandidate({ ...candidate, bookmarked: true });
    } catch (bookmarkError) {
      setError(bookmarkError instanceof Error ? bookmarkError.message : 'Unable to bookmark candidate');
    }
  }

  if (!candidate) {
    return (
      <Screen centered>
        <Text style={styles.body}>Loading candidate</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.linkText}>Back</Text>
      </Pressable>
      {candidate.profileImageUrl ? (
        <Image source={{ uri: candidate.profileImageUrl }} style={styles.hero} />
      ) : (
        <View style={[styles.hero, styles.heroFallback]}>
          <Text style={styles.heroFallbackText}>{(candidate.name ?? 'C').charAt(0)}</Text>
        </View>
      )}
      <Text style={styles.name}>{candidate.name ?? 'Applicant'}</Text>
      <Text style={styles.body}>{candidate.major ?? 'Major not set'}</Text>
      <Text style={styles.meta}>{candidate.universityName ?? 'University not set'} · GPA {candidate.gpa ?? 'N/A'}</Text>
      <View style={styles.tags}>
        {candidate.softSkills.map((skill) => (
          <View key={skill.label} style={styles.tag}>
            <Text style={styles.tagText}>{skill.label} {skill.rating}/5</Text>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Signal</Text>
        <Text style={styles.prompt}>
          {candidate.tenSecondElaboration?.trim() ||
            candidate.signalSummary?.trim() ||
            candidate.promptTextSnapshot ||
            'No signal response yet'}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resume</Text>
        {candidate.resumeUrl ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/media/resume-preview',
                params: { url: candidate.resumePreviewUrl ?? candidate.resumeUrl, fileName: candidate.resumeFileName ?? 'resume' }
              })
            }
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Preview resume</Text>
          </Pressable>
        ) : null}
        {candidate.internships.map((item) => (
          <View key={item.id} style={styles.resumeItem}>
            <Text style={styles.itemTitle}>{item.roleDepartment}</Text>
            <Text style={styles.body}>{item.company}</Text>
            <Text style={styles.meta}>{item.durationMonths} months</Text>
          </View>
        ))}
        {candidate.internships.length === 0 ? <Text style={styles.body}>No internships listed</Text> : null}
      </View>
      <View style={styles.row}>
        <Pressable onPress={handleBookmark} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{candidate.bookmarked ? 'Bookmarked' : 'Bookmark'}</Text>
        </Pressable>
        <Pressable
          disabled={!candidate.tenSecondVideoUrl}
          onPress={() =>
            router.push({
              pathname: '/media/video-player',
              params: { url: candidate.tenSecondVideoUrl, title: `${candidate.name ?? 'Candidate'} 10s Signal` }
            })
          }
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Watch 10s</Text>
        </Pressable>
        <Pressable onPress={() => router.push({ pathname: '/(recruiter)/contact', params: { candidateId: candidate.id } })} style={styles.button}>
          <Text style={styles.buttonText}>Contact Candidate</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  linkText: { color: colors.purple, ...typography.meta },
  hero: { width: '100%', aspectRatio: 4 / 5, marginTop: spacing.lg, borderRadius: radii.sm, backgroundColor: colors.border },
  heroFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  heroFallbackText: { color: colors.accent, fontSize: 64, fontWeight: '900' },
  name: { marginTop: spacing.xl, color: colors.text, ...typography.screenTitle, textAlign: 'center' },
  body: { color: colors.muted, ...typography.body },
  meta: { color: colors.muted, ...typography.meta },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.lg },
  tag: { borderRadius: radii.sm, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tagText: { color: colors.text, ...typography.meta },
  section: { gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xl, paddingTop: spacing.lg },
  sectionTitle: { color: colors.text, ...typography.sectionTitle },
  prompt: { color: colors.text, ...typography.label },
  resumeItem: { gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, padding: spacing.md },
  itemTitle: { color: colors.text, ...typography.label },
  row: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl },
  button: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: controls.secondaryButtonHeight, borderRadius: radii.sm, backgroundColor: colors.primary },
  buttonText: { color: colors.primaryText, ...typography.meta },
  secondaryButton: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: controls.secondaryButtonHeight, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface },
  secondaryButtonText: { color: colors.text, ...typography.meta },
  error: { marginTop: spacing.lg, color: colors.danger, ...typography.meta }
});
