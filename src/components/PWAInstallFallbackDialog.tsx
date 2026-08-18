'use client';

import { Share2, X } from 'lucide-react';
import type { PWAInstallMode } from './usePWAInstallPrompt';

type Props = {
  mode: Exclude<PWAInstallMode, 'native'>;
  onClose: () => void;
};

export default function PWAInstallFallbackDialog({ mode, onClose }: Props) {
  const isIOS = mode === 'ios';

  return (
    <div className="fixed inset-0 z-[320] flex items-end bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="Install FragNaija app instructions">
      <div className="w-full max-w-sm overflow-hidden rounded-sm border border-fn-green/30 bg-fn-card shadow-2xl shadow-black/70">
        <div className="flex items-center justify-between border-b border-fn-gborder bg-fn-dark px-4 py-3">
          <div className="flex items-center gap-2">
            <Share2 size={14} className="text-fn-green" />
            <p className="fn-label text-fn-text">Install App</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close install instructions" className="text-fn-muted hover:text-fn-text">
            <X size={15} />
          </button>
        </div>
        <div className="p-4">
          {isIOS ? (
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm border border-fn-green/30 bg-fn-green/10 text-fn-green">
                <Share2 size={22} />
              </div>
              <p className="text-sm font-bold uppercase tracking-wider text-fn-text">Tap the Share icon, then &apos;Add to Home Screen&apos;.</p>
              <p className="text-xs leading-relaxed text-fn-muted">Safari uses the iOS share sheet for installing FragNaija to your home screen.</p>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-fn-muted">Your browser doesn&apos;t support app installation. For the best experience, open FragNaija in Chrome, Edge, or Safari and try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}
