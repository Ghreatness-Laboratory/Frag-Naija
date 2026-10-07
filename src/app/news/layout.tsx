import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'News',
  description: 'Latest esports news on FragNaija. Trending, hot, gossip, and transfer news from the Nigerian esports scene.',
  path: '/news',
});

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
