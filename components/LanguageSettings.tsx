"use client";

import { Check, Languages } from "lucide-react";
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
    <section className="flex flex-1 flex-col gap-4 pb-16">
      <section className="grid gap-3">
        <div className="flex items-start gap-3 px-1">
          <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-background text-brand-green">
            <Languages aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div>
            <h2 className="text-lg font-extrabold tracking-normal text-brand-text">
              언어 관리
            </h2>
            <p className="mt-1 text-sm leading-6 text-brand-muted">
              단어장에 표시할 언어와 처음 열 언어를 정합니다.
            </p>
          </div>
        </div>

        {languageOptions.map((language) => {
          const isSelected = selectedLanguages.includes(language.code);
          const isDefault = defaultLanguage === language.code;

          return (
            <div
              className={`grid gap-3 rounded-xl border bg-white p-4 ${
                isSelected ? "border-brand-green" : "border-brand-border"
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
                <span className="text-3xl" aria-hidden="true">
                  {language.flag}
                </span>
                <span>
                  <span className="block text-base font-extrabold text-brand-text">
                    {language.label}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-brand-muted">
                    {language.summary}
                  </span>
                </span>
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${
                    isSelected
                      ? "bg-brand-green text-white"
                      : "border border-brand-border text-brand-muted-soft"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected ? (
                    <Check className="h-4 w-4" strokeWidth={2.4} />
                  ) : null}
                </span>
              </button>

              {isSelected ? (
                <button
                  className={`min-h-10 rounded-lg text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 ${
                    isDefault
                      ? "bg-primary-tint text-primary-text"
                      : "border border-brand-border bg-white text-brand-muted"
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
        <p className="rounded-lg bg-status-negative-bg px-3 py-2 text-sm font-semibold text-status-negative">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-lg bg-primary-tint px-3 py-2 text-sm font-bold text-primary-text">
          {successMessage}
        </p>
      ) : null}

      <button
        className="min-h-12 rounded-lg bg-primary px-4 text-base font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSaving || selectedLanguages.length === 0}
        onClick={() => void handleSave()}
        type="button"
      >
        {isSaving ? "저장 중" : "설정 저장"}
      </button>
    </section>
  );
}
