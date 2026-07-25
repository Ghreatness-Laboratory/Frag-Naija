"use client";
import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Trophy, Users, Award, Zap, ChevronRight, TrendingUp, Clock, Flame, Gamepad2, Crosshair, Medal, Radio, ShieldCheck, Activity } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { getGameContent } from "@/lib/game-content";

type Athlete = {
  id: string; name: string; ign: string; role: string | null;
  rating: number; kills: number; assists: number; winrate: number;
  photo_url: string | null; status: string;
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

const TICKER_ITEMS: Record<string, string[]> = {
  'free-fire': [
    "FREE FIRE NIGERIA OPEN 2025 — SQUAD REGISTRATION LIVE",
    "TRANSFER WINDOW CLOSES IN 8 DAYS — FF PLAYERS MOVING",
    "LAGOS LIONS FF VS WARRI WOLVES — WATCH THE REPLAY",
    "FRAG NAIJA — NIGERIA'S PREMIER ESPORTS PLATFORM",
  ],
  default: [
    "PUBG NATIONAL CHAMPIONSHIP 2026 — REGISTRATION OPEN",
    "TRANSFER WINDOW CLOSES IN 8 DAYS",
    "NEW WAGER MARKETS ADDED — PLACE YOUR BET NOW",
    "FRAG NAIJA — NIGERIA'S PREMIER ESPORTS PLATFORM",
  ],
};



const reveal = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
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

const HERO_TAGLINES: Record<string, string> = {
  'free-fire':        "Survive the island. Claim the Booyah. Nigeria's fiercest Free Fire circuits are live.",
  'pubg-mobile':      "Nigeria's premier esports command platform. Compete in elite PUBG tournaments and place tactical wagers.",
  'cod-mobile':       "Drop in. Dominate. Nigeria's Call of Duty Mobile scene — ranked matches, tournaments, and live wagers.",
  'ea-fc-26':         "Lace up for Nigeria's top EA FC 26 leagues. Squad battles, tournaments, and live match wagers.",
  'mortal-kombat':    "Finish them. Nigeria's Mortal Kombat arena — brutal kombat, ranked ladders, and live wagers.",
  'efootball':        "Beautiful game, tactical edge. Nigeria's premier eFootball platform — leagues, players, and wagers.",
  'mobile-legends':   "5v5 glory awaits. Nigeria's Mobile Legends: Bang Bang circuits — drafts, tournaments, and wagers.",
};

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

function AthleteCard({ athlete, rank, primary }: { athlete: Athlete; rank: number; primary: string }) {
  const rankColors = [primary, "rgb(var(--fn-yellow))", "#C0C0C0", "#00aaff"];
  const col = rankColors[rank] ?? "rgb(var(--fn-muted))";
  return (
    <motion.div variants={reveal} whileHover={{ y: -6, rotateX: 2 }} className="flex-shrink-0">
    <Link href="/athletes" className="group relative block bg-fn-card border border-fn-gborder transition-all rounded-sm overflow-hidden w-40 sm:w-48"
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
        <div className="grid grid-cols-3 gap-1">
          {[
            { v: String(athlete.kills),   l: "KLS" },
            { v: `${athlete.winrate}%`,   l: "WR"  },
            { v: String(Number(athlete.rating).toFixed(1)), l: "RTG" },
          ].map(({ v, l }) => (
            <div key={l} className="text-center">
              <div className="text-[10px] font-bold text-fn-text">{v}</div>
              <div className="fn-label text-[7px]">{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-all" style={{ background: primary }} />
    </Link>
    </motion.div>
  );
}

function WagerPreviewCard({ wager, primary, reduceMotion }: { wager: Wager; primary: string; reduceMotion: boolean }) {
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
  const { selectedGame, isHydrated } = useGame();
  const [ticker, setTicker]       = useState(0);
  const [apiAthletes, setApiAthletes] = useState<Athlete[]>([]);
  const [wagers, setWagers]       = useState<Wager[]>([]);
  const [apiTransfers, setApiTransfers] = useState<Transfer[]>([]);

  const primary   = selectedGame.colors.primary;
  const secondary = selectedGame.colors.secondary;
  const isFF      = selectedGame.slug === 'free-fire';
  const reduceMotion = useReducedMotion();
  const tickerItems = TICKER_ITEMS[selectedGame.slug] ?? TICKER_ITEMS.default;
  const tagline     = HERO_TAGLINES[selectedGame.slug] ?? HERO_TAGLINES['pubg-mobile'];

  useEffect(() => {
    const t = setInterval(() => setTicker((p) => (p + 1) % tickerItems.length), 4000);
    return () => clearInterval(t);
  }, [tickerItems.length]);

  useEffect(() => {
    Promise.all([
      fetch("/api/athletes").then((r) => r.ok ? r.json() : []),
      fetch("/api/wagers/active").then((r) => r.ok ? r.json() : []),
      fetch("/api/transfers").then((r) => r.ok ? r.json() : []),
    ]).then(([a, w, t]) => {
      setApiAthletes(a.slice(0, 6));
      setWagers(w.slice(0, 3));
      setApiTransfers(t.slice(0, 4));
    });
  }, []);

  const gameContent = isHydrated ? getGameContent(selectedGame.slug) : null;

  // Athletes: filter API by game, fall back to game-specific dummies
  const gameAthletes: Athlete[] = (() => {
    const fromApi = apiAthletes.filter(a =>
      a.role || selectedGame.slug === 'pubg-mobile'
    );
    if (fromApi.length > 0) return fromApi;
    return (gameContent?.athletes ?? []).map(a => ({
      ...a,
      rating: a.overall_rating,
      kills: a.kills,
      assists: a.assists,
      winrate: a.winrate,
    })) as Athlete[];
  })();

  // Transfers: fall back to game-specific dummies
  const transfers: Transfer[] = apiTransfers.length > 0
    ? apiTransfers
    : (gameContent?.transfers ?? []).map(t => ({
        id: t.id, from_team: t.from_team, to_team: t.to_team,
        fee: t.fee, status: t.status, date: t.date,
        athletes: t.athletes,
      }));

  const stats = [
    { value: "1,242+", label: "Players",  icon: Users  },
    { value: "48",     label: "Tournaments",      icon: Trophy },
    { value: "12",     label: "Championships",    icon: Award  },
    { value: "₦4.2M",  label: "Total Prize Pool", icon: Zap    },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Live ticker */}
      <div className="border-b border-fn-gborder px-4 py-1.5 flex items-center gap-3 overflow-hidden"
        style={{ background: `${primary}08` }}
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
            <span className="w-6 h-px inline-block" style={{ background: primary }} />
            NIGERIA&apos;S PREMIERE ESPORTS PLATFORM
          </motion.p>
          <motion.h1 variants={reveal} className="font-display font-black uppercase leading-none mb-6">
            <span className="block text-[14vw] sm:text-[10vw] lg:text-9xl text-fn-text tracking-tight">FRAG</span>
            <span className="block text-[14vw] sm:text-[10vw] lg:text-9xl tracking-tight"
              style={{ color: primary, textShadow: `0 0 40px ${primary}40` }}>
              NAIJA
            </span>
          </motion.h1>
          {/* Active game badge */}
          <motion.div variants={reveal} className="flex items-center gap-2 mb-4">
            {isFF && <Flame size={12} style={{ color: primary }} />}
            <span
              className="electric-live inline-flex items-center gap-1.5 text-[9px] font-bold px-3 py-1 tracking-widest uppercase border rounded-sm"
              style={{ background: `${primary}15`, color: primary, borderColor: `${primary}40` }}
            >
              <span className="live-dot !h-1.5 !w-1.5" /> {selectedGame.name.toUpperCase()} MODE ACTIVE
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
            <Link href="/athletes"
              className="electric-button group inline-flex items-center gap-2 text-[11px] px-4 py-2.5 rounded-sm font-bold tracking-widest uppercase border transition-all"
              style={{ borderColor: `${primary}40`, color: primary }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = `${primary}15`)}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <Crosshair size={13} /> SCOUT ATHLETES <ChevronRight size={13} />
            </Link>
          </div>
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
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={reveal} transition={{ duration: 0.45 }} className="px-4 sm:px-8 lg:px-12 py-10 border-t border-fn-gborder">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="fn-label mb-1 flex items-center gap-1.5">
              {isFF && <Flame size={9} style={{ color: primary }} />}
              <ShieldCheck size={9} style={{ color: primary }} /> ROSTER
            </p>
            <h2 className="font-display text-2xl font-black uppercase text-fn-text">TOP ATHLETES</h2>
          </div>
          <Link href="/athletes"
            className="electric-button flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase border px-3 py-1.5 rounded-sm transition-all"
            style={{ borderColor: `${primary}30`, color: primary }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = `${primary}10`)}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
          >
            VIEW ALL <ChevronRight size={11} />
          </Link>
        </div>
        {gameAthletes.length === 0 ? (
          <p className="text-fn-muted text-[10px] py-6">No athletes yet — add them from the admin panel.</p>
        ) : (
          <motion.div variants={cardStagger} className="flex gap-3 overflow-x-auto pb-3">
            {gameAthletes.map((a, i) => (
              <AthleteCard key={a.id} athlete={a} rank={i} primary={primary} reduceMotion={!!reduceMotion} />
            ))}
          </motion.div>
        )}
      </motion.section>

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
            {wagers.map((w) => <WagerPreviewCard key={w.id} wager={w} primary={primary} reduceMotion={!!reduceMotion} />)}
          </motion.div>
        )}
      </motion.section>

      {/* Transfer Activity */}
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={reveal} transition={{ duration: 0.45 }} className="px-4 sm:px-8 lg:px-12 py-10 border-t border-fn-gborder">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="fn-label mb-1 flex items-center gap-1.5">
              <TrendingUp size={9} style={{ color: primary }} /> {selectedGame.shortName.toUpperCase()} TRANSFER ACTIVITY
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
              <span className="fn-label font-bold" style={{ color: primary }}>RECRUITMENT OPEN</span>
            </div>
            <p className="text-xs text-fn-text tracking-wide">
              {isFF
                ? "FRAG QUALIFIED FREE FIRE PLAYERS — OPEN TRIALS NOW LIVE"
                : "FRAG QUALIFIED ATHLETES IN THE OPEN TRIALS."}
            </p>
          </div>
          <Link
            href="/athletes"
            className="whitespace-nowrap text-[10px] px-4 py-2.5 rounded-sm font-bold tracking-widest uppercase transition-all"
            style={{ background: primary, color: 'rgb(var(--fn-black))' }}
          >
            JOIN THE RANKS
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
