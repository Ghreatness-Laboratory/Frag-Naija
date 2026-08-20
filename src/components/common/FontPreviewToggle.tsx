'use client';
import { useState, useEffect, useCallback } from "react";
import { Type, X, Check } from "lucide-react";
import { useFloatingIconDismiss } from '@/hooks/useFloatingIconDismiss';
import { useDraggablePosition } from '@/hooks/useDraggablePosition';

type FontOption = {
  id: string;
  name: string;
  description: string;
  weights: string;
};

function fontPreviewFamily(fontId: string) {
  if (fontId === "default") return undefined;
  if (fontId === "legacy") return "var(--font-space-mono-family)";
  return `var(--font-${fontId})`;
}

const FONT_OPTIONS: FontOption[] = [
  {
    id: "default",
    name: "Chakra Petch (Default)",
    description: "Site-wide default for body, UI labels, headings, and display text",
    weights: "400/500/600/700",
  },
  {
    id: "legacy",
    name: "Legacy Mono",
    description: "Previous mono-style baseline retained for comparison",
    weights: "400/700",
  },
  {
    id: "rajdhani",
    name: "Rajdhani",
    description: "Angular, esports-standard, excellent legibility at small sizes",
    weights: "400/500/600/700",
  },
  {
    id: "chakra",
    name: "Chakra Petch",
    description: "Technical/HUD feel, slightly wider than Rajdhani",
    weights: "400/500/600/700",
  },
  {
    id: "exo2",
    name: "Exo 2",
    description: "Geometric with technical edge, versatile for display and body",
    weights: "400/500/600/700/800",
  },
  {
    id: "orbitron",
    name: "Orbitron",
    description: "Futuristic scoreboard style for high-impact esports screens",
    weights: "400/500/600/700/800/900",
  },
  {
    id: "oxanium",
    name: "Oxanium",
    description: "Squared sci-fi shapes with strong readability for dense UI",
    weights: "400/500/600/700/800",
  },
  {
    id: "saira-condensed",
    name: "Saira Condensed",
    description: "Condensed competitive look that preserves space in admin tables",
    weights: "400/500/600/700/800",
  },
];

const FONT_TOGGLE_SIZE = 48; // Approximate size of the toggle button

