'use client';
import { useEffect, useState } from 'react';

const OPTIONS = [
  ['default', 'Chakra Petch (Default)'], ['legacy', 'Legacy Mono'], ['rajdhani', 'Rajdhani'], ['chakra', 'Chakra Petch'], ['exo2', 'Exo 2'], ['orbitron', 'Orbitron'], ['oxanium', 'Oxanium'], ['saira-condensed', 'Saira Condensed'],
] as const;
const CLASSES = OPTIONS.filter(([id]) => id !== 'default').map(([id]) => `font-preview-${id}`);

export default function FontSettingsPanel() {
  const [font, setFontState] = useState('default');
  useEffect(() => { setFontState(localStorage.getItem('fn-font-preview') || 'default'); }, []);
  function setFont(next: string) {
    setFontState(next);
    document.documentElement.classList.remove(...CLASSES);
    if (next === 'default') localStorage.removeItem('fn-font-preview');
    else { localStorage.setItem('fn-font-preview', next); document.documentElement.classList.add(`font-preview-${next}`); }
  }
  return <div className="grid gap-2 sm:grid-cols-2">{OPTIONS.map(([id, label]) => <button key={id} type="button" onClick={() => setFont(id)} className={`rounded-sm border p-3 text-left text-xs font-black uppercase tracking-widest ${font === id ? 'border-fn-green bg-fn-green/10 text-fn-green' : 'border-fn-gborder bg-fn-black/50 text-fn-muted'}`}>{label}</button>)}</div>;
}
