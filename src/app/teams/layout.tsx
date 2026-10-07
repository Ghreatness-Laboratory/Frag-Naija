import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Teams',
  description: 'Discover esports teams on FragNaija. View team rosters, rankings, and performance stats.',
  path: '/teams',
});

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
