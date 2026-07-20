import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { AppNavigation } from "@/components/AppNavigation";

type AppFrameProps = {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  showHeader?: boolean;
};

/**
 * 로그인 이후 화면의 공통 배경, 데스크탑 사이드바, 모바일 하단 탭 영역을 제공합니다.
 *
 * @param props - 화면 제목, 상단 액션, 본문, 헤더 표시 여부입니다.
 * @returns 주요 네비게이션과 페이지 본문을 포함한 앱 레이아웃을 렌더링합니다.
 */
export function AppFrame({
  title,
  eyebrow,
  action,
  children,
  showHeader = true,
}: AppFrameProps) {
  return (
    <main
      className={`min-h-dvh bg-brand-background px-4 pb-24 text-brand-text md:py-4 md:pb-4 ${
        showHeader ? "pt-4" : "pt-0"
      }`}
    >
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-6xl gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
        <Suspense fallback={null}>
          <AppNavigation />
        </Suspense>
        <section className="mx-auto flex w-full max-w-md flex-col md:max-w-none">
          {showHeader ? (
            <header className="flex items-center justify-between gap-4 pb-4">
              <Link href="/words" className="min-w-0">
                {eyebrow ? (
                  <p className="text-xs font-semibold uppercase tracking-normal text-brand-muted">
                    {eyebrow}
                  </p>
                ) : null}
                <h1 className="truncate text-2xl font-bold tracking-normal text-brand-text">
                  {title}
                </h1>
              </Link>
              {action}
            </header>
          ) : null}
          {children}
        </section>
      </div>
    </main>
  );
}
