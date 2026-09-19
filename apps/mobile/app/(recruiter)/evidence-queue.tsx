import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { RecruiterCandidate, RecruiterCandidateReviewStatus, RecruiterCandidateSearchFilters } from '@cato/shared';
import {
  getRecruiterEvidenceQueue,
  updateRecruiterCandidateReview
} from '../../src/api/recruiter';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { StatusBanner } from '../../src/components/StatusBanner';
import { RecruiterContent } from '../../src/recruiter/RecruiterContent';
import { RecruiterEmptyState } from '../../src/recruiter/RecruiterEmptyState';
import { useSession } from '../../src/hooks/useSession';
import { colors, radii, spacing, typography } from '../../src/theme';

const queueActions: Array<{ label: string; status: RecruiterCandidateReviewStatus }> = [
  { label: 'Pass', status: 'passed' },
  { label: 'Maybe', status: 'maybe' },
  { label: 'Shortlist', status: 'shortlisted' }
];

export default function RecruiterEvidenceQueueScreen() {
  const { session } = useSession();
  const params = useLocalSearchParams();
  const filters = useMemo(() => getFiltersFromParams(params), [JSON.stringify(params)]);
  const [queue, setQueue] = useState<RecruiterCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingCandidateId, setSavingCandidateId] = useState<string | null>(null);

  async function loadQueue() {
    if (!session?.access_token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getRecruiterEvidenceQueue(session.access_token, filters);
      setQueue(response.queue);
    } catch (queueError) {
      setError(queueError instanceof Error ? queueError.message : 'Unable to load evidence queue');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadQueue();
  }, [session?.access_token, JSON.stringify(filters)]);

  async function handleReview(candidate: RecruiterCandidate, status: RecruiterCandidateReviewStatus) {
    if (!session?.access_token || savingCandidateId) {
      return;
    }

    setSavingCandidateId(candidate.id);
    setError(null);

    try {
      await updateRecruiterCandidateReview(session.access_token, candidate.id, {
        status,
        notes: candidate.review?.notes,
        tags: candidate.review?.tags ?? []
      });
      setQueue((current) => current.filter((item) => item.id !== candidate.id));
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Unable to update candidate review');
    } finally {
      setSavingCandidateId(null);
    }
  }

  if (isLoading) {
    return <LoadingScreen banner="Loading evidence queue" />;
  }

  if (error && queue.length === 0) {
    return (
      <RecruiterContent>
        <RecruiterEmptyState
          actionLabel="Back to search"
          body={error}
          onAction={() => router.replace('/(recruiter)/search')}
          title="Unable to load queue"
        />
      </RecruiterContent>
    );
  }

  if (queue.length === 0) {
    return (
      <RecruiterContent>
        <RecruiterEmptyState
          actionLabel="Search candidates"
          body="Evidence-backed candidates will appear here when completed profiles match your filters."
          onAction={() => router.replace('/(recruiter)/search')}
          title="Evidence queue is clear"
        />
      </RecruiterContent>
    );
  }

  return (
    <RecruiterContent>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Evidence Queue</Text>
          <Text style={styles.body}>{queue.length} candidates prioritized by match evidence.</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/(recruiter)/shortlist')} style={styles.refreshButton}>
            <Text style={styles.refreshText}>Shortlist</Text>
          </Pressable>
          <Pressable onPress={loadQueue} style={styles.refreshButton}>
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>
      </View>
      {error ? <StatusBanner message={error} tone="danger" /> : null}
      <View style={styles.list}>
        {queue.map((candidate, index) => (
          <View key={candidate.id} style={styles.card}>
            <View style={styles.cardHeader}>
              {candidate.profileImageUrl ? (
                <Image source={{ uri: candidate.profileImageUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>{(candidate.name ?? 'C').charAt(0)}</Text>
                </View>
              )}
              <View style={styles.cardHeaderCopy}>
                <Text style={styles.rank}>#{index + 1}</Text>
                <Text style={styles.name}>{candidate.name ?? 'Applicant'}</Text>
                <Text style={styles.meta}>
                  {[candidate.major, candidate.universityName, candidate.semesterLabel].filter(Boolean).join(' · ') || 'Profile details pending'}
                </Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{candidate.matchScore}%</Text>
              </View>
            </View>

            <View style={styles.matchRow}>
              <Text style={styles.matchText}>{formatMatchStrength(candidate.matchStrength)}</Text>
              <Text style={styles.profileText}>Strength {candidate.profileStrength}%</Text>
            </View>

            <View style={styles.evidenceList}>
              {candidate.matchEvidence.slice(0, 3).map((item) => (
                <View key={item.id} style={styles.evidenceItem}>
                  <Text style={styles.evidenceTitle}>{item.title}</Text>
                  <Text style={styles.evidenceBody}>{item.body}</Text>
                </View>
              ))}
            </View>

            {candidate.needsValidation[0] ? (
              <View style={styles.validationItem}>
                <Text style={styles.evidenceTitle}>{candidate.needsValidation[0].title}</Text>
                <Text style={styles.evidenceBody}>{candidate.needsValidation[0].body}</Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                onPress={() => router.push({ pathname: '/(recruiter)/candidate/[id]', params: { id: candidate.id } })}
                style={styles.secondaryAction}
              >
                <Text style={styles.secondaryActionText}>Review</Text>
              </Pressable>
              {queueActions.map((action) => (
                <Pressable
                  key={action.status}
                  disabled={savingCandidateId === candidate.id}
                  onPress={() => handleReview(candidate, action.status)}
                  style={[styles.queueAction, action.status === 'shortlisted' ? styles.primaryQueueAction : null]}
                >
                  <Text style={[styles.queueActionText, action.status === 'shortlisted' ? styles.primaryQueueActionText : null]}>
                    {savingCandidateId === candidate.id ? 'Saving' : action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>
    </RecruiterContent>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  headerCopy: { flex: 1 },
  headerActions: { alignItems: 'flex-end', gap: spacing.sm },
  title: { color: colors.text, ...typography.screenTitle },
  body: { color: colors.muted, ...typography.body },
  refreshButton: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  refreshText: { color: colors.text, ...typography.meta },
  list: { gap: spacing.lg, marginTop: spacing.lg },
  card: { gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, padding: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 58, height: 68, borderRadius: radii.sm, backgroundColor: colors.border },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', width: 58, height: 68, borderRadius: radii.sm, backgroundColor: colors.primary },
  avatarFallbackText: { color: colors.accent, fontSize: 22, fontWeight: '900' },
  cardHeaderCopy: { flex: 1 },
  rank: { color: colors.purple, ...typography.meta },
  name: { color: colors.text, ...typography.label },
  meta: { marginTop: 2, color: colors.muted, ...typography.meta },
  scoreBadge: { alignItems: 'center', justifyContent: 'center', minWidth: 56, minHeight: 56, borderRadius: 999, backgroundColor: colors.primary },
  scoreText: { color: colors.primaryText, fontSize: 17, fontWeight: '900' },
  matchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  matchText: { color: colors.text, ...typography.label },
  profileText: { color: colors.muted, ...typography.meta },
  evidenceList: { gap: spacing.sm },
  evidenceItem: { gap: spacing.xs, borderRadius: radii.sm, backgroundColor: colors.surfaceMuted, padding: spacing.md },
  validationItem: { gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.background, padding: spacing.md },
  evidenceTitle: { color: colors.text, ...typography.meta },
  evidenceBody: { color: colors.muted, ...typography.body },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  secondaryAction: { alignItems: 'center', justifyContent: 'center', minHeight: 42, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  secondaryActionText: { color: colors.text, ...typography.meta },
  queueAction: { alignItems: 'center', justifyContent: 'center', minHeight: 42, borderRadius: radii.sm, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.md },
  queueActionText: { color: colors.text, ...typography.meta },
  primaryQueueAction: { backgroundColor: colors.primary },
  primaryQueueActionText: { color: colors.primaryText }
});

function formatMatchStrength(value: RecruiterCandidate['matchStrength']) {
  if (value === 'strong_match') return 'Strong match';
  if (value === 'good_match') return 'Good match';
  if (value === 'potential_match') return 'Potential match';
  return 'Needs review';
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getArrayParam(value: string | string[] | undefined) {
  if (!value) {
    return undefined;
  }

  const values = Array.isArray(value) ? value : [value];
  const normalized = values.flatMap((item) => String(item).split(',')).map((item) => item.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
}

function getNumberParam(value: string | string[] | undefined) {
  const parsed = Number(getSingleParam(value));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getNumberArrayParam(value: string | string[] | undefined) {
  const values = getArrayParam(value)
    ?.map((item) => Number(item))
    .filter((item) => Number.isFinite(item));

  return values && values.length > 0 ? values : undefined;
}

function getBooleanParam(value: string | string[] | undefined) {
  const normalized = getSingleParam(value);
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return undefined;
}

function getFiltersFromParams(params: Record<string, string | string[] | undefined>): RecruiterCandidateSearchFilters {
  return {
    q: getSingleParam(params.q),
    categoryFieldId: getSingleParam(params.categoryFieldId),
    categoryFieldIds: getArrayParam(params.categoryFieldIds),
    university: getSingleParam(params.university),
    universities: getArrayParam(params.universities),
    major: getSingleParam(params.major),
    majors: getArrayParam(params.majors),
    semesterNumber: getNumberParam(params.semesterNumber),
    semesterNumbers: getNumberArrayParam(params.semesterNumbers),
    gpaMin: getNumberParam(params.gpaMin),
    gpaMax: getNumberParam(params.gpaMax),
    hasInternship: getBooleanParam(params.hasInternship),
    bookmarkedOnly: getBooleanParam(params.bookmarkedOnly)
  };
}
