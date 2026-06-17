import {
  addDoc,
  collection,
  deleteField,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  type CollectionReference,
  type DocumentReference,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { WORDS_COLLECTION, wordPath } from "@/lib/firestore-paths";
import type { NewWordInput, UpdateWordInput, Word, WordStatus } from "@/types/word";

const WORDS_PAGE_SIZE = 10;

export type WordsPageCursor = QueryDocumentSnapshot<Omit<Word, "id">>;

function buildCreateWordData(uid: string, input: NewWordInput) {
  return {
    kanji: input.kanji,
    ...(input.yomikataFurigana ? { yomikataFurigana: input.yomikataFurigana } : {}),
    ...(input.meaning ? { meaning: input.meaning } : {}),
    ...(input.exampleSentence ? { exampleSentence: input.exampleSentence } : {}),
    ...(input.exampleTranslation ? { exampleTranslation: input.exampleTranslation } : {}),
    uid,
    status: "unknown" as const,
    lastSeenAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function buildUpdateWordData(input: UpdateWordInput) {
  const hasYomikataFurigana = Object.prototype.hasOwnProperty.call(
    input,
    "yomikataFurigana",
  );
  const hasMeaning = Object.prototype.hasOwnProperty.call(input, "meaning");
  const hasExampleSentence = Object.prototype.hasOwnProperty.call(
    input,
    "exampleSentence",
  );
  const hasExampleTranslation = Object.prototype.hasOwnProperty.call(
    input,
    "exampleTranslation",
  );

  return {
    ...(input.kanji !== undefined ? { kanji: input.kanji } : {}),
    ...(hasYomikataFurigana
      ? { yomikataFurigana: input.yomikataFurigana ?? deleteField() }
      : {}),
    ...(hasMeaning ? { meaning: input.meaning ?? deleteField() } : {}),
    ...(hasExampleSentence
      ? { exampleSentence: input.exampleSentence ?? deleteField() }
      : {}),
    ...(hasExampleTranslation
      ? { exampleTranslation: input.exampleTranslation ?? deleteField() }
      : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.lastSeenAt !== undefined ? { lastSeenAt: input.lastSeenAt } : {}),
    updatedAt: serverTimestamp(),
  };
}

export function wordsCollection() {
  return collection(getDb(), WORDS_COLLECTION) as CollectionReference<Omit<Word, "id">>;
}

export function wordDocument(wordId: string) {
  return doc(getDb(), wordPath(wordId)) as DocumentReference<Omit<Word, "id">>;
}

export async function listWordsPage(uid: string, cursor?: WordsPageCursor | null) {
  const constraints = [
    where("uid", "==", uid),
    orderBy("createdAt", "desc"),
    limit(WORDS_PAGE_SIZE + 1),
  ];
  const snapshot = await getDocs(
    query(
      wordsCollection(),
      ...(cursor ? [...constraints, startAfter(cursor)] : constraints),
    ),
  );
  const pageSnapshots = snapshot.docs.slice(0, WORDS_PAGE_SIZE);
  const words = pageSnapshots.map((wordSnapshot) => ({
    id: wordSnapshot.id,
    ...wordSnapshot.data(),
  }));

  return {
    words,
    cursor: pageSnapshots.at(-1) ?? null,
    hasMore: snapshot.docs.length > WORDS_PAGE_SIZE,
  };
}

export async function getWord(wordId: string) {
  const snapshot = await getDoc(wordDocument(wordId));

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function createWord(uid: string, input: NewWordInput) {
  const wordRef = await addDoc(wordsCollection(), buildCreateWordData(uid, input));

  return wordRef.id;
}

export async function updateWord(wordId: string, input: UpdateWordInput) {
  await updateDoc(wordDocument(wordId), buildUpdateWordData(input));
}

export async function updateWordStudyStatus(wordId: string, status: WordStatus) {
  const lastSeenAt = Timestamp.now();

  await updateWord(wordId, {
    status,
    lastSeenAt,
  });

  return lastSeenAt;
}

export async function deleteWord(wordId: string) {
  await deleteDoc(wordDocument(wordId));
}
