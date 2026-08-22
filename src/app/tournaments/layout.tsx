import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Tournaments',
  description: 'Join esports tournaments on FragNaija. Compete in PUBG Mobile, CODM, Free Fire, and more.',
  path: '/tournaments',
});

export default function TournamentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
