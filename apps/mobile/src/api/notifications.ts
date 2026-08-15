import type { MarkNotificationsSeenRequest, NotificationUnreadCountsResponse } from '@cato/shared';
import { apiGet, apiPost } from './client';

export function getNotificationUnreadCounts(accessToken: string) {
  return apiGet<NotificationUnreadCountsResponse>('/notifications/unread-counts', accessToken);
}

export function markNotificationBucketSeen(accessToken: string, body: MarkNotificationsSeenRequest) {
  return apiPost<NotificationUnreadCountsResponse>('/notifications/seen', accessToken, body);
}
