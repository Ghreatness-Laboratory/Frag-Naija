'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Shield } from 'lucide-react';

const STORAGE_KEY = 'fn-disclaimer-v1';

const RULES = [
  'You must be 18 years of age or older to participate.',
  'Match fixing of any kind is considered fraud and will be acted upon.',
  'Placing or attempting to place bets on a market while a game is in progress or nearing its conclusion is fraudulent.',
  'All markets must be placed before a fixture begins — no late entries are accepted.',
  'Violations result in disqualification and/or further action.',
];

export default function DisclaimerModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg overflow-hidden rounded-sm border border-fn-gborder bg-fn-card shadow-2xl">
        <div className="flex items-center gap-2.5 border-b border-fn-gborder bg-fn-dark px-5 py-4">
          <AlertTriangle size={14} className="flex-shrink-0 text-fn-yellow" />
          <h2 className="font-display text-sm font-black uppercase tracking-[0.2em] text-fn-text">
            Wager &amp; Predictor Notice
          </h2>
        </div>

        <div className="space-y-3 px-5 py-4">
          <div className="space-y-3">
            {RULES.map((rule, i) => (
              <div key={i} className="flex gap-3">
                <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm border border-fn-green/30 bg-fn-green/10 text-[8px] font-bold text-fn-green">
                  {i + 1}
                </span>
                <p className="text-[11px] leading-snug text-fn-muted">{rule}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 border-t border-fn-gborder pt-3">
            <Shield size={10} className="text-fn-green" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-fn-text">
              Predict responsibly.
            </p>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={accept}
            className="w-full rounded-sm bg-fn-green py-3 text-[11px] font-black uppercase tracking-[0.2em] text-fn-black transition-colors hover:bg-fn-gdim"
          >
            I Understand — Continue
          </button>
        </div>
      </div>
    </div>
  );
}
