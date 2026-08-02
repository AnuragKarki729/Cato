import { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { markDeeperSignalSeen } from '../../src/api/signal';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { StatusBanner } from '../../src/components/StatusBanner';
import { useSession } from '../../src/hooks/useSession';
import { useKeyboardAwareScroll } from '../../src/forms/useKeyboardAwareScroll';
import { waitForQueuedVideoUpload } from '../../src/media/videoUploadQueue';
import { colors, radii, spacing, typography } from '../../src/theme';

export default function DeeperSignalScreen() {
  const { session } = useSession();
  const keyboardScroll = useKeyboardAwareScroll();
  const [isSeen, setIsSeen] = useState(false);
  const [thoughts, setThoughts] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSeen(skipped = false) {
    if (!session?.access_token) {
      return;
    }

    setError(null);

    try {
      await waitForQueuedVideoUpload('10-second');
      await markDeeperSignalSeen(session.access_token, {
        elaboration: skipped ? undefined : thoughts.trim(),
        skipped
      });
      setIsSeen(true);
      router.replace('/(onboarding)/deeper-video');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save your response');
    }
  }

  return (
    <Screen scroll scrollRef={keyboardScroll.scrollRef}>
      <Text style={styles.title}>Elaborate on your 10-second take.</Text>
      <Text style={styles.body}>
        Expand on your answer to share more context, meaning, or the story behind your take.
      </Text>
      <TextInput
        multiline
        onChangeText={setThoughts}
        onFocus={() => keyboardScroll.focusField('deeper-signal-thoughts')}
        onLayout={keyboardScroll.registerField('deeper-signal-thoughts')}
        placeholder="Share your thoughts..."
        placeholderTextColor={colors.muted}
        style={styles.textArea}
        value={thoughts}
      />
      <Text style={styles.counter}>{thoughts.length}/500</Text>
      <Button onPress={() => handleSeen(false)} style={styles.primaryAction}>
        {isSeen ? 'Ready for response' : 'Record My Response'}
      </Button>
      <Button onPress={() => handleSeen(true)} style={styles.secondaryAction} variant="secondary">
        Skip for now
      </Button>
      {error ? <StatusBanner message={error} tone="danger" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: spacing.xxl,
    color: colors.text,
    ...typography.screenTitle
  },
  body: {
    marginTop: spacing.md,
    color: colors.muted,
    ...typography.body
  },
  textArea: {
    minHeight: 210,
    marginTop: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    color: colors.text,
    ...typography.body,
    textAlignVertical: 'top'
  },
  counter: {
    marginTop: spacing.sm,
    color: colors.muted,
    ...typography.meta,
    textAlign: 'right'
  },
  primaryAction: {
    marginTop: spacing.xxl,
  },
  secondaryAction: {
    marginTop: spacing.md,
  }
});
