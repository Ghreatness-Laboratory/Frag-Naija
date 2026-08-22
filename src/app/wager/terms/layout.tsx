import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Wager Terms',
  description: 'Review the FragNaija Wager Zone terms before joining competitive wagers.',
  path: '/wager/terms',
});

export default function WagerTermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
