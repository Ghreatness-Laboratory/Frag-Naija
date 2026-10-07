'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import OptimizedImage from '@/components/common/OptimizedImage';

type HomepageSettings = Record<string, string | boolean | null | undefined>;

const DISMISSED_KEY = 'frag-naija:homepage-announcement-dismissed';

function enabled(value: HomepageSettings['popup_enabled']) {
  return value === true || String(value ?? '').toLowerCase() === 'true';
}

function announcementId(parts: Array<string>) {
  return parts.join('|');
}

/** Public announcement fields are the popup_title/popup_cta fields used by admin. */
export default function AnnouncementPopup({ settings }: { settings: HomepageSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const dismissButtonRef = useRef<HTMLButtonElement>(null);
  const title = String(settings.popup_title ?? '').trim();
  const body = String(settings.popup_body ?? '').trim();
  const cta = String(settings.popup_cta ?? '').trim();
  const imageUrl = String(settings.popup_image_url ?? '').trim();
  const ctaLink = String(settings.popup_cta_link ?? '').trim();
  const hasContent = Boolean(title || body || cta || imageUrl);
  const activeAnnouncementId = useMemo(() => announcementId([title, body, cta, imageUrl, ctaLink]), [title, body, cta, imageUrl, ctaLink]);
  const dismiss = useCallback(() => {
    sessionStorage.setItem(DISMISSED_KEY, activeAnnouncementId);
    setIsOpen(false);
  }, [activeAnnouncementId]);

  useEffect(() => {
    if (!enabled(settings.popup_enabled) || !hasContent) {
      setIsOpen(false);
      return;
    }

    setIsOpen(sessionStorage.getItem(DISMISSED_KEY) !== activeAnnouncementId);
  }, [settings.popup_enabled, hasContent, activeAnnouncementId]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, dismiss]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dismissButtonRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-fn-black/80 px-3 py-4 backdrop-blur-md sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'announcement-title' : undefined}
      aria-label={title ? undefined : 'Announcement'}
    >
      <section className="relative flex max-h-[calc(100vh-4rem)] w-full max-w-[min(85vw,28rem)] flex-col overflow-hidden rounded-[1.5rem] border border-fn-green/35 bg-fn-card shadow-[0_20px_56px_rgba(0,0,0,.6),0_0_30px_rgba(77,255,110,.16)] ring-1 ring-white/5 motion-safe:animate-[announcement-pop_.24s_ease-out]">
        <button
          type="button"
          onClick={dismiss}
          ref={dismissButtonRef}
          className="absolute right-2.5 top-2.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-fn-black/80 text-fn-text shadow-lg backdrop-blur transition-colors hover:border-fn-green hover:bg-fn-green hover:text-fn-black focus:outline-none focus:ring-2 focus:ring-fn-green"
          aria-label="Close announcement"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
        <div className="relative min-h-[8.5rem] shrink-0 overflow-hidden bg-fn-black sm:min-h-[11rem]">
          {imageUrl ? (
            <OptimizedImage src={imageUrl} alt="" fill sizes="(max-width: 640px) 85vw, 448px" className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(77,255,110,.32),transparent_35%),linear-gradient(135deg,rgba(77,255,110,.18),rgba(8,11,9,.96)_65%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-fn-card via-fn-card/15 to-transparent" />
          <div className="absolute bottom-3 left-4 rounded-full border border-fn-green/40 bg-fn-black/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-fn-green backdrop-blur">
            Frag Naija Ad
          </div>
        </div>
        <div className="overflow-y-auto px-4 pb-4 pt-3.5 sm:px-5 sm:pb-5 sm:pt-4">
          {title && <h2 id="announcement-title" className="font-display text-xl font-black uppercase leading-tight tracking-wide text-fn-text sm:text-3xl">{title}</h2>}
          {body && <p className="mt-2.5 whitespace-pre-line text-sm leading-5 text-fn-muted sm:leading-6">{body}</p>}
          {cta && (ctaLink ? (
            <a href={ctaLink} onClick={dismiss} className="mt-4 flex w-full items-center justify-center rounded-full bg-fn-green px-4 py-3 text-center font-mono text-xs font-black uppercase tracking-[0.18em] text-fn-black shadow-[0_0_22px_rgba(77,255,110,.22)] transition hover:bg-fn-gdim active:scale-[0.98]">{cta}</a>
          ) : (
            <button type="button" onClick={dismiss} className="mt-4 flex w-full items-center justify-center rounded-full bg-fn-green px-4 py-3 text-center font-mono text-xs font-black uppercase tracking-[0.18em] text-fn-black shadow-[0_0_22px_rgba(77,255,110,.22)] transition hover:bg-fn-gdim active:scale-[0.98]">{cta}</button>
          ))}
        </div>
      </section>
    </div>
  );
}
