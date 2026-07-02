import { languageOptions } from "@/lib/languages";
import { getWordReading, getWordTerm } from "@/lib/words";
import type { AppSession } from "@/lib/session";
import type { Language } from "@/types/language";
import type { Word } from "@/types/word";
import { UNFILED_NOTEBOOK_ID } from "@/components/notebooks/notebook-constants";
import type { WordFilter } from "@/components/words/types";

function getLastSeenTime(word: Word) {
  return word.lastSeenAt?.toMillis?.() ?? 0;
}

function matchesSearch(word: Word, searchQuery: string) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [
    getWordTerm(word),
    getWordReading(word),
    word.meaning,
    word.exampleSentence,
    word.exampleTranslation,
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(normalizedQuery));
}

function matchesNotebook(word: Word, notebookId?: string) {
  if (!notebookId) {
    return true;
  }

  if (notebookId === UNFILED_NOTEBOOK_ID) {
    return !word.notebookId;
  }

  return word.notebookId === notebookId;
}

/**
 * 검색어와 상태 필터를 기준으로 단어 목록을 화면 표시용으로 거릅니다.
 *
 * @param words - 서버에서 불러온 원본 단어 목록입니다.
 * @param filter - 현재 선택된 상태 필터입니다.
 * @param searchQuery - 사용자가 입력한 검색어입니다.
 * @param notebookId - 현재 선택된 노트 ID입니다. 없으면 전체 단어를 반환합니다.
 * @returns 검색어와 필터가 적용된 단어 목록을 반환합니다.
 */
export function applyWordListFilter(
  words: Word[],
  filter: WordFilter,
  searchQuery: string,
  notebookId?: string,
) {
  const searchedWords = words.filter(
    (word) => matchesNotebook(word, notebookId) && matchesSearch(word, searchQuery),
  );

  if (filter === "unknown") {
    return searchedWords.filter((word) => word.status === "unknown");
  }

  if (filter === "stale") {
    return [...searchedWords].sort((a, b) => getLastSeenTime(a) - getLastSeenTime(b));
  }

  return searchedWords;
}

/**
 * 세션에 저장된 활성 언어 목록을 단어 목록 탭에 사용할 형태로 정리합니다.
 *
 * @param session - 현재 앱 세션입니다.
 * @returns 유효한 활성 언어 목록을 반환합니다. 없으면 기본 언어 하나를 반환하고, 둘 다 없으면 빈 배열을 반환합니다.
 */
export function getSessionLanguages(session: AppSession | null) {
  const validEnabledLanguages =
    session?.enabledLanguages?.filter((language) =>
      languageOptions.some((option) => option.code === language),
    ) ?? [];

  if (validEnabledLanguages.length > 0) {
    return validEnabledLanguages;
  }

  if (session?.defaultLanguage) {
    return [session.defaultLanguage];
  }

  return [] satisfies Language[];
}
