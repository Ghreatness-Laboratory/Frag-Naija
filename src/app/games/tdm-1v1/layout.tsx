import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'TDM 1v1',
  description: 'Play TDM 1v1 competitive duels on FragNaija.',
  path: '/games/tdm-1v1',
});

export default function GamesTdm1v1Layout({ children }: { children: React.ReactNode }) {
  return children;
}
