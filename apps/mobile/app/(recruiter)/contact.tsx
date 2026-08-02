import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { contactRecruiterCandidate } from '../../src/api/recruiter';
import { Button } from '../../src/components/Button';
import { Field } from '../../src/components/Field';
import { Screen } from '../../src/components/Screen';
import { StatusBanner } from '../../src/components/StatusBanner';
import { useKeyboardAwareScroll } from '../../src/forms/useKeyboardAwareScroll';
import { useSession } from '../../src/hooks/useSession';
import { colors, spacing, typography } from '../../src/theme';

export default function RecruiterContactScreen() {
  const { session } = useSession();
  const keyboardScroll = useKeyboardAwareScroll();
  const { candidateId } = useLocalSearchParams<{ candidateId?: string }>();
  const [message, setMessage] = useState('Hi, I came across your profile and would love to connect about an opportunity.');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function handleSend() {
    if (!session?.access_token || !candidateId) {
      setError('Candidate is missing.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      await contactRecruiterCandidate(session.access_token, candidateId, { body: message.trim() });
      router.replace('/(recruiter)/messages');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send message');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Screen scroll scrollRef={keyboardScroll.scrollRef}>
      <Text style={styles.title}>Contact Candidate</Text>
      <View onLayout={keyboardScroll.registerField('recruiter-message')}>
        <Field
          label="Message"
          multiline
          onChangeText={setMessage}
          onFocus={() => keyboardScroll.focusField('recruiter-message')}
          style={styles.message}
          textAlignVertical="top"
          value={message}
        />
      </View>
      <Button disabled={isSending || !message.trim()} onPress={handleSend} style={styles.primaryAction}>
        {isSending ? 'Sending...' : 'Send Message'}
      </Button>
      {error ? <StatusBanner message={error} tone="danger" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    ...typography.screenTitle
  },
  message: {
    minHeight: 220,
    paddingTop: spacing.md
  },
  primaryAction: {
    marginTop: spacing.xxl
  }
});
