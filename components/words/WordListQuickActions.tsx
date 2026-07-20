"use client";

import Link from "next/link";
import { Camera, Plus } from "lucide-react";
import { buildWordListHref } from "@/components/words/word-list-links";
import type { Language } from "@/types/language";

type WordListQuickActionsProps = {
  language: Language;
  notebookId?: string;
};

/**
 * 단어 목록에서 현재 언어와 노트를 유지한 채 추가/가져오기 화면으로 이동하는 플로팅 액션입니다.
 *
 * @param props - 현재 목록의 언어와 선택 노트입니다.
 * @param props.language - 링크에 유지할 현재 언어입니다.
 * @param props.notebookId - 링크에 유지할 선택 노트 ID입니다.
 * @returns 단어 추가와 사진 가져오기 플로팅 액션 바를 렌더링합니다.
 */
export function WordListQuickActions({
  language,
  notebookId,
}: WordListQuickActionsProps) {
  return (
    <div className="fixed bottom-20 right-4 z-20 flex items-center gap-1 rounded-full border border-brand-border bg-white p-1 shadow-lg shadow-orange-900/10 md:bottom-6">
      <Link
        aria-label="현재 노트에 사진에서 가져오기"
        className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-black text-brand-muted hover:bg-brand-background"
        href={buildWordListHref({
          language,
          notebookId,
          path: "/words/import",
        })}
      >
        <Camera aria-hidden="true" className="h-4 w-4" strokeWidth={2.3} />
        <span>사진</span>
      </Link>
      <Link
        aria-label="현재 노트에 단어 추가"
        className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-brand-green px-3 text-xs font-black text-white"
        href={buildWordListHref({
          language,
          notebookId,
          path: "/words/new",
        })}
      >
        <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2.5} />
        <span>추가</span>
      </Link>
    </div>
  );
}
