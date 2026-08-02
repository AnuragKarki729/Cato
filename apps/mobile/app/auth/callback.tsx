import { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StateView } from '../../src/components/StateView';
import { supabase } from '../../src/lib/supabase';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function finishSignIn() {
      console.log('[oauth-debug] callback route params:', {
        hasCode: Boolean(params.code),
        hasErrorDescription: Boolean(params.error_description),
        keys: Object.keys(params)
      });

      if (params.error_description) {
        console.error('[oauth-debug] callback route error_description:', String(params.error_description));
        setError(String(params.error_description));
        return;
      }

      if (!params.code) {
        console.error('[oauth-debug] callback route missing code');
        setError('Missing OAuth code');
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(String(params.code));

      if (exchangeError) {
        console.error('[oauth-debug] callback route exchangeCodeForSession error:', exchangeError.message);
        if (isMounted) {
          setError(exchangeError.message);
        }
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      console.log('[oauth-debug] callback route exchange success:', {
        hasSession: Boolean(sessionData.session),
        userId: sessionData.session?.user.id
      });

      router.replace('/');
    }

    finishSignIn();

    return () => {
      isMounted = false;
    };
  }, [params.code, params.error_description]);

  return <StateView title={error ?? 'Finishing sign in'} />;
}
