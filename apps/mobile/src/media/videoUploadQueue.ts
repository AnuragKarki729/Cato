import { useSyncExternalStore } from 'react';

export type QueuedVideoType = '10-second' | '30-second';

const listeners = new Set<() => void>();
const pendingUploads: Partial<Record<QueuedVideoType, Promise<unknown>>> = {};
const completedUploads: Partial<Record<QueuedVideoType, boolean>> = {};
let snapshot = {
  tenSecond: false,
  thirtySecond: false,
  tenSecondCompleted: false,
  thirtySecondCompleted: false
};

function emit() {
  snapshot = {
    tenSecond: hasQueuedVideoUpload('10-second'),
    thirtySecond: hasQueuedVideoUpload('30-second'),
    tenSecondCompleted: hasCompletedVideoUpload('10-second'),
    thirtySecondCompleted: hasCompletedVideoUpload('30-second')
  };
  listeners.forEach((listener) => listener());
}

export function startQueuedVideoUpload(type: QueuedVideoType, upload: Promise<unknown>) {
  pendingUploads[type] = upload;
  completedUploads[type] = false;
  emit();

  upload
    .then(() => {
      completedUploads[type] = true;
    })
    .catch((error) => {
      completedUploads[type] = false;
      console.error('[video-upload-debug] background upload failed:', {
        type,
        message: error instanceof Error ? error.message : 'Video upload failed'
      });
    })
    .finally(() => {
      if (pendingUploads[type] === upload) {
        delete pendingUploads[type];
        emit();
      }
    });
}

export function waitForQueuedVideoUpload(type: QueuedVideoType) {
  return pendingUploads[type] ?? Promise.resolve();
}

export function hasQueuedVideoUpload(type: QueuedVideoType) {
  return Boolean(pendingUploads[type]);
}

export function hasCompletedVideoUpload(type: QueuedVideoType) {
  return completedUploads[type] === true;
}

export function useQueuedVideoUploads() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    () => snapshot,
    () => ({
      tenSecond: false,
      thirtySecond: false,
      tenSecondCompleted: false,
      thirtySecondCompleted: false
    })
  );
}
