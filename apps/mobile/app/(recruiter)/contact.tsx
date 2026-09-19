import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { RecruiterCandidate } from '@cato/shared';
import {
  contactRecruiterCandidate,
  getRecruiterCandidate,
  sendRecruiterInterestRequest
} from '../../src/api/recruiter';
import { Button } from '../../src/components/Button';
import { Field } from '../../src/components/Field';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Screen } from '../../src/components/Screen';
import { StatusBanner } from '../../src/components/StatusBanner';
import { useKeyboardAwareScroll } from '../../src/forms/useKeyboardAwareScroll';
import { useSession } from '../../src/hooks/useSession';
import { colors, radii, spacing, typography } from '../../src/theme';

type ContactMode = 'request' | 'message';

export default function RecruiterContactScreen() {
  const { session } = useSession();
  const keyboardScroll = useKeyboardAwareScroll();
  const { candidateId, mode } = useLocalSearchParams<{ candidateId?: string; mode?: string }>();
  const [candidate, setCandidate] = useState<RecruiterCandidate | null>(null);
  const [activeMode, setActiveMode] = useState<ContactMode>(mode === 'message' ? 'message' : 'request');
  const [message, setMessage] = useState(
    mode === 'message'
      ? 'Hi, I would love to connect about an opportunity.'
      : 'Your profile stood out because '
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!session?.access_token || !candidateId) {
      setIsLoading(false);
      return;
    }

    getRecruiterCandidate(session.access_token, candidateId)
      .then((response) => {
        setCandidate(response.candidate);
        if (mode === 'message' && response.candidate.interestRequestStatus !== 'accepted') {
          setActiveMode('request');
        }
      })
      .catch((candidateError) => {
        setError(candidateError instanceof Error ? candidateError.message : 'Unable to load candidate');
      })
      .finally(() => setIsLoading(false));
  }, [candidateId, mode, session?.access_token]);

  if (isLoading) {
    return <LoadingScreen banner="Loading contact flow" />;
  }

  const isMessageAllowed = candidate?.interestRequestStatus === 'accepted';
  const isResendMode = mode === 'resend' || candidate?.interestRequestStatus === 'declined' || candidate?.interestRequestStatus === 'expired';
  const isRequestPending = candidate?.interestRequestStatus === 'sent' || candidate?.interestRequestStatus === 'viewed';
  const canRetry =
    isResendMode &&
    (!candidate?.interestRequestResendAvailableAt || new Date(candidate.interestRequestResendAvailableAt).getTime() <= Date.now());
  const canSendRequest = !isRequestPending && (!isResendMode || canRetry);
  const isMessageMode = activeMode === 'message';

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
        router.replace('/(recruiter)/messages');
        return;
      }

      await sendRecruiterInterestRequest(session.access_token, candidateId, {
        reason: message.trim(),
        ...(isResendMode ? { resend: true } : {})
      });
      router.replace('/(recruiter)/dashboard');
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : isMessageMode ? 'Unable to send message' : 'Unable to send interest request');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Screen onScroll={keyboardScroll.handleScroll} scroll scrollRef={keyboardScroll.scrollRef}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.linkText}>Back</Text>
      </Pressable>

      {candidate ? (
        <View style={styles.candidateCard}>
          {candidate.profileImageUrl ? (
            <Image source={{ uri: candidate.profileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>{(candidate.name ?? 'C').charAt(0)}</Text>
            </View>
          )}
          <View style={styles.candidateCopy}>
            <Text style={styles.name}>{candidate.name ?? 'Candidate'}</Text>
            <Text style={styles.meta}>
              {[candidate.major, candidate.universityName].filter(Boolean).join(' · ') || 'Profile details pending'}
            </Text>
            <Text style={styles.meta}>Match {candidate.matchScore}% · Strength {candidate.profileStrength}%</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.tabRow}>
        <Pressable onPress={() => setActiveMode('request')} style={[styles.tab, activeMode === 'request' ? styles.tabActive : null]}>
          <Text style={[styles.tabText, activeMode === 'request' ? styles.tabTextActive : null]}>Request Info</Text>
        </Pressable>
        <Pressable
          disabled={!isMessageAllowed}
          onPress={() => {
            setActiveMode('message');
            setMessage('Hi, I would love to connect about an opportunity.');
          }}
          style={[styles.tab, activeMode === 'message' ? styles.tabActive : null, !isMessageAllowed ? styles.tabDisabled : null]}
        >
          <Text style={[styles.tabText, activeMode === 'message' ? styles.tabTextActive : null]}>Message</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>{isMessageMode ? 'Message Candidate' : isResendMode ? 'Request Again' : 'Send Interest Request'}</Text>
      <Text style={styles.body}>
        {isMessageMode
          ? 'This applicant accepted your interest request. Your message will appear in Messages.'
          : isRequestPending
          ? 'Your interest request is already pending. Messaging opens only after the applicant accepts.'
          : isResendMode
          ? 'Send a fresh request only when there is a clear new reason to connect.'
          : 'This sends a request first. Messaging opens only if the applicant accepts.'}
      </Text>

      {!isMessageAllowed && activeMode === 'message' ? (
        <StatusBanner message="Messaging opens after the applicant accepts your interest request." />
      ) : null}

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
      <Button
        disabled={isSending || !message.trim() || (!isMessageMode && !canSendRequest)}
        onPress={handleSend}
        style={styles.primaryAction}
      >
        {isSending
          ? 'Sending...'
          : isMessageMode
          ? 'Send Message'
          : isRequestPending
          ? 'Request Pending'
          : isResendMode
          ? 'Send New Request'
          : 'Send Interest Request'}
      </Button>
      {error ? <StatusBanner message={error} tone="danger" /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  linkText: {
    color: colors.purple,
    ...typography.meta
  },
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    marginTop: spacing.lg,
    padding: spacing.md
  },
  avatar: {
    width: 58,
    height: 68,
    borderRadius: radii.sm,
    backgroundColor: colors.border
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 58,
    height: 68,
    borderRadius: radii.sm,
    backgroundColor: colors.primary
  },
  avatarFallbackText: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '900'
  },
  candidateCopy: {
    flex: 1
  },
  name: {
    color: colors.text,
    ...typography.label
  },
  meta: {
    marginTop: 3,
    color: colors.muted,
    ...typography.meta
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary
  },
  tabDisabled: {
    opacity: 0.45
  },
  tabText: {
    color: colors.text,
    ...typography.meta
  },
  tabTextActive: {
    color: colors.primaryText
  },
  title: {
    marginTop: spacing.xl,
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
