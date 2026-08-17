export interface GameColors {
  primary: string;
  secondary: string;
  glow: string;
  border: string;
  cardBg: string;
}

export type AthleteSubtitleFormat = 'role_team' | 'player_only';

export type GameModeVariant = 'Teams' | 'Players' | 'Custom Players' | 'Player';
export type GameModeStatus = 'live' | 'locked-tbd';

export interface GameMode {
  key: string;
  label: string;
  variant?: GameModeVariant;
  status: GameModeStatus;
  route?: string;
}

export interface Game {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  colors: GameColors;
  logo: string;
  athleteSubtitleFormat: AthleteSubtitleFormat;
  badge?: string;
  available: boolean;
  modes: GameMode[];
  hasModeMenu: boolean;
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
    athleteSubtitleFormat: 'role_team',
    badge: 'FEATURED',
    available: true,
    hasModeMenu: true,
    modes: [
      { key: 'tdm_1v1', label: 'TDM 1V1', variant: 'Players', status: 'live', route: '/games/tdm-1v1' },
      { key: 'wow_team_4v4', label: 'WOW Mode 4v4 Team', variant: 'Teams', status: 'live', route: '/games/wow-4v4' },
      { key: 'wow_team_3v3', label: 'WOW Mode 3v3 Team', variant: 'Teams', status: 'locked-tbd' },
      { key: 'wow_team_2v3', label: 'WOW Mode 2v3 Team', variant: 'Teams', status: 'locked-tbd' },
      { key: 'wow_player_4v4', label: 'WOW Mode 4v4 Player', variant: 'Players', status: 'locked-tbd' },
      { key: 'wow_player_2v2', label: 'WOW Mode 2v2 Player', variant: 'Players', status: 'locked-tbd' },
      { key: 'wow_player_3v3', label: 'WOW Mode 3v3 Player', variant: 'Players', status: 'locked-tbd' },
      { key: 'fantasy_league', label: 'Fantasy League', variant: 'Players', status: 'live', route: '/fantasy-league' },
    ],
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
    athleteSubtitleFormat: 'role_team',
    available: true,
    hasModeMenu: true,
    modes: [
      { key: 'team_tdm_4v4_teams', label: 'Team TDM 4v4 — Teams', variant: 'Teams', status: 'locked-tbd' },
      { key: 'tdm_4v4_players', label: 'TDM 4v4 — Players', variant: 'Players', status: 'locked-tbd' },
      { key: 'tdm_1v1', label: 'TDM 1v1', variant: 'Players', status: 'live', route: '/games/tdm-1v1' },
      { key: 'fantasy_league', label: 'Fantasy League', variant: 'Players', status: 'locked-tbd' },
    ],
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
    athleteSubtitleFormat: 'role_team',
    available: true,
    hasModeMenu: true,
    modes: [
      { key: 'clash_squad_4v4_teams', label: 'Clash Squad 4v4 — Teams', variant: 'Teams', status: 'locked-tbd' },
      { key: 'clash_squad_4v4_players', label: 'Clash Squad 4v4 — Players', variant: 'Players', status: 'locked-tbd' },
      { key: 'clash_squad_2v2_teams', label: 'Clash Squad 2v2 — Teams', variant: 'Teams', status: 'locked-tbd' },
      { key: 'clash_squad_2v2_players', label: 'Clash Squad 2v2 — Players', variant: 'Players', status: 'locked-tbd' },
      { key: 'tdm_1v1', label: 'TDM 1v1', variant: 'Players', status: 'live', route: '/games/tdm-1v1' },
      { key: 'fantasy_league', label: 'Fantasy League', variant: 'Players', status: 'locked-tbd' },
    ],
  },
  {
    id: 'fc-mobile',
    slug: 'fc-mobile',
    name: 'FC Mobile',
    shortName: 'FC Mobile',
    description: 'Mobile football — Build squads and dominate the pitch.',
    colors: {
      primary:   '#14F195',
      secondary: '#1D4ED8',
      glow:      'rgba(20, 241, 149, 0.35)',
      border:    'rgba(20, 241, 149, 0.40)',
      cardBg:    'rgba(20, 241, 149, 0.05)',
    },
    logo: '/logos/fc-mobile.svg',
    athleteSubtitleFormat: 'player_only',
    available: true,
    hasModeMenu: true,
    modes: [
      { key: 'virtual_match_1v1', label: 'Virtual Match 1v1', variant: 'Player', status: 'locked-tbd' },
    ],
  },
  {
    id: 'blood-strike',
    slug: 'blood-strike',
    name: 'Blood Strike',
    shortName: 'Blood Strike',
    description: 'Battle Royale shooter — Fast squads and tactical strikes.',
    colors: {
      primary:   '#FF1744',
      secondary: '#FFB000',
      glow:      'rgba(255, 23, 68, 0.35)',
      border:    'rgba(255, 23, 68, 0.40)',
      cardBg:    'rgba(255, 23, 68, 0.05)',
    },
    logo: '/logos/blood-strike.svg',
    athleteSubtitleFormat: 'role_team',
    available: true,
    hasModeMenu: true,
    modes: [
      { key: 'blood_strike_squad_4v4_teams', label: 'Squad Strike 4v4 — Teams', variant: 'Teams', status: 'locked-tbd' },
      { key: 'blood_strike_squad_4v4_players', label: 'Squad Strike 4v4 — Players', variant: 'Players', status: 'locked-tbd' },
      { key: 'tdm_1v1', label: 'TDM 1v1', variant: 'Players', status: 'live', route: '/games/tdm-1v1' },
      { key: 'fantasy_league', label: 'Fantasy League', variant: 'Players', status: 'locked-tbd' },
    ],
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
    athleteSubtitleFormat: 'player_only',
    available: true,
    hasModeMenu: true,
    modes: [
      { key: 'virtual_match_1v1', label: 'Virtual Match 1v1', variant: 'Player', status: 'locked-tbd' },
    ],
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
    athleteSubtitleFormat: 'player_only',
    available: true,
    hasModeMenu: false,
    modes: [],
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
    athleteSubtitleFormat: 'player_only',
    available: true,
    hasModeMenu: true,
    modes: [
      { key: 'virtual_match_1v1', label: 'Virtual Match 1v1', variant: 'Player', status: 'locked-tbd' },
    ],
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
    athleteSubtitleFormat: 'role_team',
    available: true,
    hasModeMenu: true,
    modes: [
      { key: 'competitive_team_5v5_teams', label: 'Competitive Team 5v5 — Teams', variant: 'Teams', status: 'locked-tbd' },
      { key: 'competitive_players_5v5_custom', label: 'Competitive Players 5v5 — Custom Players', variant: 'Custom Players', status: 'locked-tbd' },
      { key: 'fantasy_league', label: 'Fantasy League', variant: 'Players', status: 'locked-tbd' },
    ],
  },
];

export const DEFAULT_GAME = GAMES[0];


export function getAthleteSubtitleFormat(gameSlug?: string | null): AthleteSubtitleFormat {
  return GAMES.find((game) => game.slug === String(gameSlug ?? '').toLowerCase())?.athleteSubtitleFormat ?? 'role_team';
}

export function formatAthleteSubtitle({
  gameSlug,
  role,
  teamName,
}: {
  gameSlug?: string | null;
  role?: string | null;
  teamName?: string | null;
}) {
  const displayRole = role || 'Player';
  if (getAthleteSubtitleFormat(gameSlug) === 'player_only') return displayRole;
  return `${displayRole} / ${teamName || 'Free Agent'}`;
}
