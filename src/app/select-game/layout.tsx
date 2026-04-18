import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Select Your Game | Frag Naija',
  description: "Choose your primary esports title and enter Nigeria's premier competitive gaming platform.",
};

export default function SelectGameLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
