"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase";
import { clearStoredSession } from "@/lib/session";
import { useSession } from "@/lib/use-session";

export function AuthStatus() {
  const router = useRouter();
  const session = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!session) {
    return null;
  }

  return (
    <button
      aria-label={`${session.username} 계정 로그아웃`}
      className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={isSigningOut}
      onClick={() => {
        setIsSigningOut(true);
        void signOut(getFirebaseAuth()).finally(() => {
          clearStoredSession();
          router.replace("/login");
        });
      }}
      type="button"
    >
      <span className="max-w-24 truncate">{session.username}</span>
      <span className="text-xs font-bold text-slate-400">
        {isSigningOut ? "나가는 중" : "로그아웃"}
      </span>
    </button>
  );
}
