import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'News Article',
};

export default function NewsArticleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
