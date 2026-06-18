"use client";

import { useSyncExternalStore } from "react";
import {
  APP_SESSION_CHANGE_EVENT,
  APP_SESSION_STORAGE_KEY,
  type AppSession,
} from "@/lib/session";

let cachedRawSession: string | null = null;
let cachedSession: AppSession | null = null;

function isAppSession(session: Partial<AppSession>): session is AppSession {
  return (
    session.authProvider === "firebase-password" &&
    Boolean(session.uid) &&
    Boolean(session.username)
  );
}

function subscribeToSession(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(APP_SESSION_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(APP_SESSION_CHANGE_EVENT, callback);
  };
}

function getServerSessionSnapshot(): AppSession | null | undefined {
  return undefined;
}

function getSessionSnapshot(): AppSession | null {
  const rawSession = window.localStorage.getItem(APP_SESSION_STORAGE_KEY);

  if (!rawSession) {
    cachedRawSession = null;
    cachedSession = null;
    return null;
  }

  if (rawSession === cachedRawSession) {
    return cachedSession;
  }

  try {
    const session = JSON.parse(rawSession) as AppSession;
    cachedRawSession = rawSession;
    cachedSession = isAppSession(session) ? session : null;
    return cachedSession;
  } catch {
    cachedRawSession = rawSession;
    cachedSession = null;
    return null;
  }
}

export function useSession() {
  return useSyncExternalStore(
    subscribeToSession,
    getSessionSnapshot,
    getServerSessionSnapshot,
  );
}
