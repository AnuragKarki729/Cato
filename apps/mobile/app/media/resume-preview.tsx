import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Button } from '../../src/components/Button';
import { LoadingOverlay } from '../../src/components/LoadingOverlay';
import { Screen } from '../../src/components/Screen';
import { StatusBanner } from '../../src/components/StatusBanner';
import { downloadAndShareFile } from '../../src/media/downloadFile';
import { colors, spacing, typography } from '../../src/theme';

export default function ResumePreviewScreen() {
  const { action, fileName, url } = useLocalSearchParams<{ action?: string; fileName?: string; url?: string }>();
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (action === 'download') {
      handleDownload();
    }
  }, [action, url]);

  async function handlePreview() {
    if (!url) {
      setError('No resume available.');
      return;
    }

    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET
    });
  }

  async function handleDownload() {
    if (!url) {
      setError('No resume available.');
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      await downloadAndShareFile(url, fileName ?? 'resume');
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Unable to download resume');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Screen centered>
      <LoadingOverlay message="Saving resume..." visible={isDownloading} />
      <Text style={styles.title}>{fileName ?? 'Resume'}</Text>
      <Text style={styles.body}>Preview the resume in-app or save it to files.</Text>
      <Button disabled={!url} fullWidth onPress={handlePreview} style={styles.primaryAction}>
        Preview resume
      </Button>
      <Button disabled={!url} fullWidth onPress={handleDownload} style={styles.secondaryAction} variant="secondary">
        Download resume
      </Button>
      {error ? <StatusBanner message={error} tone="danger" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    ...typography.screenTitle,
    textAlign: 'center'
  },
  body: {
    marginTop: spacing.md,
    color: colors.muted,
    ...typography.body,
    textAlign: 'center'
  },
  primaryAction: {
    marginTop: spacing.xxl,
  },
  secondaryAction: {
    marginTop: spacing.md,
  }
});
