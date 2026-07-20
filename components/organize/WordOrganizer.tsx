"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { UNFILED_NOTEBOOK_ID } from "@/components/notebooks/notebook-constants";
import { useWordOrganizerQuery } from "@/components/organize/useWordOrganizerQuery";
import type { AppSession } from "@/lib/session";
import { getWordReading, getWordTerm } from "@/lib/words";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";
import type { Notebook } from "@/types/notebook";
import type { Word } from "@/types/word";

const ALL_NOTEBOOKS_ID = "all";

type WordOrganizerMode = "move" | "delete";

type ConfirmationState =
  | {
      mode: "move";
      targetNotebookLabel: string;
      wordCount: number;
    }
  | {
      mode: "delete";
      wordCount: number;
    };

type WordOrganizerProps = {
  language: Language;
};

function getPersistedNotebookId(notebookId: string) {
  return notebookId === UNFILED_NOTEBOOK_ID ? undefined : notebookId;
}

function getNotebookLabel(notebooks: Notebook[], notebookId?: string) {
  if (!notebookId) {
    return "미분류";
  }

  return notebooks.find((notebook) => notebook.id === notebookId)?.title ?? "알 수 없음";
}

function getSourceWords(words: Word[], sourceNotebookId: string) {
  if (sourceNotebookId === ALL_NOTEBOOKS_ID) {
    return words;
  }

  if (sourceNotebookId === UNFILED_NOTEBOOK_ID) {
    return words.filter((word) => !word.notebookId);
  }

  return words.filter((word) => word.notebookId === sourceNotebookId);
}

function matchesSearch(word: Word, searchQuery: string) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [getWordTerm(word), getWordReading(word), word.meaning]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(normalizedQuery));
}

function getVisibleWords(
  words: Word[],
  sourceNotebookId: string,
  searchQuery: string,
) {
  return getSourceWords(words, sourceNotebookId).filter((word) =>
    matchesSearch(word, searchQuery),
  );
}

function isSameNotebookMove(sourceNotebookId: string, targetNotebookId: string) {
  return (
    Boolean(targetNotebookId) &&
    sourceNotebookId !== ALL_NOTEBOOKS_ID &&
    getPersistedNotebookId(sourceNotebookId) ===
      getPersistedNotebookId(targetNotebookId)
  );
}

function toggleSelectedWord(wordIds: Set<string>, wordId: string) {
  const nextWordIds = new Set(wordIds);

  if (nextWordIds.has(wordId)) {
    nextWordIds.delete(wordId);
  } else {
    nextWordIds.add(wordId);
  }

  return nextWordIds;
}

function getModeLabel(mode: WordOrganizerMode) {
  return mode === "move" ? "이동" : "삭제";
}

/**
 * 기존 단어를 노트 간에 옮기거나 여러 단어를 삭제하는 정리 화면을 렌더링합니다.
 *
 * @param props - 정리할 단어 언어입니다.
 * @param props.language - 현재 정리 화면의 언어입니다.
 * @returns 출발 노트 선택, 이동/삭제 탭, 단어 체크 리스트, 하단 액션 바를 렌더링합니다.
 */
