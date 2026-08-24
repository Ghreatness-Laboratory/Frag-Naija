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
        source: '/api/homepage-data',
        headers: [{ key: 'Cache-Control', value: 'public, s-maxage=120, stale-while-revalidate=300' }],
      },
    ];
  },
};

export default withPWA({
  dest: 'public',
  // Registration handled by PWARegister.tsx (more reliable in Next.js App Router)
  register: false,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: { document: '/offline' },
  customWorkerDir: 'worker',
  // Next's app build manifest can be unavailable during an atomic deployment
  // swap. It is not needed for offline navigation, so do not precache it.
  buildExcludes: [/app-build-manifest\.json$/],

  runtimeCaching: [
    {
      // Homepage data is semi-static and can be revalidated instead of fetched on every navigation.
      urlPattern: /^\/api\/homepage-data/i,
      handler: 'StaleWhileRevalidate',
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
      // All other pages — network-first, 10s timeout
      urlPattern: /^https?.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'fn-pages-v1',
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 60, maxAgeSeconds: 86400 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
  ],
})(nextConfig);
