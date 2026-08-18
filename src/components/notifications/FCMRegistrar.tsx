'use client';

import { useCallback, useEffect } from 'react';
import { firebaseConfig, firebaseVapidKey } from '@/lib/firebaseConfig';

type FirebaseCompat = { apps: unknown[]; initializeApp: (config: typeof firebaseConfig) => void; messaging: () => { getToken: (options: { vapidKey: string; serviceWorkerRegistration: ServiceWorkerRegistration }) => Promise<string> } };
declare global { interface Window { firebase?: FirebaseCompat } }

const FCM_REFRESH_EVENT = 'fn-refresh-fcm-token';

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Unable to load ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureFirebase() {
  await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
  await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');
  const firebase = window.firebase;
  if (!firebase) return null;
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  return firebase;
}

export default function FCMRegistrar() {
  const registerToken = useCallback(async () => {
    if (!firebaseVapidKey || !('Notification' in window) || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return;
    const firebase = await ensureFirebase();
    if (!firebase) return;
    const messagingRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    const token = await firebase.messaging().getToken({ vapidKey: firebaseVapidKey, serviceWorkerRegistration: messagingRegistration }).catch(() => '');
    if (token) await fetch('/api/notifications/register-token', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
  }, []);

  useEffect(() => {
    registerToken().catch(() => {});
    const refresh = () => registerToken().catch(() => {});
    window.addEventListener(FCM_REFRESH_EVENT, refresh);
    navigator.serviceWorker?.addEventListener?.('controllerchange', refresh);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
    return () => window.removeEventListener(FCM_REFRESH_EVENT, refresh);
  }, [registerToken]);

  return null;
}
