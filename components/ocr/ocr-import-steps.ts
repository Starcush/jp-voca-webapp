import type { OcrReadingDirection } from "@/types/ocr";

/**
 * OCR 가져오기 화면의 단계 값입니다.
 */
export type OcrImportStep = "extract" | "select" | "confirm";

/**
 * OCR 가져오기 단계 탭에 표시할 메타 정보입니다.
 *
 * @property description - 현재 단계 아래에 표시하는 짧은 설명입니다.
 * @property label - 단계 탭 버튼 라벨입니다.
 * @property value - 단계 식별 값입니다.
 */
export type OcrImportStepOption = {
  description: string;
  label: string;
  value: OcrImportStep;
};

/**
 * 일본어 OCR 읽기 방향 선택 옵션입니다.
 */
export const readingDirectionOptions: Array<{
  label: string;
  value: OcrReadingDirection;
}> = [
  { label: "기본", value: "auto" },
  { label: "가로쓰기", value: "horizontal" },
  { label: "세로쓰기 보정", value: "vertical-rl" },
];

/**
 * OCR 가져오기 화면의 단계 탭 목록입니다.
 */
export const ocrImportSteps: OcrImportStepOption[] = [
  {
    description: "사진/텍스트",
    label: "추출",
    value: "extract",
  },
  {
    description: "문장 확인",
    label: "문장",
    value: "select",
  },
  {
    description: "담은 표현",
    label: "표현",
    value: "confirm",
  },
];

/**
 * 현재 데이터 상태에서 사용자가 특정 OCR 단계로 이동할 수 있는지 판단합니다.
 *
 * @param step - 이동하려는 OCR 단계입니다.
 * @param input - 단계 이동 가능 여부를 판단할 상태입니다.
 * @param input.canConfirmExpressions - 저장 전 확인 단계로 갈 수 있는 표현이 있는지 여부입니다.
 * @param input.canSelectExpressions - 문장 선택 단계로 갈 수 있는 문장이 있는지 여부입니다.
 * @returns 해당 단계로 이동 가능하면 true를 반환합니다.
 */
export function canUseOcrImportStep(
  step: OcrImportStep,
  {
    canConfirmExpressions,
    canSelectExpressions,
  }: {
    canConfirmExpressions: boolean;
    canSelectExpressions: boolean;
  },
) {
  if (step === "select") {
    return canSelectExpressions;
  }

  if (step === "confirm") {
    return canConfirmExpressions;
  }

  return true;
}

/**
 * 현재 선택 단계가 데이터 상태상 불가능할 때 실제로 보여줄 안전한 단계를 계산합니다.
 *
 * @param input - 현재 단계와 단계 이동 가능 상태입니다.
 * @param input.activeStep - 사용자가 마지막으로 선택한 단계입니다.
 * @param input.canConfirmExpressions - 저장 전 확인 단계로 갈 수 있는 표현이 있는지 여부입니다.
 * @param input.canSelectExpressions - 문장 선택 단계로 갈 수 있는 문장이 있는지 여부입니다.
 * @returns 실제 화면에 렌더링할 OCR 단계입니다.
 */
export function getResolvedOcrImportStep({
  activeStep,
  canConfirmExpressions,
  canSelectExpressions,
}: {
  activeStep: OcrImportStep;
  canConfirmExpressions: boolean;
  canSelectExpressions: boolean;
}) {
  if (canUseOcrImportStep(activeStep, {
    canConfirmExpressions,
    canSelectExpressions,
  })) {
    return activeStep;
  }

  if (canSelectExpressions) {
    return "select";
  }

  return "extract";
}
