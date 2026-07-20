"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { UNFILED_NOTEBOOK_ID } from "@/components/notebooks/notebook-constants";
import {
  REVIEW_LIMIT,
  type ReviewDirection,
} from "@/components/review/review-options";
import { getFsrsDueTime, isFsrsWordDue } from "@/lib/fsrs";
import type { AppSession } from "@/lib/session";
import { listAllWords } from "@/lib/words";
import type { Language } from "@/types/language";
import type { Word } from "@/types/word";

type UseReviewWordsQueryInput = {
  language: Language;
  notebookId?: string;
  offset: number;
  reviewDirection: ReviewDirection;
  session: AppSession | null;
};

function getPriorityReviewWords(words: Word[]) {
  return [...words].sort((a, b) => {
    const dueDifference = getFsrsDueTime(a) - getFsrsDueTime(b);

    if (dueDifference !== 0) {
      return dueDifference;
    }

    if (a.status !== b.status) {
      return a.status === "unknown" ? -1 : 1;
    }

    return (a.lastSeenAt?.toMillis?.() ?? 0) - (b.lastSeenAt?.toMillis?.() ?? 0);
  });
}

function getNotebookWords(words: Word[], notebookId?: string) {
  if (!notebookId) {
    return words;
  }

  if (notebookId === UNFILED_NOTEBOOK_ID) {
    return words.filter((word) => !word.notebookId);
  }

  return words.filter((word) => word.notebookId === notebookId);
}

function getDirectionWords(words: Word[], reviewDirection: ReviewDirection) {
  if (reviewDirection === "termToMeaning") {
    return words;
  }

  return words.filter((word) => word.meaning?.trim());
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

/**
 * 복습용 단어 후보를 TanStack Query로 불러오고 현재 offset의 20개 세트를 계산합니다.
 *
 * @param input - 복습 단어 조회와 세트 계산에 필요한 조건입니다.
 * @param input.session - 현재 로그인 세션입니다.
 * @param input.language - 복습할 언어입니다.
 * @param input.notebookId - 복습할 노트 ID입니다. 없으면 언어 전체를 복습합니다.
 * @param input.offset - 전체 후보 목록에서 현재 세트가 시작되는 위치입니다.
 * @param input.reviewDirection - 복습 카드에서 먼저 보여줄 면입니다.
 * @returns 현재 복습 세트, 전체 후보 개수, 로딩/에러 상태, 재조회 함수를 반환합니다.
 */
export function useReviewWordsQuery({
  language,
  notebookId,
  offset,
  reviewDirection,
  session,
}: UseReviewWordsQueryInput) {
  const uid = session?.uid ?? "";
  const wordsQuery = useQuery({
    queryKey: ["reviewWords", uid, language],
    enabled: Boolean(session?.uid && session.defaultLanguage),
    queryFn: () => listAllWords(uid, language),
  });
  const modeWords = useMemo(
    () => {
      const now = new Date();

      return getPriorityReviewWords(
        getDirectionWords(
          getNotebookWords(wordsQuery.data ?? [], notebookId),
          reviewDirection,
        ).filter((word) => isFsrsWordDue(word, now)),
      );
    },
    [notebookId, reviewDirection, wordsQuery.data],
  );
  const reviewWords = useMemo(
    () => modeWords.slice(offset, offset + REVIEW_LIMIT),
    [modeWords, offset],
  );

  return {
    errorMessage: wordsQuery.error
      ? getReviewErrorMessage(wordsQuery.error)
      : "",
    isLoading: wordsQuery.isLoading,
    refetchReviewWords: wordsQuery.refetch,
    reviewTotalCount: modeWords.length,
    reviewWords,
  };
}
