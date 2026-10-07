'use client';

import dynamic from 'next/dynamic';

const SupportChatbot = dynamic(() => import('@/components/support/SupportChatbot'), {
  ssr: false,
  loading: () => null,
});

export default function LazySupportChatbot() {
  return <SupportChatbot />;
}
