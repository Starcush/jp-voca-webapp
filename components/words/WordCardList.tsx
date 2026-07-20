"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { WordCard } from "@/components/WordCard";
import { buildWordListHref } from "@/components/words/word-list-links";
import type { ViewMode } from "@/components/words/types";
import type { Language } from "@/types/language";
import type { Word } from "@/types/word";

const WORD_LIST_FLAG_HINT_KEY = "wordlist-flag-hint-seen";

type WordCardListProps = {
  activeLanguage: Language;
  flaggingWordIds: Set<string>;
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
  onToggleWordFlag: (word: Word) => void;
  onToggleWordSelection: (wordId: string) => void;
  selectedWordIds: Set<string>;
  viewMode: ViewMode;
  visibleCountLabel: string;
  words: Word[];
};

/**
 * 필터링된 단어 카드 목록과 더 보기, 플로팅 추가 버튼을 렌더링합니다.
 *
 * @param props - 표시할 단어 목록과 카드 액션 상태입니다.
 * @returns 표시 개수, 단어 카드 목록, 페이지네이션 버튼, 단어 추가 버튼을 렌더링합니다.
 */
export function WordCardList({
  activeLanguage,
  flaggingWordIds,
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
  onToggleWordFlag,
  onToggleWordSelection,
  selectedWordIds,
  viewMode,
  visibleCountLabel,
  words,
}: WordCardListProps) {
  const selectedCount = selectedWordIds.size;
  const [flagHintWordId, setFlagHintWordId] = useState<string | null>(null);
  const maskedField =
    viewMode === "all" ? undefined : viewMode === "kanji" ? "meaning" : "kanji";

  function dismissFlagHint() {
    localStorage.setItem(WORD_LIST_FLAG_HINT_KEY, "true");
    setFlagHintWordId(null);
  }

  function handleToggleWordFlag(word: Word) {
    if (!localStorage.getItem(WORD_LIST_FLAG_HINT_KEY)) {
      setFlagHintWordId(word.id);
    }

    onToggleWordFlag(word);
  }

  return (
    <>
      <section className="grid gap-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-brand-muted">
            {isSelectionMode ? `선택 ${selectedCount}개` : visibleCountLabel}
          </p>
          {isSelectionMode ? (
            <div className="flex items-center gap-1.5">
              <button
                className="min-h-9 rounded-md border border-brand-border bg-white px-2 text-xs font-bold text-brand-muted"
                onClick={onSelectVisibleWords}
                type="button"
              >
                전체 선택
              </button>
              <button
                className="min-h-9 rounded-md bg-status-negative px-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isDeletingSelectedWords || selectedCount === 0}
                onClick={onDeleteSelectedWords}
                type="button"
              >
                삭제
              </button>
              <button
                className="min-h-9 rounded-md border border-brand-border bg-white px-2 text-xs font-bold text-brand-muted"
                onClick={onClearSelection}
                type="button"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              className="min-h-9 rounded-md border border-brand-border bg-white px-3 text-xs font-bold text-brand-muted"
              onClick={() => onSelectionModeChange(true)}
              type="button"
            >
              선택
            </button>
          )}
        </div>
        <div className="grid gap-2">
          {words.map((word) => (
            <WordCard
              activeLanguage={activeLanguage}
              isFlagHintVisible={flagHintWordId === word.id}
              isFlagUpdating={flaggingWordIds.has(word.id)}
              isSelected={selectedWordIds.has(word.id)}
              key={word.id}
              maskedField={maskedField}
              onDismissFlagHint={dismissFlagHint}
              onToggleFlag={() => handleToggleWordFlag(word)}
              onToggleSelect={() => onToggleWordSelection(word.id)}
              selectionMode={isSelectionMode}
              word={word}
            />
          ))}
        </div>
      </section>
      {hasMore ? (
        <div className="pb-24">
          <button
            className="min-h-12 w-full rounded-lg border border-brand-border bg-white text-base font-bold text-brand-text shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
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
        className="fixed bottom-20 right-5 z-20 grid h-12 w-12 place-items-center rounded-full bg-brand-green text-white shadow-lg shadow-orange-900/20 md:bottom-6"
        href={buildWordListHref({
          language: activeLanguage,
          notebookId,
          path: "/words/new",
        })}
      >
        <Plus aria-hidden="true" className="h-6 w-6" strokeWidth={2.4} />
      </Link>
    </>
  );
}
