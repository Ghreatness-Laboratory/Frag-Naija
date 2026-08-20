import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wager Zone',
  description: 'Place your bets on FragNaija Wager Zone. Predict match outcomes, player performance, and win big.',
  openGraph: {
    title: 'Wager Zone | FragNaija',
    description: 'Place your bets on FragNaija Wager Zone. Predict match outcomes, player performance, and win big.',
  },
  twitter: {
    title: 'Wager Zone | FragNaija',
    description: 'Place your bets on FragNaija Wager Zone. Predict match outcomes, player performance, and win big.',
  },
};

export default function WagerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
