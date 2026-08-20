import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teams',
  description: 'Discover esports teams on FragNaija. View team rosters, rankings, and performance stats.',
  openGraph: {
    title: 'Teams | FragNaija',
    description: 'Discover esports teams on FragNaija. View team rosters, rankings, and performance stats.',
  },
  twitter: {
    title: 'Teams | FragNaija',
    description: 'Discover esports teams on FragNaija. View team rosters, rankings, and performance stats.',
  },
};

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
