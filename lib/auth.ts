import { signInAnonymously } from "firebase/auth";
import { getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseAuth } from "@/lib/firebase";
import { userDocument } from "@/lib/users";
import type { AppSession } from "@/lib/session";

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;

    return typeof code === "string" ? code : "";
  }

  return "";
}

export async function signInWithUsername(usernameInput: string): Promise<AppSession> {
  const username = normalizeUsername(usernameInput);

  if (!username) {
    throw new Error("username을 입력해주세요.");
  }

  try {
    const credential = await signInAnonymously(getFirebaseAuth());
    const uid = credential.user.uid;
    const userRef = userDocument(uid);
    const userSnapshot = await getDoc(userRef);

    await setDoc(
      userRef,
      {
        uid,
        username,
        ...(userSnapshot.exists() ? {} : { createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    return {
      authProvider: "firebase-anonymous",
      uid,
      username,
    };
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "auth/operation-not-allowed") {
      throw new Error("Firebase Authentication에서 Anonymous 로그인을 켜주세요.");
    }

    if (code === "permission-denied") {
      throw new Error("Firestore Rules가 Auth uid 기준으로 반영됐는지 확인해주세요.");
    }

    throw error;
  }
}
