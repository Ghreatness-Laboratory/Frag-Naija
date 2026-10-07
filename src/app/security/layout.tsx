import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Security',
  description: 'Review FragNaija security guidance and account protection information.',
  path: '/security',
});

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
