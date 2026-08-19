import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tournaments',
};

export default function TournamentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
