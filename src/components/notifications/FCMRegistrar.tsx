'use client';

import { useEffect } from 'react';
import { firebaseConfig } from '@/lib/firebaseConfig';

type FirebaseCompat = { apps: unknown[]; initializeApp: (config: Record<string, unknown>) => void; messaging: () => { getToken: (options: { vapidKey: string; serviceWorkerRegistration: ServiceWorkerRegistration }) => Promise<string> } };

const FCM_SERVICE_WORKER_URL = '/firebase-messaging-sw.js';
const FCM_SERVICE_WORKER_SCOPE = '/firebase-cloud-messaging-push-scope';
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
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey || !('Notification' in window) || Notification.permission !== 'granted' || !('serviceWorker' in navigator)) return;
      await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
      await loadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');
      const firebase = window.firebase;
      if (!firebase) return;
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      const messaging = firebase.messaging();
      // Register Firebase Messaging with its own narrow scope so it does not
      // replace the app's offline PWA worker registered at /sw.js with scope /.
      const registration = await navigator.serviceWorker.register(FCM_SERVICE_WORKER_URL, {
        scope: FCM_SERVICE_WORKER_SCOPE,
      });
      const token = await messaging.getToken({ vapidKey, serviceWorkerRegistration: registration }).catch(() => '');
      if (token) await fetch('/api/notifications/register-token', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    }
    register().catch(() => {});
  }, []);
  return null;
}