export function WordOrganizer({ language }: WordOrganizerProps) {
  const session = useSession() ?? null;
  const [mode, setMode] = useState<WordOrganizerMode>("move");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceNotebookId, setSourceNotebookId] = useState(ALL_NOTEBOOKS_ID);
  const [targetNotebookId, setTargetNotebookId] = useState("");
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [confirmationState, setConfirmationState] =
    useState<ConfirmationState | null>(null);
  const {
    deleteWords,
    errorMessage,
    isDeletingWords,
    isLoading,
    isMovingWords,
    moveWords,
    notebooks,
    refetch,
    words,
  } = useWordOrganizerQuery({
    language,
    session: session satisfies AppSession | null,
  });
  const visibleWords = useMemo(
    () => getVisibleWords(words, sourceNotebookId, searchQuery),
    [searchQuery, sourceNotebookId, words],
  );
  const selectedCount = selectedWordIds.size;
  const isSameTarget = isSameNotebookMove(sourceNotebookId, targetNotebookId);
  const canMove =
    selectedCount > 0 &&
    Boolean(targetNotebookId) &&
    !isSameTarget &&
    !isMovingWords &&
    !isDeletingWords;
  const canDelete = selectedCount > 0 && !isDeletingWords && !isMovingWords;
  const selectedCountLabel = `선택 ${selectedCount}개`;
  const isProcessing = isMovingWords || isDeletingWords;

  function clearSelection() {
    setSelectedWordIds(new Set());
  }

  function handleModeChange(nextMode: WordOrganizerMode) {
    setMode(nextMode);
    clearSelection();
  }

  function handleSourceChange(nextSourceNotebookId: string) {
    setSourceNotebookId(nextSourceNotebookId);
    if (isSameNotebookMove(nextSourceNotebookId, targetNotebookId)) {
      setTargetNotebookId("");
    }
    clearSelection();
  }

  function handleSearchChange(nextSearchQuery: string) {
    setSearchQuery(nextSearchQuery);
    clearSelection();
  }

  function handleSearchClose() {
    setIsSearchOpen(false);
    handleSearchChange("");
  }

  function handleSelectAllVisible() {
    if (
      visibleWords.length > 0 &&
      selectedWordIds.size === visibleWords.length
    ) {
      clearSelection();
      return;
    }

    setSelectedWordIds(new Set(visibleWords.map((word) => word.id)));
  }

  function requestMoveWords() {
    if (!canMove) {
      return;
    }

    setConfirmationState({
      mode: "move",
      targetNotebookLabel: getNotebookLabel(
        notebooks,
        getPersistedNotebookId(targetNotebookId),
      ),
      wordCount: selectedCount,
    });
  }

  function requestDeleteWords() {
    if (!canDelete) {
      return;
    }

    setConfirmationState({
      mode: "delete",
      wordCount: selectedCount,
    });
  }

  async function confirmPendingAction() {
    if (!confirmationState) {
      return;
    }

    const wordIds = [...selectedWordIds];

    if (confirmationState.mode === "move") {
      await moveWords({
        notebookId: getPersistedNotebookId(targetNotebookId),
        wordIds,
      });
    } else {
      await deleteWords(wordIds);
    }

    clearSelection();
    setConfirmationState(null);
  }

  if (isLoading) {
    return (
      <section className="flex flex-1 items-center justify-center">
        <p className="text-sm font-semibold text-brand-muted">
          정리할 단어를 불러오는 중
        </p>
      </section>
    );
  }

  return (
    <section className="-mt-2 grid gap-4 pb-28">
      <div className="sticky top-[4.5rem] z-10 -mx-4 bg-brand-background/95 px-4 pb-2 pt-1 backdrop-blur md:static md:mx-0 md:bg-transparent md:p-0">
        <div className="grid gap-2">
          <div className="grid grid-cols-2 rounded-full bg-brand-background p-1">
            {(["move", "delete"] as const).map((modeOption) => {
              const isActive = mode === modeOption;

              return (
                <button
                  aria-pressed={isActive}
                  className={`min-h-8 rounded-full px-2 text-xs font-bold ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-brand-muted"
                  }`}
                  key={modeOption}
                  onClick={() => handleModeChange(modeOption)}
                  type="button"
                >
                  {getModeLabel(modeOption)}
                </button>
              );
            })}
          </div>

          {errorMessage ? (
            <div className="grid gap-2 rounded-lg border border-status-negative-border bg-status-negative-bg px-4 py-3">
              <p className="text-sm font-semibold text-status-negative">
                {errorMessage}
              </p>
              <button
                className="justify-self-start text-sm font-bold text-status-negative underline"
                onClick={() => void refetch()}
                type="button"
              >
                다시 불러오기
              </button>
            </div>
          ) : null}

          <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2">
            <label className="min-w-0">
              <span className="sr-only">노트 선택</span>
              <select
                className="min-h-10 w-full min-w-0 truncate rounded-lg border-brand-border bg-white text-sm font-bold text-brand-text"
                onChange={(event) => handleSourceChange(event.target.value)}
              value={sourceNotebookId}
            >
              <option value={ALL_NOTEBOOKS_ID}>전체 노트</option>
                {notebooks.map((notebook) => (
                  <option key={notebook.id} value={notebook.id}>
                    {notebook.title}
                  </option>
                ))}
                <option value={UNFILED_NOTEBOOK_ID}>미분류</option>
              </select>
            </label>
            <p className="shrink-0 text-xs font-bold text-brand-muted">
              {selectedCountLabel}
            </p>
            <button
              aria-label={isSearchOpen ? "검색 닫기" : "단어 검색"}
              className={`grid h-10 w-10 place-items-center rounded-lg border text-brand-muted ${
                isSearchOpen || searchQuery.trim()
                  ? "border-primary text-primary"
                  : "border-brand-border bg-white"
              }`}
              onClick={() =>
                isSearchOpen ? handleSearchClose() : setIsSearchOpen(true)
              }
              type="button"
            >
              {isSearchOpen ? (
                <X aria-hidden="true" className="h-4 w-4" strokeWidth={2.4} />
              ) : (
                <Search
                  aria-hidden="true"
                  className="h-4 w-4"
                  strokeWidth={2.4}
                />
              )}
            </button>
          </div>

          {isSearchOpen ? (
            <label className="min-w-0">
              <span className="sr-only">단어 검색</span>
              <input
                autoFocus
                className="min-h-10 w-full min-w-0 rounded-lg border-brand-border bg-white text-sm font-medium"
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="단어, 읽기, 뜻 검색"
                value={searchQuery}
              />
            </label>
          ) : null}

          {isSameTarget && mode === "move" ? (
            <p className="rounded-lg border border-primary-border bg-primary-tint px-3 py-2 text-sm font-semibold text-primary-text">
              출발 노트와 다른 도착 노트를 선택해주세요.
            </p>
          ) : null}
        </div>
      </div>

      <section className="-mx-4 border-y border-brand-border bg-white">
        <label className="grid min-h-[52px] cursor-pointer grid-cols-[44px_minmax(0,1fr)] items-center border-b border-brand-border px-4">
          <span className="grid place-items-center">
            <input
              checked={
                visibleWords.length > 0 &&
                selectedWordIds.size === visibleWords.length
              }
              className="h-5 w-5 rounded border-brand-border-strong text-primary focus:ring-primary"
              disabled={visibleWords.length === 0}
              onChange={handleSelectAllVisible}
              type="checkbox"
            />
          </span>
          <span className="text-sm font-bold text-brand-text">
            표시 {visibleWords.length}개 전체 선택
          </span>
        </label>

        {visibleWords.length > 0 ? (
          <div>
            {visibleWords.map((word) => (
              <WordOrganizerRow
                isSelected={selectedWordIds.has(word.id)}
                key={word.id}
                notebookLabel={getNotebookLabel(notebooks, word.notebookId)}
                onToggle={() =>
                  setSelectedWordIds((currentWordIds) =>
                    toggleSelectedWord(currentWordIds, word.id),
                  )
                }
                language={language}
                showNotebook={sourceNotebookId === ALL_NOTEBOOKS_ID}
                word={word}
              />
            ))}
          </div>
        ) : (
          <div className="grid min-h-40 place-items-center px-4 py-10 text-center">
            <p className="text-sm font-semibold text-brand-muted">
              {searchQuery.trim()
                ? "조건에 맞는 단어가 없습니다."
                : "이 노트에 표시할 단어가 없습니다."}
            </p>
          </div>
        )}
      </section>

      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+3.65rem)] z-20 w-full border-t border-brand-border bg-white/95 px-5 py-3 shadow-[0_-8px_24px_rgba(25,25,25,0.08)] backdrop-blur md:sticky md:inset-x-auto md:bottom-4 md:w-auto md:rounded-xl md:border md:px-4">
        {mode === "move" ? (
          <div className="grid grid-cols-[minmax(0,1fr)_72px] gap-2">
            <label className="min-w-0">
              <span className="sr-only">이동할 노트 선택</span>
              <select
                className="min-h-11 w-full min-w-0 truncate rounded-lg border-brand-border bg-white text-sm font-bold text-brand-text"
                onChange={(event) => setTargetNotebookId(event.target.value)}
                value={targetNotebookId}
              >
                <option value="">이동할 노트 선택</option>
                {notebooks.map((notebook) => (
                  <option
                    disabled={sourceNotebookId === notebook.id}
                    key={notebook.id}
                    value={notebook.id}
                  >
                    {notebook.title}
                  </option>
                ))}
                <option
                  disabled={sourceNotebookId === UNFILED_NOTEBOOK_ID}
                  value={UNFILED_NOTEBOOK_ID}
                >
                  미분류
                </option>
              </select>
            </label>
            <button
              className="min-h-11 rounded-lg bg-primary px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-brand-muted-soft"
              disabled={!canMove}
              onClick={requestMoveWords}
              type="button"
            >
              {isMovingWords ? "이동 중" : "이동"}
            </button>
          </div>
        ) : (
          <button
            className="min-h-11 w-full rounded-lg border border-primary bg-white px-4 text-sm font-black text-primary disabled:cursor-not-allowed disabled:border-brand-muted-soft disabled:text-brand-muted-soft"
            disabled={!canDelete}
            onClick={requestDeleteWords}
            type="button"
          >
            {isDeletingWords ? "삭제 중" : "선택한 단어 삭제"}
          </button>
        )}
      </div>

      <ConfirmationDialog
        confirmationState={confirmationState}
        isProcessing={isProcessing}
        onCancel={() => setConfirmationState(null)}
        onConfirm={() => void confirmPendingAction()}
      />
    </section>
  );
}

