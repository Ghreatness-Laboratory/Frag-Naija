'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallbackPage() {
  useEffect(() => {
    async function handleCallback() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Supabase implicit flow puts tokens in the URL hash fragment
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        // Parse the hash fragment
        const params = new URLSearchParams(hash.substring(1));
        const access_token  = params.get('access_token');
        const refresh_token = params.get('refresh_token');

        if (access_token) {
          // Set the session in Supabase client
          await supabase.auth.setSession({ access_token, refresh_token: refresh_token ?? '' });

          // Set the httpOnly cookie via our API
          await fetch('/api/auth/session', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ access_token }),
          });

          window.location.href = '/';
          return;
        }
      }

      // PKCE flow — code in query params
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error || !data?.session) {
          window.location.href = '/login?error=oauth_failed';
          return;
        }
        await fetch('/api/auth/session', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ access_token: data.session.access_token }),
        });
        window.location.href = '/';
        return;
      }

      // Neither — something went wrong
      window.location.href = '/login?error=oauth_failed';
    }

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-fn-black flex items-center justify-center">
      <div className="space-y-3 text-center">
        <div className="w-8 h-8 border-2 border-fn-green border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-fn-muted text-sm uppercase tracking-widest">Completing sign in...</p>
      </div>
    </div>
  );
}
