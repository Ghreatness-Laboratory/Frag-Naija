'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

const NotificationsContext = createContext({ unreadCount: 0, refresh: () => {} });
export function useNotifications() { return useContext(NotificationsContext); }

export default function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<{ title: string; body: string; url: string } | null>(null);
  const lastIdRef = useRef<string | null>(null);

  const refresh = useCallback(async (showToast = false) => {
    const data = await fetch('/api/notifications', { credentials: 'include' }).then((r) => r.ok ? r.json() : null).catch(() => null);
    if (!data) return;
    setUnreadCount(data.unreadCount || 0);
    const newest = data.alerts?.[0];
    if (showToast && newest?.notification?.id && lastIdRef.current && newest.notification.id !== lastIdRef.current) {
      setToast({ title: `${newest.winner_name} WON — MVP: ${newest.mvp_name}`, body: newest.match_title, url: newest.notification.url || '/gaming-alerts' });
      window.setTimeout(() => setToast(null), 5200);
    }
    if (newest?.notification?.id) lastIdRef.current = newest.notification.id;
  }, []);

  useEffect(() => {
    refresh(false);
    const timer = window.setInterval(() => refresh(true), 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const value = useMemo(() => ({ unreadCount, refresh: () => refresh(false) }), [refresh, unreadCount]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      {toast && (
        <Link href={toast.url} className="fixed right-3 top-16 z-[70] w-[min(360px,calc(100vw-1.5rem))] border border-fn-green/50 bg-fn-card p-4 shadow-2xl shadow-fn-green/10 animate-slide-u">
          <p className="fn-label text-fn-green">Live Gaming Alert</p>
          <p className="mt-1 text-sm font-black uppercase tracking-widest text-fn-text">{toast.title}</p>
          <p className="mt-1 text-xs text-fn-muted">{toast.body}</p>
        </Link>
      )}
    </NotificationsContext.Provider>
  );
}
