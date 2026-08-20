import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Browse esports gear and merchandise on FragNaija Shop. Jerseys, accessories, and more.',
  openGraph: {
    title: 'Shop | FragNaija',
    description: 'Browse esports gear and merchandise on FragNaija Shop. Jerseys, accessories, and more.',
  },
  twitter: {
    title: 'Shop | FragNaija',
    description: 'Browse esports gear and merchandise on FragNaija Shop. Jerseys, accessories, and more.',
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
