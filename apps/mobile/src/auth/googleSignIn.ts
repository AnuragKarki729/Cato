import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

let nativeGoogleConfigured = false;

function describeUrl(value: string) {
  const url = new URL(value);
  const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);

  return {
    protocol: url.protocol,
    host: url.host,
    pathname: url.pathname,
    redirectTo: url.searchParams.get('redirect_to'),
    searchKeys: getSearchParamKeys(url.searchParams),
    hashKeys: getSearchParamKeys(hashParams)
  };
}

function getSearchParamKeys(params: URLSearchParams) {
  const keys: string[] = [];

  params.forEach((_value, key) => {
    keys.push(key);
  });

  return keys;
}

export async function signInWithGoogle() {
  if (Platform.OS === 'android') {
    return signInWithNativeGoogle();
  }

  return signInWithSupabaseOAuth();
}

async function signInWithNativeGoogle() {
  const googleWebClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    (Constants.expoConfig?.extra?.googleWebClientId as string | undefined);

  if (!googleWebClientId) {
    throw new Error('Missing Google web client ID for Android sign-in');
  }

  const { GoogleSignin } = (await import('@react-native-google-signin/google-signin')) as GoogleSigninModule;

  if (!nativeGoogleConfigured) {
    GoogleSignin.configure({
      scopes: ['email', 'profile'],
      webClientId: googleWebClientId
    });
    nativeGoogleConfigured = true;
  }

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  // Force the account picker so Android matches the current "choose account" UX.
  await GoogleSignin.signOut().catch(() => null);

  const response = await GoogleSignin.signIn();

  if (response.type === 'cancelled') {
    return;
  }

  const idToken = response.data.idToken;

  if (!idToken) {
    throw new Error('Google did not return an ID token');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken
  });

  if (error) {
    console.error('[oauth-debug] native Google signInWithIdToken error:', error.message);
    throw error;
  }

  console.log('[oauth-debug] native Google sign-in success:', {
    hasSession: Boolean(data.session),
    userId: data.session?.user.id
  });
}

async function signInWithSupabaseOAuth() {
  const isExpoGo = Constants.appOwnership === 'expo';
  const redirectTo = isExpoGo
    ? makeRedirectUri({
        path: 'auth/callback'
      })
    : makeRedirectUri({
        scheme: 'cato',
        path: 'auth/callback'
      });

  console.log('[oauth-debug] runtime:', {
    appOwnership: Constants.appOwnership,
    isExpoGo
  });
  console.log('[oauth-debug] redirect_to:', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        prompt: 'select_account'
      },
      redirectTo,
      skipBrowserRedirect: true
    }
  });

  if (error) {
    console.error('[oauth-debug] signInWithOAuth error:', error.message);
    throw error;
  }

  if (!data.url) {
    console.error('[oauth-debug] missing Supabase OAuth URL');
    throw new Error('Supabase did not return an OAuth URL');
  }

  console.log('[oauth-debug] authorize URL:', describeUrl(data.url));

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  const resultUrl = 'url' in result ? result.url : undefined;

  console.log('[oauth-debug] browser result:', {
    type: result.type,
    url: resultUrl ? describeUrl(resultUrl) : undefined
  });

  if (result.type !== 'success') {
    return;
  }

  const callbackUrl = new URL(result.url);
  const hashParams = new URLSearchParams(
    callbackUrl.hash.startsWith('#') ? callbackUrl.hash.slice(1) : callbackUrl.hash
  );
  const code = callbackUrl.searchParams.get('code');
  const errorDescription = callbackUrl.searchParams.get('error_description');
  const hasImplicitAccessToken = Boolean(hashParams.get('access_token'));

  console.log('[oauth-debug] callback params:', {
    hasCode: Boolean(code),
    hasErrorDescription: Boolean(errorDescription),
    hasImplicitAccessToken,
    searchKeys: getSearchParamKeys(callbackUrl.searchParams),
    hashKeys: getSearchParamKeys(hashParams)
  });

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('[oauth-debug] exchangeCodeForSession error:', exchangeError.message);
      throw exchangeError;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    console.log('[oauth-debug] exchangeCodeForSession success:', {
      hasSession: Boolean(sessionData.session),
      userId: sessionData.session?.user.id
    });

    return;
  }

  throw new Error('OAuth callback did not include a PKCE code');
}
