"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { WordCardList } from "@/components/words/WordCardList";
import { WordListEmptyState } from "@/components/words/WordListEmptyState";
import { WordListErrorState } from "@/components/words/WordListErrorState";
import { WordListHeader } from "@/components/words/WordListHeader";
import { WordListNoResultsState } from "@/components/words/WordListNoResultsState";
import type { ViewMode } from "@/components/words/types";
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
import type { Word } from "@/types/word";

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
 * @returns 목록 헤더, 상태별 화면, 단어 카드 목록을 렌더링합니다.
 */
export function WordList({
  highlightedWordId,
  selectedNotebookId,
  selectedLanguage,
}: WordListProps) {
  const router = useRouter();
  const session = useSession() ?? null;
  const enabledLanguages = useMemo(() => getSessionLanguages(session), [session]);
  const visibleLanguages = useMemo(
    () =>
      selectedLanguage && !enabledLanguages.includes(selectedLanguage)
        ? [...enabledLanguages, selectedLanguage]
        : enabledLanguages,
    [enabledLanguages, selectedLanguage],
  );
  const fallbackLanguage =
    visibleLanguages[0] ?? session?.defaultLanguage ?? DEFAULT_LANGUAGE;
  const selectedVisibleLanguage =
    selectedLanguage && visibleLanguages.includes(selectedLanguage)
      ? selectedLanguage
      : undefined;
  const [optimisticLanguage, setOptimisticLanguage] = useState<Language | null>(null);
  const optimisticEnabledLanguage =
    optimisticLanguage && visibleLanguages.includes(optimisticLanguage)
      ? optimisticLanguage
      : undefined;
  const activeLanguage =
    selectedVisibleLanguage ?? optimisticEnabledLanguage ?? fallbackLanguage;
  const activeLanguageOption = getLanguageOption(activeLanguage);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isDeletingSelectedWords, setIsDeletingSelectedWords] = useState(false);
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [flaggingWordIds, setFlaggingWordIds] = useState<Set<string>>(new Set());
  const isFullLookupMode =
    Boolean(searchQuery.trim()) ||
    Boolean(selectedNotebookId);
  const {
    clearStudyStatusError,
    deleteSelectedWords,
    errorMessage,
    hasMore,
    isContentLoading,
    isLoadingMore,
    loadNextPage,
    refetchWords,
    toggleWordFlagStatus,
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
    searchQuery,
    selectedNotebookId,
  );
  const wordCountLabel =
    wordCount === null ? "저장된 단어 확인 중" : `저장된 단어 ${wordCount}개`;
  const compactWordCountLabel =
    wordCount === null ? "확인 중" : `${wordCount}개`;
  const activeNotebookCountLabel = selectedNotebookId
    ? `${filteredWords.length}개`
    : compactWordCountLabel;
  const visibleCountLabel =
    isFullLookupMode || filteredWords.length !== words.length
      ? `표시 ${filteredWords.length}개`
      : wordCountLabel;
  const loadingOverlay = (
    <LoadingOverlay
      message={
        isDeletingSelectedWords
          ? "선택한 단어를 삭제하는 중"
          : `${activeLanguageOption.label} 단어를 불러오는 중`
      }
      show={isContentLoading || isDeletingSelectedWords}
    />
  );
  const header = (
    <WordListHeader
      activeLanguage={activeLanguage}
      activeNotebookCountLabel={activeNotebookCountLabel}
      enabledLanguages={visibleLanguages}
      onLanguageChange={handleLanguageChange}
      onNotebookChange={handleNotebookChange}
      onSearchQueryChange={handleSearchQueryChange}
      onViewModeChange={handleViewModeChange}
      searchQuery={searchQuery}
      selectedNotebookId={selectedNotebookId}
      session={session}
      totalWordCountLabel={compactWordCountLabel}
      viewMode={viewMode}
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
  }

  function handleSearchQueryChange(nextSearchQuery: string) {
    setSearchQuery(nextSearchQuery);
    clearSelection();
  }

  function resetListConditions() {
    setSearchQuery("");
    clearSelection();
  }

  function handleLanguageChange(nextLanguage: Language) {
    if (nextLanguage === activeLanguage) {
      return;
    }

    setOptimisticLanguage(nextLanguage);
    setSearchQuery("");
    clearStudyStatusError();
    clearSelection();
    router.push(`/words?lang=${nextLanguage}`);
  }

  function handleNotebookChange(nextNotebookId?: string) {
    clearStudyStatusError();
    clearSelection();
    router.push(
      buildWordListHref({
        language: activeLanguage,
        notebookId: nextNotebookId,
        path: "/words",
      }),
    );
  }

  function clearSelection() {
    setIsSelectionMode(false);
    setSelectedWordIds(new Set());
  }

  function toggleWordSelection(wordId: string) {
    setSelectedWordIds((currentWordIds) => {
      const nextWordIds = new Set(currentWordIds);

      if (nextWordIds.has(wordId)) {
        nextWordIds.delete(wordId);
      } else {
        nextWordIds.add(wordId);
      }

      return nextWordIds;
    });
  }

  function selectVisibleWords() {
    setSelectedWordIds(new Set(filteredWords.map((word) => word.id)));
  }

  async function handleDeleteSelectedWords() {
    const wordIds = [...selectedWordIds];

    if (wordIds.length === 0) {
      return;
    }

    const shouldDelete = confirm(
      `선택한 단어 ${wordIds.length}개를 삭제할까요?\n삭제한 단어는 되돌릴 수 없습니다.`,
    );

    if (!shouldDelete) {
      return;
    }

    setIsDeletingSelectedWords(true);

    try {
      await deleteSelectedWords(wordIds);
      clearSelection();
      toast.success(`선택한 단어 ${wordIds.length}개를 삭제했습니다.`);
    } catch {
      // 사용자용 에러 메시지는 useWordListQuery에서 화면에 표시합니다.
    } finally {
      setIsDeletingSelectedWords(false);
    }
  }

  async function handleToggleWordFlag(word: Word) {
    setFlaggingWordIds((currentWordIds) => new Set(currentWordIds).add(word.id));

    try {
      await toggleWordFlagStatus(word.id, word.flaggedAt);
    } catch {
      // 사용자용 에러 메시지는 useWordListQuery에서 화면에 표시합니다.
    } finally {
      setFlaggingWordIds((currentWordIds) => {
        const nextWordIds = new Set(currentWordIds);
        nextWordIds.delete(word.id);
        return nextWordIds;
      });
    }
  }

  if (errorMessage) {
    return (
      <>
        {loadingOverlay}
        {header}
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
        {header}
        <WordListEmptyState
          activeLanguage={activeLanguage}
          activeLanguageOption={activeLanguageOption}
          notebookId={selectedNotebookId}
        />
      </>
    );
  }

  if (filteredWords.length === 0) {
    return (
      <>
        {loadingOverlay}
        {header}
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
      {header}
      <WordCardList
        activeLanguage={activeLanguage}
        hasMore={hasMore}
        isDeletingSelectedWords={isDeletingSelectedWords}
        isLoadingMore={isLoadingMore}
        isSelectionMode={isSelectionMode}
        notebookId={selectedNotebookId}
        onClearSelection={clearSelection}
        onDeleteSelectedWords={() => void handleDeleteSelectedWords()}
        onLoadMore={() => void loadNextPage()}
        onSelectVisibleWords={selectVisibleWords}
        onSelectionModeChange={setIsSelectionMode}
        onToggleWordFlag={(word) => void handleToggleWordFlag(word)}
        onToggleWordSelection={toggleWordSelection}
        flaggingWordIds={flaggingWordIds}
        selectedWordIds={selectedWordIds}
        viewMode={viewMode}
        visibleCountLabel={visibleCountLabel}
        words={filteredWords}
      />
    </>
  );
}
