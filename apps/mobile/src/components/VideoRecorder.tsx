import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { VideoView, useVideoPlayer } from 'expo-video';
import { getFileSizeBytes } from '../media/fileData';
import { colors, radii } from '../theme';

type RecordedVideo = {
  durationSeconds: number;
  fileSizeBytes?: number | null;
  contentType: string;
  uri: string;
};

type VideoRecorderProps = {
  fullScreen?: boolean;
  idleSecondaryAction?: {
    label: string;
    onPress: () => void;
  };
  maxDurationSeconds: number;
  onClose?: () => void;
  onRecorded: (video: RecordedVideo) => Promise<void>;
  prompt?: string;
  label?: string;
  recordLabel?: string;
};

export function VideoRecorder({
  fullScreen = false,
  idleSecondaryAction,
  label,
  maxDurationSeconds,
  onClose,
  onRecorded,
  prompt,
  recordLabel = 'Record'
}: VideoRecorderProps) {
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(maxDurationSeconds);
  const [isUploading, setIsUploading] = useState(false);
  const player = useVideoPlayer(recordedUri, (nextPlayer) => {
    nextPlayer.loop = true;
  });

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    setRemainingSeconds(maxDurationSeconds);

    const interval = setInterval(() => {
      setRemainingSeconds((currentSeconds) => Math.max(0, currentSeconds - 1));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isRecording, maxDurationSeconds]);

  async function handleRecord() {
    if (!cameraRef.current || isRecording) {
      return;
    }

    setError(null);
    setRecordedUri(null);
    setRemainingSeconds(maxDurationSeconds);
    setIsRecording(true);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: maxDurationSeconds,
        maxFileSize: 80 * 1024 * 1024
      });

      if (video?.uri) {
        setRecordedUri(video.uri);
      }
    } catch (recordError) {
      setError(recordError instanceof Error ? recordError.message : 'Unable to record video');
    } finally {
      setIsRecording(false);
    }
  }

  function handlePrimaryAction() {
    if (recordedUri) {
      setError(null);
      setRecordedUri(null);
      setRemainingSeconds(maxDurationSeconds);
      return;
    }

    void handleRecord();
  }

  function handleStop() {
    cameraRef.current?.stopRecording();
  }

  async function handleUpload() {
    if (!recordedUri) {
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      await onRecorded({
        durationSeconds: maxDurationSeconds,
        fileSizeBytes: getFileSizeBytes(recordedUri),
        contentType: 'video/mp4',
        uri: recordedUri
      });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload video');
    } finally {
      setIsUploading(false);
    }
  }

  if (!cameraPermission || !microphonePermission) {
    return (
      <View style={[styles.container, fullScreen ? styles.fullScreenContainer : null]}>
        <Text style={styles.body}>Checking camera permission</Text>
      </View>
    );
  }

  if (!cameraPermission.granted || !microphonePermission.granted) {
    return (
      <View style={[styles.container, fullScreen ? styles.fullScreenContainer : null]}>
        <Text style={styles.body}>Camera and microphone permission are required for this step.</Text>
        <Pressable
          onPress={async () => {
            await requestCameraPermission();
            await requestMicrophonePermission();
          }}
          style={styles.permissionButton}
        >
          <Text style={styles.buttonText}>Allow camera and mic</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, fullScreen ? styles.fullScreenContainer : null]}>
      <View style={[styles.captureFrame, fullScreen ? styles.fullScreenFrame : null]}>
        {recordedUri ? (
          <VideoView
            allowsPictureInPicture={false}
            contentFit="cover"
            fullscreenOptions={{ enable: true, orientation: 'portrait' }}
            nativeControls
            player={player}
            style={[styles.camera, fullScreen ? styles.fullScreenCamera : null]}
          />
        ) : (
          <CameraView ref={cameraRef} facing="front" mode="video" style={[styles.camera, fullScreen ? styles.fullScreenCamera : null]} />
        )}
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Back to prompt selection" onPress={onClose} style={styles.iconButton}>
            <Text style={styles.close}>x</Text>
          </Pressable>
          <Text style={styles.timer}>00:{String(remainingSeconds).padStart(2, '0')}</Text>
          <Pressable
            accessibilityLabel="Recording instructions"
            onPress={() => setShowInstructions(true)}
            style={styles.iconButton}
          >
            <Text style={styles.flash}>!</Text>
          </Pressable>
        </View>
        {prompt ? <Text style={styles.prompt}>{prompt}</Text> : null}
        {label ? <Text style={styles.label}>{label}</Text> : null}
        {showInstructions ? (
          <View style={styles.instructionsBackdrop}>
            <View style={styles.instructionsPanel}>
              <Text style={styles.instructionsText}>
                Record yourself being authentically <Text style={styles.instructionsYou}>YOU</Text>, no one likes AI
              </Text>
              <Pressable onPress={() => setShowInstructions(false)} style={styles.instructionsButton}>
                <Text style={styles.instructionsButtonText}>Got it</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        <View style={[styles.actions, fullScreen ? styles.overlayActions : null]}>
          {isRecording ? (
            <Pressable onPress={handleStop} style={[styles.recordButton, styles.stopButton]}>
              <Text style={styles.buttonText}>Stop</Text>
            </Pressable>
          ) : (
            <Pressable onPress={handlePrimaryAction} style={[styles.recordButton, recordedUri ? styles.compactButton : null]}>
              <Text style={styles.buttonText}>{recordedUri ? 'Re-record' : recordLabel}</Text>
            </Pressable>
          )}
          {recordedUri ? (
            <Pressable disabled={isUploading} onPress={handleUpload} style={[styles.secondaryButton, styles.compactButton]}>
              <Text style={styles.secondaryButtonText}>{isUploading ? 'Uploading...' : 'Use this video'}</Text>
            </Pressable>
          ) : !isRecording && idleSecondaryAction ? (
            <Pressable onPress={idleSecondaryAction.onPress} style={[styles.secondaryButton, styles.compactButton]}>
              <Text style={styles.secondaryButtonText}>{idleSecondaryAction.label}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16
  },
  fullScreenContainer: {
    flex: 1,
    gap: 0
  },
  captureFrame: {
    overflow: 'hidden',
    borderRadius: radii.md,
    backgroundColor: colors.primary
  },
  fullScreenFrame: {
    flex: 1,
    borderRadius: 0,
    minHeight: '100%'
  },
  camera: {
    width: '100%',
    aspectRatio: 9 / 16
  },
  fullScreenCamera: {
    flex: 1,
    width: '100%',
    height: '100%',
    aspectRatio: undefined
  },
  topBar: {
    position: 'absolute',
    top: 52,
    right: 18,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(17, 17, 17, 0.32)'
  },
  close: {
    color: colors.primaryText,
    fontSize: 24,
    fontWeight: '400'
  },
  timer: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: colors.purple,
    paddingHorizontal: 12,
    paddingVertical: 5,
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '900'
  },
  flash: {
    color: colors.primaryText,
    fontSize: 22,
    fontWeight: '900'
  },
  instructionsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.38)',
    padding: 24
  },
  instructionsPanel: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: 18
  },
  instructionsText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 26,
    textAlign: 'center'
  },
  instructionsYou: {
    color: colors.accent
  },
  instructionsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 16,
    borderRadius: radii.sm,
    backgroundColor: colors.primary
  },
  instructionsButtonText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '800'
  },
  prompt: {
    position: 'absolute',
    right: 24,
    left: 24,
    bottom: 94,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: 'rgba(101, 87, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 20,
    textAlign: 'center'
  },
  label: {
    position: 'absolute',
    top: 86,
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: colors.purple,
    paddingHorizontal: 12,
    paddingVertical: 5,
    color: colors.primaryText,
    fontSize: 13,
    fontWeight: '900'
  },
  body: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22
  },
  actions: {
    flexDirection: 'row',
    gap: 12
  },
  overlayActions: {
    position: 'absolute',
    right: 18,
    bottom: 28,
    left: 18
  },
  permissionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: 16
  },
  recordButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: 16
  },
  compactButton: {
    flex: 1
  },
  stopButton: {
    backgroundColor: colors.danger
  },
  buttonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700'
  },
  error: {
    color: colors.danger,
    fontSize: 14
  }
});
