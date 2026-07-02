"use client";

import Link from "next/link";
import { WordCard } from "@/components/WordCard";
import { buildWordListHref } from "@/components/words/word-list-links";
import type { ViewMode } from "@/components/words/types";
import type { Language } from "@/types/language";
import type { Word, WordStatus } from "@/types/word";

type WordCardListProps = {
  activeLanguage: Language;
  hasMore: boolean;
  isLoadingMore: boolean;
  notebookId?: string;
  onLoadMore: () => void;
  onStudyStatusChange: (wordId: string, status: WordStatus) => void;
  onToggleReveal: (wordId: string) => void;
  revealedWordIds: Set<string>;
  updatingWordIds: Set<string>;
  viewMode: ViewMode;
  words: Word[];
};

/**
 * 필터링된 단어 카드 목록과 더 보기, 플로팅 추가 버튼을 렌더링합니다.
 *
 * @param props - 표시할 단어 목록과 카드 액션 상태입니다.
 * @returns 단어 카드 목록, 페이지네이션 버튼, 단어 추가 버튼을 렌더링합니다.
 */
export function WordCardList({
  activeLanguage,
  hasMore,
  isLoadingMore,
  notebookId,
  onLoadMore,
  onStudyStatusChange,
  onToggleReveal,
  revealedWordIds,
  updatingWordIds,
  viewMode,
  words,
}: WordCardListProps) {
  return (
    <>
      <section className="grid gap-2 py-3">
        {words.map((word) => (
          <WordCard
            isRevealed={revealedWordIds.has(word.id)}
            isUpdatingStudyStatus={updatingWordIds.has(word.id)}
            key={word.id}
            maskedField={viewMode === "all" ? undefined : viewMode}
            onStudyStatusChange={(status) => onStudyStatusChange(word.id, status)}
            onToggleReveal={() => onToggleReveal(word.id)}
            word={word}
          />
        ))}
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
      ) : (
        <div className="pb-24" />
      )}
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
