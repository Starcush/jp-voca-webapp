"use client";

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  countWords,
  getWord,
  getWordLanguage,
  getWordReading,
  getWordTerm,
  listAllWords,
  listWordsPage,
  updateWordStudyStatus,
  type WordsPageCursor,
} from "@/lib/words";
import {
  DEFAULT_LANGUAGE,
  getLanguageOption,
  languageOptions,
} from "@/lib/languages";
import { useSession } from "@/lib/use-session";
import {
  getWordSaveNoticeMessage,
  popWordSaveNotice,
} from "@/lib/word-save-notice";
import type { Language } from "@/types/language";
import type { Word, WordStatus } from "@/types/word";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { WordCard } from "@/components/WordCard";

type ViewMode = "all" | "kanji" | "meaning";
type WordFilter = "all" | "unknown" | "stale";
type WordListPage = Awaited<ReturnType<typeof listWordsPage>>;

const viewTabs: Array<{
  label: string;
  value: ViewMode;
}> = [
  { label: "전체 보기", value: "all" },
  { label: "한자 가리기", value: "kanji" },
  { label: "뜻 가리기", value: "meaning" },
];

const filters: Array<{
  label: string;
  value: WordFilter;
}> = [
  { label: "전체", value: "all" },
  { label: "모르는 것만", value: "unknown" },
  { label: "오래 안 본 것", value: "stale" },
];

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

function applyFilter(words: Word[], filter: WordFilter, searchQuery: string) {
  const searchedWords = words.filter((word) => matchesSearch(word, searchQuery));

  if (filter === "unknown") {
    return searchedWords.filter((word) => word.status === "unknown");
  }

  if (filter === "stale") {
    return [...searchedWords].sort((a, b) => getLastSeenTime(a) - getLastSeenTime(b));
  }

  return searchedWords;
}

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

type WordListProps = {
  highlightedWordId?: string;
  selectedLanguage?: Language;
};

function getSessionLanguages(session: ReturnType<typeof useSession>) {
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

  return [];
}

