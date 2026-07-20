import Link from "next/link";
import { ChevronLeft, Settings } from "lucide-react";
import { Suspense, type ReactNode } from "react";
import { AppFrameLanguageMenu } from "@/components/AppFrameLanguageMenu";
import { AppNavigation } from "@/components/AppNavigation";
import type { Language } from "@/types/language";

type AppFrameProps = {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  backHref?: string;
  children: ReactNode;
  language?: Language;
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
  backHref,
  children,
  language,
  showHeader = true,
}: AppFrameProps) {
  return (
    <main className="min-h-dvh bg-brand-background px-4 pb-16 pt-0 text-brand-text md:bg-white md:p-0">
      <div className="grid min-h-dvh w-full md:grid-cols-[216px_minmax(0,1fr)]">
        <Suspense fallback={null}>
          <AppNavigation />
        </Suspense>
        <section className="mx-auto flex w-full max-w-md flex-col md:mx-0 md:max-w-none md:bg-white md:px-8 md:py-8 lg:px-10">
          {showHeader ? (
            <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between gap-3 border-b border-brand-border bg-white px-4 pb-3 pt-5 text-brand-text shadow-[0_8px_20px_rgba(36,28,61,0.06)] md:static md:mx-0 md:mb-6 md:border-0 md:p-0 md:shadow-none">
              <div className="flex min-w-0 items-center gap-1">
                {backHref ? (
                  <Link
                    aria-label="뒤로가기"
                    className="-ml-2 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-brand-text"
                    href={backHref}
                  >
                    <ChevronLeft
                      aria-hidden="true"
                      className="h-6 w-6"
                      strokeWidth={2.4}
                    />
                  </Link>
                ) : null}
                <Link href={backHref ?? "/words"} className="min-w-0">
                  <h1 className="truncate text-2xl font-black tracking-normal text-brand-text">
                    {title}
                  </h1>
                </Link>
              </div>
              {action ??
                (language ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <AppFrameLanguageMenu activeLanguage={language} />
                    <Link
                      aria-label="설정"
                      className="grid h-10 w-10 place-items-center rounded-lg border border-brand-border bg-white text-brand-muted shadow-sm"
                      href="/settings"
                    >
                      <Settings
                        aria-hidden="true"
                        className="h-5 w-5"
                        strokeWidth={2.2}
                      />
                    </Link>
                  </div>
                ) : eyebrow ? (
                  <span
                    aria-label={eyebrow}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-brand-border bg-white text-lg shadow-sm"
                  >
                    {eyebrow}
                  </span>
                ) : null)}
            </header>
          ) : null}
          {children}
        </section>
      </div>
    </main>
  );
}
