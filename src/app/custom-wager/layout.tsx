import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Custom Wager',
  description: 'Create custom esports wagers with clear terms and competitive matchups.',
  path: '/custom-wager',
});

export default function CustomwagerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
