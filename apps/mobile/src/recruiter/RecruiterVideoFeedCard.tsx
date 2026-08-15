import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import type { RecruiterCandidate } from '@cato/shared';
import { colors, radii, spacing, typography } from '../theme';

type RecruiterVideoFeedCardProps = {
  candidate: RecruiterCandidate;
  height: number;
  isActive: boolean;
  isPaused: boolean;
  isBookmarking?: boolean;
  isChromeDimmed?: boolean;
  onKnowMore: (candidate: RecruiterCandidate) => void;
  onToggleBookmark?: (candidate: RecruiterCandidate) => void;
  onToggleChromeDimmed?: () => void;
};

export function RecruiterVideoFeedCard({
  candidate,
  height,
  isActive,
  isBookmarking = false,
  isChromeDimmed = false,
  isPaused,
  onKnowMore,
  onToggleBookmark,
  onToggleChromeDimmed
}: RecruiterVideoFeedCardProps) {
  const player = useVideoPlayer(candidate.tenSecondVideoUrl ?? null, (nextPlayer) => {
    nextPlayer.loop = true;
  });

  useEffect(() => {
    if (!candidate.tenSecondVideoUrl) {
      return;
    }

    if (isActive && !isPaused) {
      player.play();
      return;
    }

    player.pause();
  }, [candidate.tenSecondVideoUrl, isActive, isPaused, player]);

  const topSkills = candidate.softSkills.slice(0, 3);

  return (
    <View style={[styles.card, { height }]}>
      <Pressable
        accessibilityLabel={isChromeDimmed ? 'Show candidate details' : 'Dim candidate details'}
        onPress={onToggleChromeDimmed}
        style={styles.videoTapTarget}
      />
      {candidate.tenSecondVideoUrl ? (
        <VideoView
          allowsPictureInPicture={false}
          contentFit="cover"
          nativeControls={false}
          player={player}
          style={styles.video}
        />
      ) : candidate.profileImageUrl ? (
        <Image source={{ uri: candidate.profileImageUrl }} style={styles.video} />
      ) : (
        <View style={[styles.video, styles.fallback]}>
          <Text style={styles.fallbackText}>{(candidate.name ?? 'C').charAt(0)}</Text>
        </View>
      )}
      <View style={styles.scrim} />
      {onToggleBookmark ? (
        <Pressable
          accessibilityLabel={candidate.bookmarked ? 'Remove bookmark' : 'Bookmark candidate'}
          disabled={isBookmarking}
          onPress={() => onToggleBookmark(candidate)}
          style={[styles.bookmarkButton, candidate.bookmarked ? styles.bookmarkButtonActive : null]}
        >
          <Ionicons
            color={candidate.bookmarked ? colors.text : colors.primaryText}
            name={candidate.bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
          />
        </Pressable>
      ) : null}
      <View
        pointerEvents={isChromeDimmed ? 'none' : 'box-none'}
        style={[styles.content, isChromeDimmed ? styles.contentDimmed : styles.contentReadable]}
      >
        <Text style={styles.name}>{candidate.name ?? 'Applicant'}</Text>
        <Text style={styles.meta}>
          {[candidate.semesterLabel, candidate.major, candidate.universityName].filter(Boolean).join(' · ') || 'Profile details pending'}
        </Text>
        <View style={styles.skills}>
          {topSkills.map((skill) => (
            <View key={skill.label} style={styles.skillBadge}>
              <Text style={styles.skillText}>{skill.label} {skill.rating}/5</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={() => onKnowMore(candidate)} style={styles.button}>
          <Text style={styles.buttonText}>Know {candidate.name?.split(/\s+/)[0] ?? 'Applicant'} More</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.primary
  },
  videoTapTarget: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%'
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary
  },
  fallbackText: {
    color: colors.accent,
    fontSize: 86,
    fontWeight: '900'
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)'
  },
  bookmarkButton: {
    position: 'absolute',
    top: 56,
    right: spacing.xl,
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 999,
    backgroundColor: 'rgba(17,17,17,0.34)'
  },
  bookmarkButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent
  },
  content: {
    position: 'absolute',
    right: spacing.xl,
    bottom: 65,
    left: spacing.xl,
    zIndex: 2,
    gap: spacing.md,
    borderRadius: radii.sm,
    padding: spacing.lg
  },
  contentReadable: {
    backgroundColor: 'rgba(0,0,0,0.32)'
  },
  contentDimmed: {
    backgroundColor: 'transparent',
    opacity: 0.3
  },
  name: {
    color: colors.primaryText,
    ...typography.heroTitle
  },
  meta: {
    color: 'rgba(255,255,255,0.86)',
    ...typography.body
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  skillBadge: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    borderRadius: radii.sm,
    backgroundColor: 'rgba(17,17,17,0.34)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  skillText: {
    color: colors.primaryText,
    ...typography.meta
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: radii.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg
  },
  buttonText: {
    color: colors.text,
    ...typography.button
  }
});
