import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { USERS_COLLECTION, userPath } from "@/lib/firestore-paths";
import type { Language } from "@/types/language";
import type { AppUser } from "@/types/user";

export function usersCollection() {
  return collection(getDb(), USERS_COLLECTION) as CollectionReference<AppUser>;
}

export function userDocument(uid: string) {
  return doc(getDb(), userPath(uid)) as DocumentReference<AppUser>;
}

export async function getUser(uid: string) {
  const snapshot = await getDoc(userDocument(uid));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}

export async function updateUserLanguageSettings(
  uid: string,
  languages: Language[],
) {
  const defaultLanguage = languages[0];

  if (!defaultLanguage) {
    throw new Error("At least one language is required.");
  }

  await updateDoc(userDocument(uid), {
    defaultLanguage,
    enabledLanguages: languages,
    updatedAt: serverTimestamp(),
  });
}
