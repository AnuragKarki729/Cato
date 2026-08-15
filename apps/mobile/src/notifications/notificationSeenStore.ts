import { useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const listeners = new Set<() => void>();
const counts = new Map<string, number>();
const initializedKeys = new Set<string>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(key: string) {
  return counts.get(key) ?? 0;
}

async function persistCount(key: string, count: number) {
  if (count > 0) {
    await AsyncStorage.setItem(key, String(count));
    return;
  }

  await AsyncStorage.removeItem(key);
}

export function getNotificationSeenKey(role: 'applicant' | 'recruiter', userId: string, bucket: 'requests') {
  return `cato:${role}:${userId}:unseen:${bucket}`;
}

export async function initializeNotificationCount(key: string) {
  if (initializedKeys.has(key)) {
    return;
  }

  initializedKeys.add(key);
  const stored = await AsyncStorage.getItem(key);
  const parsed = Number(stored);
  counts.set(key, Number.isFinite(parsed) && parsed > 0 ? parsed : 0);
  notify();
}

export async function incrementNotificationCount(key: string) {
  const nextCount = (counts.get(key) ?? 0) + 1;
  counts.set(key, nextCount);
  notify();
  await persistCount(key, nextCount);
}

export async function setNotificationCount(key: string, count: number) {
  const nextCount = Math.max(0, count);
  counts.set(key, nextCount);
  initializedKeys.add(key);
  notify();
  await persistCount(key, nextCount);
}

export async function markNotificationsSeen(key?: string) {
  if (!key) {
    return;
  }

  counts.set(key, 0);
  notify();
  await persistCount(key, 0);
}

export function useNotificationCount(key?: string) {
  useEffect(() => {
    if (key) {
      void initializeNotificationCount(key);
    }
  }, [key]);

  return useSyncExternalStore(
    subscribe,
    () => (key ? getSnapshot(key) : 0),
    () => 0
  );
}
