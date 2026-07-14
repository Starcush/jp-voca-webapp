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
  isDeletingSelectedWords: boolean;
  isSelectionMode: boolean;
  notebookId?: string;
  onClearSelection: () => void;
  onDeleteSelectedWords: () => void;
  onLoadMore: () => void;
  onSelectVisibleWords: () => void;
  onSelectionModeChange: (isSelectionMode: boolean) => void;
  onStudyStatusChange: (wordId: string, status: WordStatus) => void;
  onToggleReveal: (wordId: string) => void;
  onToggleWordSelection: (wordId: string) => void;
  revealedWordIds: Set<string>;
  selectedWordIds: Set<string>;
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
  isDeletingSelectedWords,
  isSelectionMode,
  notebookId,
  onClearSelection,
  onDeleteSelectedWords,
  onLoadMore,
  onSelectVisibleWords,
  onSelectionModeChange,
  onStudyStatusChange,
  onToggleReveal,
  onToggleWordSelection,
  revealedWordIds,
  selectedWordIds,
  updatingWordIds,
  viewMode,
  words,
}: WordCardListProps) {
  const selectedCount = selectedWordIds.size;

  return (
    <>
      <section className="grid gap-2 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-slate-500">
            {isSelectionMode ? `선택 ${selectedCount}개` : "단어 목록"}
          </p>
          {isSelectionMode ? (
            <div className="flex items-center gap-1.5">
              <button
                className="min-h-9 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600"
                onClick={onSelectVisibleWords}
                type="button"
              >
                전체 선택
              </button>
              <button
                className="min-h-9 rounded-md bg-red-600 px-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isDeletingSelectedWords || selectedCount === 0}
                onClick={onDeleteSelectedWords}
                type="button"
              >
                삭제
              </button>
              <button
                className="min-h-9 rounded-md border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600"
                onClick={onClearSelection}
                type="button"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              className="min-h-9 rounded-md border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600"
              onClick={() => onSelectionModeChange(true)}
              type="button"
            >
              선택
            </button>
          )}
        </div>
        {words.map((word) => (
          <WordCard
            isRevealed={revealedWordIds.has(word.id)}
            isSelected={selectedWordIds.has(word.id)}
            isUpdatingStudyStatus={updatingWordIds.has(word.id)}
            key={word.id}
            maskedField={viewMode === "all" ? undefined : viewMode}
            onStudyStatusChange={(status) => onStudyStatusChange(word.id, status)}
            onToggleSelect={() => onToggleWordSelection(word.id)}
            onToggleReveal={() => onToggleReveal(word.id)}
            selectionMode={isSelectionMode}
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
