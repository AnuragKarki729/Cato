import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { RecruiterCandidate, RecruiterCandidateReview, RecruiterCandidateReviewStatus } from '@cato/shared';
import { recordRecruiterCandidateActivity, updateRecruiterCandidateReview } from '../api/recruiter';
import { FullscreenResumeDialog } from '../components/FullscreenResumeDialog';
import { StatusBanner } from '../components/StatusBanner';
import { useSession } from '../hooks/useSession';
import { colors, controls, radii, spacing, typography } from '../theme';

type RecruiterCandidateSheetProps = {
  candidate: RecruiterCandidate | null;
  isBookmarking?: boolean;
  isApplicantPreview?: boolean;
  onClose: () => void;
  onToggleBookmark?: (candidate: RecruiterCandidate) => void;
};

type DialogMode = 'resume' | 'deeper';

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

function getReviewStatusExplanation(status: RecruiterCandidateReviewStatus) {
  if (status === 'maybe') {
    return 'Recruiters use Maybe when they want to revisit your profile before deciding.';
  }

  if (status === 'shortlisted') {
    return 'Recruiters use Shortlist when your profile is a strong fit for a role or hiring conversation.';
  }

  if (status === 'passed') {
    return 'Recruiters use Pass when they decide not to continue with a profile for that role.';
  }

  return 'No status means the recruiter has not categorized your profile yet.';
}

function formatMatchStrength(value: RecruiterCandidate['matchStrength']) {
  if (value === 'strong_match') return 'Strong match';
  if (value === 'good_match') return 'Good match';
  if (value === 'potential_match') return 'Potential match';
  return 'Needs review';
}

function SwipeDismissLayer({ children, onDismiss }: { children: ReactNode; onDismiss: () => void }) {
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
        onPanResponderRelease: (_, gesture) => {
          if (Math.abs(gesture.dx) > 48) {
            onDismiss();
          }
        }
      }),
    [onDismiss]
  );

  return (
    <View {...panResponder.panHandlers} style={styles.dialogBackdrop}>
      {children}
    </View>
  );
}

function DeeperVideoDialog({
  candidate,
  onClose,
  onOpen
}: {
  candidate: RecruiterCandidate;
  onClose: () => void;
  onOpen: () => void;
}) {
  const didTrackOpen = useRef(false);
  const player = useVideoPlayer(candidate.thirtySecondVideoUrl ?? null, (nextPlayer) => {
    nextPlayer.loop = false;
  });

  useEffect(() => {
    if (!didTrackOpen.current) {
      didTrackOpen.current = true;
      onOpen();
    }
  }, [onOpen]);

  return (
    <SwipeDismissLayer onDismiss={onClose}>
      <View style={styles.videoDialog}>
        <View style={styles.dialogHeader}>
          <Text style={styles.dialogTitle}>Deeper signal</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
        {candidate.thirtySecondVideoUrl ? (
          <VideoView
            allowsFullscreen
            contentFit="contain"
            nativeControls
            player={player}
            style={styles.deeperVideo}
          />
        ) : (
          <Text style={styles.body}>No deeper signal yet.</Text>
        )}
      </View>
    </SwipeDismissLayer>
  );
}

