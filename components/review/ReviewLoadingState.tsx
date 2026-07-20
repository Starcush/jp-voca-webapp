"use client";

type ReviewLoadingStateProps = {
  languageLabel: string;
};

/**
 * 복습 단어를 불러오는 동안 표시할 로딩 상태를 렌더링합니다.
 *
 * @param props - 로딩 화면에 필요한 언어 라벨입니다.
 * @param props.languageLabel - 현재 복습 언어의 표시 이름입니다.
 * @returns 복습 단어 로딩 상태 UI를 렌더링합니다.
 */
export function ReviewLoadingState({
  languageLabel,
}: ReviewLoadingStateProps) {
  return (
    <section className="flex flex-1 flex-col gap-6">
      <div className="flex flex-1 items-center justify-center">
        <div className="grid gap-3 rounded-xl border border-brand-border bg-white px-5 py-4 text-center shadow-[0_2px_10px_rgba(36,28,61,0.05)]">
          <div
            aria-hidden="true"
            className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-brand-border border-t-primary"
          />
          <p className="text-sm font-bold text-brand-muted">
            {languageLabel} 복습 단어를 불러오는 중
          </p>
        </div>
      </div>
    </section>
  );
}
