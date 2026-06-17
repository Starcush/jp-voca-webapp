export const USERS_COLLECTION = "users";
export const WORDS_COLLECTION = "words";

export function userPath(uid: string) {
  return `${USERS_COLLECTION}/${uid}`;
}

export function wordPath(wordId: string) {
  return `${WORDS_COLLECTION}/${wordId}`;
}

