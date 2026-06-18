"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { createSessionFromFirebaseUser } from "@/lib/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { clearStoredSession, storeSession } from "@/lib/session";
import { useSession } from "@/lib/use-session";

type RequireSessionProps = {
  children: ReactNode;
};

export function RequireSession({ children }: RequireSessionProps) {
  const router = useRouter();
  const session = useSession();
  const [authReadyUid, setAuthReadyUid] = useState("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (session === undefined) {
      return;
    }

    let isMounted = true;

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (!isMounted) {
        return;
      }

      if (session) {
        if (!user || user.uid !== session.uid) {
          clearStoredSession();
          setIsCheckingAuth(false);
          router.replace("/login");
          return;
        }

        setAuthReadyUid(user.uid);
        setIsCheckingAuth(false);
        return;
      }

      if (!user) {
        setIsCheckingAuth(false);
        router.replace("/login");
        return;
      }

      void createSessionFromFirebaseUser(user, true)
        .then((restoredSession) => {
          if (!isMounted) {
            return;
          }

          storeSession(restoredSession, true);
          setAuthReadyUid(user.uid);
        })
        .catch(() => {
          if (!isMounted) {
            return;
          }

          clearStoredSession();
          router.replace("/login");
        })
        .finally(() => {
          if (isMounted) {
            setIsCheckingAuth(false);
          }
        });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router, session]);

  if (
    session === undefined ||
    isCheckingAuth ||
    (session && authReadyUid !== session.uid)
  ) {
    return (
      <section className="flex flex-1 items-center justify-center">
        <p className="text-sm font-semibold text-slate-500">확인 중</p>
      </section>
    );
  }

  if (!session) {
    return null;
  }

  return children;
}
