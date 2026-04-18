"use client";
import { useState } from "react";
import { Play, Clock, Eye, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useGame } from "@/context/GameContext";
import { getGameContent, type DummyHighlight } from "@/lib/game-content";
import { archiveVideos, commanderCams } from "@/lib/data";

type FilterTab = "all-coverage" | "match-replays" | "clutch-moments" | "montages" | "tactical-logs";

const tabConfig: { id: FilterTab; label: string }[] = [
  { id: "all-coverage",   label: "ALL COVERAGE"   },
  { id: "match-replays",  label: "MATCH REPLAYS"  },
  { id: "clutch-moments", label: "CLUTCH MOMENTS" },
  { id: "montages",       label: "MONTAGES"       },
  { id: "tactical-logs",  label: "TACTICAL LOGS"  },
];

function toHighlight(h: DummyHighlight) {
  return {
    id: h.id,
    category: h.category.replace(/-/g, ' ').toUpperCase(),
    duration: h.duration,
    title: h.title,
    creator: h.id.split('-')[1]?.toUpperCase() ?? 'FF',
    views: h.views,
    tags: h.tags,
    featured: h.featured ?? false,
  };
}

export default function HighlightsPage() {
  const { selectedGame, isHydrated } = useGame();
  const [activeTab, setActiveTab]   = useState<FilterTab>("all-coverage");
  const [playing, setPlaying]       = useState(false);
  const [archiveOffset, setArchiveOffset] = useState(0);

  const primary   = selectedGame.colors.primary;
  const secondary = selectedGame.colors.secondary;
  const isFF      = selectedGame.slug === 'free-fire';

  const gameContent  = isHydrated ? getGameContent(selectedGame.slug) : null;
  const dummyVideos  = gameContent?.highlights.map(toHighlight) ?? [];
  const videos       = dummyVideos.length > 0 ? dummyVideos : archiveVideos.map(v => ({ ...v, featured: false }));

  const filteredVideos = activeTab === "all-coverage"
    ? videos
    : videos.filter((v) => v.tags.includes(activeTab));

  const featured = videos.find(v => v.featured) ?? videos[0];

  const ARCHIVE_PAGE_SIZE = 6;
  const totalPages = Math.ceil(filteredVideos.length / ARCHIVE_PAGE_SIZE);

  // FF-themed fire gradient for featured thumbnail
  const featuredGradient = isFF
    ? `linear-gradient(135deg, #1a0800 0%, #4a1200 40%, #2d0a00 100%)`
    : `linear-gradient(135deg, #001a00 0%, #003300 40%, #001a00 100%)`;

  const thumbColors = isFF
    ? ['#3d0d00', '#4a1500', '#2a0800', '#5a1a00', '#3a1000', '#2d0c00']
    : ['#001a20', '#001a10', '#001520', '#001810', '#001220', '#001a18'];

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div
        className="px-4 sm:px-8 lg:px-12 pt-8 pb-4 border-b border-fn-gborder"
        style={{ background: `linear-gradient(135deg, ${primary}06 0%, #000 60%)` }}
      >
        <div className="flex items-center gap-2 mb-1">
          {isFF && <Flame size={10} style={{ color: primary }} />}
          <div className="fn-label">TACTICAL VISUAL INTERFACE // {selectedGame.shortName.toUpperCase()} HIGHLIGHTS</div>
        </div>
        <h1 className="font-display font-black uppercase leading-none">
          <span className="block text-5xl sm:text-7xl text-fn-text">THE THEATRE</span>
          <span className="block text-5xl sm:text-7xl" style={{ color: primary }}>{isFF ? "OF FIRE" : "OF WAR"}</span>
        </h1>
      </div>

      {/* Filter tabs */}
      <div className="px-4 sm:px-8 lg:px-12 pt-4 pb-0 border-b border-fn-gborder overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabConfig.map((t) => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setArchiveOffset(0); }}
              className="px-3 sm:px-4 py-2.5 text-[9px] font-bold tracking-widest uppercase transition-all rounded-t-sm border-b-2 -mb-px"
              style={activeTab === t.id
                ? { color: primary, borderColor: primary, background: `${primary}08` }
                : { color: '#555', borderColor: 'transparent' }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-8 lg:px-12 py-6">
        {/* Featured + Up Next */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
          {/* Featured video */}
          <div className="lg:col-span-2">
            <div
              className="relative rounded-sm overflow-hidden border cursor-pointer group"
              style={{ paddingBottom: "56.25%", borderColor: `${primary}30` }}
              onClick={() => setPlaying(!playing)}
            >
              <div className="absolute inset-0" style={{ background: featuredGradient }}>
                <div className="absolute inset-0 bg-grid-fn bg-grid opacity-20" />
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 4px)" }} />
              </div>

              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center transition-all ${playing ? "scale-90 opacity-50" : "group-hover:scale-110"}`}
                  style={{ borderColor: primary, background: `${primary}25` }}
                >
                  <Play size={20} style={{ color: primary }} fill={primary} className="ml-1" />
                </div>
              </div>

              {/* Labels */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-fn-black/90 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-[8px] font-bold px-2 py-0.5 text-black tracking-widest uppercase"
                    style={{ background: primary }}
                  >
                    ● {isFF ? 'PREMIERE' : 'FEATURED'}
                  </span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-black uppercase text-fn-text">
                  {featured?.title ?? (isFF ? "FREE FIRE NIGERIA OPEN — BOOYAH MOMENTS" : "GRAND FINALS: NAIJA CUP SEASON 4")}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-[9px] text-fn-muted">
                  <span className="flex items-center gap-1"><Eye size={10} /> {featured?.views ?? "24K"} VIEWS</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {featured?.duration ?? "14:32"} DUR</span>
                  <span className="font-bold" style={{ color: primary }}>● HD FOOTAGE</span>
                </div>
              </div>

              <div
                className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 border"
                style={{ background: '#000000cc', color: primary, borderColor: `${primary}40` }}
              >
                {featured?.duration ?? "14:32"}
              </div>
            </div>
          </div>

          {/* Up Next */}
          <div className="lg:col-span-1">
            <div className="fn-label mb-3 flex items-center gap-2">
              <span className="w-4 h-px inline-block" style={{ background: primary }} /> UP NEXT
            </div>
            <div className="space-y-3">
              {videos.slice(1, 4).map((v, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-2 bg-fn-card border border-fn-gborder rounded-sm transition-all cursor-pointer group"
                  onMouseEnter={e => (e.currentTarget.style.borderColor = `${primary}40`)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
                >
                  <div
                    className="relative w-20 h-14 border flex-shrink-0 overflow-hidden rounded-sm flex items-center justify-center"
                    style={{ background: thumbColors[i % thumbColors.length], borderColor: '#222' }}
                  >
                    <Play size={14} style={{ color: primary }} fill={primary} className="group-hover:scale-110 transition-transform" />
                    <span className="absolute bottom-1 right-1 text-[7px] font-bold text-fn-text bg-black/70 px-1">{v.duration}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="fn-label text-[7px] mb-0.5">{v.category}</div>
                    <p className="text-[10px] font-bold text-fn-text leading-snug line-clamp-2">{v.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[8px] text-fn-muted">
                      <Eye size={8} /> {v.views}
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
              <div
                className="w-3 h-3 border grid grid-cols-2 gap-px p-0.5"
                style={{ borderColor: primary }}
              >
                {[...Array(4)].map((_, i) => <div key={i} style={{ background: primary }} />)}
              </div>
              <span className="fn-label text-fn-text">TACTICAL ARCHIVE — {selectedGame.shortName.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setArchiveOffset(Math.max(0, archiveOffset - 1))}
                disabled={archiveOffset === 0}
                className="w-7 h-7 border flex items-center justify-center text-fn-muted transition-all disabled:opacity-30"
                style={{ borderColor: '#333' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = primary; (e.currentTarget as HTMLElement).style.color = primary; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#333'; (e.currentTarget as HTMLElement).style.color = ''; }}
              >
                <ChevronLeft size={13} />
              </button>
              <button
                onClick={() => setArchiveOffset(Math.min(totalPages - 1, archiveOffset + 1))}
                disabled={archiveOffset >= totalPages - 1}
                className="w-7 h-7 border flex items-center justify-center text-fn-muted transition-all disabled:opacity-30"
                style={{ borderColor: '#333' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = primary; (e.currentTarget as HTMLElement).style.color = primary; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#333'; (e.currentTarget as HTMLElement).style.color = ''; }}
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
                    <div
                      className="relative rounded-sm overflow-hidden border border-fn-gborder transition-all"
                      style={{ paddingBottom: "56.25%", background: thumbColors[idx % thumbColors.length] }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = `${primary}50`)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
                    >
                      <div className="absolute inset-0 bg-grid-fn bg-grid opacity-10" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="w-10 h-10 rounded-full border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ borderColor: `${primary}60`, background: `${primary}15` }}
                        >
                          <Play size={14} style={{ color: primary }} fill={primary} className="ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute top-2 left-2">
                        <span
                          className="text-[7px] font-bold tracking-widest uppercase px-1.5 py-0.5 border"
                          style={{ background: `${primary}20`, color: primary, borderColor: `${primary}40` }}
                        >
                          {v.category}
                        </span>
                      </div>
                      <div
                        className="absolute top-2 right-2 text-[8px] font-bold px-1.5 py-0.5 border"
                        style={{ background: '#000000cc', color: primary, borderColor: `${primary}30` }}
                      >
                        {v.duration}
                      </div>
                    </div>
                    <div className="mt-2 px-1">
                      <h3 className="text-[11px] font-bold text-fn-text leading-snug mb-1 line-clamp-2 group-hover:transition-colors"
                        style={{ ['--hover-color' as string]: primary }}
                        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = primary)}
                        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '')}
                      >
                        {v.title}
                      </h3>
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
              <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-fn-text">
                {isFF ? "PLAYER FEEDS" : "COMMANDER CAMS"}
              </h2>
              <p className="text-[9px] text-fn-muted max-w-xs text-right leading-relaxed">
                Direct vertical feed from player headquarters. Tactical facial feeds and live comms
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {commanderCams.map((cam) => (
              <div key={cam.tag} className="group cursor-pointer">
                <div
                  className="relative rounded-sm overflow-hidden border transition-all"
                  style={{
                    paddingBottom: "133%",
                    borderColor: cam.live ? `${primary}40` : '#222',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = cam.live ? primary : `${primary}30`)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = cam.live ? `${primary}40` : '#222')}
                >
                  <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${thumbColors[0]} 0%, #000 100%)` }}>
                    <div className="absolute inset-0 bg-grid-fn bg-grid opacity-10" />
                    <div className="absolute inset-0 flex items-center justify-center pt-4">
                      <div
                        className="w-12 h-12 rounded-full border flex items-center justify-center"
                        style={{ background: `${primary}10`, borderColor: '#333' }}
                      >
                        <span className="font-display text-xl font-black" style={{ color: primary }}>{cam.tag[0]}</span>
                      </div>
                    </div>
                  </div>

                  {cam.live && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-fn-black/80 px-1.5 py-0.5 rounded-sm border border-fn-gborder">
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: primary }} />
                      <span className="text-[7px] font-bold tracking-widest" style={{ color: primary }}>LIVE</span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-fn-black/90 to-transparent">
                    <div className="text-[9px] font-bold text-fn-text">{cam.tag}</div>
                    <div className="text-[7px] text-fn-muted italic">{cam.quote}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
