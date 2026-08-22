import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Wallet',
  description: 'Manage your FragNaija wallet and esports platform balance securely.',
  path: '/wallet',
});

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return children;
}
