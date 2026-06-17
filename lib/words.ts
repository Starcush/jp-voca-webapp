import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { WORDS_COLLECTION, wordPath } from "@/lib/firestore-paths";
import type { Word } from "@/types/word";

export function wordsCollection() {
  return collection(getDb(), WORDS_COLLECTION) as CollectionReference<Omit<Word, "id">>;
}

export function wordDocument(wordId: string) {
  return doc(getDb(), wordPath(wordId)) as DocumentReference<Omit<Word, "id">>;
}

