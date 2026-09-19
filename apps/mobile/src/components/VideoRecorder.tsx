import { useEffect, useRef, useState } from 'react';
import { NativeEventEmitter, NativeModules, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import NativeVideoTrim, { isValidFile, showEditor } from 'react-native-video-trim';
import { EmptyState } from './EmptyState';
import { getFileSizeBytes } from '../media/fileData';
import { colors, radii } from '../theme';

const MIN_UPLOAD_DURATION_SECONDS = 3;
const MIN_UPLOAD_DURATION_MS = MIN_UPLOAD_DURATION_SECONDS * 1000;
const CLOUD_BACKED_VIDEO_ERROR =
  'Could not upload this video. It may still be stored in iCloud. Open it in Photos first so it downloads to this device, then try again, or choose a local video from Files.';

function normalizeTrimDurationMs(duration: number) {
  return duration > 0 && duration < 1000 ? duration * 1000 : duration;
}

type TrimPayload = {
  duration: number;
  endTime?: number;
  outputPath: string;
  startTime?: number;
};

function getTrimDurationMs({ duration, endTime, startTime }: TrimPayload) {
  const rangeDuration = typeof startTime === 'number' && typeof endTime === 'number' ? endTime - startTime : 0;
  return rangeDuration > 0 ? rangeDuration : normalizeTrimDurationMs(duration);
}

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
  const pendingTrimRef = useRef(false);
  const cancelTrimTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordedDurationSeconds, setRecordedDurationSeconds] = useState(maxDurationSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(maxDurationSeconds);
  const [isTrimming, setIsTrimming] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const player = useVideoPlayer(recordedUri, (nextPlayer) => {
    nextPlayer.loop = true;
  });

  function setPreparedVideoPreview(uri: string, durationSeconds: number) {
    setRecordedUri(uri.startsWith('file://') ? uri : `file://${uri}`);
    setRecordedDurationSeconds(
      Math.min(maxDurationSeconds, Math.max(MIN_UPLOAD_DURATION_SECONDS, durationSeconds))
    );
    setRemainingSeconds(maxDurationSeconds);
    setError(null);
  }

  useEffect(() => {
    function handleTrimFinished(payload: TrimPayload) {
      if (!pendingTrimRef.current) {
        return;
      }

      if (cancelTrimTimeoutRef.current) {
        clearTimeout(cancelTrimTimeoutRef.current);
        cancelTrimTimeoutRef.current = null;
      }

      pendingTrimRef.current = false;
      setIsTrimming(false);
      const durationMs = getTrimDurationMs(payload);

      if (!payload.outputPath) {
        setError('Unable to prepare video preview. Try another clip.');
        return;
      }

      if (durationMs < MIN_UPLOAD_DURATION_MS) {
        setError(`Choose or trim a video to at least ${MIN_UPLOAD_DURATION_SECONDS} seconds.`);
        return;
      }

      if (durationMs > maxDurationSeconds * 1000 + 500) {
        setError(`Trim the video to ${maxDurationSeconds} seconds or less before using it.`);
        return;
      }

      setPreparedVideoPreview(payload.outputPath, durationMs / 1000);
    }

    function handleTrimError(message?: string) {
      pendingTrimRef.current = false;
      setIsTrimming(false);
      setError(message || 'Unable to trim video');
    }

    function handleTrimCanceled() {
      if (cancelTrimTimeoutRef.current) {
        clearTimeout(cancelTrimTimeoutRef.current);
      }

      cancelTrimTimeoutRef.current = setTimeout(() => {
        if (pendingTrimRef.current) {
          pendingTrimRef.current = false;
          setIsTrimming(false);
        }
        cancelTrimTimeoutRef.current = null;
      }, 1200);
    }

    const finishSubscription = NativeVideoTrim.onFinishTrimming(
      ({ duration, endTime, outputPath, startTime }: TrimPayload) => {
        handleTrimFinished({ duration, endTime, outputPath, startTime });
      }
    );

    const errorSubscription = NativeVideoTrim.onError(({ message }: { message?: string }) => {
      handleTrimError(message);
    });

    const cancelSubscription = NativeVideoTrim.onCancel(() => {
      handleTrimCanceled();
    });

    const canUseLegacyEmitter =
      NativeModules.VideoTrim &&
      typeof NativeModules.VideoTrim.addListener === 'function' &&
      typeof NativeModules.VideoTrim.removeListeners === 'function';
    const legacyEmitter = canUseLegacyEmitter ? new NativeEventEmitter(NativeModules.VideoTrim) : null;
    const legacySubscription = legacyEmitter?.addListener('VideoTrim', (event) => {
      switch (event?.name) {
        case 'onFinishTrimming':
          handleTrimFinished({
            duration: Number(event.duration || 0),
            endTime: typeof event.endTime === 'number' ? event.endTime : undefined,
            outputPath: String(event.outputPath || ''),
            startTime: typeof event.startTime === 'number' ? event.startTime : undefined
          });
          break;
        case 'onError':
          handleTrimError(event.message);
          break;
        case 'onCancel':
          handleTrimCanceled();
          break;
      }
    });

    return () => {
      finishSubscription.remove();
      errorSubscription.remove();
      cancelSubscription.remove();
      legacySubscription?.remove();
      if (cancelTrimTimeoutRef.current) {
        clearTimeout(cancelTrimTimeoutRef.current);
      }
    };
  }, [maxDurationSeconds]);

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
    setRecordedDurationSeconds(maxDurationSeconds);
    setRemainingSeconds(maxDurationSeconds);
    setIsRecording(true);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: maxDurationSeconds,
        maxFileSize: 80 * 1024 * 1024
      });

      if (video?.uri) {
        setPreparedVideoPreview(video.uri, maxDurationSeconds);
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
      setRecordedDurationSeconds(maxDurationSeconds);
      setRemainingSeconds(maxDurationSeconds);
      return;
    }

    void handleRecord();
  }

  function handleStop() {
    cameraRef.current?.stopRecording();
  }

  function openTrimEditor(uri: string) {
    pendingTrimRef.current = true;
    setIsTrimming(true);
    showEditor(uri, {
      alertOnFailToLoad: true,
      alertOnFailCloseText: 'Close',
      alertOnFailMessage: 'This video cannot be loaded. Try another clip.',
      alertOnFailTitle: 'Unable to open video',
      autoplay: true,
      closeWhenFinish: true,
      durationFormat: 'mm:ss',
      enableCancelDialog: true,
      enableCancelTrimming: true,
      enableCancelTrimmingDialog: true,
      enablePreciseTrimming: true,
      fullScreenModalIOS: true,
      headerText: `Trim to ${maxDurationSeconds}s`,
      maxDuration: maxDurationSeconds * 1000,
      minDuration: MIN_UPLOAD_DURATION_MS,
      saveButtonText: 'Use clip',
      theme: 'dark',
      trimmerColor: '#38F27A',
      trimmingText: 'Preparing clip...'
    });
  }

  async function validateAndOpenTrimEditor(uri: string) {
    const validation = await isValidFile(uri);

    if (!validation.isValid || validation.fileType !== 'video' || validation.duration <= 0) {
      setError('Unable to read video duration. Try another video.');
      return;
    }

    if (validation.duration < MIN_UPLOAD_DURATION_MS) {
      setError(`Choose or trim a video to at least ${MIN_UPLOAD_DURATION_SECONDS} seconds.`);
      return;
    }

    openTrimEditor(uri);
  }

