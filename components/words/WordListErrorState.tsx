"use client";

type WordListErrorStateProps = {
  errorMessage: string;
  onRetry: () => void;
};

/**
 * 단어 목록 조회 또는 학습 상태 저장에서 발생한 에러를 표시합니다.
 *
 * @param props - 에러 메시지와 재시도 콜백입니다.
 * @returns 에러 메시지와 다시 불러오기 버튼을 렌더링합니다.
 */
export function WordListErrorState({
  errorMessage,
  onRetry,
}: WordListErrorStateProps) {
  return (
    <section className="grid gap-3 py-4">
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
