// ─── ATHLETES ────────────────────────────────────────────────────────────────
export const athletes = [
  {
    id: 1,
    tag: "Phantom_NG",
    fullName: "Emeka Okafor",
    rank: "Elite Ranger",
    rankNum: 35,
    avatar: "/avatars/phantom.jpg",
    kills: 4.2,
    headshots: 142,
    matches: 12,
    winRate: 78,
    stats: {
      weaponAccuracy: 88,
      offenseRating: 74,
      movementIndex: 91,
      teamRating: 65,
    },
    abilities: [
      { name: "Aggressive Pusher", desc: "First to breach contested zones" },
      { name: "Clutch King", desc: "Wins 1v3 situations 62% of the time" },
      { name: "Flanker Elite", desc: "Rotates via off-angles consistently" },
    ],
    history: [
      { team: "PHL-CODE [2024-PRESENT]", role: "ENTRY FRAGGER", active: true },
      { team: "PHC-2004-MVP", role: "SCOUT / LURKER", active: false },
      { team: "LEGION_SKILL2003-2004", role: "ACADEMY STRIKER", active: false },
    ],
    team: "Athlegame",
    status: "active",
  },
  {
    id: 2,
    tag: "ZeroX_Lag",
    fullName: "Tunde Adeyemi",
    rank: "Shadow Operative",
    rankNum: 29,
    avatar: "/avatars/zerox.jpg",
    kills: 3.8,
    headshots: 118,
    matches: 10,
    winRate: 71,
    stats: {
      weaponAccuracy: 81,
      offenseRating: 68,
      movementIndex: 85,
      teamRating: 72,
    },
    abilities: [
      { name: "Ghost Mode", desc: "Near-zero footstep signature" },
      { name: "Precision Burst", desc: "97% accuracy in burst-fire mode" },
      { name: "Adaptive IGL", desc: "Mid-round call adjustments" },
    ],
    history: [
      { team: "NAIJA FORCE [2023-PRESENT]", role: "SUPPORT IGL", active: true },
      { team: "DELTA SQUAD 2022-2023", role: "RIFLER", active: false },
    ],
    team: "Naija Force",
    status: "active",
  },
  {
    id: 3,
    tag: "Blazeking",
    fullName: "Chidi Nwosu",
    rank: "Combat Specialist",
    rankNum: 31,
    avatar: "/avatars/blaze.jpg",
    kills: 4.9,
    headshots: 167,
    matches: 14,
    winRate: 82,
    stats: {
      weaponAccuracy: 92,
      offenseRating: 89,
      movementIndex: 76,
      teamRating: 80,
    },
    abilities: [
      { name: "Sniper Elite", desc: "85% long-range elimination rate" },
      { name: "Map Control", desc: "Dominates high-ground positions" },
      { name: "Cool Under Fire", desc: "Zero tilt after multi-death rounds" },
    ],
    history: [
      { team: "LAGOS LIONS [2023-PRESENT]", role: "PRIMARY AWP", active: true },
      { team: "ABUJA STORM 2022", role: "LURK RIFLER", active: false },
    ],
    team: "Lagos Lions",
    status: "active",
  },
  {
    id: 4,
    tag: "ViperShot",
    fullName: "Akin Babatunde",
    rank: "Tactical Ghost",
    rankNum: 27,
    avatar: "/avatars/viper.jpg",
    kills: 3.5,
    headshots: 104,
    matches: 9,
    winRate: 68,
    stats: {
      weaponAccuracy: 76,
      offenseRating: 71,
      movementIndex: 88,
      teamRating: 84,
    },
    abilities: [
      { name: "Support King", desc: "Highest utility usage per round" },
      { name: "Trade Master", desc: "Always trades fallen teammates" },
      { name: "Economy IQ", desc: "Optimal buy decisions 94% of time" },
    ],
    history: [
      { team: "ABUJA STORM [2024-PRESENT]", role: "UTILITY SUPPORT", active: true },
      { team: "CYBER KINGS 2023", role: "RIFLER", active: false },
    ],
    team: "Abuja Storm",
    status: "active",
  },
  {
    id: 5,
    tag: "DarkByte",
    fullName: "Seun Olatunji",
    rank: "Recon Specialist",
    rankNum: 22,
    avatar: "/avatars/dark.jpg",
    kills: 3.1,
    headshots: 89,
    matches: 8,
    winRate: 63,
    stats: {
      weaponAccuracy: 73,
      offenseRating: 60,
      movementIndex: 94,
      teamRating: 77,
    },
    abilities: [
      { name: "Intel Relay", desc: "Provides crucial info 90% of rounds" },
      { name: "Entry Scout", desc: "Opens sites with minimal deaths" },
      { name: "Zone Control", desc: "Holds flanks consistently" },
    ],
    history: [
      { team: "CYBER KINGS [2024-PRESENT]", role: "SCOUT / SUPPORT", active: true },
    ],
    team: "Cyber Kings",
    status: "active",
  },
];

