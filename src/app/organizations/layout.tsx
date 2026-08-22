import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Organizations',
  description: 'Discover esports organizations and community operators on FragNaija.',
  path: '/organizations',
});

export default function OrganizationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
