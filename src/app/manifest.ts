import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Frag Naija — Tactical Command Interface',
    short_name: 'Frag Naija',
    description: "Nigeria's premier esports platform. Compete, wager, and dominate.",
    start_url: '/',
    id: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#00ff41',
    orientation: 'portrait-primary',
    categories: ['games', 'sports', 'entertainment'],
    lang: 'en-NG',
    dir: 'ltr',
    icons: [
      { src: '/logo-icon.jpeg', sizes: '192x192', type: 'image/jpeg', purpose: 'any' },
      { src: '/logo-icon.jpeg', sizes: '512x512', type: 'image/jpeg', purpose: 'any' },
      { src: '/logo-icon.jpeg', sizes: '512x512', type: 'image/jpeg', purpose: 'maskable' },
      { src: '/icons/icon.svg',          sizes: 'any', type: 'image/svg+xml', purpose: 'any'      },
      { src: '/icons/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Wager Zone',
        short_name: 'Wager',
        description: 'Open live wager markets',
        url: '/wager',
        icons: [{ src: '/icons/shortcut-wager.svg', sizes: 'any' }],
      },
      {
        name: 'Tournaments',
        short_name: 'Tournaments',
        description: 'Browse active tournaments',
        url: '/tournaments',
        icons: [{ src: '/icons/shortcut-tournament.svg', sizes: 'any' }],
      },
    ],
    screenshots: [],
  };
}
