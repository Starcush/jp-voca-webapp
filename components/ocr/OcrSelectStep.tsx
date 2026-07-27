import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { SentenceSelector } from "@/components/ocr/SentenceSelector";
import { readingDirectionOptions } from "@/components/ocr/ocr-import-steps";
import type { StagedExpression } from "@/components/ocr/types";
import type { Language } from "@/types/language";
import type { OcrReadingDirection } from "@/types/ocr";

type OcrSelectStepProps = {
  canConfirmExpressions: boolean;
  language: Language;
  mergeSeparator: string;
  onAddExpression: (term: string, sourceSentence: string) => void;
  onBack: () => void;
  onConfirm: () => void;
  onMergeSentenceWithPrevious: (index: number, separator: string) => void;
  onReextractText: (direction: OcrReadingDirection) => void;
  onRemoveSentence: (index: number) => void;
  onSplitSentenceByLines: (index: number) => void;
  onUpdateSentence: (index: number, sentence: string) => void;
  readingDirection: OcrReadingDirection;
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

function OcrRetryOptions({
  onReextractText,
  readingDirection,
}: {
  onReextractText: (direction: OcrReadingDirection) => void;
  readingDirection: OcrReadingDirection;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="rounded-lg border border-brand-border bg-white px-3 py-2 shadow-sm">
      <button
        aria-expanded={isOpen}
        className="flex min-h-9 w-full items-center justify-between gap-3 text-left text-sm font-bold text-brand-muted"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span>문장 추출이 이상한가요?</span>
        <ChevronDown
          aria-hidden
          className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen ? (
        <div className="grid gap-2 pb-1 pt-2">
          <p className="text-xs font-semibold leading-5 text-brand-muted">
            문장 순서가 어긋났다면 다른 방식으로 다시 추출해보세요. 현재 담은 표현은 초기화됩니다.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {readingDirectionOptions.map((option) => (
              <button
                aria-pressed={readingDirection === option.value}
                className={`min-h-9 rounded-lg border px-2 text-xs font-bold ${
                  readingDirection === option.value
                    ? "border-primary bg-primary/8 text-brand-text"
                    : "border-brand-border bg-white text-brand-muted"
                }`}
                key={option.value}
                onClick={() => onReextractText(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SentenceEditList({
  mergeSeparator,
  onMergeSentenceWithPrevious,
  onRemoveSentence,
  onSplitSentenceByLines,
  onUpdateSentence,
  sentences,
}: {
  mergeSeparator: string;
  onMergeSentenceWithPrevious: (index: number, separator: string) => void;
  onRemoveSentence: (index: number) => void;
  onSplitSentenceByLines: (index: number) => void;
  onUpdateSentence: (index: number, sentence: string) => void;
  sentences: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const validSentenceCount = sentences.filter(
    (sentence) => sentence.trim(),
  ).length;

  return (
    <section className="grid gap-3 rounded-lg border border-brand-border bg-white p-3 shadow-sm">
      <button
        aria-expanded={isOpen}
        className="flex min-h-10 items-center justify-between gap-3 text-left"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span className="min-w-0">
          <span className="block text-sm font-black text-brand-text">
            추출 문장 수정
          </span>
          {isOpen ? (
            <span className="mt-1 block text-sm leading-5 text-brand-muted">
              잘못 나뉜 문장은 합치고, 불필요한 줄은 삭제하세요.
            </span>
          ) : null}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-brand-muted">
          {validSentenceCount}개
          <ChevronDown
            aria-hidden
            className={`size-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {isOpen ? (
        <ol className="grid max-h-96 gap-2 overflow-y-auto pr-1">
          {sentences.map((sentence, index) => {
            const canSplitByLines = sentence
              .split(/\n+/)
              .some((part) => part.trim());

            return (
              <li
                className="grid gap-2 rounded-lg border border-brand-border bg-brand-background/70 p-3"
                key={`sentence-${index}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black text-brand-muted">
                    문장 {index + 1}
                  </p>
                  <div className="flex flex-wrap justify-end gap-1">
                    {index > 0 ? (
                      <button
                        className="min-h-8 rounded-md border border-brand-border bg-white px-2 text-xs font-bold text-brand-muted"
                        onClick={() =>
                          onMergeSentenceWithPrevious(index, mergeSeparator)
                        }
                        type="button"
                      >
                        위와 합치기
                      </button>
                    ) : null}
                    {sentence.includes("\n") && canSplitByLines ? (
                      <button
                        className="min-h-8 rounded-md border border-brand-border bg-white px-2 text-xs font-bold text-brand-muted"
                        onClick={() => onSplitSentenceByLines(index)}
                        type="button"
                      >
                        줄바꿈으로 나누기
                      </button>
                    ) : null}
                    <button
                      className="min-h-8 rounded-md px-2 text-xs font-bold text-status-negative"
                      onClick={() => onRemoveSentence(index)}
                      type="button"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                <textarea
                  className="min-h-16 resize-y rounded-lg border-brand-border bg-white text-base leading-7 text-brand-text"
                  onChange={(event) =>
                    onUpdateSentence(index, event.target.value)
                  }
                  value={sentence}
                />
              </li>
            );
          })}
        </ol>
      ) : null}
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
  mergeSeparator,
  onAddExpression,
  onBack,
  onConfirm,
  onMergeSentenceWithPrevious,
  onReextractText,
  onRemoveSentence,
  onSplitSentenceByLines,
  onUpdateSentence,
  readingDirection,
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
      <OcrRetryOptions
        onReextractText={onReextractText}
        readingDirection={readingDirection}
      />
      <SentenceEditList
        mergeSeparator={mergeSeparator}
        onMergeSentenceWithPrevious={onMergeSentenceWithPrevious}
        onRemoveSentence={onRemoveSentence}
        onSplitSentenceByLines={onSplitSentenceByLines}
        onUpdateSentence={onUpdateSentence}
        sentences={sentences}
      />
      <SentenceSelector
        key={language}
        onAddExpression={onAddExpression}
        sentences={sentences}
      />
      <StagedExpressionPreview expressions={stagedExpressions} />
    </section>
  );
}
