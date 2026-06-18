import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseAuth } from "@/lib/firebase";
import { userDocument } from "@/lib/users";
import type { AppSession } from "@/lib/session";

export type AccountAuthMode = "sign-in" | "sign-up";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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
    return "이미 가입된 이메일입니다. 로그인으로 들어가주세요.";
  }

  if (
    code === "auth/invalid-credential" ||
    code === "auth/user-not-found" ||
    code === "auth/wrong-password"
  ) {
    return "이메일 또는 비밀번호가 맞지 않습니다.";
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

function validateAccountInput(email: string, password: string) {
  validateEmailInput(email);

  if (password.length < 6) {
    throw new Error("비밀번호는 6자 이상으로 입력해주세요.");
  }
}

function validateEmailInput(email: string) {
  if (!email) {
    throw new Error("이메일을 입력해주세요.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("올바른 이메일을 입력해주세요.");
  }
}

function getDefaultUsername(email: string) {
  return email.split("@").at(0) || "my-voca";
}

async function upsertUserDocument(uid: string, email: string) {
  const userRef = userDocument(uid);
  const userSnapshot = await getDoc(userRef);
  const userData = userSnapshot.data();
  const username = userData?.username ?? getDefaultUsername(email);

  await setDoc(
    userRef,
    {
      uid,
      email,
      username,
      ...(userSnapshot.exists() ? {} : { createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  return {
    defaultLanguage: userData?.defaultLanguage,
    enabledLanguages: userData?.enabledLanguages,
    username,
  };
}

export async function authenticateWithAccount(
  emailInput: string,
  password: string,
  mode: AccountAuthMode,
  rememberLogin = true,
): Promise<AppSession> {
  const email = normalizeEmail(emailInput);

  validateAccountInput(email, password);

  try {
    const auth = getFirebaseAuth();
    await setPersistence(
      auth,
      rememberLogin ? browserLocalPersistence : browserSessionPersistence,
    );
    const credential =
      mode === "sign-up"
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
    const { user } = credential;

    if (mode === "sign-up") {
      await updateProfile(user, {
        displayName: getDefaultUsername(email),
      });
    }

    const appUser = await upsertUserDocument(user.uid, email);

    return {
      authProvider: "firebase-password",
      defaultLanguage: appUser.defaultLanguage,
      enabledLanguages: appUser.enabledLanguages,
      rememberLogin,
      uid: user.uid,
      username: appUser.username,
    };
  } catch (error) {
    throw new Error(getAuthErrorMessage(error, mode));
  }
}

export async function sendAccountPasswordReset(emailInput: string) {
  const email = normalizeEmail(emailInput);

  validateEmailInput(email);

  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email);
  } catch (error) {
    const code = getErrorCode(error);

    if (code === "auth/operation-not-allowed") {
      throw new Error("Firebase Authentication에서 Email/Password 로그인을 켜주세요.");
    }

    throw new Error("비밀번호 재설정 메일을 보내지 못했습니다.");
  }
}
