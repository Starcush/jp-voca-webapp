"use client";

import { useState } from "react";
import {
  MAX_STAGED_EXPRESSIONS,
  type EnrichmentProgress,
  type OcrLanguageOptionLabels,
  type StagedExpression,
} from "./types";

type StagedExpressionListProps = {
  enrichmentProgress: EnrichmentProgress | null;
  expressions: StagedExpression[];
  isEnriching: boolean;
  isSaving: boolean;
  languageOption: OcrLanguageOptionLabels;
  onClear: () => void;
  onEnrich: () => void;
  onRemove: (expressionId: string) => void;
  onSave: () => void;
  onUpdate: (
    expressionId: string,
    input: Partial<
      Pick<StagedExpression, "meaning" | "reading" | "term" | "useExample">
    >,
  ) => void;
};

function getReadyExpressionCount(expressions: StagedExpression[]) {
  return expressions.filter((expression) => expression.term.trim()).length;
}

function hasIncompleteOptionalFields(
  expressions: StagedExpression[],
  hasReadingField: boolean,
) {
  return expressions.some(
    (expression) =>
      expression.term.trim() &&
      ((hasReadingField && !expression.reading.trim()) ||
        !expression.meaning.trim()),
  );
}

/**
 * OCR에서 선택한 표현들을 최종 저장 전까지 편집하는 목록 컴포넌트입니다.
 *
 * @param props - 추가 예정 표현 목록 UI에 필요한 속성입니다.
 * @param props.enrichmentProgress - 읽기와 뜻을 채우는 진행 상태입니다.
 * @param props.expressions - 사용자가 선택해 추가 예정 상태로 둔 표현 목록입니다.
 * @param props.isEnriching - 읽기와 뜻을 찾는 중인지 나타내는 값입니다.
 * @param props.isSaving - 단어장에 저장 중인지 나타내는 값입니다.
 * @param props.languageOption - 현재 언어에 맞는 단어/읽기 라벨입니다.
 * @param props.onClear - 추가 예정 목록을 비우는 콜백입니다.
 * @param props.onEnrich - 표현들의 읽기와 뜻을 한 번에 찾는 콜백입니다.
 * @param props.onRemove - 특정 표현을 목록에서 제거하는 콜백입니다.
 * @param props.onSave - 추가 예정 목록을 단어장에 저장하는 콜백입니다.
 * @param props.onUpdate - 특정 표현의 단어, 읽기, 뜻, 예문 사용 여부를 수정하는 콜백입니다.
 * @returns 표현별 편집 폼과 하단 고정 액션바를 렌더링합니다.
 */
