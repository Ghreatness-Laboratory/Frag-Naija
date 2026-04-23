'use client';

import { useEffect } from 'react';

export default function AuthCallbackPage() {
  useEffect(() => {
    // Forward to the server-side callback handler with the full query string
    const params = window.location.search;
    window.location.replace(`/api/auth/callback${params}`);
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
