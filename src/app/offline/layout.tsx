import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Offline',
  description: 'FragNaija is temporarily offline on this device.',
  path: '/offline',
});

export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
