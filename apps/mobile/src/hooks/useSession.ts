import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type SessionState = {
  isLoading: boolean;
  session: Session | null;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({
    isLoading: true,
    session: null
  });

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      console.log('[oauth-debug] initial getSession:', {
        hasSession: Boolean(data.session),
        userId: data.session?.user.id
      });

      if (isMounted) {
        setState({
          isLoading: false,
          session: data.session
        });
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('[oauth-debug] auth state change:', {
        event: _event,
        hasSession: Boolean(session),
        userId: session?.user.id
      });

      setState({
        isLoading: false,
        session
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return createElement(SessionContext.Provider, { value: state }, children);
}

export function useSession(): SessionState {
  const state = useContext(SessionContext);

  if (!state) {
    throw new Error('useSession must be used inside SessionProvider');
  }

  return state;
}
