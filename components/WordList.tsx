"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  getWord,
  listAllWords,
  listWordsPage,
  updateWordStudyStatus,
  type WordsPageCursor,
} from "@/lib/words";
import { useSession } from "@/lib/use-session";
import type { Word, WordStatus } from "@/types/word";
import { WordCard } from "@/components/WordCard";

type ViewMode = "all" | "kanji" | "meaning";
type WordFilter = "all" | "unknown" | "stale";
type SaveStatus = "created" | "updated" | "deleted";

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
    word.kanji,
    word.yomikataFurigana,
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

type WordListProps = {
  highlightedWordId?: string;
  saveStatus?: SaveStatus;
};

function getSaveStatusMessage(saveStatus?: SaveStatus) {
  if (saveStatus === "created") {
    return "단어를 추가했습니다.";
  }

  if (saveStatus === "updated") {
    return "단어를 수정했습니다.";
  }

  if (saveStatus === "deleted") {
    return "단어를 삭제했습니다.";
  }

  return "";
}

export function WordList({ highlightedWordId, saveStatus }: WordListProps) {
  const router = useRouter();
  const session = useSession();
  const [words, setWords] = useState<Word[]>([]);
  const [activeHighlightedWordId, setActiveHighlightedWordId] = useState(
    highlightedWordId ?? "",
  );
  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [activeFilter, setActiveFilter] = useState<WordFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [revealedWordIds, setRevealedWordIds] = useState<Set<string>>(new Set());
  const [updatingWordIds, setUpdatingWordIds] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<WordsPageCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(() =>
    getSaveStatusMessage(saveStatus),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFullLookupMode = activeFilter !== "all" || Boolean(searchQuery.trim());

  const loadFirstPage = useCallback(async () => {
    if (!session) {
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      const page = await listWordsPage(session.uid);
      let nextWords = page.words;

      if (
        highlightedWordId &&
        !nextWords.some((word) => word.id === highlightedWordId)
      ) {
        try {
          const highlightedWord = await getWord(highlightedWordId);

          if (highlightedWord?.uid === session.uid) {
            nextWords = [highlightedWord, ...nextWords];
          }
        } catch (error) {
          console.error("Failed to load highlighted word.", error);
        }
      }

      setWords(nextWords);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (error) {
      console.error("Failed to load words.", error);
      setErrorMessage(getWordListErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [highlightedWordId, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (!isFullLookupMode) {
        void loadFirstPage();
        return;
      }

      setErrorMessage("");
      setIsLoading(true);

      void listAllWords(session.uid)
        .then((nextWords) => {
          setWords(nextWords);
          setCursor(null);
          setHasMore(false);
        })
        .catch((error) => {
          console.error("Failed to load words for search.", error);
          setErrorMessage(getWordListErrorMessage(error));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, isFullLookupMode ? 200 : 0);

    return () => window.clearTimeout(timeoutId);
  }, [isFullLookupMode, loadFirstPage, searchQuery, activeFilter, session]);

  useEffect(() => {
    const message = getSaveStatusMessage(saveStatus);

    if (!message) {
      return;
    }

    const clearMessageTimeoutId = window.setTimeout(() => {
      setSuccessMessage("");
    }, 2500);
    const clearHighlightTimeoutId = window.setTimeout(() => {
      setActiveHighlightedWordId("");
    }, 3500);
    const clearUrlTimeoutId = window.setTimeout(() => {
      router.replace("/words", { scroll: false });
    }, 2600);

    return () => {
      window.clearTimeout(clearMessageTimeoutId);
      window.clearTimeout(clearHighlightTimeoutId);
      window.clearTimeout(clearUrlTimeoutId);
    };
  }, [router, saveStatus]);

  async function loadNextPage() {
    if (!session || !cursor || isLoadingMore) {
      return;
    }

    setErrorMessage("");
    setIsLoadingMore(true);

    try {
      const page = await listWordsPage(session.uid, cursor);
      setWords((currentWords) => {
        const currentWordIds = new Set(currentWords.map((word) => word.id));
        const nextWords = page.words.filter((word) => !currentWordIds.has(word.id));

        return [...currentWords, ...nextWords];
      });
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (error) {
      console.error("Failed to load more words.", error);
      setErrorMessage(getWordListErrorMessage(error));
    } finally {
      setIsLoadingMore(false);
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
    } catch (error) {
      console.error("Failed to update study status.", error);
      setErrorMessage(getStudyStatusErrorMessage(error));
    } finally {
      setUpdatingWordIds((currentWordIds) => {
        const nextWordIds = new Set(currentWordIds);
        nextWordIds.delete(wordId);
        return nextWordIds;
      });
    }
  }

  const filteredWords = applyFilter(words, activeFilter, searchQuery);
  const successBanner = successMessage ? (
    <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
      {successMessage}
    </p>
  ) : null;

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
    </section>
  );

  if (isLoading) {
    return (
      <>
        {toolbar}
        {successBanner ? <section className="pt-3">{successBanner}</section> : null}
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
          {successBanner}
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </p>
          <button
            className="min-h-12 rounded-lg border border-slate-200 bg-white text-base font-bold text-slate-700"
            onClick={loadFirstPage}
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
      <section className="flex flex-1 flex-col items-center gap-4 pt-12 text-center">
        {successBanner}
        <div>
          <p className="text-lg font-bold text-slate-950">첫 단어를 추가해볼까요?</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            한자 / 단어만 입력해도 저장할 수 있습니다.
          </p>
        </div>
        <Link
          className="min-h-12 rounded-lg bg-slate-950 px-5 py-3 text-base font-bold text-white"
          href="/words/new"
        >
          첫 단어 추가
        </Link>
      </section>
    );
  }

  if (filteredWords.length === 0) {
    return (
      <>
        {toolbar}
        <section className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
          {successBanner}
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
          href="/words/new"
        >
          +
        </Link>
      </>
    );
  }

  return (
    <>
      {toolbar}
      {successBanner ? <section className="pt-3">{successBanner}</section> : null}
      <section className="grid gap-2 py-3">
        {filteredWords.map((word) => (
          <WordCard
            isRevealed={revealedWordIds.has(word.id)}
            isHighlighted={word.id === activeHighlightedWordId}
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
        href="/words/new"
      >
        +
      </Link>
    </>
  );
}
