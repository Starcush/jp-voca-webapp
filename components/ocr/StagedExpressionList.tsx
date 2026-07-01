"use client";

import { MAX_STAGED_EXPRESSIONS, type StagedExpression } from "./types";

type LanguageOptionLabels = {
  readingLabel?: string;
  termLabel: string;
};

type StagedExpressionListProps = {
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

/**
 * OCR에서 선택한 표현들을 최종 저장 전까지 편집하는 목록 컴포넌트입니다.
 *
 * @param props - 추가 예정 표현 목록 UI에 필요한 속성입니다.
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
  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-base font-bold text-slate-950">
            추가 예정 {expressions.length} / {MAX_STAGED_EXPRESSIONS}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            문장을 이동해도 유지됩니다. 사진을 다시 선택하거나 텍스트를 다시 추출하면 초기화됩니다.
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            먼저 표현을 담아둔 뒤, 읽기와 뜻을 한 번에 찾을 수 있습니다.
          </p>
        </div>
        <div className="grid shrink-0 gap-2">
          <button
            className="rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isEnriching}
            onClick={onEnrich}
            type="button"
          >
            읽기와 뜻 찾기
          </button>
          <button
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600"
            onClick={onClear}
            type="button"
          >
            비우기
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {expressions.map((expression) => (
          <article
            className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
            key={expression.id}
          >
            <div className="grid gap-2">
              <label className="grid gap-1">
                <span className="text-xs font-bold text-slate-500">
                  {languageOption.termLabel}
                </span>
                <input
                  className="min-h-10 rounded-md border-slate-200 bg-white text-base"
                  onChange={(event) =>
                    onUpdate(expression.id, {
                      term: event.target.value,
                    })
                  }
                  value={expression.term}
                />
              </label>
              {languageOption.readingLabel ? (
                <label className="grid gap-1">
                  <span className="text-xs font-bold text-slate-500">
                    {languageOption.readingLabel}
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
                <span className="text-xs font-bold text-slate-500">뜻</span>
                <input
                  className="min-h-10 rounded-md border-slate-200 bg-white text-base"
                  onChange={(event) =>
                    onUpdate(expression.id, {
                      meaning: event.target.value,
                    })
                  }
                  placeholder="선택"
                  value={expression.meaning}
                />
              </label>
            </div>
            <label className="flex items-start gap-2 text-sm font-semibold leading-6 text-slate-600">
              <input
                checked={expression.useExample}
                className="mt-1 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
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
              className="justify-self-end text-sm font-bold text-red-600"
              onClick={() => onRemove(expression.id)}
              type="button"
            >
              제거
            </button>
          </article>
        ))}
      </div>

      <button
        className="min-h-12 rounded-lg bg-slate-950 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isSaving}
        onClick={onSave}
        type="button"
      >
        단어장에 저장
      </button>
    </section>
  );
}