// ─── TEAMS ────────────────────────────────────────────────────────────────────
export const teams = [
  {
    id: 1,
    name: "Athlegame",
    tag: "ATH",
    rank: 1,
    wins: 24,
    losses: 6,
    winRate: 80,
    prize: "₦25,000,000",
    region: "Lagos Command",
    color: "#00ff41",
    players: ["Phantom_NG", "ZeroX_Lag", "IronFist", "GhostByte_X", "DarkByte"],
    stats: { kills: 144, deaths: 98, assists: 87, rating: 96.0 },
  },
  {
    id: 2,
    name: "Naija Force",
    tag: "NJF",
    rank: 2,
    wins: 19,
    losses: 9,
    winRate: 68,
    prize: "₦18,000,000",
    region: "Abuja HQ",
    color: "#f0c040",
    players: ["ZeroX_Lag", "ViperShot", "Striker_NG", "Commander_D", "Val_Pro"],
    stats: { kills: 128, deaths: 104, assists: 94, rating: 88.5 },
  },
  {
    id: 3,
    name: "Lagos Lions",
    tag: "LGL",
    rank: 3,
    wins: 17,
    losses: 11,
    winRate: 61,
    prize: "₦12,000,000",
    region: "Lagos Command",
    color: "#ff6b8a",
    players: ["Blazeking", "Lagos_King", "Frag_Pro", "Steel_Wave", "CaptainNG"],
    stats: { kills: 119, deaths: 108, assists: 76, rating: 82.1 },
  },
  {
    id: 4,
    name: "Abuja Storm",
    tag: "ABS",
    rank: 4,
    wins: 15,
    losses: 13,
    winRate: 54,
    prize: "₦8,000,000",
    region: "Abuja HQ",
    color: "#00aaff",
    players: ["ViperShot", "DarkByte", "AbujaAce", "Warlord_X", "NightOwl"],
    stats: { kills: 108, deaths: 112, assists: 89, rating: 77.4 },
  },
  {
    id: 5,
    name: "Delta Force NG",
    tag: "DFN",
    rank: 5,
    wins: 12,
    losses: 16,
    winRate: 43,
    prize: "₦5,000,000",
    region: "Port Harcourt",
    color: "#aa44ff",
    players: ["DeltaAce", "RiverKing", "Okonkwo", "JetStream", "Phantom_PH"],
    stats: { kills: 97, deaths: 118, assists: 71, rating: 70.2 },
  },
];

export const leaderboard = [
  { rank: 1, team: "Athlegame",    wins: 24, kills: 144, rating: 96.0, prize: "₦25M", status: "active" },
  { rank: 2, team: "Naija Force",  wins: 19, kills: 128, rating: 88.5, prize: "₦18M", status: "active" },
  { rank: 3, team: "Lagos Lions",  wins: 17, kills: 119, rating: 82.1, prize: "₦12M", status: "active" },
  { rank: 4, team: "Abuja Storm",  wins: 15, kills: 108, rating: 77.4, prize: "₦8M",  status: "active" },
  { rank: 5, team: "Delta Force",  wins: 12, kills: 97,  rating: 70.2, prize: "₦5M",  status: "eliminated" },
  { rank: 6, team: "Cyber Kings",  wins: 10, kills: 91,  rating: 65.8, prize: "N/A",  status: "eliminated" },
];

