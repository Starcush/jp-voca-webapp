"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { languageOptions } from "@/lib/languages";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";

type AppFrameLanguageMenuProps = {
  activeLanguage: Language;
};

function getEnabledLanguages(activeLanguage: Language, enabledLanguages?: Language[]) {
  const validLanguages =
    enabledLanguages?.filter((language) =>
      languageOptions.some((option) => option.code === language),
    ) ?? [];

  if (validLanguages.includes(activeLanguage)) {
    return validLanguages;
  }

  return [activeLanguage, ...validLanguages];
}

/**
 * 공통 앱 헤더에서 현재 학습 언어를 국기 버튼과 드롭다운으로 전환합니다.
 *
 * @param props - 현재 헤더에 표시할 학습 언어입니다.
 * @param props.activeLanguage - 현재 URL과 화면에서 선택된 언어 코드입니다.
 * @returns 언어 국기 버튼, 활성 언어 목록, 언어 관리 링크를 렌더링합니다.
 */
export function AppFrameLanguageMenu({
  activeLanguage,
}: AppFrameLanguageMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();
  const activeLanguageOption =
    languageOptions.find((language) => language.code === activeLanguage) ??
    languageOptions[0];
  const enabledLanguages = getEnabledLanguages(
    activeLanguage,
    session?.enabledLanguages,
  );

  function handleLanguageSelect(nextLanguage: Language) {
    setIsOpen(false);

    if (nextLanguage === activeLanguage) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", nextLanguage);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="relative flex shrink-0 items-center">
      <button
        aria-expanded={isOpen}
        aria-label="학습 언어 선택"
        className="grid h-10 w-10 place-items-center rounded-lg border border-brand-border bg-white text-lg shadow-sm"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span aria-hidden="true">{activeLanguageOption.flag}</span>
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-12 z-30 w-48 rounded-xl border border-brand-border bg-white p-2 text-brand-text shadow-lg">
          <div className="grid gap-1">
            {languageOptions
              .filter((language) => enabledLanguages.includes(language.code))
              .map((language) => (
                <button
                  aria-pressed={activeLanguage === language.code}
                  className={`flex min-h-10 items-center justify-between rounded-lg px-3 text-sm font-bold ${
                    activeLanguage === language.code
                      ? "bg-brand-green text-white"
                      : "text-brand-muted hover:bg-brand-background"
                  }`}
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  type="button"
                >
                  <span>
                    <span aria-hidden="true">{language.flag}</span>{" "}
                    {language.label}
                  </span>
                  {activeLanguage === language.code ? (
                    <span aria-hidden="true">✓</span>
                  ) : null}
                </button>
              ))}
          </div>
          <Link
            className="mt-2 grid min-h-10 place-items-center rounded-lg border border-brand-border text-sm font-bold text-brand-muted"
            href="/settings"
          >
            언어 관리
          </Link>
        </div>
      ) : null}
    </div>
  );
}
