"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { Language } from "@/types/language";

type ReviewEmptyStateProps = {
  emptyMessage: string;
  language: Language;
  languageLabel: string;
  modeTabs: ReactNode;
};

/**
 * 현재 복습 모드에서 보여줄 단어가 없을 때의 빈 상태를 렌더링합니다.
 *
 * @param props - 빈 상태 화면에 필요한 언어와 메시지 정보입니다.
 * @param props.emptyMessage - 복습 모드에 맞는 빈 상태 제목입니다.
 * @param props.language - 단어 추가 링크에 사용할 언어 코드입니다.
 * @param props.languageLabel - 현재 복습 언어의 표시 이름입니다.
 * @param props.modeTabs - 복습 모드 선택 탭입니다.
 * @returns 빈 상태 안내와 단어 추가 링크를 렌더링합니다.
 */
export function ReviewEmptyState({
  emptyMessage,
  language,
  languageLabel,
  modeTabs,
}: ReviewEmptyStateProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="w-full">
        {modeTabs}
      </div>
      <div>
        <p className="text-lg font-bold text-slate-950">
          {languageLabel} {emptyMessage}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          다른 복습 모드를 선택하거나 단어를 추가해보세요.
        </p>
      </div>
      <Link
        className="min-h-12 rounded-lg bg-slate-950 px-5 py-3 text-base font-bold text-white"
        href={`/words/new?lang=${language}`}
      >
        단어 추가
      </Link>
    </section>
  );
}
