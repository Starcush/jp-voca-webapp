"use client";

import { BookOpenText } from "lucide-react";
import { useState } from "react";
import {
  getPersistedNotebookId,
  UNFILED_NOTEBOOK_ID,
} from "@/components/notebooks/notebook-constants";
import { useNotebooksQuery } from "@/components/notebooks/useNotebooksQuery";
import type { AppSession } from "@/lib/session";
import type { Language } from "@/types/language";
import type { Notebook } from "@/types/notebook";

type UseCurrentNotebookTargetInput = {
  language: Language;
  notebookId?: string;
  session: AppSession | null;
};

/**
 * 현재 화면에서 단어가 저장될 노트 정보를 표현한 값입니다.
 *
 * @property description - 사용자에게 보여줄 짧은 저장 위치 설명입니다.
 * @property isChecking - 노트 목록을 확인 중인지 여부입니다.
 * @property resolvedNotebookId - 실제 저장에 사용할 노트 ID입니다. 없으면 미분류로 저장합니다.
 * @property status - 현재 노트 상태입니다.
 * @property title - 사용자에게 보여줄 노트 이름입니다.
 */
export type CurrentNotebookTarget = {
  description: string;
  isChecking: boolean;
  resolvedNotebookId?: string;
  status: "selected" | "unfiled" | "missing" | "error" | "checking";
  title: string;
};

type CurrentNotebookNoticeProps = {
  target: CurrentNotebookTarget;
};

type CurrentNotebookSelectorProps = {
  isLoadingNotebooks: boolean;
  notebooks: Notebook[];
  onNotebookChange: (notebookId?: string) => void;
  selectedNotebookId?: string;
  target: CurrentNotebookTarget;
};

/**
 * URL의 notebookId를 현재 저장 가능한 노트 정보로 해석합니다.
 *
 * @param input - 노트 확인에 필요한 언어, 세션, URL 노트 ID입니다.
 * @param input.language - 노트가 속한 현재 언어입니다.
 * @param input.notebookId - URL에서 전달된 노트 ID입니다.
 * @param input.session - 현재 로그인 세션입니다.
 * @returns 화면 표시용 노트 정보와 실제 저장에 사용할 노트 ID를 반환합니다.
 */
export function useCurrentNotebookTarget({
  language,
  notebookId,
  session,
}: UseCurrentNotebookTargetInput): CurrentNotebookTarget {
  const persistedNotebookId = getPersistedNotebookId(notebookId);
  const { isLoadingNotebooks, notebooks, notebooksErrorMessage } =
    useNotebooksQuery({
      language,
      session,
    });
  const selectedNotebook = persistedNotebookId
    ? notebooks.find((notebook) => notebook.id === persistedNotebookId)
    : null;

  if (!persistedNotebookId) {
    return {
      description: "노트를 선택하지 않으면 미분류에 저장됩니다.",
      isChecking: false,
      resolvedNotebookId: undefined,
      status: "unfiled",
      title: "미분류",
    };
  }

  if (isLoadingNotebooks) {
    return {
      description: "선택한 노트를 확인하고 있습니다.",
      isChecking: true,
      resolvedNotebookId: persistedNotebookId,
      status: "checking",
      title: "노트 확인 중",
    };
  }

  if (notebooksErrorMessage) {
    return {
      description: notebooksErrorMessage,
      isChecking: false,
      resolvedNotebookId: persistedNotebookId,
      status: "error",
      title: "노트 확인 필요",
    };
  }

  if (!selectedNotebook) {
    return {
      description: "선택한 노트를 찾지 못해 미분류로 저장됩니다.",
      isChecking: false,
      resolvedNotebookId: undefined,
      status: "missing",
      title: "알 수 없는 노트",
    };
  }

  return {
    description: "이 화면에서 추가하는 단어는 이 노트에 저장됩니다.",
    isChecking: false,
    resolvedNotebookId: selectedNotebook.id,
    status: "selected",
    title: selectedNotebook.title,
  };
}

/**
 * 단어 추가와 OCR 가져오기 화면에서 현재 저장될 노트를 간단히 표시합니다.
 *
 * @param props - 현재 저장 대상 노트 정보입니다.
 * @param props.target - 화면에 표시할 노트 상태와 이름입니다.
 * @returns 현재 저장 위치를 알려주는 안내 UI를 렌더링합니다.
 */
