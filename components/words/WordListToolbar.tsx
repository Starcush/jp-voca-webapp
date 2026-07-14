"use client";

import Link from "next/link";
import { useState } from "react";
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

type ToolbarPanel = "actions" | "filter" | "view";

function getActiveViewLabel(
  viewMode: ViewMode,
  activeLanguageOption: WordLanguageOption,
) {
  const activeTab = viewTabs.find((tab) => tab.value === viewMode);

  if (!activeTab) {
    return "보기";
  }

  return activeTab.value === "kanji"
    ? activeLanguageOption.hideTermLabel
    : activeTab.label;
}

function getActiveFilterLabel(activeFilter: WordFilter) {
  return filters.find((filter) => filter.value === activeFilter)?.label ?? "필터";
}

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
  const [openPanel, setOpenPanel] = useState<ToolbarPanel | null>(null);
  const activeViewLabel = getActiveViewLabel(viewMode, activeLanguageOption);
  const activeFilterLabel = getActiveFilterLabel(activeFilter);

  function togglePanel(panel: ToolbarPanel) {
    setOpenPanel((currentPanel) => (currentPanel === panel ? null : panel));
  }

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

      <label className="block">
        <span className="sr-only">단어 검색</span>
        <input
          className="min-h-11 w-full rounded-lg border-slate-200 bg-white text-base"
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="한자, 뜻, 예문 검색"
          value={searchQuery}
        />
      </label>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <button
          aria-expanded={openPanel === "view"}
          className="grid min-h-11 min-w-0 place-items-center rounded-md border border-slate-200 bg-white px-2 text-slate-700"
          onClick={() => togglePanel("view")}
          type="button"
        >
          <span className="text-[11px] font-bold text-slate-400">보기</span>
          <span className="max-w-full truncate text-xs font-bold">
            {activeViewLabel}
          </span>
        </button>
        <button
          aria-expanded={openPanel === "filter"}
          className="grid min-h-11 min-w-0 place-items-center rounded-md border border-slate-200 bg-white px-2 text-slate-700"
          onClick={() => togglePanel("filter")}
          type="button"
        >
          <span className="text-[11px] font-bold text-slate-400">필터</span>
          <span className="max-w-full truncate text-xs font-bold">
            {activeFilterLabel}
          </span>
        </button>
        <button
          aria-expanded={openPanel === "actions"}
          className="grid min-h-11 min-w-0 place-items-center rounded-md bg-slate-950 px-2 text-white"
          onClick={() => togglePanel("actions")}
          type="button"
        >
          <span className="text-[11px] font-bold text-slate-300">메뉴</span>
          <span className="text-xs font-bold">더보기</span>
        </button>
      </div>

      {openPanel === "view" ? (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
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
              {tab.value === "kanji"
                ? activeLanguageOption.hideTermLabel
                : tab.label}
            </button>
          ))}
        </div>
      ) : null}

      {openPanel === "filter" ? (
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
      ) : null}

      {openPanel === "actions" ? (
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
              notebookId,
              path: "/words/organize",
            })}
          >
            단어 정리
          </Link>
        </div>
      ) : null}
    </section>
  );
}