function WordOrganizerRow({
  isSelected,
  language,
  notebookLabel,
  onToggle,
  showNotebook,
  word,
}: {
  isSelected: boolean;
  language: Language;
  notebookLabel: string;
  onToggle: () => void;
  showNotebook: boolean;
  word: Word;
}) {
  const reading = getWordReading(word);
  const meaning = word.meaning || "-";
  const languageTextClass = language === "ja" ? "font-japanese" : "";

  return (
    <label className="grid min-h-[68px] cursor-pointer grid-cols-[44px_minmax(0,1fr)] items-center border-b border-brand-border px-4 py-2 last:border-b-0 active:bg-brand-background">
      <span className="grid place-items-center">
        <input
          checked={isSelected}
          className="h-5 w-5 rounded border-brand-border-strong text-primary focus:ring-primary"
          onChange={onToggle}
          type="checkbox"
        />
      </span>
      <span className="min-w-0">
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span
            className={`text-[17px] font-semibold leading-6 text-word-kanji ${languageTextClass}`}
          >
            {getWordTerm(word)}
          </span>
          {reading ? (
            <span
              className={`text-xs font-semibold text-primary-text ${languageTextClass}`}
            >
              {reading}
            </span>
          ) : null}
        </span>
        <span className="mt-0.5 line-clamp-2 text-[13px] font-medium leading-5 text-word-meaning">
          {meaning}
          {showNotebook ? (
            <span className="text-brand-muted"> · {notebookLabel}</span>
          ) : null}
        </span>
      </span>
    </label>
  );
}

