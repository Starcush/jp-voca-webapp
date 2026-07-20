"use client";

import type { ReactNode } from "react";
import { useAppRouteTransition } from "@/components/AppRouteTransition";

type AppFrameContentProps = {
  children: ReactNode;
  header?: ReactNode;
};

/**
 * 앱 프레임의 콘텐츠 컬럼을 렌더링하고 라우트 전환 중 콘텐츠에만 블러/로딩 오버레이를 적용합니다.
 *
 * @param props - 페이지 헤더와 본문입니다.
 * @param props.header - 페이지 상단 헤더입니다.
 * @param props.children - 현재 라우트의 본문 콘텐츠입니다.
 * @returns 네비게이션과 분리된 콘텐츠 영역을 렌더링합니다.
 */
export function AppFrameContent({ children, header }: AppFrameContentProps) {
  const { isNavigating } = useAppRouteTransition();

  return (
    <section className="relative mx-auto flex w-full max-w-md flex-col md:col-start-2 md:mx-0 md:min-h-dvh md:max-w-none md:bg-white md:px-8 md:py-8 lg:px-10">
      <div
        className={`flex flex-1 flex-col transition duration-150 ${
          isNavigating ? "pointer-events-none blur-[1.5px] opacity-55" : ""
        }`}
      >
        {header}
        {children}
      </div>

      {isNavigating ? (
        <div className="absolute inset-0 z-40 grid place-items-center bg-white/30 px-6 backdrop-blur-[1px]">
          <div className="grid gap-3 rounded-xl border border-brand-border bg-white/95 px-5 py-4 text-center shadow-[0_16px_40px_rgba(25,25,25,0.12)]">
            <span
              aria-hidden="true"
              className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-brand-border border-t-brand-green"
            />
            <p className="text-sm font-bold text-brand-text">화면을 여는 중</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
