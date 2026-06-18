"use client";

import { useState } from "react";
import { languageOptions } from "@/lib/languages";
import { storeSession } from "@/lib/session";
import { updateUserLanguageSettings } from "@/lib/users";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";

function getInitialLanguages(
  defaultLanguage?: Language,
  enabledLanguages?: Language[],
) {
  const validLanguages =
    enabledLanguages?.filter((language) =>
      languageOptions.some((option) => option.code === language),
    ) ?? [];

  if (validLanguages.length > 0) {
    return validLanguages;
  }

  return defaultLanguage ? [defaultLanguage] : [];
}

function moveLanguageToFront(languages: Language[], language: Language) {
  return [language, ...languages.filter((currentLanguage) => currentLanguage !== language)];
}

export function LanguageSettings() {
  const session = useSession();
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>(() =>
    getInitialLanguages(session?.defaultLanguage, session?.enabledLanguages),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const defaultLanguage = selectedLanguages[0];

  function handleLanguageToggle(language: Language) {
    setErrorMessage("");
    setSuccessMessage("");
    setSelectedLanguages((currentLanguages) => {
      if (!currentLanguages.includes(language)) {
        return [...currentLanguages, language];
      }

      if (currentLanguages.length === 1) {
        setErrorMessage("사용 언어는 하나 이상 필요합니다.");
        return currentLanguages;
      }

      return currentLanguages.filter((currentLanguage) => currentLanguage !== language);
    });
  }

  function handleDefaultLanguageChange(language: Language) {
    setErrorMessage("");
    setSuccessMessage("");
    setSelectedLanguages((currentLanguages) =>
      currentLanguages.includes(language)
        ? moveLanguageToFront(currentLanguages, language)
        : currentLanguages,
    );
  }

  async function handleSave() {
    if (!session) {
      return;
    }

    if (!defaultLanguage) {
      setErrorMessage("사용 언어를 하나 이상 선택해주세요.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSaving(true);

    try {
      await updateUserLanguageSettings(session.uid, selectedLanguages);
      storeSession({
        ...session,
        defaultLanguage,
        enabledLanguages: selectedLanguages,
      });
      setSuccessMessage("언어 설정을 저장했습니다.");
    } catch {
      setErrorMessage("언어 설정을 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!session) {
    return null;
  }

  return (
    <section className="flex flex-1 flex-col gap-5">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-500">계정</p>
        <p className="mt-1 truncate text-lg font-bold text-slate-950">
          {session.username}
        </p>
      </div>

      <section className="grid gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-normal text-slate-950">
            사용할 언어
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            선택한 언어만 단어장 탭에 표시됩니다.
          </p>
        </div>

        {languageOptions.map((language) => {
          const isSelected = selectedLanguages.includes(language.code);
          const isDefault = defaultLanguage === language.code;

          return (
            <div
              className={`grid gap-3 rounded-lg border p-4 ${
                isSelected ? "border-slate-950 bg-slate-50" : "border-slate-200 bg-white"
              }`}
              key={language.code}
            >
              <button
                aria-pressed={isSelected}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-4 text-left disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSaving}
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
                    isSelected
                      ? "bg-slate-950 text-white"
                      : "border border-slate-200 text-slate-300"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected ? "✓" : ""}
                </span>
              </button>

              {isSelected ? (
                <button
                  className={`min-h-10 rounded-md text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${
                    isDefault
                      ? "bg-blue-50 text-blue-700"
                      : "border border-slate-200 bg-white text-slate-600"
                  }`}
                  disabled={isSaving || isDefault}
                  onClick={() => handleDefaultLanguageChange(language.code)}
                  type="button"
                >
                  {isDefault ? "처음 열 언어" : "처음 열 언어로 설정"}
                </button>
              ) : null}
            </div>
          );
        })}
      </section>

      {errorMessage ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm font-bold text-green-700">
          {successMessage}
        </p>
      ) : null}

      <button
        className="mt-auto min-h-12 rounded-lg bg-slate-950 px-4 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSaving || selectedLanguages.length === 0}
        onClick={() => void handleSave()}
        type="button"
      >
        {isSaving ? "저장 중" : "설정 저장"}
      </button>
    </section>
  );
}
