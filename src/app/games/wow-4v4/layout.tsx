import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'WOW 4v4',
  description: 'Play WOW 4v4 competitive matchups on FragNaija.',
  path: '/games/wow-4v4',
});

export default function GamesWow4v4Layout({ children }: { children: React.ReactNode }) {
  return children;
}
