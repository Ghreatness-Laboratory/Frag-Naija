import { firebaseConfigScript } from '@/lib/firebaseConfig';

export const dynamic = 'force-static';

export async function GET() {
  const body = `${firebaseConfigScript}
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
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
    const existing = wins.find((client) => client.url.includes(target));
    if (existing) return existing.focus();
    return clients.openWindow(target);
  }));
});
`;
  return new Response(body, { headers: { 'content-type': 'application/javascript; charset=utf-8', 'service-worker-allowed': '/' } });
}
