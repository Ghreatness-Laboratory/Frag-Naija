export interface GameColors {
  /** Neon/primary brand colour (hex) */
  primary: string;
  /** Supporting colour (hex) */
  secondary: string;
  /** box-shadow glow value */
  glow: string;
  /** rgba border colour */
  border: string;
  /** card background tint (rgba) */
  cardBg: string;
}

export interface Game {
  id: string;
  slug: string;
  name: string;
  /** Abbreviated label used on small surfaces */
  shortName: string;
  description: string;
  colors: GameColors;
  /** Path relative to /public — replace with real logo when available */
  logo: string;
  /** Optional badge text shown on the card (e.g. "FEATURED") */
  badge?: string;
  /** Only PUBG Mobile is live; all others are Coming Soon */
  available: boolean;
}

export const GAMES: Game[] = [
  {
    id: 'pubg-mobile',
    slug: 'pubg-mobile',
    name: 'PUBG Mobile',
    shortName: 'PUBG',
    description: 'Battle Royale — 100 players, one survivor.',
    colors: {
      primary:   '#00ff41',
      secondary: '#ffffff',
      glow:      'rgba(0, 255, 65, 0.35)',
      border:    'rgba(0, 255, 65, 0.40)',
      cardBg:    'rgba(0, 255, 65, 0.05)',
    },
    logo: '/logos/pubg-mobile.svg',
    badge: 'FEATURED',
    available: true,
  },
  {
    id: 'cod-mobile',
    slug: 'cod-mobile',
    name: 'Call of Duty Mobile',
    shortName: 'COD Mobile',
    description: 'FPS — Ranked multiplayer & Battle Royale.',
    colors: {
      primary:   '#FF6B00',
      secondary: '#1A2B47',
      glow:      'rgba(255, 107, 0, 0.35)',
      border:    'rgba(255, 107, 0, 0.40)',
      cardBg:    'rgba(255, 107, 0, 0.05)',
    },
    logo: '/logos/cod-mobile.svg',
    available: false,
  },
  {
    id: 'free-fire',
    slug: 'free-fire',
    name: 'Free Fire',
    shortName: 'Free Fire',
    description: 'Battle Royale — Survive the island, be the last.',
    colors: {
      primary:   '#FF4500',
      secondary: '#FF8C00',
      glow:      'rgba(255, 69, 0, 0.35)',
      border:    'rgba(255, 69, 0, 0.40)',
      cardBg:    'rgba(255, 69, 0, 0.05)',
    },
    logo: '/logos/free-fire.svg',
    available: false,
  },
  {
    id: 'ea-fc-26',
    slug: 'ea-fc-26',
    name: 'EA FC 26',
    shortName: 'EA FC 26',
    description: 'Football sim — Ultimate Team & Pro Clubs.',
    colors: {
      primary:   '#00B4D8',
      secondary: '#023E8A',
      glow:      'rgba(0, 180, 216, 0.35)',
      border:    'rgba(0, 180, 216, 0.40)',
      cardBg:    'rgba(0, 180, 216, 0.05)',
    },
    logo: '/logos/ea-fc-26.svg',
    available: false,
  },
  {
    id: 'mortal-kombat',
    slug: 'mortal-kombat',
    name: 'Mortal Kombat',
    shortName: 'MK',
    description: 'Fighting — Brutal kombat on the Nigerian stage.',
    colors: {
      primary:   '#CC0000',
      secondary: '#8B0000',
      glow:      'rgba(204, 0, 0, 0.40)',
      border:    'rgba(204, 0, 0, 0.40)',
      cardBg:    'rgba(204, 0, 0, 0.05)',
    },
    logo: '/logos/mortal-kombat.svg',
    available: false,
  },
  {
    id: 'efootball',
    slug: 'efootball',
    name: 'eFootball',
    shortName: 'eFootball',
    description: 'Football — Realistic gameplay by Konami.',
    colors: {
      primary:   '#0080FF',
      secondary: '#00CC66',
      glow:      'rgba(0, 128, 255, 0.35)',
      border:    'rgba(0, 128, 255, 0.40)',
      cardBg:    'rgba(0, 128, 255, 0.05)',
    },
    logo: '/logos/efootball.svg',
    available: false,
  },
  {
    id: 'mobile-legends',
    slug: 'mobile-legends',
    name: 'Mobile Legends',
    shortName: 'ML: BB',
    description: 'MOBA — 5v5 battles for the arena crown.',
    colors: {
      primary:   '#C084FC',
      secondary: '#FFD700',
      glow:      'rgba(192, 132, 252, 0.35)',
      border:    'rgba(192, 132, 252, 0.40)',
      cardBg:    'rgba(192, 132, 252, 0.05)',
    },
    logo: '/logos/mobile-legends.svg',
    available: false,
  },
];

/** The default/featured game — always PUBG Mobile */
export const DEFAULT_GAME = GAMES[0];
