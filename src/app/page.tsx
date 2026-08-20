"use client";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Users, Award, Zap, ChevronRight, TrendingUp, Clock, Flame, Gamepad2, Crosshair, Radio, ShieldCheck, Activity, ShoppingBag, CalendarDays, X, Building2, Medal } from "lucide-react";
import PlayerCardTemplate from "@/components/athletes/PlayerCardTemplate";
import { athleteStatusTone, clampStat, combatAttributes } from "@/lib/athlete-display";
import { GAMES } from "@/lib/games";
import { GAME_CONTENT } from "@/lib/game-content";
import { useGame } from "@/context/GameContext";
import { useAuthGate } from "@/components/common/LoginGate";

type Athlete = {
  id: string; name: string; ign: string; role: string | null;
  known_name?: string | null; team?: string | null; jersey_number?: number | string | null;
  rating?: number; overall_rating?: number; kills: number; assists: number; winrate: number;
  attack?: number; defense?: number; survival?: number; iq?: number; clutch?: number;
  photo_url: string | null; status: string; game_slug?: string | null; is_icon?: boolean | null;
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

type CompanyProfile = {
  company_name?: string | null;
  company_logo?: string | null;
};

type HomepageSettings = Record<string, string>;

type FeaturedAthleteItem = { id: string; athlete_id: string; sort_order: number; athlete: Athlete | null };

type HomepagePayload = {
  athletes?: Athlete[];
  featuredAthletes?: FeaturedAthleteItem[];
  wagers?: Wager[];
  transfers?: Transfer[];
  shopItems?: ShopItem[];
  tournaments?: Tournament[];
  teams?: Team[];
  homepageSettings?: HomepageSettings;
  companyProfile?: CompanyProfile;
};

let homepageDataPromise: Promise<HomepagePayload> | null = null;

function fetchHomepageData() {
  if (!homepageDataPromise) {
    homepageDataPromise = fetch('/api/homepage-data', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : {}))
      .catch(() => ({}))
      .finally(() => {
        homepageDataPromise = null;
      });
  }
  return homepageDataPromise;
}

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
    "NATIONAL ESPORTS CHAMPIONSHIP 2026 - REGISTRATION OPEN",
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

