"use client";

import {
  MAX_STAGED_EXPRESSIONS,
  type EnrichmentProgress,
  type StagedExpression,
} from "./types";

type LanguageOptionLabels = {
  readingLabel?: string;
  termLabel: string;
};

type StagedExpressionListProps = {
  enrichmentProgress: EnrichmentProgress | null;
  expressions: StagedExpression[];
  isEnriching: boolean;
  isSaving: boolean;
  languageOption: LanguageOptionLabels;
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
 * @returns 표현별 편집 폼과 읽기/뜻 찾기, 비우기, 단어장 저장 UI를 렌더링합니다.
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
  const readyExpressionCount = getReadyExpressionCount(expressions);
  const incompleteExpressionCount = expressions.length - readyExpressionCount;
  const canSaveExpressions =
    expressions.length > 0 && incompleteExpressionCount === 0;
  const canEnrichExpressions = readyExpressionCount > 0;

  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3">
        <div className="min-w-0">
          <p className="text-base font-bold text-slate-950">
            추가 예정 {expressions.length} / {MAX_STAGED_EXPRESSIONS}
          </p>
          <p
            className={`mt-1 text-sm font-bold ${
              incompleteExpressionCount > 0
                ? "text-status-negative"
                : "text-status-positive"
            }`}
          >
            {incompleteExpressionCount > 0
              ? `필수 항목 확인 필요 ${incompleteExpressionCount}개`
              : `저장 준비 완료 ${readyExpressionCount}개`}
          </p>
          {enrichmentProgress ? (
            <p className="mt-1 text-sm font-semibold text-primary-text">
              읽기와 뜻 채우는 중 {enrichmentProgress.completed} /{" "}
              {enrichmentProgress.total}개 완료
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <button
            className="min-h-10 rounded-md bg-primary px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isEnriching || !canEnrichExpressions}
            onClick={onEnrich}
            type="button"
          >
            읽기·뜻 채우기
          </button>
          <button
            className="min-h-10 rounded-md bg-status-positive px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving || !canSaveExpressions}
            onClick={onSave}
            type="button"
          >
            저장
          </button>
          <button
            className="min-h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600"
            onClick={onClear}
            type="button"
          >
            비우기
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {expressions.map((expression) => {
          const isTermMissing = expression.term.trim().length === 0;

          return (
            <article
              className={`grid gap-2 rounded-lg border bg-slate-50 p-3 ${
                isTermMissing ? "border-status-negative-border" : "border-slate-100"
              }`}
              key={expression.id}
            >
              <div className="grid gap-2">
                <label className="grid gap-1">
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    {languageOption.termLabel}
                    <span className="rounded-full bg-status-negative-bg px-2 py-0.5 text-[11px] text-status-negative">
                      필수
                    </span>
                  </span>
                  <input
                    aria-invalid={isTermMissing}
                    className={`min-h-10 rounded-md bg-white text-base ${
                      isTermMissing
                        ? "border-status-negative-border text-status-negative focus:border-status-negative focus:ring-status-negative"
                        : "border-slate-200"
                    }`}
                    onChange={(event) =>
                      onUpdate(expression.id, {
                        term: event.target.value,
                      })
                    }
                    value={expression.term}
                  />
                  {isTermMissing ? (
                    <span className="text-xs font-semibold text-status-negative">
                      저장하려면 단어 또는 표현을 입력해주세요.
                    </span>
                  ) : null}
                </label>
                {languageOption.readingLabel ? (
                  <label className="grid gap-1">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      {languageOption.readingLabel}
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600">
                        선택
                      </span>
                    </span>
                    <input
                      className="min-h-10 rounded-md border-slate-200 bg-white text-base"
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
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    뜻
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600">
                      선택
                    </span>
                  </span>
                  <input
                    className="min-h-10 rounded-md border-slate-200 bg-white text-base"
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
              <label className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-600">
                <input
                  checked={expression.useExample}
                  className="mt-1 rounded border-slate-300 text-primary focus:ring-primary"
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
                <p className="rounded-md bg-white px-3 py-2 text-sm leading-6 text-slate-500">
                  {expression.sourceSentence}
                </p>
              ) : null}
              <button
                className="justify-self-end rounded-md px-2 py-1 text-sm font-bold text-status-negative"
                onClick={() => onRemove(expression.id)}
                type="button"
              >
                제거
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
