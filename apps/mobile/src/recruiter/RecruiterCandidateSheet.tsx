import type { ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import { Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { RecruiterCandidate } from '@cato/shared';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { StatusBanner } from '../components/StatusBanner';
import { downloadAndShareFile } from '../media/downloadFile';
import { colors, controls, radii, spacing, typography } from '../theme';

type RecruiterCandidateSheetProps = {
  candidate: RecruiterCandidate | null;
  isBookmarking?: boolean;
  onClose: () => void;
  onToggleBookmark?: (candidate: RecruiterCandidate) => void;
};

type DialogMode = 'resume' | 'deeper';

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

function DeeperVideoDialog({ candidate, onClose }: { candidate: RecruiterCandidate; onClose: () => void }) {
  const player = useVideoPlayer(candidate.thirtySecondVideoUrl ?? null, (nextPlayer) => {
    nextPlayer.loop = false;
  });

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

function ResumeDialog({ candidate, onClose }: { candidate: RecruiterCandidate; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (!candidate.resumeUrl) {
      setError('No resume available.');
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      await downloadAndShareFile(candidate.resumeUrl, candidate.resumeFileName ?? 'resume');
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Unable to download resume');
    } finally {
      setIsDownloading(false);
    }
  }

  async function handlePreview() {
    const previewUrl = candidate.resumePreviewUrl ?? candidate.resumeUrl;

    if (!previewUrl) {
      setError('No resume available.');
      return;
    }

    setError(null);
    await WebBrowser.openBrowserAsync(previewUrl, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET
    });
  }

  return (
    <SwipeDismissLayer onDismiss={onClose}>
      <View style={styles.resumeDialog}>
        <LoadingOverlay message="Saving resume..." visible={isDownloading} />
        <View style={styles.dialogHeader}>
          <Text style={styles.dialogTitle}>Resume</Text>
          <Pressable onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
        <View style={styles.resumePreview}>
          <Text style={styles.resumeFileName}>{candidate.resumeFileName ?? 'Resume file'}</Text>
          <Text style={styles.body}>Preview opens the generated PDF. Download saves the original file.</Text>
        </View>
        <View style={styles.actions}>
          <Pressable disabled={!candidate.resumePreviewUrl && !candidate.resumeUrl} onPress={handlePreview} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Preview resume</Text>
          </Pressable>
          <Pressable disabled={!candidate.resumeUrl || isDownloading} onPress={handleDownload} style={styles.button}>
            <Text style={styles.buttonText}>Download</Text>
          </Pressable>
        </View>
        {error ? <StatusBanner message={error} tone="danger" /> : null}
      </View>
    </SwipeDismissLayer>
  );
}

export function RecruiterCandidateSheet({
  candidate,
  isBookmarking = false,
  onClose,
  onToggleBookmark
}: RecruiterCandidateSheetProps) {
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
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

  if (!candidate) {
    return null;
  }

  const signalText =
    candidate.tenSecondElaboration?.trim() ||
    candidate.signalSummary?.trim() ||
    candidate.promptTextSnapshot ||
    'No signal response yet.';

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
          <View style={styles.actions}>
            <Pressable disabled={!candidate.resumeUrl} onPress={() => setDialogMode('resume')} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Resume</Text>
            </Pressable>
            {candidate.thirtySecondVideoUrl ? (
              <Pressable onPress={() => setDialogMode('deeper')} style={styles.button}>
                <Text style={styles.buttonText}>Deeper signal</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        {dialogMode === 'resume' ? <ResumeDialog candidate={candidate} onClose={() => setDialogMode(null)} /> : null}
        {dialogMode === 'deeper' ? <DeeperVideoDialog candidate={candidate} onClose={() => setDialogMode(null)} /> : null}
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
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl
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
  resumeDialog: {
    width: '100%',
    gap: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
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
  resumePreview: {
    minHeight: 220,
    justifyContent: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.lg
  },
  resumeFileName: {
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
