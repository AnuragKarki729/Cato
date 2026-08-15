export type NotificationBucket = 'requests';

export type NotificationUnreadCountsResponse = {
  counts: Record<NotificationBucket, number>;
};

export type MarkNotificationsSeenRequest = {
  bucket: NotificationBucket;
};
