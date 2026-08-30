import * as AuthSession from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { friendlyAuthError } from './auth-errors';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'vulcan',
  native: 'vulcan://',
});

function extractCode(url: string | null): string | null {
  if (!url) return null;
  const params = new URL(url).searchParams;
  return params.get('code');
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) return { error: friendlyAuthError(error) };
    if (!data.url) return { error: 'Could not start Google sign-in. Please try again.' };
    console.log('[oauth] authorize URL:', data.url);

    // openAuthSessionAsync can miss the custom-scheme redirect on Android
    // dev builds (returns 'cancel' even though the deep link fired), so we
    // also capture the redirect via Linking as a fallback.
    let settled = false;
    let resolveLink: (url: string | null) => void = () => {};
    const linkPromise = new Promise<string | null>((r) => {
      resolveLink = r;
    });
    const sub = Linking.addEventListener('url', (event) => {
      if (settled) return;
      settled = true;
      resolveLink(event.url);
    });
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolveLink(null);
      }
    }, 60000);

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
    clearTimeout(timer);

    let authUrl: string | null = null;
    if (result.type === 'success') {
      authUrl = result.url;
      sub.remove();
    } else {
      authUrl = await linkPromise;
      sub.remove();
    }
    console.log(
      '[oauth] authSession result:',
      result.type,
      '| deep-link fallback:',
      authUrl ? `captured (${authUrl.slice(0, 24)}…)` : 'none',
    );

    const code = extractCode(authUrl);
    if (!code) {
      return {
        error:
          'Google sign-in did not complete. If it returned unexpectedly, make sure ' +
          'the redirect URL "vulcan://" is added to Supabase → Authentication → URL Configuration.',
      };
    }

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) return { error: friendlyAuthError(exchangeError) };

    return { error: null };
  } catch (e) {
    console.error('[oauth] signInWithGoogle threw:', e);
    return { error: e instanceof Error ? e.message : 'Unexpected error during Google sign-in.' };
  }
}