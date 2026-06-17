import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { WORDS_COLLECTION, wordPath } from "@/lib/firestore-paths";
import type { NewWordInput, UpdateWordInput, Word } from "@/types/word";

export function wordsCollection() {
  return collection(getDb(), WORDS_COLLECTION) as CollectionReference<Omit<Word, "id">>;
}

export function wordDocument(wordId: string) {
  return doc(getDb(), wordPath(wordId)) as DocumentReference<Omit<Word, "id">>;
}

export async function listWords(uid: string) {
  const snapshot = await getDocs(query(wordsCollection(), where("uid", "==", uid)));
  const words = snapshot.docs.map((wordSnapshot) => ({
    id: wordSnapshot.id,
    ...wordSnapshot.data(),
  }));

  return words.sort((a, b) => {
    const aCreatedAt = a.createdAt?.toMillis?.() ?? 0;
    const bCreatedAt = b.createdAt?.toMillis?.() ?? 0;
    return bCreatedAt - aCreatedAt;
  });
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
  const wordRef = await addDoc(wordsCollection(), {
    ...input,
    uid,
    status: "unknown",
    lastSeenAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return wordRef.id;
}

export async function updateWord(wordId: string, input: UpdateWordInput) {
  await updateDoc(wordDocument(wordId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteWord(wordId: string) {
  await deleteDoc(wordDocument(wordId));
}
