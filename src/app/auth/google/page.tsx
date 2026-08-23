'use client';

import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function GoogleAuthPage() {
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) return;

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey
    );

    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
  }, []);

  return (
    <div className="min-h-screen bg-fn-black flex items-center justify-center">
      <div className="text-fn-muted text-sm uppercase tracking-widest animate-pulse">
        Redirecting to Google...
      </div>
    </div>
  );
}
