import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Frag Naija — Tactical Command Interface',
    short_name: 'Frag Naija',
    description: "Nigeria's premier esports platform. Compete, wager, and dominate.",
    start_url: '/',
    id: '/',
    display: 'standalone',
    background_color: '#040904',
    theme_color: '#00ff41',
    orientation: 'portrait-primary',
    categories: ['games', 'sports', 'entertainment'],
    lang: 'en-NG',
    dir: 'ltr',
    icons: [
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      // PNG fallbacks — generate with: npx svgexport public/icons/icon.svg public/icons/icon-192.png 192:192
      // { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      // { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
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