export function WordList({
  highlightedWordId,
  selectedLanguage,
}: WordListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSession();
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
  const [studyStatusErrorMessage, setStudyStatusErrorMessage] = useState("");
  const isFullLookupMode = activeFilter !== "all" || Boolean(searchQuery.trim());
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

  async function loadNextPage() {
    if (!session || !hasMore || isLoadingMore) {
      return;
    }

    setStudyStatusErrorMessage("");

    try {
      await wordPagesQuery.fetchNextPage();
    } catch (error) {
      console.error("Failed to load more words.", error);
      setStudyStatusErrorMessage(getWordListErrorMessage(error));
    }
  }

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
    setStudyStatusErrorMessage("");
    setRevealedWordIds(new Set());
    router.push(`/words?lang=${nextLanguage}`);
  }

  async function handleStudyStatusChange(wordId: string, status: WordStatus) {
    if (!session) {
      return;
    }

    setUpdatingWordIds((currentWordIds) => new Set(currentWordIds).add(wordId));
    setStudyStatusErrorMessage("");

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
    } finally {
      setUpdatingWordIds((currentWordIds) => {
        const nextWordIds = new Set(currentWordIds);
        nextWordIds.delete(wordId);
        return nextWordIds;
      });
    }
  }

  const filteredWords = applyFilter(words, activeFilter, searchQuery);
  const wordCount = wordCountQuery.data ?? null;
  const wordCountLabel =
    wordCount === null ? "저장된 단어 확인 중" : `저장된 단어 ${wordCount}개`;
  const languageGridClass =
    enabledLanguages.length >= 3
      ? "grid-cols-3"
      : enabledLanguages.length === 2
        ? "grid-cols-2"
        : "grid-cols-1";
  const languageTabs = (
    <div className={`grid gap-2 ${languageGridClass}`}>
      {languageOptions
        .filter((language) => enabledLanguages.includes(language.code))
        .map((language) => (
          <button
            aria-pressed={activeLanguage === language.code}
            className={`min-h-10 rounded-md text-sm font-bold ${
              activeLanguage === language.code
                ? "bg-slate-950 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            type="button"
          >
            <span aria-hidden="true">{language.flag}</span> {language.label}
          </button>
        ))}
    </div>
  );

  const toolbar = (
    <section className="sticky top-0 z-10 -mx-4 border-y border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur">
      <div className="mb-3">
        {languageTabs}
        <p className="mt-2 text-xs font-bold text-slate-500">
          {wordCountLabel}
        </p>
      </div>
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
            {tab.value === "kanji" ? activeLanguageOption.hideTermLabel : tab.label}
          </button>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {filters.map((filter) => (
          <button
            aria-pressed={activeFilter === filter.value}
            className={`min-h-10 rounded-md text-sm font-semibold ${
              activeFilter === filter.value
                ? "bg-blue-50 text-blue-700"
                : "bg-white text-slate-600 ring-1 ring-inset ring-slate-200"
            }`}
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            type="button"
          >
            {filter.label}
          </button>
        ))}
      </div>

      <label className="mt-3 block">
        <span className="sr-only">단어 검색</span>
        <input
          className="min-h-11 w-full rounded-lg border-slate-200 bg-white text-base"
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="한자, 뜻, 예문 검색"
          value={searchQuery}
        />
      </label>
      <Link
        className="mt-2 grid min-h-10 place-items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700"
        href={`/words/import?lang=${activeLanguage}`}
      >
        사진에서 가져오기
      </Link>
    </section>
  );
  const loadingOverlay = (
    <LoadingOverlay
      message={`${activeLanguageOption.label} 단어를 불러오는 중`}
      show={isContentLoading}
    />
  );

  if (errorMessage) {
    return (
      <>
        {loadingOverlay}
        {toolbar}
        <section className="grid gap-3 py-4">
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </p>
          <button
            className="min-h-12 rounded-lg border border-slate-200 bg-white text-base font-bold text-slate-700"
            onClick={() => {
              setStudyStatusErrorMessage("");
              void activeWordsQuery.refetch();
            }}
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
      <section className="flex flex-1 flex-col gap-6 pt-3">
        {loadingOverlay}
        <div>
          {languageTabs}
          <p className="mt-2 text-xs font-bold text-slate-500">
            {wordCountLabel}
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 pt-8 text-center">
          <div>
            <p className="text-lg font-bold text-slate-950">
              {activeLanguageOption.label} 첫 단어를 추가해볼까요?
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {activeLanguageOption.termLabel}만 입력해도 저장할 수 있습니다.
            </p>
          </div>
          <Link
            className="min-h-12 rounded-lg bg-slate-950 px-5 py-3 text-base font-bold text-white"
            href={`/words/new?lang=${activeLanguage}`}
          >
            첫 단어 추가
          </Link>
          <Link
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700"
            href={`/words/import?lang=${activeLanguage}`}
          >
            사진에서 가져오기
          </Link>
        </div>
      </section>
    );
  }

  if (filteredWords.length === 0) {
    return (
      <>
        {loadingOverlay}
        {toolbar}
        <section className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          <p className="text-lg font-bold text-slate-950">조건에 맞는 단어가 없습니다</p>
          <p className="text-sm leading-6 text-slate-500">
            검색어를 지우거나 다른 필터를 선택해보세요.
          </p>
          <button
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700"
            onClick={resetListConditions}
            type="button"
          >
            조건 초기화
          </button>
        </section>
        {hasMore ? (
          <div className="pb-24">
            <button
              className="min-h-12 w-full rounded-lg border border-slate-200 bg-white text-base font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoadingMore}
              onClick={loadNextPage}
              type="button"
            >
              {isLoadingMore ? "불러오는 중" : "더 보기"}
            </button>
          </div>
        ) : null}
        <Link
          aria-label="단어 추가"
          className="fixed bottom-5 right-5 grid h-14 w-14 place-items-center rounded-full bg-slate-950 text-3xl font-light leading-none text-white shadow-lg"
          href={`/words/new?lang=${activeLanguage}`}
        >
          +
        </Link>
      </>
    );
  }

  return (
    <>
      {loadingOverlay}
      {toolbar}
      <section className="grid gap-2 py-3">
        {filteredWords.map((word) => (
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
      {hasMore ? (
        <div className="pb-24">
          <button
            className="min-h-12 w-full rounded-lg border border-slate-200 bg-white text-base font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoadingMore}
            onClick={loadNextPage}
            type="button"
          >
            {isLoadingMore ? "불러오는 중" : "더 보기"}
          </button>
        </div>
      ) : (
        <div className="pb-24" />
      )}
      <Link
        aria-label="단어 추가"
        className="fixed bottom-5 right-5 grid h-14 w-14 place-items-center rounded-full bg-slate-950 text-3xl font-light leading-none text-white shadow-lg"
        href={`/words/new?lang=${activeLanguage}`}
      >
        +
      </Link>
    </>
  );
}
