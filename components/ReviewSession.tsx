"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getLanguageOption } from "@/lib/languages";
import {
  getWordReading,
  getWordTerm,
  listAllWords,
  updateWordStudyStatus,
} from "@/lib/words";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";
import type { Word, WordStatus } from "@/types/word";

const REVIEW_LIMIT = 20;

type ReviewSessionProps = {
  language: Language;
};

function getLastSeenTime(word: Word) {
  return word.lastSeenAt?.toMillis?.() ?? 0;
}

function buildReviewQueue(words: Word[]) {
  return [...words]
    .sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "unknown" ? -1 : 1;
      }

      return getLastSeenTime(a) - getLastSeenTime(b);
    })
    .slice(0, REVIEW_LIMIT);
}

function getFirebaseErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;

    return typeof code === "string" ? code : "";
  }

  return "";
}

function getReviewErrorMessage(error: unknown) {
  const code = getFirebaseErrorCode(error);

  if (code === "permission-denied") {
    return "복습할 단어를 불러올 권한이 없습니다. Firebase Rules를 확인해주세요.";
  }

  return "복습할 단어를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
}

export function ReviewSession({ language }: ReviewSessionProps) {
  const router = useRouter();
  const session = useSession();
  const languageOption = getLanguageOption(language);
  const [reviewWords, setReviewWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [knownCount, setKnownCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadReviewWords = useCallback(async () => {
    if (!session) {
      return;
    }

    if (!session.defaultLanguage) {
      router.replace("/onboarding/language");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      const words = await listAllWords(session.uid, language);
      setReviewWords(buildReviewQueue(words));
      setCurrentIndex(0);
      setKnownCount(0);
      setUnknownCount(0);
      setIsAnswerVisible(false);
    } catch (error) {
      console.error("Failed to load review words.", error);
      setErrorMessage(getReviewErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [language, router, session]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadReviewWords();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadReviewWords]);

  async function handleStudyStatus(status: WordStatus) {
    const currentWord = reviewWords[currentIndex];

    if (!currentWord || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      await updateWordStudyStatus(currentWord.id, status);

      if (status === "known") {
        setKnownCount((count) => count + 1);
      } else {
        setUnknownCount((count) => count + 1);
      }

      setCurrentIndex((index) => index + 1);
      setIsAnswerVisible(false);
    } catch (error) {
      console.error("Failed to update review status.", error);
      toast.error("복습 상태를 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  const currentWord = reviewWords[currentIndex];
  const isComplete = reviewWords.length > 0 && currentIndex >= reviewWords.length;

  if (isLoading) {
    return (
      <section className="flex flex-1 items-center justify-center">
        <p className="text-sm font-semibold text-slate-500">
          {languageOption.label} 복습 단어를 불러오는 중
        </p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="grid gap-3 py-6">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
        <button
          className="min-h-12 rounded-lg border border-slate-200 bg-white text-base font-bold text-slate-700"
          onClick={() => void loadReviewWords()}
          type="button"
        >
          다시 불러오기
        </button>
      </section>
    );
  }

  if (reviewWords.length === 0) {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <div>
          <p className="text-lg font-bold text-slate-950">
            복습할 {languageOption.label} 단어가 없습니다
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            단어를 추가하면 복습을 시작할 수 있습니다.
          </p>
        </div>
        <Link
          className="min-h-12 rounded-lg bg-slate-950 px-5 py-3 text-base font-bold text-white"
          href={`/words/new?lang=${language}`}
        >
          단어 추가
        </Link>
      </section>
    );
  }

  if (isComplete) {
    return (
      <section className="flex flex-1 flex-col justify-center gap-5 text-center">
        <div>
          <p className="text-2xl font-bold tracking-normal text-slate-950">
            복습 완료
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {languageOption.label} 단어 {reviewWords.length}개를 확인했습니다.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-500">알았어요</p>
            <p className="mt-1 text-2xl font-bold text-green-700">{knownCount}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-500">모르겠어요</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{unknownCount}</p>
          </div>
        </div>
        <div className="grid gap-2">
          <button
            className="min-h-12 rounded-lg bg-slate-950 text-base font-bold text-white"
            onClick={() => void loadReviewWords()}
            type="button"
          >
            다시 복습
          </button>
          <Link
            className="min-h-12 rounded-lg border border-slate-200 bg-white px-4 py-3 text-base font-bold text-slate-700"
            href={`/words?lang=${language}`}
          >
            단어장으로
          </Link>
        </div>
      </section>
    );
  }

  if (!currentWord) {
    return null;
  }

  const term = getWordTerm(currentWord);
  const reading = getWordReading(currentWord);

  return (
    <section className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between text-sm font-semibold text-slate-500">
        <span>{languageOption.label}</span>
        <span>
          {currentIndex + 1} / {reviewWords.length}
        </span>
      </div>

      <article className="flex flex-1 flex-col justify-center rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <button
          className="grid gap-4 text-center"
          onClick={() => setIsAnswerVisible(true)}
          type="button"
        >
          <p className="text-4xl font-bold leading-tight tracking-normal text-word-kanji">
            {term}
          </p>
          {!isAnswerVisible ? (
            <p className="text-sm font-semibold text-slate-400">
              눌러서 정답 보기
            </p>
          ) : null}
        </button>

        {isAnswerVisible ? (
          <div className="mt-8 grid gap-4 border-t border-slate-100 pt-5">
            {reading ? (
              <div>
                <p className="text-xs font-bold text-slate-400">
                  {languageOption.readingLabel ?? "읽기"}
                </p>
                <p className="mt-1 text-base font-bold text-blue-600">{reading}</p>
              </div>
            ) : null}
            {currentWord.meaning ? (
              <div>
                <p className="text-xs font-bold text-slate-400">뜻</p>
                <p className="mt-1 text-lg font-bold text-word-meaning">
                  {currentWord.meaning}
                </p>
              </div>
            ) : null}
            {currentWord.exampleSentence || currentWord.exampleTranslation ? (
              <div className="grid gap-1">
                <p className="text-xs font-bold text-slate-400">예문</p>
                {currentWord.exampleSentence ? (
                  <p className="text-sm font-semibold leading-6 text-slate-600">
                    {currentWord.exampleSentence}
                  </p>
                ) : null}
                {currentWord.exampleTranslation ? (
                  <p className="text-sm leading-6 text-slate-500">
                    {currentWord.exampleTranslation}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </article>

      {isAnswerVisible ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            className="min-h-12 rounded-lg bg-red-600 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={() => void handleStudyStatus("unknown")}
            type="button"
          >
            모르겠어요
          </button>
          <button
            className="min-h-12 rounded-lg bg-slate-950 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={() => void handleStudyStatus("known")}
            type="button"
          >
            알았어요
          </button>
        </div>
      ) : (
        <button
          className="min-h-12 rounded-lg bg-slate-950 text-base font-bold text-white"
          onClick={() => setIsAnswerVisible(true)}
          type="button"
        >
          정답 보기
        </button>
      )}
    </section>
  );
}
