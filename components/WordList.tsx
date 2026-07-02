"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { NotebookShelf } from "@/components/notebooks/NotebookShelf";
import { WordCardList } from "@/components/words/WordCardList";
import { WordListEmptyState } from "@/components/words/WordListEmptyState";
import { WordListErrorState } from "@/components/words/WordListErrorState";
import { WordListNoResultsState } from "@/components/words/WordListNoResultsState";
import { WordListToolbar } from "@/components/words/WordListToolbar";
import type { ViewMode, WordFilter } from "@/components/words/types";
import { applyWordListFilter, getSessionLanguages } from "@/components/words/word-list-utils";
import { buildWordListHref } from "@/components/words/word-list-links";
import { useWordListQuery } from "@/components/words/useWordListQuery";
import { DEFAULT_LANGUAGE, getLanguageOption } from "@/lib/languages";
import { useSession } from "@/lib/use-session";
import {
  getWordSaveNoticeMessage,
  popWordSaveNotice,
} from "@/lib/word-save-notice";
import type { Language } from "@/types/language";
import type { WordStatus } from "@/types/word";

type WordListProps = {
  highlightedWordId?: string;
  selectedNotebookId?: string;
  selectedLanguage?: Language;
};

/**
 * 단어장 메인 목록 화면을 조립합니다.
 *
 * @param props - 단어 목록 화면에 필요한 URL 기반 선택값입니다.
 * @param props.highlightedWordId - 저장 직후 목록 상단에 보강해서 보여줄 단어 ID입니다.
 * @param props.selectedNotebookId - URL query에서 선택된 노트입니다.
 * @param props.selectedLanguage - URL query에서 선택된 언어입니다.
 * @returns 언어/필터 툴바, 상태별 화면, 단어 카드 목록을 렌더링합니다.
 */
