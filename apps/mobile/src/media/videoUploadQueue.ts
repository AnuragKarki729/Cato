import { useSyncExternalStore } from 'react';

export type QueuedVideoType = '10-second' | '30-second';
type VideoUploadStatus = 'idle' | 'uploading' | 'completed' | 'failed';
type VideoUploadTask = Promise<unknown> | (() => Promise<unknown>);
type VideoUploadSnapshot = {
  tenSecond: boolean;
  thirtySecond: boolean;
  tenSecondCompleted: boolean;
  thirtySecondCompleted: boolean;
  tenSecondFailed: boolean;
  thirtySecondFailed: boolean;
  tenSecondError: string | null;
  thirtySecondError: string | null;
  tenSecondStatus: VideoUploadStatus;
  thirtySecondStatus: VideoUploadStatus;
};

const listeners = new Set<() => void>();
const pendingUploads: Partial<Record<QueuedVideoType, Promise<unknown>>> = {};
const retryTasks: Partial<Record<QueuedVideoType, () => Promise<unknown>>> = {};
const completedUploads: Partial<Record<QueuedVideoType, boolean>> = {};
const failedUploads: Partial<Record<QueuedVideoType, string>> = {};
let snapshot: VideoUploadSnapshot = {
  tenSecond: false,
  thirtySecond: false,
  tenSecondCompleted: false,
  thirtySecondCompleted: false,
  tenSecondFailed: false,
  thirtySecondFailed: false,
  tenSecondError: null as string | null,
  thirtySecondError: null as string | null,
  tenSecondStatus: 'idle' as VideoUploadStatus,
  thirtySecondStatus: 'idle' as VideoUploadStatus
};

const fallbackSnapshot: VideoUploadSnapshot = {
  tenSecond: false,
  thirtySecond: false,
  tenSecondCompleted: false,
  thirtySecondCompleted: false,
  tenSecondFailed: false,
  thirtySecondFailed: false,
  tenSecondError: null,
  thirtySecondError: null,
  tenSecondStatus: 'idle',
  thirtySecondStatus: 'idle'
};

function emit() {
  snapshot = {
    tenSecond: hasQueuedVideoUpload('10-second'),
    thirtySecond: hasQueuedVideoUpload('30-second'),
    tenSecondCompleted: hasCompletedVideoUpload('10-second'),
    thirtySecondCompleted: hasCompletedVideoUpload('30-second'),
    tenSecondFailed: hasFailedVideoUpload('10-second'),
    thirtySecondFailed: hasFailedVideoUpload('30-second'),
    tenSecondError: getQueuedVideoUploadError('10-second'),
    thirtySecondError: getQueuedVideoUploadError('30-second'),
    tenSecondStatus: getQueuedVideoUploadStatus('10-second'),
    thirtySecondStatus: getQueuedVideoUploadStatus('30-second')
  };
  listeners.forEach((listener) => listener());
}

function toUploadPromise(type: QueuedVideoType, upload: VideoUploadTask) {
  if (typeof upload === 'function') {
    retryTasks[type] = upload;
    return upload();
  }

  delete retryTasks[type];
  return upload;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Video upload failed';
}

export function startQueuedVideoUpload(type: QueuedVideoType, uploadTask: VideoUploadTask) {
  const upload = toUploadPromise(type, uploadTask);

  pendingUploads[type] = upload;
  completedUploads[type] = false;
  delete failedUploads[type];
  emit();

  upload
    .then(() => {
      completedUploads[type] = true;
    })
    .catch((error) => {
      completedUploads[type] = false;
      failedUploads[type] = getErrorMessage(error);
      console.error('[video-upload-debug] background upload failed:', {
        type,
        message: getErrorMessage(error)
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
  if (failedUploads[type]) {
    return Promise.reject(new Error(failedUploads[type]));
  }

  return pendingUploads[type] ?? Promise.resolve();
}

export function hasQueuedVideoUpload(type: QueuedVideoType) {
  return Boolean(pendingUploads[type]);
}

export function hasCompletedVideoUpload(type: QueuedVideoType) {
  return completedUploads[type] === true;
}

export function hasFailedVideoUpload(type: QueuedVideoType) {
  return Boolean(failedUploads[type]);
}

export function getQueuedVideoUploadError(type: QueuedVideoType) {
  return failedUploads[type] ?? null;
}

export function getQueuedVideoUploadStatus(type: QueuedVideoType): VideoUploadStatus {
  if (pendingUploads[type]) {
    return 'uploading';
  }

  if (failedUploads[type]) {
    return 'failed';
  }

  if (completedUploads[type]) {
    return 'completed';
  }

  return 'idle';
}

export function retryQueuedVideoUpload(type: QueuedVideoType) {
  const retryTask = retryTasks[type];

  if (!retryTask) {
    return Promise.reject(new Error('No video upload retry is available'));
  }

  startQueuedVideoUpload(type, retryTask);
  return waitForQueuedVideoUpload(type);
}

export function clearQueuedVideoUpload(type: QueuedVideoType) {
  delete pendingUploads[type];
  delete retryTasks[type];
  delete completedUploads[type];
  delete failedUploads[type];
  emit();
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
    () => fallbackSnapshot
  );
}
