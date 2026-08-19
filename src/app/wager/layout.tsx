import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wager Zone',
};

export default function WagerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
