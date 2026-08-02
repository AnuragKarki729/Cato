import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { LoadingOverlay } from './LoadingOverlay';
import { StatusBanner } from './StatusBanner';
import { downloadAndShareFile } from '../media/downloadFile';
import { colors, spacing, typography } from '../theme';

type FullscreenResumeDialogProps = {
  downloadUrl?: string;
  fileName?: string;
  onClose: () => void;
  url?: string;
  visible: boolean;
};

export function FullscreenResumeDialog({ downloadUrl, fileName, onClose, url, visible }: FullscreenResumeDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const resolvedDownloadUrl = downloadUrl ?? url;

  async function handleDownload() {
    if (!resolvedDownloadUrl) {
      setError('No resume available.');
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      await downloadAndShareFile(resolvedDownloadUrl, fileName ?? 'resume');
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Unable to download resume');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Modal animationType="slide" presentationStyle="fullScreen" visible={visible} onRequestClose={onClose}>
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safeArea}>
        <LoadingOverlay message="Saving resume..." visible={isDownloading} />
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Close</Text>
          </Pressable>
          <Text numberOfLines={1} style={styles.title}>
            {fileName ?? 'Resume'}
          </Text>
          <Pressable disabled={!resolvedDownloadUrl || isDownloading} onPress={handleDownload} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Download</Text>
          </Pressable>
        </View>
        <View style={styles.viewer}>
          {url ? (
            <WebView
              onError={() => setError('Unable to load resume preview. You can still download the file.')}
              originWhitelist={['*']}
              source={{ uri: url }}
              startInLoadingState
              style={styles.webView}
            />
          ) : (
            <Text style={styles.body}>No resume available.</Text>
          )}
        </View>
        {error ? (
          <View style={styles.errorWrap}>
            <StatusBanner message={error} tone="danger" />
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg
  },
  headerButton: {
    minWidth: 78,
    paddingVertical: spacing.sm
  },
  headerButtonText: {
    color: colors.purple,
    ...typography.label
  },
  title: {
    flex: 1,
    color: colors.text,
    ...typography.label,
    textAlign: 'center'
  },
  viewer: {
    flex: 1,
    backgroundColor: colors.surface
  },
  webView: {
    flex: 1,
    backgroundColor: colors.surface
  },
  body: {
    margin: spacing.xxl,
    color: colors.muted,
    ...typography.body,
    textAlign: 'center'
  },
  errorWrap: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    left: spacing.lg
  }
});
