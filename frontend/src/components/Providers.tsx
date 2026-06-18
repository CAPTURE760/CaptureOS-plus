'use client';

import { SWRConfig } from 'swr';
import { fetchAPI } from '@/lib/api';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: fetchAPI,
        revalidateOnFocus: false,
        dedupingInterval: 5000, // 5 秒内相同 key 不重复请求
      }}
    >
      {children}
    </SWRConfig>
  );
}
