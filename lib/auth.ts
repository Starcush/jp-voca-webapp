import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseAuth } from "@/lib/firebase";
import { userDocument } from "@/lib/users";
import type { AppSession } from "@/lib/session";

export type AccountAuthMode = "sign-in" | "sign-up";

const ACCOUNT_EMAIL_DOMAIN = "jp-voca.local";

export function normalizeAccountName(accountName: string) {
  return accountName.trim().toLowerCase();
}

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;

    return typeof code === "string" ? code : "";
  }

  return "";
}

function getAuthErrorMessage(error: unknown, mode: AccountAuthMode) {
  const code = getErrorCode(error);

  if (code === "auth/email-already-in-use") {
    return "이미 있는 계정명입니다. 로그인으로 들어가주세요.";
  }

  if (
    code === "auth/invalid-credential" ||
    code === "auth/user-not-found" ||
    code === "auth/wrong-password"
  ) {
    return "계정명 또는 비밀번호가 맞지 않습니다.";
  }

  if (code === "auth/weak-password") {
    return "비밀번호는 6자 이상으로 입력해주세요.";
  }

  if (code === "auth/operation-not-allowed") {
    return "Firebase Authentication에서 Email/Password 로그인을 켜주세요.";
  }

  if (code === "permission-denied") {
    return "Firestore Rules가 Auth uid 기준으로 반영됐는지 확인해주세요.";
  }

  return mode === "sign-up"
    ? "계정을 만들지 못했습니다."
    : "로그인 중 문제가 발생했습니다.";
}

function getAccountEmail(accountName: string) {
  return `${accountName}@${ACCOUNT_EMAIL_DOMAIN}`;
}

function validateAccountInput(accountName: string, password: string) {
  if (!accountName) {
    throw new Error("계정명을 입력해주세요.");
  }

  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(accountName)) {
    throw new Error("계정명은 영문, 숫자, ., _, - 조합으로 3~32자 입력해주세요.");
  }

  if (password.length < 6) {
    throw new Error("비밀번호는 6자 이상으로 입력해주세요.");
  }
}

async function upsertUserDocument(uid: string, accountName: string) {
  const userRef = userDocument(uid);
  const userSnapshot = await getDoc(userRef);

  await setDoc(
    userRef,
    {
      uid,
      username: accountName,
      ...(userSnapshot.exists() ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function authenticateWithAccount(
  accountNameInput: string,
  password: string,
  mode: AccountAuthMode,
): Promise<AppSession> {
  const accountName = normalizeAccountName(accountNameInput);

  validateAccountInput(accountName, password);

  try {
    const auth = getFirebaseAuth();
    const email = getAccountEmail(accountName);
    const credential =
      mode === "sign-up"
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
    const { user } = credential;

    if (mode === "sign-up") {
      await updateProfile(user, {
        displayName: accountName,
      });
    }

    await upsertUserDocument(user.uid, accountName);

    return {
      authProvider: "firebase-password",
      uid: user.uid,
      username: accountName,
    };
  } catch (error) {
    throw new Error(getAuthErrorMessage(error, mode));
  }
}
