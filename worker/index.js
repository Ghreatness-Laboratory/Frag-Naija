/**
 * Custom Service Worker additions — merged into the next-pwa generated SW.
 * Workbox handles all caching; this file handles push notifications.
 */

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Frag Naija', {
      body:    data.body  ?? 'You have a new update.',
      icon:    '/icons/icon.svg',
      badge:   '/icons/icon.svg',
      tag:     data.tag   ?? 'fn-notification',
      data:    { url: data.url ?? '/' },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url ?? '/';
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((wins) => {
        const existing = wins.find((w) => w.url.includes(target));
        if (existing) return existing.focus();
        return clients.openWindow(target);
      })
  );
});
