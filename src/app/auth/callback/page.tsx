'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function AuthCallbackPage() {
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        // Send the token to our API to set the httpOnly cookie
        await fetch('/api/auth/session', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ access_token: session.access_token }),
        });
        window.location.href = '/';
      }
    });

    // Also handle the code exchange for the current URL
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await fetch('/api/auth/session', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ access_token: session.access_token }),
        });
        window.location.href = '/';
      }
    });
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
