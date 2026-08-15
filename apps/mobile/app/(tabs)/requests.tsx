import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ApplicantInterestRequest } from '@cato/shared';
import { markNotificationBucketSeen } from '../../src/api/notifications';
import { getApplicantInterestRequests, respondToApplicantInterestRequest } from '../../src/api/profile';
import { EmptyState } from '../../src/components/EmptyState';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { Screen } from '../../src/components/Screen';
import { StatusBanner } from '../../src/components/StatusBanner';
import { useSession } from '../../src/hooks/useSession';
import { addInAppEventListener } from '../../src/notifications/inAppEvents';
import { getNotificationSeenKey, markNotificationsSeen } from '../../src/notifications/notificationSeenStore';
import { colors, controls, radii, spacing, typography } from '../../src/theme';

export default function RequestsScreen() {
  const { session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRespondingId, setIsRespondingId] = useState<string | null>(null);
  const [requests, setRequests] = useState<ApplicantInterestRequest[]>([]);

  async function loadRequests() {
    if (!session?.access_token) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await getApplicantInterestRequests(session.access_token);
      setRequests(response.requests);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load requests');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, [session]);

  useEffect(() => {
    if (session?.user.id) {
      void markNotificationsSeen(getNotificationSeenKey('applicant', session.user.id, 'requests'));
      if (session.access_token) {
        void markNotificationBucketSeen(session.access_token, { bucket: 'requests' });
      }
    }
  }, [session?.access_token, session?.user.id]);

  useEffect(() => {
    if (!session?.access_token) {
      return undefined;
    }

    const userId = session.user.id;
    return addInAppEventListener(({ eventName }) => {
      if (eventName === 'interest_request_sent') {
        void loadRequests();
        void markNotificationsSeen(getNotificationSeenKey('applicant', userId, 'requests'));
        void markNotificationBucketSeen(session.access_token, { bucket: 'requests' });
      }
    });
  }, [session?.access_token, session?.user.id]);

  async function respond(requestId: string, action: 'accept' | 'decline') {
    if (!session?.access_token) {
      return;
    }

    setError(null);
    setIsRespondingId(requestId);

    try {
      const response = await respondToApplicantInterestRequest(session.access_token, requestId, { action });
      setRequests((current) =>
        current.map((request) => (request.id === response.request.id ? response.request : request))
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to respond to request');
    } finally {
      setIsRespondingId(null);
    }
  }

  function confirmResponse(request: ApplicantInterestRequest, action: 'accept' | 'decline') {
    const companyName = request.companyName ?? request.recruiterName ?? 'this recruiter';

    if (action === 'accept') {
      Alert.alert(
        'Accept request?',
        `Accepting lets ${companyName} message you in Cato.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Accept', onPress: () => respond(request.id, 'accept') }
        ]
      );
      return;
    }

    Alert.alert(
      'Decline request?',
      `Declining keeps messaging closed for ${companyName}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Decline', onPress: () => respond(request.id, 'decline'), style: 'destructive' }
      ]
    );
  }

  if (isLoading && requests.length === 0) {
    return <LoadingScreen banner="Loading requests" />;
  }

  return (
    <Screen scroll scrollBottomPadding={spacing.xxxl}>
      <Text style={styles.title}>Requests</Text>
      <Text style={styles.body}>Recruiters can message you only after you accept their interest request.</Text>
      {error ? <StatusBanner message={error} tone="danger" /> : null}
      {requests.length === 0 ? (
        <EmptyState
          actionLabel="Refresh"
          body="Accepted requests will unlock recruiter messaging."
          minHeight={360}
          onAction={loadRequests}
          title="No interest requests yet"
        />
      ) : (
        <View style={styles.list}>
          {requests.map((request) => {
            const canRespond = request.status === 'sent' || request.status === 'viewed';
            const statusInfo = getRequestStatusInfo(request);

            return (
              <View key={request.id} style={[styles.card, request.status === 'accepted' ? styles.acceptedCard : null]}>
                <View style={styles.headerRow}>
                  <View style={styles.companyMark}>
                    <Text style={styles.companyMarkText}>{(request.companyName ?? request.recruiterName ?? 'C').charAt(0)}</Text>
                  </View>
                  <View style={styles.headerCopy}>
                    <Text style={styles.companyName}>{request.companyName ?? 'Recruiter'}</Text>
                    {request.recruiterName ? <Text style={styles.meta}>{request.recruiterName}</Text> : null}
                  </View>
                  <View style={[styles.statusPill, statusInfo.tone === 'success' ? styles.statusSuccess : null]}>
                    <Text style={[styles.status, statusInfo.tone === 'success' ? styles.statusSuccessText : null]}>
                      {statusInfo.label}
                    </Text>
                  </View>
                </View>
                {request.roleCategory ? <Text style={styles.role}>{request.roleCategory}</Text> : null}
                <Text style={styles.reason}>{request.reason}</Text>
                <Text style={styles.stateCopy}>{statusInfo.copy}</Text>
                {canRespond ? (
                  <View style={styles.actions}>
                    <Pressable
                      disabled={isRespondingId === request.id}
                      onPress={() => confirmResponse(request, 'decline')}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>Decline</Text>
                    </Pressable>
                    <Pressable
                      disabled={isRespondingId === request.id}
                      onPress={() => confirmResponse(request, 'accept')}
                      style={styles.button}
                    >
                      <Text style={styles.buttonText}>{isRespondingId === request.id ? 'Saving...' : 'Accept'}</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
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
  list: {
    gap: spacing.md,
    marginTop: spacing.xl
  },
  card: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.lg
  },
  acceptedCard: {
    borderColor: colors.success
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md
  },
  companyMark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
    borderRadius: radii.sm,
    backgroundColor: colors.primary
  },
  companyMarkText: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '900'
  },
  headerCopy: {
    flex: 1
  },
  companyName: {
    color: colors.text,
    ...typography.sectionTitle
  },
  meta: {
    color: colors.muted,
    ...typography.meta
  },
  status: {
    color: colors.primary,
    ...typography.meta
  },
  statusPill: {
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  statusSuccess: {
    backgroundColor: colors.success
  },
  statusSuccessText: {
    color: colors.primaryText
  },
  role: {
    color: colors.text,
    ...typography.label
  },
  reason: {
    color: colors.muted,
    ...typography.body
  },
  stateCopy: {
    color: colors.text,
    ...typography.meta
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.secondaryButtonHeight,
    borderRadius: radii.sm,
    backgroundColor: colors.primary
  },
  buttonText: {
    color: colors.primaryText,
    ...typography.button
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: controls.secondaryButtonHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface
  },
  secondaryButtonText: {
    color: colors.text,
    ...typography.button
  }
});

function getRequestStatusInfo(request: ApplicantInterestRequest) {
  if (request.status === 'accepted') {
    return {
      label: 'Accepted',
      tone: 'success' as const,
      copy: 'Messaging is now open with this recruiter.'
    };
  }

  if (request.status === 'declined') {
    return {
      label: 'Declined',
      tone: 'neutral' as const,
      copy: 'Messaging stays closed unless a future request is sent.'
    };
  }

  if (request.status === 'expired') {
    return {
      label: 'Expired',
      tone: 'neutral' as const,
      copy: 'This request expired without a response.'
    };
  }

  return {
    label: 'Pending',
    tone: 'neutral' as const,
    copy: request.expiresAt
      ? `Accept to unlock messaging. Expires ${request.expiresAt.slice(0, 10)}.`
      : 'Accept to unlock messaging with this recruiter.'
  };
}
