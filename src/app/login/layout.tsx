import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Login',
  description: 'Access your FragNaija account.',
  path: '/login',
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
