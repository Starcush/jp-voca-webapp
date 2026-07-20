"use client";

import Link from "next/link";
import { Search, Settings } from "lucide-react";
import { useState } from "react";
import {
  NotebookDropdown,
  type NotebookDropdownOption,
} from "@/components/notebooks/NotebookDropdown";
import { UNFILED_NOTEBOOK_ID } from "@/components/notebooks/notebook-constants";
import { useNotebooksQuery } from "@/components/notebooks/useNotebooksQuery";
import { getViewTabs } from "@/components/words/word-list-options";
import { languageOptions } from "@/lib/languages";
import type { AppSession } from "@/lib/session";
import type { ViewMode } from "@/components/words/types";
import type { Language } from "@/types/language";

type WordListHeaderProps = {
  activeLanguage: Language;
  activeNotebookCountLabel: string;
  enabledLanguages: Language[];
  onLanguageChange: (language: Language) => void;
  onNotebookChange: (notebookId?: string) => void;
  onSearchQueryChange: (query: string) => void;
  onViewModeChange: (viewMode: ViewMode) => void;
  searchQuery: string;
  selectedNotebookId?: string;
  session: AppSession | null;
  totalWordCountLabel: string;
  viewMode: ViewMode;
};

function getNotebookTitle({
  notebookTitle,
  selectedNotebookId,
}: {
  notebookTitle?: string;
  selectedNotebookId?: string;
}) {
  if (!selectedNotebookId) {
    return "전체";
  }

  if (selectedNotebookId === UNFILED_NOTEBOOK_ID) {
    return "미분류";
  }

  return notebookTitle ?? "알 수 없음";
}

/**
 * 단어 목록의 첫 화면 헤더와 접히는 노트/언어/검색 진입점을 렌더링합니다.
 *
 * @param props - 현재 언어, 노트, 검색어와 각 변경 콜백입니다.
 * @returns 단어장 제목, 언어 전환, 인라인 검색, 노트 칩, 카드 표시 토글을 렌더링합니다.
 */
