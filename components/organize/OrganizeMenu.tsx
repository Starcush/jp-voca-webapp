"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftRight, BookOpenText, ChevronRight } from "lucide-react";
import { useNotebooksQuery } from "@/components/notebooks/useNotebooksQuery";
import { useSession } from "@/lib/use-session";
import type { Language } from "@/types/language";

type OrganizeMenuProps = {
  language: Language;
};

/**
 * 정리 탭의 랜딩 메뉴를 렌더링합니다.
 *
 * @param props - 현재 정리할 학습 언어입니다.
 * @param props.language - 메뉴 링크와 노트 수 조회에 사용할 언어 코드입니다.
 * @returns 노트 관리와 단어 관리로 이동하는 JUUIN 톤의 메뉴 리스트를 렌더링합니다.
 */
export function OrganizeMenu({ language }: OrganizeMenuProps) {
  const session = useSession() ?? null;
  const { isLoadingNotebooks, notebooks } = useNotebooksQuery({
    language,
    session,
  });
  const notebookCountLabel = isLoadingNotebooks
    ? "노트 확인 중"
    : `노트 ${notebooks.length}개`;
  const encodedLanguage = encodeURIComponent(language);

  return (
    <section>
      <div className="-mx-4 border-y border-brand-border bg-white">
        <OrganizeMenuItem
          description={notebookCountLabel}
          href={`/words/organize/notebooks?lang=${encodedLanguage}`}
          icon={<BookOpenText aria-hidden="true" className="h-5 w-5" />}
          label="노트 관리"
        />
        <OrganizeMenuItem
          description="단어 이동과 삭제를 관리"
          href={`/words/organize/words?lang=${encodedLanguage}`}
          icon={<ArrowLeftRight aria-hidden="true" className="h-5 w-5" />}
          label="단어 관리"
        />
      </div>
    </section>
  );
}

/**
 * 정리 메뉴의 단일 행 링크를 렌더링합니다.
 *
 * @param props - 링크 목적지, 아이콘, 라벨, 설명입니다.
 * @returns 정리 메뉴 리스트에 들어가는 한 행 링크를 렌더링합니다.
 */
function OrganizeMenuItem({
  description,
  href,
  icon,
  label,
}: {
  description: string;
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      className="grid min-h-[64px] grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 border-b border-brand-border px-6 py-2 last:border-b-0"
      href={href}
    >
      <span className="grid h-8 w-8 place-items-center text-brand-text">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-brand-text">
          {label}
        </span>
        <span className="mt-1 block truncate text-xs font-normal text-brand-muted">
          {description}
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="h-5 w-5 text-brand-muted-soft"
      />
    </Link>
  );
}
