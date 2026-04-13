"use client";
import { useState } from "react";
import { liveFeed, groupStandings, upcomingMatches } from "@/lib/data";
import { Trophy, Users, ChevronRight } from "lucide-react";

const bracketRounds = [
  {
    round: "QUARTER FINALS",
    matches: [
      { home: "Athlegame",   away: "Delta Force",  homeScore: 3, awayScore: 0, done: true },
      { home: "Naija Force", away: "Cyber Kings",  homeScore: 3, awayScore: 1, done: true },
      { home: "Lagos Lions", away: "Night Hawks",  homeScore: 2, awayScore: 3, done: true },
      { home: "Abuja Storm", away: "Phantom Exp",  homeScore: 3, awayScore: 2, done: true },
    ],
  },
  {
    round: "SEMI FINALS",
    matches: [
      { home: "Athlegame",   away: "Naija Force",  homeScore: 3, awayScore: 1, done: true },
      { home: "Night Hawks", away: "Abuja Storm",  homeScore: null, awayScore: null, done: false },
    ],
  },
  {
    round: "GRAND FINAL",
    matches: [
      { home: "Athlegame", away: "TBD", homeScore: null, awayScore: null, done: false },
    ],
  },
];

export default function TournamentsPage() {
  const [activeTab, setActiveTab] = useState<"bracket" | "standings" | "upcoming">("standings");

  return (
    <div className="min-h-screen">
      {/* Hero banner */}
      <div className="relative bg-gradient-to-b from-fn-card2 to-fn-dark border-b border-fn-gborder px-4 sm:px-8 lg:px-12 py-8 sm:py-12 overflow-hidden">
        <div className="absolute inset-0 bg-grid-fn bg-grid opacity-40 pointer-events-none" />
        <div className="absolute top-4 right-4 w-24 h-24 border border-fn-green/10 rounded-full pointer-events-none" />
        <div className="absolute top-8 right-8 w-12 h-12 border border-fn-green/20 rounded-full pointer-events-none" />

        <div className="relative max-w-4xl">
          <span className="inline-block text-[8px] font-bold tracking-widest uppercase bg-fn-green/20 text-fn-green border border-fn-gborder px-2 py-1 mb-3">
            ● IN PROGRESS
          </span>
          <h1 className="font-display text-4xl sm:text-6xl font-black uppercase text-fn-text tracking-tight leading-none mb-2">
            TOURNAMENTS
          </h1>
          <p className="text-fn-muted text-xs tracking-wider mb-6">
            Compete, watch and claim every claim in the most prestigious Nigerian esports circuits.
          </p>

          {/* Featured tournament */}
          <div className="bg-fn-card border border-fn-gborder rounded-sm p-4 sm:p-6 max-w-2xl">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <div className="fn-label mb-1">FEATURED TOURNAMENT</div>
                <h2 className="font-display text-xl sm:text-3xl font-black uppercase text-fn-text tracking-wide">
                  PUBG MOBILE NATIONAL<br />CHAMPIONSHIP 2026
                </h2>
              </div>
              <div className="text-right">
                <div className="fn-label mb-1">HOSTED BY</div>
                <div className="text-xs font-bold text-fn-green">Group Phase</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { v: "₦20,010,000", l: "Prize Pool" },
                { v: "40 Teams",    l: "Competing"  },
                { v: "Group Phase", l: "Stage"      },
              ].map(({ v, l }) => (
                <div key={l} className="bg-fn-dark border border-fn-gborder rounded-sm p-2.5 text-center">
                  <div className="text-xs sm:text-sm font-bold text-fn-text mb-0.5">{v}</div>
                  <div className="fn-label">{l}</div>
                </div>
              ))}
            </div>
            <button className="fn-btn text-[10px] flex items-center gap-1.5">
              <Trophy size={12} /> REGISTER NOW
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 lg:px-12 py-6">
        {/* Live Feed */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="live-dot" />
            <span className="fn-label text-fn-green">LIVE COMMIT FEED</span>
            <span className="text-[8px] text-fn-muted ml-auto">REAL TIME</span>
          </div>
          <div className="space-y-2">
            {liveFeed.map((m, i) => (
              <div key={i} className="bg-fn-card border border-fn-gborder rounded-sm p-3 flex items-center justify-between gap-3 hover:border-fn-green/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-fn-text truncate">{m.home}</span>
                    <span className="text-fn-green font-mono font-black text-sm">{m.homeScore}</span>
                    <span className="text-fn-muted text-xs">—</span>
                    <span className="text-fn-red font-mono font-black text-sm">{m.awayScore}</span>
                    <span className="text-[10px] font-bold text-fn-muted truncate">{m.away}</span>
                  </div>
                  <div className="fn-label mt-0.5">{m.game}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[8px] font-bold bg-fn-red/20 text-fn-red border border-fn-red/30 px-1.5 py-0.5 animate-pulse-g">{m.status}</span>
                  <ChevronRight size={12} className="text-fn-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 border-b border-fn-gborder">
          {(["standings", "bracket", "upcoming"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-[10px] font-bold tracking-widest uppercase transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-fn-green text-fn-green"
                  : "border-transparent text-fn-muted hover:text-fn-text"
              }`}
            >
              {tab === "standings" ? "GROUP STANDINGS" : tab === "bracket" ? "BRACKET" : "UPCOMING"}
            </button>
          ))}
        </div>

        {/* Group Standings */}
        {activeTab === "standings" && (
          <div className="animate-fade-in">
            <div className="fn-label mb-3">GROUP A STANDINGS</div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <thead>
                  <tr className="border-b border-fn-gborder">
                    {["#", "Team", "GP", "W", "L", "Pts", "Kills"].map((h) => (
                      <th key={h} className="fn-label pb-3 text-left pr-4 last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groupStandings.map((row) => (
                    <tr key={row.pos} className="border-b border-fn-gborder/40 hover:bg-fn-card/50 transition-colors">
                      <td className="py-3 pr-4">
                        <span className="text-[10px] font-bold" style={{ color: row.color }}>#{row.pos}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: row.color }} />
                          <span className="text-[11px] font-bold text-fn-text">{row.team}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-[10px] text-fn-muted">{row.gp}</td>
                      <td className="py-3 pr-4 text-[10px] text-fn-green font-bold">{row.w}</td>
                      <td className="py-3 pr-4 text-[10px] text-fn-red">{row.l}</td>
                      <td className="py-3 pr-4 text-[10px] font-bold text-fn-text">{row.pts}</td>
                      <td className="py-3 text-[10px] text-fn-text text-right">{row.kills}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Form dots */}
            <div className="mt-4 flex flex-wrap gap-2">
              {groupStandings.slice(0, 3).map((row) => (
                <div key={row.team} className="flex items-center gap-2 bg-fn-card border border-fn-gborder rounded-sm px-3 py-2">
                  <span className="text-[9px] font-bold text-fn-text">{row.team}</span>
                  <div className="flex gap-1">
                    {Array.from({ length: row.w }).map((_, i) => (
                      <span key={i} className="w-2 h-2 rounded-full bg-fn-green" />
                    ))}
                    {Array.from({ length: row.l }).map((_, i) => (
                      <span key={i} className="w-2 h-2 rounded-full bg-fn-red" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bracket */}
        {activeTab === "bracket" && (
          <div className="animate-fade-in overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[600px]">
              {bracketRounds.map((round) => (
                <div key={round.round} className="flex-1">
                  <div className="fn-label mb-3 text-center">{round.round}</div>
                  <div className="flex flex-col justify-around h-full gap-3">
                    {round.matches.map((m, i) => (
                      <div key={i} className={`bg-fn-card border rounded-sm p-3 ${m.done ? "border-fn-gborder" : "border-fn-green/30"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-fn-text">{m.home}</span>
                          <span className={`text-sm font-mono font-black ${m.done ? "text-fn-green" : "text-fn-muted"}`}>
                            {m.homeScore ?? "—"}
                          </span>
                        </div>
                        <div className="h-px bg-fn-gborder mb-2" />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-fn-muted">{m.away}</span>
                          <span className={`text-sm font-mono font-black ${m.done && m.awayScore !== null ? "text-fn-red" : "text-fn-muted"}`}>
                            {m.awayScore ?? "—"}
                          </span>
                        </div>
                        {!m.done && (
                          <div className="mt-2 text-[7px] font-bold text-fn-yellow tracking-widest uppercase">UPCOMING</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {activeTab === "upcoming" && (
          <div className="animate-fade-in space-y-3">
            {upcomingMatches.map((m, i) => (
              <div key={i} className="bg-fn-card border border-fn-gborder rounded-sm p-4 flex flex-wrap items-center justify-between gap-3 hover:border-fn-green/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-[8px] font-bold text-fn-muted">{m.date}</div>
                    <div className="text-fn-green font-mono font-bold text-sm">{m.time}</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-fn-text">{m.home} <span className="text-fn-muted font-normal">vs</span> {m.away}</div>
                    <div className="fn-label">{m.game}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={11} className="text-fn-muted" />
                  <span className="text-[9px] text-fn-muted">Group Phase</span>
                  <button className="fn-btn-outline text-[9px] px-2.5 py-1.5">REMIND ME</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
