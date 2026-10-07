import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Transfer Window',
  description: 'Track esports roster moves and transfer window activity on FragNaija.',
  path: '/transfer-window',
});

export default function TransferwindowLayout({ children }: { children: React.ReactNode }) {
  return children;
}
