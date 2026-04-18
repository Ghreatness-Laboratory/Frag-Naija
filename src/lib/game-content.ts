/**
 * Game-specific dummy content.
 * Keyed by game slug. Pages use this when the API returns no data for the
 * active game, giving every game a realistic first-run experience.
 */

// ─── Shared mini-types (match the API shape each page expects) ────────────────

export type DummyTournament = {
  id: string; name: string; game: string; prize_pool: number | null;
  currency: string; start_date: string | null; end_date: string | null;
  status: string; format: string | null; region: string; image_url: null;
};

export type DummyAthlete = {
  id: string; name: string; ign: string; team: string | null;
  role: string | null; overall_rating: number;
  attack: number; defense: number; clutch: number; survival: number;
  iq: number; aggression: number;
  kills: number; assists: number; damage: number; winrate: number;
  photo_url: null; status: string; bio: string | null;
  perks: string[]; strengths: string[]; weaknesses: string[];
};

export type DummyTeam = {
  id: string; name: string; logo_url: null; region: string | null;
  wins: number; losses: number; kills: number; bio: string | null;
  rank: number | null; strength: number | null;
  achievements: string[];
  players: { id: string; name: string; ign: string; role: string | null; overall_rating: number; photo_url: null; status: string }[];
};

export type DummyTransfer = {
  id: string; from_team: string | null; to_team: string | null;
  fee: number | null; status: string; date: string | null;
  notes: string | null;
  athletes: { id: string; name: string; ign: string } | null;
};

export type DummyHighlight = {
  id: string; title: string; category: string; duration: string;
  views: string; ago: string; featured?: boolean;
  tags: string[];
};

export type GameDummyContent = {
  tournaments: DummyTournament[];
  athletes: DummyAthlete[];
  teams: DummyTeam[];
  transfers: DummyTransfer[];
  highlights: DummyHighlight[];
};

// ─── FREE FIRE ────────────────────────────────────────────────────────────────

