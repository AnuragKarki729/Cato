import { PropsWithChildren, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscribeToServerEvents } from '../api/events';
import { getNotificationUnreadCounts, markNotificationBucketSeen } from '../api/notifications';
import { colors, radii, spacing, typography } from '../theme';
import { emitInAppEvent } from './inAppEvents';
import { incrementNotificationCount, markNotificationsSeen, setNotificationCount } from './notificationSeenStore';

type NotificationRole = 'applicant' | 'recruiter';

type InAppNotification = {
  id: number;
  body: string;
  seenKey?: string;
  title: string;
  route: string;
};

function getStringValue(payload: unknown, key: string) {
  if (!payload || typeof payload !== 'object' || !(key in payload)) {
    return undefined;
  }

  const value = (payload as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}

function buildNotification(role: NotificationRole, eventName: string, payload: unknown): InAppNotification | null {
  const id = Date.now();

  if (role === 'applicant' && eventName === 'interest_request_sent') {
    const companyName = getStringValue(payload, 'companyName');
    const recruiterName = getStringValue(payload, 'recruiterName');

    return {
      id,
      title: 'New recruiter request',
      body: `${companyName ?? recruiterName ?? 'A recruiter'} wants to connect with you.`,
      route: '/(tabs)/requests'
    };
  }

  if (role === 'recruiter' && eventName === 'interest_request_responded') {
    const applicantName = getStringValue(payload, 'applicantName') ?? 'A candidate';
    const status = getStringValue(payload, 'status');
    const action = status === 'accepted' ? 'accepted' : 'declined';

    return {
      id,
      title: 'Request updated',
      body: `${applicantName} ${action} your interest request.`,
      route: '/(recruiter)/dashboard'
    };
  }

  return null;
}

type InAppNotificationProviderProps = PropsWithChildren<{
  accessToken?: string;
  role: NotificationRole;
  requestSeenKey?: string;
}>;

export function InAppNotificationProvider({ accessToken, children, requestSeenKey, role }: InAppNotificationProviderProps) {
  const insets = useSafeAreaInsets();
  const [notification, setNotification] = useState<InAppNotification | null>(null);

  useEffect(() => {
    if (!accessToken || !requestSeenKey) {
      return;
    }

    getNotificationUnreadCounts(accessToken)
      .then((response) => setNotificationCount(requestSeenKey, response.counts.requests))
      .catch(() => undefined);
  }, [accessToken, requestSeenKey]);

  useEffect(() => {
    if (!accessToken) {
      return undefined;
    }

    const path = role === 'applicant' ? '/applicant/events' : '/recruiter/events';
    return subscribeToServerEvents(path, accessToken, (eventName, payload) => {
      emitInAppEvent({ eventName, payload });
      const nextNotification = buildNotification(role, eventName, payload);

      if (nextNotification) {
        const notificationWithSeenKey = { ...nextNotification, seenKey: requestSeenKey };
        if (requestSeenKey) {
          void incrementNotificationCount(requestSeenKey);
        }
        setNotification(notificationWithSeenKey);
      }
    });
  }, [accessToken, requestSeenKey, role]);

  useEffect(() => {
    if (!notification) {
      return undefined;
    }

    const timeout = setTimeout(() => setNotification(null), 5200);
    return () => clearTimeout(timeout);
  }, [notification]);

  return (
    <View style={styles.container}>
      {children}
      {notification ? (
        <Pressable
          onPress={() => {
            setNotification(null);
            void markNotificationsSeen(notification.seenKey);
            if (accessToken && notification.seenKey) {
              void markNotificationBucketSeen(accessToken, { bucket: 'requests' });
            }
            router.push(notification.route);
          }}
          style={[styles.banner, { top: Math.max(insets.top, 12) + spacing.sm }]}
        >
          <View style={styles.mark} />
          <View style={styles.copy}>
            <Text style={styles.title}>{notification.title}</Text>
            <Text numberOfLines={2} style={styles.body}>{notification.body}</Text>
          </View>
          <Text style={styles.action}>View</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  banner: {
    position: 'absolute',
    right: spacing.lg,
    left: spacing.lg,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 8
  },
  mark: {
    width: 10,
    height: 42,
    borderRadius: radii.sm,
    backgroundColor: colors.primary
  },
  copy: {
    flex: 1
  },
  title: {
    color: colors.text,
    ...typography.label
  },
  body: {
    marginTop: 2,
    color: colors.muted,
    ...typography.meta
  },
  action: {
    color: colors.primary,
    ...typography.label
  }
});
