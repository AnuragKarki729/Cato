import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RecruiterMessagesResponse } from '@cato/shared';
import { router } from 'expo-router';
import { getApiBaseUrl } from '../../src/api/client';
import { getRecruiterMessages } from '../../src/api/recruiter';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { StatusBanner } from '../../src/components/StatusBanner';
import { RecruiterContent } from '../../src/recruiter/RecruiterContent';
import { RecruiterEmptyState } from '../../src/recruiter/RecruiterEmptyState';
import { useSession } from '../../src/hooks/useSession';
import { colors, radii, spacing, typography } from '../../src/theme';

export default function RecruiterMessagesScreen() {
  const { session } = useSession();
  const [messages, setMessages] = useState<RecruiterMessagesResponse['messages']>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeState, setRealtimeState] = useState<'connecting' | 'live' | 'disconnected'>('connecting');

  async function loadMessages(accessToken: string) {
    const response = await getRecruiterMessages(accessToken);
    setMessages(response.messages);
  }

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    loadMessages(session.access_token)
      .catch((messageError) => {
        setError(messageError instanceof Error ? messageError.message : 'Unable to load messages');
      })
      .finally(() => {
        setIsLoading(false);
    });

    const wsBaseUrl = getApiBaseUrl().replace(/^http/, 'ws');
    const socket = new WebSocket(`${wsBaseUrl}/recruiter/messages/ws?token=${encodeURIComponent(session.access_token)}`);
    let isUnmounting = false;

    socket.onopen = () => {
      setRealtimeState('live');
    };

    socket.onmessage = () => {
      void loadMessages(session.access_token);
    };

    socket.onerror = () => {
      if (!isUnmounting) {
        setRealtimeState('disconnected');
      }
    };

    socket.onclose = () => {
      if (!isUnmounting) {
        setRealtimeState('disconnected');
      }
    };

    return () => {
      isUnmounting = true;
      socket.close();
    };
  }, [session]);

  if (isLoading) {
    return <LoadingScreen banner="Loading messages" />;
  }

  if (error || messages.length === 0) {
    return (
      <RecruiterContent>
        <RecruiterEmptyState
          actionLabel={error ? 'Back to dashboard' : 'Find candidates'}
          body={error ?? 'Messages appear after an applicant accepts your interest request and you send the first message.'}
          onAction={() => router.replace(error ? '/(recruiter)/dashboard' : '/(recruiter)/search')}
          title={error ? 'Unable to load messages' : 'No messages yet'}
        />
      </RecruiterContent>
    );
  }

  return (
    <RecruiterContent>
      <Text style={styles.title}>Messages</Text>
      <Text style={styles.subtitle}>Accepted interest requests become conversations here.</Text>
      {realtimeState === 'disconnected' ? (
        <StatusBanner message="Realtime updates are disconnected. Pull back later or reopen Messages." tone="danger" />
      ) : (
        <StatusBanner message={realtimeState === 'live' ? 'Realtime messages are live.' : 'Connecting realtime messages...'} />
      )}
      <View style={styles.list}>
        {messages.map((message) => (
          <View key={message.id} style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(message.candidateName ?? 'C').charAt(0)}</Text>
            </View>
            <View style={styles.messageBody}>
              <Text style={styles.name}>{message.candidateName ?? 'Candidate'}</Text>
              <Text style={styles.body}>{message.body}</Text>
            </View>
            <Text style={styles.time}>{new Date(message.createdAt).toLocaleDateString()}</Text>
          </View>
        ))}
      </View>
    </RecruiterContent>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, ...typography.screenTitle },
  subtitle: { marginTop: spacing.sm, color: colors.muted, ...typography.body },
  list: { gap: spacing.md, marginTop: spacing.lg },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, padding: spacing.md },
  avatar: { alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary },
  avatarText: { color: colors.accent, fontSize: 18, fontWeight: '900' },
  messageBody: { flex: 1 },
  name: { color: colors.text, ...typography.label },
  body: { color: colors.muted, ...typography.meta },
  time: { color: colors.muted, fontSize: 11, fontWeight: '700' }
});
