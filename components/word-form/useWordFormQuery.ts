"use client";

import { useQuery } from "@tanstack/react-query";
import { getWord } from "@/lib/words";
import { getWordFormErrorMessage } from "@/components/word-form/word-form-errors";

type UseWordFormQueryInput = {
  isEdit: boolean;
  uid?: string;
  wordId?: string;
};

function createNotFoundError() {
  return Object.assign(new Error("word not found"), {
    code: "not-found",
  });
}

async function getEditableWord(wordId: string, uid: string) {
  const word = await getWord(wordId);

  if (!word || word.uid !== uid) {
    throw createNotFoundError();
  }

  return word;
}

/**
 * 단어 수정 화면에서 필요한 기존 단어 데이터를 TanStack Query로 불러옵니다.
 *
 * @param input - 수정할 단어 조회에 필요한 조건입니다.
 * @param input.isEdit - 현재 폼이 수정 모드인지 여부입니다.
 * @param input.wordId - 수정할 단어 ID입니다.
 * @param input.uid - 현재 로그인한 사용자 ID입니다.
 * @returns 조회된 단어, 로딩 상태, 사용자용 에러 메시지를 반환합니다.
 */
export function useWordFormQuery({
  isEdit,
  uid,
  wordId,
}: UseWordFormQueryInput) {
  const wordQuery = useQuery({
    queryKey: ["wordForm", uid ?? "", wordId ?? ""],
    enabled: isEdit && Boolean(uid && wordId),
    queryFn: () => getEditableWord(wordId ?? "", uid ?? ""),
  });

  return {
    errorMessage: wordQuery.error
      ? getWordFormErrorMessage(wordQuery.error, "load")
      : "",
    isLoading: isEdit && (!uid || wordQuery.isLoading),
    word: wordQuery.data ?? null,
  };
}
