import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
    <main className="min-h-dvh bg-brand-background px-4 pb-24 pt-0 text-brand-text md:py-4 md:pb-4">
      <div className="mx-auto grid min-h-[calc(100dvh-2rem)] w-full max-w-6xl gap-5 md:grid-cols-[180px_minmax(0,1fr)]">
        <Suspense fallback={null}>
          <AppNavigation />
        </Suspense>
        <section className="mx-auto flex w-full max-w-md flex-col md:max-w-none">
          {showHeader ? (
            <header className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between gap-3 border-b border-brand-border bg-white px-4 pb-3 pt-5 text-brand-text shadow-[0_8px_20px_rgba(36,28,61,0.06)] md:static md:mx-0 md:rounded-t-xl md:border md:p-4">
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
                  <AppFrameLanguageMenu activeLanguage={language} />
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
