"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getFirebaseAuth } from "@/lib/firebase";
import { clearStoredSession } from "@/lib/session";
import { useSession } from "@/lib/use-session";

type RequireSessionProps = {
  children: ReactNode;
};

export function RequireSession({ children }: RequireSessionProps) {
  const router = useRouter();
  const session = useSession();
  const [authReadyUid, setAuthReadyUid] = useState("");

  useEffect(() => {
    if (session === null) {
      router.replace("/login");
    }
  }, [router, session]);

  useEffect(() => {
    if (!session) {
      return;
    }

    return onAuthStateChanged(getFirebaseAuth(), (user) => {
      if (!user || user.uid !== session.uid) {
        clearStoredSession();
        router.replace("/login");
        return;
      }

      setAuthReadyUid(user.uid);
    });
  }, [router, session]);

  if (session === undefined || (session && authReadyUid !== session.uid)) {
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
