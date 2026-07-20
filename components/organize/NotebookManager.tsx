"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useNotebooksQuery } from "@/components/notebooks/useNotebooksQuery";
import { useWordOrganizerQuery } from "@/components/organize/useWordOrganizerQuery";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";
import type { Notebook } from "@/types/notebook";

type NotebookManagerProps = {
  language: Language;
};

type NotebookModalState =
  | {
      mode: "create";
      notebook?: never;
    }
  | {
      mode: "edit";
      notebook: Notebook;
    };

function getNotebookWordCounts(words: Array<{ notebookId?: string }>) {
  return words.reduce<Record<string, number>>((counts, word) => {
    if (!word.notebookId) {
      return counts;
    }

    counts[word.notebookId] = (counts[word.notebookId] ?? 0) + 1;

    return counts;
  }, {});
}

/**
 * 노트 생성, 목록 확인, 이름 수정, 삭제를 처리하는 노트 관리 화면입니다.
 *
 * @param props - 현재 관리할 학습 언어입니다.
 * @param props.language - 노트 목록과 생성 입력에 사용할 언어 코드입니다.
 * @returns 노트 목록, 노트 생성 버튼, 노트 수정/삭제 모달을 렌더링합니다.
 */
export function NotebookManager({ language }: NotebookManagerProps) {
  const session = useSession() ?? null;
  const [modalState, setModalState] = useState<NotebookModalState | null>(null);
  const [titleInput, setTitleInput] = useState("");
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
    language,
    session,
  });
  const {
    isLoading: isLoadingWords,
    words,
  } = useWordOrganizerQuery({
    language,
    session,
  });
  const notebookWordCounts = useMemo(
    () => getNotebookWordCounts(words),
    [words],
  );
  const isMutating =
    isCreatingNotebook || isUpdatingNotebook || isDeletingNotebook;
  const isLoading = isLoadingNotebooks || isLoadingWords;
  const modalTitle =
    modalState?.mode === "edit" ? "노트 수정" : "새 노트";

  function openCreateModal() {
    setTitleInput("");
    setModalState({ mode: "create" });
  }

  function openEditModal(notebook: Notebook) {
    setTitleInput(notebook.title);
    setModalState({ mode: "edit", notebook });
  }

  function closeModal() {
    if (isMutating) {
      return;
    }

    resetModal();
  }

  function resetModal() {
    setModalState(null);
    setTitleInput("");
  }

  async function handleSaveNotebook() {
    const title = titleInput.trim();

    if (!modalState || !title) {
      return;
    }

    if (modalState.mode === "create") {
      await createNotebook({
        language,
        title,
      });
    } else {
      await updateNotebook({
        input: { title },
        notebookId: modalState.notebook.id,
      });
    }

    resetModal();
  }

  async function handleDeleteNotebook() {
    if (!modalState || modalState.mode !== "edit") {
      return;
    }

    const shouldDelete = confirm(
      `"${modalState.notebook.title}" 노트를 삭제할까요?\n노트 안의 단어는 미분류로 이동합니다.`,
    );

    if (!shouldDelete) {
      return;
    }

    await deleteNotebook({
      notebookId: modalState.notebook.id,
    });
    resetModal();
  }

  return (
    <>
      <LoadingOverlay
        message={
          isMutating
            ? "노트를 저장하는 중"
            : "노트 목록을 불러오는 중"
        }
        show={isLoading || isMutating}
      />
      <section className="min-h-[calc(100dvh-9rem)] pb-24">
        {notebooksErrorMessage ? (
          <p className="mb-3 rounded-lg bg-status-negative-bg px-3 py-2 text-sm font-semibold text-status-negative">
            {notebooksErrorMessage}
          </p>
        ) : null}

        <div className="-mx-4 border-y border-brand-border bg-white">
          {notebooks.length > 0 ? (
            notebooks.map((notebook) => (
              <div
                className="grid min-h-[68px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-brand-border px-6 py-3 last:border-b-0"
                key={notebook.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-[17px] font-bold leading-6 text-word-kanji">
                    {notebook.title}
                  </p>
                  <p className="mt-0.5 text-[13px] font-medium leading-5 text-word-meaning">
                    {notebookWordCounts[notebook.id] ?? 0}개
                  </p>
                </div>
                <button
                  aria-label={`${notebook.title} 수정`}
                  className="grid h-10 w-10 place-items-center rounded-lg text-brand-muted"
                  onClick={() => openEditModal(notebook)}
                  type="button"
                >
                  <Pencil
                    aria-hidden="true"
                    className="h-4 w-4"
                    strokeWidth={2.2}
                  />
                </button>
              </div>
            ))
          ) : (
            <div className="grid min-h-32 place-items-center px-6 py-10 text-center">
              <p className="text-sm font-semibold text-brand-muted">
                아직 만든 노트가 없습니다.
              </p>
            </div>
          )}
        </div>

        <button
          className="fixed inset-x-4 bottom-20 z-20 mx-auto grid min-h-12 max-w-md place-items-center rounded-lg border border-dashed border-brand-border-strong bg-white px-4 text-sm font-bold text-brand-text md:bottom-6"
          onClick={openCreateModal}
          type="button"
        >
          <span className="inline-flex items-center gap-1">
            <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.4} />
            새 노트
          </span>
        </button>
      </section>

      {modalState ? (
        <div className="fixed inset-0 z-40 grid place-items-end bg-black/40 px-4 pb-4 md:place-items-center">
          <section className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-brand-text">
                {modalTitle}
              </h2>
              <button
                aria-label="닫기"
                className="grid h-9 w-9 place-items-center rounded-lg text-brand-muted"
                onClick={closeModal}
                type="button"
              >
                <X aria-hidden="true" className="h-5 w-5" strokeWidth={2.2} />
              </button>
            </div>

            <label className="mt-4 grid gap-2">
              <span className="text-sm font-bold text-brand-text">노트 이름</span>
              <input
                autoFocus
                className="min-h-11 rounded-lg border-brand-border bg-white text-base"
                onChange={(event) => setTitleInput(event.target.value)}
                placeholder="예: JLPT N2"
                value={titleInput}
              />
            </label>

            <div className="mt-5 grid gap-2">
              <button
                className="min-h-11 rounded-lg bg-brand-green px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!titleInput.trim() || isMutating}
                onClick={() => void handleSaveNotebook()}
                type="button"
              >
                {modalState.mode === "edit" ? "수정하기" : "추가하기"}
              </button>
              {modalState.mode === "edit" ? (
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-brand-border bg-white px-4 text-sm font-bold text-brand-text disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isMutating}
                  onClick={() => void handleDeleteNotebook()}
                  type="button"
                >
                  <Trash2
                    aria-hidden="true"
                    className="h-4 w-4"
                    strokeWidth={2.2}
                  />
                  삭제
                </button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
