import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'News',
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
