import { createClient } from '@supabase/supabase-js';

let client = null;

function normalizeSupabaseJwtKey(value) {
  const rawKey = String(value ?? '').trim();
  const bearerMatch = rawKey.match(/^Bearer\s+(.+)$/i);
  const unprefixedKey = bearerMatch ? bearerMatch[1].trim() : rawKey;
  const unquotedKey = unprefixedKey.replace(/^(["'])(.*)\1$/, '$2').trim();

  if (!unquotedKey || unquotedKey.split('.').length !== 3) {
    return null;
  }

  return unquotedKey;
}

const MOCK_TEAMS = [
  { id: 'team-1', name: 'Athlegame', logo_url: '/logos/pubg-mobile.svg', region: 'Lagos Command', rank: 1, points: 1440, gold_count: 5, silver_count: 2, bronze_count: 1, kills: 280, strength: 96, game_slug: 'pubg-mobile' },
  { id: 'team-2', name: 'Naija Force', logo_url: '/logos/cod-mobile.svg', region: 'Abuja HQ', rank: 2, points: 1280, gold_count: 3, silver_count: 4, bronze_count: 2, kills: 247, strength: 89, game_slug: 'pubg-mobile' },
  { id: 'team-3', name: 'Lagos Lions', logo_url: '/logos/free-fire.svg', region: 'Lagos Command', rank: 3, points: 1190, gold_count: 2, silver_count: 3, bronze_count: 3, kills: 198, strength: 82, game_slug: 'pubg-mobile' },
  { id: 'team-4', name: 'Abuja Storm', logo_url: '/logos/ea-fc-26.svg', region: 'Abuja HQ', rank: 4, points: 1080, gold_count: 1, silver_count: 2, bronze_count: 4, kills: 171, strength: 77, game_slug: 'pubg-mobile' },
  { id: 'ff-tm1', name: 'Lagos Lions FF', logo_url: '/logos/free-fire.svg', region: 'South-West', rank: 1, points: 1420, gold_count: 4, silver_count: 2, bronze_count: 1, kills: 412, strength: 94, game_slug: 'free-fire' },
  { id: 'ff-tm2', name: 'Abuja Apex Gaming', logo_url: '/logos/free-fire.svg', region: 'North-Central', rank: 2, points: 1260, gold_count: 3, silver_count: 3, bronze_count: 2, kills: 359, strength: 88, game_slug: 'free-fire' },
];

const MOCK_ATHLETES = [
  // PUBG Mobile athletes
  { id: 'ath-1', name: 'Emeka Okafor', ign: 'Phantom_NG', known_name: 'Phantom_NG', team: 'Athlegame', role: 'Entry Fragger', rating: 96, overall_rating: 96, kills: 42, assists: 18, winrate: 78, status: 'active', fantasy_status: 'available', game_slug: 'pubg-mobile', photo_url: null, jersey_number: 7, fantasy_price: 3200000, recent_fantasy_points: 30, total_fantasy_points: 120 },
  { id: 'ath-2', name: 'Tunde Adeyemi', ign: 'ZeroX_Lag', known_name: 'ZeroX_Lag', team: 'Naija Force', role: 'Support IGL', rating: 89, overall_rating: 89, kills: 38, assists: 24, winrate: 71, status: 'active', fantasy_status: 'available', game_slug: 'pubg-mobile', photo_url: null, jersey_number: 10, fantasy_price: 1550000, recent_fantasy_points: 25, total_fantasy_points: 95 },
  { id: 'ath-3', name: 'Chidi Nwosu', ign: 'Blazeking', known_name: 'Blazeking', team: 'Lagos Lions', role: 'Sniper Elite', rating: 82, overall_rating: 82, kills: 49, assists: 12, winrate: 82, status: 'active', fantasy_status: 'available', game_slug: 'pubg-mobile', photo_url: null, jersey_number: 11, fantasy_price: 850000, recent_fantasy_points: 20, total_fantasy_points: 80 },

  // Free Fire athletes
  { id: 'ff-a1', name: 'Chukwuemeka Obi', ign: 'BlazeKing_NG', known_name: 'BlazeKing_NG', team: 'Lagos Lions FF', role: 'Rush / Entry', attack: 96, defense: 78, iq: 85, rating: 94, overall_rating: 94, kills: 8.4, assists: 3.1, winrate: 74, status: 'active', fantasy_status: 'available', game_slug: 'free-fire', photo_url: null, jersey_number: 7, fantasy_price: 3100000, recent_fantasy_points: 32, total_fantasy_points: 125 },
  { id: 'ff-a2', name: 'Femi Adeyemi', ign: 'SniperGod_NG', known_name: 'SniperGod_NG', team: 'Abuja Apex Gaming', role: 'Sniper / AWP', attack: 88, defense: 82, iq: 92, rating: 91, overall_rating: 91, kills: 6.2, assists: 4.5, winrate: 69, status: 'active', fantasy_status: 'available', game_slug: 'free-fire', photo_url: null, jersey_number: 10, fantasy_price: 2450000, recent_fantasy_points: 27, total_fantasy_points: 105 },
  { id: 'ff-a3', name: 'Ikenna Nwosu', ign: 'PhantomFF', known_name: 'PhantomFF', team: 'PHC Raiders', role: 'IGL / Support', attack: 79, defense: 88, iq: 97, rating: 89, overall_rating: 89, kills: 4.8, assists: 7.2, winrate: 71, status: 'active', fantasy_status: 'available', game_slug: 'free-fire', photo_url: null, jersey_number: 1, fantasy_price: 1800000, recent_fantasy_points: 23, total_fantasy_points: 92 },
  { id: 'ff-a4', name: 'Seun Balogun', ign: 'FlameShot_NG', known_name: 'FlameShot_NG', team: 'Warri Wolves', role: 'Flanker', attack: 91, defense: 74, iq: 83, rating: 87, overall_rating: 87, kills: 7.1, assists: 2.9, winrate: 62, status: 'active', fantasy_status: 'available', game_slug: 'free-fire', photo_url: null, jersey_number: 11, fantasy_price: 1350000, recent_fantasy_points: 19, total_fantasy_points: 78 },
  { id: 'ff-a5', name: 'Dele Martins', ign: 'SurvivX_NG', known_name: 'SurvivX_NG', team: 'Delta Warriors', role: 'Support / Medic', attack: 72, defense: 91, iq: 89, rating: 85, overall_rating: 85, kills: 3.6, assists: 9.1, winrate: 76, status: 'active', fantasy_status: 'available', game_slug: 'free-fire', photo_url: null, jersey_number: 14, fantasy_price: 950000, recent_fantasy_points: 17, total_fantasy_points: 70 },
  { id: 'ff-a6', name: 'Tochukwu Eze', ign: 'GhostFire_TZ', known_name: 'GhostFire_TZ', team: 'Kano Kings FF', role: 'Fragger / Rush', attack: 89, defense: 71, iq: 80, rating: 83, overall_rating: 83, kills: 7.8, assists: 2.4, winrate: 58, status: 'active', fantasy_status: 'available', game_slug: 'free-fire', photo_url: null, jersey_number: 9, fantasy_price: 700000, recent_fantasy_points: 15, total_fantasy_points: 62 },

  // FC Mobile athletes (Dedicated squad budget B = 6,000,000, N = 6, P_min = 70,000, max 2 rated 90+)
  { id: 'fcm-1', name: 'Victor Osimhen', ign: 'StarBoy_Vic', known_name: 'StarBoy_Vic', team: 'Naija Force', role: 'Striker', attack: 96, defense: 88, iq: 97, rating: 94, overall_rating: 94, kills: 28, assists: 14, winrate: 85, status: 'active', fantasy_status: 'available', game_slug: 'fc-mobile', photo_url: null, jersey_number: 9, fantasy_price: 2450000, recent_fantasy_points: 24, total_fantasy_points: 98 },
  { id: 'fcm-2', name: 'Ademola Lookman', ign: 'ClutchMan_Ade', known_name: 'ClutchMan_Ade', team: 'Athlegame', role: 'Forward', attack: 93, defense: 85, iq: 96, rating: 91, overall_rating: 91, kills: 22, assists: 19, winrate: 82, status: 'active', fantasy_status: 'available', game_slug: 'fc-mobile', photo_url: null, jersey_number: 11, fantasy_price: 2100000, recent_fantasy_points: 21, total_fantasy_points: 87 },
  { id: 'fcm-3', name: 'Alex Iwobi', ign: 'NaijaMaestro', known_name: 'NaijaMaestro', team: 'Lagos Lions', role: 'Midfielder', attack: 89, defense: 88, iq: 94, rating: 90, overall_rating: 90, kills: 16, assists: 28, winrate: 79, status: 'active', fantasy_status: 'available', game_slug: 'fc-mobile', photo_url: null, jersey_number: 17, fantasy_price: 1950000, recent_fantasy_points: 18, total_fantasy_points: 76 },
  { id: 'fcm-4', name: 'Samuel Chukwueze', ign: 'SpeedyChuks', known_name: 'SpeedyChuks', team: 'Abuja Storm', role: 'Winger', attack: 91, defense: 80, iq: 92, rating: 88, overall_rating: 88, kills: 18, assists: 15, winrate: 75, status: 'active', fantasy_status: 'available', game_slug: 'fc-mobile', photo_url: null, jersey_number: 7, fantasy_price: 1060000, recent_fantasy_points: 15, total_fantasy_points: 68 },
  { id: 'fcm-5', name: 'Victor Boniface', ign: 'BoniGoal', known_name: 'BoniGoal', team: 'Athlegame', role: 'Striker', attack: 89, defense: 79, iq: 89, rating: 86, overall_rating: 86, kills: 20, assists: 10, winrate: 74, status: 'active', fantasy_status: 'available', game_slug: 'fc-mobile', photo_url: null, jersey_number: 22, fantasy_price: 900000, recent_fantasy_points: 14, total_fantasy_points: 62 },
  { id: 'fcm-6', name: 'Wilfred Ndidi', ign: 'TheWall_Ndidi', known_name: 'TheWall_Ndidi', team: 'Naija Force', role: 'Defensive Mid', attack: 78, defense: 92, iq: 83, rating: 84, overall_rating: 84, kills: 12, assists: 14, winrate: 76, status: 'active', fantasy_status: 'available', game_slug: 'fc-mobile', photo_url: null, jersey_number: 4, fantasy_price: 660000, recent_fantasy_points: 12, total_fantasy_points: 58 },
  { id: 'fcm-7', name: 'Calvin Bassey', ign: 'BasseyTank', known_name: 'BasseyTank', team: 'Lagos Lions', role: 'Centre Back', attack: 74, defense: 90, iq: 80, rating: 81, overall_rating: 81, kills: 8, assists: 12, winrate: 72, status: 'active', fantasy_status: 'available', game_slug: 'fc-mobile', photo_url: null, jersey_number: 21, fantasy_price: 520000, recent_fantasy_points: 10, total_fantasy_points: 51 },
  { id: 'fcm-8', name: 'Moses Simon', ign: 'FlashSimon', known_name: 'FlashSimon', team: 'Abuja Storm', role: 'Left Mid', attack: 82, defense: 72, iq: 80, rating: 78, overall_rating: 78, kills: 14, assists: 16, winrate: 70, status: 'active', fantasy_status: 'available', game_slug: 'fc-mobile', photo_url: null, jersey_number: 15, fantasy_price: 400000, recent_fantasy_points: 11, total_fantasy_points: 46 },
  { id: 'fcm-9', name: 'Kelechi Iheanacho', ign: 'SeniorMan_Kel', known_name: 'SeniorMan_Kel', team: 'Athlegame', role: 'Forward', attack: 80, defense: 70, iq: 77, rating: 76, overall_rating: 76, kills: 15, assists: 11, winrate: 68, status: 'active', fantasy_status: 'available', game_slug: 'fc-mobile', photo_url: null, jersey_number: 14, fantasy_price: 330000, recent_fantasy_points: 9, total_fantasy_points: 42 },
  { id: 'fcm-10', name: 'Ola Aina', ign: 'AinaFlank', known_name: 'AinaFlank', team: 'Naija Force', role: 'Full Back', attack: 75, defense: 74, iq: 71, rating: 73, overall_rating: 73, kills: 6, assists: 13, winrate: 66, status: 'active', fantasy_status: 'available', game_slug: 'fc-mobile', photo_url: null, jersey_number: 2, fantasy_price: 240000, recent_fantasy_points: 8, total_fantasy_points: 36 },
  { id: 'fcm-11', name: 'Stanley Nwabali', ign: 'SafeHands_Stan', known_name: 'SafeHands_Stan', team: 'Lagos Lions', role: 'Goalkeeper', attack: 60, defense: 76, iq: 68, rating: 68, overall_rating: 68, kills: 2, assists: 5, winrate: 69, status: 'active', fantasy_status: 'available', game_slug: 'fc-mobile', photo_url: null, jersey_number: 1, fantasy_price: 140000, recent_fantasy_points: 7, total_fantasy_points: 32 },
  { id: 'fcm-12', name: 'Raphael Onyedika', ign: 'MidAnchor', known_name: 'MidAnchor', team: 'Abuja Storm', role: 'Midfielder', attack: 55, defense: 62, iq: 56, rating: 58, overall_rating: 58, kills: 5, assists: 8, winrate: 61, status: 'active', fantasy_status: 'available', game_slug: 'fc-mobile', photo_url: null, jersey_number: 8, fantasy_price: 70000, recent_fantasy_points: 5, total_fantasy_points: 22 },
];

const MOCK_TOURNAMENTS = [
  { id: 'tourn-1', name: 'National Esports Championship 2026', start_date: '2026-06-01', end_date: '2026-06-20', status: 'Upcoming', game: 'PUBG Mobile', game_slug: 'pubg-mobile', prize_pool: 25000000, currency: 'NGN' },
  { id: 'tourn-2', name: 'Lagos Pro Clan Wars', start_date: '2026-05-15', end_date: '2026-05-30', status: 'Live', game: 'COD Mobile', game_slug: 'cod-mobile', prize_pool: 15000000, currency: 'NGN' },
];

const MOCK_WAGERS = [
  { id: 'wager-1', question: 'Will Athlegame secure Victory in Clan Wars Game 1?', subtitle: 'PUBG Mobile Pro Match', match_name: 'Athlegame vs Naija Force', game_slug: 'pubg-mobile', yes_odds: 1.85, no_odds: 2.10, yes_price: 52, no_price: 48, pool_total: 850000, hot: true, status: 'Active', closes_at: '2026-11-20T20:00:00Z', featured_on_home: true, type: 'binary' },
];

const MOCK_TRANSFERS = [
  { id: 'trans-1', from_team: 'Naija Force', to_team: 'Athlegame', fee: 8000000, status: 'SOLD', date: '2026-04-10', athletes: { id: 'ath-1', name: 'Emeka Okafor', ign: 'Phantom_NG' } },
];

const MOCK_SHOP = [
  { id: 'shop-1', name: 'FragNaija Pro Elite Jersey 2026', price: 18500, currency: 'NGN', image_url: null, category: 'Apparel', status: 'In Stock' },
  { id: 'shop-2', name: 'Tactical Esports Sleeve', price: 6500, currency: 'NGN', image_url: null, category: 'Accessories', status: 'In Stock' },
];

const MOCK_FANTASY_SETTINGS = [
  { key: 'fc_mobile_budget', value: 6000000 },
  { key: 'pubg_mobile_budget', value: 10000000 },
  { key: 'free_fire_budget', value: 10000000 },
  { key: 'fc_mobile_transfer_window', value: { gameSlug: 'fc-mobile', status: 'open', transfersRemaining: 6, opens: '2026-10-19T00:00:00Z', closes: '' } },
  { key: 'fc_mobile_allow_repick', value: true },
  { key: 'fc_mobile_reset_at', value: '2026-10-19T00:00:00Z' },
  { key: 'pubg_mobile_transfer_window', value: { gameSlug: 'pubg-mobile', status: 'closed', transfersRemaining: 0, opens: '', closes: '' } },
  { key: 'free_fire_transfer_window', value: { gameSlug: 'free-fire', status: 'open', transfersRemaining: 2, opens: '', closes: '' } },
];

const MOCK_FANTASY_SQUADS = [];

function getMockTableData(table) {
  switch (table) {
    case 'teams': return MOCK_TEAMS;
    case 'athletes': return MOCK_ATHLETES;
    case 'tournaments': return MOCK_TOURNAMENTS;
    case 'wagers': return MOCK_WAGERS;
    case 'transfers': return MOCK_TRANSFERS;
    case 'shop_items': return MOCK_SHOP;
    case 'fantasy_settings': return MOCK_FANTASY_SETTINGS;
    case 'fantasy_squads': return MOCK_FANTASY_SQUADS;
    case 'homepage_settings': return [{ id: 'default', hero_headline: 'FRAG NAIJA', show_athletes: 'true', show_teams: 'true', show_shop: 'true' }];
    case 'company_profile': return [{ id: 'default', company_name: 'Ghreatness Laboratory', headline: 'Meet the Creators of FragNaija' }];
    default: return [];
  }
}

function createMockClient() {
  console.warn('[AI Studio] Supabase credentials not configured — running with resilient in-memory mock client.');

  return {
    from(table) {
      let isSingle = false;
      let dataStore = [...getMockTableData(table)];

      const builder = {
        select: () => builder,
        insert: (data) => {
          const inserted = Array.isArray(data) ? data : [data];
          dataStore.push(...inserted);
          return {
            select: () => builder,
            single: () => { isSingle = true; return builder; },
            then: (resolve) => resolve({ data: isSingle ? inserted[0] : inserted, error: null }),
            catch: () => Promise.resolve({ data: isSingle ? inserted[0] : inserted, error: null }),
          };
        },
        update: (data) => ({
          eq: (col, val) => {
            dataStore = dataStore.map((row) => (row[col] === val ? { ...row, ...data } : row));
            return builder;
          },
          in: (col, vals) => {
            const set = new Set(vals);
            dataStore = dataStore.map((row) => (set.has(row[col]) ? { ...row, ...data } : row));
            return builder;
          },
          select: () => builder,
          single: () => { isSingle = true; return builder; },
          then: (resolve) => resolve({ data, error: null }),
          catch: () => Promise.resolve({ data, error: null }),
        }),
        delete: () => ({
          eq: (col, val) => {
            dataStore = dataStore.filter((row) => row[col] !== val);
            return builder;
          },
          then: (resolve) => resolve({ data: null, error: null }),
          catch: () => Promise.resolve({ data: null, error: null }),
        }),
        upsert: (items) => {
          const list = Array.isArray(items) ? items : [items];
          for (const item of list) {
            const matchIndex = dataStore.findIndex((row) => (item.id && row.id === item.id) || (item.key && row.key === item.key));
            if (matchIndex >= 0) {
              dataStore[matchIndex] = { ...dataStore[matchIndex], ...item };
            } else {
              dataStore.push(item);
            }
          }
          return builder;
        },
        eq: (col, val) => {
          dataStore = dataStore.filter((row) => String(row[col] ?? '') === String(val ?? ''));
          return builder;
        },
        neq: (col, val) => {
          dataStore = dataStore.filter((row) => String(row[col] ?? '') !== String(val ?? ''));
          return builder;
        },
        gt: (col, val) => {
          dataStore = dataStore.filter((row) => Number(row[col]) > Number(val));
          return builder;
        },
        gte: (col, val) => {
          dataStore = dataStore.filter((row) => Number(row[col]) >= Number(val));
          return builder;
        },
        lt: (col, val) => {
          dataStore = dataStore.filter((row) => Number(row[col]) < Number(val));
          return builder;
        },
        lte: (col, val) => {
          dataStore = dataStore.filter((row) => Number(row[col]) <= Number(val));
          return builder;
        },
        in: (col, vals) => {
          const set = new Set((vals || []).map((v) => String(v)));
          dataStore = dataStore.filter((row) => set.has(String(row[col])));
          return builder;
        },
        is: (col, val) => {
          dataStore = dataStore.filter((row) => (val === null ? row[col] === null || row[col] === undefined : row[col] === val));
          return builder;
        },
        or: () => builder,
        not: () => builder,
        like: () => builder,
        ilike: () => builder,
        contains: () => builder,
        containedBy: () => builder,
        range: () => builder,
        order: (col, opts = {}) => {
          const asc = opts?.ascending !== false;
          dataStore.sort((a, b) => {
            const va = a[col];
            const vb = b[col];
            if (va === vb) return 0;
            if (asc) return va > vb ? 1 : -1;
            return va < vb ? 1 : -1;
          });
          return builder;
        },
        limit: (n) => {
          dataStore.splice(n);
          return builder;
        },
        single: () => { isSingle = true; return builder; },
        maybeSingle: () => { isSingle = true; return builder; },
        then: (onfulfilled, onrejected) => {
          const result = {
            data: isSingle ? (dataStore[0] || null) : dataStore,
            error: null,
            count: dataStore.length,
          };
          return Promise.resolve(result).then(onfulfilled, onrejected);
        },
        catch: (onrejected) => {
          const result = {
            data: isSingle ? (dataStore[0] || null) : dataStore,
            error: null,
            count: dataStore.length,
          };
          return Promise.resolve(result).catch(onrejected);
        },
      };

      return builder;
    },
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      admin: {
        listUsers: async () => ({ data: { users: [] }, error: null }),
        getUserById: async () => ({ data: { user: null }, error: null }),
      },
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'mock-upload.png' }, error: null }),
        getPublicUrl: (path) => ({ data: { publicUrl: `/uploads/${path}` } }),
      }),
    },
    rpc: async () => ({ data: null, error: null }),
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
  };
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = normalizeSupabaseJwtKey(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    return createMockClient();
  }

  try {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  } catch (err) {
    console.warn('[AI Studio] Failed to initialize Supabase client:', err);
    return createMockClient();
  }
}

function getAdminClient() {
  if (!client) {
    client = createAdminClient();
  }

  return client;
}

export const supabaseAdmin = new Proxy(
  {},
  {
    get(_target, prop) {
      return getAdminClient()[prop];
    },
  }
);