const freeFire: GameDummyContent = {
  tournaments: [
    {
      id: 'ff-t1', name: 'Free Fire Nigeria Open 2025', game: 'Free Fire',
      prize_pool: 5000000, currency: 'NGN', status: 'Live',
      format: 'Squad — Bermuda', region: 'Lagos',
      start_date: '2025-04-10', end_date: '2025-04-20', image_url: null,
    },
    {
      id: 'ff-t2', name: 'Lagos Clash Squad Cup', game: 'Free Fire',
      prize_pool: 2500000, currency: 'NGN', status: 'Upcoming',
      format: 'Clash Squad', region: 'Lagos',
      start_date: '2025-05-01', end_date: '2025-05-03', image_url: null,
    },
    {
      id: 'ff-t3', name: 'FF Pro League Nigeria — Season 4', game: 'Free Fire',
      prize_pool: 10000000, currency: 'NGN', status: 'Upcoming',
      format: 'Squad — Kalahari', region: 'National',
      start_date: '2025-06-01', end_date: '2025-06-30', image_url: null,
    },
    {
      id: 'ff-t4', name: 'West Africa FF Championship 2024', game: 'Free Fire',
      prize_pool: 8000000, currency: 'NGN', status: 'Completed',
      format: 'Squad — All Maps', region: 'West Africa',
      start_date: '2024-11-10', end_date: '2024-11-17', image_url: null,
    },
  ],

  athletes: [
    {
      id: 'ff-a1', name: 'Chukwuemeka Obi', ign: 'BlazeKing_NG',
      team: 'Lagos Lions FF', role: 'Rush / Entry',
      overall_rating: 94, attack: 96, defense: 78, clutch: 91,
      survival: 72, iq: 85, aggression: 98,
      kills: 8.4, assists: 3.1, damage: 2840, winrate: 74,
      photo_url: null, status: 'Active',
      bio: 'Nigeria\'s most feared rusher. BlazeKing built his reputation on relentless hot-drop aggression and 1v4 clutch plays in Bermuda Finals 2024.',
      perks: ['Hot Drop Specialist', 'Gloo Wall Master', 'Clutch King'],
      strengths: ['Aggressive close-range combat', 'Peak mechanical skill', '1v4 clutch rate of 61%'],
      weaknesses: ['Overextends in late circles', 'Passive play drains focus'],
    },
    {
      id: 'ff-a2', name: 'Femi Adeyemi', ign: 'SniperGod_NG',
      team: 'Abuja Apex Gaming', role: 'Sniper / AWP',
      overall_rating: 91, attack: 88, defense: 82, clutch: 87,
      survival: 88, iq: 92, aggression: 74,
      kills: 6.2, assists: 4.5, damage: 2310, winrate: 69,
      photo_url: null, status: 'Active',
      bio: 'Precision-first player who controls long-range zones with Kar98 and AWM. SniperGod holds the record for most headshots in a single FF Pro League season.',
      perks: ['Long Range Dominator', 'Zone Reader', 'Headshot Machine'],
      strengths: ['Unmatched crosshair placement', 'Zone prediction', 'High damage output'],
      weaknesses: ['Vulnerable in close combat', 'Slow repositioning'],
    },
    {
      id: 'ff-a3', name: 'Ikenna Nwosu', ign: 'PhantomFF',
      team: 'PHC Raiders', role: 'IGL / Support',
      overall_rating: 89, attack: 79, defense: 88, clutch: 86,
      survival: 92, iq: 97, aggression: 68,
      kills: 4.8, assists: 7.2, damage: 1960, winrate: 71,
      photo_url: null, status: 'Active',
      bio: 'The chess player of Nigerian Free Fire. PhantomFF\'s rotations and zone reads have guided PHC Raiders to three consecutive top-3 finishes in national leagues.',
      perks: ['Circle Mastermind', 'Team Anchor', 'Information Broker'],
      strengths: ['Elite game sense', 'Calm under pressure', 'Rotation efficiency'],
      weaknesses: ['Below-average mechanical aim', 'Passive in early game'],
    },
    {
      id: 'ff-a4', name: 'Seun Balogun', ign: 'FlameShot_NG',
      team: 'Warri Wolves', role: 'Flanker',
      overall_rating: 87, attack: 91, defense: 74, clutch: 84,
      survival: 78, iq: 83, aggression: 93,
      kills: 7.1, assists: 2.9, damage: 2560, winrate: 62,
      photo_url: null, status: 'Active',
      bio: 'A devastating flanker known for appearing from unexpected angles. FlameShot\'s off-angle repositioning keeps opponents second-guessing every rotation.',
      perks: ['Ghost Flanker', 'Off-Angle Specialist', 'Silent Striker'],
      strengths: ['Unpredictable movement', 'High kill pressure', 'Creative positioning'],
      weaknesses: ['Sometimes isolates from squad', 'Poor loot prioritization'],
    },
    {
      id: 'ff-a5', name: 'Dele Martins', ign: 'SurvivX_NG',
      team: 'Lagos Lions FF', role: 'Support / Medic',
      overall_rating: 85, attack: 72, defense: 91, clutch: 80,
      survival: 96, iq: 89, aggression: 61,
      kills: 3.6, assists: 9.1, damage: 1540, winrate: 76,
      photo_url: null, status: 'Active',
      bio: 'The heartbeat of Lagos Lions. SurvivX leads the league in assists and keeps his squad alive through late-game circles where most supports fall apart.',
      perks: ['Medkit Express', 'Gloo Wall Engineer', 'Last-Circle Specialist'],
      strengths: ['Highest assist rate in league', 'Exceptional survive time', 'Squad enabler'],
      weaknesses: ['Low kill output', 'Dependent on team coordination'],
    },
    {
      id: 'ff-a6', name: 'Tochukwu Eze', ign: 'GhostFire_TZ',
      team: 'Kano Kings FF', role: 'Fragger / Rush',
      overall_rating: 83, attack: 89, defense: 71, clutch: 88,
      survival: 69, iq: 80, aggression: 95,
      kills: 7.8, assists: 2.4, damage: 2720, winrate: 58,
      photo_url: null, status: 'Active',
      bio: 'Raw aggression personified. GhostFire tops kill leaderboards most weekends but his squad needs to cover his aggressive tendencies in final circles.',
      perks: ['Kill Harvester', 'Hot Drop Veteran', 'CQC Specialist'],
      strengths: ['Top-tier kill numbers', 'Never backs down', 'High damage per round'],
      weaknesses: ['Inconsistent survival', 'Clashes with IGL calls'],
    },
  ],

  teams: [
    {
      id: 'ff-tm1', name: 'Lagos Lions FF', logo_url: null,
      region: 'South-West', wins: 34, losses: 8, kills: 412,
      rank: 1, strength: 94,
      bio: 'Nigeria\'s dominant Free Fire squad. Back-to-back FF Pro League champions known for elite Bermuda rotations and relentless rush plays.',
      achievements: ['FF Pro League S3 Champions', 'West Africa Top 2 — 2024', 'Booyah! Record: 34 in a Season'],
      players: [
        { id: 'ff-a1', name: 'Chukwuemeka Obi', ign: 'BlazeKing_NG', role: 'Rush / Entry', overall_rating: 94, photo_url: null, status: 'Active' },
        { id: 'ff-a5', name: 'Dele Martins', ign: 'SurvivX_NG', role: 'Support / Medic', overall_rating: 85, photo_url: null, status: 'Active' },
      ],
    },
    {
      id: 'ff-tm2', name: 'Abuja Apex Gaming', logo_url: null,
      region: 'North-Central', wins: 28, losses: 14, kills: 359,
      rank: 2, strength: 88,
      bio: 'Methodical and composed. Abuja Apex plays a structured long-range style built around SniperGod\'s AWM control and PhantomFF-level rotation reads.',
      achievements: ['FF Nigeria Open Runners-Up 2024', 'Clash Squad Cup Champions 2024'],
      players: [
        { id: 'ff-a2', name: 'Femi Adeyemi', ign: 'SniperGod_NG', role: 'Sniper', overall_rating: 91, photo_url: null, status: 'Active' },
      ],
    },
    {
      id: 'ff-tm3', name: 'PHC Raiders', logo_url: null,
      region: 'South-South', wins: 22, losses: 18, kills: 301,
      rank: 3, strength: 82,
      bio: 'Port Harcourt\'s top squad, famous for disciplined zone play and late-game survival. PhantomFF\'s IGL calls keep them competitive in every match.',
      achievements: ['3× Top-3 in FF Pro League', 'South-South Regional Champions 2023'],
      players: [
        { id: 'ff-a3', name: 'Ikenna Nwosu', ign: 'PhantomFF', role: 'IGL', overall_rating: 89, photo_url: null, status: 'Active' },
      ],
    },
    {
      id: 'ff-tm4', name: 'Warri Wolves', logo_url: null,
      region: 'South-South', wins: 19, losses: 21, kills: 348,
      rank: 4, strength: 79,
      bio: 'A high-octane squad with the most kills per match in the league. Their aggressive style leads to spectacular plays — and spectacular early exits.',
      achievements: ['Highest Average Kills Per Game — S3', 'FF Nigeria Open Quarter-finalists 2024'],
      players: [
        { id: 'ff-a4', name: 'Seun Balogun', ign: 'FlameShot_NG', role: 'Flanker', overall_rating: 87, photo_url: null, status: 'Active' },
      ],
    },
  ],

  transfers: [
    {
      id: 'ff-tr1', from_team: 'PHC Raiders', to_team: 'Lagos Lions FF',
      fee: 500000, status: 'Confirmed', date: '2025-04-01',
      notes: 'BlazeKing reunites with former academy coach. Lagos Lions strengthen their entry line ahead of FF Pro League Season 4.',
      athletes: { id: 'ff-a1', name: 'Chukwuemeka Obi', ign: 'BlazeKing_NG' },
    },
    {
      id: 'ff-tr2', from_team: null, to_team: 'Abuja Apex Gaming',
      fee: 200000, status: 'Confirmed', date: '2025-03-28',
      notes: 'SniperGod signs his first professional contract after dominating the amateur circuit for two seasons.',
      athletes: { id: 'ff-a2', name: 'Femi Adeyemi', ign: 'SniperGod_NG' },
    },
    {
      id: 'ff-tr3', from_team: 'Warri Wolves', to_team: 'Kano Kings FF',
      fee: 150000, status: 'Rumour', date: '2025-04-15',
      notes: 'GhostFire linked to a move north. Kano Kings reportedly offering a starting spot and higher kill bonuses.',
      athletes: { id: 'ff-a6', name: 'Tochukwu Eze', ign: 'GhostFire_TZ' },
    },
    {
      id: 'ff-tr4', from_team: 'Lagos Lions FF', to_team: 'Abuja Apex Gaming',
      fee: null, status: 'Rumour', date: '2025-04-18',
      notes: 'SurvivX reportedly unhappy with revised contract terms. Abuja Apex seen as a potential landing spot.',
      athletes: { id: 'ff-a5', name: 'Dele Martins', ign: 'SurvivX_NG' },
    },
    {
      id: 'ff-tr5', from_team: 'Kano Kings FF', to_team: null,
      fee: null, status: 'Pending', date: '2025-04-20',
      notes: 'FlameShot released from Warri Wolves contract. Multiple teams in talks — decision expected by end of the transfer window.',
      athletes: { id: 'ff-a4', name: 'Seun Balogun', ign: 'FlameShot_NG' },
    },
  ],

  highlights: [
    {
      id: 'ff-h1', title: 'BlazeKing\'s Legendary 1v4 — Bermuda Finals',
      category: 'clutch-moments', duration: '02:14', views: '84K', ago: '2hr ago',
      featured: true,
      tags: ['clutch-moments', 'all-coverage'],
    },
    {
      id: 'ff-h2', title: 'Lagos Lions FF — Full Booyah! Replay vs Warri Wolves',
      category: 'match-replays', duration: '28:40', views: '21K', ago: '5hr ago',
      tags: ['match-replays', 'all-coverage'],
    },
    {
      id: 'ff-h3', title: 'SniperGod: 14-Kill AWM Montage — Pro League S3',
      category: 'montages', duration: '03:55', views: '112K', ago: '1d ago',
      tags: ['montages', 'all-coverage'],
    },
    {
      id: 'ff-h4', title: 'PhantomFF Zone Read — How PHC Wins Late Circle',
      category: 'tactical-logs', duration: '07:30', views: '18K', ago: '2d ago',
      tags: ['tactical-logs', 'all-coverage'],
    },
    {
      id: 'ff-h5', title: 'GhostFire Clash Squad 5-Kill Streak — Purgatory',
      category: 'clutch-moments', duration: '01:48', views: '47K', ago: '3d ago',
      tags: ['clutch-moments', 'all-coverage'],
    },
    {
      id: 'ff-h6', title: 'FlameShot Flanking Masterclass — Warri Wolves vs Abuja',
      category: 'tactical-logs', duration: '05:22', views: '29K', ago: '4d ago',
      tags: ['tactical-logs', 'all-coverage'],
    },
  ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const GAME_CONTENT: Record<string, GameDummyContent> = {
  'free-fire': freeFire,
};

export function getGameContent(slug: string): GameDummyContent | null {
  return GAME_CONTENT[slug] ?? null;
}
