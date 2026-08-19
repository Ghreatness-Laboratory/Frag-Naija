import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TDM 1v1',
};

export default function PageLayout({ children }: { children: React.ReactNode }) {
  return children;
}
