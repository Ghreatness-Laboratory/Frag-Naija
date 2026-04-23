'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallbackPage() {
  useEffect(() => {
    async function handleCallback() {
      const hash   = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      const code   = params.get('code');

      // PKCE flow — forward to server route
      if (code) {
        window.location.replace(`/api/auth/callback?code=${code}`);
        return;
      }

      // Implicit flow — token is in the hash
      if (hash && hash.includes('access_token')) {
        const hashParams = new URLSearchParams(hash.slice(1));
        const access_token = hashParams.get('access_token');

        if (!access_token) {
          window.location.replace('/login?error=missing_token');
          return;
        }

        // Verify token and set httpOnly cookie via session API
        const res = await fetch('/api/auth/session', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ access_token }),
        });

        if (!res.ok) {
          window.location.replace('/login?error=session_failed');
          return;
        }

        window.location.replace('/');
        return;
      }

      // No token or code — something went wrong
      const error = params.get('error') || 'unknown';
      window.location.replace(`/login?error=${error}`);
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
