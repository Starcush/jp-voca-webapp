import { ChevronRight, X } from "lucide-react";
import type { StagedExpression } from "@/components/ocr/types";

type OcrPhotoQueueProps = {
  expressions: StagedExpression[];
  onNext: () => void;
  onRemove: (expressionId: string) => void;
};

/**
 * 사진 위에서 담은 표현을 간단한 목록으로 보여주고 다음 저장 단계로 이동시킵니다.
 *
 * @param props - 담은 표현 목록, 개별 제거 콜백, 다음 단계 이동 콜백입니다.
 * @returns 담은 표현 리스트와 찾기/저장 단계 이동 버튼을 렌더링합니다.
 */
export function OcrPhotoQueue({
  expressions,
  onNext,
  onRemove,
}: OcrPhotoQueueProps) {
  if (expressions.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-3 rounded-lg border border-brand-border bg-white p-4 shadow-sm">
      <div className="grid gap-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-black text-brand-text">
            담은 표현 {expressions.length}개
          </p>
          <button
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1 rounded-lg bg-primary px-3 text-xs font-black text-white sm:text-sm"
            onClick={onNext}
            type="button"
          >
            <span>찾기 & 저장하러 가기</span>
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </div>
        <p className="text-sm font-semibold text-brand-muted">
          더 고른 뒤 한 번에 읽기와 뜻을 찾을 수 있습니다.
        </p>
      </div>
      <ul className="grid gap-2">
        {expressions.map((expression) => (
          <li
            className="flex min-h-10 items-center justify-between gap-3 rounded-lg bg-brand-background px-3 py-2"
            key={expression.id}
          >
            <span className="min-w-0 truncate text-base font-normal leading-6 text-brand-text">
              {expression.term}
            </span>
            <button
              className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-black text-brand-muted transition-colors hover:bg-white hover:text-brand-text"
              onClick={() => onRemove(expression.id)}
              type="button"
            >
              <X aria-hidden className="size-3.5" />
              제거
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
