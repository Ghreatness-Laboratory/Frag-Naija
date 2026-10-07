import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
  eslint:     { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  async headers() {
    return [
      {
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Content-Type',  value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, immutable' }],
      },
      {
        source: '/logos/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800, immutable' }],
      },
      {
        // Public content is fetched from API routes after page hydration. Keep
        // intermediaries (including the Vercel CDN) from retaining an older
        // response after an admin edit.
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0, must-revalidate' }],
      },
    ];
  },
};

export default withPWA({
  dest: 'public',
  // Registration handled by PWARegister.tsx (more reliable in Next.js App Router)
  register: false,
  // Version Workbox's cache namespace so this deployment cannot reuse caches
  // produced by earlier service-worker policies.
  cacheId: 'frag-naija-sw-v3',
  skipWaiting: true,
  clientsClaim: true,
  // The app shell is client-rendered and fetches admin-managed content from
  // the API. Caching `/` separately can keep an old deployment's app shell
  // active indefinitely, so never persist the start URL.
  cacheStartUrl: false,
  // next-pwa otherwise adds its own NetworkFirst `start-url` route whenever
  // this is true, even when cacheStartUrl is false.
  dynamicStartUrl: false,
  disable: process.env.NODE_ENV === 'development',
  customWorkerDir: 'worker',
  // Public files are precached by next-pwa. Exclude non-asset documentation;
  // page documents are never added to this manifest.
  publicExcludes: ['!noprecache/**/*', '!**/*.md'],
  // Next's app build manifest can be unavailable during an atomic deployment
  // swap. It is not needed for offline navigation, so do not precache it.
  buildExcludes: [/app-build-manifest\.json$/],

  runtimeCaching: [
    {
      // Homepage data includes admin-managed content, so bypass service-worker
      // caches and show changes as soon as the homepage refetches it.
      urlPattern: /^\/api\/homepage-data/i,
      handler: 'NetworkOnly',
      options: {},
    },
    {
      // API routes — keep live/account data uncached unless explicitly handled above.
      urlPattern: /^\/api\/.*/i,
      handler: 'NetworkOnly',
      options: {},
    },
    {
      // Next.js immutable static bundles
      urlPattern: /^\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fn-static-v1',
        expiration: { maxEntries: 300 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      // Logo, icon and player media assets (root and /icons/ /logos/ dirs)
      urlPattern: /^(?:\/)(?:icons|logos|uploads|athletes)\/|\/logo[^/]*\.(jpe?g|png|svg|webp)/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fn-assets-v1',
        expiration: { maxEntries: 80, maxAgeSeconds: 604800 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    {
      // Never cache HTML documents. These routes render database-managed
      // content, so a navigation must always reach the origin.
      urlPattern: /^https?.*/i,
      handler: 'NetworkOnly',
      options: {},
    },
  ],
})(nextConfig);
