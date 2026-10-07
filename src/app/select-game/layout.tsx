import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Select Your Game',
  description: "Choose your primary esports title and enter Nigeria's premier competitive gaming platform.",
  path: '/select-game',
});

export default function SelectgameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
