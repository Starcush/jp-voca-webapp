"use client";

import type { ReactNode } from "react";

type ReviewLoadingStateProps = {
  languageLabel: string;
  modeTabs: ReactNode;
};

/**
 * 복습 단어를 불러오는 동안 표시할 로딩 상태를 렌더링합니다.
 *
 * @param props - 로딩 화면에 필요한 언어 라벨과 모드 탭입니다.
 * @param props.languageLabel - 현재 복습 언어의 표시 이름입니다.
 * @param props.modeTabs - 복습 모드 선택 탭입니다.
 * @returns 복습 단어 로딩 상태 UI를 렌더링합니다.
 */
export function ReviewLoadingState({
  languageLabel,
  modeTabs,
}: ReviewLoadingStateProps) {
  return (
    <section className="flex flex-1 flex-col gap-6">
      {modeTabs}
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm font-semibold text-slate-500">
          {languageLabel} 복습 단어를 불러오는 중
        </p>
      </div>
    </section>
  );
}
