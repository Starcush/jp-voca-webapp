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
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  function handleLanguageToggle(language: Language) {
    setSelectedLanguages((currentLanguages) => {
      if (currentLanguages.includes(language)) {
        return currentLanguages.filter((currentLanguage) => currentLanguage !== language);
      }

      return [...currentLanguages, language];
    });
  }

  async function handleSubmit() {
    if (!session) {
      return;
    }

    const defaultLanguage = selectedLanguages[0];

    if (!defaultLanguage) {
      setErrorMessage("사용할 언어를 하나 이상 선택해주세요.");
      return;
    }

    setErrorMessage("");
    setIsSaving(true);

    try {
      await updateUserLanguageSettings(session.uid, selectedLanguages);
      storeSession({
        ...session,
        defaultLanguage,
        enabledLanguages: selectedLanguages,
      });
      router.replace(`/words?lang=${defaultLanguage}`);
    } catch {
      setErrorMessage("사용 언어를 저장하지 못했습니다.");
      setIsSaving(false);
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-5 pt-8">
      <div>
        <p className="text-2xl font-bold tracking-normal text-slate-950">
          어떤 단어장을 먼저 만들까요?
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          지금 사용할 언어를 모두 선택해주세요. 첫 번째로 선택한 언어가 처음 열리는 단어장이 됩니다.
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
            aria-pressed={selectedLanguages.includes(language.code)}
            className={`grid min-h-24 grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border p-4 text-left shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${
              selectedLanguages.includes(language.code)
                ? "border-slate-950 bg-slate-50"
                : "border-slate-200 bg-white"
            }`}
            disabled={isSaving}
            key={language.code}
            onClick={() => handleLanguageToggle(language.code)}
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
                {language.summary}
              </span>
            </span>
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${
                selectedLanguages.includes(language.code)
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 text-slate-300"
              }`}
              aria-hidden="true"
            >
              {selectedLanguages.includes(language.code) ? "✓" : ""}
            </span>
          </button>
        ))}
      </div>

      <button
        className="mt-auto min-h-12 rounded-lg bg-slate-950 px-4 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSaving || selectedLanguages.length === 0}
        onClick={() => void handleSubmit()}
        type="button"
      >
        {isSaving ? "저장 중" : "단어장 시작"}
      </button>
    </section>
  );
}
