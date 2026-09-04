import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}

const PKCE_VERIFIER_COOKIE = 'frag-naija-oauth-code-verifier';

function getCookie(name) {
  if (typeof document === 'undefined') return null;

  const prefix = `${name}=`;
  return document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length) ?? null;
}

const browserStorage = {
  getItem(key) {
    if (key.endsWith('-code-verifier')) {
      const value = getCookie(PKCE_VERIFIER_COOKIE);
      return value ? decodeURIComponent(value) : null;
    }

    return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  },
  setItem(key, value) {
    if (key.endsWith('-code-verifier')) {
      document.cookie = `${PKCE_VERIFIER_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=600; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
      return;
    }

    window.localStorage.setItem(key, value);
  },
  removeItem(key) {
    if (key.endsWith('-code-verifier')) {
      document.cookie = `${PKCE_VERIFIER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
      return;
    }

    window.localStorage.removeItem(key);
  },
};

// Browser-side client (uses anon key, respects RLS). The PKCE verifier is kept
// in a short-lived cookie so the server-side OAuth callback can exchange it.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: 'pkce', storage: browserStorage },
});
