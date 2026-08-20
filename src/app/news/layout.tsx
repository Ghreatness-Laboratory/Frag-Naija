import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'News',
  description: 'Latest esports news on FragNaija. Trending, hot, gossip, and transfer news from the Nigerian esports scene.',
  openGraph: {
    title: 'News | FragNaija',
    description: 'Latest esports news on FragNaija. Trending, hot, gossip, and transfer news from the Nigerian esports scene.',
  },
  twitter: {
    title: 'News | FragNaija',
    description: 'Latest esports news on FragNaija. Trending, hot, gossip, and transfer news from the Nigerian esports scene.',
  },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