// ─── TOURNAMENTS ──────────────────────────────────────────────────────────────
export const liveFeed = [
  { home: "Athlegame",       away: "Naija Force",  homeScore: 3, awayScore: 1, game: "PUBG Mobile",   status: "LIVE" },
  { home: "Lagos Lions",     away: "Abuja Storm",  homeScore: 2, awayScore: 2, game: "Apex Legends",  status: "LIVE" },
  { home: "Phantom Experts", away: "Delta Kings",  homeScore: 1, awayScore: 0, game: "Valorant",      status: "LIVE" },
];

export const groupStandings = [
  { pos: 1, team: "Athlegame",   gp: 4, w: 4, d: 0, l: 0, pts: 12, kills: "281", color: "#00ff41" },
  { pos: 2, team: "Naija Force", gp: 4, w: 3, d: 0, l: 1, pts: 9,  kills: "247", color: "#f0c040" },
  { pos: 3, team: "Lagos Lions", gp: 4, w: 2, d: 0, l: 2, pts: 6,  kills: "198", color: "#ff6b8a" },
  { pos: 4, team: "Abuja Storm", gp: 4, w: 1, d: 0, l: 3, pts: 3,  kills: "171", color: "#00aaff" },
  { pos: 5, team: "Delta Force", gp: 4, w: 0, d: 0, l: 4, pts: 0,  kills: "142", color: "#666" },
];

export const upcomingMatches = [
  { date: "APR 14", time: "18:00", home: "Athlegame",   away: "Lagos Lions",  game: "VALORANT" },
  { date: "APR 14", time: "20:00", home: "Naija Force", away: "Abuja Storm",  game: "PUBG Mobile" },
  { date: "APR 15", time: "16:00", home: "Cyber Kings", away: "Delta Force",  game: "Apex Legends" },
];

// ─── TRANSFERS ────────────────────────────────────────────────────────────────
export const recentTransfers = [
  { player: "Phantom_NG", from: "Cyber Lions", to: "Athlegame",   value: "₦8,012,000", status: "SOLD", date: "28 FEB 04" },
  { player: "DarkByte",   from: "Naija Force", to: "Abuja Storm", value: "₦2,000,000", status: "LOAN", date: "23 FEB 04" },
];

export const freeAgents = [
  {
    tag: "IronFist",
    rank: "Elite",
    age: "23",
    matches: "187",
    winRate: "71%",
    asking: "₦6.5M",
    badge: "FREE AGENT",
  },
  {
    tag: "GhostByte_X",
    rank: "Advanced",
    age: "21",
    matches: "143",
    winRate: "64%",
    asking: "₦4.2M",
    badge: "FREE AGENT",
  },
  {
    tag: "DarkMatter",
    rank: "Pro",
    age: "25",
    matches: "201",
    winRate: "68%",
    asking: "₦5.8M",
    badge: "FREE AGENT",
  },
];

export const marketActivity = [
  { text: "Cyber Lions confirmed signing of NaijaElite", time: "2m ago",  type: "news" },
  { text: "Free Agent fee for IronFist disclosed at ₦6.5M", time: "8m ago",  type: "info" },
  { text: "Negotiations between TeamSilver and AbirA collapsed", time: "14m ago", type: "alert" },
  { text: "Nova Block finalized ₦11 sale of Capital", time: "22m ago", type: "news" },
];

// ─── WAGER ────────────────────────────────────────────────────────────────────
export type WagerMarket = {
  id: string;
  tag: "CRITICAL MATCH" | "REGIONAL FINALS" | "STAT WAGER" | "CLUTCH MOMENT" | "MVP PICK";
  question: string;
  subtitle: string;
  poolSize: string;
  trades: number;
  endsIn: string;
  options: Array<{
    label: string;
    sublabel: string;
    yesPrice: number;   // e.g. 62 means 62 out of 100
    noPrice: number;    // 100 - yesPrice
    yesReturn: string;  // e.g. "₦1k → ₦1.6k"
    noReturn: string;
  }>;
};