export function WordList({
  highlightedWordId,
  selectedNotebookId,
  selectedLanguage,
}: WordListProps) {
  const router = useRouter();
  const session = useSession() ?? null;
  const enabledLanguages = useMemo(() => getSessionLanguages(session), [session]);
  const fallbackLanguage = enabledLanguages[0] ?? session?.defaultLanguage ?? DEFAULT_LANGUAGE;
  const selectedEnabledLanguage =
    selectedLanguage && enabledLanguages.includes(selectedLanguage)
      ? selectedLanguage
      : undefined;
  const [optimisticLanguage, setOptimisticLanguage] = useState<Language | null>(null);
  const optimisticEnabledLanguage =
    optimisticLanguage && enabledLanguages.includes(optimisticLanguage)
      ? optimisticLanguage
      : undefined;
  const activeLanguage =
    selectedEnabledLanguage ?? optimisticEnabledLanguage ?? fallbackLanguage;
  const activeLanguageOption = getLanguageOption(activeLanguage);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [activeFilter, setActiveFilter] = useState<WordFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [revealedWordIds, setRevealedWordIds] = useState<Set<string>>(new Set());
  const [updatingWordIds, setUpdatingWordIds] = useState<Set<string>>(new Set());
  const isFullLookupMode =
    activeFilter !== "all" ||
    Boolean(searchQuery.trim()) ||
    Boolean(selectedNotebookId);
  const {
    clearStudyStatusError,
    errorMessage,
    hasMore,
    isContentLoading,
    isLoadingMore,
    loadNextPage,
    refetchWords,
    updateStudyStatus,
    wordCount,
    words,
  } = useWordListQuery({
    activeLanguage,
    highlightedWordId,
    isFullLookupMode,
    session,
  });
  const filteredWords = applyWordListFilter(
    words,
    activeFilter,
    searchQuery,
    selectedNotebookId,
  );
  const wordCountLabel =
    wordCount === null ? "저장된 단어 확인 중" : `저장된 단어 ${wordCount}개`;
  const loadingOverlay = (
    <LoadingOverlay
      message={`${activeLanguageOption.label} 단어를 불러오는 중`}
      show={isContentLoading}
    />
  );
  const toolbar = (
    <WordListToolbar
      activeFilter={activeFilter}
      activeLanguage={activeLanguage}
      activeLanguageOption={activeLanguageOption}
      enabledLanguages={enabledLanguages}
      notebookId={selectedNotebookId}
      onFilterChange={setActiveFilter}
      onLanguageChange={handleLanguageChange}
      onSearchQueryChange={setSearchQuery}
      onViewModeChange={handleViewModeChange}
      searchQuery={searchQuery}
      viewMode={viewMode}
      wordCountLabel={wordCountLabel}
    />
  );
  const notebookShelf = (
    <NotebookShelf
      activeLanguage={activeLanguage}
      onNotebookChange={handleNotebookChange}
      selectedNotebookId={selectedNotebookId}
      session={session}
    />
  );

  useEffect(() => {
    if (session && !session.defaultLanguage) {
      router.replace("/onboarding/language");
    }
  }, [router, session]);

  useEffect(() => {
    const notice = popWordSaveNotice(activeLanguage);

    if (!notice) {
      return;
    }

    toast.success(getWordSaveNoticeMessage(notice));
  }, [activeLanguage]);

  function handleViewModeChange(nextViewMode: ViewMode) {
    setViewMode(nextViewMode);
    setRevealedWordIds(new Set());
  }

  function toggleWordReveal(wordId: string) {
    if (viewMode === "all") {
      return;
    }

    setRevealedWordIds((currentWordIds) => {
      const nextWordIds = new Set(currentWordIds);

      if (nextWordIds.has(wordId)) {
        nextWordIds.delete(wordId);
      } else {
        nextWordIds.add(wordId);
      }

      return nextWordIds;
    });
  }

  function resetListConditions() {
    setActiveFilter("all");
    setSearchQuery("");
  }

  function handleLanguageChange(nextLanguage: Language) {
    if (nextLanguage === activeLanguage) {
      return;
    }

    setOptimisticLanguage(nextLanguage);
    setActiveFilter("all");
    setSearchQuery("");
    clearStudyStatusError();
    setRevealedWordIds(new Set());
    router.push(`/words?lang=${nextLanguage}`);
  }

  function handleNotebookChange(nextNotebookId?: string) {
    clearStudyStatusError();
    setRevealedWordIds(new Set());
    router.push(
      buildWordListHref({
        language: activeLanguage,
        notebookId: nextNotebookId,
        path: "/words",
      }),
    );
  }

  async function handleStudyStatusChange(wordId: string, status: WordStatus) {
    setUpdatingWordIds((currentWordIds) => new Set(currentWordIds).add(wordId));

    try {
      await updateStudyStatus(wordId, status);
    } finally {
      setUpdatingWordIds((currentWordIds) => {
        const nextWordIds = new Set(currentWordIds);
        nextWordIds.delete(wordId);
        return nextWordIds;
      });
    }
  }

  if (errorMessage) {
    return (
      <>
        {loadingOverlay}
        {toolbar}
        {notebookShelf}
        <WordListErrorState
          errorMessage={errorMessage}
          onRetry={() => {
            clearStudyStatusError();
            void refetchWords();
          }}
        />
      </>
    );
  }

  if (words.length === 0) {
    return (
      <>
        {loadingOverlay}
        <WordListEmptyState
          activeLanguage={activeLanguage}
          activeLanguageOption={activeLanguageOption}
          enabledLanguages={enabledLanguages}
          notebookId={selectedNotebookId}
          notebookShelf={notebookShelf}
          onLanguageChange={handleLanguageChange}
          wordCountLabel={wordCountLabel}
        />
      </>
    );
  }

  if (filteredWords.length === 0) {
    return (
      <>
        {loadingOverlay}
        {toolbar}
        {notebookShelf}
        <WordListNoResultsState
          activeLanguage={activeLanguage}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          notebookId={selectedNotebookId}
          onLoadMore={() => void loadNextPage()}
          onReset={resetListConditions}
        />
      </>
    );
  }

  return (
    <>
      {loadingOverlay}
      {toolbar}
      {notebookShelf}
      <WordCardList
        activeLanguage={activeLanguage}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        notebookId={selectedNotebookId}
        onLoadMore={() => void loadNextPage()}
        onStudyStatusChange={(wordId, status) =>
          void handleStudyStatusChange(wordId, status)
        }
        onToggleReveal={toggleWordReveal}
        revealedWordIds={revealedWordIds}
        updatingWordIds={updatingWordIds}
        viewMode={viewMode}
        words={filteredWords}
      />
    </>
  );
}
