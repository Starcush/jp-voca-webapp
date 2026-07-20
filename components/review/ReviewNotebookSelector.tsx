"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  NotebookDropdown,
  type NotebookDropdownOption,
} from "@/components/notebooks/NotebookDropdown";
import { UNFILED_NOTEBOOK_ID } from "@/components/notebooks/notebook-constants";
import { useNotebooksQuery } from "@/components/notebooks/useNotebooksQuery";
import { useAppRouteTransition } from "@/components/AppRouteTransition";
import { buildReviewHref } from "@/components/review/review-links";
import type { AppSession } from "@/lib/session";
import type { Language } from "@/types/language";

type ReviewNotebookSelectorProps = {
  language: Language;
  reviewTotalCount: number;
  selectedNotebookId?: string;
  session: AppSession | null;
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
 * 복습 화면에서 현재 복습할 노트 범위를 선택하는 드롭다운을 렌더링합니다.
 *
 * @param props - 현재 언어, 선택 노트, 복습 후보 개수와 세션입니다.
 * @param props.language - 복습할 언어입니다.
 * @param props.reviewTotalCount - 현재 선택 범위의 복습 후보 개수입니다.
 * @param props.selectedNotebookId - 현재 선택된 노트 ID입니다. 없으면 전체 복습입니다.
 * @param props.session - 노트 목록 조회에 사용할 로그인 세션입니다.
 * @returns 공통 노트 드롭다운으로 복습 범위 선택 UI를 렌더링합니다.
 */
export function ReviewNotebookSelector({
  language,
  reviewTotalCount,
  selectedNotebookId,
  session,
}: ReviewNotebookSelectorProps) {
  const router = useRouter();
  const { startNavigation } = useAppRouteTransition();
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const { isLoadingNotebooks, notebooks, notebooksErrorMessage } =
    useNotebooksQuery({
      language,
      session,
    });
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

  function handleNotebookSelect(nextNotebookId?: string) {
    startNavigation();
    router.push(buildReviewHref({ language, notebookId: nextNotebookId }));
  }

  return (
    <NotebookDropdown
      ariaLabel="복습 노트 선택"
      buttonLabel={notebookTitle}
      buttonMeta={`복습 ${reviewTotalCount}개`}
      className="z-20"
      errorMessage={notebooksErrorMessage}
      isLoading={isLoadingNotebooks}
      isOpen={isNotebookOpen}
      label="복습 노트"
      onOpenChange={setIsNotebookOpen}
      onSelect={handleNotebookSelect}
      options={notebookOptions}
      selectedKey={selectedNotebookId ?? "all"}
    />
  );
}
