import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { acceptPrivacyConsent } from '../../src/api/privacy';
import { getSignal } from '../../src/api/signal';
import { Screen } from '../../src/components/Screen';
import { VideoRecorder } from '../../src/components/VideoRecorder';
import { useSession } from '../../src/hooks/useSession';
import { uploadRecordedVideoToCloudinary } from '../../src/media/videoUpload';
import { startQueuedVideoUpload } from '../../src/media/videoUploadQueue';
import { colors, radii } from '../../src/theme';

export default function SignalVideoScreen() {
  const { session } = useSession();
  const { promptText: routePromptText } = useLocalSearchParams<{ promptText?: string }>();
  const [, requestCameraPermission] = useCameraPermissions();
  const [, requestMicrophonePermission] = useMicrophonePermissions();
  const [error, setError] = useState<string | null>(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [isAcceptingConsent, setIsAcceptingConsent] = useState(false);
  const [promptText, setPromptText] = useState(
    typeof routePromptText === 'string' && routePromptText.trim().length > 0
      ? routePromptText
      : 'Loading your prompt...'
  );

  useEffect(() => {
    if (typeof routePromptText === 'string' && routePromptText.trim().length > 0) {
      setPromptText(routePromptText);
    }
  }, [routePromptText]);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    let isMounted = true;

    getSignal(session.access_token)
      .then(({ signal }) => {
        if (isMounted && signal?.promptTextSnapshot) {
          setPromptText(signal.promptTextSnapshot);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPromptText((currentPromptText) =>
            currentPromptText === 'Loading your prompt...' ? "What's your take?" : currentPromptText
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session?.access_token]);

  async function handleAcceptConsent() {
    if (!session?.access_token || hasConsent) {
      return;
    }

    setError(null);
    setIsAcceptingConsent(true);

    try {
      await acceptPrivacyConsent(session.access_token, {
        video: true,
        privacyPolicy: true
      });
      await requestCameraPermission();
      await requestMicrophonePermission();
      setHasConsent(true);
    } catch (consentError) {
      setError(consentError instanceof Error ? consentError.message : 'Unable to record video consent');
    } finally {
      setIsAcceptingConsent(false);
    }
  }

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
      await acceptPrivacyConsent(session.access_token, {
        video: true,
        privacyPolicy: true
      });
      startQueuedVideoUpload('10-second', uploadRecordedVideoToCloudinary(session.access_token, '10-second', video));
      router.replace('/(onboarding)/deeper-signal');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to start signal video upload');
    }
  }

  return (
    <Screen edgeToEdge fullBleed>
      <VideoRecorder
        fullScreen
        label="10s Take"
        maxDurationSeconds={10}
        onClose={() => router.replace('/(onboarding)/signal-prompt')}
        onRecorded={handleRecorded}
        prompt={promptText}
      />
      {!hasConsent ? (
        <View style={styles.dialogBackdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Before recording</Text>
            <Pressable disabled={isAcceptingConsent} onPress={handleAcceptConsent} style={styles.consentRow}>
              <View style={[styles.checkbox, hasConsent ? styles.checkedBox : null]} />
              <Text style={styles.consentText}>
                {isAcceptingConsent
                  ? 'Opening permissions...'
                  : 'I consent to Cato privacy terms and terms of usage.'}
              </Text>
            </Pressable>
            <Pressable onPress={() => router.push('/privacy')} style={styles.privacyLink}>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  dialogBackdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.48)',
    padding: 24
  },
  dialog: {
    width: '100%',
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: 20
  },
  dialogTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900'
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#64748b',
    borderRadius: 4,
    backgroundColor: colors.surface
  },
  checkedBox: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  consentText: {
    flex: 1,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  linkText: {
    color: colors.purple,
    fontSize: 14,
    fontWeight: '700'
  },
  privacyLink: {
    alignSelf: 'flex-start',
    marginTop: 14
  },
  meta: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    left: 18,
    marginTop: 16,
    color: colors.success,
    fontSize: 14,
    textAlign: 'center'
  },
  error: {
    marginTop: 16,
    color: colors.danger,
    fontSize: 14
  }
});
