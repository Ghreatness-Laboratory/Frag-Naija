import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Gaming Alerts',
  description: 'Get gaming alerts for tournaments, wagers, news, and FragNaija competitive updates.',
  path: '/gaming-alerts',
});

export default function GamingalertsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
