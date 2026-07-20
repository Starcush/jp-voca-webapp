"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { buildWordListHref } from "@/components/words/word-list-links";
import type { Language } from "@/types/language";

type WordListQuickActionsProps = {
  language: Language;
  notebookId?: string;
};

/**
 * 단어 목록에서 현재 언어와 노트를 유지한 채 단어 추가 화면으로 이동하는 플로팅 액션입니다.
 *
 * @param props - 현재 목록의 언어와 선택 노트입니다.
 * @param props.language - 링크에 유지할 현재 언어입니다.
 * @param props.notebookId - 링크에 유지할 선택 노트 ID입니다.
 * @returns 단어 추가 플로팅 액션 버튼을 렌더링합니다.
 */
export function WordListQuickActions({
  language,
  notebookId,
}: WordListQuickActionsProps) {
  return (
    <Link
      aria-label="현재 노트에 단어 추가"
      className="fixed bottom-20 right-4 z-20 grid h-12 w-12 place-items-center rounded-full bg-brand-green text-white shadow-lg shadow-orange-900/20 md:bottom-6"
      href={buildWordListHref({
        language,
        notebookId,
        path: "/words/new",
      })}
    >
      <Plus aria-hidden="true" className="h-6 w-6" strokeWidth={2.5} />
    </Link>
  );
}
