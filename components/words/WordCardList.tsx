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
  notebookId?: string;
  onLoadMore: () => void;
  onToggleWordFlag: (word: Word) => void;
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
  flaggingWordIds,
  hasMore,
  isLoadingMore,
  notebookId,
  onLoadMore,
  onToggleWordFlag,
  viewMode,
  words,
}: WordCardListProps) {
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
      <section className="grid gap-2 py-3">
        <div className="grid gap-2">
          {words.map((word) => (
            <WordCard
              activeLanguage={activeLanguage}
              isFlagHintVisible={flagHintWordId === word.id}
              isFlagUpdating={flaggingWordIds.has(word.id)}
              key={word.id}
              maskedField={maskedField}
              onDismissFlagHint={dismissFlagHint}
              onToggleFlag={() => handleToggleWordFlag(word)}
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
