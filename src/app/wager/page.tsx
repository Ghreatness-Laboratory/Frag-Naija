"use client";
import { useState } from "react";
import { wagerMarkets, elitePredictors, activePredictions } from "@/lib/data";
import type { WagerMarket } from "@/lib/data";
import { Zap, TrendingUp, BarChart2, Bookmark, Clock, ChevronDown, ChevronUp, Trophy } from "lucide-react";

// ─── Probability bar ──────────────────────────────────────────────────────────
function ProbBar({ yes, no }: { yes: number; no: number }) {
  return (
    <div className="flex rounded-sm overflow-hidden h-1.5 mb-1">
      <div className="bg-fn-green/70 transition-all" style={{ width: `${yes}%` }} />
      <div className="bg-fn-red/70 transition-all"   style={{ width: `${no}%`  }} />
    </div>
  );
}

// ─── Tag badge ────────────────────────────────────────────────────────────────
function TagBadge({ tag }: { tag: WagerMarket["tag"] }) {
  const styles: Record<WagerMarket["tag"], string> = {
    "CRITICAL MATCH": "bg-fn-red/20 text-fn-red border-fn-red/30",
    "REGIONAL FINALS": "bg-fn-yellow/20 text-fn-yellow border-fn-yellow/30",
    "STAT WAGER":     "bg-fn-green/20 text-fn-green border-fn-gborder",
    "CLUTCH MOMENT":  "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "MVP PICK":       "bg-fn-amber/20 text-fn-amber border-fn-amber/30",
  };
  return (
    <span className={`text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 border rounded-sm ${styles[tag]}`}>
      {tag}
    </span>
  );
}

