import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
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

  runtimeCaching: [
    {
      // API routes — never cache live data
      urlPattern: /^\/api\/.*/i,
      handler: 'NetworkOnly',
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
      // Logo + icon assets (root and /icons/ /logos/ dirs)
      urlPattern: /^\/(?:icons|logos)\/|\/logo[^/]*\.(jpe?g|png|svg|webp)/i,
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
