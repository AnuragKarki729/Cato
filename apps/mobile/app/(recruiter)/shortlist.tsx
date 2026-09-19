import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { RecruiterCandidate, RecruiterCandidateReviewStatus } from '@cato/shared';
import { getRecruiterCandidates, updateRecruiterCandidateReview } from '../../src/api/recruiter';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { StatusBanner } from '../../src/components/StatusBanner';
import { RecruiterContent } from '../../src/recruiter/RecruiterContent';
import { RecruiterEmptyState } from '../../src/recruiter/RecruiterEmptyState';
import { useSession } from '../../src/hooks/useSession';
import { colors, radii, spacing, typography } from '../../src/theme';

const moveActions: Array<{ label: string; status: RecruiterCandidateReviewStatus }> = [
  { label: 'Move to maybe', status: 'maybe' },
  { label: 'Pass', status: 'passed' }
];

export default function RecruiterShortlistScreen() {
  const { session } = useSession();
  const [candidates, setCandidates] = useState<RecruiterCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingCandidateId, setSavingCandidateId] = useState<string | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  async function loadShortlist() {
    if (!session?.access_token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getRecruiterCandidates(session.access_token, { reviewStatus: 'shortlisted' });
      setCandidates(response.candidates);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load shortlist');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadShortlist();
  }, [session?.access_token]);

  async function handleMove(candidate: RecruiterCandidate, status: RecruiterCandidateReviewStatus) {
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
      setCandidates((current) => current.filter((item) => item.id !== candidate.id));
      setSelectedCandidateIds((current) => current.filter((candidateId) => candidateId !== candidate.id));
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : 'Unable to update shortlist');
    } finally {
      setSavingCandidateId(null);
    }
  }

  if (isLoading) {
    return <LoadingScreen banner="Loading shortlist" />;
  }

  if (error && candidates.length === 0) {
    return (
      <RecruiterContent>
        <RecruiterEmptyState
          actionLabel="Back to dashboard"
          body={error}
          onAction={() => router.replace('/(recruiter)/dashboard')}
          title="Unable to load shortlist"
        />
      </RecruiterContent>
    );
  }

  if (candidates.length === 0) {
    return (
      <RecruiterContent>
        <RecruiterEmptyState
          actionLabel="Open evidence queue"
          body="Candidates you shortlist from review or evidence queue will appear here."
          onAction={() => router.replace('/(recruiter)/evidence-queue')}
          title="No shortlisted candidates yet"
        />
      </RecruiterContent>
    );
  }

  return (
    <RecruiterContent>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Shortlist</Text>
          <Text style={styles.body}>{candidates.length} candidates marked for deeper review.</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            disabled={selectedCandidateIds.length < 2}
            onPress={() =>
              router.push({
                pathname: '/(recruiter)/comparison',
                params: { ids: selectedCandidateIds.join(',') }
              })
            }
            style={[styles.refreshButton, selectedCandidateIds.length < 2 ? styles.disabledAction : null]}
          >
            <Text style={styles.refreshText}>Compare</Text>
          </Pressable>
          <Pressable onPress={loadShortlist} style={styles.refreshButton}>
            <Text style={styles.refreshText}>Refresh</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.selectionMeta}>Select 2-4 candidates to compare.</Text>
      {error ? <StatusBanner message={error} tone="danger" /> : null}
      <View style={styles.list}>
        {candidates.map((candidate) => {
          const isSelected = selectedCandidateIds.includes(candidate.id);
          const canMessage = candidate.interestRequestStatus === 'accepted';
          const isPending = candidate.interestRequestStatus === 'sent' || candidate.interestRequestStatus === 'viewed';
          const isRetry = candidate.interestRequestStatus === 'declined' || candidate.interestRequestStatus === 'expired';
          const canRetry =
            isRetry &&
            (!candidate.interestRequestResendAvailableAt || new Date(candidate.interestRequestResendAvailableAt).getTime() <= Date.now());

          return (
            <View key={candidate.id} style={styles.card}>
              <Pressable
                onPress={() => setSelectedCandidateIds((current) => toggleCandidateSelection(current, candidate.id))}
                style={[styles.selectButton, isSelected ? styles.selectButtonActive : null]}
              >
                <Text style={[styles.selectButtonText, isSelected ? styles.selectButtonTextActive : null]}>
                  {isSelected ? 'Selected' : 'Compare'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push({ pathname: '/(recruiter)/candidate/[id]', params: { id: candidate.id } })}
                style={styles.candidateHeader}
              >
                {candidate.profileImageUrl ? (
                  <Image source={{ uri: candidate.profileImageUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarFallbackText}>{(candidate.name ?? 'C').charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.candidateCopy}>
                  <Text style={styles.name}>{candidate.name ?? 'Applicant'}</Text>
                  <Text style={styles.meta}>
                    {[candidate.major, candidate.universityName, candidate.semesterLabel].filter(Boolean).join(' · ') || 'Profile details pending'}
                  </Text>
                  <Text style={styles.meta}>Profile strength {candidate.profileStrength}%</Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{candidate.matchScore}%</Text>
                </View>
              </Pressable>

              {candidate.matchEvidence[0] ? (
                <View style={styles.evidenceItem}>
                  <Text style={styles.evidenceTitle}>{candidate.matchEvidence[0].title}</Text>
                  <Text style={styles.evidenceBody}>{candidate.matchEvidence[0].body}</Text>
                </View>
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  disabled={isPending || (isRetry && !canRetry)}
                  onPress={() =>
                    router.push({
                      pathname: '/(recruiter)/contact',
                      params: {
                        candidateId: candidate.id,
                        ...(canMessage ? { mode: 'message' } : {}),
                        ...(canRetry ? { mode: 'resend' } : {})
                      }
                    })
                  }
                  style={[styles.primaryAction, isPending || (isRetry && !canRetry) ? styles.disabledAction : null]}
                >
                  <Text style={styles.primaryActionText}>
                    {canMessage ? 'Message' : isPending ? 'Request sent' : canRetry ? 'Request again' : 'Send interest'}
                  </Text>
                </Pressable>
                {moveActions.map((action) => (
                  <Pressable
                    key={action.status}
                    disabled={savingCandidateId === candidate.id}
                    onPress={() => handleMove(candidate, action.status)}
                    style={styles.secondaryAction}
                  >
                    <Text style={styles.secondaryActionText}>{savingCandidateId === candidate.id ? 'Saving' : action.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
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
  selectionMeta: { marginTop: spacing.sm, color: colors.muted, ...typography.meta },
  refreshButton: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  refreshText: { color: colors.text, ...typography.meta },
  list: { gap: spacing.lg, marginTop: spacing.lg },
  card: { gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, padding: spacing.md },
  selectButton: { alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border, borderRadius: 999, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  selectButtonActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  selectButtonText: { color: colors.text, ...typography.meta },
  selectButtonTextActive: { color: colors.text },
  candidateHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 58, height: 68, borderRadius: radii.sm, backgroundColor: colors.border },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', width: 58, height: 68, borderRadius: radii.sm, backgroundColor: colors.primary },
  avatarFallbackText: { color: colors.accent, fontSize: 22, fontWeight: '900' },
  candidateCopy: { flex: 1 },
  name: { color: colors.text, ...typography.label },
  meta: { marginTop: 2, color: colors.muted, ...typography.meta },
  scoreBadge: { alignItems: 'center', justifyContent: 'center', minWidth: 56, minHeight: 56, borderRadius: 999, backgroundColor: colors.primary },
  scoreText: { color: colors.primaryText, fontSize: 17, fontWeight: '900' },
  evidenceItem: { gap: spacing.xs, borderRadius: radii.sm, backgroundColor: colors.surfaceMuted, padding: spacing.md },
  evidenceTitle: { color: colors.text, ...typography.meta },
  evidenceBody: { color: colors.muted, ...typography.body },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  primaryAction: { alignItems: 'center', justifyContent: 'center', minHeight: 42, borderRadius: radii.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.md },
  primaryActionText: { color: colors.primaryText, ...typography.meta },
  disabledAction: { opacity: 0.55 },
  secondaryAction: { alignItems: 'center', justifyContent: 'center', minHeight: 42, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  secondaryActionText: { color: colors.text, ...typography.meta }
});

function toggleCandidateSelection(current: string[], candidateId: string) {
  if (current.includes(candidateId)) {
    return current.filter((id) => id !== candidateId);
  }

  if (current.length >= 4) {
    return [...current.slice(1), candidateId];
  }

  return [...current, candidateId];
}
