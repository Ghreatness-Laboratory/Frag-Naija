"use client";
import { useState } from "react";
import { archiveVideos, commanderCams } from "@/lib/data";
import { Play, Clock, Eye, ChevronLeft, ChevronRight, Plus } from "lucide-react";

type FilterTab = "all-coverage" | "match-replays" | "clutch-moments" | "montages" | "tactical-logs";

const tabConfig: { id: FilterTab; label: string }[] = [
  { id: "all-coverage",   label: "ALL COVERAGE"   },
  { id: "match-replays",  label: "MATCH REPLAYS"  },
  { id: "clutch-moments", label: "CLUTCH MOMENTS" },
  { id: "montages",       label: "MONTAGES"       },
  { id: "tactical-logs",  label: "TACTICAL LOGS"  },
];

const upNext = [
  { category: "CLUTCH MOMENTS", duration: "02:45", title: "BlazeKing 1v4 Defense at Sector B", views: "18K", ago: "5hr ago" },
  { category: "MONTAGE",        duration: "03:12", title: "ViperShot: Ultimate Sniper Montage",  views: "49K", ago: "5hr ago" },
  { category: "REPLAYS",        duration: "22:55", title: "Lagos Siege: Full Tactical Replay",   views: "8K",  ago: "10hr ago" },
];

// Fake gradient thumbnails per video
const thumbGradients = [
  "from-teal-900 to-fn-black",
  "from-emerald-900 to-fn-dark",
  "from-cyan-900 to-fn-black",
  "from-green-900 to-fn-dark",
  "from-teal-800 to-fn-black",
  "from-emerald-800 to-fn-dark",
];

