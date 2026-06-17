export const APP_SESSION_STORAGE_KEY = "jp-voca-webapp.session";
export const APP_SESSION_CHANGE_EVENT = "jp-voca-webapp.session-change";

export type AppSession = {
  uid: string;
  username: string;
};

export function readStoredSession(): AppSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(APP_SESSION_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    const session = JSON.parse(rawSession) as AppSession;
    return session.uid && session.username ? session : null;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function storeSession(session: AppSession) {
  window.localStorage.setItem(APP_SESSION_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(APP_SESSION_CHANGE_EVENT));
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(APP_SESSION_STORAGE_KEY);
  window.dispatchEvent(new Event(APP_SESSION_CHANGE_EVENT));
}

