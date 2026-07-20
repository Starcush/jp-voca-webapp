"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight, Languages, UserRound } from "lucide-react";

/**
 * 설정 홈에서 계정 관리와 언어 관리로 이동하는 메뉴 리스트를 렌더링합니다.
 *
 * @returns JUUIN 톤의 설정 메뉴 랜딩 UI를 렌더링합니다.
 */
export function SettingsMenu() {
  return (
    <section>
      <div className="-mx-4 border-y border-brand-border bg-white">
        <SettingsMenuItem
          description="로그아웃과 회원탈퇴 안내"
          href="/settings/account"
          icon={<UserRound aria-hidden="true" className="h-5 w-5" />}
          label="계정 관리"
        />
        <SettingsMenuItem
          description="사용 언어와 처음 열 언어 설정"
          href="/settings/language"
          icon={<Languages aria-hidden="true" className="h-5 w-5" />}
          label="언어 관리"
        />
      </div>
    </section>
  );
}

/**
 * 설정 메뉴 리스트에 들어가는 단일 행 링크를 렌더링합니다.
 *
 * @param props - 링크 목적지, 아이콘, 라벨, 설명입니다.
 * @returns 설정 메뉴의 한 행 링크를 렌더링합니다.
 */
function SettingsMenuItem({
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
