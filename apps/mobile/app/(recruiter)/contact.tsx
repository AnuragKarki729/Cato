import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { contactRecruiterCandidate, sendRecruiterInterestRequest } from '../../src/api/recruiter';
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
  const { candidateId, mode } = useLocalSearchParams<{ candidateId?: string; mode?: string }>();
  const isMessageMode = mode === 'message';
  const isResendMode = mode === 'resend';
  const [message, setMessage] = useState(
    isMessageMode
      ? 'Hi, I would love to connect about an opportunity.'
      : 'Your profile stood out because '
  );
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
      if (isMessageMode) {
        await contactRecruiterCandidate(session.access_token, candidateId, { body: message.trim() });
      } else {
        await sendRecruiterInterestRequest(session.access_token, candidateId, {
          reason: message.trim(),
          ...(isResendMode ? { resend: true } : {})
        });
      }
      router.replace(isMessageMode ? '/(recruiter)/messages' : '/(recruiter)/dashboard');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : isMessageMode ? 'Unable to send message' : 'Unable to send interest request');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Screen onScroll={keyboardScroll.handleScroll} scroll scrollRef={keyboardScroll.scrollRef}>
      <Text style={styles.title}>{isMessageMode ? 'Message Candidate' : isResendMode ? 'Request Again' : 'Send Interest Request'}</Text>
      <Text style={styles.body}>
        {isMessageMode
          ? 'This applicant accepted your interest request. Your message will appear in Messages.'
          : isResendMode
          ? 'Send a fresh request only when there is a clear new reason to connect.'
          : 'This sends a request first. Messaging opens only if the applicant accepts.'}
      </Text>
      <View onLayout={keyboardScroll.registerField('recruiter-message')}>
        <Field
          label={isMessageMode ? 'Message' : 'Why are you interested?'}
          multiline
          onChangeText={setMessage}
          onFocus={() => keyboardScroll.focusField('recruiter-message')}
          style={styles.message}
          textAlignVertical="top"
          value={message}
        />
      </View>
      <Button disabled={isSending || !message.trim()} onPress={handleSend} style={styles.primaryAction}>
        {isSending ? 'Sending...' : isMessageMode ? 'Send Message' : isResendMode ? 'Send New Request' : 'Send Interest Request'}
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
  body: {
    marginTop: spacing.sm,
    color: colors.muted,
    ...typography.body
  },
  message: {
    minHeight: 220,
    paddingTop: spacing.md
  },
  primaryAction: {
    marginTop: spacing.xxl
  }
});
