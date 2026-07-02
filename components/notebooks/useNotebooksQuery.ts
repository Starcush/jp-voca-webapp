"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createNotebook,
  deleteNotebook,
  listNotebooks,
  updateNotebook,
} from "@/lib/notebooks";
import type { AppSession } from "@/lib/session";
import { clearWordsNotebook } from "@/lib/words";
import type { Language } from "@/types/language";
import type { NewNotebookInput, UpdateNotebookInput } from "@/types/notebook";

function getNotebooksQueryKey(uid: string, language: Language) {
  return ["notebooks", uid, language] as const;
}

function getNotebookErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;

    if (code === "permission-denied") {
      return "노트 권한이 부족합니다. Firestore Rules가 반영됐는지 확인해주세요.";
    }
  }

  return "노트를 처리하지 못했습니다. 잠시 후 다시 시도해주세요.";
}

/**
 * 현재 언어의 노트 목록과 노트 생성 mutation을 관리합니다.
 *
 * @param input - 노트 조회와 생성에 필요한 세션과 언어입니다.
 * @param input.language - 조회할 노트의 언어입니다.
 * @param input.session - 현재 로그인 세션입니다.
 * @returns 노트 목록, 로딩/에러 상태, 노트 생성/수정 액션을 반환합니다.
 */
export function useNotebooksQuery({
  language,
  session,
}: {
  language: Language;
  session: AppSession | null;
}) {
  const queryClient = useQueryClient();
  const uid = session?.uid ?? "";
  const notebooksQuery = useQuery({
    queryKey: getNotebooksQueryKey(uid, language),
    enabled: Boolean(session?.uid && session.defaultLanguage),
    queryFn: () => listNotebooks(uid, language),
  });
  const createNotebookMutation = useMutation({
    mutationFn: (input: NewNotebookInput) => {
      if (!session) {
        throw new Error("로그인이 필요합니다.");
      }

      return createNotebook(session.uid, input);
    },
    onError: (error) => {
      toast.error(getNotebookErrorMessage(error));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getNotebooksQueryKey(uid, language),
      });
      toast.success("노트를 만들었습니다.");
    },
  });
  const updateNotebookMutation = useMutation({
    mutationFn: ({
      notebookId,
      input,
    }: {
      input: UpdateNotebookInput;
      notebookId: string;
    }) => updateNotebook(notebookId, input),
    onError: (error) => {
      toast.error(getNotebookErrorMessage(error));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getNotebooksQueryKey(uid, language),
      });
      toast.success("노트 이름을 수정했습니다.");
    },
  });
  const deleteNotebookMutation = useMutation({
    mutationFn: async ({
      notebookId,
    }: {
      notebookId: string;
    }) => {
      if (!session) {
        throw new Error("로그인이 필요합니다.");
      }

      await clearWordsNotebook(session.uid, language, notebookId);
      await deleteNotebook(notebookId);
    },
    onError: (error) => {
      toast.error(getNotebookErrorMessage(error));
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getNotebooksQueryKey(uid, language),
        }),
        queryClient.invalidateQueries({
          queryKey: ["words"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["reviewWords"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["wordOrganizer"],
        }),
      ]);
      toast.success("노트를 삭제했습니다. 단어는 미분류로 이동했습니다.");
    },
  });

  return {
    createNotebook: createNotebookMutation.mutateAsync,
    deleteNotebook: deleteNotebookMutation.mutateAsync,
    isCreatingNotebook: createNotebookMutation.isPending,
    isDeletingNotebook: deleteNotebookMutation.isPending,
    isLoadingNotebooks: notebooksQuery.isLoading,
    isUpdatingNotebook: updateNotebookMutation.isPending,
    notebooks: notebooksQuery.data ?? [],
    notebooksErrorMessage: notebooksQuery.error
      ? getNotebookErrorMessage(notebooksQuery.error)
      : "",
    updateNotebook: updateNotebookMutation.mutateAsync,
  };
}
