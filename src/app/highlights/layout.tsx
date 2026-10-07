import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Highlights',
  description: 'Watch FragNaija esports highlights, clips, and standout plays.',
  path: '/highlights',
});

export default function HighlightsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
