/**
 * notebookId가 없는 기존 단어를 화면에서 미분류로 선택하기 위한 URL 값입니다.
 */
export const UNFILED_NOTEBOOK_ID = "unfiled";

/**
 * URL의 노트 선택값을 Firestore 단어 저장용 notebookId로 변환합니다.
 *
 * @param notebookId - URL 또는 UI에서 선택된 노트 ID입니다.
 * @returns 실제 노트 ID면 그대로, 전체/미분류면 undefined를 반환합니다.
 */
export function getPersistedNotebookId(notebookId?: string) {
  return notebookId && notebookId !== UNFILED_NOTEBOOK_ID
    ? notebookId
    : undefined;
}
