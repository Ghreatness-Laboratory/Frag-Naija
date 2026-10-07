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
      { src: '/therealfavicon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/therealfavicon.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    shortcuts: [
      {
        name: 'Wager Zone',
        short_name: 'Wager',
        description: 'Open live wager markets',
        url: '/wager',
        icons: [{ src: '/therealfavicon.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Tournaments',
        short_name: 'Tournaments',
        description: 'Browse active tournaments',
        url: '/tournaments',
        icons: [{ src: '/therealfavicon.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
    screenshots: [],
  };
}
