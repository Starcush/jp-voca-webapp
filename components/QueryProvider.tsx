"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

type QueryProviderProps = {
  children: ReactNode;
};

/**
 * 앱 전체에서 TanStack Query 캐시와 서버 상태 관리를 사용할 수 있게 감쌉니다.
 *
 * @param props - Query provider에 필요한 속성입니다.
 * @param props.children - QueryClientProvider 아래에서 렌더링할 앱 콘텐츠입니다.
 * @returns TanStack Query 클라이언트가 연결된 React 트리를 렌더링합니다.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 30 * 1000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