async function handlePickVideo() {
    if (isRecording || recordedUri) {
      return;
    }

    setError(null);

    try {
      const ImagePicker = await import('expo-image-picker');
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        setError('Photo library access is required to upload a video.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        allowsMultipleSelection: false,
        mediaTypes: ['videos'],
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
        quality: 1
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset?.uri || asset.type !== 'video') {
        setError('Choose a video from your library.');
        return;
      }

      await validateAndOpenTrimEditor(asset.uri);
    } catch (pickError) {
      pendingTrimRef.current = false;
      console.log('[video-upload-debug] picker error:', pickError);
      const message = pickError instanceof Error ? pickError.message : '';
      setError(
        message.includes('ExponentImagePicker')
          ? 'Video upload from Photos is not available in this build. Reinstall the latest Cato build and try again.'
          : CLOUD_BACKED_VIDEO_ERROR
      );
    }
  }

  async function handlePickVideoFromFiles() {
    if (isRecording || recordedUri) {
      return;
    }

    setError(null);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: 'video/*'
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset?.uri) {
        setError('Choose a video file.');
        return;
      }

      await validateAndOpenTrimEditor(asset.uri);
    } catch (pickError) {
      pendingTrimRef.current = false;
      console.log('[video-upload-debug] files picker error:', pickError);
      setError('Could not upload this video. Choose a local video file that is saved on this device.');
    }
  }

  async function handleUpload() {
    if (!recordedUri) {
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      await onRecorded({
        durationSeconds: recordedDurationSeconds,
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
      <View style={[styles.permissionState, fullScreen ? styles.fullScreenContainer : null]}>
        <EmptyState
          actionLabel="Continue"
          body="We are checking camera and microphone access for recording."
          minHeight={fullScreen ? 0 : 420}
          onAction={async () => {
            await requestCameraPermission();
            await requestMicrophonePermission();
          }}
          onBack={onClose}
          title="Checking permissions"
        />
      </View>
    );
  }

  if (!cameraPermission.granted || !microphonePermission.granted) {
    return (
      <View style={[styles.permissionState, fullScreen ? styles.fullScreenContainer : null]}>
        <EmptyState
          actionLabel="Allow camera and mic"
          body="Camera and microphone access are required to record your take."
          minHeight={fullScreen ? 0 : 420}
          onAction={async () => {
            await requestCameraPermission();
            await requestMicrophonePermission();
          }}
          onBack={onClose}
          title="Recording needs access"
        />
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
        {isTrimming ? (
          <View style={styles.trimmingBackdrop}>
            <View style={styles.trimmingPanel}>
              <Text style={styles.trimmingTitle}>Preparing clip...</Text>
              <Text style={styles.trimmingText}>Your trimmed video will appear here.</Text>
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
          ) : !isRecording ? (
            <>
              <Pressable onPress={handlePickVideo} style={[styles.secondaryButton, styles.compactButton]}>
                <Text style={styles.secondaryButtonText}>Upload</Text>
              </Pressable>
              <Pressable onPress={handlePickVideoFromFiles} style={[styles.secondaryButton, styles.compactButton]}>
                <Text style={styles.secondaryButtonText}>Files</Text>
              </Pressable>
              {idleSecondaryAction ? (
                <Pressable onPress={idleSecondaryAction.onPress} style={[styles.secondaryButton, styles.compactButton]}>
                  <Text style={styles.secondaryButtonText}>{idleSecondaryAction.label}</Text>
                </Pressable>
              ) : null}
            </>
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
  permissionState: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64
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
  trimmingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 17, 17, 0.58)',
    padding: 24
  },
  trimmingPanel: {
    width: '100%',
    maxWidth: 300,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: 18
  },
  trimmingTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center'
  },
  trimmingText: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center'
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
    flexWrap: 'wrap',
    gap: 12
  },
  overlayActions: {
    position: 'absolute',
    right: 18,
    bottom: 28,
    left: 18
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
