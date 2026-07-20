"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { buildWordListHref } from "@/components/words/word-list-links";
import type { Language } from "@/types/language";

type ReviewEmptyStateProps = {
  emptyMessage: string;
  language: Language;
  languageLabel: string;
  modeTabs: ReactNode;
  notebookId?: string;
};

/**
 * 현재 복습 모드에서 보여줄 단어가 없을 때의 빈 상태를 렌더링합니다.
 *
 * @param props - 빈 상태 화면에 필요한 언어와 메시지 정보입니다.
 * @param props.emptyMessage - 복습 모드에 맞는 빈 상태 제목입니다.
 * @param props.language - 단어 추가 링크에 사용할 언어 코드입니다.
 * @param props.languageLabel - 현재 복습 언어의 표시 이름입니다.
 * @param props.modeTabs - 복습 모드 선택 탭입니다.
 * @param props.notebookId - 단어 추가 링크에 유지할 노트 ID입니다.
 * @returns 빈 상태 안내와 단어 추가 링크를 렌더링합니다.
 */
export function ReviewEmptyState({
  emptyMessage,
  language,
  languageLabel,
  modeTabs,
  notebookId,
}: ReviewEmptyStateProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-4 pb-20 text-center md:pb-0">
      <div className="w-full">
        {modeTabs}
      </div>
      <div className="rounded-xl border border-brand-border bg-white px-5 py-6 shadow-[0_2px_10px_rgba(36,28,61,0.05)]">
        <p className="text-lg font-black text-brand-text">
          {languageLabel} {emptyMessage}
        </p>
        <p className="mt-2 text-sm font-medium leading-6 text-brand-muted">
          다른 복습 모드를 선택하거나 단어를 추가해보세요.
        </p>
      </div>
      <Link
        className="min-h-12 rounded-lg bg-primary px-5 py-3 text-base font-black text-white shadow-sm"
        href={buildWordListHref({
          language,
          notebookId,
          path: "/words/new",
        })}
      >
        단어 추가
      </Link>
    </section>
  );
}
