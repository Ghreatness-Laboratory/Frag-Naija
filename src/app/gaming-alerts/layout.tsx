import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gaming Alerts',
};

export default function GamingAlertsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
