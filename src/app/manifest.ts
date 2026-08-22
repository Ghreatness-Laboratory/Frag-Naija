import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FragNaija',
    short_name: 'FragNaija',
    description: 'Everything Esports - One Platform',
    start_url: '/',
    id: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#007a1a',
    orientation: 'portrait-primary',
    categories: ['games', 'sports', 'entertainment'],
    lang: 'en-NG',
    dir: 'ltr',
    icons: [
      { src: '/icons/fn-badge.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/fn-badge-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/fn-badge-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Wager Zone',
        short_name: 'Wager',
        description: 'Open live wager markets',
        url: '/wager',
        icons: [{ src: '/icons/fn-badge-192.svg', sizes: '192x192', type: 'image/svg+xml' }],
      },
      {
        name: 'Tournaments',
        short_name: 'Tournaments',
        description: 'Browse active tournaments',
        url: '/tournaments',
        icons: [{ src: '/icons/fn-badge-192.svg', sizes: '192x192', type: 'image/svg+xml' }],
      },
    ],
    screenshots: [],
  };
}
