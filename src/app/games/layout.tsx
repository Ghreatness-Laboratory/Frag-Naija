import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Games',
  description: 'Explore supported esports titles and competitive game modes on FragNaija.',
  path: '/games',
});

export default function GamesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
