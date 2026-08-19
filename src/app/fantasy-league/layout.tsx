import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fantasy League',
};

export default function FantasyLeagueLayout({ children }: { children: React.ReactNode }) {
  return children;
}
