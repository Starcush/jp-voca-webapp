"use client";

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useState } from "react";
import {
  countWords,
  getWord,
  getWordLanguage,
  listAllWords,
  listWordsPage,
  updateWordStudyStatus,
  type WordsPageCursor,
} from "@/lib/words";
import type { AppSession } from "@/lib/session";
import type { Language } from "@/types/language";
import type { Word, WordStatus } from "@/types/word";

type WordListPage = Awaited<ReturnType<typeof listWordsPage>>;

type UseWordListQueryInput = {
  activeLanguage: Language;
  highlightedWordId?: string;
  isFullLookupMode: boolean;
  session: AppSession | null;
};

function getFirebaseErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;

    return typeof code === "string" ? code : "";
  }

  return "";
}

function getWordListErrorMessage(error: unknown) {
  const code = getFirebaseErrorCode(error);

  if (code === "failed-precondition") {
    return "단어 목록 인덱스가 필요합니다. Firebase 콘솔에 뜨는 인덱스 생성 링크를 열어 uid 오름차순, createdAt 내림차순 인덱스를 만들어주세요.";
  }

  if (code === "permission-denied") {
    return "Firestore 권한이 부족합니다. Firebase Rules가 배포 환경의 프로젝트에 반영됐는지 확인해주세요.";
  }

  return "단어 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.";
}

function getStudyStatusErrorMessage(error: unknown) {
  const code = getFirebaseErrorCode(error);

  if (code === "permission-denied") {
    return "학습 상태를 저장할 권한이 없습니다. Firebase Rules가 배포 환경의 프로젝트에 반영됐는지 확인해주세요.";
  }

  if (code === "not-found") {
    return "단어를 찾을 수 없습니다. 이미 삭제됐거나 접근할 수 없는 단어일 수 있습니다.";
  }

  if (code === "unavailable") {
    return "Firestore에 연결하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해주세요.";
  }

  return "학습 상태를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.";
}

function getWordPagesQueryKey(
  uid: string,
  language: Language,
  highlightedWordId?: string,
) {
  return ["words", "pages", uid, language, highlightedWordId ?? ""] as const;
}

function getAllWordsQueryKey(uid: string, language: Language) {
  return ["words", "all", uid, language] as const;
}

function getWordCountQueryKey(uid: string, language: Language) {
  return ["words", "count", uid, language] as const;
}

function updateWordInList(
  word: Word,
  wordId: string,
  status: WordStatus,
  lastSeenAt: Word["lastSeenAt"],
) {
  if (word.id !== wordId) {
    return word;
  }

  return {
    ...word,
    lastSeenAt,
    status,
  };
}

async function listFirstWordsPage({
  highlightedWordId,
  language,
  uid,
}: {
  highlightedWordId?: string;
  language: Language;
  uid: string;
}) {
  const page = await listWordsPage(uid, language);
  let words = page.words;

  if (
    highlightedWordId &&
    !words.some((word) => word.id === highlightedWordId)
  ) {
    try {
      const highlightedWord = await getWord(highlightedWordId);

      if (
        highlightedWord?.uid === uid &&
        getWordLanguage(highlightedWord) === language
      ) {
        words = [highlightedWord, ...words];
      }
    } catch (error) {
      console.error("Failed to load highlighted word.", error);
    }
  }

  return {
    ...page,
    words,
  };
}

/**
 * 단어 목록 화면에서 사용하는 서버 상태를 TanStack Query로 관리합니다.
 *
 * @param input - 단어 목록 조회 조건입니다.
 * @param input.session - 현재 로그인 세션입니다.
 * @param input.activeLanguage - 조회할 언어입니다.
 * @param input.highlightedWordId - 목록 첫 페이지에 보강해서 보여줄 단어 ID입니다.
 * @param input.isFullLookupMode - 검색/필터 때문에 전체 단어 조회가 필요한지 여부입니다.
 * @returns 단어 목록, 단어 개수, 로딩/에러 상태, 더 보기/재조회/학습 상태 변경 함수를 반환합니다.
 */