// ─── Main wager card (Bayse-style) ────────────────────────────────────────────
function WagerCard({ market }: { market: WagerMarket }) {
  const [picked, setPicked] = useState<Record<string, "yes" | "no" | null>>({});
  const [amount, setAmount] = useState("500");
  const [saved, setSaved] = useState(false);

  const pick = (optIdx: number, side: "yes" | "no") => {
    const key = `${market.id}-${optIdx}`;
    setPicked((p) => ({ ...p, [key]: p[key] === side ? null : side }));
  };

  return (
    <div className="bg-fn-card border border-fn-gborder rounded-sm overflow-hidden hover:border-fn-green/30 transition-all">
      {/* Card header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <TagBadge tag={market.tag} />
          <div className="flex items-center gap-2">
            <span className="fn-label">{market.poolSize} POOL</span>
            <button onClick={() => setSaved(!saved)} className="transition-colors">
              <Bookmark size={13} className={saved ? "text-fn-green fill-fn-green" : "text-fn-muted hover:text-fn-text"} />
            </button>
          </div>
        </div>
        <h3 className="text-sm sm:text-base font-bold text-fn-text leading-snug mb-1">{market.question}</h3>
        <p className="fn-label">{market.subtitle}</p>
      </div>

      {/* Options */}
      <div className="px-4 pb-3 space-y-4">
        {market.options.map((opt, i) => {
          const key = `${market.id}-${i}`;
          const choice = picked[key];
          const showReturn = choice !== null && choice !== undefined;

          return (
            <div key={i}>
              {opt.sublabel && (
                <div className="fn-label mb-2">{opt.sublabel}</div>
              )}
              {/* Probability bar */}
              <ProbBar yes={opt.yesPrice} no={opt.noPrice} />
              <div className="flex justify-between fn-label mb-3">
                <span className="text-fn-green">YES {opt.yesPrice}%</span>
                <span className="text-fn-red">NO {opt.noPrice}%</span>
              </div>

              {/* Buy buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => pick(i, "yes")}
                  className={`pred-yes rounded-sm px-3 py-3 text-center transition-all ${choice === "yes" ? "active" : ""}`}
                >
                  <div className="text-[10px] font-bold mb-0.5">BUY YES</div>
                  <div className="font-display text-xl font-black">₦{opt.yesPrice}</div>
                  {showReturn && choice === "yes" && (
                    <div className="text-[8px] mt-0.5 opacity-80">Returns: {opt.yesReturn}</div>
                  )}
                </button>
                <button
                  onClick={() => pick(i, "no")}
                  className={`pred-no rounded-sm px-3 py-3 text-center transition-all ${choice === "no" ? "active" : ""}`}
                >
                  <div className="text-[10px] font-bold mb-0.5">BUY NO</div>
                  <div className="font-display text-xl font-black">₦{opt.noPrice}</div>
                  {showReturn && choice === "no" && (
                    <div className="text-[8px] mt-0.5 opacity-80">Returns: {opt.noReturn}</div>
                  )}
                </button>
              </div>

              {/* If YES is chosen, show return breakdown */}
              {choice === "yes" && (
                <div className="mt-2 flex justify-between items-center text-[9px] text-fn-muted bg-fn-green/5 border border-fn-gborder/50 rounded-sm px-2 py-1.5">
                  <span>₦{amount} →</span>
                  <span className="text-fn-green font-bold">{opt.yesReturn.split("→")[1]?.trim()}</span>
                </div>
              )}
              {choice === "no" && (
                <div className="mt-2 flex justify-between items-center text-[9px] text-fn-muted bg-fn-red/5 border border-fn-gborder/50 rounded-sm px-2 py-1.5">
                  <span>₦{amount} →</span>
                  <span className="text-fn-red font-bold">{opt.noReturn.split("→")[1]?.trim()}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Amount + place wager */}
      <div className="px-4 pb-4">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-fn-dark border border-fn-gborder rounded-sm px-3">
            <span className="fn-label mr-2">AMOUNT</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-fn-text text-[11px] font-bold outline-none py-2.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              min="100"
            />
          </div>
          <button
            className={`fn-btn text-[10px] px-4 whitespace-nowrap ${Object.values(picked).every((v) => !v) ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={Object.values(picked).every((v) => !v)}
          >
            PLACE WAGER
          </button>
        </div>
        {/* Quick amounts */}
        <div className="flex gap-1.5 mt-2">
          {["250", "500", "1000", "2500"].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className={`px-2 py-1 text-[8px] font-bold tracking-wide border rounded-sm transition-all ${
                amount === v ? "border-fn-green text-fn-green bg-fn-green/10" : "border-fn-gborder text-fn-muted hover:border-fn-green/40 hover:text-fn-text"
              }`}
            >
              ₦{parseInt(v).toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Footer stats */}
      <div className="px-4 py-2.5 border-t border-fn-gborder flex items-center justify-between bg-fn-dark/50">
        <div className="flex items-center gap-1 text-[9px] text-fn-muted">
          <BarChart2 size={10} /> {market.trades.toLocaleString()} trades
        </div>
        <div className="flex items-center gap-1 text-[9px] text-fn-muted">
          <Clock size={10} /> {market.endsIn}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WagerPage() {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? wagerMarkets : wagerMarkets.slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-4 sm:px-8 lg:px-12 py-6 border-b border-fn-gborder bg-fn-card/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-fn bg-grid opacity-20 pointer-events-none" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="fn-label mb-1 flex items-center gap-1.5">
              <Zap size={9} className="text-fn-green" /> TACTICAL HUB 06
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-black uppercase text-fn-text tracking-tight">
              WAGER ZONE
            </h1>
          </div>
          {/* Balance */}
          <div className="flex items-center gap-3 bg-fn-card border border-fn-yellow/30 rounded-sm px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-fn-yellow/20 border border-fn-yellow/40 flex items-center justify-center text-sm">🪙</div>
            <div>
              <div className="fn-label">CURRENT BALANCE</div>
              <div className="font-display text-xl font-black text-fn-yellow">5,000 <span className="text-sm font-mono text-fn-amber">FRG COINS</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 lg:px-12 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Markets feed */}
          <div className="xl:col-span-2 space-y-4">
            <div className="fn-label flex items-center gap-2">
              <span className="live-dot" /> LIVE MARKETS — {wagerMarkets.length} OPEN
            </div>

            {displayed.map((m) => <WagerCard key={m.id} market={m} />)}

            {wagerMarkets.length > 4 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full fn-btn-outline text-[10px] flex items-center justify-center gap-2 py-3"
              >
                {showAll ? (
                  <><ChevronUp size={12} /> SHOW LESS</>
                ) : (
                  <><ChevronDown size={12} /> LOAD {wagerMarkets.length - 4} MORE MARKETS</>
                )}
              </button>
            )}
          </div>

          {/* Right sidebar */}
          <div className="xl:col-span-1 space-y-4">
            {/* Elite Predictors */}
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={12} className="text-fn-yellow" />
                <span className="fn-label text-fn-text">ELITE PREDICTORS</span>
              </div>
              <div className="space-y-2">
                {elitePredictors.map((p, i) => (
                  <div key={p.tag} className="flex items-center gap-3 p-2 bg-fn-dark border border-fn-gborder rounded-sm hover:border-fn-green/30 transition-colors">
                    <span className={`text-[9px] font-bold w-5 text-center ${i === 0 ? "text-fn-yellow" : i === 1 ? "text-fn-text" : "text-fn-muted"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="w-7 h-7 bg-fn-green/10 border border-fn-gborder rounded-sm flex items-center justify-center text-[9px] font-bold text-fn-green flex-shrink-0">
                      {p.tag[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-fn-text truncate">{p.tag}</div>
                      <div className="fn-label">{p.accuracy} accuracy</div>
                    </div>
                    <span className="text-[9px] font-bold text-fn-green flex-shrink-0">{p.weekly}</span>
                  </div>
                ))}
              </div>
              <button className="mt-3 fn-btn-outline w-full text-[9px] py-2">VIEW ALL RANKINGS</button>
            </div>

            {/* Summary stats */}
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: "1,248",  l: "Wagers Placed", icon: BarChart2 },
                  { v: "₦2.8M",  l: "Total Won",     icon: TrendingUp },
                ].map(({ v, l, icon: Icon }) => (
                  <div key={l} className="bg-fn-dark border border-fn-gborder rounded-sm p-3 text-center">
                    <Icon size={12} className="text-fn-green mx-auto mb-1" />
                    <div className="font-display text-xl font-black text-fn-text">{v}</div>
                    <div className="fn-label">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Predictions */}
            <div className="bg-fn-card border border-fn-gborder rounded-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="fn-label">MY ACTIVE PREDICTIONS</span>
                <span className="text-[9px] font-bold text-fn-green">{activePredictions.length} ACTIVE</span>
              </div>
              <div className="space-y-2">
                {activePredictions.map((pred, i) => (
                  <div key={i} className="p-3 bg-fn-dark border border-fn-gborder rounded-sm">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold text-fn-text leading-tight">{pred.event}</div>
                        <div className="fn-label">{pred.subtitle}</div>
                      </div>
                      <span className="text-[7px] font-bold tracking-widest px-1.5 py-0.5 flex-shrink-0"
                        style={{ background: `${pred.statusColor}20`, color: pred.statusColor, border: `1px solid ${pred.statusColor}40` }}>
                        {pred.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 mt-2">
                      {[
                        { v: pred.type,      l: "TYPE"   },
                        { v: pred.odds,      l: "ODDS"   },
                        { v: pred.stake,     l: "STAKE"  },
                      ].map(({ v, l }) => (
                        <div key={l} className="text-center">
                          <div className="text-[9px] font-bold text-fn-green truncate">{v}</div>
                          <div className="fn-label text-[7px]">{l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-fn-gborder/50 flex justify-between">
                      <span className="fn-label">EST. RETURN</span>
                      <span className="text-[10px] font-bold text-fn-green">{pred.estReturn}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
