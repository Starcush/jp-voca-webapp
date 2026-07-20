"use client";

type ReviewErrorStateProps = {
  errorMessage: string;
  onRetry: () => void;
};

/**
 * 복습 단어 조회 실패 상태를 렌더링합니다.
 *
 * @param props - 에러 화면에 필요한 메시지와 재시도 콜백입니다.
 * @param props.errorMessage - 사용자에게 보여줄 에러 메시지입니다.
 * @param props.onRetry - 다시 불러오기 버튼을 눌렀을 때 호출되는 콜백입니다.
 * @returns 복습 에러 상태 UI를 렌더링합니다.
 */
export function ReviewErrorState({
  errorMessage,
  onRetry,
}: ReviewErrorStateProps) {
  return (
    <section className="grid gap-3 py-6">
      <p className="rounded-lg border border-status-negative-border bg-status-negative-bg px-4 py-3 text-sm font-semibold text-status-negative">
        {errorMessage}
      </p>
      <button
        className="min-h-12 rounded-lg border border-brand-border bg-white text-base font-bold text-brand-text shadow-sm"
        onClick={onRetry}
        type="button"
      >
        다시 불러오기
      </button>
    </section>
  );
}
