import { pageMetadata } from '@/lib/seo';
export const metadata = pageMetadata({ title: 'Athlete Marketplace', description: 'Scout approved player listings on FragNaija.', path: '/marketplace' });
export default function MarketplaceLayout({ children }: { children: React.ReactNode }) { return children; }
