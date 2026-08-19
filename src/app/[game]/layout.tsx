import type { Metadata } from 'next';

function titleize(value: string) {
  return decodeURIComponent(value)
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function generateMetadata({ params }: { params: { id?: string; game?: string } }): Metadata {
  const raw = params.id ?? params.game ?? '';
  return { title: titleize(raw) || 'Game' };
}

export default function DynamicLayout({ children }: { children: React.ReactNode }) {
  return children;
}
