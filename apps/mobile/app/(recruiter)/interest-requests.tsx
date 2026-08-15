import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { RecruiterInterestRequest } from '@cato/shared';
import { getRecruiterInterestRequests } from '../../src/api/recruiter';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { RecruiterContent } from '../../src/recruiter/RecruiterContent';
import { RecruiterEmptyState } from '../../src/recruiter/RecruiterEmptyState';
import { useSession } from '../../src/hooks/useSession';
import { colors, radii, spacing, typography } from '../../src/theme';

export default function RecruiterInterestRequestsScreen() {
  const { session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<RecruiterInterestRequest[]>([]);

  useEffect(() => {
    if (!session?.access_token) {
      return;
    }

    getRecruiterInterestRequests(session.access_token)
      .then((response) => setRequests(response.requests))
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : 'Unable to load interest requests');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [session]);

  if (isLoading) {
    return <LoadingScreen banner="Loading interest requests" />;
  }

  if (error || requests.length === 0) {
    return (
      <RecruiterContent>
        <RecruiterEmptyState
          actionLabel="Back to dashboard"
          body={error ?? 'Interest requests will appear here after you contact candidates.'}
          onAction={() => router.replace('/(recruiter)/dashboard')}
          title={error ? 'Unable to load requests' : 'No interest requests yet'}
        />
      </RecruiterContent>
    );
  }

  return (
    <RecruiterContent>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.text} name="chevron-back" size={18} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Interest Requests</Text>
          <Text style={styles.body}>{requests.length} total requests sent</Text>
        </View>
      </View>

      <View style={styles.list}>
        {requests.map((request) => (
          <Pressable
            key={request.id}
            onPress={() => router.push({ pathname: '/(recruiter)/feed', params: { candidateId: request.candidateId } })}
            style={styles.card}
          >
            <View style={styles.cardCopy}>
              <Text style={styles.name}>{request.candidateName ?? 'Candidate'}</Text>
              <Text style={styles.meta}>{getRequestMeta(request)}</Text>
              <Text style={styles.meta}>Sent {request.sentAt.slice(0, 10)}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{request.status}</Text>
            </View>
          </Pressable>
        ))}
      </View>
    </RecruiterContent>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backButton: { alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: radii.sm, backgroundColor: colors.surface },
  headerCopy: { flex: 1 },
  title: { color: colors.text, ...typography.screenTitle },
  body: { color: colors.muted, ...typography.body },
  list: { gap: spacing.sm, marginTop: spacing.xl },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.md
  },
  cardCopy: { flex: 1 },
  name: { color: colors.text, ...typography.label },
  meta: { marginTop: 3, color: colors.muted, ...typography.meta },
  statusPill: { borderRadius: 999, backgroundColor: colors.surfaceMuted, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  statusPillText: { color: colors.text, ...typography.meta }
});

function getRequestMeta(request: RecruiterInterestRequest) {
  if (request.status === 'accepted') {
    return `Accepted${request.respondedAt ? ` on ${request.respondedAt.slice(0, 10)}` : ''}`;
  }

  if (request.status === 'declined') {
    return request.resendAvailableAt
      ? `Declined. Retry after ${request.resendAvailableAt.slice(0, 10)}`
      : 'Declined';
  }

  if (request.status === 'expired') {
    return 'Expired. New request required.';
  }

  if (request.expiresAt) {
    return `Pending. Expires ${request.expiresAt.slice(0, 10)}`;
  }

  return 'Pending';
}