function CarouselRail({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const scrollByPage = (direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    rail.scrollBy({ left: direction * Math.max(280, rail.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div ref={railRef} className={`flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [-webkit-overflow-scrolling:touch] ${className}`}>
        {children}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-10 bg-gradient-to-r from-fn-black to-transparent lg:block" />
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-10 bg-gradient-to-l from-fn-black to-transparent lg:block" />
      <div className="mt-3 hidden justify-end gap-2 lg:flex">
        <button type="button" onClick={() => scrollByPage(-1)} className="rounded-sm border border-fn-gborder px-3 py-1 text-[10px] font-black uppercase tracking-widest text-fn-muted transition-all hover:border-fn-green hover:text-fn-green">← Prev</button>
        <button type="button" onClick={() => scrollByPage(1)} className="rounded-sm border border-fn-gborder px-3 py-1 text-[10px] font-black uppercase tracking-widest text-fn-muted transition-all hover:border-fn-green hover:text-fn-green">Next →</button>
      </div>
    </div>
  );
}

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

function GameSelectionModal({ open, onClose, onSelect, primary, requiresLogin }: { open: boolean; onClose: () => void; onSelect: (gameSlug: string) => void; primary: string; requiresLogin: boolean }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-fn-black/80 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="scout-game-title">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-sm border border-fn-gborder bg-fn-card p-5 shadow-2xl"
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
        <p className="mt-2 text-xs leading-relaxed text-fn-muted">Select which game roster you want to scout. Login is checked before any athlete roster or profile content can render.</p>
        {requiresLogin && (
          <div className="mt-4 rounded-sm border border-fn-yellow/30 bg-fn-yellow/10 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-fn-yellow">
            Login required after game selection — no athlete data is shown before sign in.
          </div>
        )}
        <div className="mt-5 grid min-h-0 gap-2 overflow-y-auto overscroll-contain pr-1 pb-1 sm:grid-cols-2 [-webkit-overflow-scrolling:touch]">
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

const AthleteCard = memo(function AthleteCard({ athlete, rank, primary }: { athlete: Athlete; rank: number; primary: string }) {
  const game = GAMES.find((item) => item.slug === athlete.game_slug);
  const rating = Number(athlete.overall_rating ?? athlete.rating ?? 0);

  return (
    <motion.div variants={reveal} className="w-[260px] flex-none">
      <Link href={`/athletes/${athlete.id}`} className="group block">
        <PlayerCardTemplate
          athlete={athlete}
          rating={rating}
          primary={game?.colors.primary ?? primary}
          gameName={(game?.shortName ?? 'ALL').toUpperCase()}
          rank={rank + 1}
          variant={athlete.is_icon ? "icon" : "compact"}
          className="transition-transform duration-200 group-hover:-translate-y-1"
        />
      </Link>
    </motion.div>
  );
});

AthleteCard.displayName = "AthleteCard";

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

function featuredAthleteName(athlete: Athlete) {
  return athlete.known_name || athlete.ign || athlete.name;
}

function FeaturedAthleteCard({ item, index, primary, secondary }: { item: FeaturedAthleteItem; index: number; primary: string; secondary: string }) {
  if (!item.athlete) return null;
  const athlete = item.athlete;
  const name = featuredAthleteName(athlete);
  const tone = athleteStatusTone(athlete.status, primary);
  const rankColor = index === 1 ? secondary : primary;
  const game = GAMES.find((item) => item.slug === athlete.game_slug);
  const gameLabel = game?.shortName ?? game?.name ?? athlete.game_slug ?? 'Game';
  const stats = combatAttributes(athlete, athlete.game_slug);

  return (
    <motion.article variants={reveal} className="group w-40 flex-none overflow-hidden rounded-sm border border-fn-gborder bg-fn-card shadow-[0_14px_44px_rgba(0,0,0,0.24)] transition-all hover:-translate-y-1 hover:border-fn-green/40 sm:w-48">
      <Link href={`/athletes/${athlete.id}`} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fn-green">
        <div className="relative aspect-[4/3] overflow-hidden bg-fn-dark">
          {athlete.photo_url ? (
            <img src={athlete.photo_url} alt={name} className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_center,rgba(77,255,110,.16),transparent_62%)] text-fn-green"><ShieldCheck size={42} /></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-fn-black/55 via-transparent to-fn-black/18" />
          <span className="absolute left-2 top-2 rounded-sm border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest" style={{ background: `${rankColor}22`, borderColor: `${rankColor}66`, color: rankColor }}>#{Number(item.sort_order ?? index) + 1}</span>
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.12em]" style={{ background: tone.background, borderColor: tone.borderColor, color: tone.color }}><span style={{ color: tone.dotColor }}>●</span>{athlete.status || 'Active'}</span>
        </div>
        <div className="bg-fn-card p-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-fn-green/30 bg-fn-green/10 text-fn-green"><Medal size={14} /></span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-display text-sm font-black uppercase tracking-wider text-fn-text sm:text-base">{name}</h3>
              <div className="mt-1 flex min-w-0 items-center gap-1.5"><p className="min-w-0 flex-1 truncate text-[8px] font-bold uppercase tracking-[0.16em] text-fn-muted">{athlete.role || 'Athlete'}</p><span className="shrink-0 rounded-sm border border-fn-gborder bg-fn-black/55 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.08em] text-fn-muted">{gameLabel}</span></div>
            </div>
          </div>
          <div className={`mt-3 grid ${stats.length === 3 ? 'grid-cols-3' : 'grid-cols-5'} gap-0.5 rounded-sm border border-fn-gborder bg-fn-black/55 p-1.5 text-center`}>
            {stats.map((stat) => (
              <div key={stat.label} className="min-w-0 px-0.5">
                <div className="font-display text-sm font-black leading-none text-fn-text sm:text-base">{clampStat(stat.value)}</div>
                <div className="mt-0.5 truncate text-[7px] font-black uppercase leading-none tracking-[0.06em] text-fn-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function FeaturedAthletes({ athletes, selectedGame, primary, secondary, showFireIcon, onViewAll }: { athletes: FeaturedAthleteItem[]; selectedGame: ReturnType<typeof useGame>["selectedGame"]; primary: string; secondary: string; showFireIcon: boolean; onViewAll: () => void; }) {
  return (
    <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={reveal} transition={{ duration: 0.45 }} className="border-t border-fn-gborder px-4 py-10 sm:px-8 lg:px-12">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="fn-label mb-1 flex items-center gap-1.5">{showFireIcon && <Flame size={9} style={{ color: primary }} />}<ShieldCheck size={9} style={{ color: primary }} /> ROSTER</p>
          <h2 className="font-display text-2xl font-black uppercase text-fn-text sm:text-3xl">FEATURED ATHLETES</h2>
        </div>
        <button type="button" onClick={onViewAll} className="electric-button flex shrink-0 items-center gap-1 rounded-sm border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all" style={{ borderColor: `${primary}30`, color: primary }}>VIEW ALL <ChevronRight size={11} /></button>
      </div>
      {athletes.length === 0 ? <p className="border border-dashed border-fn-gborder bg-fn-card/60 p-5 text-xs font-bold uppercase tracking-widest text-fn-muted">{selectedGame ? `No ${selectedGame.shortName} featured athletes have been added yet.` : 'No featured athletes have been added yet.'}</p> : (
        <motion.div variants={cardStagger} className="flex gap-3 overflow-x-auto pb-3 [-webkit-overflow-scrolling:touch]">
          {athletes.map((item, index) => <FeaturedAthleteCard key={item.id} item={item} index={index} primary={primary} secondary={secondary} />)}
        </motion.div>
      )}
    </motion.section>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { selectedGame, isHydrated } = useGame();
  const { user, loading: authLoading } = useAuthGate();
  const [ticker, setTicker]       = useState(0);
  const [allAthletes, setAllAthletes] = useState<Athlete[]>([]);
  const [featuredAthletes, setFeaturedAthletes] = useState<FeaturedAthleteItem[]>([]);
  const [wagers, setWagers]       = useState<Wager[]>([]);
  const [apiTransfers, setApiTransfers] = useState<Transfer[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
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
    const athletePath = `/athletes?game=${encodeURIComponent(gameSlug)}`;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(athletePath)}`);
      return;
    }
    router.push(athletePath);
  };

  useEffect(() => {
    const t = setInterval(() => setTicker((p) => (p + 1) % tickerItems.length), 4000);
    return () => clearInterval(t);
  }, [tickerItems.length]);

  useEffect(() => {
    let cancelled = false;

    fetchHomepageData().then((payload) => {
      if (cancelled) return;

      setAllAthletes(Array.isArray(payload.athletes) ? payload.athletes : []);
      setFeaturedAthletes(Array.isArray(payload.featuredAthletes) ? payload.featuredAthletes : []);
      setWagers(Array.isArray(payload.wagers) ? payload.wagers : []);
      setApiTransfers(Array.isArray(payload.transfers) ? payload.transfers : []);
      setShopItems(Array.isArray(payload.shopItems) ? payload.shopItems : []);
      setTournaments(Array.isArray(payload.tournaments) ? payload.tournaments : []);
      setAllTeams(Array.isArray(payload.teams) ? payload.teams : []);
      setHomepageSettings(payload.homepageSettings && !Array.isArray(payload.homepageSettings) ? payload.homepageSettings : {});
      setCompanyProfile(payload.companyProfile ?? null);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const featuredTeamIds = useMemo(() => parseFeaturedIds(homepageSettings.featured_team_ids), [homepageSettings.featured_team_ids]);
  const fallbackAthletes = useMemo(() => (
    selectedGame
      ? (GAME_CONTENT[selectedGame.slug]?.athletes ?? [])
      : Object.values(GAME_CONTENT).flatMap((content) => content.athletes)
  ).map((athlete) => ({ ...athlete, rating: athlete.overall_rating })), [selectedGame]);
  const fallbackTeamCards: Team[] = useMemo(() => {
    const fallbackTeams = selectedGame
      ? (GAME_CONTENT[selectedGame.slug]?.teams ?? [])
      : Object.values(GAME_CONTENT).flatMap((content) => content.teams);

    return fallbackTeams.map((team) => ({
      id: team.id,
      name: team.name,
      logo_url: team.logo_url,
      region: team.region,
      rank: team.rank,
      wins: team.wins,
      losses: team.losses,
      kills: team.kills,
      strength: team.strength,
      game_slug: team.game_slug,
    }));
  }, [selectedGame]);
  const athleteSource = allAthletes.length ? allAthletes : fallbackAthletes;
  const teamSource = allTeams.length || featuredTeamIds.length ? allTeams : fallbackTeamCards;
  const gameAthletes: FeaturedAthleteItem[] = useMemo(() => {
    return selectedGame
      ? featuredAthletes.filter((item) => item.athlete?.game_slug === selectedGame.slug)
      : featuredAthletes;
  }, [featuredAthletes, selectedGame]);
  const iconAthletes: Athlete[] = useMemo(() => {
    if (!user) return [];
    const icons = (athleteSource as Athlete[]).filter((athlete) => Boolean(athlete.is_icon));
    return selectedGame ? icons.filter((athlete) => athlete.game_slug === selectedGame.slug).slice(0, 6) : icons.slice(0, 6);
  }, [athleteSource, selectedGame, user]);
  const teams: Team[] = useMemo(() => selectedGame
    ? teamSource.filter((team) => team.game_slug === selectedGame.slug).slice(0, 4)
    : (featuredTeamIds.length && allTeams.length ? pickByIds(allTeams, featuredTeamIds) : teamSource.slice(0, 4)), [allTeams, featuredTeamIds, selectedGame, teamSource]);

  useEffect(() => {
    gameAthletes.slice(0, 3).forEach((athlete) => {
      if (!athlete.athlete?.photo_url) return;
      const image = new Image();
      image.decoding = 'async';
      image.src = athlete.athlete.photo_url;
    });
  }, [gameAthletes]);

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
        requiresLogin={!authLoading && !user}
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

      {/* Icon Athletes */}
      {showAthletes && iconAthletes.length > 0 && <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={reveal} transition={{ duration: 0.45 }} className="px-4 sm:px-8 lg:px-12 py-10 border-t border-fn-yellow/30" style={{ background: 'linear-gradient(135deg, rgba(245,197,66,0.10), rgba(5,5,5,0.32))' }}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="fn-label mb-1 flex items-center gap-1.5 text-fn-yellow">
              <Award size={9} /> ICON TIER
            </p>
            <h2 className="font-display text-2xl font-black uppercase text-fn-text">ICONS</h2>
          </div>
          <Link href="/athletes" className="inline-flex items-center gap-1 rounded-sm border border-fn-yellow/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-fn-yellow transition-all hover:bg-fn-yellow/10">
            VIEW LEGENDS <ChevronRight size={11} />
          </Link>
        </div>
        <motion.div variants={cardStagger} className="flex gap-3 overflow-x-auto pb-3">
          {iconAthletes.map((athlete, index) => (
            <AthleteCard key={athlete.id} athlete={athlete} rank={index} primary={primary} />
          ))}
        </motion.div>
      </motion.section>}

      {/* Featured Athletes */}
      {showAthletes && (
        <FeaturedAthletes
          athletes={gameAthletes}
          selectedGame={selectedGame}
          primary={primary}
          secondary={secondary}
          showFireIcon={isFF}
          onViewAll={() => setIsScoutPromptOpen(true)}
        />
      )}

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
          <motion.div variants={cardStagger}>
            <CarouselRail>
              {shopItems.map((item) => <Link key={item.id} href="/shop" className="group min-w-[240px] snap-start overflow-hidden rounded-sm border border-fn-gborder bg-fn-card transition-all hover:border-fn-green/40"><div className="h-32 bg-fn-dark flex items-center justify-center">{item.image_url ? <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" /> : <ShoppingBag style={{ color: primary }} />}</div><div className="p-3"><div className="fn-label mb-1">{item.category || item.status || 'Item'}</div><div className="text-xs font-bold text-fn-text">{item.name}</div><div className="mt-2 text-[11px] font-black" style={{ color: primary }}>{item.currency || 'NGN'} {Number(item.price || 0).toLocaleString()}</div></div></Link>)}
            </CarouselRail>
          </motion.div>)}
      </motion.section>}

      {/* Events Preview */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={reveal} transition={{ duration: 0.45 }} className="px-4 sm:px-8 lg:px-12 py-10 border-t border-fn-gborder" style={{ background: `${primary}04` }}>
        <div className="flex items-center justify-between mb-6"><div><p className="fn-label mb-1 flex items-center gap-1.5"><CalendarDays size={9} style={{ color: primary }} /> EVENTS</p><h2 className="font-display text-2xl font-black uppercase text-fn-text">TOURNAMENTS</h2></div><Link href="/tournaments" className="electric-button flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase border px-3 py-1.5 rounded-sm" style={{ borderColor: `${primary}30`, color: primary }}>VIEW ALL EVENTS <ChevronRight size={11} /></Link></div>
        {tournaments.length === 0 ? <p className="text-fn-muted text-[10px] py-6">No live or upcoming tournaments yet.</p> : <motion.div variants={cardStagger}><CarouselRail>{tournaments.map((event) => <Link key={event.id} href="/tournaments" className="min-w-[240px] snap-start rounded-sm border border-fn-gborder bg-fn-card p-4 transition-all hover:border-fn-green/40"><div className="fn-label mb-2">{event.game || "All Games"}</div><h3 className="text-sm font-black uppercase text-fn-text">{event.name}</h3><div className="mt-3 flex items-center justify-between"><span className="text-[9px] font-bold uppercase" style={{ color: primary }}>{event.status}</span><span className="text-[9px] text-fn-muted">{event.start_date ? new Date(event.start_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : 'TBA'}</span></div></Link>)}</CarouselRail></motion.div>}
      </motion.section>


      {/* Company Credit */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={reveal} transition={{ duration: 0.45 }} className="px-4 sm:px-8 lg:px-12 py-8 border-t border-fn-gborder">
        <Link href="/about" className="group flex items-center justify-between gap-4 rounded-sm border border-fn-gborder bg-fn-card p-4 transition-all hover:border-fn-green/40">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-sm border border-fn-gborder bg-fn-dark">
              {companyProfile?.company_logo ? <img src={companyProfile.company_logo} alt={`${companyProfile.company_name ?? 'Ghreatness Laboratory'} logo`} className="h-full w-full object-cover" /> : <Building2 size={18} className="text-fn-green" />}
            </div>
            <div>
              <p className="fn-label" style={{ color: primary }}>Powered by</p>
              <p className="text-xs font-black uppercase tracking-widest text-fn-text">{companyProfile?.company_name ?? 'Ghreatness Laboratory'}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-fn-muted transition-colors group-hover:text-fn-green">Meet the Creators <ChevronRight size={11} /></span>
        </Link>
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
