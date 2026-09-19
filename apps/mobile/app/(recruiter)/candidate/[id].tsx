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

type CandidateTab = 'about' | 'resume' | 'video' | 'more';

const tabs: Array<{ label: string; value: CandidateTab }> = [
  { label: 'About', value: 'about' },
  { label: 'Resume', value: 'resume' },
  { label: 'Video', value: 'video' },
  { label: 'More', value: 'more' }
];

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

function formatMatchStrength(value: RecruiterCandidate['matchStrength']) {
  if (value === 'strong_match') return 'Strong match';
  if (value === 'good_match') return 'Good match';
  if (value === 'potential_match') return 'Potential match';
  return 'Needs review';
}

export default function RecruiterCandidateScreen() {
  const { session } = useSession();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [candidate, setCandidate] = useState<RecruiterCandidate | null>(null);
  const [activeTab, setActiveTab] = useState<CandidateTab>('about');
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
        tags: nextTags
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

  function openContact(nextCandidate: RecruiterCandidate) {
    router.push({
      pathname: '/(recruiter)/contact',
      params: {
        candidateId: nextCandidate.id,
        ...(nextCandidate.interestRequestStatus === 'accepted' ? { mode: 'message' } : {}),
        ...(isRequestRetry ? { mode: 'resend' } : {})
      }
    });
  }

  return (
    <Screen scroll>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.linkText}>Back</Text>
      </Pressable>

      <View style={styles.profileHeader}>
        {candidate.profileImageUrl ? (
          <Image source={{ uri: candidate.profileImageUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarFallbackText}>{(candidate.name ?? 'C').charAt(0)}</Text>
          </View>
        )}
        <View style={styles.profileCopy}>
          <Text style={styles.name}>{candidate.name ?? 'Applicant'}</Text>
          <Text style={styles.body}>{candidate.major ?? 'Major not set'}</Text>
          <Text style={styles.meta}>{candidate.universityName ?? 'University not set'} · GPA {candidate.gpa ?? 'N/A'}</Text>
        </View>
        <View style={styles.matchScoreBadge}>
          <Text style={styles.matchScoreText}>{candidate.matchScore}%</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <Pressable key={tab.value} onPress={() => setActiveTab(tab.value)} style={[styles.tab, isActive ? styles.tabActive : null]}>
              <Text style={[styles.tabText, isActive ? styles.tabTextActive : null]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {activeTab === 'about' ? (
        <>
          <View style={styles.matchSummary}>
            <View>
              <Text style={styles.matchLabel}>{formatMatchStrength(candidate.matchStrength)}</Text>
              <Text style={styles.matchMeta}>Profile strength {candidate.profileStrength}%</Text>
            </View>
            <Text style={styles.matchMeta}>{candidate.categoryMatch?.label ?? 'General match'}</Text>
          </View>

          <Section title="Key evidence">
            {candidate.matchEvidence.length > 0 ? (
              candidate.matchEvidence.map((item) => (
                <View key={item.id} style={styles.evidenceCard}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.body}>{item.body}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.body}>No evidence generated yet.</Text>
            )}
          </Section>

          <Section title="Signal">
            <Text style={styles.prompt}>
              {candidate.tenSecondElaboration?.trim() ||
                candidate.signalSummary?.trim() ||
                candidate.promptTextSnapshot ||
                'No signal response yet'}
            </Text>
          </Section>

          <Section title="Soft skills">
            <View style={styles.tags}>
              {candidate.softSkills.map((skill) => (
                <View key={skill.label} style={styles.tag}>
                  <Text style={styles.tagText}>{skill.label} {skill.rating}/5</Text>
                </View>
              ))}
            </View>
          </Section>
        </>
      ) : null}

      {activeTab === 'resume' ? (
        <>
          <Section title="Resume">
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
            ) : (
              <Text style={styles.body}>No resume available.</Text>
            )}
          </Section>

          <Section title="Experience">
            {candidate.internships.length > 0 ? (
              candidate.internships.map((item) => (
                <View key={item.id} style={styles.resumeItem}>
                  <Text style={styles.itemTitle}>{item.roleDepartment}</Text>
                  <Text style={styles.body}>{item.company}</Text>
                  <Text style={styles.meta}>{item.durationMonths} months</Text>
                </View>
              ))
            ) : (
              <Text style={styles.body}>No internships listed.</Text>
            )}
          </Section>
        </>
      ) : null}

      {activeTab === 'video' ? (
        <>
          <Section title="Short take">
            <Pressable
              disabled={!candidate.tenSecondVideoUrl}
              onPress={() =>
                router.push({
                  pathname: '/media/video-player',
                  params: { url: candidate.tenSecondVideoUrl, title: `${candidate.name ?? 'Candidate'} short take` }
                })
              }
              style={[styles.secondaryButton, !candidate.tenSecondVideoUrl ? styles.disabledButton : null]}
            >
              <Text style={styles.secondaryButtonText}>{candidate.tenSecondVideoUrl ? 'Watch short take' : 'No short take'}</Text>
            </Pressable>
          </Section>

          <Section title="Deeper signal">
            <Pressable
              disabled={!candidate.thirtySecondVideoUrl}
              onPress={() => {
                trackActivity('deeper_signal_opened');
                router.push({
                  pathname: '/media/video-player',
                  params: { url: candidate.thirtySecondVideoUrl, title: `${candidate.name ?? 'Candidate'} deeper signal` }
                });
              }}
              style={[styles.secondaryButton, !candidate.thirtySecondVideoUrl ? styles.disabledButton : null]}
            >
              <Text style={styles.secondaryButtonText}>{candidate.thirtySecondVideoUrl ? 'Watch deeper signal' : 'No deeper signal'}</Text>
            </Pressable>
          </Section>
        </>
      ) : null}

      {activeTab === 'more' ? (
        <>
          <Section title="Review">
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
          </Section>

          <Section title="What I built">
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
              <Text style={styles.body}>No projects listed.</Text>
            )}
          </Section>

          <Section title="Needs validation">
            {candidate.needsValidation.length > 0 ? (
              candidate.needsValidation.map((item) => (
                <View key={item.id} style={styles.validationCard}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.body}>{item.body}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.body}>No major validation flags.</Text>
            )}
          </Section>
        </>
      ) : null}

      <View style={styles.row}>
        <Pressable onPress={handleBookmark} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>{candidate.bookmarked ? 'Bookmarked' : 'Bookmark'}</Text>
        </Pressable>
        <Pressable
          disabled={isRequestPending || (isRequestRetry && !canRequestAgain)}
          onPress={() => openContact(candidate)}
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

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  linkText: { color: colors.purple, ...typography.meta },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  avatar: { width: 76, height: 86, borderRadius: radii.sm, backgroundColor: colors.border },
  avatarFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  avatarFallbackText: { color: colors.accent, fontSize: 28, fontWeight: '900' },
  profileCopy: { flex: 1 },
  name: { color: colors.text, ...typography.sectionTitle },
  body: { color: colors.muted, ...typography.body },
  meta: { color: colors.muted, ...typography.meta },
  matchScoreBadge: { alignItems: 'center', justifyContent: 'center', minWidth: 62, minHeight: 62, borderRadius: 999, backgroundColor: colors.primary },
  matchScoreText: { color: colors.primaryText, fontSize: 18, fontWeight: '900' },
  tabBar: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  tabActive: { borderBottomWidth: 3, borderBottomColor: colors.purple },
  tabText: { color: colors.muted, ...typography.meta },
  tabTextActive: { color: colors.purple },
  matchSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, marginTop: spacing.lg, padding: spacing.md },
  matchLabel: { color: colors.text, ...typography.label },
  matchMeta: { color: colors.muted, ...typography.meta },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { borderRadius: radii.sm, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tagText: { color: colors.text, ...typography.meta },
  section: { gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing.xl, paddingTop: spacing.lg },
  sectionTitle: { color: colors.text, ...typography.sectionTitle },
  evidenceCard: { gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, padding: spacing.md },
  validationCard: { gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surfaceMuted, padding: spacing.md },
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
  resumeItem: { gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, padding: spacing.md },
  projectLinkButton: { alignSelf: 'flex-start', marginTop: spacing.xs },
  itemTitle: { color: colors.text, ...typography.label },
  row: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl },
  button: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: controls.secondaryButtonHeight, borderRadius: radii.sm, backgroundColor: colors.primary },
  disabledButton: { opacity: 0.55 },
  buttonText: { color: colors.primaryText, ...typography.meta },
  secondaryButton: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: controls.secondaryButtonHeight, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, paddingHorizontal: spacing.md },
  secondaryButtonText: { color: colors.text, ...typography.meta },
  error: { marginTop: spacing.lg, color: colors.danger, ...typography.meta }
});