export const wagerMarkets: WagerMarket[] = [
  {
    id: "w1",
    tag: "CRITICAL MATCH",
    question: "Will ATHLEGAME win vs NAIJA FORCE?",
    subtitle: "Starts in: 00:42:15 • CALL OF DUTY: MOBILE",
    poolSize: "₦240.5k",
    trades: 1248,
    endsIn: "00:42:15",
    options: [
      {
        label: "YES — Athlegame Win",
        sublabel: "",
        yesPrice: 62,
        noPrice: 38,
        yesReturn: "₦1k → ₦1.6k",
        noReturn: "₦1k → ₦2.6k",
      },
    ],
  },
  {
    id: "w2",
    tag: "REGIONAL FINALS",
    question: "Will LAGOS LIONS win vs ABUJA STORM?",
    subtitle: "Starts in: 04:15:00 • APEX LEGENDS",
    poolSize: "₦85.2k",
    trades: 634,
    endsIn: "04:15:00",
    options: [
      {
        label: "YES (LIONS)",
        sublabel: "",
        yesPrice: 60,
        noPrice: 40,
        yesReturn: "₦1k → ₦1.67k",
        noReturn: "₦1k → ₦2.5k",
      },
    ],
  },
  {
    id: "w3",
    tag: "STAT WAGER",
    question: "Will total kills exceed 25 in Lagos Lions vs Abuja Storm?",
    subtitle: "NIGERIA PRO LEAGUE • MATCH 4 • VALORANT",
    poolSize: "₦52.0k",
    trades: 412,
    endsIn: "Ends by outcome",
    options: [
      {
        label: "OVER 25 KILLS",
        sublabel: "",
        yesPrice: 51,
        noPrice: 49,
        yesReturn: "₦1k → ₦1.96k",
        noReturn: "₦1k → ₦2.04k",
      },
    ],
  },
  {
    id: "w4",
    tag: "CLUTCH MOMENT",
    question: "Will Phantom_NG land 10+ headshots today?",
    subtitle: "INDIVIDUAL STATS • CALL OF DUTY: MOBILE",
    poolSize: "₦28.4k",
    trades: 287,
    endsIn: "Ends 14th Apr.",
    options: [
      {
        label: "YES — 10+ Headshots",
        sublabel: "",
        yesPrice: 71,
        noPrice: 29,
        yesReturn: "₦1k → ₦1.41k",
        noReturn: "₦1k → ₦3.45k",
      },
    ],
  },
  {
    id: "w5",
    tag: "MVP PICK",
    question: "Which team wins PUBG National Championship 2026?",
    subtitle: "NATIONAL CHAMPIONSHIP • GROUP STAGE",
    poolSize: "₦482.1k",
    trades: 3841,
    endsIn: "Ends 20th Apr.",
    options: [
      {
        label: "Athlegame",
        sublabel: "Current leaders",
        yesPrice: 45,
        noPrice: 55,
        yesReturn: "₦1k → ₦2.22k",
        noReturn: "₦1k → ₦1.82k",
      },
      {
        label: "Naija Force",
        sublabel: "Strong challenger",
        yesPrice: 35,
        noPrice: 65,
        yesReturn: "₦1k → ₦2.86k",
        noReturn: "₦1k → ₦1.54k",
      },
      {
        label: "Lagos Lions",
        sublabel: "Dark horse",
        yesPrice: 20,
        noPrice: 80,
        yesReturn: "₦1k → ₦5.0k",
        noReturn: "₦1k → ₦1.25k",
      },
    ],
  },
  {
    id: "w6",
    tag: "STAT WAGER",
    question: "Will the Grand Finals exceed 5 maps played?",
    subtitle: "GRAND FINALS • BEST OF 7 FORMAT",
    poolSize: "₦61.7k",
    trades: 521,
    endsIn: "Ends by outcome",
    options: [
      {
        label: "YES — Over 5 maps",
        sublabel: "",
        yesPrice: 38,
        noPrice: 62,
        yesReturn: "₦1k → ₦2.63k",
        noReturn: "₦1k → ₦1.61k",
      },
    ],
  },
];

