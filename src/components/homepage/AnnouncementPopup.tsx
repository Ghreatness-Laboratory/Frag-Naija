'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import OptimizedImage from '@/components/common/OptimizedImage';

type HomepageSettings = Record<string, string | boolean | null | undefined>;

const DISMISSED_KEY = 'frag-naija:homepage-announcement-dismissed';

function enabled(value: HomepageSettings['popup_enabled']) {
  return value === true || String(value ?? '').toLowerCase() === 'true';
}

/** Public announcement fields are the popup_title/popup_cta fields used by admin. */
export default function AnnouncementPopup({ settings }: { settings: HomepageSettings }) {
  const [isOpen, setIsOpen] = useState(false);
  const title = String(settings.popup_title ?? '').trim();
  const body = String(settings.popup_body ?? '').trim();
  const cta = String(settings.popup_cta ?? '').trim();
  const imageUrl = String(settings.popup_image_url ?? '').trim();
  const ctaLink = String(settings.popup_cta_link ?? '').trim();
  const hasContent = Boolean(title || body || cta);

  useEffect(() => {
    if (!enabled(settings.popup_enabled) || !hasContent) {
      setIsOpen(false);
      return;
    }

    setIsOpen(sessionStorage.getItem(DISMISSED_KEY) !== 'true');
  }, [settings.popup_enabled, hasContent, title, body, cta, imageUrl, ctaLink]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  });

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    setIsOpen(false);
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-fn-black/85 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'announcement-title' : undefined}
      aria-label={title ? undefined : 'Announcement'}
    >
      <section className="relative w-full max-w-lg overflow-hidden rounded-sm border border-fn-green/40 bg-fn-card shadow-2xl">
        <div className="h-1 bg-fn-green" />
        <button type="button" onClick={dismiss} className="absolute right-3 top-4 rounded-sm border border-fn-gborder bg-fn-card p-1.5 text-fn-muted transition-colors hover:border-fn-green hover:text-fn-green" aria-label="Close announcement">
          <X size={16} />
        </button>
        {imageUrl && (
          <div className="relative aspect-[16/7] border-b border-fn-gborder bg-fn-black">
            <OptimizedImage src={imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 512px" className="object-cover" />
          </div>
        )}
        <div className="p-5 sm:p-6">
          <p className="fn-label mb-2 text-fn-green">FRAG NAIJA // ANNOUNCEMENT</p>
          {title && <h2 id="announcement-title" className="pr-8 font-display text-2xl font-black uppercase leading-tight text-fn-text sm:text-3xl">{title}</h2>}
          {body && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-fn-muted">{body}</p>}
          {cta && (ctaLink ? (
            <a href={ctaLink} onClick={dismiss} className="fn-btn mt-5 inline-flex">{cta}</a>
          ) : (
            <button type="button" onClick={dismiss} className="fn-btn mt-5">{cta}</button>
          ))}
        </div>
      </section>
    </div>
  );
}
