"use client";

import Link from "next/link";
import { buildWordListHref } from "@/components/words/word-list-links";
import { filters, viewTabs } from "@/components/words/word-list-options";
import { WordLanguageTabs } from "@/components/words/WordLanguageTabs";
import type {
  ViewMode,
  WordFilter,
  WordLanguageOption,
} from "@/components/words/types";
import type { Language } from "@/types/language";

type WordListToolbarProps = {
  activeFilter: WordFilter;
  activeLanguage: Language;
  activeLanguageOption: WordLanguageOption;
  enabledLanguages: Language[];
  notebookId?: string;
  onFilterChange: (filter: WordFilter) => void;
  onLanguageChange: (language: Language) => void;
  onSearchQueryChange: (query: string) => void;
  onViewModeChange: (viewMode: ViewMode) => void;
  searchQuery: string;
  viewMode: ViewMode;
  wordCountLabel: string;
};

/**
 * 단어 목록의 언어, 보기 모드, 필터, 검색, OCR 가져오기 진입점을 렌더링합니다.
 *
 * @param props - 단어 목록 툴바에 필요한 상태와 변경 콜백입니다.
 * @returns sticky toolbar UI를 렌더링합니다.
 */
export function WordListToolbar({
  activeFilter,
  activeLanguage,
  activeLanguageOption,
  enabledLanguages,
  notebookId,
  onFilterChange,
  onLanguageChange,
  onSearchQueryChange,
  onViewModeChange,
  searchQuery,
  viewMode,
  wordCountLabel,
}: WordListToolbarProps) {
  return (
    <section className="sticky top-0 z-10 -mx-4 border-y border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur">
      <div className="mb-3">
        <WordLanguageTabs
          activeLanguage={activeLanguage}
          enabledLanguages={enabledLanguages}
          onLanguageChange={onLanguageChange}
        />
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
            onClick={() => onViewModeChange(tab.value)}
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
            onClick={() => onFilterChange(filter.value)}
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
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="한자, 뜻, 예문 검색"
          value={searchQuery}
        />
      </label>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Link
          className="grid min-h-10 place-items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700"
          href={buildWordListHref({
            language: activeLanguage,
            notebookId,
            path: "/words/import",
          })}
        >
          사진에서 가져오기
        </Link>
        <Link
          className="grid min-h-10 place-items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700"
          href={buildWordListHref({
            language: activeLanguage,
            path: "/words/organize",
          })}
        >
          단어 정리
        </Link>
      </div>
    </section>
  );
}
