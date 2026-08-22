import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Register',
  description: 'Create your FragNaija account and join Nigeria esports on one platform.',
  path: '/register',
});

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
