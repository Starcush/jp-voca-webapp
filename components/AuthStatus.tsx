"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getFirebaseAuth } from "@/lib/firebase";
import { DEFAULT_LANGUAGE, isLanguage, languageOptions } from "@/lib/languages";
import { clearStoredSession } from "@/lib/session";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";

function getEnabledLanguages(session: ReturnType<typeof useSession>) {
  return (
    session?.enabledLanguages?.filter((language) =>
      languageOptions.some((option) => option.code === language),
    ) ?? []
  );
}

function getReviewLanguage(
  session: ReturnType<typeof useSession>,
  searchLanguage: string | null,
): Language {
  const enabledLanguages = getEnabledLanguages(session);

  if (
    searchLanguage &&
    isLanguage(searchLanguage) &&
    (enabledLanguages.length === 0 || enabledLanguages.includes(searchLanguage))
  ) {
    return searchLanguage;
  }

  return session?.defaultLanguage ?? enabledLanguages[0] ?? DEFAULT_LANGUAGE;
}

export function AuthStatus() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!session) {
    return null;
  }

  const reviewLanguage = getReviewLanguage(session, searchParams.get("lang"));

  return (
    <div className="flex items-center gap-2">
      {reviewLanguage ? (
        <Link
          className="grid min-h-10 place-items-center rounded-md bg-slate-950 px-3 text-sm font-bold text-white"
          href={`/review?lang=${reviewLanguage}`}
        >
          복습
        </Link>
      ) : null}
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
