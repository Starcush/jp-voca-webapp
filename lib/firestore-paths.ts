export const USERS_COLLECTION = "users";
export const WORDS_COLLECTION = "words";

/**
 * 단어장 노트 문서를 저장하는 Firestore 컬렉션 이름입니다.
 */
export const NOTEBOOKS_COLLECTION = "notebooks";

export function userPath(uid: string) {
  return `${USERS_COLLECTION}/${uid}`;
}

export function wordPath(wordId: string) {
  return `${WORDS_COLLECTION}/${wordId}`;
}

/**
 * 단어장 노트 문서 경로를 반환합니다.
 *
 * @param notebookId - 경로를 만들 노트 문서 ID입니다.
 * @returns Firestore 노트 문서 경로입니다.
 */
export function notebookPath(notebookId: string) {
  return `${NOTEBOOKS_COLLECTION}/${notebookId}`;
}
