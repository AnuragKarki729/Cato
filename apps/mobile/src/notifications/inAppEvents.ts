type InAppEvent = {
  eventName: string;
  payload: unknown;
};

type InAppEventListener = (event: InAppEvent) => void;

const listeners = new Set<InAppEventListener>();

export function emitInAppEvent(event: InAppEvent) {
  listeners.forEach((listener) => listener(event));
}

export function addInAppEventListener(listener: InAppEventListener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}
