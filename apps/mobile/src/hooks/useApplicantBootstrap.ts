import { useEffect, useState } from 'react';
import type { Applicant } from '@cato/shared';
import { getMe, syncApplicant } from '../api/auth';

type ApplicantBootstrapState = {
  applicant: Applicant | null;
  error: Error | null;
  isLoading: boolean;
};

export function useApplicantBootstrap(accessToken?: string): ApplicantBootstrapState {
  const [retryVersion, setRetryVersion] = useState(0);
  const [state, setState] = useState<ApplicantBootstrapState>({
    applicant: null,
    error: null,
    isLoading: Boolean(accessToken)
  });

  useEffect(() => {
    if (!accessToken) {
      setState({
        applicant: null,
        error: null,
        isLoading: false
      });
      return;
    }

    const token = accessToken;
    let isMounted = true;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    setState((current) => ({
      ...current,
      isLoading: !current.applicant && !current.error
    }));

    async function bootstrapApplicant() {
      try {
        console.log('[bootstrap-debug] syncing applicant:', {
          hasAccessToken: Boolean(token)
        });
        const synced = await syncApplicant(token);
        console.log('[bootstrap-debug] syncApplicant success:', {
          hasApplicant: Boolean(synced.applicant),
          onboardingStatus: synced.applicant?.onboardingStatus
        });

        const current = await getMe(token);
        console.log('[bootstrap-debug] getMe success:', {
          hasApplicant: Boolean(current.applicant),
          onboardingStatus: current.applicant?.onboardingStatus
        });

        if (isMounted) {
          setState({
            applicant: current.applicant ?? synced.applicant,
            error: null,
            isLoading: false
          });
        }
      } catch (error) {
        console.error('[bootstrap-debug] applicant bootstrap error:', {
          message: error instanceof Error ? error.message : 'Applicant bootstrap failed'
        });

        if (isMounted) {
          setState({
            applicant: null,
            error: error instanceof Error ? error : new Error('Applicant bootstrap failed'),
            isLoading: false
          });
          retryTimer = setTimeout(() => {
            if (isMounted) {
              setRetryVersion((version) => version + 1);
            }
          }, 2500);
        }
      }
    }

    bootstrapApplicant();

    return () => {
      isMounted = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [accessToken, retryVersion]);

  return state;
}
