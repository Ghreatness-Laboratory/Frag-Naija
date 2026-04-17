/**
 * Frag Naija — Service Worker
 *
 * Caching strategy:
 *  /_next/static/*  → cache-first  (content-hashed, safe to keep forever)
 *  /icons /logos    → cache-first  (static assets)
 *  navigation       → network-first with cache fallback → /offline
 *  /api/*           → network-only (never cache live data)
 *  everything else  → network-first
 */

const VER           = 'v1';
const STATIC_CACHE  = `fn-static-${VER}`;
const PAGES_CACHE   = `fn-pages-${VER}`;
const OFFLINE_PAGE  = '/offline';

const PRECACHE = [
  OFFLINE_PAGE,
  '/select-game',
  '/icons/icon.svg',
  '/icons/icon-maskable.svg',
  '/logos/pubg-mobile.svg',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate — purge stale caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('fn-') && k !== STATIC_CACHE && k !== PAGES_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin GETs
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Never cache API calls — always go to network
  if (url.pathname.startsWith('/api/')) return;

  // Next.js RSC / HMR internal paths — network only in dev, cache-first in prod
  if (url.pathname.startsWith('/_next/webpack-hmr')) return;

  // Next.js immutable static assets
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Static public assets (icons, logos, fonts)
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/logos/') ||
    url.pathname.match(/\.(woff2?|ttf|otf|eot)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML page navigation — network first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigateFetch(request));
    return;
  }

  // Everything else — network first
  event.respondWith(networkFirst(request, PAGES_CACHE));
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Frag Naija', {
      body:    data.body    ?? 'You have a new update.',
      icon:    '/icons/icon.svg',
      badge:   '/icons/icon.svg',
      tag:     data.tag     ?? 'fn-notification',
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

// ── Helpers ───────────────────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const offline = await caches.match(OFFLINE_PAGE);
    return offline ?? new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_PAGE);
    return offline ?? new Response('Offline', { status: 503 });
  }
}

async function navigateFetch(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_PAGE);
    return offline ?? new Response('You are offline', { status: 503, headers: { 'Content-Type': 'text/html' } });
  }
}
