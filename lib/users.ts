import {
  collection,
  doc,
  type CollectionReference,
  type DocumentReference,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { USERS_COLLECTION, userPath } from "@/lib/firestore-paths";
import type { AppUser } from "@/types/user";

export function usersCollection() {
  return collection(getDb(), USERS_COLLECTION) as CollectionReference<AppUser>;
}

export function userDocument(uid: string) {
  return doc(getDb(), userPath(uid)) as DocumentReference<AppUser>;
}

