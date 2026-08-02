import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import type { Resume } from '@cato/shared';
import { acceptPrivacyConsent } from '../../src/api/privacy';
import { getResume, skipResume, uploadResume } from '../../src/api/resume';
import { Button } from '../../src/components/Button';
import { LoadingOverlay } from '../../src/components/LoadingOverlay';
import { Screen } from '../../src/components/Screen';
import { StatusBanner } from '../../src/components/StatusBanner';
import { TextAction } from '../../src/components/TextAction';
import { useSession } from '../../src/hooks/useSession';
import { getResumeFileType, readUriAsDataUri } from '../../src/media/fileData';
import { colors, spacing, typography } from '../../src/theme';

export default function ResumeScreen() {
  const { session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [resume, setResume] = useState<Resume | null>(null);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    getResume(session.access_token).then((result) => {
      setResume(result.resume);
    });
  }, [session]);

  async function handleSkipResume() {
    if (!session?.access_token) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await skipResume(session.access_token);
      setResume(result.resume);
      router.replace('/(onboarding)/signal-prompt');
    } catch (skipError) {
      setError(skipError instanceof Error ? skipError.message : 'Unable to skip resume');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUploadResume() {
    if (!session?.access_token) {
      return;
    }

    if (!hasConsent) {
      setError('Resume upload requires consent.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await acceptPrivacyConsent(session.access_token, {
        resume: true,
        privacyPolicy: true
      });
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        multiple: false,
        copyToCacheDirectory: true
      });

      if (picked.canceled) {
        return;
      }

      const asset = picked.assets[0];
      const mimeType = asset.mimeType ?? 'application/octet-stream';
      const dataUri = await readUriAsDataUri(asset.uri, mimeType);
      const result = await uploadResume(session.access_token, {
        dataUri,
        originalFileName: asset.name,
        fileType: getResumeFileType(asset.name, asset.mimeType),
        fileSizeBytes: asset.size ?? 1
      });

      setResume(result.resume);
      router.replace('/(onboarding)/signal-prompt');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload resume');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen centered>
      <LoadingOverlay message="Saving your resume..." visible={isSubmitting} />
      <Text style={styles.title}>Resume</Text>
      <Text style={styles.body}>Upload a PDF, DOC, or DOCX resume, or continue without one.</Text>
      <View style={styles.actions}>
        <Pressable onPress={() => setHasConsent((current) => !current)} style={styles.consentRow}>
          <View style={[styles.checkbox, hasConsent ? styles.checkedBox : null]} />
          <Text style={styles.consentText}>I consent to Cato storing my resume for this POC.</Text>
        </Pressable>
        <TextAction onPress={() => router.push('/privacy')}>Privacy Policy</TextAction>
        <Button disabled={isSubmitting || !hasConsent} onPress={handleUploadResume}>
          {isSubmitting ? 'Saving...' : 'Upload resume'}
        </Button>
        <Button disabled={isSubmitting} onPress={handleSkipResume} variant="secondary">
          Continue with no resume
        </Button>
      </View>
      {resume ? <StatusBanner message={`Resume status: ${resume.softSkillGenerationStatus}`} /> : null}
      {error ? <StatusBanner message={error} tone="danger" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    ...typography.screenTitle
  },
  body: {
    marginTop: spacing.md,
    color: colors.muted,
    ...typography.body
  },
  actions: {
    marginTop: spacing.xxl,
    gap: spacing.md
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
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
    ...typography.meta
  }
});
