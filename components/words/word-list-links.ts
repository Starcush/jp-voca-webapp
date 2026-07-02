import type { Language } from "@/types/language";

/**
 * 단어 목록 관련 페이지 URL을 만들 때 사용하는 입력값입니다.
 *
 * @property language - URL에 넣을 현재 언어입니다.
 * @property notebookId - URL에 유지할 선택 노트 ID입니다.
 * @property path - 이동할 단어장 하위 경로입니다.
 */
export type WordListLinkInput = {
  language: Language;
  notebookId?: string;
  path: "/words" | "/words/import" | "/words/new";
};

/**
 * 언어와 선택 노트를 유지하는 단어장 URL을 생성합니다.
 *
 * @param input - 생성할 URL의 경로, 언어, 선택 노트입니다.
 * @returns query string이 붙은 단어장 URL입니다.
 */
export function buildWordListHref({
  language,
  notebookId,
  path,
}: WordListLinkInput) {
  const params = new URLSearchParams({ lang: language });

  if (notebookId) {
    params.set("notebookId", notebookId);
  }

  return `${path}?${params.toString()}`;
}
