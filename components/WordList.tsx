"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { listWords, updateWordStudyStatus } from "@/lib/words";
import { useSession } from "@/lib/use-session";
import type { Word, WordStatus } from "@/types/word";
import { WordCard } from "@/components/WordCard";

type ViewMode = "all" | "kanji" | "meaning";

const viewTabs: Array<{
  label: string;
  value: ViewMode;
}> = [
  { label: "전체 보기", value: "all" },
  { label: "한자 가리기", value: "kanji" },
  { label: "뜻 가리기", value: "meaning" },
];

const filters = ["전체", "모르는 것만", "오래 안 본 것"];

export function WordList() {
  const session = useSession();
  const [words, setWords] = useState<Word[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [revealedWordIds, setRevealedWordIds] = useState<Set<string>>(new Set());
  const [updatingWordIds, setUpdatingWordIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const loadWords = useCallback(async () => {
    if (!session) {
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      setWords(await listWords(session.uid));
    } catch {
      setErrorMessage("단어 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadWords();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadWords]);

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

  async function handleStudyStatusChange(wordId: string, status: WordStatus) {
    setUpdatingWordIds((currentWordIds) => new Set(currentWordIds).add(wordId));
    setErrorMessage("");

    try {
      const lastSeenAt = await updateWordStudyStatus(wordId, status);

      setWords((currentWords) =>
        currentWords.map((word) =>
          word.id === wordId
            ? {
                ...word,
                status,
                lastSeenAt,
              }
            : word,
        ),
      );
    } catch {
      setErrorMessage("학습 상태를 저장하지 못했습니다.");
    } finally {
      setUpdatingWordIds((currentWordIds) => {
        const nextWordIds = new Set(currentWordIds);
        nextWordIds.delete(wordId);
        return nextWordIds;
      });
    }
  }

  const toolbar = (
    <section className="sticky top-0 z-10 -mx-4 border-y border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {viewTabs.map((tab) => (
          <button
            aria-pressed={viewMode === tab.value}
            className={`min-h-10 shrink-0 rounded-md px-3 text-sm font-bold ${
              viewMode === tab.value
                ? "bg-slate-950 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
            key={tab.value}
            onClick={() => handleViewModeChange(tab.value)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {filters.map((filter, index) => (
          <button
            className={`min-h-10 rounded-md text-sm font-semibold ${
              index === 0
                ? "bg-blue-50 text-blue-700"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200"
            }`}
            key={filter}
            type="button"
          >
            {filter}
          </button>
        ))}
      </div>

      <label className="mt-3 block">
        <span className="sr-only">단어 검색</span>
        <input
          className="min-h-11 w-full rounded-lg border-slate-200 bg-white text-base"
          placeholder="한자, 뜻, 예문 검색"
        />
      </label>
    </section>
  );

  if (isLoading) {
    return (
      <>
        {toolbar}
        <section className="flex flex-1 items-center justify-center py-16">
          <p className="text-sm font-semibold text-slate-500">단어를 불러오는 중</p>
        </section>
      </>
    );
  }

  if (errorMessage) {
    return (
      <>
        {toolbar}
        <section className="grid gap-3 py-4">
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </p>
          <button
            className="min-h-12 rounded-lg border border-slate-200 bg-white text-base font-bold text-slate-700"
            onClick={loadWords}
            type="button"
          >
            다시 불러오기
          </button>
        </section>
      </>
    );
  }

  if (words.length === 0) {
    return (
      <>
        {toolbar}
        <section className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
          <div>
            <p className="text-lg font-bold text-slate-950">아직 단어가 없습니다</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              첫 단어를 추가하면 여기에 표시됩니다.
            </p>
          </div>
          <Link
            className="min-h-12 rounded-lg bg-slate-950 px-5 py-3 text-base font-bold text-white"
            href="/words/new"
          >
            단어 추가
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      {toolbar}
      <section className="grid gap-3 py-4">
        {words.map((word) => (
          <WordCard
            isRevealed={revealedWordIds.has(word.id)}
            isUpdatingStudyStatus={updatingWordIds.has(word.id)}
            key={word.id}
            maskedField={viewMode === "all" ? undefined : viewMode}
            onStudyStatusChange={(status) => handleStudyStatusChange(word.id, status)}
            onToggleReveal={() => toggleWordReveal(word.id)}
            word={word}
          />
        ))}
      </section>
      <Link
        aria-label="단어 추가"
        className="fixed bottom-5 right-5 grid h-14 w-14 place-items-center rounded-full bg-slate-950 text-3xl font-light leading-none text-white shadow-lg"
        href="/words/new"
      >
        +
      </Link>
    </>
  );
}
