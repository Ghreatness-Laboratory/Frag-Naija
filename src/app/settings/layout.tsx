import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Settings',
  description: 'Manage FragNaija account, display, notification, and app preferences.',
  path: '/settings',
});

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