export default function HighlightsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all-coverage");
  const [playing, setPlaying] = useState(false);
  const [archiveOffset, setArchiveOffset] = useState(0);

  const filteredVideos =
    activeTab === "all-coverage"
      ? archiveVideos
      : archiveVideos.filter((v) => v.tags.includes(activeTab));

  const ARCHIVE_PAGE_SIZE = 6;
  const totalPages = Math.ceil(filteredVideos.length / ARCHIVE_PAGE_SIZE);

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="px-4 sm:px-8 lg:px-12 pt-8 pb-4 border-b border-fn-gborder">
        <div className="fn-label mb-1">TACTICAL VISUAL INTERFACE // HIGHLIGHTS ARCHIVE</div>
        <h1 className="font-display font-black uppercase leading-none">
          <span className="block text-5xl sm:text-7xl text-white">THE THEATRE</span>
          <span className="block text-5xl sm:text-7xl text-fn-green glow-text">OF WAR</span>
        </h1>
      </div>

      {/* Filter tabs */}
      <div className="px-4 sm:px-8 lg:px-12 pt-4 pb-0 border-b border-fn-gborder overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabConfig.map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setArchiveOffset(0); }}
              className={`px-3 sm:px-4 py-2.5 text-[9px] font-bold tracking-widest uppercase transition-all rounded-t-sm border-b-2 -mb-px ${
                activeTab === t.id
                  ? "text-fn-green border-fn-green bg-fn-green/5"
                  : "text-fn-muted border-transparent hover:text-fn-text hover:border-fn-muted/30"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-8 lg:px-12 py-6">
        {/* Featured player + Up Next */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
          {/* Featured video */}
          <div className="lg:col-span-2">
            <div
              className="relative rounded-sm overflow-hidden bg-fn-card border border-fn-gborder cursor-pointer group"
              style={{ paddingBottom: "56.25%" }}
              onClick={() => setPlaying(!playing)}
            >
              {/* Thumbnail placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-fn-dark to-fn-black">
                <div className="absolute inset-0 bg-grid-fn bg-grid opacity-20" />
                {/* Scanlines */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 4px)" }} />
              </div>

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-fn-green bg-fn-green/20 flex items-center justify-center transition-all ${playing ? "scale-90 opacity-50" : "group-hover:scale-110 group-hover:bg-fn-green/30"}`}>
                  <Play size={20} className="text-fn-green ml-1" fill="#00ff41" />
                </div>
              </div>

              {/* Labels */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-fn-black/90 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[8px] font-bold bg-fn-red px-2 py-0.5 text-white tracking-widest uppercase">● PREMIERE</span>
                  <span className="text-[8px] text-fn-muted">Athlegame vs OP Squad</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-black uppercase text-white">
                  GRAND FINALS: NAIJA CUP SEASON 4
                </h2>
                <div className="flex items-center gap-4 mt-2 text-[9px] text-fn-muted">
                  <span className="flex items-center gap-1"><Eye size={10} /> 24,000 VIEWS</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> 14:32 DUR</span>
                  <span className="text-fn-green font-bold">● HIGH DEFINITION 4K</span>
                </div>
              </div>

              {/* Duration badge top-right */}
              <div className="absolute top-3 right-3 bg-fn-black/80 text-fn-green text-[9px] font-bold px-2 py-0.5 border border-fn-gborder">
                14:32
              </div>
            </div>
          </div>

          {/* Up Next */}
          <div className="lg:col-span-1">
            <div className="fn-label mb-3 flex items-center gap-2">
              <span className="w-4 h-px bg-fn-green inline-block" /> UP NEXT
            </div>
            <div className="space-y-3">
              {upNext.map((v, i) => (
                <div key={i} className="flex gap-3 p-2 bg-fn-card border border-fn-gborder rounded-sm hover:border-fn-green/30 transition-all cursor-pointer group">
                  {/* Thumb */}
                  <div className="relative w-20 h-14 bg-fn-dark border border-fn-gborder flex-shrink-0 overflow-hidden rounded-sm flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-900 to-fn-black opacity-70" />
                    <Play size={14} className="relative text-fn-green group-hover:scale-110 transition-transform" fill="#00ff41" />
                    <span className="absolute bottom-1 right-1 text-[7px] font-bold text-white bg-black/70 px-1">{v.duration}</span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="fn-label text-[7px] mb-0.5">{v.category}</div>
                    <p className="text-[10px] font-bold text-white leading-snug line-clamp-2">{v.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[8px] text-fn-muted">
                      <Eye size={8} /> {v.views}
                      <span>·</span>
                      {v.ago}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tactical Archive */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-fn-green grid grid-cols-2 gap-px p-0.5">
                {[...Array(4)].map((_, i) => <div key={i} className="bg-fn-green" />)}
              </div>
              <span className="fn-label text-fn-text">TACTICAL ARCHIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setArchiveOffset(Math.max(0, archiveOffset - 1))}
                disabled={archiveOffset === 0}
                className="w-7 h-7 border border-fn-gborder flex items-center justify-center text-fn-muted hover:text-fn-green hover:border-fn-green/40 disabled:opacity-30 transition-all"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                onClick={() => setArchiveOffset(Math.min(totalPages - 1, archiveOffset + 1))}
                disabled={archiveOffset >= totalPages - 1}
                className="w-7 h-7 border border-fn-gborder flex items-center justify-center text-fn-muted hover:text-fn-green hover:border-fn-green/40 disabled:opacity-30 transition-all"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {filteredVideos.length === 0 ? (
            <div className="text-center py-16 text-fn-muted text-[11px] border border-fn-gborder rounded-sm bg-fn-card">
              No videos in this category yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos
                .slice(archiveOffset * ARCHIVE_PAGE_SIZE, (archiveOffset + 1) * ARCHIVE_PAGE_SIZE)
                .map((v, idx) => (
                  <div key={v.id} className="group cursor-pointer">
                    {/* Thumbnail */}
                    <div className={`relative rounded-sm overflow-hidden bg-gradient-to-br ${thumbGradients[idx % thumbGradients.length]} border border-fn-gborder group-hover:border-fn-green/40 transition-all`}
                      style={{ paddingBottom: "56.25%" }}>
                      <div className="absolute inset-0 bg-grid-fn bg-grid opacity-10" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full border border-fn-green/50 bg-fn-green/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play size={14} className="text-fn-green ml-0.5" fill="#00ff41" />
                        </div>
                      </div>
                      {/* Category badge */}
                      <div className="absolute top-2 left-2">
                        <span className={`text-[7px] font-bold tracking-widest uppercase px-1.5 py-0.5 border ${
                          v.category === "MATCH HIGHLIGHTS" ? "bg-fn-green/20 text-fn-green border-fn-gborder" :
                          v.category === "SKILL SHOT"       ? "bg-fn-yellow/20 text-fn-yellow border-fn-yellow/30" :
                          v.category === "TACTICAL LOG"     ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                          v.category === "MONTAGE"          ? "bg-fn-amber/20 text-fn-amber border-fn-amber/30" :
                          v.category === "INTERVIEW"        ? "bg-fn-pink/20 text-fn-pink border-fn-pink/30" :
                          "bg-fn-muted/20 text-fn-muted border-fn-muted/30"
                        }`}>{v.category}</span>
                      </div>
                      {/* Duration */}
                      <div className="absolute top-2 right-2 bg-fn-black/80 text-fn-green text-[8px] font-bold px-1.5 py-0.5 border border-fn-gborder">
                        {v.duration}
                      </div>
                    </div>
                    {/* Info */}
                    <div className="mt-2 px-1">
                      <h3 className="text-[11px] font-bold text-white leading-snug mb-1 line-clamp-2 group-hover:text-fn-green transition-colors">{v.title}</h3>
                      <div className="flex items-center gap-3 text-[9px] text-fn-muted">
                        <span className="flex items-center gap-1"><Eye size={9} /> {v.views}</span>
                        <span>· by {v.creator}</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Commander Cams */}
        <div>
          <div className="mb-5">
            <div className="fn-label text-fn-muted mb-0.5">LIVE TRANSMISSIONS</div>
            <div className="flex items-end justify-between flex-wrap gap-2">
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">COMMANDER CAMS</h2>
              <p className="text-[9px] text-fn-muted max-w-xs text-right leading-relaxed">
                Direct vertical feed from player headquarters. Tactical facial feeds and live comms
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {commanderCams.map((cam) => (
              <div key={cam.tag} className="group cursor-pointer">
                <div className={`relative rounded-sm overflow-hidden border transition-all ${cam.live ? "border-fn-green/40 hover:border-fn-green" : "border-fn-gborder hover:border-fn-gborder/80"}`}
                  style={{ paddingBottom: "133%" }}>
                  {/* Fake portrait feed */}
                  <div className="absolute inset-0 bg-gradient-to-b from-fn-card2 via-teal-950/50 to-fn-black">
                    <div className="absolute inset-0 bg-grid-fn bg-grid opacity-10" />
                    {/* Face silhouette */}
                    <div className="absolute inset-0 flex items-center justify-center pt-4">
                      <div className="w-12 h-12 rounded-full bg-fn-green/10 border border-fn-gborder flex items-center justify-center">
                        <span className="font-display text-xl font-black text-fn-green">{cam.tag[0]}</span>
                      </div>
                    </div>
                  </div>

                  {/* Live badge */}
                  {cam.live && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-fn-black/80 px-1.5 py-0.5 rounded-sm border border-fn-gborder">
                      <span className="live-dot w-1.5 h-1.5" />
                      <span className="text-[7px] font-bold text-fn-green tracking-widest">LIVE FEED</span>
                    </div>
                  )}

                  {/* Info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-fn-black/90 to-transparent">
                    <div className="text-[9px] font-bold text-white">{cam.tag}</div>
                    <div className="text-[7px] text-fn-muted italic">{cam.quote}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating action button */}
      <div className="fixed bottom-6 right-6 lg:right-8 z-20">
        <button className="w-12 h-12 bg-fn-green rounded-sm flex items-center justify-center glow-green hover:bg-fn-gdim transition-all active:scale-95 shadow-lg">
          <Plus size={20} className="text-fn-black" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