export function useWordListQuery({
  activeLanguage,
  highlightedWordId,
  isFullLookupMode,
  session,
}: UseWordListQueryInput) {
  const queryClient = useQueryClient();
  const [studyStatusErrorMessage, setStudyStatusErrorMessage] = useState("");
  const canLoadWords = Boolean(session?.uid && session.defaultLanguage);
  const uid = session?.uid ?? "";
  const wordPagesQuery = useInfiniteQuery({
    queryKey: getWordPagesQueryKey(uid, activeLanguage, highlightedWordId),
    enabled: canLoadWords && !isFullLookupMode,
    initialPageParam: null as WordsPageCursor | null,
    queryFn: ({ pageParam }) =>
      pageParam
        ? listWordsPage(uid, activeLanguage, pageParam)
        : listFirstWordsPage({
            highlightedWordId,
            language: activeLanguage,
            uid,
          }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.cursor : undefined,
  });
  const allWordsQuery = useQuery({
    queryKey: getAllWordsQueryKey(uid, activeLanguage),
    enabled: canLoadWords && isFullLookupMode,
    queryFn: () => listAllWords(uid, activeLanguage),
  });
  const wordCountQuery = useQuery({
    queryKey: getWordCountQueryKey(uid, activeLanguage),
    enabled: canLoadWords,
    queryFn: () => countWords(uid, activeLanguage),
  });
  const activeWordsQuery = isFullLookupMode ? allWordsQuery : wordPagesQuery;
  const words = isFullLookupMode
    ? allWordsQuery.data ?? []
    : wordPagesQuery.data?.pages.flatMap((page) => page.words) ?? [];
  const hasMore = !isFullLookupMode && Boolean(wordPagesQuery.hasNextPage);
  const isLoadingMore = wordPagesQuery.isFetchingNextPage;
  const queryErrorMessage = activeWordsQuery.error
    ? getWordListErrorMessage(activeWordsQuery.error)
    : "";
  const errorMessage = queryErrorMessage || studyStatusErrorMessage;
  const isContentLoading =
    activeWordsQuery.isLoading ||
    (activeWordsQuery.isFetching && words.length === 0);

  function clearStudyStatusError() {
    setStudyStatusErrorMessage("");
  }

  async function loadNextPage() {
    if (!session || !hasMore || isLoadingMore) {
      return;
    }

    clearStudyStatusError();

    try {
      await wordPagesQuery.fetchNextPage();
    } catch (error) {
      console.error("Failed to load more words.", error);
      setStudyStatusErrorMessage(getWordListErrorMessage(error));
    }
  }

  async function updateStudyStatus(wordId: string, status: WordStatus) {
    if (!session) {
      return;
    }

    clearStudyStatusError();

    try {
      const lastSeenAt = await updateWordStudyStatus(wordId, status);

      queryClient.setQueriesData<InfiniteData<WordListPage>>(
        {
          queryKey: ["words", "pages", session.uid, activeLanguage],
        },
        (currentData) =>
          currentData
            ? {
                ...currentData,
                pages: currentData.pages.map((page) => ({
                  ...page,
                  words: page.words.map((word) =>
                    updateWordInList(word, wordId, status, lastSeenAt),
                  ),
                })),
              }
            : currentData,
      );
      queryClient.setQueryData<Word[]>(
        getAllWordsQueryKey(session.uid, activeLanguage),
        (currentWords) =>
          currentWords?.map((word) =>
            updateWordInList(word, wordId, status, lastSeenAt),
          ),
      );
    } catch (error) {
      console.error("Failed to update study status.", error);
      setStudyStatusErrorMessage(getStudyStatusErrorMessage(error));
    }
  }

  return {
    clearStudyStatusError,
    errorMessage,
    hasMore,
    isContentLoading,
    isLoadingMore,
    loadNextPage,
    refetchWords: activeWordsQuery.refetch,
    updateStudyStatus,
    wordCount: wordCountQuery.data ?? null,
    words,
  };
}
