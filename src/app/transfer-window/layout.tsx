import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transfer Window',
};

export default function TransferWindowLayout({ children }: { children: React.ReactNode }) {
  return children;
}
