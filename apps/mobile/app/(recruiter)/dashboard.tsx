import { useEffect, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { RecruiterDashboardResponse, RecruiterInterestRequest, RecruiterSavedFilter } from '@cato/shared';
import { markNotificationBucketSeen } from '../../src/api/notifications';
import { getRecruiterDashboard, getRecruiterInterestRequests, getRecruiterSavedFilters } from '../../src/api/recruiter';
import { RecruiterContent } from '../../src/recruiter/RecruiterContent';
import { useSession } from '../../src/hooks/useSession';
import { addInAppEventListener } from '../../src/notifications/inAppEvents';
import { getNotificationSeenKey, markNotificationsSeen } from '../../src/notifications/notificationSeenStore';
import { colors, controls, radii, spacing, typography } from '../../src/theme';

export default function RecruiterDashboardScreen() {
  const { session } = useSession();
  const [dashboard, setDashboard] = useState<RecruiterDashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interestRequests, setInterestRequests] = useState<RecruiterInterestRequest[]>([]);
  const [savedFilters, setSavedFilters] = useState<RecruiterSavedFilter[]>([]);
  const [requestPage, setRequestPage] = useState(0);

  async function loadDashboard() {
    if (!session?.access_token) {
      return;
    }

    try {
      const [dashboardResponse, requestsResponse, filtersResponse] = await Promise.all([
        getRecruiterDashboard(session.access_token),
        getRecruiterInterestRequests(session.access_token),
        getRecruiterSavedFilters(session.access_token)
      ]);
      setDashboard(dashboardResponse);
      setInterestRequests(requestsResponse.requests);
      setSavedFilters(filtersResponse.filters);
    } catch (dashboardError) {
      setError(dashboardError instanceof Error ? dashboardError.message : 'Unable to load recruiter dashboard');
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [session]);

  useEffect(() => {
    if (session?.user.id) {
      void markNotificationsSeen(getNotificationSeenKey('recruiter', session.user.id, 'requests'));
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
      if (eventName === 'interest_request_responded') {
        void loadDashboard();
        void markNotificationsSeen(getNotificationSeenKey('recruiter', userId, 'requests'));
        void markNotificationBucketSeen(session.access_token, { bucket: 'requests' });
      }
    });
  }, [session?.access_token, session?.user.id]);

  const metrics = dashboard?.metrics ?? { candidates: 0, bookmarks: 0, messages: 0, interestRequests: 0 };
  const recruiterName = dashboard?.recruiter.name?.split(/\s+/)[0] ?? 'there';
  const hasRequests = interestRequests.length > 0;
  const pendingRequests = interestRequests.filter((request) => request.status === 'sent' || request.status === 'viewed').length;
  const acceptedRequests = interestRequests.filter((request) => request.status === 'accepted').length;
  const requestPages = chunkItems(interestRequests.slice(0, 10), 4);

  return (
    <RecruiterContent>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Good morning, {recruiterName}</Text>
          {/* <Text style={styles.body}>Prioritize candidates, review signals, and keep follow-ups moving.</Text> */}
        </View>
        <Pressable onPress={loadDashboard} style={styles.iconButton}>
          <Ionicons color={colors.text} name="refresh-outline" size={20} />
        </Pressable>
      </View>

      <View style={styles.workbenchCard}>
        <View style={styles.workbenchHeader}>
          <View style={styles.workbenchCopy}>
            <Text style={styles.planLabel}>Hiring desk</Text>
            <Text style={styles.planTitle}>{pendingRequests} pending requests</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{acceptedRequests} accepted</Text>
          </View>
        </View>
        <Pressable onPress={() => router.push('/(recruiter)/search')} style={styles.primaryAction}>
          <Ionicons color={colors.primaryText} name="filter-outline" size={18} />
          <Text style={styles.buttonText}>Build a Shortlist</Text>
        </Pressable>
      </View>

      <View style={styles.quickActions}>
        <Pressable onPress={() => router.push('/(recruiter)/shortlist')} style={styles.lightButton}>
          <Ionicons color={colors.text} name="checkmark-circle-outline" size={18} />
          <Text style={styles.lightButtonText}>Shortlist</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(recruiter)/feed')} style={styles.lightButton}>
          <Ionicons color={colors.text} name="play-circle-outline" size={18} />
          <Text style={styles.lightButtonText}>Review feed</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(recruiter)/evidence-queue')} style={styles.lightButton}>
          <Ionicons color={colors.text} name="analytics-outline" size={18} />
          <Text style={styles.lightButtonText}>Evidence Queue</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/(recruiter)/bookmarks')} style={styles.lightButton}>
          <Ionicons color={colors.text} name="bookmark-outline" size={18} />
          <Text style={styles.lightButtonText}>Saved</Text>
          {metrics.bookmarks > 0 ? (
            <View style={styles.buttonBadge}>
              <Text style={styles.buttonBadgeText}>{metrics.bookmarks}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.metrics}>
        {[
          [String(metrics.candidates), 'Candidates', '/(recruiter)/search'],
          [String(metrics.messages), 'Messages', '/(recruiter)/messages']
        ].map(([value, label, route]) => (
          <Pressable key={label} onPress={() => router.push(route as never)} style={styles.metric}>
            <Text style={styles.metricValue}>{value}</Text>
            <Text style={styles.metricLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {savedFilters.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Search</Text>
            <Text style={styles.sectionMeta}>{savedFilters.length}/10</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedFilterRow}>
            {savedFilters.map((filter) => (
              <Pressable key={filter.id} onPress={() => openSavedFilter(filter)} style={styles.savedFilterChip}>
                <Ionicons color={colors.text} name="funnel-outline" size={15} />
                <Text numberOfLines={1} style={styles.savedFilterText}>{filter.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Interest Requests</Text>
          {interestRequests.length > 10 ? (
            <Pressable onPress={() => router.push('/(recruiter)/interest-requests')}>
              <Text style={styles.linkText}>View all</Text>
            </Pressable>
          ) : (
            <Text style={styles.sectionMeta}>{interestRequests.length}</Text>
          )}
        </View>
        {hasRequests ? (
          <>
            <ScrollView
              horizontal
              onMomentumScrollEnd={(event) => setRequestPage(getPageFromScroll(event))}
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.requestCarousel}
            >
              {requestPages.map((page, index) => (
                <View key={index} style={styles.requestPage}>
                  {page.map((request) => (
                    <InterestRequestCard key={request.id} request={request} />
                  ))}
                </View>
              ))}
            </ScrollView>
            {requestPages.length > 1 ? (
              <View style={styles.pageDots}>
                {requestPages.map((_, index) => (
                  <View key={index} style={[styles.pageDot, index === requestPage ? styles.pageDotActive : null]} />
                ))}
              </View>
            ) : null}
          </>
        ) : (
          <Text style={styles.body}>No interest requests sent yet.</Text>
        )}
      </View>
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </RecruiterContent>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, ...typography.screenTitle },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.lg },
  headerCopy: { flex: 1 , margin:2},
  iconButton: { alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: radii.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  workbenchCard: { gap: spacing.lg, marginTop: spacing.xl, borderRadius: radii.sm, backgroundColor: colors.primary, padding: spacing.lg },
  workbenchHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  workbenchCopy: { flex: 1 },
  planLabel: { color: colors.primaryText, ...typography.meta },
  planTitle: { color: colors.primaryText, fontSize: 21, lineHeight: 26, fontWeight: '900' },
  statusPill: { borderRadius: 999, backgroundColor: colors.accent, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  statusPillText: { color: colors.text, ...typography.meta },
  primaryAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: controls.buttonHeight, borderRadius: radii.sm, backgroundColor: colors.text },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  lightButton: { flexGrow: 1, flexBasis: '47%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, minHeight: 48, borderRadius: radii.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md },
  lightButtonText: { color: colors.text, ...typography.label },
  buttonBadge: { minWidth: 22, borderRadius: 999, backgroundColor: colors.accent, paddingHorizontal: 7, paddingVertical: 2 },
  buttonBadgeText: { color: colors.text, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  metrics: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  metric: { flex: 1, alignItems: 'center', borderRadius: radii.sm, backgroundColor: colors.surfaceMuted, paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  metricValue: { color: colors.text, fontSize: 20, lineHeight: 25, fontWeight: '900', textAlign: 'center' },
  metricLabel: { marginTop: spacing.xs, color: colors.muted, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  section: { gap: spacing.sm, marginTop: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sectionTitle: { color: colors.text, ...typography.sectionTitle },
  sectionMeta: { color: colors.muted, ...typography.meta },
  linkText: { color: colors.purple, ...typography.label },
  body: { color: colors.muted, ...typography.body },
  savedFilterRow: { gap: spacing.sm, paddingRight: spacing.xl },
  savedFilterChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, maxWidth: 180, borderWidth: 1, borderColor: colors.border, borderRadius: 999, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  savedFilterText: { color: colors.text, ...typography.meta },
  requestCarousel: { marginHorizontal: -spacing.xs },
  requestPage: { width: 330, gap: spacing.sm, paddingHorizontal: spacing.xs },
  pageDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.xs },
  pageDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: colors.border },
  pageDotActive: { width: 16, backgroundColor: colors.text },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    padding: spacing.md
  },
  requestCopy: { flex: 1 },
  requestName: { color: colors.text, ...typography.label },
  requestMeta: { marginTop: 2, color: colors.muted, ...typography.meta },
  requestAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md
  },
  requestActionDisabled: { opacity: 0.5 },
  requestActionText: { color: colors.primaryText, ...typography.meta },
  button: { alignItems: 'center', justifyContent: 'center', minHeight: controls.buttonHeight, marginTop: spacing.xxl, borderRadius: radii.sm, backgroundColor: colors.primary },
  buttonText: { color: colors.primaryText, ...typography.button },
  error: { marginTop: spacing.md, color: colors.danger, ...typography.meta }
});

function InterestRequestCard({ request }: { request: RecruiterInterestRequest }) {
  const isPending = request.status === 'sent' || request.status === 'viewed';
  const canMessage = request.status === 'accepted';
  const canRetry =
    (request.status === 'declined' || request.status === 'expired') &&
    (!request.resendAvailableAt || new Date(request.resendAvailableAt).getTime() <= Date.now());
  const actionLabel = canMessage ? 'Message' : canRetry ? 'Request again' : isPending ? 'Pending' : request.status;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/(recruiter)/feed', params: { candidateId: request.candidateId } })}
      style={styles.requestCard}
    >
      <View style={styles.requestCopy}>
        <Text style={styles.requestName}>{request.candidateName ?? 'Candidate'}</Text>
        <Text style={styles.requestMeta}>{getRequestMeta(request)}</Text>
      </View>
      <Pressable
        disabled={!canMessage && !canRetry}
        onPress={() =>
          router.push({
            pathname: '/(recruiter)/contact',
            params: {
              candidateId: request.candidateId,
              ...(canMessage ? { mode: 'message' } : {}),
              ...(canRetry ? { mode: 'resend' } : {})
            }
          })
        }
        style={[styles.requestAction, !canMessage && !canRetry ? styles.requestActionDisabled : null]}
      >
        <Text style={styles.requestActionText}>{actionLabel}</Text>
      </Pressable>
    </Pressable>
  );
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function getPageFromScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
  const width = event.nativeEvent.layoutMeasurement.width || 1;
  return Math.round(event.nativeEvent.contentOffset.x / width);
}

function openSavedFilter(filter: RecruiterSavedFilter) {
  router.push({
    pathname: '/(recruiter)/results',
    params: Object.fromEntries(
      Object.entries(filter.criteria)
        .filter(([, value]) => value !== undefined && value !== null && value !== '' && (!Array.isArray(value) || value.length > 0))
        .map(([key, value]) => [key, Array.isArray(value) ? value.map(String) : String(value)])
    )
  });
}

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
