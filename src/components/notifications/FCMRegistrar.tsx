'use client';

import { useEffect } from 'react';

type FirebaseCompat = { apps: unknown[]; initializeApp: (config: Record<string, unknown>) => void; messaging: () => { getToken: (options: { vapidKey: string; serviceWorkerRegistration: ServiceWorkerRegistration }) => Promise<string> } };
declare global { interface Window { firebase?: FirebaseCompat } }

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

export default function FCMRegistrar() {
  useEffect(() => {
    async function register() {
      const configText = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!configText || !vapidKey || !('Notification' in window) || Notification.permission !== 'granted') return;
      await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');
      const firebase = window.firebase;
      if (!firebase) return;
      if (!firebase.apps.length) firebase.initializeApp(JSON.parse(configText));
      const messaging = firebase.messaging();
      const registration = await navigator.serviceWorker.ready;
      const token = await messaging.getToken({ vapidKey, serviceWorkerRegistration: registration }).catch(() => '');
      if (token) await fetch('/api/notifications/register-token', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    }
    register().catch(() => {});
  }, []);
  return null;
}
