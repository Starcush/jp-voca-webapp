import { ChevronLeft, ChevronRight } from "lucide-react";
import { SentenceSelector } from "@/components/ocr/SentenceSelector";
import type { StagedExpression } from "@/components/ocr/types";
import type { Language } from "@/types/language";

type OcrSelectStepProps = {
  canConfirmExpressions: boolean;
  language: Language;
  onAddExpression: (term: string, sourceSentence: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  onUpdateSentence: (index: number, sentence: string) => void;
  sentences: string[];
  stagedExpressions: StagedExpression[];
  stagedExpressionCount: number;
};

function StagedExpressionPreview({
  expressions,
}: {
  expressions: StagedExpression[];
}) {
  if (expressions.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-2 rounded-lg border border-brand-border bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black text-brand-text">추가 예정</p>
        <p className="text-xs font-bold text-brand-muted">
          {expressions.length}개
        </p>
      </div>
      <ul className="grid max-h-72 gap-1 overflow-y-auto pr-1">
        {expressions.map((expression) => (
          <li
            className="rounded-lg border border-brand-border/70 bg-brand-background/70 px-3 py-2"
            key={expression.id}
            title={expression.term}
          >
            <p className="truncate text-sm font-bold text-brand-text">
              {expression.term}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * OCR 문장 선택 단계에서 문장별 표현 선택 UI와 단계 이동 버튼을 렌더링합니다.
 *
 * @param props - 문장 목록, 선택 표현 추가 콜백, 이전/다음 단계 이동 상태입니다.
 * @returns 문장 선택 단계 UI를 렌더링합니다.
 */
export function OcrSelectStep({
  canConfirmExpressions,
  language,
  onAddExpression,
  onBack,
  onConfirm,
  onUpdateSentence,
  sentences,
  stagedExpressions,
  stagedExpressionCount,
}: OcrSelectStepProps) {
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-brand-border bg-white px-3 text-sm font-bold text-brand-muted"
          onClick={onBack}
          type="button"
        >
          <ChevronLeft aria-hidden className="size-4" />
          <span>사진/텍스트 수정</span>
        </button>
        <button
          className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-brand-muted-soft"
          disabled={!canConfirmExpressions}
          onClick={onConfirm}
          type="button"
        >
          <span>
            담은 표현 {stagedExpressionCount > 0 ? stagedExpressionCount : ""}
          </span>
          <ChevronRight aria-hidden className="size-4" />
        </button>
      </div>
      <SentenceSelector
        key={language}
        language={language}
        onAddExpression={onAddExpression}
        onUpdateSentence={onUpdateSentence}
        sentences={sentences}
      />
      <StagedExpressionPreview expressions={stagedExpressions} />
    </section>
  );
}
