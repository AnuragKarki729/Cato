import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RecruiterMessagesResponse } from '@cato/shared';
import { getApiBaseUrl } from '../../src/api/client';
import { getRecruiterMessages } from '../../src/api/recruiter';
import { RecruiterContent } from '../../src/recruiter/RecruiterContent';
import { useSession } from '../../src/hooks/useSession';
import { colors, radii } from '../../src/theme';

export default function RecruiterMessagesScreen() {
  const { session } = useSession();
  const [messages, setMessages] = useState<RecruiterMessagesResponse['messages']>([]);
  const [error, setError] = useState<string | null>(null);

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
      });

    const wsBaseUrl = getApiBaseUrl().replace(/^http/, 'ws');
    const socket = new WebSocket(`${wsBaseUrl}/recruiter/messages/ws?token=${encodeURIComponent(session.access_token)}`);

    socket.onmessage = () => {
      void loadMessages(session.access_token);
    };

    socket.onerror = () => {
      setError('Realtime messages disconnected.');
    };

    return () => {
      socket.close();
    };
  }, [session]);

  return (
    <RecruiterContent>
      <Text style={styles.title}>Messages</Text>
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
        {messages.length === 0 ? <Text style={styles.body}>No messages sent yet.</Text> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </RecruiterContent>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  list: { gap: 12, marginTop: 18 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface, padding: 10 },
  avatar: { alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary },
  avatarText: { color: colors.accent, fontSize: 18, fontWeight: '900' },
  messageBody: { flex: 1 },
  name: { color: colors.text, fontSize: 15, fontWeight: '900' },
  body: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  time: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  error: { marginTop: 14, color: colors.danger, fontSize: 14, lineHeight: 20 }
});
