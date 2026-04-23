export interface GameColors {
  primary: string;
  secondary: string;
  glow: string;
  border: string;
  cardBg: string;
}

export interface Game {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  colors: GameColors;
  logo: string;
  badge?: string;
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
      primary:   '#00FF41',           // matrix / terminal green
      secondary: '#00C8FF',           // tactical sky blue
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
      primary:   '#FFD700',           // military gold / prestige
      secondary: '#6B8E23',           // olive drab / army green
      glow:      'rgba(255, 215, 0, 0.35)',
      border:    'rgba(255, 215, 0, 0.40)',
      cardBg:    'rgba(255, 215, 0, 0.05)',
    },
    logo: '/logos/cod-mobile.svg',
    available: true,
  },
  {
    id: 'free-fire',
    slug: 'free-fire',
    name: 'Free Fire',
    shortName: 'Free Fire',
    description: 'Battle Royale — Survive the island, be the last.',
    colors: {
      primary:   '#FF4500',           // flame red-orange
      secondary: '#FF8C00',           // amber
      glow:      'rgba(255, 69, 0, 0.35)',
      border:    'rgba(255, 69, 0, 0.40)',
      cardBg:    'rgba(255, 69, 0, 0.05)',
    },
    logo: '/logos/free-fire.svg',
    available: true,
  },
  {
    id: 'ea-fc-26',
    slug: 'ea-fc-26',
    name: 'EA FC 26',
    shortName: 'EA FC 26',
    description: 'Football sim — Ultimate Team & Pro Clubs.',
    colors: {
      primary:   '#00D4FF',           // electric cyan (EA brand)
      secondary: '#FFB300',           // amber gold (stadium lights)
      glow:      'rgba(0, 212, 255, 0.35)',
      border:    'rgba(0, 212, 255, 0.40)',
      cardBg:    'rgba(0, 212, 255, 0.05)',
    },
    logo: '/logos/ea-fc-26.svg',
    available: true,
  },
  {
    id: 'mortal-kombat',
    slug: 'mortal-kombat',
    name: 'Mortal Kombat',
    shortName: 'MK',
    description: 'Fighting — Brutal kombat on the Nigerian stage.',
    colors: {
      primary:   '#CC0000',           // blood red
      secondary: '#E040FB',           // ultraviolet / chaos magic purple
      glow:      'rgba(204, 0, 0, 0.40)',
      border:    'rgba(204, 0, 0, 0.40)',
      cardBg:    'rgba(204, 0, 0, 0.05)',
    },
    logo: '/logos/mortal-kombat.svg',
    available: true,
  },
  {
    id: 'efootball',
    slug: 'efootball',
    name: 'eFootball',
    shortName: 'eFootball',
    description: 'Football — Realistic gameplay by Konami.',
    colors: {
      primary:   '#2196F3',           // Konami vivid blue
      secondary: '#4CAF50',           // pitch green
      glow:      'rgba(33, 150, 243, 0.35)',
      border:    'rgba(33, 150, 243, 0.40)',
      cardBg:    'rgba(33, 150, 243, 0.05)',
    },
    logo: '/logos/efootball.svg',
    available: true,
  },
  {
    id: 'mobile-legends',
    slug: 'mobile-legends',
    name: 'Mobile Legends',
    shortName: 'ML: BB',
    description: 'MOBA — 5v5 battles for the arena crown.',
    colors: {
      primary:   '#9C27B0',           // MLBB deep purple
      secondary: '#FFD600',           // hero gold
      glow:      'rgba(156, 39, 176, 0.35)',
      border:    'rgba(156, 39, 176, 0.40)',
      cardBg:    'rgba(156, 39, 176, 0.05)',
    },
    logo: '/logos/mobile-legends.svg',
    available: true,
  },
];

export const DEFAULT_GAME = GAMES[0];
