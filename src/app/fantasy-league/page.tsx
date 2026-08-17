"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Crown, Shield, Users, WalletCards } from "lucide-react";
import { useGame } from "@/context/GameContext";
import {
  FANTASY_BENCH_COUNT,
  FANTASY_MAX_PLAYERS_PER_TEAM,
  FANTASY_SQUAD_BUDGET_NAIRA,
  FANTASY_SQUAD_SIZE,
  FANTASY_STARTER_COUNT,
  appliesTeamLimit,
  countTeamMembers,
  formatNaira,
  getFantasyRating,
  hasDuplicateFantasyPrices,
  priceFantasyAthletes,
} from "@/lib/fantasy";

type Athlete = {
  id: string;
  name: string;
  ign: string;
  team: string | null;
  role: string | null;
  status: string;
  rating?: number | null;
  overall_rating?: number | null;
  photo_url: string | null;
};

type SlotType = "starter" | "bench";

type SquadPick = {
  athlete: Athlete & { fantasy_price: number };
  slot: SlotType;
};

function slotCount(picks: SquadPick[], slot: SlotType) {
  return picks.filter((pick) => pick.slot === slot).length;
}

export default function FantasyLeaguePage() {
  const { selectedGame } = useGame();
  const [athletes, setAthletes] = useState<Array<Athlete & { fantasy_price: number }>>([]);
  const [picks, setPicks] = useState<SquadPick[]>([]);
  const [captainId, setCaptainId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/athletes", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAthletes(priceFantasyAthletes(Array.isArray(data) ? data : [])))
      .finally(() => setLoading(false));
  }, []);

  const teamLimitApplies = appliesTeamLimit(selectedGame.slug);
  const totalValue = picks.reduce((sum, pick) => sum + pick.athlete.fantasy_price, 0);
  const remaining = FANTASY_SQUAD_BUDGET_NAIRA - totalValue;
  const duplicatePrices = hasDuplicateFantasyPrices(athletes);
  const teamCounts = countTeamMembers(picks.map((pick) => pick.athlete));

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (totalValue > FANTASY_SQUAD_BUDGET_NAIRA) errors.push(`Budget exceeded — remove ${formatNaira(totalValue - FANTASY_SQUAD_BUDGET_NAIRA)} from your squad.`);
    if (picks.length !== FANTASY_SQUAD_SIZE) errors.push(`Pick exactly ${FANTASY_SQUAD_SIZE} athletes.`);
    if (slotCount(picks, "starter") !== FANTASY_STARTER_COUNT) errors.push(`Pick exactly ${FANTASY_STARTER_COUNT} starters.`);
    if (slotCount(picks, "bench") !== FANTASY_BENCH_COUNT) errors.push(`Pick exactly ${FANTASY_BENCH_COUNT} bench athletes.`);
    if (!captainId) errors.push("Select a captain.");
    if (picks.some((pick) => pick.athlete.status !== "Active")) errors.push("Inactive athletes cannot be included.");
    if (teamLimitApplies) {
      Object.entries(teamCounts).forEach(([team, count]) => {
        if (count > FANTASY_MAX_PLAYERS_PER_TEAM) errors.push(`Maximum ${FANTASY_MAX_PLAYERS_PER_TEAM} players per team exceeded for ${team}.`);
      });
    }
    return errors;
  }, [captainId, picks, teamCounts, teamLimitApplies, totalValue]);

  function addAthlete(athlete: Athlete & { fantasy_price: number }, slot: SlotType) {
    setMessage("");
    if (picks.some((pick) => pick.athlete.id === athlete.id)) {
      setMessage(`${athlete.ign} is already in your squad.`);
      return;
    }
    if (picks.length >= FANTASY_SQUAD_SIZE) {
      setMessage(`Squad is full — remove a player before adding ${athlete.ign}.`);
      return;
    }
    if (slot === "starter" && slotCount(picks, "starter") >= FANTASY_STARTER_COUNT) {
      setMessage(`Starter slots are full — remove a starter before adding ${athlete.ign}.`);
      return;
    }
    if (slot === "bench" && slotCount(picks, "bench") >= FANTASY_BENCH_COUNT) {
      setMessage(`Bench slots are full — remove a bench player before adding ${athlete.ign}.`);
      return;
    }
    if (totalValue + athlete.fantasy_price > FANTASY_SQUAD_BUDGET_NAIRA) {
      setMessage(`Budget exceeded — ${athlete.ign} would take squad value to ${formatNaira(totalValue + athlete.fantasy_price)}.`);
      return;
    }
    if (teamLimitApplies && athlete.team && (teamCounts[athlete.team] ?? 0) >= FANTASY_MAX_PLAYERS_PER_TEAM) {
      setMessage(`Maximum ${FANTASY_MAX_PLAYERS_PER_TEAM} players per team reached — remove another ${athlete.team} player first.`);
      return;
    }
    if (athlete.status !== "Active") {
      setMessage(`${athlete.ign} is inactive and cannot be selected.`);
      return;
    }
    setPicks((current) => [...current, { athlete, slot }]);
  }

  function removeAthlete(id: string) {
    setPicks((current) => current.filter((pick) => pick.athlete.id !== id));
    if (captainId === id) setCaptainId("");
  }

  const sortedAthletes = [...athletes].sort((a, b) => b.fantasy_price - a.fantasy_price);

  return (
    <div className="min-h-screen px-4 py-10 sm:px-8 lg:px-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="fn-label mb-2 flex items-center gap-2"><Crown size={12} className="text-fn-green" /> Fantasy League</p>
          <h1 className="font-display text-3xl font-black uppercase text-fn-text">Squad Builder</h1>
          <p className="mt-2 max-w-2xl text-sm text-fn-muted">Build a 4-starter / 2-bench roster under the confirmed {formatNaira(FANTASY_SQUAD_BUDGET_NAIRA)} budget.</p>
        </div>
        <div className="rounded-sm border border-fn-gborder bg-fn-card p-4 text-right">
          <p className="fn-label">Budget Readout</p>
          <p className="font-display text-2xl font-black text-fn-green">{formatNaira(FANTASY_SQUAD_BUDGET_NAIRA)}</p>
          <p className={remaining < 0 ? "text-xs text-fn-red" : "text-xs text-fn-muted"}>{formatNaira(remaining)} remaining</p>
        </div>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-sm border border-fn-gborder bg-fn-card p-4"><p className="fn-label">Squad Value Validation</p><p className="text-sm text-fn-text">Cap is read from <code>FANTASY_SQUAD_BUDGET_NAIRA</code>: {formatNaira(FANTASY_SQUAD_BUDGET_NAIRA)}</p></div>
        <div className="rounded-sm border border-fn-gborder bg-fn-card p-4"><p className="fn-label">Same-team Rule</p><p className="text-sm text-fn-text">{teamLimitApplies ? `Active: max ${FANTASY_MAX_PLAYERS_PER_TEAM} per real team.` : "Skipped for games without meaningful team fields."}</p></div>
        <div className="rounded-sm border border-fn-gborder bg-fn-card p-4"><p className="fn-label">Duplicate Price Check</p><p className={duplicatePrices ? "text-sm text-fn-red" : "text-sm text-fn-green"}>{duplicatePrices ? "Duplicate fantasy prices detected" : "No duplicate fantasy prices in roster"}</p></div>
      </div>

      {message && <div className="mb-5 flex items-center gap-2 rounded-sm border border-fn-red/30 bg-fn-red/10 p-3 text-xs font-bold uppercase tracking-widest text-fn-red"><AlertTriangle size={14} /> {message}</div>}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section>
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-black uppercase text-fn-text">Roster Pricing</h2><span className="fn-label">{athletes.length} athletes</span></div>
          {loading ? <p className="text-fn-muted">Loading athletes...</p> : (
            <div className="grid gap-3 md:grid-cols-2">
              {sortedAthletes.map((athlete) => (
                <article key={athlete.id} className="rounded-sm border border-fn-gborder bg-fn-card p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div><p className="text-sm font-bold text-fn-text">{athlete.ign}</p><p className="fn-label">{athlete.team || "No team"} • {getFantasyRating(athlete).toFixed(1)} RTG</p></div>
                    <p className="font-display text-lg font-black text-fn-green">{formatNaira(athlete.fantasy_price)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => addAthlete(athlete, "starter")} className="flex-1 rounded-sm border border-fn-gborder px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-fn-text hover:border-fn-green">Add Starter</button>
                    <button onClick={() => addAthlete(athlete, "bench")} className="flex-1 rounded-sm border border-fn-gborder px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-fn-text hover:border-fn-green">Add Bench</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-sm border border-fn-gborder bg-fn-card p-5 xl:sticky xl:top-20 xl:self-start">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-black uppercase text-fn-text">My Squad</h2><Users size={18} className="text-fn-green" /></div>
          <div className="mb-4 space-y-2">
            {picks.length === 0 ? <p className="text-xs text-fn-muted">No athletes selected yet.</p> : picks.map((pick) => (
              <div key={pick.athlete.id} className="rounded-sm border border-fn-gborder bg-fn-dark p-3">
                <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-fn-text">{pick.athlete.ign}</p><p className="fn-label">{pick.slot} • {pick.athlete.team || "No team"}</p></div><p className="text-xs font-bold text-fn-green">{formatNaira(pick.athlete.fantasy_price)}</p></div>
                <div className="mt-2 flex items-center justify-between"><label className="flex items-center gap-2 text-[10px] text-fn-muted"><input type="radio" name="captain" checked={captainId === pick.athlete.id} onChange={() => setCaptainId(pick.athlete.id)} /> Captain</label><button onClick={() => removeAthlete(pick.athlete.id)} className="text-[10px] uppercase tracking-widest text-fn-red">Remove</button></div>
              </div>
            ))}
          </div>
          <div className="mb-4 rounded-sm border border-fn-gborder bg-fn-dark p-3"><p className="flex items-center gap-2 text-sm text-fn-text"><WalletCards size={14} className="text-fn-green" /> {formatNaira(totalValue)} / {formatNaira(FANTASY_SQUAD_BUDGET_NAIRA)}</p></div>
          {validationErrors.length ? <ul className="space-y-2">{validationErrors.map((error) => <li key={error} className="flex gap-2 text-xs text-fn-red"><AlertTriangle size={13} className="mt-0.5 shrink-0" /> {error}</li>)}</ul> : <p className="flex items-center gap-2 text-xs text-fn-green"><CheckCircle2 size={14} /> Squad is valid and ready to confirm.</p>}
          <div className="mt-5 border-t border-fn-gborder pt-4"><p className="fn-label mb-2"><Shield size={10} className="inline" /> Team Counts</p>{Object.keys(teamCounts).length ? Object.entries(teamCounts).map(([team, count]) => <p key={team} className={count > FANTASY_MAX_PLAYERS_PER_TEAM ? "text-xs text-fn-red" : "text-xs text-fn-muted"}>{team}: {count}/{FANTASY_MAX_PLAYERS_PER_TEAM}</p>) : <p className="text-xs text-fn-muted">No team selections yet.</p>}</div>
        </aside>
      </div>
    </div>
  );
}
