import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Wager Zone',
  description: 'Place your bets on FragNaija Wager Zone. Predict match outcomes, player performance, and win big.',
  path: '/wager',
});

export default function WagerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
