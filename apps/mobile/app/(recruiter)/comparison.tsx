import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { RecruiterCandidate } from '@cato/shared';
import { getRecruiterCandidate } from '../../src/api/recruiter';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { StatusBanner } from '../../src/components/StatusBanner';
import { RecruiterContent } from '../../src/recruiter/RecruiterContent';
import { RecruiterEmptyState } from '../../src/recruiter/RecruiterEmptyState';
import { useSession } from '../../src/hooks/useSession';
import { colors, radii, spacing, typography } from '../../src/theme';

export default function RecruiterComparisonScreen() {
  const { session } = useSession();
  const params = useLocalSearchParams<{ ids?: string | string[] }>();
  const candidateIds = useMemo(() => getCandidateIds(params.ids), [params.ids]);
  const [candidates, setCandidates] = useState<RecruiterCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.access_token || candidateIds.length === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    Promise.all(candidateIds.map((candidateId) => getRecruiterCandidate(session.access_token, candidateId)))
      .then((responses) => setCandidates(responses.map((response) => response.candidate)))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load comparison'))
      .finally(() => setIsLoading(false));
  }, [session?.access_token, candidateIds.join(',')]);

  if (isLoading) {
    return <LoadingScreen banner="Loading comparison" />;
  }

  if (candidateIds.length < 2) {
    return (
      <RecruiterContent>
        <RecruiterEmptyState
          actionLabel="Back to shortlist"
          body="Select two or more shortlisted candidates before comparing."
          onAction={() => router.replace('/(recruiter)/shortlist')}
          title="Comparison needs candidates"
        />
      </RecruiterContent>
    );
  }

  if (error || candidates.length === 0) {
    return (
      <RecruiterContent>
        <RecruiterEmptyState
          actionLabel="Back to shortlist"
          body={error ?? 'Unable to load selected candidates.'}
          onAction={() => router.replace('/(recruiter)/shortlist')}
          title="Comparison unavailable"
        />
      </RecruiterContent>
    );
  }

  return (
    <RecruiterContent bottomOffset={20}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Compare Candidates</Text>
          <Text style={styles.body}>{candidates.length} shortlisted profiles side by side.</Text>
        </View>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
      {error ? <StatusBanner message={error} tone="danger" /> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.comparisonScroll}>
        <View style={styles.comparisonRow}>
          {candidates.map((candidate) => (
            <View key={candidate.id} style={styles.column}>
              <View style={styles.profileHeader}>
                {candidate.profileImageUrl ? (
                  <Image source={{ uri: candidate.profileImageUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>{(candidate.name ?? 'C').charAt(0)}</Text>
                  </View>
                )}
                <Text numberOfLines={2} style={styles.name}>{candidate.name ?? 'Applicant'}</Text>
                <Text numberOfLines={2} style={styles.meta}>{candidate.major ?? 'Major not set'}</Text>
                <Text numberOfLines={2} style={styles.meta}>{candidate.universityName ?? 'University not set'}</Text>
              </View>

              <MetricBlock label="Match" value={`${candidate.matchScore}%`} />
              <MetricBlock label="Profile strength" value={`${candidate.profileStrength}%`} />
              <MetricBlock label="GPA" value={typeof candidate.gpa === 'number' ? candidate.gpa.toFixed(2) : 'N/A'} />
              <MetricBlock label="Projects" value={String(candidate.projects.length)} />
              <MetricBlock label="Internships" value={String(candidate.internships.length)} />

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key evidence</Text>
                {candidate.matchEvidence.slice(0, 3).map((item) => (
                  <View key={item.id} style={styles.evidenceItem}>
                    <Text style={styles.evidenceTitle}>{item.title}</Text>
                    <Text style={styles.evidenceBody}>{item.body}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Soft skills</Text>
                {candidate.softSkills.slice(0, 4).map((skill) => (
                  <Text key={skill.label} style={styles.comparisonLine}>{skill.label}: {skill.rating}/5</Text>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Validation</Text>
                {candidate.needsValidation.length > 0 ? (
                  candidate.needsValidation.slice(0, 2).map((item) => (
                    <Text key={item.id} style={styles.comparisonLine}>{item.title}</Text>
                  ))
                ) : (
                  <Text style={styles.comparisonLine}>No major validation flags.</Text>
                )}
              </View>

              <Pressable
                onPress={() => router.push({ pathname: '/(recruiter)/candidate/[id]', params: { id: candidate.id } })}
                style={styles.reviewButton}
              >
                <Text style={styles.reviewButtonText}>Open review</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </RecruiterContent>
  );
}

function MetricBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricBlock}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  headerCopy: { flex: 1 },
  title: { color: colors.text, ...typography.screenTitle },
  body: { color: colors.muted, ...typography.body },
  backButton: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  backText: { color: colors.text, ...typography.meta },
  comparisonScroll: { marginHorizontal: -spacing.xxl, marginTop: spacing.lg },
  comparisonRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xxl },
  column: { width: 250, gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, padding: spacing.md },
  profileHeader: { alignItems: 'center', gap: spacing.xs },
  avatar: { width: 76, height: 86, borderRadius: radii.sm, backgroundColor: colors.border },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', width: 76, height: 86, borderRadius: radii.sm, backgroundColor: colors.primary },
  avatarFallbackText: { color: colors.accent, fontSize: 28, fontWeight: '900' },
  name: { color: colors.text, textAlign: 'center', ...typography.label },
  meta: { color: colors.muted, textAlign: 'center', ...typography.meta },
  metricBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, borderRadius: radii.sm, backgroundColor: colors.surfaceMuted, padding: spacing.md },
  metricLabel: { flex: 1, color: colors.muted, ...typography.meta },
  metricValue: { color: colors.text, ...typography.label },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, ...typography.label },
  evidenceItem: { gap: spacing.xs, borderRadius: radii.sm, backgroundColor: colors.surfaceMuted, padding: spacing.md },
  evidenceTitle: { color: colors.text, ...typography.meta },
  evidenceBody: { color: colors.muted, ...typography.body },
  comparisonLine: { color: colors.muted, ...typography.meta },
  reviewButton: { alignItems: 'center', justifyContent: 'center', minHeight: 42, borderRadius: radii.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.md },
  reviewButtonText: { color: colors.primaryText, ...typography.meta }
});

function getCandidateIds(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return Array.from(new Set(values.flatMap((item) => item.split(',')).map((item) => item.trim()).filter(Boolean))).slice(0, 4);
}
