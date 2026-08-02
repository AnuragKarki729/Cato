import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { skipThirtySecondVideo } from '../../src/api/signal';
import { Screen } from '../../src/components/Screen';
import { VideoRecorder } from '../../src/components/VideoRecorder';
import { useSession } from '../../src/hooks/useSession';
import { uploadRecordedVideoToCloudinary } from '../../src/media/videoUpload';
import { startQueuedVideoUpload } from '../../src/media/videoUploadQueue';
import { colors } from '../../src/theme';

export default function DeeperVideoScreen() {
  const { session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleRecorded(video: {
    uri: string;
    contentType: string;
    durationSeconds: number;
    fileSizeBytes?: number | null;
  }) {
    if (!session?.access_token) {
      return;
    }

    setError(null);

    try {
      startQueuedVideoUpload('30-second', uploadRecordedVideoToCloudinary(session.access_token, '30-second', video));
      router.replace('/(onboarding)/soft-skills');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to start deeper video upload');
    }
  }

  async function handleSkip() {
    if (!session?.access_token) {
      return;
    }

    setError(null);

    try {
      await skipThirtySecondVideo(session.access_token);
      setStatus('30-second video skipped');
      router.replace('/(onboarding)/soft-skills');
    } catch (skipError) {
      setError(skipError instanceof Error ? skipError.message : 'Unable to skip deeper video');
    }
  }

  return (
    <Screen edgeToEdge fullBleed>
      <VideoRecorder
        fullScreen
        idleSecondaryAction={{
          label: 'Skip for now',
          onPress: handleSkip
        }}
        label="Go Deeper into your signal"
        maxDurationSeconds={30}
        onClose={() => router.replace('/(onboarding)/deeper-signal')}
        onRecorded={handleRecorded}
        prompt="Go deeper into your signal"
        recordLabel="Record now"
      />
      {status ? <Text style={styles.meta}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    left: 18,
    color: colors.success,
    fontSize: 14,
    textAlign: 'center'
  },
  error: {
    position: 'absolute',
    right: 18,
    bottom: 92,
    left: 18,
    color: colors.danger,
    fontSize: 14,
    textAlign: 'center'
  }
});