export function StagedExpressionList({
  enrichmentProgress,
  expressions,
  isEnriching,
  isSaving,
  languageOption,
  onClear,
  onEnrich,
  onRemove,
  onSave,
  onUpdate,
}: StagedExpressionListProps) {
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const readyExpressionCount = getReadyExpressionCount(expressions);
  const incompleteExpressionCount = expressions.length - readyExpressionCount;
  const canSaveExpressions =
    expressions.length > 0 && incompleteExpressionCount === 0;
  const canEnrichExpressions = readyExpressionCount > 0;
  const needsIncompleteSaveConfirm = hasIncompleteOptionalFields(
    expressions,
    Boolean(languageOption.readingLabel),
  );

  function handleSaveClick() {
    if (!canSaveExpressions) {
      return;
    }

    if (needsIncompleteSaveConfirm) {
      setIsSaveConfirmOpen(true);
      return;
    }

    onSave();
  }

  function handleConfirmSave() {
    setIsSaveConfirmOpen(false);
    onSave();
  }

  return (
    <section className="grid gap-3 pb-20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-brand-text">
            추가 예정 {expressions.length} / {MAX_STAGED_EXPRESSIONS}
          </p>
          <p className="mt-1 text-xs font-bold text-primary-text">
            {incompleteExpressionCount > 0
              ? `필수 항목 확인 필요 ${incompleteExpressionCount}개`
              : `저장 준비 완료 ${readyExpressionCount}개`}
          </p>
          {enrichmentProgress ? (
            <p className="mt-1 text-xs font-bold text-primary-text">
              읽기와 뜻 채우는 중 {enrichmentProgress.completed} /{" "}
              {enrichmentProgress.total}개 완료
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2">
        {expressions.map((expression) => (
          <StagedExpressionCard
            expression={expression}
            key={expression.id}
            languageOption={languageOption}
            onRemove={onRemove}
            onUpdate={onUpdate}
          />
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+3.65rem)] z-20 w-full border-t border-brand-border bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(25,25,25,0.08)] backdrop-blur md:sticky md:inset-x-auto md:bottom-4 md:w-auto md:rounded-xl md:border">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="truncate text-xs font-bold text-brand-muted">
            추가 예정 {expressions.length}개
          </p>
          <p className="shrink-0 text-xs font-bold text-primary-text">
            저장 준비 {readyExpressionCount}개
          </p>
        </div>
        <div className="grid grid-cols-[1.2fr_1fr_auto] gap-2">
          <button
            className="min-h-11 rounded-lg border border-primary bg-white px-3 text-sm font-black text-primary disabled:cursor-not-allowed disabled:border-brand-muted-soft disabled:text-brand-muted-soft"
            disabled={isEnriching || !canEnrichExpressions}
            onClick={onEnrich}
            type="button"
          >
            {isEnriching ? "찾는 중" : "읽기·뜻 찾기"}
          </button>
          <button
            className="min-h-11 rounded-lg bg-primary px-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-brand-muted-soft"
            disabled={isSaving || !canSaveExpressions}
            onClick={handleSaveClick}
            type="button"
          >
            {isSaving ? "저장 중" : "저장"}
          </button>
          <button
            className="min-h-11 rounded-lg border border-brand-border bg-white px-3 text-sm font-bold text-brand-muted"
            onClick={onClear}
            type="button"
          >
            비우기
          </button>
        </div>
      </div>
      <IncompleteSaveConfirmDialog
        hasReadingField={Boolean(languageOption.readingLabel)}
        isSaving={isSaving}
        onCancel={() => setIsSaveConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        open={isSaveConfirmOpen}
      />
    </section>
  );
}

function StagedExpressionCard({
  expression,
  languageOption,
  onRemove,
  onUpdate,
}: {
  expression: StagedExpression;
  languageOption: OcrLanguageOptionLabels;
  onRemove: (expressionId: string) => void;
  onUpdate: (
    expressionId: string,
    input: Partial<
      Pick<StagedExpression, "meaning" | "reading" | "term" | "useExample">
    >,
  ) => void;
}) {
  const isTermMissing = expression.term.trim().length === 0;

  return (
    <article
      className={`grid gap-2 rounded-xl border bg-white p-3 shadow-[0_1px_3px_rgba(36,28,61,0.06)] ${
        isTermMissing ? "border-primary-border" : "border-brand-border"
      }`}
    >
      <div className="grid gap-2">
        <label className="grid gap-1">
          <span className="flex items-center gap-2 text-xs font-bold text-brand-muted">
            {languageOption.termLabel}
            <span className="rounded-full bg-primary-tint px-2 py-0.5 text-[11px] text-primary-text">
              필수
            </span>
          </span>
          <input
            aria-invalid={isTermMissing}
            className={`min-h-10 rounded-md bg-white text-base ${
              isTermMissing
                ? "border-primary-border text-brand-text focus:border-primary focus:ring-primary"
                : "border-brand-border"
            }`}
            onChange={(event) =>
              onUpdate(expression.id, {
                term: event.target.value,
              })
            }
            value={expression.term}
          />
          {isTermMissing ? (
            <span className="text-xs font-semibold text-primary-text">
              저장하려면 단어 또는 표현을 입력해주세요.
            </span>
          ) : null}
        </label>

        {languageOption.readingLabel ? (
          <label className="grid gap-1">
            <span className="flex items-center gap-2 text-xs font-bold text-brand-muted">
              {languageOption.readingLabel}
              <span className="rounded-full bg-brand-background px-2 py-0.5 text-[11px] text-brand-muted">
                선택
              </span>
            </span>
            <input
              className="min-h-10 rounded-md border-brand-border bg-white text-base"
              onChange={(event) =>
                onUpdate(expression.id, {
                  reading: event.target.value,
                })
              }
              value={expression.reading}
            />
          </label>
        ) : null}

        <label className="grid gap-1">
          <span className="flex items-center gap-2 text-xs font-bold text-brand-muted">
            뜻
            <span className="rounded-full bg-brand-background px-2 py-0.5 text-[11px] text-brand-muted">
              선택
            </span>
          </span>
          <input
            className="min-h-10 rounded-md border-brand-border bg-white text-base"
            onChange={(event) =>
              onUpdate(expression.id, {
                meaning: event.target.value,
              })
            }
            placeholder="비워두고 저장할 수 있습니다."
            value={expression.meaning}
          />
        </label>
      </div>

      <label className="flex items-start gap-2 text-sm font-semibold leading-6 text-brand-muted">
        <input
          checked={expression.useExample}
          className="mt-1 rounded border-brand-border-strong text-primary focus:ring-primary"
          onChange={(event) =>
            onUpdate(expression.id, {
              useExample: event.target.checked,
            })
          }
          type="checkbox"
        />
        <span>이 문장을 예문으로 사용</span>
      </label>
      {expression.useExample ? (
        <p className="rounded-md bg-brand-background px-3 py-2 text-sm leading-6 text-brand-muted">
          {expression.sourceSentence}
        </p>
      ) : null}
      <button
        className="justify-self-end rounded-md px-2 py-1 text-sm font-bold text-brand-muted"
        onClick={() => onRemove(expression.id)}
        type="button"
      >
        제거
      </button>
    </article>
  );
}

function IncompleteSaveConfirmDialog({
  hasReadingField,
  isSaving,
  onCancel,
  onConfirm,
  open,
}: {
  hasReadingField: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-5"
      role="dialog"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
        <div className="grid gap-2">
          <h2 className="text-lg font-black text-brand-text">
            그대로 저장할까요?
          </h2>
          <p className="text-sm font-medium leading-6 text-brand-muted">
            {hasReadingField
              ? "읽기나 뜻이 비어 있는 항목이 있습니다. 나중에 수정할 수 있으니 그대로 저장해도 괜찮습니다."
              : "뜻이 비어 있는 항목이 있습니다. 나중에 수정할 수 있으니 그대로 저장해도 괜찮습니다."}
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            className="min-h-11 rounded-lg border border-brand-border bg-white px-4 text-sm font-bold text-brand-text disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSaving}
            onClick={onCancel}
            type="button"
          >
            취소
          </button>
          <button
            className="min-h-11 rounded-lg bg-primary px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-brand-muted-soft"
            disabled={isSaving}
            onClick={onConfirm}
            type="button"
          >
            {isSaving ? "저장 중" : "그대로 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
