import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Shop',
  description: 'Browse esports gear and merchandise on FragNaija Shop. Jerseys, accessories, and more.',
  path: '/shop',
});

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
