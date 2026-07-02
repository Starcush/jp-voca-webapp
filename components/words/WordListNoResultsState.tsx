"use client";

import Link from "next/link";
import { buildWordListHref } from "@/components/words/word-list-links";
import type { Language } from "@/types/language";

type WordListNoResultsStateProps = {
  activeLanguage: Language;
  hasMore: boolean;
  isLoadingMore: boolean;
  notebookId?: string;
  onLoadMore: () => void;
  onReset: () => void;
};

/**
 * 검색어 또는 필터에 맞는 단어가 없을 때 조건 초기화와 더 보기를 제공합니다.
 *
 * @param props - 조건 초기화, 더 보기, 현재 언어 정보입니다.
 * @returns 검색/필터 결과 없음 UI와 플로팅 추가 버튼을 렌더링합니다.
 */
export function WordListNoResultsState({
  activeLanguage,
  hasMore,
  isLoadingMore,
  notebookId,
  onLoadMore,
  onReset,
}: WordListNoResultsStateProps) {
  return (
    <>
      <section className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-lg font-bold text-slate-950">조건에 맞는 단어가 없습니다</p>
        <p className="text-sm leading-6 text-slate-500">
          검색어를 지우거나 다른 필터를 선택해보세요.
        </p>
        <button
          className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"
          onClick={onReset}
          type="button"
        >
          조건 초기화
        </button>
      </section>
      {hasMore ? (
        <div className="pb-24">
          <button
            className="min-h-12 w-full rounded-lg border border-slate-200 bg-white text-base font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoadingMore}
            onClick={onLoadMore}
            type="button"
          >
            {isLoadingMore ? "불러오는 중" : "더 보기"}
          </button>
        </div>
      ) : null}
      <Link
        aria-label="단어 추가"
        className="fixed bottom-5 right-5 grid h-14 w-14 place-items-center rounded-full bg-slate-950 text-3xl font-light leading-none text-white shadow-lg"
        href={buildWordListHref({
          language: activeLanguage,
          notebookId,
          path: "/words/new",
        })}
      >
        +
      </Link>
    </>
  );
}
