"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { getFirebaseAuth } from "@/lib/firebase";
import { clearStoredSession } from "@/lib/session";
import { useSession } from "@/lib/use-session";

export function AuthStatus() {
  const router = useRouter();
  const session = useSession();

  if (!session) {
    return null;
  }

  return (
    <button
      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600"
      onClick={() => {
        void signOut(getFirebaseAuth()).finally(() => {
          clearStoredSession();
          router.replace("/login");
        });
      }}
      type="button"
    >
      {session.username}
    </button>
  );
}
