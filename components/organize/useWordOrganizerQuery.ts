"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listNotebooks } from "@/lib/notebooks";
import type { AppSession } from "@/lib/session";
import { listAllWords, updateWordsNotebook } from "@/lib/words";
import type { Language } from "@/types/language";

function getOrganizerQueryKey(uid: string, language: Language) {
  return ["wordOrganizer", uid, language] as const;
}

function getOrganizerErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;

    if (code === "permission-denied") {
      return "단어를 이동할 권한이 없습니다. Firestore Rules가 반영됐는지 확인해주세요.";
    }
  }

  return "단어 정리 데이터를 불러오지 못했습니다.";
}

/**
 * 단어 정리 화면에서 필요한 단어/노트 조회와 단어 이동 mutation을 관리합니다.
 *
 * @param input - 조회와 이동에 필요한 세션과 언어입니다.
 * @param input.language - 정리할 단어의 언어입니다.
 * @param input.session - 현재 로그인 세션입니다.
 * @returns 단어/노트 목록, 로딩/에러 상태, 단어 이동 액션을 반환합니다.
 */
export function useWordOrganizerQuery({
  language,
  session,
}: {
  language: Language;
  session: AppSession | null;
}) {
  const queryClient = useQueryClient();
  const uid = session?.uid ?? "";
  const organizerQuery = useQuery({
    queryKey: getOrganizerQueryKey(uid, language),
    enabled: Boolean(session?.uid && session.defaultLanguage),
    queryFn: async () => {
      const [words, notebooks] = await Promise.all([
        listAllWords(uid, language),
        listNotebooks(uid, language),
      ]);

      return { notebooks, words };
    },
  });
  const moveWordsMutation = useMutation({
    mutationFn: ({
      notebookId,
      wordIds,
    }: {
      notebookId?: string;
      wordIds: string[];
    }) => updateWordsNotebook(wordIds, notebookId),
    onError: (error) => {
      toast.error(getOrganizerErrorMessage(error));
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getOrganizerQueryKey(uid, language),
        }),
        queryClient.invalidateQueries({
          queryKey: ["words"],
        }),
      ]);
      toast.success(`${variables.wordIds.length}개 단어를 이동했습니다.`);
    },
  });

  return {
    errorMessage: organizerQuery.error
      ? getOrganizerErrorMessage(organizerQuery.error)
      : "",
    isLoading: organizerQuery.isLoading,
    isMovingWords: moveWordsMutation.isPending,
    moveWords: moveWordsMutation.mutateAsync,
    notebooks: organizerQuery.data?.notebooks ?? [],
    refetch: organizerQuery.refetch,
    words: organizerQuery.data?.words ?? [],
  };
}