export default function FontPreviewToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentFont, setCurrentFont] = useState<string>("default");
  const [selectedFont, setSelectedFont] = useState<string | null>(null);
  const { dismissed, handleDismiss, handleReenable, mounted } = useFloatingIconDismiss('font-toggle');
  
  // Draggable position hook
  const { 
    position, 
    isDragging, 
    handlers: dragHandlers, 
    wasDragged, 
    resetDraggedState,
    style 
  } = useDraggablePosition('fn-font-toggle-position', {
    iconSize: FONT_TOGGLE_SIZE,
  });

  useEffect(() => {
    const saved = localStorage.getItem("fn-font-preview");
    if (saved) {
      setCurrentFont(saved);
      setSelectedFont(saved);
    }
  }, []);

  const setFont = (fontId: string) => {
    setCurrentFont(fontId);
    setSelectedFont(fontId);
    if (fontId === "default") {
      localStorage.removeItem("fn-font-preview");
      document.documentElement.classList.remove(
        "font-preview-legacy",
        "font-preview-rajdhani",
        "font-preview-chakra",
        "font-preview-exo2",
        "font-preview-orbitron",
        "font-preview-oxanium",
        "font-preview-saira-condensed"
      );
    } else {
      localStorage.setItem("fn-font-preview", fontId);
      document.documentElement.classList.remove(
        "font-preview-legacy",
        "font-preview-rajdhani",
        "font-preview-chakra",
        "font-preview-exo2",
        "font-preview-orbitron",
        "font-preview-oxanium",
        "font-preview-saira-condensed"
      );
      document.documentElement.classList.add(`font-preview-${fontId}`);
    }
  };

  const handleDone = () => {
    // Font is already applied via setFont, just close the panel
    setIsOpen(false);
  };

  // Handle click - distinguish tap from drag
  const handleClick = () => {
    if (wasDragged()) {
      resetDraggedState();
      return;
    }
    setIsOpen(true);
  };

  const hasSelectedCandidate = selectedFont !== null && selectedFont !== "default";

  // If dismissed and not open, show small re-open tab
  if (dismissed && !isOpen) {
    return (
      <button
        type="button"
        onClick={handleReenable}
        className="fixed bottom-[calc(18rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-8 w-8 items-center justify-center rounded-sm border border-fn-green/40 bg-fn-black/90 text-fn-green opacity-70 transition-opacity hover:opacity-100"
        aria-label="Re-enable font preview"
        title="Re-enable font preview"
      >
        <Type size={14} />
      </button>
    );
  }

  return (
    <>
      {/* Floating toggle button - draggable */}
      <button
        type="button"
        onClick={handleClick}
        onContextMenu={(e) => { e.preventDefault(); handleDismiss(); }}
        onPointerDown={dragHandlers.onPointerDown}
        onPointerMove={dragHandlers.onPointerMove}
        onPointerUp={dragHandlers.onPointerUp}
        onPointerLeave={dragHandlers.onPointerLeave}
        onPointerCancel={dragHandlers.onPointerCancel}
        style={style}
        className={`fixed z-50 flex items-center gap-2 rounded-sm border border-fn-green/40 bg-fn-black/90 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-fn-green transition-all hover:bg-fn-green/20 touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        aria-label="Toggle font preview"
        title="Drag to move, right-click to dismiss"
      >
        <Type size={14} />
        <span className="hidden sm:inline">Preview Fonts</span>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-fn-black/80 px-4 py-6 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="font-preview-title"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative my-auto max-h-[calc(100dvh-3rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-sm border border-fn-gborder bg-fn-card p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent line */}
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgb(var(--fn-green)), transparent)" }} />

            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-3 top-3 rounded-sm border border-fn-gborder p-1 text-fn-muted transition-colors hover:text-fn-text"
              aria-label="Close font preview panel"
            >
              <X size={14} />
            </button>

            {/* Header */}
            <div className="mb-4">
              <p className="fn-label mb-1.5 flex items-center gap-1.5">
                <Type size={10} className="text-fn-green" /> TYPOGRAPHY PREVIEW
              </p>
              <h2 id="font-preview-title" className="font-display text-xl font-black uppercase text-fn-text">
                Select Esports Font
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-fn-muted">
                Test different typefaces across the entire site. Pick the one that best matches competitive gaming/esports branding — sharp, modern, and legible.
              </p>
            </div>

            {/* Font options */}
            <div className="grid gap-2.5">
              {FONT_OPTIONS.map((font) => {
                const isActive = currentFont === font.id;
                const isSelected = selectedFont === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => setFont(font.id)}
                    className={`group rounded-sm border p-3.5 text-left transition-all ${
                      isActive
                        ? "border-fn-green bg-fn-green/10"
                        : "border-fn-gborder bg-fn-black/50 hover:bg-fn-card2"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-black uppercase tracking-widest ${
                              isActive ? "text-fn-green" : "text-fn-text"
                            }`}
                            style={fontPreviewFamily(font.id) ? { fontFamily: fontPreviewFamily(font.id) } : {}}
                          >
                            {font.name}
                          </span>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-fn-green">
                              <Check size={8} strokeWidth={3} /> Selected
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-[10px] leading-relaxed text-fn-muted">
                          {font.description}
                        </p>
                        <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-fn-muted/70">
                          Weights: {font.weights}
                        </p>
                      </div>
                      {/* Preview sample */}
                      <div
                        className="hidden sm:block text-right"
                        style={fontPreviewFamily(font.id) ? { fontFamily: fontPreviewFamily(font.id) } : {}}
                      >
                        <span className="text-[10px] font-bold uppercase text-fn-muted">ESPORTS</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Usage instructions */}
            <div className="mt-4 rounded-sm border border-fn-gborder bg-fn-black/50 p-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-fn-muted mb-1">
                HOW TO TEST
              </p>
              <ol className="list-decimal list-inside text-[10px] leading-relaxed text-fn-muted space-y-0.5">
                <li>Select a font candidate above (not Default)</li>
                <li>Navigate to Home, Athletes, or Teams pages</li>
                <li>Compare how each reads in hero, cards, and stats</li>
                <li>Click DONE to lock in your choice site-wide</li>
              </ol>
            </div>

            {/* Done button */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleDone}
                disabled={!hasSelectedCandidate}
                className={`w-full rounded-sm px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                  hasSelectedCandidate
                    ? "bg-fn-green text-fn-black hover:bg-fn-gdim active:scale-[0.98]"
                    : "bg-fn-gborder text-fn-muted cursor-not-allowed opacity-50"
                }`}
              >
                {hasSelectedCandidate ? "✓ Done — Apply Site-Wide" : "Select a Font Candidate First"}
              </button>
            </div>

            {/* Reset hint */}
            {currentFont !== "default" && (
              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => setFont("default")}
                  className="text-[9px] font-bold uppercase tracking-widest text-fn-muted hover:text-fn-red transition-colors"
                >
                  ← Reset to Chakra Petch default
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
