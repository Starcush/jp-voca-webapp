"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { listWords } from "@/lib/words";
import { useSession } from "@/lib/use-session";
import type { Word } from "@/types/word";
import { WordCard } from "@/components/WordCard";

export function WordList() {
  const session = useSession();
  const [words, setWords] = useState<Word[]>([]);
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

  if (isLoading) {
    return (
      <section className="flex flex-1 items-center justify-center py-16">
        <p className="text-sm font-semibold text-slate-500">단어를 불러오는 중</p>
      </section>
    );
  }

  if (errorMessage) {
    return (
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
    );
  }

  if (words.length === 0) {
    return (
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
    );
  }

  return (
    <section className="grid gap-3 py-4">
      {words.map((word) => (
        <WordCard key={word.id} word={word} />
      ))}
    </section>
  );
}
