import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Meet the Creators',
  description: 'Meet the creators building FragNaija for Nigeria esports.',
  path: '/about',
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
