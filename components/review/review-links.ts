import type { Language } from "@/types/language";

/**
 * 복습 페이지 URL을 만들 때 사용하는 입력값입니다.
 *
 * @property language - 복습할 언어입니다.
 * @property notebookId - 복습할 노트 ID입니다.
 */
export type ReviewLinkInput = {
  language: Language;
  notebookId?: string;
};

/**
 * 언어와 선택 노트를 유지하는 복습 URL을 생성합니다.
 *
 * @param input - 복습 URL에 넣을 언어와 선택 노트입니다.
 * @returns query string이 붙은 복습 URL입니다.
 */
export function buildReviewHref({ language, notebookId }: ReviewLinkInput) {
  const params = new URLSearchParams({ lang: language });

  if (notebookId) {
    params.set("notebookId", notebookId);
  }

  return `/review?${params.toString()}`;
}
