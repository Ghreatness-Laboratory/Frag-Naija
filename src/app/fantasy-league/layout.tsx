import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Fantasy League',
  description: 'Build squads, follow esports talent, and compete in FragNaija Fantasy League.',
  path: '/fantasy-league',
});

export default function FantasyleagueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