export const elitePredictors = [
  { rank: 1, tag: "PrideEsport",  accuracy: "92%", weekly: "+₦12,400" },
  { rank: 2, tag: "Vector99",     accuracy: "88%", weekly: "+₦8,150"  },
  { rank: 3, tag: "LionHeart",    accuracy: "85%", weekly: "+₦5,920"  },
  { rank: 4, tag: "TacticalAce",  accuracy: "83%", weekly: "+₦4,200"  },
  { rank: 5, tag: "ZeroLoss_NG",  accuracy: "81%", weekly: "+₦3,780"  },
];

export const activePredictions = [
  {
    event: "Cyber Kings vs Outlaws",
    subtitle: "VALORANT PREMIER",
    type: "YES (Cyber Kings)",
    odds: "1.75x",
    stake: "200 FRG",
    estReturn: "350 FRG",
    status: "LIVE/MAP 2",
    statusColor: "#00ff41",
  },
  {
    event: "Total Headshots > 10",
    subtitle: "INDIVIDUAL STATS",
    type: "OVER",
    odds: "2.10x",
    stake: "150 FRG",
    estReturn: "315 FRG",
    status: "PENDING",
    statusColor: "#f0c040",
  },
  {
    event: "Naija Force vs Delta Kings",
    subtitle: "APEX LEGENDS",
    type: "YES (Naija Force)",
    odds: "1.55x",
    stake: "300 FRG",
    estReturn: "465 FRG",
    status: "UPCOMING",
    statusColor: "#3d5c3d",
  },
];

// ─── HIGHLIGHTS ───────────────────────────────────────────────────────────────
export const archiveVideos = [
  {
    id: 1, category: "MATCH HIGHLIGHTS", duration: "04:20",
    title: "Delta Squad vs Neon Knights: Best of 5",
    creator: "PHANTOM_NG", views: "34K", thumbnail: "thumb1",
    tags: ["match-replays"],
  },
  {
    id: 2, category: "SKILL SHOT", duration: "02:50",
    title: "Across the Map Headshot with Zero Drift",
    creator: "ZEROX_LAG", views: "15K", thumbnail: "thumb2",
    tags: ["clutch-moments"],
  },
  {
    id: 3, category: "TACTICAL LOG", duration: "11:12",
    title: "The Meta Change: Patch 1.04 Breakdown",
    creator: "ANALYST_PRO", views: "52K", thumbnail: "thumb3",
    tags: ["tactical-logs"],
  },
  {
    id: 4, category: "INTERVIEW", duration: "06:40",
    title: "Post-Game: How we beat the Champions",
    creator: "CAPTAIN_NG", views: "21K", thumbnail: "thumb4",
    tags: ["all-coverage"],
  },
  {
    id: 5, category: "MONTAGE", duration: "03:10",
    title: "Nigerian All-Stars: Vol. 2 Highs",
    creator: "FRAG_NAIJA", views: "88K", thumbnail: "thumb5",
    tags: ["montages"],
  },
  {
    id: 6, category: "FUNNY MOMENTS", duration: "05:41",
    title: "Tournament Bloopers: Pro Gaming Fails",
    creator: "LOL_LAGOS", views: "11K", thumbnail: "thumb6",
    tags: ["clutch-moments"],
  },
];

export const commanderCams = [
  { tag: "PHANTOM_NG",   quote: '"Target acquired..."',    live: true  },
  { tag: "ZEROX_LAG",    quote: '"Wait for the drop."',    live: true  },
  { tag: "VAL_PRO",      quote: '"Pushing Sector 4"',      live: true  },
  { tag: "STRIKER_NGR",  quote: '"Need ammo now."',        live: true  },
  { tag: "COMMANDER_D",  quote: '"0062. Tactical win."',   live: true  },
  { tag: "LAGOS_KING",   quote: '"Watching the flank."',   live: false },
];