export function WordListHeader({
  activeLanguage,
  activeNotebookCountLabel,
  enabledLanguages,
  onLanguageChange,
  onNotebookChange,
  onSearchQueryChange,
  onViewModeChange,
  searchQuery,
  selectedNotebookId,
  session,
  totalWordCountLabel,
  viewMode,
}: WordListHeaderProps) {
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(Boolean(searchQuery.trim()));
  const { isLoadingNotebooks, notebooks, notebooksErrorMessage } =
    useNotebooksQuery({
      language: activeLanguage,
      session,
    });
  const activeLanguageOption =
    languageOptions.find((language) => language.code === activeLanguage) ??
    languageOptions[0];
  const selectedNotebook = notebooks.find(
    (notebook) => notebook.id === selectedNotebookId,
  );
  const notebookTitle = getNotebookTitle({
    notebookTitle: selectedNotebook?.title,
    selectedNotebookId,
  });
  const notebookOptions: NotebookDropdownOption[] = [
    {
      key: "all",
      label: "전체",
      meta: totalWordCountLabel,
      value: undefined,
    },
    ...notebooks.map((notebook) => ({
      key: notebook.id,
      label: notebook.title,
      value: notebook.id,
    })),
    {
      key: UNFILED_NOTEBOOK_ID,
      label: "미분류",
      value: UNFILED_NOTEBOOK_ID,
    },
  ];
  const selectedNotebookKey = selectedNotebookId ?? "all";
  const viewTabs = getViewTabs(activeLanguage);

  function handleSearchClose() {
    setIsSearchOpen(false);
    onSearchQueryChange("");
  }

  function handleLanguageSelect(nextLanguage: Language) {
    onLanguageChange(nextLanguage);
    setIsLanguageOpen(false);
  }

  return (
    <header className="sticky top-0 z-20 -mx-4 border-b border-brand-border bg-white px-4 pb-3 pt-5 text-brand-text shadow-[0_8px_20px_rgba(36,28,61,0.06)] md:static md:mx-0 md:mb-6 md:border-0 md:p-0 md:shadow-none">
      {isSearchOpen ? (
        <div className="grid grid-cols-[1fr_auto] items-center gap-2 md:hidden">
          <label>
            <span className="sr-only">단어 검색</span>
            <input
              autoFocus
              className="min-h-11 w-full rounded-lg border-brand-border bg-brand-background text-base text-brand-text placeholder:text-brand-muted"
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="단어, 읽기, 뜻, 예문 검색"
              value={searchQuery}
            />
          </label>
          <button
            className="min-h-11 rounded-lg px-3 text-sm font-bold text-brand-muted"
            onClick={handleSearchClose}
            type="button"
          >
            취소
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-black tracking-normal text-brand-text">
              단어장
            </h1>
          </div>
          <div className="relative flex shrink-0 items-center gap-2">
            <button
              aria-expanded={isLanguageOpen}
              aria-label="학습 언어 선택"
              className="grid h-10 w-10 place-items-center rounded-lg border border-brand-border bg-white text-lg shadow-sm"
              onClick={() => {
                setIsLanguageOpen((currentValue) => !currentValue);
                setIsNotebookOpen(false);
              }}
              type="button"
            >
              <span aria-hidden="true">{activeLanguageOption.flag}</span>
            </button>
            <button
              aria-label="단어 검색"
              className="grid h-10 w-10 place-items-center rounded-lg border border-brand-border bg-white text-base font-black text-brand-muted shadow-sm md:hidden"
              onClick={() => {
                setIsSearchOpen(true);
                setIsLanguageOpen(false);
                setIsNotebookOpen(false);
              }}
              type="button"
            >
              <Search aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
            </button>
            <Link
              aria-label="설정"
              className="grid h-10 w-10 place-items-center rounded-lg border border-brand-border bg-white text-brand-muted shadow-sm"
              href="/settings"
              onClick={() => {
                setIsLanguageOpen(false);
                setIsNotebookOpen(false);
              }}
            >
              <Settings aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
            </Link>
            {isLanguageOpen ? (
              <div className="absolute right-0 top-12 z-30 w-48 rounded-xl border border-brand-border bg-white p-2 text-brand-text shadow-lg">
                <div className="grid gap-1">
                  {languageOptions
                    .filter((language) => enabledLanguages.includes(language.code))
                    .map((language) => (
                      <button
                        aria-pressed={activeLanguage === language.code}
                        className={`flex min-h-10 items-center justify-between rounded-lg px-3 text-sm font-bold ${
                          activeLanguage === language.code
                            ? "bg-brand-green text-white"
                            : "text-brand-muted hover:bg-brand-background"
                        }`}
                        key={language.code}
                        onClick={() => handleLanguageSelect(language.code)}
                        type="button"
                      >
                        <span>
                          <span aria-hidden="true">{language.flag}</span>{" "}
                          {language.label}
                        </span>
                        {activeLanguage === language.code ? (
                          <span aria-hidden="true">✓</span>
                        ) : null}
                      </button>
                    ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className={isSearchOpen ? "mt-3 hidden md:block" : "mt-3 md:mt-5"}>
        <div className="grid gap-2 md:grid-cols-[minmax(220px,320px)_minmax(260px,1fr)_max-content] md:items-center md:gap-3">
          <NotebookDropdown
            ariaLabel="노트 선택"
            buttonLabel={notebookTitle}
            buttonMeta={activeNotebookCountLabel}
            className="min-w-0"
            errorMessage={notebooksErrorMessage}
            isLoading={isLoadingNotebooks}
            isOpen={isNotebookOpen}
            onOpenChange={(nextIsOpen) => {
              setIsNotebookOpen(nextIsOpen);
              if (nextIsOpen) {
                setIsLanguageOpen(false);
              }
            }}
            onSelect={onNotebookChange}
            options={notebookOptions}
            selectedKey={selectedNotebookKey}
          />

          <label className="hidden md:block">
            <span className="sr-only">단어 검색</span>
            <input
              className="min-h-11 w-full rounded-lg border border-brand-border bg-white px-3 text-sm font-semibold text-brand-text shadow-sm placeholder:text-brand-muted"
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="단어, 읽기, 뜻, 예문 검색"
              value={searchQuery}
            />
          </label>

          <div className="grid grid-cols-3 rounded-full bg-brand-background p-1 shadow-sm md:min-w-72">
            {viewTabs.map((tab) => (
              <button
                aria-pressed={viewMode === tab.value}
                className={`min-h-8 rounded-full px-2 text-xs font-bold ${
                  viewMode === tab.value
                    ? "bg-primary text-white shadow-sm"
                    : "text-brand-muted"
                }`}
                key={tab.value}
                onClick={() => onViewModeChange(tab.value)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </header>
  );
}
