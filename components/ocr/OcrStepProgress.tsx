import {
  canUseOcrImportStep,
  ocrImportSteps,
  type OcrImportStep,
} from "@/components/ocr/ocr-import-steps";

type OcrStepProgressProps = {
  activeStep: OcrImportStep;
  canConfirmExpressions: boolean;
  canSelectExpressions: boolean;
  onStepChange: (step: OcrImportStep) => void;
  stagedExpressionCount: number;
};

/**
 * OCR 가져오기 단계 진행 상태를 화면 오른쪽 아래에 세로 인디케이터로 표시합니다.
 *
 * @param props - 현재 단계, 단계 이동 가능 여부, 단계 변경 콜백입니다.
 * @param props.activeStep - 현재 표시 중인 OCR 단계입니다.
 * @param props.canConfirmExpressions - 저장 전 확인 단계로 이동 가능한지 여부입니다.
 * @param props.canSelectExpressions - 문장 선택 단계로 이동 가능한지 여부입니다.
 * @param props.onStepChange - 단계 버튼을 눌렀을 때 호출되는 콜백입니다.
 * @param props.stagedExpressionCount - 저장 전 확인 단계의 추가 예정 표현 개수입니다.
 * @returns 모바일 화면 우측 하단에 고정되는 세로형 단계 진행 UI입니다.
 */
export function OcrStepProgress({
  activeStep,
  canConfirmExpressions,
  canSelectExpressions,
  onStepChange,
  stagedExpressionCount,
}: OcrStepProgressProps) {
  const activeIndex = ocrImportSteps.findIndex(
    (step) => step.value === activeStep,
  );

  return (
    <nav
      aria-label="OCR 가져오기 진행 상태"
      className="fixed bottom-24 right-4 z-30 rounded-full border border-brand-border/80 bg-white/90 px-2 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.14)] backdrop-blur md:bottom-8 md:right-8"
    >
      <ol className="grid gap-1">
        {ocrImportSteps.map((step, index) => {
          const isActive = activeStep === step.value;
          const isComplete = index < activeIndex;
          const isDisabled = !canUseOcrImportStep(step.value, {
            canConfirmExpressions,
            canSelectExpressions,
          });

          return (
            <li
              className="group relative grid justify-items-center gap-1"
              key={step.value}
            >
              {index > 0 ? (
                <span
                  className={`h-5 w-0.5 rounded-full transition-colors duration-300 ${
                    index <= activeIndex ? "bg-primary" : "bg-brand-border"
                  }`}
                />
              ) : null}
              <span className="pointer-events-none absolute right-10 top-1/2 z-10 -translate-y-1/2 whitespace-nowrap rounded-full bg-brand-text px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition-all duration-200 group-focus-within:translate-x-0 group-focus-within:opacity-100 group-hover:translate-x-0 group-hover:opacity-100">
                {index + 1}. {step.label}
                <span className="ml-1 text-white/70">{step.description}</span>
              </span>
              <button
                aria-current={isActive ? "step" : undefined}
                aria-disabled={isDisabled}
                aria-label={`${index + 1}단계 ${step.label}${
                  step.value === "confirm" && stagedExpressionCount > 0
                    ? `, 추가 예정 ${stagedExpressionCount}개`
                    : ""
                }`}
                className={`grid size-7 place-items-center rounded-full text-xs font-black transition-all duration-300 ${
                  isActive
                    ? "scale-110 bg-primary text-white shadow-sm"
                    : isComplete
                      ? "bg-primary/15 text-primary ring-1 ring-primary/20"
                      : `bg-brand-background text-brand-muted ring-1 ring-brand-border ${
                          isDisabled ? "opacity-45" : ""
                        }`
                }`}
                onClick={() => onStepChange(step.value)}
                type="button"
              >
                {index + 1}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
