import { getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { userDocument, usersCollection } from "@/lib/users";
import type { AppSession } from "@/lib/session";

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function createUid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function signInWithUsername(usernameInput: string): Promise<AppSession> {
  const username = normalizeUsername(usernameInput);

  if (!username) {
    throw new Error("username을 입력해주세요.");
  }

  const usernameQuery = query(
    usersCollection(),
    where("username", "==", username),
    limit(1),
  );
  const snapshot = await getDocs(usernameQuery);
  const existingUser = snapshot.docs.at(0);

  if (existingUser) {
    const user = existingUser.data();
    return {
      uid: user.uid,
      username: user.username,
    };
  }

  const uid = createUid();

  await setDoc(userDocument(uid), {
    uid,
    username,
    createdAt: serverTimestamp(),
  });

  return {
    uid,
    username,
  };
}

