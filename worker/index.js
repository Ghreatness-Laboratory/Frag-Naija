/**
 * Custom Service Worker additions — merged into the next-pwa generated SW.
 * Workbox handles all caching; this file handles push notifications.
 */

// Take over immediately and remove the runtime caches created by previous
// releases, which could contain stale HTML documents. Workbox receives the
// same lifecycle settings through next.config.mjs; these explicit handlers
// also cover this custom worker code.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      'start-url',
      'fn-pages-v1',
      'fn-pages-v2',
    ].map((cacheName) => caches.delete(cacheName)))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Frag Naija', {
      body:    data.body  ?? 'You have a new update.',
      icon:    data.icon  ?? '/logo-icon.jpeg',
      badge:   data.badge ?? '/icons/icon.svg',
      tag:     data.tag   ?? data.tournamentMatchId ?? data.matchResultId ?? 'fn-notification',
      renotify: true,
      actions: data.tournamentMatchId || data.matchResultId ? [{ action: 'mute-match', title: 'Mute this match' }] : [],
      data:    { url: data.url ?? '/', tournamentMatchId: data.tournamentMatchId ?? '', matchResultId: data.matchResultId ?? '' },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'mute-match') {
    const { tournamentMatchId, matchResultId } = event.notification.data ?? {};
    event.waitUntil(fetch('/api/notifications/match-subscriptions', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tournament_match_id: tournamentMatchId || null, match_result_id: matchResultId || null, subscribed: false }),
    }).catch(() => null));
    return;
  }
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
