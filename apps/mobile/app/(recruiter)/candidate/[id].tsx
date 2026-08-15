import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { RecruiterCandidate, RecruiterCandidateReviewStatus } from '@cato/shared';
import {
  bookmarkRecruiterCandidate,
  getRecruiterCandidate,
  recordRecruiterCandidateActivity,
  updateRecruiterCandidateReview
} from '../../../src/api/recruiter';
import { Screen } from '../../../src/components/Screen';
import { useSession } from '../../../src/hooks/useSession';
import { colors, controls, radii, spacing, typography } from '../../../src/theme';

const reviewStatuses: Array<{ label: string; value: RecruiterCandidateReviewStatus }> = [
  { label: 'No status', value: 'none' },
  { label: 'Maybe', value: 'maybe' },
  { label: 'Shortlist', value: 'shortlisted' },
  { label: 'Pass', value: 'passed' }
];

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, 12);
}

function formatProjectType(type: string) {
  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function RecruiterCandidateScreen() {
  const { session } = useSession();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [candidate, setCandidate] = useState<RecruiterCandidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<RecruiterCandidateReviewStatus>('none');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewTagsText, setReviewTagsText] = useState('');
  const [isSavingReview, setIsSavingReview] = useState(false);

  useEffect(() => {
    if (!session?.access_token || !id) {
      return;
    }

    getRecruiterCandidate(session.access_token, id)
      .then((response) => {
        setCandidate(response.candidate);
        setReviewStatus(response.candidate.review?.status ?? 'none');
        setReviewNotes(response.candidate.review?.notes ?? '');
        setReviewTagsText(response.candidate.review?.tags.join(', ') ?? '');
      })
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

  async function handleSaveReview() {
    if (!session?.access_token || !candidate || isSavingReview) {
      return;
    }

    setIsSavingReview(true);
    setError(null);

    try {
      const response = await updateRecruiterCandidateReview(session.access_token, candidate.id, {
        status: reviewStatus,
        notes: reviewNotes.trim(),
        tags: parseTags(reviewTagsText)
      });
      setCandidate({ ...candidate, review: response.review });
      setReviewNotes(response.review.notes ?? '');
      setReviewTagsText(response.review.tags.join(', '));
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Unable to save review');
    } finally {
      setIsSavingReview(false);
    }
  }

  function trackActivity(type: 'resume_opened' | 'deeper_signal_opened') {
    if (!session?.access_token || !candidate) {
      return;
    }

    recordRecruiterCandidateActivity(session.access_token, candidate.id, type).catch(() => {
      // Activity is best-effort and should not block recruiter actions.
    });
  }

  if (!candidate) {
    return (
      <Screen centered>
        <Text style={styles.body}>Loading candidate</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Screen>
    );
  }

  const isRequestPending = candidate.interestRequestStatus === 'sent' || candidate.interestRequestStatus === 'viewed';
  const isRequestRetry = candidate.interestRequestStatus === 'declined' || candidate.interestRequestStatus === 'expired';
  const canRequestAgain =
    !candidate.interestRequestResendAvailableAt || new Date(candidate.interestRequestResendAvailableAt).getTime() <= Date.now();
  const nextTags = parseTags(reviewTagsText);
  const hasReviewChanges =
    reviewStatus !== (candidate.review?.status ?? 'none') ||
    reviewNotes.trim() !== (candidate.review?.notes ?? '') ||
    nextTags.join(',') !== (candidate.review?.tags ?? []).join(',');

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
        <Text style={styles.sectionTitle}>Review</Text>
        <View style={styles.reviewStatusRow}>
          {reviewStatuses.map((status) => {
            const isActive = reviewStatus === status.value;
            return (
              <Pressable
                key={status.value}
                onPress={() => setReviewStatus(status.value)}
                style={[styles.reviewChip, isActive ? styles.reviewChipActive : null]}
              >
                <Text style={[styles.reviewChipText, isActive ? styles.reviewChipTextActive : null]}>{status.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          multiline
          onChangeText={setReviewNotes}
          placeholder="Private notes"
          placeholderTextColor={colors.muted}
          style={styles.reviewNotesInput}
          textAlignVertical="top"
          value={reviewNotes}
        />
        <TextInput
          autoCapitalize="none"
          onChangeText={setReviewTagsText}
          placeholder="Tags separated by commas"
          placeholderTextColor={colors.muted}
          style={styles.reviewTagsInput}
          value={reviewTagsText}
        />
        <Pressable
          disabled={!hasReviewChanges || isSavingReview}
          onPress={handleSaveReview}
          style={[styles.saveReviewButton, !hasReviewChanges || isSavingReview ? styles.disabledButton : null]}
        >
          <Text style={styles.saveReviewButtonText}>{isSavingReview ? 'Saving review...' : 'Save review'}</Text>
        </Pressable>
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
        <Text style={styles.sectionTitle}>What I built</Text>
        {candidate.projects.length > 0 ? (
          candidate.projects.map((project) => (
            <View key={project.id} style={styles.resumeItem}>
              <Text style={styles.itemTitle}>{project.title}</Text>
              <Text style={styles.meta}>{formatProjectType(project.type)}</Text>
              <Text style={styles.body}>{project.description}</Text>
              {project.linkUrl ? (
                <Pressable onPress={() => WebBrowser.openBrowserAsync(project.linkUrl!)} style={styles.projectLinkButton}>
                  <Text style={styles.linkText}>Open link</Text>
                </Pressable>
              ) : null}
            </View>
          ))
        ) : (
          <Text style={styles.body}>No projects listed</Text>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resume</Text>
        {candidate.resumeUrl ? (
          <Pressable
            onPress={() => {
              trackActivity('resume_opened');
              router.push({
                pathname: '/media/resume-preview',
                params: { url: candidate.resumePreviewUrl ?? candidate.resumeUrl, fileName: candidate.resumeFileName ?? 'resume' }
              });
            }}
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
        <Pressable
          disabled={isRequestPending || (isRequestRetry && !canRequestAgain)}
          onPress={() =>
            router.push({
              pathname: '/(recruiter)/contact',
              params: {
                candidateId: candidate.id,
                ...(candidate.interestRequestStatus === 'accepted' ? { mode: 'message' } : {}),
                ...(isRequestRetry ? { mode: 'resend' } : {})
              }
            })
          }
          style={[
            styles.button,
            isRequestPending || (isRequestRetry && !canRequestAgain) ? styles.disabledButton : null
          ]}
        >
          <Text style={styles.buttonText}>
            {candidate.interestRequestStatus === 'accepted'
              ? 'Message'
              : isRequestPending
              ? 'Request Sent'
              : isRequestRetry && !canRequestAgain
              ? 'Request Cooldown'
              : isRequestRetry
              ? 'Request Again'
              : 'Send Interest'}
          </Text>
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
  reviewStatusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reviewChip: { minHeight: controls.chipHeight, justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 999, backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  reviewChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  reviewChipText: { color: colors.text, ...typography.meta },
  reviewChipTextActive: { color: colors.primaryText },
  reviewNotesInput: { minHeight: 96, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radii.sm, backgroundColor: colors.surface, padding: spacing.md, color: colors.text, ...typography.body },
  reviewTagsInput: { minHeight: controls.inputHeight, borderWidth: 1, borderColor: colors.fieldBorder, borderRadius: radii.sm, backgroundColor: colors.surface, paddingHorizontal: spacing.md, color: colors.text, ...typography.body },
  saveReviewButton: { alignItems: 'center', justifyContent: 'center', minHeight: controls.secondaryButtonHeight, borderRadius: radii.sm, backgroundColor: colors.accent },
  saveReviewButtonText: { color: colors.text, ...typography.button },
  prompt: { color: colors.text, ...typography.label },
  resumeItem: { gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, padding: spacing.md },
  projectLinkButton: { alignSelf: 'flex-start', marginTop: spacing.xs },
  itemTitle: { color: colors.text, ...typography.label },
  row: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl },
  button: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: controls.secondaryButtonHeight, borderRadius: radii.sm, backgroundColor: colors.primary },
  disabledButton: { opacity: 0.55 },
  buttonText: { color: colors.primaryText, ...typography.meta },
  secondaryButton: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: controls.secondaryButtonHeight, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface },
  secondaryButtonText: { color: colors.text, ...typography.meta },
  error: { marginTop: spacing.lg, color: colors.danger, ...typography.meta }
});
