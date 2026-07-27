"use client";
import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Users, Award, Zap, ChevronRight, TrendingUp, Clock, Flame, Gamepad2, Crosshair, Medal, Radio, ShieldCheck, Activity, ShoppingBag, CalendarDays, X } from "lucide-react";
import { GAMES } from "@/lib/games";
import { combatAttributes } from "@/lib/athlete-display";
import { useGame } from "@/context/GameContext";

type Athlete = {
  id: string; name: string; ign: string; role: string | null;
  rating: number; overall_rating?: number; kills: number; assists: number; winrate: number;
  attack?: number; defense?: number; survival?: number; iq?: number; clutch?: number;
  photo_url: string | null; status: string; game_slug?: string | null;
};

type Wager = {
  id: string; question: string; subtitle: string | null;
  yes_odds: number; no_odds: number; yes_price: number; no_price: number;
  pool_total: number; hot: boolean; status: string; closes_at: string;
};

type Transfer = {
  id: string; from_team: string | null; to_team: string | null;
  fee: number | null; status: string; date: string | null;
  athletes: { id: string; name: string; ign: string } | null;
};

type ShopItem = {
  id: string; name: string; price: number; currency: string | null; image_url: string | null; category: string | null; status: string | null;
};

type HomepageSettings = Record<string, string>;

function settingEnabled(settings: HomepageSettings, key: string) {
  return String(settings[key] ?? 'true').toLowerCase() !== 'false';
}

function parseFeaturedIds(value: string | undefined) {
  return String(value ?? "").split(/[\n,]+/).map((id) => id.trim()).filter(Boolean);
}

function pickByIds<T extends { id: string }>(rows: T[], ids: string[]) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => byId.get(id)).filter(Boolean) as T[];
}

type Tournament = {
  id: string; name: string; start_date: string | null; end_date: string | null; status: string; game: string | null; prize_pool: number | null; currency: string | null;
};

type Team = {
  id: string; name: string; logo_url: string | null; region: string | null; rank: number | null; wins: number; losses: number; kills: number; strength: number | null; game_slug?: string | null; total_ranking_points?: number; power_rank?: number; players?: Athlete[];
};

const TICKER_ITEMS: Record<string, string[]> = {
  'free-fire': [
    "FREE FIRE NIGERIA OPEN 2025 SQUAD REGISTRATION LIVE",
    "TRANSFER WINDOW CLOSES IN 8 DAYS FF PLAYERS MOVING",
    "FAROUK  VS KILLERFREAK - WATCH THE REPLAY",
    "FRAG NAIJA NIGERIA'S PREMIERE ESPORTS PLATFORM",
  ],
  default: [
    "PUBG NATIONAL CHAMPIONSHIP 2026 - REGISTRATION OPEN",
    "TRANSFER WINDOW CLOSES IN 8 DAYS",
    "NEW WAGER MARKETS ADDED - PLACE YOUR BET NOW",
    "FRAG NAIJA - NIGERIA'S PREMIERE ESPORTS PLATFORM",
  ],
};



const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

const cardStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

function parseStat(value: string) {
  const numeric = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatStat(value: string, current: number) {
  if (value.includes("₦")) return `₦${current.toFixed(1)}M`;
  if (value.includes(",")) return `${Math.round(current).toLocaleString()}+`;
  if (value.includes("+")) return `${Math.round(current)}+`;
  return String(Math.round(current));
}


function StatCounter({ value, label, icon: Icon, color }: { value: string; label: string; icon: React.ElementType; color: string }) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : formatStat(value, 0));

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    const controls = { current: 0 };
    const target = parseStat(value);
    let frame = 0;
    const duration = 900;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      controls.current = target * eased;
      setDisplay(formatStat(value, controls.current));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion, value]);

  return (
    <motion.div
      variants={reveal}
      whileHover={reduceMotion ? undefined : { y: -4, scale: 1.02 }}
      className="group relative flex flex-1 flex-col items-center gap-1 overflow-hidden rounded-sm border border-fn-gborder bg-fn-card/70 p-3 min-w-[110px] sm:items-start"
    >
      <div className="absolute inset-x-0 top-0 h-px opacity-70" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <div className="flex h-7 w-7 items-center justify-center rounded-sm border bg-fn-card2 transition-transform group-hover:rotate-3" style={{ borderColor: `${color}35` }}>
        <Icon size={14} style={{ color }} />
      </div>
      <span className="font-display text-xl font-black text-fn-text sm:text-2xl">{display}</span>
      <span className="fn-label flex items-center gap-1"><Activity size={8} style={{ color }} /> {label}</span>
    </motion.div>
  );
}

