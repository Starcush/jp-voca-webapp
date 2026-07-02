"use client";

import { useMemo, useState } from "react";
import { UNFILED_NOTEBOOK_ID } from "@/components/notebooks/notebook-constants";
import { useWordOrganizerQuery } from "@/components/organize/useWordOrganizerQuery";
import { getLanguageOption } from "@/lib/languages";
import type { AppSession } from "@/lib/session";
import { getWordReading, getWordTerm } from "@/lib/words";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";
import type { Notebook } from "@/types/notebook";
import type { Word } from "@/types/word";

const ALL_NOTEBOOKS_ID = "all";

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

function toggleSelectedWord(wordIds: Set<string>, wordId: string) {
  const nextWordIds = new Set(wordIds);

  if (nextWordIds.has(wordId)) {
    nextWordIds.delete(wordId);
  } else {
    nextWordIds.add(wordId);
  }

  return nextWordIds;
}

/**
 * 기존 단어를 노트 간에 옮기는 조밀한 정리 화면을 렌더링합니다.
 *
 * @param props - 정리할 단어 언어입니다.
 * @param props.language - 현재 정리 화면의 언어입니다.
 * @returns 출발/도착 노트 선택, 단어 체크 리스트, 일괄 이동 액션을 렌더링합니다.
 */
export function WordOrganizer({ language }: WordOrganizerProps) {
  const session = useSession() ?? null;
  const languageOption = getLanguageOption(language);
  const [sourceNotebookId, setSourceNotebookId] = useState(UNFILED_NOTEBOOK_ID);
  const [targetNotebookId, setTargetNotebookId] = useState("");
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const {
    errorMessage,
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
    () => getSourceWords(words, sourceNotebookId),
    [sourceNotebookId, words],
  );
  const selectedCount = selectedWordIds.size;
  const canMove = selectedCount > 0 && Boolean(targetNotebookId) && !isMovingWords;

  function clearSelection() {
    setSelectedWordIds(new Set());
  }

  function handleSourceChange(nextSourceNotebookId: string) {
    setSourceNotebookId(nextSourceNotebookId);
    clearSelection();
  }

  function handleSelectAllVisible() {
    if (selectedWordIds.size === visibleWords.length) {
      clearSelection();
      return;
    }

    setSelectedWordIds(new Set(visibleWords.map((word) => word.id)));
  }

  async function handleMoveWords() {
    if (!canMove) {
      return;
    }

    await moveWords({
      notebookId: getPersistedNotebookId(targetNotebookId),
      wordIds: [...selectedWordIds],
    });
    clearSelection();
  }

  if (isLoading) {
    return (
      <section className="flex flex-1 items-center justify-center">
        <p className="text-sm font-semibold text-slate-500">
          정리할 단어를 불러오는 중
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <p className="text-base font-bold text-slate-950">
            {languageOption.label} 단어 정리
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            기존 단어를 선택해서 미분류나 다른 노트로 옮길 수 있습니다.
          </p>
        </div>

        {errorMessage ? (
          <div className="grid gap-2 rounded-md bg-red-50 px-3 py-2">
            <p className="text-sm font-semibold text-red-700">{errorMessage}</p>
            <button
              className="justify-self-start text-sm font-bold text-red-700 underline"
              onClick={() => void refetch()}
              type="button"
            >
              다시 불러오기
            </button>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700">출발 노트</span>
            <select
              className="min-h-11 rounded-lg border-slate-200 bg-white text-base"
              onChange={(event) => handleSourceChange(event.target.value)}
              value={sourceNotebookId}
            >
              <option value={ALL_NOTEBOOKS_ID}>전체</option>
              <option value={UNFILED_NOTEBOOK_ID}>미분류</option>
              {notebooks.map((notebook) => (
                <option key={notebook.id} value={notebook.id}>
                  {notebook.title}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700">도착 노트</span>
            <select
              className="min-h-11 rounded-lg border-slate-200 bg-white text-base"
              onChange={(event) => setTargetNotebookId(event.target.value)}
              value={targetNotebookId}
            >
              <option value="">선택</option>
              <option value={UNFILED_NOTEBOOK_ID}>미분류</option>
              {notebooks.map((notebook) => (
                <option key={notebook.id} value={notebook.id}>
                  {notebook.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
          <p className="text-sm font-semibold text-slate-500">
            표시 {visibleWords.length}개 · 선택 {selectedCount}개
          </p>
          <button
            className="min-h-11 rounded-lg bg-slate-950 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canMove}
            onClick={() => void handleMoveWords()}
            type="button"
          >
            {isMovingWords ? "이동 중" : "선택한 단어 이동"}
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[36px_1.1fr_0.9fr_1.2fr_0.8fr] items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
              <label className="grid place-items-center">
                <span className="sr-only">현재 목록 전체 선택</span>
                <input
                  checked={
                    visibleWords.length > 0 &&
                    selectedWordIds.size === visibleWords.length
                  }
                  className="rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                  onChange={handleSelectAllVisible}
                  type="checkbox"
                />
              </label>
              <span>단어</span>
              <span>{languageOption.readingLabel ?? "읽기"}</span>
              <span>뜻</span>
              <span>현재 노트</span>
            </div>

            {visibleWords.length > 0 ? (
              <div className="max-h-[60vh] overflow-auto">
                {visibleWords.map((word) => (
                  <label
                    className="grid min-h-12 cursor-pointer grid-cols-[36px_1.1fr_0.9fr_1.2fr_0.8fr] items-center gap-2 border-b border-slate-100 px-3 py-2 text-sm last:border-b-0 hover:bg-slate-50"
                    key={word.id}
                  >
                    <span className="grid place-items-center">
                      <input
                        checked={selectedWordIds.has(word.id)}
                        className="rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                        onChange={() =>
                          setSelectedWordIds((currentWordIds) =>
                            toggleSelectedWord(currentWordIds, word.id),
                          )
                        }
                        type="checkbox"
                      />
                    </span>
                    <span className="truncate font-bold text-slate-950">
                      {getWordTerm(word)}
                    </span>
                    <span className="truncate text-slate-500">
                      {getWordReading(word) || "-"}
                    </span>
                    <span className="truncate text-slate-600">
                      {word.meaning || "-"}
                    </span>
                    <span className="truncate text-slate-500">
                      {getNotebookLabel(notebooks, word.notebookId)}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="grid min-h-40 place-items-center px-4 py-10 text-center">
                <p className="text-sm font-semibold text-slate-500">
                  이 출발 노트에 표시할 단어가 없습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
