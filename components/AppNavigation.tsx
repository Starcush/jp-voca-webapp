"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import {
  Camera,
  CaseSensitive,
  Languages,
  List,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAppRouteTransition } from "@/components/AppRouteTransition";
import { buildReviewHref } from "@/components/review/review-links";
import { buildWordListHref } from "@/components/words/word-list-links";
import { DEFAULT_LANGUAGE, isLanguage } from "@/lib/languages";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  label: string;
  mobileLabel?: string;
};

const fallbackNavigationItems: Array<{
  icon: LucideIcon;
  label: string;
  mobileLabel?: string;
}> = [
  { icon: List, label: "목록" },
  { icon: Camera, label: "가져오기" },
  { icon: Languages, label: "정리" },
  { icon: RotateCcw, label: "복습" },
];

function getActiveLanguage(
  searchLanguage: string | null,
  defaultLanguage?: Language,
): Language {
  if (searchLanguage && isLanguage(searchLanguage)) {
    return searchLanguage;
  }

  return defaultLanguage ?? DEFAULT_LANGUAGE;
}

function getOrganizeIcon(language: Language): LucideIcon {
  return language === "en" ? CaseSensitive : Languages;
}

function getNavigationItems({
  language,
  notebookId,
  pathname,
}: {
  language: Language;
  notebookId?: string;
  pathname: string;
}): NavigationItem[] {
  return [
    {
      href: buildWordListHref({ language, notebookId, path: "/words" }),
      icon: List,
      isActive: pathname === "/words",
      label: "목록",
    },
    {
      href: buildWordListHref({ language, notebookId, path: "/words/import" }),
      icon: Camera,
      isActive: pathname === "/words/import",
      label: "가져오기",
    },
    {
      href: buildWordListHref({ language, path: "/words/organize" }),
      icon: getOrganizeIcon(language),
      isActive: pathname.startsWith("/words/organize"),
      label: "정리",
    },
    {
      href: buildReviewHref({ language, notebookId }),
      icon: RotateCcw,
      isActive: pathname === "/review",
      label: "복습",
    },
  ];
}

/**
 * 라우트 전환 중 AppNavigation이 searchParams를 기다릴 때 레이아웃이 무너지지 않도록 같은 크기의 네비게이션 뼈대를 렌더링합니다.
 *
 * @returns 데스크탑 사이드바와 모바일 하단 탭의 고정 크기 fallback을 렌더링합니다.
 */
export function AppNavigationFallback() {
  return (
    <>
      <aside
        aria-hidden="true"
        className="sticky top-0 hidden h-dvh flex-col border-r border-brand-border bg-brand-background px-4 py-6 md:flex"
      >
        <div className="mb-5 rounded-lg px-3 py-2 text-xl font-black tracking-normal text-brand-text">
          단어장
        </div>
        <div className="grid gap-1">
          {fallbackNavigationItems.map((item) => (
            <div
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold text-brand-muted"
              key={item.label}
            >
              <item.icon aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
              {item.label}
            </div>
          ))}
        </div>
      </aside>

      <div
        aria-hidden="true"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-border bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 shadow-[0_-8px_24px_rgba(36,28,61,0.1)] backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {fallbackNavigationItems.map((item) => (
            <div
              className="grid min-h-12 place-items-center rounded-lg px-1 text-xs font-bold text-brand-muted"
              key={item.label}
            >
              <item.icon aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
              <span>{item.mobileLabel ?? item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/**
 * 주요 학습 화면 사이를 이동하는 모바일 하단 탭과 데스크탑 사이드바를 렌더링합니다.
 *
 * @returns 현재 URL의 언어/노트 query를 유지하는 1차 네비게이션을 렌더링합니다.
 */
export function AppNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const session = useSession();
  const { startNavigation } = useAppRouteTransition();
  const activeLanguage = getActiveLanguage(
    searchParams.get("lang"),
    session?.defaultLanguage,
  );
  const notebookId = searchParams.get("notebookId") ?? undefined;
  const items = getNavigationItems({
    language: activeLanguage,
    notebookId,
    pathname,
  });

  function handleNavigationClick(
    event: MouseEvent<HTMLAnchorElement>,
    isActive: boolean,
  ) {
    if (
      isActive ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    startNavigation();
  }

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-brand-border bg-brand-background px-4 py-6 md:flex">
        <Link
          className="mb-5 rounded-lg px-3 py-2 text-xl font-black tracking-normal text-brand-text"
          href={buildWordListHref({ language: activeLanguage, path: "/words" })}
          onClick={(event) => handleNavigationClick(event, pathname === "/words")}
        >
          단어장
        </Link>
        <nav className="grid gap-1" aria-label="주요 메뉴">
          {items.map((item) => (
            <Link
              aria-current={item.isActive ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold transition-colors ${
                item.isActive
                  ? "bg-white text-brand-green shadow-sm"
                  : "text-brand-muted hover:bg-white"
              }`}
              href={item.href}
              key={item.label}
              onClick={(event) => handleNavigationClick(event, item.isActive)}
            >
              <item.icon aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <nav
        aria-label="주요 메뉴"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-border bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 shadow-[0_-8px_24px_rgba(36,28,61,0.1)] backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {items.map((item) => (
            <Link
              aria-current={item.isActive ? "page" : undefined}
              className={`grid min-h-12 place-items-center rounded-lg px-1 text-xs font-bold ${
                item.isActive
                  ? "text-brand-green"
                  : "text-brand-muted hover:bg-brand-background"
              }`}
              href={item.href}
              key={item.label}
              onClick={(event) => handleNavigationClick(event, item.isActive)}
            >
              <item.icon aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
              <span>{item.mobileLabel ?? item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