function GameSelectionModal({ open, onClose, onSelect, primary }: { open: boolean; onClose: () => void; onSelect: (gameSlug: string) => void; primary: string }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-fn-black/80 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="scout-game-title">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md overflow-hidden rounded-sm border border-fn-gborder bg-fn-card p-5 shadow-2xl"
      >
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${primary}, transparent)` }} />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-sm border border-fn-gborder p-1 text-fn-muted transition-colors hover:text-fn-text"
          aria-label="Close game selection"
        >
          <X size={14} />
        </button>
        <p className="fn-label mb-2 flex items-center gap-1.5"><Crosshair size={10} style={{ color: primary }} /> SCOUTING TARGET</p>
        <h2 id="scout-game-title" className="font-display text-2xl font-black uppercase text-fn-text">Choose a game</h2>
        <p className="mt-2 text-xs leading-relaxed text-fn-muted">Select which game roster you want to scout. You’ll be taken to that game’s dedicated athletes page.</p>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {GAMES.filter((game) => game.available).map((game) => (
            <button
              key={game.slug}
              type="button"
              onClick={() => onSelect(game.slug)}
              className="group rounded-sm border border-fn-gborder bg-fn-black/50 p-3 text-left transition-all hover:bg-fn-card2"
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${game.colors.primary}70`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--fn-gborder))'; }}
            >
              <span className="block text-[11px] font-black uppercase tracking-widest text-fn-text">{game.name}</span>
              <span className="mt-1 inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest" style={{ color: game.colors.primary }}>
                Scout {game.shortName} <ChevronRight size={10} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function AthleteCard({ athlete, rank, primary }: { athlete: Athlete; rank: number; primary: string }) {
  const rankColors = [primary, "rgb(var(--fn-yellow))", "#C0C0C0", "#00aaff"];
  const col = rankColors[rank] ?? "rgb(var(--fn-muted))";
  const attrs = combatAttributes(athlete as unknown as Record<string, unknown>);
  return (
    <motion.div variants={reveal} whileHover={{ y: -6, rotateX: 2 }} className="flex-shrink-0">
    <Link href={`/athletes/${athlete.id}`} className="group relative block bg-fn-card border border-fn-gborder transition-all rounded-sm overflow-hidden w-40 sm:w-48"
      onMouseEnter={e => (e.currentTarget.style.borderColor = `${primary}50`)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
    >
      <div className="relative h-32 sm:h-40 bg-gradient-to-b from-fn-card2 to-fn-dark flex items-center justify-center overflow-hidden">
        {athlete.photo_url
          ? <img src={athlete.photo_url} alt={athlete.ign} className="w-full h-full object-cover" />
          : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-display font-black border-2 transition-all group-hover:scale-105"
              style={{ borderColor: col, color: col, background: `${col}15` }}>
              {athlete.ign[0]}
            </div>
          )}
        <div className="absolute top-2 left-2 px-1.5 py-0.5 text-[8px] font-bold tracking-widest uppercase"
          style={{ background: `${col}20`, border: `1px solid ${col}50`, color: col }}>
          #{rank + 1}
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: col }} />
          <span className="text-[7px] font-bold tracking-widest uppercase" style={{ color: col }}>{athlete.status}</span>
        </div>
      </div>
      <div className="p-3">
        <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-fn-text"><Medal size={10} style={{ color: col }} />{athlete.ign}</div>
        <div className="fn-label mb-2">{athlete.role || "Player"}</div>
        <div className="grid grid-cols-5 gap-1">
          {attrs.map(({ value, name }) => (
            <div key={name} className="text-center">
              <div className="text-[10px] font-bold text-white">{value}</div>
              <div className="fn-label text-[7px] text-fn-green">{name}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-all" style={{ background: primary }} />
    </Link>
    </motion.div>
  );
}

function WagerPreviewCard({ wager, primary }: { wager: Wager; primary: string }) {
  const closesIn = () => {
    const diff = new Date(wager.closes_at).getTime() - Date.now();
    if (diff <= 0) return "Closed";
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 48) return `${Math.floor(h / 24)}d`;
    if (h > 0)  return `${h}h ${m}m`;
    return `${m}m`;
  };
  return (
    <motion.div variants={reveal} whileHover={{ y: -5 }} className="group relative flex-shrink-0 overflow-hidden rounded-sm border border-fn-gborder bg-fn-card p-4 w-72 sm:w-80">
      <div className="flex items-center justify-between mb-2">
        <span className={`inline-flex items-center gap-1.5 text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm ${
          wager.hot ? "bg-fn-red/20 text-fn-red border border-fn-red/30" : "border border-fn-gborder"
        }`} style={!wager.hot ? { background: `${primary}15`, color: primary, borderColor: `${primary}30` } : {}}>
          <span className="live-dot !h-1.5 !w-1.5" /> {wager.hot ? "HOT" : "ACTIVE"}
        </span>
        <span className="fn-label">₦{Number(wager.pool_total).toLocaleString()}</span>
      </div>
      <h3 className="text-xs font-bold text-fn-text leading-snug mb-3">{wager.question}</h3>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="pred-yes rounded-sm px-2 py-2.5 text-center">
          <div className="text-[10px] font-bold">YES</div>
          <div className="text-base font-black">{wager.yes_odds}x</div>
        </div>
        <div className="pred-no rounded-sm px-2 py-2.5 text-center">
          <div className="text-[10px] font-bold">NO</div>
          <div className="text-base font-black">{wager.no_odds}x</div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[9px] text-fn-muted">
        <Link href="/wager" className="font-bold transition-colors" style={{ color: primary }}>Bet now →</Link>
        <span className="flex items-center gap-1"><Clock size={9} /> {closesIn()}</span>
      </div>
      <div className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 transition-transform group-hover:scale-x-100" style={{ background: primary }} />
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { selectedGame, isHydrated } = useGame();
  const [ticker, setTicker]       = useState(0);
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [wagers, setWagers]       = useState<Wager[]>([]);
  const [apiTransfers, setApiTransfers] = useState<Transfer[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings>({});
  const [isScoutPromptOpen, setIsScoutPromptOpen] = useState(false);

  const primary   = selectedGame?.colors.primary ?? 'rgb(var(--fn-green))';
  const secondary = selectedGame?.colors.secondary ?? 'rgb(var(--fn-yellow))';
  const isFF      = selectedGame?.slug === 'free-fire';
  const reduceMotion = useReducedMotion();
  const tickerItems = selectedGame ? (TICKER_ITEMS[selectedGame.slug] ?? TICKER_ITEMS.default) : TICKER_ITEMS.default;

  useEffect(() => {
    if (isHydrated && selectedGame) router.replace(`/${selectedGame.slug}`);
  }, [isHydrated, router, selectedGame]);
  const tagline     = homepageSettings.hero_tagline ?? "Nigeria's premier esports command platform. Scout top athletes, track teams, enter tournaments, and follow wagers across every supported game.";
  const heroEyebrow = homepageSettings.hero_eyebrow ?? "NIGERIA'S PREMIERE ESPORTS PLATFORM";
  const heroHeadline = homepageSettings.hero_headline ?? "FRAG NAIJA";
  const [headlineFirst, ...headlineRest] = heroHeadline.split(" ");

  const handleScoutGameSelect = (gameSlug: string) => {
    setIsScoutPromptOpen(false);
    router.push(`/athletes?game=${gameSlug}`);
  };

  useEffect(() => {
    const t = setInterval(() => setTicker((p) => (p + 1) % tickerItems.length), 4000);
    return () => clearInterval(t);
  }, [tickerItems.length]);

  useEffect(() => {
    const fetchJson = (url: string, fallback: unknown) =>
      fetch(url, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : fallback))
        .catch(() => fallback);

    Promise.all([
      fetchJson('/api/athletes', []),
      fetchJson('/api/wagers/active', []),
      fetchJson('/api/transfers', []),
      fetchJson('/api/shop-items', []),
      fetchJson('/api/tournaments', []),
      fetchJson('/api/teams', []),
      fetchJson('/api/homepage-settings', {}),
    ]).then(([a, w, t, s, tourneys, teamRows, settings]) => {
      const athletes = Array.isArray(a) ? a : [];
      const activeWagers = Array.isArray(w) ? w : [];
      const transfers = Array.isArray(t) ? t : [];
      const items = Array.isArray(s) ? s : [];
      const events = Array.isArray(tourneys) ? tourneys : [];
      const teamList = Array.isArray(teamRows) ? teamRows : [];

      setAllAthletes(athletes);
      setWagers(activeWagers.slice(0, 3));
      setApiTransfers(transfers.slice(0, 4));
      setShopItems(items.slice(0, 4));
      setTournaments(events.filter((event: Tournament) => ["Upcoming", "Live"].includes(event.status)).slice(0, 4));
      setAllTeams(teamList);
      setHomepageSettings(settings && !Array.isArray(settings) ? settings as HomepageSettings : {});
    });
  }, []);

  const featuredAthleteIds = parseFeaturedIds(homepageSettings.featured_athlete_ids);
  const featuredTeamIds = parseFeaturedIds(homepageSettings.featured_team_ids);
  const gameAthletes: Athlete[] = selectedGame
    ? allAthletes.filter((athlete) => athlete.game_slug === selectedGame.slug).slice(0, 6)
    : pickByIds(allAthletes, featuredAthleteIds);
  const teams: Team[] = selectedGame
    ? allTeams.filter((team) => team.game_slug === selectedGame.slug).slice(0, 4)
    : pickByIds(allTeams, featuredTeamIds);
  const showAthletes = settingEnabled(homepageSettings, 'show_athletes');
  const showTeams = settingEnabled(homepageSettings, 'show_teams');
  const showShop = settingEnabled(homepageSettings, 'show_shop');

  const transfers: Transfer[] = apiTransfers;

  const stats = [
    { value: homepageSettings.stat_players ?? "1,242+", label: "Players",  icon: Users  },
    { value: homepageSettings.stat_tournaments ?? "48", label: "Tournaments", icon: Trophy },
    { value: homepageSettings.stat_championships ?? "12", label: "Championships", icon: Award },
    { value: homepageSettings.stat_prize_pool ?? "₦17.2M", label: "Total Prize Pool", icon: Zap },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      <GameSelectionModal
        open={isScoutPromptOpen}
        onClose={() => setIsScoutPromptOpen(false)}
        onSelect={handleScoutGameSelect}
        primary={primary}
      />
      {/* Live ticker */}
      <div className="border-b border-fn-gborder px-4 py-1.5 flex items-center gap-3 overflow-hidden"
        style={{ background: `${primary}08` }}
      >
        <span className="text-[8px] font-bold tracking-widest uppercase flex-shrink-0 flex items-center gap-1.5"
          style={{ color: primary }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: primary }} />
          <Radio size={9} /> LIVE FEED
        </span>
        <div className="overflow-hidden flex-1">
          <motion.span
            className="inline-block text-[9px] text-fn-text tracking-wider"
            key={ticker}
            initial={reduceMotion ? false : { opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            {tickerItems[ticker]}
          </motion.span>
        </div>
        {isFF && (
          <Flame size={11} style={{ color: primary }} className="flex-shrink-0" />
        )}
      </div>

      {/* Hero */}
      <section
        className="relative min-h-[85vh] flex flex-col justify-center px-4 sm:px-8 lg:px-12 bg-grid-fn bg-grid overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primary}06 0%, rgb(var(--fn-black)) 55%)` }}
      >
        {/* Corner accents */}
        <div className="absolute top-8 left-4 w-16 h-16 border-l-2 border-t-2 pointer-events-none"
          style={{ borderColor: `${primary}30` }} />
        <div className="absolute bottom-8 right-4 w-16 h-16 border-r-2 border-b-2 pointer-events-none"
          style={{ borderColor: `${primary}30` }} />
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: `radial-gradient(circle, ${primary}08 0%, transparent 70%)` }} />
        <div className="fn-scanlines absolute inset-0 pointer-events-none opacity-30" />
        <motion.div
          aria-hidden
          className="absolute right-6 top-24 hidden h-48 w-48 rounded-full border lg:block"
          style={{ borderColor: `${primary}22` }}
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          <Crosshair className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" size={72} style={{ color: `${primary}55` }} />
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={reveal} transition={{ duration: 0.55 }} className="max-w-4xl relative">
          <p className="fn-label mb-3 flex items-center gap-2">
            <Gamepad2 size={12} style={{ color: primary }} />
            {heroEyebrow}
          </p>
          <motion.h1 variants={reveal} className="font-display font-black uppercase leading-none mb-6">
            <span className="block text-[14vw] sm:text-[10vw] lg:text-9xl text-fn-text tracking-tight">{headlineFirst}</span>
            <span className="block text-[14vw] sm:text-[10vw] lg:text-9xl tracking-tight"
              style={{ color: primary, textShadow: `0 0 40px ${primary}40` }}>
              {headlineRest.join(" ") || "NAIJA"}
            </span>
          </motion.h1>
          {/* Active game badge */}
          <motion.div variants={reveal} className="flex items-center gap-2 mb-4">
            {isFF && <Flame size={12} style={{ color: primary }} />}
            <span
              className="electric-live inline-flex items-center gap-1.5 text-[9px] font-bold px-3 py-1 tracking-widest uppercase border rounded-sm"
              style={{ background: `${primary}15`, color: primary, borderColor: `${primary}40` }}
            >
              <span className="live-dot !h-1.5 !w-1.5" /> {selectedGame ? `${selectedGame.shortName.toUpperCase()} DASHBOARD` : 'ALL GAMES DASHBOARD'}
            </span>
          </motion.div>
          <motion.p variants={reveal} className="text-fn-text text-xs sm:text-sm tracking-wider max-w-lg mb-8 leading-relaxed">
            {tagline}
          </motion.p>
          <motion.div variants={reveal} className="flex flex-wrap gap-3">
            <Link href="/tournaments"
              className="inline-flex items-center gap-2 text-[11px] px-4 py-2.5 rounded-sm font-bold tracking-widest uppercase transition-all"
              style={{ background: primary, color: 'rgb(var(--fn-black))' }}
            >
              <Trophy size={13} /> JOIN TOURNAMENTS
            </Link>
            <button
              type="button"
              onClick={() => setIsScoutPromptOpen(true)}
              className="electric-button group inline-flex items-center gap-2 text-[11px] px-4 py-2.5 rounded-sm font-bold tracking-widest uppercase border transition-all"
              style={{ borderColor: `${primary}40`, color: primary }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = `${primary}15`)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <Crosshair size={13} /> SCOUT ATHLETES <ChevronRight size={13} />
            </button>
          </motion.div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }} className="flex flex-wrap gap-2 mt-10 max-w-2xl relative">
          {stats.map((s) => <StatCounter key={s.label} {...s} color={primary} />)}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25, duration: 0.55 }}
          className="relative mt-6 max-w-2xl overflow-hidden rounded-sm border border-fn-gborder bg-fn-card/70 p-4 backdrop-blur-sm lg:absolute lg:bottom-14 lg:right-12 lg:mt-0 lg:w-80"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="fn-label flex items-center gap-1.5"><Trophy size={10} style={{ color: primary }} /> Ranked Lobby</span>
            <span className="rounded-sm border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest" style={{ color: primary, borderColor: `${primary}35`, background: `${primary}10` }}>Live</span>
          </div>
          {[
            { label: "Squad slots", value: 74, icon: Users },
            { label: "Prize pool loaded", value: 88, icon: Zap },
            { label: "Qualifier heat", value: 62, icon: Flame },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="mb-3 last:mb-0">
              <div className="mb-1 flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-fn-muted">
                <span className="flex items-center gap-1.5"><Icon size={10} style={{ color: primary }} />{label}</span>
                <span style={{ color: primary }}>{value}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-fn-dark">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${primary}, ${secondary})` }}
                  initial={{ width: reduceMotion ? `${value}%` : 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.9, delay: 0.35 }}
                />
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Top Athletes */}
      {showAthletes && <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={reveal} transition={{ duration: 0.45 }} className="px-4 sm:px-8 lg:px-12 py-10 border-t border-fn-gborder">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="fn-label mb-1 flex items-center gap-1.5">
              {isFF && <Flame size={9} style={{ color: primary }} />}
              <ShieldCheck size={9} style={{ color: primary }} /> ROSTER
            </p>
            <h2 className="font-display text-2xl font-black uppercase text-fn-text">TOP ATHLETES</h2>
          </div>
          <button
            type="button"
            onClick={() => setIsScoutPromptOpen(true)}
            className="electric-button flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase border px-3 py-1.5 rounded-sm transition-all"
            style={{ borderColor: `${primary}30`, color: primary }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = `${primary}10`)}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            VIEW ALL <ChevronRight size={11} />
          </button>
        </div>
        {gameAthletes.length === 0 ? (
          <p className="text-fn-muted text-[10px] py-6">{selectedGame ? `No ${selectedGame.shortName} athletes yet.` : 'No featured athletes yet — add them from the admin panel.'}</p>
        ) : (
          <motion.div variants={cardStagger} className="flex gap-3 overflow-x-auto pb-3">
            {gameAthletes.map((a, i) => (
              <AthleteCard key={a.id} athlete={a} rank={i} primary={primary} />
            ))}
          </motion.div>
        )}
      </motion.section>}

      {/* Wager Preview */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={reveal} transition={{ duration: 0.45 }} className="px-4 sm:px-8 lg:px-12 py-10 border-t border-fn-gborder"
        style={{ background: `${primary}04` }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="fn-label mb-1 flex items-center gap-1.5">
              <Flame size={9} style={{ color: secondary }} /> HOT MARKETS
            </p>
            <h2 className="font-display text-2xl font-black uppercase text-fn-text">WAGER ZONE</h2>
          </div>
          <Link href="/wager"
            className="inline-flex items-center gap-1 text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-sm transition-all"
            style={{ background: primary, color: 'rgb(var(--fn-black))' }}
          >
            ENTER ZONE <ChevronRight size={11} />
          </Link>
        </div>
        {wagers.length === 0 ? (
          <p className="text-fn-muted text-[10px] py-6">No active wager markets — check back soon.</p>
        ) : (
          <motion.div variants={cardStagger} className="flex gap-4 overflow-x-auto pb-3">
            {wagers.map((w) => <WagerPreviewCard key={w.id} wager={w} primary={primary} />)}
          </motion.div>
        )}
      </motion.section>



      {/* Shop Preview */}
      {showShop && <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={reveal} transition={{ duration: 0.45 }} className="px-4 sm:px-8 lg:px-12 py-10 border-t border-fn-gborder">
        <div className="flex items-center justify-between mb-6">
          <div><p className="fn-label mb-1 flex items-center gap-1.5"><ShoppingBag size={9} style={{ color: primary }} /> MERCH DROP</p><h2 className="font-display text-2xl font-black uppercase text-fn-text">SHOP</h2></div>
          <Link href="/shop" className="electric-button flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase border px-3 py-1.5 rounded-sm transition-all" style={{ borderColor: `${primary}30`, color: primary }}>VIEW SHOP <ChevronRight size={11} /></Link>
        </div>
        {shopItems.length === 0 ? <p className="text-fn-muted text-[10px] py-6">No shop items are published yet.</p> : (
          <motion.div variants={cardStagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {shopItems.map((item) => <Link key={item.id} href="/shop" className="group overflow-hidden rounded-sm border border-fn-gborder bg-fn-card transition-all hover:border-fn-green/40"><div className="h-32 bg-fn-dark flex items-center justify-center">{item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <ShoppingBag style={{ color: primary }} />}</div><div className="p-3"><div className="fn-label mb-1">{item.category || item.status || 'Item'}</div><div className="text-xs font-bold text-fn-text">{item.name}</div><div className="mt-2 text-[11px] font-black" style={{ color: primary }}>{item.currency || 'NGN'} {Number(item.price || 0).toLocaleString()}</div></div></Link>)}
          </motion.div>)}
      </motion.section>}

      {/* Events Preview */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={reveal} transition={{ duration: 0.45 }} className="px-4 sm:px-8 lg:px-12 py-10 border-t border-fn-gborder" style={{ background: `${primary}04` }}>
        <div className="flex items-center justify-between mb-6"><div><p className="fn-label mb-1 flex items-center gap-1.5"><CalendarDays size={9} style={{ color: primary }} /> EVENTS</p><h2 className="font-display text-2xl font-black uppercase text-fn-text">TOURNAMENTS</h2></div><Link href="/tournaments" className="electric-button flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase border px-3 py-1.5 rounded-sm" style={{ borderColor: `${primary}30`, color: primary }}>VIEW ALL EVENTS <ChevronRight size={11} /></Link></div>
        {tournaments.length === 0 ? <p className="text-fn-muted text-[10px] py-6">No live or upcoming tournaments yet.</p> : <motion.div variants={cardStagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{tournaments.map((event) => <Link key={event.id} href="/tournaments" className="rounded-sm border border-fn-gborder bg-fn-card p-4 transition-all hover:border-fn-green/40"><div className="fn-label mb-2">{event.game || "All Games"}</div><h3 className="text-sm font-black uppercase text-fn-text">{event.name}</h3><div className="mt-3 flex items-center justify-between"><span className="text-[9px] font-bold uppercase" style={{ color: primary }}>{event.status}</span><span className="text-[9px] text-fn-muted">{event.start_date ? new Date(event.start_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : 'TBA'}</span></div></Link>)}</motion.div>}
      </motion.section>

      {/* Teams Preview */}
      {showTeams && <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={reveal} transition={{ duration: 0.45 }} className="px-4 sm:px-8 lg:px-12 py-10 border-t border-fn-gborder">
        <div className="flex items-center justify-between mb-6"><div><p className="fn-label mb-1 flex items-center gap-1.5"><Users size={9} style={{ color: primary }} /> POWER RANKINGS</p><h2 className="font-display text-2xl font-black uppercase text-fn-text">TEAMS</h2></div><Link href="/teams" className="electric-button flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase border px-3 py-1.5 rounded-sm" style={{ borderColor: `${primary}30`, color: primary }}>VIEW ALL TEAMS <ChevronRight size={11} /></Link></div>
        {teams.length === 0 ? <p className="text-fn-muted text-[10px] py-6">{selectedGame ? `No ${selectedGame.shortName} teams have been ranked yet.` : 'No featured teams yet — add them from the admin panel.'}</p> : <motion.div variants={cardStagger} className="overflow-hidden rounded-sm border border-fn-gborder bg-fn-card">{teams.map((team, index) => { const game = GAMES.find((g) => g.slug === team.game_slug); return <Link key={team.id} href={`/teams/${team.id}`} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-fn-gborder/60 p-3 text-left transition-all last:border-0 hover:bg-fn-card2"><span className="font-display text-lg font-black" style={{ color: index === 0 ? secondary : primary }}>#{team.power_rank ?? index + 1}</span><span className="min-w-0"><span className="block truncate text-xs font-black uppercase text-fn-text">{team.name}</span><span className="mt-1 inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest" style={{ borderColor: `${game?.colors.primary ?? primary}40`, color: game?.colors.primary ?? primary, background: `${game?.colors.primary ?? primary}12` }}>{game?.shortName ?? team.game_slug ?? "Game"}</span></span><span className="text-right"><span className="block text-sm font-black text-fn-text">{Number(team.total_ranking_points ?? 0).toFixed(0)}</span><span className="fn-label">PTS</span></span></Link>; })}</motion.div>}
      </motion.section>}

      {/* Transfer Activity */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={reveal} transition={{ duration: 0.45 }} className="px-4 sm:px-8 lg:px-12 py-10 border-t border-fn-gborder">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="fn-label mb-1 flex items-center gap-1.5">
              <TrendingUp size={9} style={{ color: primary }} /> ALL GAMES TRANSFER ACTIVITY
            </p>
            <h2 className="font-display text-2xl font-black uppercase text-fn-text">PENDING PAYABLES</h2>
          </div>
          <Link href="/transfer-window"
            className="flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase border px-3 py-1.5 rounded-sm transition-all"
            style={{ borderColor: 'rgb(var(--fn-gborder))', color: 'rgb(var(--fn-muted))' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${primary}40`; (e.currentTarget as HTMLElement).style.color = primary; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--fn-gborder))'; (e.currentTarget as HTMLElement).style.color = 'rgb(var(--fn-muted))'; }}
          >
            VIEW ALL <ChevronRight size={11} />
          </Link>
        </div>
        {transfers.length === 0 ? (
          <p className="text-fn-muted text-[10px] py-6">No transfers recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-fn-gborder">
                  {["Player", "From", "To", "Fee", "Status", "Date"].map((h) => (
                    <th key={h} className="fn-label pb-3 text-left pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => {
                  const player = t.athletes?.ign || t.athletes?.name || "—";
                  const isConfirmed = t.status === "Confirmed";
                  return (
                    <tr key={t.id} className="border-b border-fn-gborder/50 hover:bg-fn-card/50 transition-colors">
                      <td className="py-3 pr-4 text-[11px] font-bold text-fn-text">{player}</td>
                      <td className="py-3 pr-4 text-[10px] text-fn-muted">{t.from_team || "—"}</td>
                      <td className="py-3 pr-4 text-[10px] text-fn-text">{t.to_team || "—"}</td>
                      <td className="py-3 pr-4 text-[10px] font-bold" style={{ color: secondary }}>
                        {t.fee ? `₦${Number(t.fee).toLocaleString()}` : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 border"
                          style={isConfirmed
                            ? { background: `${primary}20`, color: primary, borderColor: `${primary}40` }
                            : { background: 'rgb(var(--fn-yellow) / 0.10)', color: 'rgb(var(--fn-yellow))', borderColor: 'rgb(var(--fn-yellow) / 0.28)' }}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 text-[10px] text-fn-muted">
                        {t.date ? new Date(t.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Recruitment banner */}
        <div
          className="mt-6 p-4 sm:p-6 bg-fn-card border border-fn-gborder rounded-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ borderColor: `${primary}20` }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={12} style={{ color: primary }} />
              <span className="fn-label font-bold" style={{ color: primary }}>{homepageSettings.recruitment_headline ?? "RECRUITMENT OPEN"}</span>
            </div>
            <p className="text-xs text-fn-text tracking-wide">
              {homepageSettings.recruitment_body ?? "FRAG QUALIFIED ATHLETES IN THE OPEN TRIALS."}
            </p>
          </div>
          <Link
            href="/athletes"
            className="whitespace-nowrap text-[10px] px-4 py-2.5 rounded-sm font-bold tracking-widest uppercase transition-all"
            style={{ background: primary, color: 'rgb(var(--fn-black))' }}
          >
            {homepageSettings.recruitment_cta ?? "JOIN THE RANKS"}
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
