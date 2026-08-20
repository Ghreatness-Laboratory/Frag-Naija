import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FragNaija - Everything Esports. One Platform.',
    short_name: 'FragNaija',
    description: "Nigeria's premier esports platform. Everything Esports. One Platform.",
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
