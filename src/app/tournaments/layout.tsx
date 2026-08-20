import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tournaments',
  description: 'Join esports tournaments on FragNaija. Compete in PUBG Mobile, CODM, Free Fire, and more.',
  openGraph: {
    title: 'Tournaments | FragNaija',
    description: 'Join esports tournaments on FragNaija. Compete in PUBG Mobile, CODM, Free Fire, and more.',
  },
  twitter: {
    title: 'Tournaments | FragNaija',
    description: 'Join esports tournaments on FragNaija. Compete in PUBG Mobile, CODM, Free Fire, and more.',
  },
};

export default function TournamentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
