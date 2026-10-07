import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Athletes',
  description: 'Browse professional esports athletes on FragNaija. View player stats, rankings, and profiles.',
  path: '/athletes',
});

export default function AthletesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
