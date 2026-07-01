"use client";

import { languageOptions } from "@/lib/languages";
import type { Language } from "@/types/language";

type WordLanguageTabsProps = {
  activeLanguage: Language;
  enabledLanguages: Language[];
  onLanguageChange: (language: Language) => void;
};

/**
 * 단어 목록에서 사용할 언어 탭을 렌더링합니다.
 *
 * @param props - 언어 탭에 필요한 속성입니다.
 * @param props.activeLanguage - 현재 선택된 언어입니다.
 * @param props.enabledLanguages - 사용자가 활성화한 언어 목록입니다.
 * @param props.onLanguageChange - 언어 탭을 눌렀을 때 호출되는 콜백입니다.
 * @returns 활성화된 언어들만 탭 형태로 렌더링합니다.
 */
export function WordLanguageTabs({
  activeLanguage,
  enabledLanguages,
  onLanguageChange,
}: WordLanguageTabsProps) {
  const languageGridClass =
    enabledLanguages.length >= 3
      ? "grid-cols-3"
      : enabledLanguages.length === 2
        ? "grid-cols-2"
        : "grid-cols-1";

  return (
    <div className={`grid gap-2 ${languageGridClass}`}>
      {languageOptions
        .filter((language) => enabledLanguages.includes(language.code))
        .map((language) => (
          <button
            aria-pressed={activeLanguage === language.code}
            className={`min-h-10 rounded-md text-sm font-bold ${
              activeLanguage === language.code
                ? "bg-slate-950 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
            key={language.code}
            onClick={() => onLanguageChange(language.code)}
            type="button"
          >
            <span aria-hidden="true">{language.flag}</span> {language.label}
          </button>
        ))}
    </div>
  );
}
