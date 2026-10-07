import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Communities',
  description: 'Connect with FragNaija esports communities and competitive groups.',
  path: '/communities',
});

export default function CommunitiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
