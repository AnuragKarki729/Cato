import { useEffect, useState } from 'react';
import type { AppUserRole } from '@cato/shared';
import { getAuthRole } from '../api/auth';

type AuthRoleState = {
  error: Error | null;
  isLoading: boolean;
  role: AppUserRole | null;
};

let authRoleRefreshVersion = 0;
const authRoleRefreshListeners = new Set<() => void>();

export function refreshAuthRole() {
  authRoleRefreshVersion += 1;
  authRoleRefreshListeners.forEach((listener) => listener());
}

function useAuthRoleRefreshVersion() {
  const [version, setVersion] = useState(authRoleRefreshVersion);

  useEffect(() => {
    const listener = () => setVersion(authRoleRefreshVersion);
    authRoleRefreshListeners.add(listener);

    return () => {
      authRoleRefreshListeners.delete(listener);
    };
  }, []);

  return version;
}

export function useAuthRole(accessToken?: string): AuthRoleState {
  const refreshVersion = useAuthRoleRefreshVersion();
  const [retryVersion, setRetryVersion] = useState(0);
  const [state, setState] = useState<AuthRoleState>({
    error: null,
    isLoading: Boolean(accessToken),
    role: null
  });

  useEffect(() => {
    if (!accessToken) {
      setState({ error: null, isLoading: false, role: null });
      return;
    }

    let isMounted = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    setState((current) => ({
      ...current,
      isLoading: !current.role && !current.error
    }));

    getAuthRole(accessToken)
      .then((response) => {
        if (isMounted) {
          setState({ error: null, isLoading: false, role: response.role });
        }
      })
      .catch((error) => {
        if (isMounted) {
          setState({
            error: error instanceof Error ? error : new Error('Unable to load account role'),
            isLoading: false,
            role: null
          });
          retryTimer = setTimeout(() => {
            if (isMounted) {
              setRetryVersion((version) => version + 1);
            }
          }, 2500);
        }
      });

    return () => {
      isMounted = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [accessToken, refreshVersion, retryVersion]);

  return state;
}
