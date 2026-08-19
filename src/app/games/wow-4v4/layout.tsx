import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WOW 4v4',
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
