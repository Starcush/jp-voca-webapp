import type { Language } from "@/types/language";

export const APP_SESSION_STORAGE_KEY = "jp-voca-webapp.session";
export const APP_SESSION_CHANGE_EVENT = "jp-voca-webapp.session-change";

export type AppSession = {
  authProvider: "firebase-password";
  defaultLanguage?: Language;
  enabledLanguages?: Language[];
  rememberLogin?: boolean;
  uid: string;
  username: string;
};

function isAppSession(session: Partial<AppSession>): session is AppSession {
  return (
    session.authProvider === "firebase-password" &&
    Boolean(session.uid) &&
    Boolean(session.username)
  );
}

export function readStoredSession(): AppSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession =
    window.localStorage.getItem(APP_SESSION_STORAGE_KEY) ??
    window.sessionStorage.getItem(APP_SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession) as AppSession;
    return isAppSession(session) ? session : null;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function storeSession(
  session: AppSession,
  rememberLogin = session.rememberLogin ?? true,
) {
  const nextSession = {
    ...session,
    rememberLogin,
  };
  const storage = rememberLogin ? window.localStorage : window.sessionStorage;

  window.localStorage.removeItem(APP_SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(APP_SESSION_STORAGE_KEY);
  storage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(nextSession));
  window.dispatchEvent(new Event(APP_SESSION_CHANGE_EVENT));
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(APP_SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(APP_SESSION_STORAGE_KEY);
  window.dispatchEvent(new Event(APP_SESSION_CHANGE_EVENT));
}
