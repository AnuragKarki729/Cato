import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Screen } from '../../src/components/Screen';
import { colors, spacing, typography } from '../../src/theme';

export default function VideoPlayerScreen() {
  const { title, url } = useLocalSearchParams<{ title?: string; url?: string }>();
  const player = useVideoPlayer(url ?? null, (nextPlayer) => {
    nextPlayer.loop = false;
  });

  return (
    <Screen fullBleed>
      <Text style={styles.title}>{title ?? 'Video'}</Text>
      {url ? (
        <VideoView
          allowsFullscreen
          allowsPictureInPicture
          contentFit="contain"
          nativeControls
          player={player}
          style={styles.video}
        />
      ) : (
        <Text style={styles.body}>No video available.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    ...typography.sectionTitle,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl
  },
  video: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.primary
  },
  body: {
    marginTop: spacing.lg,
    color: colors.muted,
    ...typography.body,
    paddingHorizontal: spacing.xl
  }
});