export function CurrentNotebookNotice({ target }: CurrentNotebookNoticeProps) {
  const isWarning = target.status === "missing" || target.status === "error";

  return (
    <aside
      className={`rounded-lg border px-3 py-2 ${
        isWarning
          ? "border-amber-200 bg-amber-50 text-amber-900"
          : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      <p className="text-xs font-bold text-slate-400">
        저장 노트
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        <p className="text-sm font-bold">{target.title}</p>
        {target.isChecking ? (
          <span className="text-xs font-semibold text-slate-500">확인 중</span>
        ) : null}
      </div>
      <p className="mt-1 text-xs font-semibold leading-5">{target.description}</p>
    </aside>
  );
}

/**
 * OCR 가져오기 화면에서 현재 저장 노트를 보여주고 바로 변경할 수 있는 선택 UI를 렌더링합니다.
 *
 * @param props - 현재 노트 상태, 노트 목록, 선택 변경 콜백입니다.
 * @param props.isLoadingNotebooks - 노트 목록을 불러오는 중인지 여부입니다.
 * @param props.notebooks - 선택 가능한 실제 노트 목록입니다.
 * @param props.onNotebookChange - 저장 대상 노트를 변경하는 콜백입니다.
 * @param props.selectedNotebookId - 현재 선택된 UI 노트 ID입니다. 없으면 미분류입니다.
 * @param props.target - 현재 저장 대상 노트의 표시 상태입니다.
 * @returns 저장 노트 안내와 노트 선택 select를 렌더링합니다.
 */
export function CurrentNotebookSelector({
  isLoadingNotebooks,
  notebooks,
  onNotebookChange,
  selectedNotebookId,
  target,
}: CurrentNotebookSelectorProps) {
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const isWarning = target.status === "missing" || target.status === "error";

  function handleNotebookSelect(nextNotebookId?: string) {
    onNotebookChange(nextNotebookId);
    setIsNotebookOpen(false);
  }

  return (
    <aside className="relative w-full">
      <p className="mb-2 text-xs font-bold text-brand-muted">저장 노트</p>
      <button
        aria-expanded={isNotebookOpen}
        className={`flex min-w-0 w-full items-center gap-2 rounded-lg border bg-white px-3 py-2 text-left text-sm font-bold text-brand-text shadow-sm ${
          isWarning ? "border-primary-border" : "border-brand-border"
        }`}
        disabled={isLoadingNotebooks}
        onClick={() => setIsNotebookOpen((currentValue) => !currentValue)}
        type="button"
      >
        <BookOpenText
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          strokeWidth={2.2}
        />
        <span className="min-w-0 flex-1 truncate">{target.title}</span>
        {target.isChecking || isLoadingNotebooks ? (
          <span className="shrink-0 text-xs text-brand-muted">확인 중</span>
        ) : null}
        <span aria-hidden="true" className="text-brand-muted">
          {isNotebookOpen ? "⌃" : "⌄"}
        </span>
      </button>

      {isWarning ? (
        <p className="mt-2 rounded-lg bg-primary-tint px-3 py-2 text-xs font-semibold leading-5 text-primary-text">
          {target.description}
        </p>
      ) : null}

      {isNotebookOpen ? (
        <div className="mt-2 grid w-full gap-2 rounded-xl border border-brand-border bg-white p-2 text-brand-text shadow-sm">
          {target.status === "missing" && selectedNotebookId ? (
            <button
              aria-pressed
              className="flex min-h-10 items-center justify-between rounded-lg bg-brand-green px-3 text-left text-sm font-bold text-white"
              onClick={() => handleNotebookSelect(selectedNotebookId)}
              type="button"
            >
              알 수 없는 노트
            </button>
          ) : null}
          {notebooks.map((notebook) => (
            <button
              aria-pressed={selectedNotebookId === notebook.id}
              className={`flex min-h-10 items-center justify-between rounded-lg px-3 text-left text-sm font-bold ${
                selectedNotebookId === notebook.id
                  ? "bg-brand-green text-white"
                  : "text-brand-muted hover:bg-brand-background"
              }`}
              key={notebook.id}
              onClick={() => handleNotebookSelect(notebook.id)}
              type="button"
            >
              <span className="truncate">{notebook.title}</span>
            </button>
          ))}
          <button
            aria-pressed={!selectedNotebookId}
            className={`flex min-h-10 items-center justify-between rounded-lg px-3 text-left text-sm font-bold ${
              !selectedNotebookId
                ? "bg-brand-green text-white"
                : "text-brand-muted hover:bg-brand-background"
            }`}
            onClick={() =>
              handleNotebookSelect(getPersistedNotebookId(UNFILED_NOTEBOOK_ID))
            }
            type="button"
          >
            미분류
          </button>
        </div>
      ) : null}
    </aside>
  );
}
