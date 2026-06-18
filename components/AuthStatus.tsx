"use client";

import Link from "next/link";
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
    <div className="flex items-center gap-2">
      <Link
        className="grid min-h-10 place-items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600"
        href="/settings"
      >
        설정
      </Link>
      <button
        aria-label={`${session.username} 계정 로그아웃`}
        className="grid min-h-10 place-items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-500 disabled:cursor-not-allowed disabled:opacity-60"
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
        {isSigningOut ? "나가는 중" : "로그아웃"}
      </button>
    </div>
  );
}
