"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { languageOptions } from "@/lib/languages";
import { storeSession } from "@/lib/session";
import { updateUserLanguageSettings } from "@/lib/users";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";

export function LanguageSetup() {
  const router = useRouter();
  const session = useSession();
  const [errorMessage, setErrorMessage] = useState("");
  const [savingLanguage, setSavingLanguage] = useState<Language | null>(null);

  async function handleLanguageSelect(language: Language) {
    if (!session) {
      return;
    }

    setErrorMessage("");
    setSavingLanguage(language);

    try {
      await updateUserLanguageSettings(session.uid, language);
      storeSession({
        ...session,
        defaultLanguage: language,
      });
      router.replace(`/words?lang=${language}`);
    } catch {
      setErrorMessage("기본 언어를 저장하지 못했습니다.");
      setSavingLanguage(null);
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-5 pt-8">
      <div>
        <p className="text-2xl font-bold tracking-normal text-slate-950">
          어떤 단어장을 먼저 만들까요?
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          첫 선택은 기본 언어로 저장됩니다. 나중에 다른 언어도 추가할 수 있습니다.
        </p>
      </div>

      {errorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-3">
        {languageOptions.map((language) => (
          <button
            className="grid min-h-24 grid-cols-[auto_1fr] items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={Boolean(savingLanguage)}
            key={language.code}
            onClick={() => void handleLanguageSelect(language.code)}
            type="button"
          >
            <span className="text-4xl" aria-hidden="true">
              {language.flag}
            </span>
            <span>
              <span className="block text-base font-bold text-slate-950">
                {language.label}
              </span>
              <span className="mt-1 block text-sm leading-6 text-slate-500">
                {savingLanguage === language.code ? "저장 중" : language.summary}
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
