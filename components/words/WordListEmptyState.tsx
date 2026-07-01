"use client";

import Link from "next/link";
import { WordLanguageTabs } from "@/components/words/WordLanguageTabs";
import type { WordLanguageOption } from "@/components/words/types";
import type { Language } from "@/types/language";

type WordListEmptyStateProps = {
  activeLanguage: Language;
  activeLanguageOption: WordLanguageOption;
  enabledLanguages: Language[];
  onLanguageChange: (language: Language) => void;
  wordCountLabel: string;
};

/**
 * 저장된 단어가 없을 때 첫 단어 추가 액션을 안내합니다.
 *
 * @param props - 빈 상태 화면에 필요한 언어와 카운트 정보입니다.
 * @returns 언어 탭, 단어 개수, 첫 단어 추가/사진 가져오기 액션을 렌더링합니다.
 */
export function WordListEmptyState({
  activeLanguage,
  activeLanguageOption,
  enabledLanguages,
  onLanguageChange,
  wordCountLabel,
}: WordListEmptyStateProps) {
  return (
    <section className="flex flex-1 flex-col gap-6 pt-3">
      <div>
        <WordLanguageTabs
          activeLanguage={activeLanguage}
          enabledLanguages={enabledLanguages}
          onLanguageChange={onLanguageChange}
        />
        <p className="mt-2 text-xs font-bold text-slate-500">
          {wordCountLabel}
        </p>
      </div>
      <div className="flex flex-col items-center gap-4 pt-8 text-center">
        <div>
          <p className="text-lg font-bold text-slate-950">
            {activeLanguageOption.label} 첫 단어를 추가해볼까요?
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {activeLanguageOption.termLabel}만 입력해도 저장할 수 있습니다.
          </p>
        </div>
        <Link
          className="min-h-12 rounded-lg bg-slate-950 px-5 py-3 text-base font-bold text-white"
          href={`/words/new?lang=${activeLanguage}`}
        >
          첫 단어 추가
        </Link>
        <Link
          className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700"
          href={`/words/import?lang=${activeLanguage}`}
        >
          사진에서 가져오기
        </Link>
      </div>
    </section>
  );
}
