const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export function getApiBaseUrl() {
  if (!apiBaseUrl) {
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL');
  }

  return apiBaseUrl;
}

type ApiRequestOptions = {
  accessToken?: string;
  body?: unknown;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
};

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  if (!apiBaseUrl) {
    console.error('[api-debug] missing EXPO_PUBLIC_API_BASE_URL');
    throw new Error('Missing EXPO_PUBLIC_API_BASE_URL');
  }

  const headers = new Headers({
    Accept: 'application/json'
  });

  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.accessToken) {
    headers.set('Authorization', `Bearer ${options.accessToken}`);
  }

  const url = `${apiBaseUrl}${path}`;

  console.log('[api-debug] request:', {
    method: options.method ?? 'GET',
    path,
    apiBaseUrl,
    hasAccessToken: Boolean(options.accessToken)
  });

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  console.log('[api-debug] response:', {
    method: options.method ?? 'GET',
    path,
    status: response.status,
    ok: response.ok
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[api-debug] response error:', {
      path,
      status: response.status,
      body: errorText
    });
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function apiGet<T>(path: string, accessToken?: string): Promise<T> {
  return apiRequest<T>(path, { accessToken });
}

export function apiPost<T>(path: string, accessToken?: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    accessToken,
    body
  });
}
