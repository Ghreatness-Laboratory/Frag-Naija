'use client';
import { useEffect, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const OPTIONS = [
  ['default', 'Chakra Petch (Default)'], ['legacy', 'Legacy Mono'], ['rajdhani', 'Rajdhani'], ['chakra', 'Chakra Petch'], ['exo2', 'Exo 2'], ['orbitron', 'Orbitron'], ['oxanium', 'Oxanium'], ['saira-condensed', 'Saira Condensed'],
] as const;
const CLASSES = OPTIONS.filter(([id]) => id !== 'default').map(([id]) => `font-preview-${id}`);

export default function FontSettingsPanel() {
  const [font, setFontState] = useState('default');
  const [expanded, setExpanded] = useState(false);
  
  useEffect(() => { 
    const saved = localStorage.getItem('fn-font-preview') || 'default';
    setFontState(saved);
  }, []);
  
  function setFont(next: string) {
    setFontState(next);
    document.documentElement.classList.remove(...CLASSES);
    if (next === 'default') localStorage.removeItem('fn-font-preview');
    else { localStorage.setItem('fn-font-preview', next); document.documentElement.classList.add(`font-preview-${next}`); }
  }
  
  function handleApply() {
    // Font is already applied via setFont, just collapse the section
    setExpanded(false);
  }
  
  const currentLabel = OPTIONS.find(([id]) => id === font)?.[1] || 'Chakra Petch (Default)';
  const hasSelectedCandidate = font !== 'default';

  return (
    <div className="border border-fn-gborder bg-fn-card">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-3 border-b border-fn-gborder px-4 py-3 text-xs font-black uppercase tracking-widest hover:bg-fn-card2"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2 text-fn-green">
          Font Settings
          <span className="text-fn-muted">— {currentLabel}</span>
        </span>
        <ChevronDown 
          size={14} 
          className={`text-fn-green transition-transform ${expanded ? 'rotate-180' : ''}`} 
        />
      </button>
      
      {/* Expanded Content */}
      {expanded && (
        <div className="p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {OPTIONS.map(([id, label]) => {
              const isSelected = font === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFont(id)}
                  className={`relative rounded-sm border p-3 text-left text-xs font-black uppercase tracking-widest transition-all ${
                    isSelected 
                      ? 'border-fn-green bg-fn-green/10 text-fn-green' 
                      : 'border-fn-gborder bg-fn-black/50 text-fn-muted hover:border-fn-green/40'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {label}
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
          
          {/* Done Button */}
          <button
            type="button"
            onClick={handleApply}
            disabled={!hasSelectedCandidate}
            className={`mt-4 w-full rounded-sm px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
              hasSelectedCandidate
                ? 'bg-fn-green text-fn-black hover:bg-fn-gdim active:scale-[0.98]'
                : 'bg-fn-gborder text-fn-muted cursor-not-allowed opacity-50'
            }`}
          >
            {hasSelectedCandidate ? '✓ Done — Apply Site-Wide' : 'Select a Font Candidate First'}
          </button>
        </div>
      )}
    </div>
  );
}
