/* eslint-disable no-undef */
// Firebase Messaging service worker served as a static asset from /public.
// Service workers cannot read Next.js process.env at runtime, so this public
// Firebase web app config is intentionally embedded here to match
// src/lib/firebaseConfig.js (project: frag-naija-21727).
self.FN_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyC5ogLf-T8RSp-R4QRiGH6X8iwR09F-L7k',
  authDomain: 'frag-naija-21727.firebaseapp.com',
  projectId: 'frag-naija-21727',
  storageBucket: 'frag-naija-21727.firebasestorage.app',
  messagingSenderId: '1048178503639',
  appId: '1:1048178503639:web:25eed49e40924d16e92592',
  measurementId: 'G-8Z62HFQMR2',
};

importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');

firebase.initializeApp(self.FN_FIREBASE_CONFIG);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const notification = payload.notification || {};

  self.registration.showNotification(notification.title || data.title || 'Frag Naija', {
    body: notification.body || data.body || 'You have a new Gaming Alert.',
    icon: notification.icon || '/icons/icon.svg',
    badge: '/icons/icon.svg',
    tag: data.tag || 'fn-gaming-alert',
    data: { url: data.url || '/gaming-alerts' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const target = event.notification.data?.url || '/gaming-alerts';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      const existing = wins.find((client) => client.url.includes(target));
      if (existing) return existing.focus();
      return clients.openWindow(target);
    })
  );
});