export function RecruiterCandidateSheet({
  candidate,
  isBookmarking = false,
  isApplicantPreview = false,
  onClose,
  onToggleBookmark
}: RecruiterCandidateSheetProps) {
  const { session } = useSession();
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [review, setReview] = useState<RecruiterCandidateReview | undefined>(candidate?.review);
  const [reviewStatus, setReviewStatus] = useState<RecruiterCandidateReviewStatus>(candidate?.review?.status ?? 'none');
  const [reviewNotes, setReviewNotes] = useState(candidate?.review?.notes ?? '');
  const [reviewTagsText, setReviewTagsText] = useState(candidate?.review?.tags.join(', ') ?? '');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const sheetPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 18 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dx) > 48) {
          onClose();
        }
      }
    })
  ).current;

  useEffect(() => {
    setReview(candidate?.review);
    setReviewStatus(candidate?.review?.status ?? 'none');
    setReviewNotes(candidate?.review?.notes ?? '');
    setReviewTagsText(candidate?.review?.tags.join(', ') ?? '');
    setReviewError(null);
  }, [candidate?.id, candidate?.review]);

  if (!candidate) {
    return null;
  }

  const signalText =
    candidate.tenSecondElaboration?.trim() ||
    candidate.signalSummary?.trim() ||
    candidate.promptTextSnapshot ||
    'No signal response yet.';
  const isRequestPending = candidate.interestRequestStatus === 'sent' || candidate.interestRequestStatus === 'viewed';
  const isRequestRetry = candidate.interestRequestStatus === 'declined' || candidate.interestRequestStatus === 'expired';
  const canRequestAgain =
    !candidate.interestRequestResendAvailableAt || new Date(candidate.interestRequestResendAvailableAt).getTime() <= Date.now();
  const nextTags = parseTags(reviewTagsText);
  const hasReviewChanges =
    reviewStatus !== (review?.status ?? 'none') ||
    reviewNotes.trim() !== (review?.notes ?? '') ||
    nextTags.join(',') !== (review?.tags ?? []).join(',');

  async function handleSaveReview() {
    if (isApplicantPreview || !session?.access_token || !candidate || isSavingReview) {
      return;
    }

    setIsSavingReview(true);
    setReviewError(null);

    try {
      const response = await updateRecruiterCandidateReview(session.access_token, candidate.id, {
        status: reviewStatus,
        notes: reviewNotes.trim(),
        tags: nextTags
      });
      setReview(response.review);
      setReviewNotes(response.review.notes ?? '');
      setReviewTagsText(response.review.tags.join(', '));
    } catch (saveError) {
      setReviewError(saveError instanceof Error ? saveError.message : 'Unable to save review');
    } finally {
      setIsSavingReview(false);
    }
  }

  function trackActivity(type: 'resume_opened' | 'deeper_signal_opened') {
    if (isApplicantPreview || !session?.access_token || !candidate) {
      return;
    }

    const candidateId = candidate.id;

    recordRecruiterCandidateActivity(session.access_token, candidateId, type).catch(() => {
      // Activity is best-effort and should not block recruiter actions.
    });
  }

  return (
    <Modal animationType="slide" transparent visible={Boolean(candidate)} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable onPress={onClose} style={styles.backdropPressArea} />
        <View {...sheetPanResponder.panHandlers} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.dialogHeader}>
            <Text style={styles.title}>Know {candidate.name ?? 'Applicant'} More</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.sheetScrollContent} showsVerticalScrollIndicator={false}>
            {onToggleBookmark ? (
              <Pressable
                disabled={isBookmarking}
                onPress={() => onToggleBookmark(candidate)}
                style={[styles.bookmarkAction, candidate.bookmarked ? styles.bookmarkActionActive : null]}
              >
                <Text style={[styles.bookmarkActionText, candidate.bookmarked ? styles.bookmarkActionTextActive : null]}>
                  {candidate.bookmarked ? 'Bookmarked' : 'Bookmark'}
                </Text>
              </Pressable>
            ) : null}
            <View style={styles.matchSummary}>
              <View>
                <Text style={styles.matchLabel}>{formatMatchStrength(candidate.matchStrength)}</Text>
                <Text style={styles.matchMeta}>Profile strength {candidate.profileStrength}%</Text>
              </View>
              <View style={styles.matchScoreBadge}>
                <Text style={styles.matchScoreText}>{candidate.matchScore}%</Text>
              </View>
            </View>
            {candidate.matchEvidence.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Key evidence</Text>
                <View style={styles.evidenceList}>
                  {candidate.matchEvidence.slice(0, 4).map((item) => (
                    <View key={item.id} style={styles.evidenceCard}>
                      <Text style={styles.evidenceTitle}>{item.title}</Text>
                      <Text style={styles.evidenceBody}>{item.body}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
            {candidate.needsValidation.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Needs validation</Text>
                <View style={styles.evidenceList}>
                  {candidate.needsValidation.slice(0, 2).map((item) => (
                    <View key={item.id} style={styles.validationCard}>
                      <Text style={styles.evidenceTitle}>{item.title}</Text>
                      <Text style={styles.evidenceBody}>{item.body}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
            <Text style={styles.sectionTitle}>Review</Text>
            <View style={styles.reviewStatusRow}>
              {reviewStatuses.map((status) => {
                const isActive = reviewStatus === status.value;
                return (
                  <Pressable
                    key={status.value}
                    onPress={() => {
                      if (isApplicantPreview) {
                        Alert.alert(status.label, getReviewStatusExplanation(status.value));
                        return;
                      }

                      setReviewStatus(status.value);
                    }}
                    style={[styles.reviewChip, isActive ? styles.reviewChipActive : null]}
                  >
                    <Text style={[styles.reviewChipText, isActive ? styles.reviewChipTextActive : null]}>{status.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {isApplicantPreview ? (
              <Text style={styles.previewHelpText}>
                Recruiters use these states privately while reviewing candidates. Notes and tags are hidden from applicants.
              </Text>
            ) : (
              <>
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
                {reviewError ? <StatusBanner message={reviewError} tone="danger" /> : null}
              </>
            )}
            <Text style={styles.sectionTitle}>What's your signal?</Text>
            <Text style={styles.signalText}>{signalText}</Text>
            <Text style={styles.sectionTitle}>Soft skills</Text>
            <View style={styles.skillGrid}>
              {candidate.softSkills.slice(0, 4).map((skill) => (
                <View key={skill.label} style={styles.skillPill}>
                  <Text style={styles.skillLabel}>{skill.label}</Text>
                  <Text style={styles.skillRating}>{skill.rating}/5</Text>
                </View>
              ))}
            </View>
            <Text style={styles.sectionTitle}>What I built</Text>
            {candidate.projects.length > 0 ? (
              <View style={styles.projectList}>
                {candidate.projects.slice(0, 3).map((project) => (
                  <View key={project.id} style={styles.projectCard}>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <Text style={styles.projectMeta}>{formatProjectType(project.type)}</Text>
                    <Text style={styles.projectDescription}>{project.description}</Text>
                    {project.linkUrl ? (
                      <Pressable onPress={() => WebBrowser.openBrowserAsync(project.linkUrl!)} style={styles.projectLinkButton}>
                        <Text style={styles.projectLinkText}>Open link</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.body}>No projects added yet.</Text>
            )}
            <View style={styles.actions}>
              <Pressable
                disabled={!candidate.resumeUrl}
                onPress={() => {
                  trackActivity('resume_opened');
                  setDialogMode('resume');
                }}
                style={[styles.secondaryButton, !candidate.resumeUrl ? styles.disabledButton : null]}
              >
                <Text style={[styles.secondaryButtonText, !candidate.resumeUrl ? styles.disabledButtonText : null]}>Resume</Text>
              </Pressable>
              {candidate.thirtySecondVideoUrl ? (
                <Pressable onPress={() => setDialogMode('deeper')} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Deeper signal</Text>
                </Pressable>
              ) : null}
              <Pressable
                disabled={isRequestPending || (isRequestRetry && !canRequestAgain)}
                onPress={() => {
                  if (isApplicantPreview) {
                    Alert.alert(
                      'Recruiter interest',
                      'Recruiters interested in you will press this. You will receive a request and can accept or decline before messaging opens.'
                    );
                    return;
                  }

                  router.push({
                    pathname: '/(recruiter)/contact',
                    params: {
                      candidateId: candidate.id,
                      ...(candidate.interestRequestStatus === 'accepted' ? { mode: 'message' } : {}),
                      ...(isRequestRetry ? { mode: 'resend' } : {})
                    }
                  });
                }}
                style={[
                  styles.button,
                  isRequestPending || (isRequestRetry && !canRequestAgain) ? styles.disabledButton : null
                ]}
              >
                <Text style={styles.buttonText}>
                  {candidate.interestRequestStatus === 'accepted'
                    ? 'Message'
                    : isRequestPending
                    ? 'Request sent'
                    : isRequestRetry && !canRequestAgain
                    ? 'Request cooldown'
                    : isRequestRetry
                    ? 'Request again'
                    : 'Send interest'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
        <FullscreenResumeDialog
          downloadUrl={candidate.resumeUrl}
          fileName={candidate.resumeFileName ?? 'resume'}
          onClose={() => setDialogMode(null)}
          url={candidate.resumePreviewUrl ?? candidate.resumeUrl}
          visible={dialogMode === 'resume'}
        />
        {dialogMode === 'deeper' ? (
          <DeeperVideoDialog
            candidate={candidate}
            onClose={() => setDialogMode(null)}
            onOpen={() => trackActivity('deeper_signal_opened')}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(17,17,17,0.34)'
  },
  backdropPressArea: {
    flex: 1
  },
  sheet: {
    gap: spacing.md,
    maxHeight: '88%',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl
  },
  sheetScrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.sm
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg
  },
  title: {
    flex: 1,
    color: colors.text,
    ...typography.sectionTitle
  },
  closeText: {
    color: colors.purple,
    ...typography.label
  },
  sectionTitle: {
    marginTop: spacing.sm,
    color: colors.text,
    ...typography.label
  },
  bookmarkAction: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  bookmarkActionActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent
  },
  bookmarkActionText: {
    color: colors.text,
    ...typography.meta
  },
  bookmarkActionTextActive: {
    color: colors.text
  },
  matchSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.md
  },
  matchLabel: {
    color: colors.text,
    ...typography.label
  },
  matchMeta: {
    marginTop: 3,
    color: colors.muted,
    ...typography.meta
  },
  matchScoreBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 58,
    minHeight: 58,
    borderRadius: 999,
    backgroundColor: colors.primary
  },
  matchScoreText: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: '900'
  },
  evidenceList: {
    gap: spacing.sm
  },
  evidenceCard: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.md
  },
  validationCard: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md
  },
  evidenceTitle: {
    color: colors.text,
    ...typography.meta
  },
  evidenceBody: {
    color: colors.muted,
    ...typography.body
  },
  reviewStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  reviewChip: {
    minHeight: controls.chipHeight,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md
  },
  reviewChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  reviewChipText: {
    color: colors.text,
    ...typography.meta
  },
  reviewChipTextActive: {
    color: colors.primaryText
  },
  reviewNotesInput: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    color: colors.text,
    ...typography.body
  },
  reviewTagsInput: {
    minHeight: controls.inputHeight,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    color: colors.text,
    ...typography.body
  },
  saveReviewButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.secondaryButtonHeight,
    borderRadius: radii.sm,
    backgroundColor: colors.accent
  },
  saveReviewButtonText: {
    color: colors.text,
    ...typography.button
  },
  previewHelpText: {
    color: colors.muted,
    ...typography.meta
  },
  signalText: {
    color: colors.muted,
    ...typography.body
  },
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  skillPill: {
    minWidth: '47%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.md
  },
  skillLabel: {
    color: colors.text,
    ...typography.meta
  },
  skillRating: {
    marginTop: spacing.xs,
    color: colors.primary,
    ...typography.sectionTitle
  },
  projectList: {
    gap: spacing.sm
  },
  projectCard: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.md
  },
  projectTitle: {
    color: colors.text,
    ...typography.label
  },
  projectMeta: {
    color: colors.purple,
    ...typography.meta
  },
  projectDescription: {
    color: colors.muted,
    ...typography.body
  },
  projectLinkButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs
  },
  projectLinkText: {
    color: colors.purple,
    ...typography.label
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.secondaryButtonHeight,
    borderRadius: radii.sm,
    backgroundColor: colors.primary
  },
  disabledButton: {
    opacity: 0.55
  },
  disabledButtonText: {
    color: colors.muted
  },
  buttonText: {
    color: colors.primaryText,
    ...typography.button
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.secondaryButtonHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface
  },
  secondaryButtonText: {
    color: colors.text,
    ...typography.button
  },
  dialogBackdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17,17,17,0.62)',
    padding: spacing.xl
  },
  videoDialog: {
    width: '100%',
    maxHeight: '86%',
    gap: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    padding: spacing.xl
  },
  dialogTitle: {
    flex: 1,
    color: colors.text,
    ...typography.sectionTitle
  },
  deeperVideo: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: radii.sm,
    backgroundColor: colors.primary
  },
  body: {
    color: colors.muted,
    ...typography.body
  }
});
