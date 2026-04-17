'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-sm border border-fn-gborder bg-fn-card">
        <WifiOff size={32} className="text-fn-muted" />
      </div>

      <div className="fn-label mb-2 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-fn-red" /> OFFLINE
      </div>

      <h1 className="font-display text-4xl font-black uppercase tracking-tight text-fn-text sm:text-5xl">
        NO CONNECTION
      </h1>

      <p className="mt-3 max-w-xs text-[11px] leading-relaxed text-fn-muted">
        Frag Naija can&apos;t reach the server right now. Check your network and try again — cached pages remain available.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="fn-btn mt-8 flex items-center gap-2"
      >
        <RefreshCw size={13} /> RETRY CONNECTION
      </button>

      <p className="mt-4 text-[9px] text-fn-muted">
        Cached pages (Home, Tournaments, Select Game) are still accessible offline.
      </p>
    </div>
  );
}
