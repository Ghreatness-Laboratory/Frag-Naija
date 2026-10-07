import { ExternalLink, UserRound } from 'lucide-react';
import OptimizedImage from '@/components/common/OptimizedImage';

export type Stakeholder = {
  id: string;
  name: string;
  role: string;
  photo_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
  linkedin_url?: string | null;
  youtube_url?: string | null;
  twitch_url?: string | null;
  website_url?: string | null;
};

const SOCIALS = [
  ['twitter_url', 'X', ExternalLink],
  ['instagram_url', 'Instagram', ExternalLink],
  ['linkedin_url', 'LinkedIn', ExternalLink],
  ['youtube_url', 'YouTube', ExternalLink],
  ['twitch_url', 'Twitch', ExternalLink],
  ['website_url', 'Website', ExternalLink],
] as const;

export default function StakeholderCard({ stakeholder, compact = false }: { stakeholder: Stakeholder; compact?: boolean }) {
  return (
    <article className="min-w-[220px] rounded-sm border border-fn-gborder bg-fn-card p-4 transition-colors hover:border-fn-green/40">
      <div className="flex items-center gap-3">
        <div className={`${compact ? 'h-12 w-12' : 'h-16 w-16'} flex shrink-0 items-center justify-center overflow-hidden rounded-sm border border-fn-gborder bg-fn-dark`}>
          {stakeholder.photo_url ? (
            <OptimizedImage src={stakeholder.photo_url} alt={stakeholder.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <UserRound size={compact ? 20 : 26} className="text-fn-green" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black uppercase tracking-widest text-fn-text">{stakeholder.name}</h3>
          <p className="mt-1 line-clamp-2 text-[10px] font-bold uppercase tracking-wider text-fn-muted">{stakeholder.role}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {SOCIALS.map(([key, label, Icon]) => {
          const href = stakeholder[key];
          if (!href) return null;
          return (
            <a key={key} href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-sm border border-fn-green/25 bg-fn-green/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-fn-green hover:bg-fn-green/20">
              <Icon size={10} /> {label}
            </a>
          );
        })}
      </div>
    </article>
  );
}
