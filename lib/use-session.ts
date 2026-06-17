"use client";

import { useSyncExternalStore } from "react";
import {
  APP_SESSION_CHANGE_EVENT,
  readStoredSession,
  type AppSession,
} from "@/lib/session";

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

export function useSession() {
  return useSyncExternalStore(
    subscribeToSession,
    readStoredSession,
    getServerSessionSnapshot,
  );
}

