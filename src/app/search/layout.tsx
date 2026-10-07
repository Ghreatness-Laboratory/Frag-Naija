import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Search',
  description: 'Search FragNaija news, athletes, teams, tournaments, and esports content.',
  path: '/search',
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
