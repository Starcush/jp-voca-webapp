"use client";

import { useState, type FormEvent } from "react";
import { UNFILED_NOTEBOOK_ID } from "@/components/notebooks/notebook-constants";
import { useNotebooksQuery } from "@/components/notebooks/useNotebooksQuery";
import type { AppSession } from "@/lib/session";
import type { Language } from "@/types/language";

type NotebookShelfProps = {
  activeLanguage: Language;
  onNotebookChange: (notebookId?: string) => void;
  selectedNotebookId?: string;
  session: AppSession | null;
};

/**
 * 단어 목록에서 사용할 노트 선택과 새 노트 생성 UI를 렌더링합니다.
 *
 * @param props - 현재 언어, 선택된 노트, 세션, 노트 변경 콜백입니다.
 * @param props.activeLanguage - 노트를 조회하고 생성할 언어입니다.
 * @param props.onNotebookChange - 사용자가 노트를 선택할 때 호출되는 콜백입니다.
 * @param props.selectedNotebookId - 현재 URL에서 선택된 노트 ID입니다.
 * @param props.session - 현재 로그인 세션입니다.
 * @returns 노트 탭과 새 노트 생성 폼을 렌더링합니다.
 */
export function NotebookShelf({
  activeLanguage,
  onNotebookChange,
  selectedNotebookId,
  session,
}: NotebookShelfProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [title, setTitle] = useState("");
  const {
    createNotebook,
    deleteNotebook,
    isCreatingNotebook,
    isDeletingNotebook,
    isLoadingNotebooks,
    isUpdatingNotebook,
    notebooks,
    notebooksErrorMessage,
    updateNotebook,
  } = useNotebooksQuery({
    language: activeLanguage,
    session,
  });
  const selectedNotebook = notebooks.find(
    (notebook) => notebook.id === selectedNotebookId,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      return;
    }

    const notebookId = await createNotebook({
      language: activeLanguage,
      title: trimmedTitle,
    });

    setTitle("");
    setIsCreating(false);
    onNotebookChange(notebookId);
  }

  function handleEditStart() {
    if (!selectedNotebook) {
      return;
    }

    setEditingTitle(selectedNotebook.title);
    setIsEditing(true);
    setIsCreating(false);
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedNotebook) {
      return;
    }

    const trimmedTitle = editingTitle.trim();

    if (!trimmedTitle || trimmedTitle === selectedNotebook.title) {
      setIsEditing(false);
      return;
    }

    await updateNotebook({
      notebookId: selectedNotebook.id,
      input: {
        title: trimmedTitle,
      },
    });
    setIsEditing(false);
  }

  async function handleDeleteNotebook() {
    if (!selectedNotebook) {
      return;
    }

    const shouldDelete = confirm(
      `"${selectedNotebook.title}" 노트를 삭제할까요?\n노트 안의 단어는 삭제되지 않고 미분류로 이동합니다.`,
    );

    if (!shouldDelete) {
      return;
    }

    await deleteNotebook({
      notebookId: selectedNotebook.id,
    });
    setIsEditing(false);
    onNotebookChange(undefined);
  }

  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-950">노트</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            노트 안에서 추가한 단어는 해당 노트에 저장됩니다.
          </p>
        </div>
        <button
          className="min-h-9 shrink-0 rounded-md bg-slate-950 px-3 text-sm font-bold text-white"
          onClick={() => {
            setIsCreating((currentValue) => !currentValue);
            setIsEditing(false);
          }}
          type="button"
        >
          새 노트
        </button>
      </div>

      {isCreating ? (
        <form className="grid grid-cols-[1fr_auto] gap-2" onSubmit={handleSubmit}>
          <label>
            <span className="sr-only">새 노트 이름</span>
            <input
              className="min-h-10 w-full rounded-md border-slate-200 bg-white text-base"
              disabled={isCreatingNotebook}
              maxLength={80}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="예: 다락원 N1"
              value={title}
            />
          </label>
          <button
            className="min-h-10 rounded-md bg-blue-600 px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isCreatingNotebook || !title.trim()}
            type="submit"
          >
            만들기
          </button>
        </form>
      ) : null}

      {selectedNotebook ? (
        <div className="rounded-lg bg-slate-50 p-3">
          {isEditing ? (
            <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto]" onSubmit={handleEditSubmit}>
              <label>
                <span className="sr-only">노트 이름 수정</span>
                <input
                  className="min-h-10 w-full rounded-md border-slate-200 bg-white text-base"
                  disabled={isUpdatingNotebook}
                  maxLength={80}
                  onChange={(event) => setEditingTitle(event.target.value)}
                  value={editingTitle}
                />
              </label>
              <button
                className="min-h-10 rounded-md bg-blue-600 px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isUpdatingNotebook || !editingTitle.trim()}
                type="submit"
              >
                저장
              </button>
              <button
                className="min-h-10 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isUpdatingNotebook}
                onClick={() => setIsEditing(false)}
                type="button"
              >
                취소
              </button>
            </form>
          ) : (
            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <p className="truncate text-sm font-bold text-slate-700">
                현재 노트: {selectedNotebook.title}
              </p>
              <button
                className="min-h-9 shrink-0 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600"
                disabled={isDeletingNotebook}
                onClick={handleEditStart}
                type="button"
              >
                이름 수정
              </button>
              <button
                className="min-h-9 shrink-0 rounded-md border border-red-200 bg-white px-3 text-sm font-bold text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isDeletingNotebook}
                onClick={() => void handleDeleteNotebook()}
                type="button"
              >
                {isDeletingNotebook ? "삭제 중" : "삭제"}
              </button>
            </div>
          )}
        </div>
      ) : null}

      {notebooksErrorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          {notebooksErrorMessage}
        </p>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          aria-pressed={!selectedNotebookId}
          className={`min-h-10 shrink-0 rounded-md px-3 text-sm font-bold ${
            !selectedNotebookId
              ? "bg-slate-950 text-white"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
          onClick={() => onNotebookChange(undefined)}
          type="button"
        >
          전체
        </button>
        <button
          aria-pressed={selectedNotebookId === UNFILED_NOTEBOOK_ID}
          className={`min-h-10 shrink-0 rounded-md px-3 text-sm font-bold ${
            selectedNotebookId === UNFILED_NOTEBOOK_ID
              ? "bg-slate-950 text-white"
              : "border border-slate-200 bg-white text-slate-600"
          }`}
          onClick={() => onNotebookChange(UNFILED_NOTEBOOK_ID)}
          type="button"
        >
          미분류
        </button>
        {notebooks.map((notebook) => (
          <button
            aria-pressed={selectedNotebookId === notebook.id}
            className={`min-h-10 shrink-0 rounded-md px-3 text-sm font-bold ${
              selectedNotebookId === notebook.id
                ? "bg-slate-950 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
            key={notebook.id}
            onClick={() => onNotebookChange(notebook.id)}
            type="button"
          >
            {notebook.title}
          </button>
        ))}
        {isLoadingNotebooks ? (
          <span className="grid min-h-10 shrink-0 place-items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-400">
            불러오는 중
          </span>
        ) : null}
      </div>
    </section>
  );
}
