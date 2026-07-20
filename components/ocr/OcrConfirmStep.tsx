import { StagedExpressionList } from "@/components/ocr/StagedExpressionList";
import type {
  EnrichmentProgress,
  OcrLanguageOptionLabels,
  StagedExpression,
} from "@/components/ocr/types";

type OcrConfirmStepProps = {
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
 * OCR 저장 전 확인 단계에서 추가 예정 표현 목록과 저장 액션을 렌더링합니다.
 *
 * @param props - 추가 예정 표현 목록, 자동 채우기/저장 상태, 수정 콜백입니다.
 * @returns 저장 전 확인 단계 UI를 렌더링합니다.
 */
export function OcrConfirmStep({
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
}: OcrConfirmStepProps) {
  return (
    <section className="grid gap-4">
      <button
        className="min-h-10 justify-self-start rounded-lg border border-brand-border bg-white px-3 text-sm font-bold text-brand-muted"
        onClick={onBack}
        type="button"
      >
        문장 선택으로 돌아가기
      </button>
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
  );
}