function ConfirmationDialog({
  confirmationState,
  isProcessing,
  onCancel,
  onConfirm,
}: {
  confirmationState: ConfirmationState | null;
  isProcessing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!confirmationState) {
    return null;
  }

  const isDelete = confirmationState.mode === "delete";
  const title = isDelete
    ? `${confirmationState.wordCount}개 단어를 삭제할까요?`
    : `${confirmationState.wordCount}개 단어를 이동할까요?`;
  const description = isDelete
    ? "삭제한 단어는 되돌릴 수 없습니다. 정말 삭제할지 한 번 더 확인해주세요."
    : `"${confirmationState.targetNotebookLabel}" 노트로 선택한 단어를 이동합니다.`;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-5"
      role="dialog"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
        <div className="grid gap-2">
          <h2 className="text-lg font-black text-brand-text">{title}</h2>
          <p className="text-sm font-medium leading-6 text-brand-muted">
            {description}
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            className="min-h-11 rounded-lg border border-brand-border bg-white px-4 text-sm font-bold text-brand-text disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isProcessing}
            onClick={onCancel}
            type="button"
          >
            취소
          </button>
          <button
            className="min-h-11 rounded-lg bg-primary px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-brand-muted-soft"
            disabled={isProcessing}
            onClick={onConfirm}
            type="button"
          >
            {isProcessing ? "처리 중" : isDelete ? "삭제" : "이동"}
          </button>
        </div>
      </div>
    </div>
  );
}
