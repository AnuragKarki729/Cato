import { useEffect, useState } from 'react';
import type { OnboardingStatusResponse } from '@cato/shared';
import { getOnboardingStatus } from '../api/onboarding';

type OnboardingStatusState = {
  error: Error | null;
  isLoading: boolean;
  status: OnboardingStatusResponse | null;
};

export function useOnboardingStatus(accessToken?: string): OnboardingStatusState {
  const [retryVersion, setRetryVersion] = useState(0);
  const [state, setState] = useState<OnboardingStatusState>({
    error: null,
    isLoading: Boolean(accessToken),
    status: null
  });

  useEffect(() => {
    if (!accessToken) {
      setState({
        error: null,
        isLoading: false,
        status: null
      });
      return;
    }

    const token = accessToken;
    let isMounted = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    setState((current) => ({
      ...current,
      isLoading: !current.status && !current.error
    }));

    async function loadOnboardingStatus() {
      try {
        const status = await getOnboardingStatus(token);

        if (isMounted) {
          setState({
            error: null,
            isLoading: false,
            status
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            error: error instanceof Error ? error : new Error('Onboarding status failed'),
            isLoading: false,
            status: null
          });
          retryTimer = setTimeout(() => {
            if (isMounted) {
              setRetryVersion((version) => version + 1);
            }
          }, 2500);
        }
      }
    }

    loadOnboardingStatus();

    return () => {
      isMounted = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [accessToken, retryVersion]);

  return state;
}
