import { getApiBaseUrl } from './client';

type EventHandler = (eventName: string, payload: unknown) => void;

export function subscribeToServerEvents(path: string, accessToken: string, onEvent: EventHandler) {
  const controller = new AbortController();
  let isClosed = false;

  async function connect() {
    while (!isClosed) {
      try {
        const response = await fetch(`${getApiBaseUrl()}${path}`, {
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${accessToken}`
          },
          signal: controller.signal
        });

        if (!response.body) {
          throw new Error('SSE stream is unavailable');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!isClosed) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() ?? '';

          chunks.forEach((chunk) => {
            const lines = chunk.split('\n');
            const eventName = lines.find((line) => line.startsWith('event: '))?.slice(7).trim();
            const data = lines.find((line) => line.startsWith('data: '))?.slice(6);

            if (!eventName || !data) {
              return;
            }

            try {
              onEvent(eventName, JSON.parse(data));
            } catch {
              onEvent(eventName, data);
            }
          });
        }
      } catch {
        if (isClosed) {
          return;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  void connect();

  return () => {
    isClosed = true;
    controller.abort();
  };
}
