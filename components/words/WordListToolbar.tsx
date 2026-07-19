"use client";

import { useState } from "react";
import { filters, viewTabs } from "@/components/words/word-list-options";
import type {
  ViewMode,
  WordFilter,
  WordLanguageOption,
} from "@/components/words/types";

type WordListToolbarProps = {
  activeFilter: WordFilter;
  activeLanguageOption: WordLanguageOption;
  onFilterChange: (filter: WordFilter) => void;
  onViewModeChange: (viewMode: ViewMode) => void;
  viewMode: ViewMode;
  visibleCountLabel: string;
};

type ToolbarPanel = "filter" | "view";

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
 * 단어 목록의 보기 모드와 상태 필터를 접힌 컨트롤로 렌더링합니다.
 *
 * @param props - 단어 목록 툴바에 필요한 상태와 변경 콜백입니다.
 * @returns 현재 표시 개수, 보기 모드, 필터 선택 UI를 렌더링합니다.
 */
export function WordListToolbar({
  activeFilter,
  activeLanguageOption,
  onFilterChange,
  onViewModeChange,
  viewMode,
  visibleCountLabel,
}: WordListToolbarProps) {
  const [openPanel, setOpenPanel] = useState<ToolbarPanel | null>(null);
  const activeViewLabel = getActiveViewLabel(viewMode, activeLanguageOption);
  const activeFilterLabel = getActiveFilterLabel(activeFilter);

  function togglePanel(panel: ToolbarPanel) {
    setOpenPanel((currentPanel) => (currentPanel === panel ? null : panel));
  }

  return (
    <section className="grid gap-2 border-b border-slate-200 bg-slate-50/95 py-3 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-slate-500">{visibleCountLabel}</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            aria-expanded={openPanel === "view"}
            className="grid min-h-9 min-w-20 place-items-center rounded-md border border-slate-200 bg-white px-2 text-slate-700"
            onClick={() => togglePanel("view")}
            type="button"
          >
            <span className="max-w-full truncate text-xs font-bold">
              {activeViewLabel}
            </span>
          </button>
          <button
            aria-expanded={openPanel === "filter"}
            className="grid min-h-9 min-w-20 place-items-center rounded-md border border-slate-200 bg-white px-2 text-slate-700"
            onClick={() => togglePanel("filter")}
            type="button"
          >
            <span className="max-w-full truncate text-xs font-bold">
              {activeFilterLabel}
            </span>
          </button>
        </div>
      </div>

      {/* 펼쳤을 때만 공간을 쓰도록 해서 단어 카드가 첫 화면에서 더 많이 보이게 한다. */}
      {openPanel === "view" ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
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
        <div className="grid grid-cols-3 gap-2">
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
    </section>
  );
}
