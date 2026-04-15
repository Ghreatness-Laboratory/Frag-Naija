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

      // Exchange the code in the URL for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      );

      if (error || !data?.session) {
        console.error('OAuth callback error:', error?.message);
        window.location.href = '/login?error=oauth_failed';
        return;
      }

      // Set the httpOnly cookie via our API
      await fetch('/api/auth/session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ access_token: data.session.access_token }),
      });

      window.location.href = '/';
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
