import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Athletes',
  description: 'Browse professional esports athletes on FragNaija. View player stats, rankings, and profiles.',
  openGraph: {
    title: 'Athletes | FragNaija',
    description: 'Browse professional esports athletes on FragNaija. View player stats, rankings, and profiles.',
  },
  twitter: {
    title: 'Athletes | FragNaija',
    description: 'Browse professional esports athletes on FragNaija. View player stats, rankings, and profiles.',
  },
};

export default function AthletesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
