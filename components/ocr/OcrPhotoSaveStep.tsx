import { ChevronLeft } from "lucide-react";
import { StagedExpressionList } from "@/components/ocr/StagedExpressionList";
import type {
  EnrichmentProgress,
  OcrLanguageOptionLabels,
  StagedExpression,
} from "@/components/ocr/types";

type OcrPhotoSaveStepProps = {
  enrichmentProgress: EnrichmentProgress | null;
  expressions: StagedExpression[];
  isEnriching: boolean;
  isSaving: boolean;
  languageOption: OcrLanguageOptionLabels;
  onBack: () => void;
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
 * 사진 선택 테스트 플로우의 읽기/뜻 찾기와 저장 단계를 렌더링합니다.
 *
 * @param props - 추가 예정 표현 목록, 자동 보강/저장 상태, 수정/삭제/저장 콜백입니다.
 * @returns 이전 단계 버튼과 저장 전 확인 폼을 렌더링합니다.
 */
export function OcrPhotoSaveStep({
  enrichmentProgress,
  expressions,
  isEnriching,
  isSaving,
  languageOption,
  onBack,
  onClear,
  onEnrich,
  onRemove,
  onSave,
  onUpdate,
}: OcrPhotoSaveStepProps) {
  if (expressions.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-4">
      <button
        className="inline-flex min-h-10 items-center gap-1 justify-self-start rounded-lg border border-brand-border bg-white px-3 text-sm font-bold text-brand-muted"
        onClick={onBack}
        type="button"
      >
        <ChevronLeft aria-hidden className="size-4" />
        <span>표현 더 고르기</span>
      </button>

      <section className="grid gap-3 rounded-lg border border-brand-border bg-white p-4 shadow-sm">
        <div>
          <p className="text-base font-black text-brand-text">
            추가 예정 {expressions.length}개
          </p>
          <p className="mt-1 text-sm font-semibold text-brand-muted">
            읽기와 뜻을 찾은 뒤 저장할 수 있습니다.
          </p>
        </div>
        <StagedExpressionList
          expressions={expressions}
          enrichmentProgress={enrichmentProgress}
          isEnriching={isEnriching}
          isSaving={isSaving}
          languageOption={languageOption}
          onClear={onClear}
          onEnrich={onEnrich}
          onRemove={onRemove}
          onSave={onSave}
          onUpdate={onUpdate}
        />
      </section>
    </section>
  );
}
