"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
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
          router.replace("/login");
          return;
        }

        return;
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      void createSessionFromFirebaseUser(user, true)
        .then((restoredSession) => {
          if (!isMounted) {
            return;
          }

          storeSession(restoredSession, true);
        })
        .catch(() => {
          if (!isMounted) {
            return;
          }

          clearStoredSession();
          router.replace("/login");
        });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [router, session]);

  if (session === undefined) {
    return (
      <section className="flex flex-1 items-center justify-center">
        <p className="text-sm font-semibold text-slate-500">로그인 상태를 확인하는 중</p>
      </section>
    );
  }

  if (!session) {
    return null;
  }

  return children;
}
