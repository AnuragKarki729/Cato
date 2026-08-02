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
  onKnowMore: (candidate: RecruiterCandidate) => void;
  onToggleBookmark?: (candidate: RecruiterCandidate) => void;
};

export function RecruiterVideoFeedCard({
  candidate,
  height,
  isActive,
  isBookmarking = false,
  isPaused,
  onKnowMore,
  onToggleBookmark
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
      <View style={styles.topBadge}>
        <Text style={styles.topBadgeText}>Short take</Text>
      </View>
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
      <View style={styles.content}>
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
  topBadge: {
    position: 'absolute',
    top: 56,
    left: spacing.xl,
    borderRadius: 999,
    backgroundColor: 'rgba(251,250,247,0.88)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  topBadgeText: {
    color: colors.text,
    ...typography.meta
  },
  bookmarkButton: {
    position: 'absolute',
    top: 56,
    right: spacing.xl,
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
    bottom: 112,
    left: spacing.xl,
    gap: spacing.md
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
