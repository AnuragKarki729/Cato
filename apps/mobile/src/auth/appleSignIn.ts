import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

function buildFullName(fullName: AppleAuthentication.AppleAuthenticationFullName | null) {
  if (!fullName) {
    return undefined;
  }

  const name = [fullName.givenName, fullName.middleName, fullName.familyName].filter(Boolean).join(' ').trim();

  return name.length > 0 ? name : undefined;
}

export async function isAppleSignInAvailable() {
  return Platform.OS === 'ios' && AppleAuthentication.isAvailableAsync();
}

export async function signInWithApple() {
  if (Platform.OS !== 'ios') {
    throw new Error('Apple sign-in is only available on iOS');
  }

  const isAvailable = await AppleAuthentication.isAvailableAsync();

  if (!isAvailable) {
    throw new Error('Apple sign-in is not available on this device');
  }

  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  try {
    const credential = await AppleAuthentication.signInAsync({
      nonce: hashedNonce,
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL
      ]
    });

    if (!credential.identityToken) {
      throw new Error('Apple did not return an identity token');
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce
    });

    if (error) {
      throw error;
    }

    const fullName = buildFullName(credential.fullName);

    if (fullName && data.session) {
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          name: fullName,
          given_name: credential.fullName?.givenName,
          family_name: credential.fullName?.familyName
        }
      });
    }
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ERR_REQUEST_CANCELED') {
      return;
    }

    throw error;
  }
}
