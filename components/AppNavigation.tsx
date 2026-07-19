"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import {
  ArrowLeftRight,
  Camera,
  List,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { buildReviewHref } from "@/components/review/review-links";
import { buildWordListHref } from "@/components/words/word-list-links";
import { DEFAULT_LANGUAGE, getLanguageOption, isLanguage } from "@/lib/languages";
import { getFirebaseAuth } from "@/lib/firebase";
import { clearStoredSession } from "@/lib/session";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  label: string;
};

function getActiveLanguage(
  searchLanguage: string | null,
  defaultLanguage?: Language,
): Language {
  if (searchLanguage && isLanguage(searchLanguage)) {
    return searchLanguage;
  }

  return defaultLanguage ?? DEFAULT_LANGUAGE;
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
      icon: ArrowLeftRight,
      isActive: pathname === "/words/organize",
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
 * 주요 학습 화면 사이를 이동하는 모바일 하단 탭과 데스크탑 사이드바를 렌더링합니다.
 *
 * @returns 현재 URL의 언어/노트 query를 유지하는 1차 네비게이션을 렌더링합니다.
 */
export function AppNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const session = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const activeLanguage = getActiveLanguage(
    searchParams.get("lang"),
    session?.defaultLanguage,
  );
  const activeLanguageOption = getLanguageOption(activeLanguage);
  const notebookId = searchParams.get("notebookId") ?? undefined;
  const items = getNavigationItems({
    language: activeLanguage,
    notebookId,
    pathname,
  });

  function handleSignOut() {
    setIsSigningOut(true);
    void signOut(getFirebaseAuth()).finally(() => {
      clearStoredSession();
      router.replace("/login");
    });
  }

  return (
    <>
      <aside className="sticky top-4 hidden h-[calc(100dvh-2rem)] flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:flex">
        <Link
          className="mb-4 rounded-lg px-3 py-2 text-xl font-black tracking-normal text-slate-950"
          href={buildWordListHref({ language: activeLanguage, path: "/words" })}
        >
          단어장
        </Link>
        <nav className="grid gap-1" aria-label="주요 메뉴">
          {items.map((item) => (
            <Link
              aria-current={item.isActive ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-bold ${
                item.isActive
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
              href={item.href}
              key={item.label}
            >
              <item.icon aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto grid gap-2">
          <Link
            className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-600"
            href="/settings"
          >
            <span aria-hidden="true">{activeLanguageOption.flag}</span>
            {activeLanguageOption.label}
          </Link>
          <Link
            className="min-h-10 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600"
            href="/settings"
          >
            설정
          </Link>
          {session ? (
            <button
              className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-bold text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSigningOut}
              onClick={handleSignOut}
              type="button"
            >
              {isSigningOut ? "나가는 중" : "로그아웃"}
            </button>
          ) : null}
        </div>
      </aside>

      <nav
        aria-label="주요 메뉴"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {items.map((item) => (
            <Link
              aria-current={item.isActive ? "page" : undefined}
              className={`grid min-h-12 place-items-center rounded-lg px-1 text-[11px] font-bold ${
                item.isActive
                  ? "bg-slate-950 text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
              href={item.href}
              key={item.label}
            >
              <item.icon aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
