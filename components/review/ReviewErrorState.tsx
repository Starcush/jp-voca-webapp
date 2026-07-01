"use client";

import type { ReactNode } from "react";

type ReviewErrorStateProps = {
  errorMessage: string;
  modeTabs: ReactNode;
  onRetry: () => void;
};

/**
 * 복습 단어 조회 실패 상태를 렌더링합니다.
 *
 * @param props - 에러 화면에 필요한 메시지, 탭, 재시도 콜백입니다.
 * @param props.errorMessage - 사용자에게 보여줄 에러 메시지입니다.
 * @param props.modeTabs - 복습 모드 선택 탭입니다.
 * @param props.onRetry - 다시 불러오기 버튼을 눌렀을 때 호출되는 콜백입니다.
 * @returns 복습 에러 상태 UI를 렌더링합니다.
 */
export function ReviewErrorState({
  errorMessage,
  modeTabs,
  onRetry,
}: ReviewErrorStateProps) {
  return (
    <section className="grid gap-3 py-6">
      {modeTabs}
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {errorMessage}
      </p>
      <button
        className="min-h-12 rounded-lg border border-slate-200 bg-white text-base font-bold text-slate-700"
        onClick={onRetry}
        type="button"
      >
        다시 불러오기
      </button>
    </section>
  );
}
