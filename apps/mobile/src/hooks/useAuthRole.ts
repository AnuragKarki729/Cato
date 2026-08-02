import { useEffect, useState } from 'react';
import type { AppUserRole } from '@cato/shared';
import { getAuthRole } from '../api/auth';

type AuthRoleState = {
  error: Error | null;
  isLoading: boolean;
  role: AppUserRole | null;
};

export function useAuthRole(accessToken?: string): AuthRoleState {
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
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  return state;
}
