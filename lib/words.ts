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
import { DEFAULT_LANGUAGE, isLanguage } from "@/lib/languages";
import type { Language } from "@/types/language";
import type { NewWordInput, UpdateWordInput, Word, WordStatus } from "@/types/word";

const WORDS_PAGE_SIZE = 10;

export type WordsPageCursor = QueryDocumentSnapshot<Omit<Word, "id">>;

function buildCreateWordData(uid: string, input: NewWordInput) {
  return {
    language: input.language,
    term: input.term,
    ...(input.reading ? { reading: input.reading } : {}),
    kanji: input.term,
    ...(input.reading ? { yomikataFurigana: input.reading } : {}),
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
  const hasLanguage = Object.prototype.hasOwnProperty.call(input, "language");
  const hasReading = Object.prototype.hasOwnProperty.call(input, "reading");
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
    ...(hasLanguage ? { language: input.language } : {}),
    ...(input.term !== undefined ? { term: input.term, kanji: input.term } : {}),
    ...(hasReading
      ? {
          reading: input.reading ?? deleteField(),
          yomikataFurigana: input.reading ?? deleteField(),
        }
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

export function getWordLanguage(word: Word): Language {
  return isLanguage(word.language) ? word.language : DEFAULT_LANGUAGE;
}

export function getWordTerm(word: Word) {
  return word.term ?? word.kanji ?? "";
}

export function getWordReading(word: Word) {
  return word.reading ?? word.yomikataFurigana ?? "";
}

export function wordsCollection() {
  return collection(getDb(), WORDS_COLLECTION) as CollectionReference<Omit<Word, "id">>;
}

export function wordDocument(wordId: string) {
  return doc(getDb(), wordPath(wordId)) as DocumentReference<Omit<Word, "id">>;
}

export async function listWordsPage(
  uid: string,
  language: Language,
  cursor?: WordsPageCursor | null,
) {
  let currentCursor = cursor ?? null;
  let hasMore = false;
  const words: Word[] = [];

  do {
    const constraints = [
      where("uid", "==", uid),
      orderBy("createdAt", "desc"),
      limit(WORDS_PAGE_SIZE + 1),
    ];
    const snapshot = await getDocs(
      query(
        wordsCollection(),
        ...(currentCursor ? [...constraints, startAfter(currentCursor)] : constraints),
      ),
    );
    const pageSnapshots = snapshot.docs.slice(0, WORDS_PAGE_SIZE);
    const pageWords = pageSnapshots.map((wordSnapshot) => ({
      id: wordSnapshot.id,
      ...wordSnapshot.data(),
    }));

    words.push(
      ...pageWords.filter((word) => getWordLanguage(word) === language),
    );
    currentCursor = pageSnapshots.at(-1) ?? currentCursor;
    hasMore = snapshot.docs.length > WORDS_PAGE_SIZE;
  } while (words.length < WORDS_PAGE_SIZE && hasMore && currentCursor);

  return {
    words: words.slice(0, WORDS_PAGE_SIZE),
    cursor: currentCursor,
    hasMore,
  };
}

export async function listAllWords(uid: string, language: Language) {
  const snapshot = await getDocs(
    query(
      wordsCollection(),
      where("uid", "==", uid),
      orderBy("createdAt", "desc"),
    ),
  );

  return snapshot.docs.map((wordSnapshot) => ({
    id: wordSnapshot.id,
    ...wordSnapshot.data(),
  })).filter((word) => getWordLanguage(word) === language);
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
